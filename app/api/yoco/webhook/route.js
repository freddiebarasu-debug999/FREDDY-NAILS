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
  // Reject old webhook requests to reduce replay attacks.
  const timestamp = Number(webhookTimestamp);
  const currentTime = Math.floor(Date.now() / 1000);
  if (
    !Number.isInteger(timestamp) ||
    Math.abs(currentTime - timestamp) > 180
  ) {
    console.error("Yoco webhook timestamp is too old or invalid.");
    return false;
  }
  // Yoco signs: webhook-id.webhook-timestamp.rawBody
  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  // Remove the whsec_ prefix and Base64-decode the secret.
  const secretBytes = Buffer.from(
    secret.split("_")[1],
    "base64"
  );
  // Generate the expected HMAC-SHA256 signature.
  const expectedSignature = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");
  // Yoco can send multiple signatures separated by spaces.
  const providedSignatures = webhookSignature
    .split(" ")
    .map((item) => item.split(",")[1])
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

function formatBookingDate(dateStr) {
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString("en-ZA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${m} ${suffix}`;
}

async function sendOwnerNotification(appointment) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set; skipping owner notification email.");
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1B1714;">
      <h2 style="color: #AD8A4E; margin-bottom: 4px;">New paid booking 💅</h2>
      <p style="margin-top: 0; color: #555;">A deposit has been confirmed on Freddy Nails.</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <tr><td style="padding: 6px 0; color: #888;">Client</td><td style="padding: 6px 0; font-weight: bold;">${appointment.customer_name}</td></tr>
        <tr><td style="padding: 6px 0; color: #888;">Phone</td><td style="padding: 6px 0;">${appointment.customer_phone}</td></tr>
        <tr><td style="padding: 6px 0; color: #888;">Service</td><td style="padding: 6px 0;">${appointment.service_name}</td></tr>
        <tr><td style="padding: 6px 0; color: #888;">Clients</td><td style="padding: 6px 0;">${appointment.client_count}</td></tr>
        <tr><td style="padding: 6px 0; color: #888;">Date</td><td style="padding: 6px 0;">${formatBookingDate(appointment.booking_date)}</td></tr>
        <tr><td style="padding: 6px 0; color: #888;">Time</td><td style="padding: 6px 0;">${formatTime(appointment.start_time)}</td></tr>
        <tr><td style="padding: 6px 0; color: #888;">Deposit paid</td><td style="padding: 6px 0; font-weight: bold;">R${appointment.deposit_amount}</td></tr>
        ${appointment.notes ? `<tr><td style="padding: 6px 0; color: #888;">Notes</td><td style="padding: 6px 0;">${appointment.notes}</td></tr>` : ""}
      </table>
      <p style="margin-top: 20px; font-size: 13px; color: #999;">Freddy Nails booking system</p>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Freddy Nails <onboarding@resend.dev>",
        to: ["freddiebarasu@gmail.com"],
        subject: `New paid booking — ${appointment.customer_name} (${formatBookingDate(appointment.booking_date)})`,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend owner notification failed:", res.status, errText);
    } else {
      console.log("Owner notification email sent.");
    }
  } catch (err) {
    console.error("Error sending owner notification email:", err);
  }
}

export async function POST(request) {
  try {
    // IMPORTANT:
    // Read the raw body before parsing JSON.
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
    // We only need successful payments for now.
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
    // Find the appointment created before the customer
    // was redirected to Yoco.
    const { data: appointment, error: findError } =
      await supabase
        .from("appointments")
        .select(
          "id, customer_name, customer_phone, service_name, client_count, booking_date, start_time, notes, deposit_amount, payment_status, booking_status"
        )
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
    // Verify that the amount Yoco says was paid matches
    // the deposit we expected.
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
    // Confirm the appointment.
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
    console.log(
      "Appointment confirmed after successful Yoco payment:",
      appointment.id
    );

    // Notify the business owner by email. This runs after the
    // booking is already confirmed, so a failure here never
    // blocks or reverses the confirmation itself.
    await sendOwnerNotification(appointment);

    return Response.json({ received: true });
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
