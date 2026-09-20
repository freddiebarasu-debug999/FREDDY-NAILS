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

// ---------------------------------------------------------
// GOOGLE CALENDAR DATE HELPER
// ---------------------------------------------------------

function toGoogleCalDate(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;

  const d = new Date(
    `${dateStr}T${timeStr}:00+02:00`
  );

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return (
    d.toISOString()
      .replace(/[-:]/g, "")
      .split(".")[0] + "Z"
  );
}

// ---------------------------------------------------------
// FORMAT DATE / TIME HELPERS
// ---------------------------------------------------------

function formatBookingDate(dateStr) {
  if (!dateStr) return "—";

  const date = new Date(`${dateStr}T00:00:00+02:00`);

  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  return date.toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  });
}

function formatTime(timeStr) {
  if (!timeStr) return "—";

  const [hours, minutes] = timeStr
    .split(":")
    .map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return timeStr;
  }

  const d = new Date();

  d.setHours(hours, minutes, 0, 0);

  return d.toLocaleTimeString("en-ZA", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ---------------------------------------------------------
// YOCO WEBHOOK SIGNATURE VERIFICATION
// ---------------------------------------------------------

function verifySignature(rawBody, headers) {
  const webhookId =
    headers.get("webhook-id");

  const webhookTimestamp =
    headers.get("webhook-timestamp");

  const webhookSignature =
    headers.get("webhook-signature");

  const secret =
    process.env.YOCO_WEBHOOK_SECRET;

  if (
    !webhookId ||
    !webhookTimestamp ||
    !webhookSignature ||
    !secret
  ) {
    return false;
  }

  const timestamp =
    Number(webhookTimestamp);

  const currentTime =
    Math.floor(Date.now() / 1000);

  if (
    !Number.isInteger(timestamp) ||
    Math.abs(currentTime - timestamp) > 180
  ) {
    console.error(
      "Yoco webhook timestamp is too old or invalid."
    );

    return false;
  }

  const signedContent =
    `${webhookId}.${webhookTimestamp}.${rawBody}`;

  const secretValue =
    secret.startsWith("whsec_")
      ? secret.slice(6)
      : secret;

  const secretBytes =
    Buffer.from(
      secretValue,
      "base64"
    );

  const expectedSignature =
    crypto
      .createHmac(
        "sha256",
        secretBytes
      )
      .update(signedContent)
      .digest("base64");

  const providedSignatures =
    webhookSignature
      .split(" ")
      .map(
        (item) =>
          item.split(",")[1]
      )
      .filter(Boolean);

  return providedSignatures.some(
    (signature) => {
      const expectedBuffer =
        Buffer.from(
          expectedSignature
        );

      const receivedBuffer =
        Buffer.from(signature);

      if (
        expectedBuffer.length !==
        receivedBuffer.length
      ) {
        return false;
      }

      return crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      );
    }
  );
}

// ---------------------------------------------------------
// LOG SANITIZATION
// ---------------------------------------------------------

function sanitizeForLogs(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(
      sanitizeForLogs
    );
  }

  if (typeof value === "object") {
    const result = {};

    for (
      const [key, val]
      of Object.entries(value)
    ) {
      const lowerKey =
        key.toLowerCase();

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
        result[key] =
          "[REDACTED]";
      } else {
        result[key] =
          sanitizeForLogs(val);
      }
    }

    return result;
  }

  return value;
}

// ---------------------------------------------------------
// EMAIL
// ---------------------------------------------------------

const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL ||
  "Freddy Nails <bookings@freddynails.co.za>";

async function sendEmail({
  to,
  subject,
  html,
}) {
  const apiKey =
    process.env.RESEND_API_KEY;

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
          Authorization:
            `Bearer ${apiKey}`,

          "Content-Type":
            "application/json",
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
      const errText =
        await res.text();

      console.error(
        "Resend send failed:",
        to,
        res.status,
        errText
      );
    } else {
      console.log(
        "Email sent to",
        to
      );
    }
  } catch (err) {
    console.error(
      "Error sending email to",
      to,
      err
    );
  }
}

// ---------------------------------------------------------
// OWNER NOTIFICATION
// ---------------------------------------------------------

