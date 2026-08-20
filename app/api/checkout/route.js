export const dynamic = "force-dynamic";

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

const DEPOSIT_PER_CLIENT = 90;
const CLIENT_GAP = 15;

const OPEN_MINUTES = 9 * 60 + 30;
const CLOSE_MINUTES = 17 * 60 + 30;

const MAX_CLIENTS = 4;
const MAX_SERVICES_PER_CLIENT = 4;

const SERVICE_OPTIONS = {
  "Acrylic Manicure — Plain": 90,
  "Acrylic Manicure — French": 90,
  "Acrylic Manicure — Ombré": 150,

  "Gel Manicure — Overlay": 90,
  "Gel Manicure — Plain": 90,
  "Gel Manicure — French": 90,

  "Pedicure Set — Gel": 45,
  "Pedicure Set — Acrylic": 45,

  "Fill-in": 90,

  "Nail Art / Rhinestones / 3D Art": 150,

  "Repair / Soak Off": 30,
};

function timeToMinutes(time) {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(
    2,
    "0"
  )}:${String(mins).padStart(2, "0")}`;
}

function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidTime(time) {
  return /^\d{2}:\d{2}$/.test(time);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function calculateServiceDuration(
  clientServices
) {
  return clientServices.reduce(
    (total, serviceName) =>
      total +
      SERVICE_OPTIONS[serviceName],
    0
  );
}

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      name,
      phone,
      email,
      clientServices,
      clientCount,
      date,
      startTime,
      endTime,
      durationMinutes,
      notes,
    } = body;

    if (
      !name ||
      !phone ||
      !email ||
      !date ||
      !startTime ||
      !endTime
    ) {
      return Response.json(
        {
          error:
            "Please complete all required booking details.",
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return Response.json(
        {
          error:
            "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(clientCount) ||
      clientCount < 1 ||
      clientCount > MAX_CLIENTS
    ) {
      return Response.json(
        {
          error:
            "You can book between 1 and 4 clients.",
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(clientServices) ||
      clientServices.length !== clientCount
    ) {
      return Response.json(
        {
          error:
            "Please select services for every client.",
        },
        { status: 400 }
      );
    }

    for (
      let clientIndex = 0;
      clientIndex < clientServices.length;
      clientIndex++
    ) {
      const services =
        clientServices[clientIndex];

      if (
        !Array.isArray(services) ||
        services.length < 1 ||
        services.length >
          MAX_SERVICES_PER_CLIENT
      ) {
        return Response.json(
          {
            error: `Client ${
              clientIndex + 1
            } must have between 1 and 4 services.`,
          },
          { status: 400 }
        );
      }

      const uniqueServices =
        new Set(services);

      if (
        uniqueServices.size !==
        services.length
      ) {
        return Response.json(
          {
            error: `Client ${
              clientIndex + 1
            } cannot have the same service selected more than once.`,
          },
          { status: 400 }
        );
      }

      for (const serviceName of services) {
        if (
          !Object.prototype.hasOwnProperty.call(
            SERVICE_OPTIONS,
            serviceName
          )
        ) {
          return Response.json(
            {
              error:
                "One or more selected services are invalid.",
            },
            { status: 400 }
          );
        }
      }
    }

    if (
      !isValidDate(date)
    ) {
      return Response.json(
        {
          error:
            "Please provide a valid booking date.",
        },
        { status: 400 }
      );
    }

    if (
      !isValidTime(startTime) ||
      !isValidTime(endTime)
    ) {
      return Response.json(
        {
          error:
            "Please provide valid booking times.",
        },
        { status: 400 }
      );
    }

    const selectedDate = new Date(
      `${date}T12:00:00`
    );

    if (
      Number.isNaN(
        selectedDate.getTime()
      )
    ) {
      return Response.json(
        {
          error:
            "Please provide a valid booking date.",
        },
        { status: 400 }
      );
    }

    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const bookingDate = new Date(
      `${date}T00:00:00`
    );

    if (
      bookingDate < today
    ) {
      return Response.json(
        {
          error:
            "You cannot book a date in the past.",
        },
        { status: 400 }
      );
    }

    const dayOfWeek =
      selectedDate.getDay();

    if (dayOfWeek === 0) {
      return Response.json(
        {
          error:
            "Freddy Nails is closed on Sundays.",
        },
        { status: 400 }
      );
    }

    const startMinutes =
      timeToMinutes(startTime);

    const suppliedEndMinutes =
      timeToMinutes(endTime);

    if (
      startMinutes < OPEN_MINUTES ||
      startMinutes >= CLOSE_MINUTES
    ) {
      return Response.json(
        {
          error:
            "The selected time is outside business hours.",
        },
        { status: 400 }
      );
    }

    /*
     * Calculate the duration independently
     * from the selected services.
     */
    const clientDurations =
      clientServices.map(
        calculateServiceDuration
      );

    const serviceDuration =
      clientDurations.reduce(
        (total, duration) =>
          total + duration,
        0
      );

    const calculatedDuration =
      serviceDuration +
      CLIENT_GAP *
        Math.max(
          0,
          clientCount - 1
        );

    const calculatedEndMinutes =
      startMinutes +
      calculatedDuration;

    if (
      calculatedEndMinutes >
      CLOSE_MINUTES
    ) {
      return Response.json(
        {
          error:
            "This appointment is too long to finish before closing time.",
        },
        { status: 400 }
      );
    }

    if (
      suppliedEndMinutes !==
      calculatedEndMinutes
    ) {
      return Response.json(
        {
          error:
            "The appointment duration does not match the selected services.",
        },
        { status: 400 }
      );
    }

    if (
      Number(durationMinutes) !==
      calculatedDuration
    ) {
      return Response.json(
        {
          error:
            "The appointment duration does not match the selected services.",
        },
        { status: 400 }
      );
    }

    const calculatedEndTime =
      minutesToTime(
        calculatedEndMinutes
      );

    if (
      endTime !== calculatedEndTime
    ) {
      return Response.json(
        {
          error:
            "The appointment end time is invalid.",
        },
        { status: 400 }
      );
    }

    /*
     * Release expired pending bookings before
     * checking/inserting the new appointment.
     */
    const { error: expiryError } =
      await supabase
        .from("appointments")
        .update({
          booking_status:
            "cancelled",
        })
        .eq(
          "booking_status",
          "pending"
        )
        .lt(
          "expires_at",
          new Date().toISOString()
        );

    if (expiryError) {
      console.error(
        "Pending booking expiry error:",
        expiryError
      );
    }

    const depositAmount =
      DEPOSIT_PER_CLIENT *
      clientCount;

    const serviceSummary =
      clientServices
        .map(
          (services, index) =>
            `Client ${
              index + 1
            }: ${services.join(
              " + "
            )}`
        )
        .join(" | ");

    /*
     * Create the pending appointment first.
     * The PostgreSQL exclusion constraint provides
     * the final race-condition protection.
     */
    const expiresAt = new Date(
      Date.now() +
        15 * 60 * 1000
    ).toISOString();

    const {
      data: appointment,
      error: appointmentError,
    } = await supabase
      .from("appointments")
      .insert({
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        service_name:
          serviceSummary,
        client_count:
          clientCount,
        booking_date: date,
        start_time: startTime,
        end_time: endTime,
        duration_minutes:
          calculatedDuration,
        deposit_per_client:
          DEPOSIT_PER_CLIENT,
        deposit_amount:
          depositAmount,
        payment_status:
          "pending",
        booking_status:
          "pending",
        expires_at:
          expiresAt,
        notes:
          notes || null,
      })
      .select("id")
      .single();

    if (appointmentError) {
      console.error(
        "Appointment insert error:",
        appointmentError
      );

      if (
        appointmentError.code ===
        "23P01"
      ) {
        return Response.json(
          {
            error:
              "That time was just booked by someone else. Please choose another available time.",
          },
          { status: 409 }
        );
      }

      return Response.json(
        {
          error:
            "Unable to reserve that appointment time.",
        },
        { status: 500 }
      );
    }

    const appointmentId =
      appointment.id;

    const baseUrl =
      "https://freddy-nails.vercel.app";

    const successUrl =
      `${baseUrl}/?booking=success&appointment=${appointmentId}`;

    const cancelUrl =
      `${baseUrl}/?booking=cancelled&appointment=${appointmentId}`;

    const failureUrl =
      `${baseUrl}/?booking=failed&appointment=${appointmentId}`;

    const yocoResponse =
      await fetch(
        "https://payments.yoco.com/api/checkouts",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
          },
          body: JSON.stringify({
            amountInCents:
              depositAmount * 100,
            currency: "ZAR",
            successUrl,
            cancelUrl,
            failureUrl,
          }),
        }
      );

    const yocoData =
      await yocoResponse.json();

    if (!yocoResponse.ok) {
      console.error(
        "Yoco checkout error:",
        yocoData
      );

      await supabase
        .from("appointments")
        .update({
          booking_status:
            "cancelled",
        })
        .eq(
          "id",
          appointmentId
        );

      return Response.json(
        {
          error:
            "Unable to start the secure payment. Please try again.",
        },
        { status: 500 }
      );
    }

    const checkoutId =
      yocoData.id;

    const redirectUrl =
      yocoData.redirectUrl;

    if (
      !checkoutId ||
      !redirectUrl
    ) {
      console.error(
        "Yoco returned incomplete checkout data:",
        yocoData
      );

      await supabase
        .from("appointments")
        .update({
          booking_status:
            "cancelled",
        })
        .eq(
          "id",
          appointmentId
        );

      return Response.json(
        {
          error:
            "Yoco did not return a valid checkout link.",
        },
        { status: 500 }
      );
    }

    const {
      error: updateError,
    } = await supabase
      .from("appointments")
      .update({
        yoco_checkout_id:
          checkoutId,
      })
      .eq(
        "id",
        appointmentId
      );

    if (updateError) {
      console.error(
        "Yoco checkout ID update error:",
        updateError
      );
    }

    return Response.json({
      redirectUrl,
    });
  } catch (error) {
    console.error(
      "Checkout API error:",
      error
    );

    return Response.json(
      {
        error:
          "Something went wrong starting your booking.",
      },
      { status: 500 }
    );
  }
}
