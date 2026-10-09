import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createGoogleCalendarEvent } from "@/lib/google-calendar";
import {
  sendOwnerNotification,
  sendCustomerConfirmation,
} from "@/lib/booking-emails";

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

  if (!webhookId || !webhookTimestamp || !webhookSignature || !secret) {
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

// ---------------------------------------------------------
// YOCO WEBHOOK
// ---------------------------------------------------------

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
        {
          error:
            "Invalid webhook signature.",
        },
        {
          status: 401,
        }
      );
    }

    let event;

    try {
      event = JSON.parse(rawBody);
    } catch (parseError) {
      console.error(
        "Unable to parse Yoco webhook JSON:",
        parseError
      );

      return Response.json(
        {
          error:
            "Invalid webhook JSON.",
        },
        {
          status: 400,
        }
      );
    }

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
    // IGNORE EVENTS WE DON'T NEED
    // -------------------------------------------------------

    if (
      event?.type !==
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

    // -------------------------------------------------------
    // VERIFY PAYMENT AMOUNT
    // -------------------------------------------------------

    const paidAmount =
      Number(payment?.amount);

    const expectedAmount =
      Number(
        appointment.deposit_amount
      ) * 100;

    if (
      !Number.isFinite(paidAmount) ||
      !Number.isFinite(expectedAmount) ||
      paidAmount !== expectedAmount
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
        payment_status: "paid",
        booking_status: "confirmed",
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
    // CONFIRM CLIENT RECORDS
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

    // -------------------------------------------------------
    // GOOGLE CALENDAR
    // -------------------------------------------------------

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
        await createGoogleCalendarEvent({
          ...appointment,
          payment_status: "paid",
          booking_status: "confirmed",
        });

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
        "GOOGLE CALENDAR CREATION FAILED"
      );

      console.error(
        "Appointment:",
        appointment.id
      );

      console.error(
        "Calendar error:",
        calendarError
      );
    }

    // -------------------------------------------------------
    // EMAIL NOTIFICATIONS
    // -------------------------------------------------------

    // One failing email must never stop the other from being sent.
    try {
      await sendOwnerNotification(appointment);
    } catch (ownerEmailError) {
      console.error("Owner notification failed:", ownerEmailError);
    }

    try {
      await sendCustomerConfirmation(appointment);
    } catch (customerEmailError) {
      console.error("Customer confirmation failed:", customerEmailError);
    }

    // -------------------------------------------------------
    // COMPLETE
    // -------------------------------------------------------

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
