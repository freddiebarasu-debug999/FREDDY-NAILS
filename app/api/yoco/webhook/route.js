import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_EMAIL = "Freddy Nails <bookings@freddynails.co.za>";
const OWNER_EMAIL = "freddiebarasu@gmail.com";
const REPLY_TO_EMAIL = "freddiebarasu@gmail.com";
function verifySignature(rawBody, headers) {
  const webhookId = headers.get("webhook-id");
  const webhookTimestamp = headers.get("webhook-timestamp");
  const webhookSignature = headers.get("webhook-signature");
  const secret = process.env.YOCO_WEBHOOK_SECRET;
  if (
    !webhookId ||
    !webhookTimestamp ||
    !webhookSignature ||
    !secret
  ) {
    return false;
  }
  const timestamp = Number(webhookTimestamp);
  const currentTime = Math.floor(Date.now() / 1000);
  if (
    !Number.isInteger(timestamp) ||
    Math.abs(currentTime - timestamp) > 180
  ) {
    console.error("Yoco webhook timestamp is too old or invalid.");
    return false;
  }
  const signedContent =
    `${webhookId}.${webhookTimestamp}.${rawBody}`;
  // Remove the "whsec_" prefix and Base64-decode the secret.
  const secretValue = secret.startsWith("whsec_")
    ? secret.slice(6)
    : secret;
  const secretBytes = Buffer.from(secretValue, "base64");
  const expectedSignature = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");
  const providedSignatures = webhookSignature
    .split(" ")
    .map((value) => {
      const parts = value.split(",");
      return parts.length > 1 ? parts[1] : null;
    })
    .filter(Boolean);
  return providedSignatures.some((signature) => {
    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(signature);
    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(
      expectedBuffer,
      receivedBuffer
    );
  });
}
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function formatTime(timeString) {
  if (!timeString) return "";
  const [hours, minutes] = String(timeString)
    .slice(0, 5)
    .split(":")
    .map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString("en-ZA", {
    hour: "numeric",
    minute: "2-digit",
  });
}
async function sendEmail({
  to,
  subject,
  html,
  idempotencyKey,
}) {
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      reply_to: REPLY_TO_EMAIL,
      subject,
      html,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    console.error("Resend email error:", data);
    throw new Error(
      data?.message ||
        data?.error ||
        "Unable to send email."
    );
  }
  return data;
}
export async function POST(request) {
  try {
    const rawBody = await request.text();
    const isValid = verifySignature(
      rawBody,
      request.headers
    );
    if (!isValid) {
      console.error("Invalid Yoco webhook signature.");
      return Response.json(
        { error: "Invalid webhook signature." },
        { status: 401 }
      );
    }
    const event = JSON.parse(rawBody);
    console.log("Verified Yoco webhook:", event.type);
    if (event.type !== "payment.succeeded") {
      return Response.json({ received: true });
    }
    const payment = event.payload;
    const checkoutId = payment?.metadata?.checkoutId;
    if (!checkoutId) {
      console.error("Yoco payment has no checkoutId.");
      return Response.json(
        { error: "Missing checkout ID." },
        { status: 400 }
      );
    }
    const { data: appointment, error: findError } =
      await supabase
        .from("appointments")
        .select(`
          id,
          customer_name,
          customer_phone,
          customer_email,
          service_name,
          client_count,
          booking_date,
          start_time,
          end_time,
          duration_minutes,
          deposit_amount,
          payment_status,
          booking_status,
          notes,
          customer_email_sent_at,
          owner_email_sent_at
        `)
        .eq("yoco_checkout_id", checkoutId)
        .maybeSingle();
    if (findError) {
      console.error("Supabase lookup error:", findError);
      return Response.json(
        { error: "Unable to find appointment." },
        { status: 500 }
      );
    }
    if (!appointment) {
      console.error(
        "No appointment found for Yoco checkout:",
        checkoutId
      );
      return Response.json(
        { error: "Appointment not found." },
        { status: 404 }
      );
    }
    const paidAmount = Number(payment.amount);
    const expectedAmount =
      Number(appointment.deposit_amount) * 100;
    if (paidAmount !== expectedAmount) {
      console.error("Yoco payment amount mismatch.", {
        appointmentId: appointment.id,
        expectedAmount,
        paidAmount,
      });
      return Response.json(
        { error: "Payment amount mismatch." },
        { status: 400 }
      );
    }
    // Confirm the appointment if it has not already been confirmed.
    if (
      appointment.payment_status !== "paid" ||
      appointment.booking_status !== "confirmed"
    ) {
      const { error: updateError } = await supabase
        .from("appointments")
        .update({
          payment_status: "paid",
          booking_status: "confirmed",
          yoco_payment_id: payment.id,
        })
        .eq("id", appointment.id);
      if (updateError) {
        console.error(
          "Supabase payment update error:",
          updateError
        );
        return Response.json(
          { error: "Unable to confirm appointment." },
          { status: 500 }
        );
      }
    }
    console.log(
      "Appointment confirmed:",
      appointment.id
    );
    const formattedDate = formatDate(
      appointment.booking_date
    );
    const formattedStartTime = formatTime(
      appointment.start_time
    );
    const formattedEndTime = formatTime(
      appointment.end_time
    );
    const safeName = escapeHtml(
      appointment.customer_name
    );
    const safeService = escapeHtml(
      appointment.service_name
    );
    const safeDate = escapeHtml(formattedDate);
    const safeStartTime = escapeHtml(formattedStartTime);
    const safeEndTime = escapeHtml(formattedEndTime);
    const safeNotes = escapeHtml(
      appointment.notes || "No additional notes."
    );
    // --------------------------------------------------
    // CUSTOMER CONFIRMATION EMAIL
    // --------------------------------------------------
    if (
      appointment.customer_email &&
      !appointment.customer_email_sent_at
    ) {
      try {
        await sendEmail({
          to: appointment.customer_email,
          subject:
            "Freddy Nails — Your appointment is confirmed 💅",
          idempotencyKey:
            `booking-confirmation-customer/${appointment.id}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #1d1a17; line-height: 1.6;">
              <h1 style="font-family: Georgia, serif; font-weight: 500;">
                Your appointment is confirmed
              </h1>
              <p>Hi ${safeName},</p>
              <p>
                Thank you for booking with Freddy Nails Studio.
                Your deposit has been received and your appointment
                is confirmed.
              </p>
              <div style="background: #f5efe8; padding: 20px; margin: 24px 0;">
                <p><strong>Service:</strong> ${safeService}</p>
                <p><strong>Clients:</strong> ${appointment.client_count}</p>
                <p><strong>Date:</strong> ${safeDate}</p>
                <p><strong>Time:</strong> ${safeStartTime} – ${safeEndTime}</p>
                <p><strong>Deposit paid:</strong> R${appointment.deposit_amount}</p>
              </div>
              ${
                appointment.notes
                  ? `
                    <p>
                      <strong>Your notes:</strong><br />
                      ${safeNotes}
                    </p>
                  `
                  : ""
              }
              <p>
                We look forward to seeing you at Freddy Nails Studio. 💅
              </p>
              <p>
                If you need to contact us about your appointment,
                simply reply to this email.
              </p>
              <p>
                Love,<br />
                <strong>Freddy Nails Studio</strong>
              </p>
            </div>
          `,
        });
        await supabase
          .from("appointments")
          .update({
            customer_email_sent_at: new Date().toISOString(),
          })
          .eq("id", appointment.id);
        console.log(
          "Customer confirmation email sent:",
          appointment.id
        );
      } catch (emailError) {
        console.error(
          "Customer confirmation email failed:",
          emailError
        );
        // Keep the timestamp empty so the email can be retried
        // if Yoco sends the webhook again.
      }
    }
    // --------------------------------------------------
    // OWNER NOTIFICATION EMAIL
    // --------------------------------------------------
    if (!appointment.owner_email_sent_at) {
      try {
        await sendEmail({
          to: OWNER_EMAIL,
          subject:
            `New paid booking — ${appointment.customer_name}`,
          idempotencyKey:
            `booking-confirmation-owner/${appointment.id}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #1d1a17; line-height: 1.6;">
              <h1 style="font-family: Georgia, serif; font-weight: 500;">
                New paid booking
              </h1>
              <p>
                A new Freddy Nails appointment has been paid and confirmed.
              </p>
              <div style="background: #f5efe8; padding: 20px; margin: 24px 0;">
                <p><strong>Customer:</strong> ${safeName}</p>
                <p><strong>Phone:</strong> ${escapeHtml(appointment.customer_phone)}</p>
                <p><strong>Email:</strong> ${escapeHtml(appointment.customer_email || "Not provided")}</p>
                <p><strong>Service:</strong> ${safeService}</p>
                <p><strong>Clients:</strong> ${appointment.client_count}</p>
                <p><strong>Date:</strong> ${safeDate}</p>
                <p><strong>Time:</strong> ${safeStartTime} – ${safeEndTime}</p>
                <p><strong>Deposit paid:</strong> R${appointment.deposit_amount}</p>
              </div>
              <p>
                <strong>Customer notes:</strong><br />
                ${safeNotes}
              </p>
              <p>
                Booking ID: ${escapeHtml(appointment.id)}
              </p>
            </div>
          `,
        });
        await supabase
          .from("appointments")
          .update({
            owner_email_sent_at: new Date().toISOString(),
          })
          .eq("id", appointment.id);
        console.log(
          "Owner notification email sent:",
          appointment.id
        );
      } catch (emailError) {
        console.error(
          "Owner notification email failed:",
          emailError
        );
      }
    }
    return Response.json({
      received: true,
      appointmentId: appointment.id,
      paymentStatus: "paid",
      bookingStatus: "confirmed",
    });
  } catch (error) {
    console.error(
      "Yoco webhook processing error:",
      error
    );
    return Response.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