async function sendOwnerNotification(
  appointment
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1B1714;">
      <h2 style="color: #AD8A4E; margin-bottom: 4px;">
        New paid booking 💅
      </h2>

      <p style="margin-top: 0; color: #555;">
        A deposit has been confirmed on Freddy Nails.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <tr>
          <td style="padding: 6px 0; color: #888;">
            Client
          </td>

          <td style="padding: 6px 0; font-weight: bold;">
            ${appointment.customer_name}
          </td>
        </tr>

        <tr>
          <td style="padding: 6px 0; color: #888;">
            Phone
          </td>

          <td style="padding: 6px 0;">
            ${appointment.customer_phone}
          </td>
        </tr>

        <tr>
          <td style="padding: 6px 0; color: #888;">
            Email
          </td>

          <td style="padding: 6px 0;">
            ${appointment.customer_email || "—"}
          </td>
        </tr>

        <tr>
          <td style="padding: 6px 0; color: #888;">
            Booking summary
          </td>

          <td style="padding: 6px 0;">
            ${appointment.service_name}
          </td>
        </tr>

        <tr>
          <td style="padding: 6px 0; color: #888;">
            Clients
          </td>

          <td style="padding: 6px 0;">
            ${appointment.client_count}
          </td>
        </tr>

        <tr>
          <td style="padding: 6px 0; color: #888;">
            Deposit paid
          </td>

          <td style="padding: 6px 0; font-weight: bold;">
            R${appointment.deposit_amount}
          </td>
        </tr>

        ${
          appointment.notes
            ? `
              <tr>
                <td style="padding: 6px 0; color: #888;">
                  Notes
                </td>

                <td style="padding: 6px 0;">
                  ${appointment.notes}
                </td>
              </tr>
            `
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
    subject:
      `New paid booking — ${appointment.customer_name}`,
    html,
  });
}

// ---------------------------------------------------------
// CUSTOMER CONFIRMATION
// ---------------------------------------------------------

