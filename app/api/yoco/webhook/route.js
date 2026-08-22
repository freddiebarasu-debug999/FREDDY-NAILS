import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createGoogleCalendarEvent } from "@/lib/google-calendar";

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

  const timestamp = Number(webhookTimestamp);
  const currentTime = Math.floor(Date.now() / 1000);

  if (
    !Number.isInteger(timestamp) ||
    Math.abs(currentTime - timestamp) > 180
  ) {
    console.error(
      "Yoco webhook timestamp is too old or invalid."
    );
    return false;
  }

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;

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

function sanitizeForLogs(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeForLogs);
  }

  if (typeof value === "object") {
    const result = {};

    for (const [key, val] of Object.entries(value)) {
      const lowerKey = key.toLowerCase();

      if (
        lowerKey.includes("secret") ||
        lowerKey.includes("signature") ||
        lowerKey.includes("token") ||
        lowerKey.includes("authorization") ||
        lowerKey.includes("card") ||
        lowerKey.includes("cvv") ||
        lowerKey.includes("cvc") ||
        lowerKey.includes("password")
      ) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = sanitizeForLogs(val);
      }
    }

    return result;
  }

  return value;
}

const EMAIL_FROM =
  "Freddy Nails <bookings@freddynails.co.za>";

async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error(
      "RESEND_API_KEY is not set; skipping email send."
    );
    return;
  }

  try {
    const res = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: [to],
          subject,
          html,
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();

      console.error(
        "Resend send failed:",
        to,
        res.status,
        errText
      );
    } else {
      console.log("Email sent to", to);
    }
  } catch (err) {
    console.error(
      "Error sending email to",
      to,
      err
    );
  }
}

async function sendOwnerNotification(appointment) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1B1714;">
      <h2 style="color: #AD8A4E; margin-bottom: 4px;">New paid booking 💅</h2>
      <p style="margin-top: 0; color: #555;">A deposit has been confirmed on Freddy Nails.</p>

      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <tr><td style="padding: 6px 0; color: #888;">Client</td><td style="padding: 6px 0; font-weight: bold;">${appointment.customer_name}</td></tr>
        <tr><td style="padding: 6px 0; color: #888;">Phone</td><td style="padding: 6px 0;">${appointment.customer_phone}</td></tr>
        <tr><td style="padding: 6px 0; color: #888;">Email</td><td style="padding: 6px 0;">${appointment.customer_email || "—"}</td></tr>
        <tr><td style="padding: 6px 0; color: #888;">Booking summary</td><td style="padding: 6px 0;">${appointment.service_name}</td></tr>
        <tr><td style="padding: 6px 0; color: #888;">Clients</td><td style="padding: 6px 0;">${appointment.client_count}</td></tr>
        <tr><td style="padding: 6px 0; color: #888;">Deposit paid</td><td style="padding: 6px 0; font-weight: bold;">R${appointment.deposit_amount}</td></tr>
        ${
          appointment.notes
            ? `<tr><td style="padding: 6px 0; color: #888;">Notes</td><td style="padding: 6px 0;">${appointment.notes}</td></tr>`
            : ""
        }
      </table>

      <p style="margin-top: 20px; font-size: 13px; color: #999;">
        Freddy Nails booking system
      </p>
    </div>
  `;

  await sendEmail({
    to: "freddiebarasu@gmail.com",
    subject: `New paid booking — ${appointment.customer_name}`,
    html,
  });
}

async function sendCustomerConfirmation(appointment) {
  if (!appointment.customer_email) {
    console.log(
      "No customer email on file; skipping customer confirmation."
    );
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1B1714;">
      <h2 style="color: #AD8A4E; margin-bottom: 4px;">You're booked! 💅</h2>

      <p style="margin-top: 0; color: #555;">
        Hi ${appointment.customer_name}, your deposit has been received and your appointment with Freddy Nails is confirmed.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <tr><td style="padding: 6px 0; color: #888;">Booking summary</td><td style="padding: 6px 0; font-weight: bold;">${appointment.service_name}</td></tr>
        <tr><td style="padding: 6px 0; color: #888;">Clients</td><td style="padding: 6px 0;">${appointment.client_count}</td></tr>
        <tr><td style="padding: 6px 0; color: #888;">Deposit paid</td><td style="padding: 6px 0; font-weight: bold;">R${appointment.deposit_amount}</td></tr>
        ${
          appointment.notes
            ? `<tr><td style="padding: 6px 0; color: #888;">Your notes</td><td style="padding: 6px 0;">${appointment.notes}</td></tr>`
            : ""
        }
      </table>

      <p style="margin-top: 20px; color: #555;">
        Address: 8 Rhodes, Quigney, East London, Eastern Cape<br/>
        WhatsApp:
        <a href="https://wa.me/27710888897" style="color: #AD8A4E;">
          +27 71 088 8897
        </a>
      </p>

      <p style="margin-top: 20px; font-size: 13px; color: #999;">
        Please arrive a few minutes early. If you need to reschedule, message us on WhatsApp at least 24 hours ahead.
      </p>

      <p style="margin-top: 16px; font-size: 13px; color: #999;">
        Freddy Nails · @nailsby_freddy
      </p>
    </div>
  `;

  await sendEmail({
    to: appointment.customer_email,
    subject: "Booking confirmed — Freddy Nails",
    html,
  });
}