async function sendCustomerConfirmation(
  appointment
) {
  if (!appointment.customer_email) {
    console.log(
      "No customer email on file; skipping customer confirmation."
    );

    return;
  }

  const dateLabel =
    formatBookingDate(
      appointment.booking_date
    );

  const timeLabel =
    formatTime(
      appointment.start_time
    );

  const whatsappText =
    encodeURIComponent(
      `Hey Freddy! ${appointment.customer_name} here.\nI just booked an appointment for ${dateLabel} at ${timeLabel}.\nI can't wait to get this set done💅`
    );

  const whatsappUrl =
    `https://wa.me/27710888897?text=${whatsappText}`;

  const startUTC =
    toGoogleCalDate(
      appointment.booking_date,
      appointment.start_time
    );

  const endUTC =
    toGoogleCalDate(
      appointment.booking_date,
      appointment.end_time
    );

  const googleCalUrl =
    startUTC && endUTC
      ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
          "Freddy Nails Appointment"
        )}&dates=${startUTC}/${endUTC}&details=${encodeURIComponent(
          appointment.service_name ||
            "Nail appointment"
        )}&location=${encodeURIComponent(
          "8 Rhodes St, Quigney, East London"
        )}`
      : null;

  const html = `
  <div style="background-color:#0c0b0a; padding:32px 16px; font-family:Georgia, 'Times New Roman', serif;">
    
    <div style="max-width:480px; margin:0 auto; background-color:#11100f; border:1px solid rgba(214,179,106,0.2); border-radius:6px; overflow:hidden;">

      <!-- HEADER -->
      <div style="background-color:#181614; padding:32px 24px; text-align:center; border-bottom:1px solid rgba(214,179,106,0.2);">
        
        <p style="margin:0; font-style:italic; font-size:30px; color:#d6b36a; letter-spacing:0.5px;">
          Freddy Nails
        </p>

        <p style="margin:6px 0 0; font-size:11px; letter-spacing:3px; color:#8f877e; text-transform:uppercase;">
          Beauty &middot; Confidence &middot; You
        </p>

      </div>

      <div style="padding:32px 28px;">

        <!-- EVENT INFO -->

        <p style="margin:0; text-align:center; font-size:18px; color:#f4eee6; font-weight:bold;">
          ${dateLabel} &middot; ${timeLabel}
        </p>

        <p style="margin:4px 0 0; text-align:center; font-size:12px; letter-spacing:1px; color:#8f877e; text-transform:uppercase;">
          Freddy Nails Appointment
        </p>

        <!-- HEADING -->

        <h1 style="margin:28px 0 0; text-align:center; font-size:30px; color:#f4eee6; font-weight:normal;">
          You&rsquo;re all booked!
        </h1>

        <!-- MESSAGE -->

        <p style="margin:16px 0 0; text-align:center; font-size:15px; line-height:1.6; color:#c9c0b6;">
          You&rsquo;re officially booked at Freddy Nails! We&rsquo;re excited to have you in the chair. Your appointment details are below &mdash; feel free to message Freddy on WhatsApp anytime with questions or special requests.
        </p>

        <!-- BOOKING SUMMARY -->

        <table
          role="presentation"
          width="100%"
          style="margin-top:28px; border:1px solid rgba(214,179,106,0.25); border-radius:4px; border-collapse:collapse;"
        >

          <tr>
            <td style="padding:14px 18px; color:#8f877e; font-size:13px; border-bottom:1px solid rgba(255,255,255,0.06);">
              Service
            </td>

            <td style="padding:14px 18px; color:#f4eee6; font-size:13px; font-weight:bold; text-align:right; border-bottom:1px solid rgba(255,255,255,0.06);">
              ${appointment.service_name || "—"}
            </td>
          </tr>

          <tr>
            <td style="padding:14px 18px; color:#8f877e; font-size:13px; border-bottom:1px solid rgba(255,255,255,0.06);">
              Date
            </td>

            <td style="padding:14px 18px; color:#f4eee6; font-size:13px; text-align:right; border-bottom:1px solid rgba(255,255,255,0.06);">
              ${dateLabel}
            </td>
          </tr>

          <tr>
            <td style="padding:14px 18px; color:#8f877e; font-size:13px; border-bottom:1px solid rgba(255,255,255,0.06);">
              Time
            </td>

            <td style="padding:14px 18px; color:#f4eee6; font-size:13px; text-align:right; border-bottom:1px solid rgba(255,255,255,0.06);">
              ${timeLabel}
            </td>
          </tr>

          <tr>
            <td style="padding:14px 18px; color:#8f877e; font-size:13px;">
              Deposit paid
            </td>

            <td style="padding:14px 18px; color:#d6b36a; font-size:13px; font-weight:bold; text-align:right;">
              R${appointment.deposit_amount}
            </td>
          </tr>

        </table>

        ${
          appointment.notes
            ? `
              <p style="margin:16px 0 0; font-size:13px; color:#8f877e;">
                <strong style="color:#c9c0b6;">
                  Your notes:
                </strong>
                ${appointment.notes}
              </p>
            `
            : ""
        }

        <!-- WHATSAPP BUTTON -->

        <a
          href="${whatsappUrl}"
          style="display:block; margin-top:28px; background-color:#d6b36a; color:#11100f; text-align:center; padding:16px; border-radius:4px; font-weight:bold; font-size:15px; text-decoration:none;"
        >
          Message Freddy on WhatsApp
        </a>

        <!-- GOOGLE CALENDAR BUTTON -->

        ${
          googleCalUrl
            ? `
              <a
                href="${googleCalUrl}"
                style="display:block; margin-top:12px; border:1px solid rgba(214,179,106,0.5); color:#d6b36a; text-align:center; padding:15px; border-radius:4px; font-weight:bold; font-size:14px; text-decoration:none;"
              >
                Add to Calendar
              </a>
            `
            : ""
        }

      </div>

      <!-- FOOTER -->

      <div style="padding:20px 24px; border-top:1px solid rgba(255,255,255,0.06); text-align:center;">

        <p style="margin:0; font-size:12px; color:#8f877e;">
          Freddy Nails &middot; 8 Rhodes St, Quigney, East London &middot; @nailsby_freddy
        </p>

        <p style="margin:6px 0 0; font-size:12px; color:#665f56;">
          Reply to this email or WhatsApp us anytime.
        </p>

      </div>

    </div>

  </div>
  `;

  await sendEmail({
    to: appointment.customer_email,

    subject:
      "You're all booked! — Freddy Nails",

    html,
  });
}

// ---------------------------------------------------------
// YOCO WEBHOOK
// ---------------------------------------------------------

export async function POST(request) {
  try {
    const rawBody =
      await request.text();

    const isValid =
      verifySignature(
        rawBody,
        request.headers
      );

    if (!isValid) {
      console.error(
        "Invalid Yoco webhook signature."
      );

      return Response.json(
        {
          error:
            "Invalid webhook signature.",
        },
        {
          status: 401,
        }
      );
    }

    const event =
      JSON.parse(rawBody);

    console.log(
      "========================================"
    );

    console.log(
      "VERIFIED YOCO WEBHOOK RECEIVED"
    );

    console.log(
      "Event type:",
      event?.type
    );

    console.log(
      "Safe event structure:",
      JSON.stringify(
        sanitizeForLogs(event),
        null,
        2
      )
    );

    console.log(
      "========================================"
    );

    // -------------------------------------------------------
    // ONLY PROCESS SUCCESSFUL PAYMENTS
    // -------------------------------------------------------

    if (
      event.type !==
      "payment.succeeded"
    ) {
      return Response.json({
        received: true,
      });
    }

    const payment =
      event.payload;

    const checkoutId =
      payment?.metadata?.checkoutId;

    if (!checkoutId) {
      console.error(
        "Yoco payment has no checkoutId."
      );

      return Response.json(
        {
          error:
            "Missing checkout ID.",
        },
        {
          status: 400,
        }
      );
    }

    // -------------------------------------------------------
    // FIND APPOINTMENT
    // -------------------------------------------------------

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
        {
          status: 500,
        }
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
        {
          status: 404,
        }
      );
    }

    console.log(
      "Appointment found:",
      {
        id: appointment.id,

        booking_date:
          appointment.booking_date,

        start_time:
          appointment.start_time,

        end_time:
          appointment.end_time,

        duration_minutes:
          appointment.duration_minutes,

        service_name:
          appointment.service_name,

        client_count:
          appointment.client_count,

        existing_google_event_id:
          appointment.google_event_id,
      }
    );

    // -------------------------------------------------------
    // VERIFY PAYMENT AMOUNT
    // -------------------------------------------------------

    const paidAmount =
      Number(payment.amount);

    const expectedAmount =
      Number(
        appointment.deposit_amount
      ) * 100;

    if (
      paidAmount !==
      expectedAmount
    ) {
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
        {
          status: 400,
        }
      );
    }

    // -------------------------------------------------------
    // CONFIRM APPOINTMENT
    // -------------------------------------------------------

    const {
      error: updateError,
    } = await supabase
      .from("appointments")
      .update({
        payment_status:
          "paid",

        booking_status:
          "confirmed",

        yoco_payment_id:
          payment.id,
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
        {
          status: 500,
        }
      );
    }

    // -------------------------------------------------------
    // CONFIRM INDIVIDUAL CLIENT RECORDS
    // -------------------------------------------------------

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

    let calendarStatus =
      "not_attempted";

    let calendarEventId =
      appointment.google_event_id ||
      null;

    try {
      console.log(
        "Starting Google Calendar creation for appointment:",
        appointment.id
      );

      const calendarResult =
        await createGoogleCalendarEvent(
          {
            ...appointment,

            payment_status:
              "paid",

            booking_status:
              "confirmed",
          }
        );

      console.log(
        "Google Calendar result:",
        JSON.stringify(
          calendarResult,
          null,
          2
        )
      );

      calendarStatus =
        calendarResult?.alreadyExists
          ? "already_exists"
          : "created";

      calendarEventId =
        calendarResult?.eventId ||
        calendarEventId;

    } catch (calendarError) {
      calendarStatus =
        "failed";

      console.error(
        "========================================"
      );

      console.error(
        "GOOGLE CALENDAR CREATION FAILED"
      );

      console.error(
        "Appointment:",
        appointment.id
      );

      console.error(
        "Calendar error name:",
        calendarError?.name
      );

      console.error(
        "Calendar error message:",
        calendarError?.message
      );

      console.error(
        "Calendar error stack:",
        calendarError?.stack
      );

      console.error(
        "Full Calendar error:",
        calendarError
      );

      console.error(
        "========================================"
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

    // ---------------------------------------------------------
    // COMPLETE
    // ---------------------------------------------------------

    console.log(
      "========================================"
    );

    console.log(
      "YOCO WEBHOOK COMPLETE"
    );

    console.log(
      "Appointment:",
      appointment.id
    );

    console.log(
      "Calendar status:",
      calendarStatus
    );

    console.log(
      "Calendar event ID:",
      calendarEventId
    );

    console.log(
      "========================================"
    );

    return Response.json({
      received: true,

      appointmentId:
        appointment.id,

      calendarStatus,

      calendarEventId,
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
      {
        status: 500,
      }
    );
  }
}
```