export async function POST(request) {
  try {
    const rawBody = await request.text();

    const isValid = verifySignature(
      rawBody,
      request.headers
    );

    if (!isValid) {
      console.error(
        "Invalid Yoco webhook signature."
      );

      return Response.json(
        { error: "Invalid webhook signature." },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);

    console.log("========================================");
    console.log(
      "VERIFIED YOCO WEBHOOK RECEIVED"
    );
    console.log("Event type:", event?.type);
    console.log(
      "Safe event structure:",
      JSON.stringify(
        sanitizeForLogs(event),
        null,
        2
      )
    );
    console.log("========================================");

    if (event.type !== "payment.succeeded") {
      return Response.json({
        received: true,
      });
    }

    const payment = event.payload;
    const checkoutId =
      payment?.metadata?.checkoutId;

    if (!checkoutId) {
      console.error(
        "Yoco payment has no checkoutId."
      );

      return Response.json(
        { error: "Missing checkout ID." },
        { status: 400 }
      );
    }

    const {
      data: appointment,
      error: findError,
    } = await supabase
      .from("appointments")
      .select(
        `
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
          notes,
          deposit_amount,
          payment_status,
          booking_status,
          google_event_id
        `
      )
      .eq(
        "yoco_checkout_id",
        checkoutId
      )
      .maybeSingle();

    if (findError) {
      console.error(
        "Supabase lookup error:",
        findError
      );

      return Response.json(
        {
          error:
            "Unable to find appointment.",
        },
        { status: 500 }
      );
    }

    if (!appointment) {
      console.error(
        "No appointment found for Yoco checkout:",
        checkoutId
      );

      return Response.json(
        {
          error:
            "Appointment not found.",
        },
        { status: 404 }
      );
    }

    const paidAmount =
      Number(payment.amount);

    const expectedAmount =
      Number(appointment.deposit_amount) *
      100;

    if (paidAmount !== expectedAmount) {
      console.error(
        "Yoco payment amount mismatch.",
        {
          appointmentId:
            appointment.id,
          expectedAmount,
          paidAmount,
        }
      );

      return Response.json(
        {
          error:
            "Payment amount mismatch.",
        },
        { status: 400 }
      );
    }

    const {
      error: updateError,
    } = await supabase
      .from("appointments")
      .update({
        payment_status: "paid",
        booking_status: "confirmed",
        yoco_payment_id: payment.id,
      })
      .eq(
        "id",
        appointment.id
      );

    if (updateError) {
      console.error(
        "Supabase payment update error:",
        updateError
      );

      return Response.json(
        {
          error:
            "Unable to confirm appointment.",
        },
        { status: 500 }
      );
    }

    const {
      error: clientsUpdateError,
    } = await supabase
      .from("appointment_clients")
      .update({
        booking_status:
          "confirmed",
      })
      .eq(
        "appointment_id",
        appointment.id
      );

    if (clientsUpdateError) {
      console.error(
        "Supabase client appointments update error:",
        clientsUpdateError
      );
    }

    console.log(
      "Appointment confirmed after successful Yoco payment:",
      appointment.id
    );

    // ---------------------------------------------------------
    // GOOGLE CALENDAR
    // ---------------------------------------------------------
    //
    // Calendar failure must never undo a successful payment.
    // The booking remains confirmed even if Google is temporarily
    // unavailable.
    //
    try {
      const calendarResult =
        await createGoogleCalendarEvent(
          {
            ...appointment,
            payment_status: "paid",
            booking_status: "confirmed",
          }
        );

      console.log(
        "Google Calendar result:",
        calendarResult
      );
    } catch (calendarError) {
      console.error(
        "Google Calendar creation failed:",
        calendarError
      );
    }

    // ---------------------------------------------------------
    // EMAIL NOTIFICATIONS
    // ---------------------------------------------------------

    await sendOwnerNotification(
      appointment
    );

    await sendCustomerConfirmation(
      appointment
    );

    return Response.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Yoco webhook processing error:",
      error
    );

    return Response.json(
      {
        error:
          "Webhook processing failed.",
      },
      { status: 500 }
    );
  }
}
