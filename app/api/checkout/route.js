import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEPOSIT_PER_CLIENT = 90;

const OPEN_MINUTES = 9 * 60 + 30;
const CLOSE_MINUTES = 17 * 60 + 30;
const CLIENT_GAP = 15;

const SERVICE_OPTIONS = [
  {
    name: "Acrylic Manicure — Plain",
    duration: 90,
  },
  {
    name: "Acrylic Manicure — French",
    duration: 90,
  },
  {
    name: "Acrylic Manicure — Ombré",
    duration: 150,
  },
  {
    name: "Gel Manicure — Overlay",
    duration: 90,
  },
  {
    name: "Gel Manicure — Plain",
    duration: 90,
  },
  {
    name: "Gel Manicure — French",
    duration: 90,
  },
  {
    name: "Pedicure Set — Gel",
    duration: 45,
  },
  {
    name: "Pedicure Set — Acrylic",
    duration: 45,
  },
  {
    name: "Fill-in",
    duration: 90,
  },
  {
    name: "Nail Art / Rhinestones / 3D Art",
    duration: 150,
  },
  {
    name: "Repair / Soak Off",
    duration: 30,
  },
];

const SERVICE_DURATIONS = Object.fromEntries(
  SERVICE_OPTIONS.map((service) => [
    service.name,
    service.duration,
  ])
);

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function isValidTime(time) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time);
}

function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function getSouthAfricaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      name,
      phone,
      email,
      service,
      services,
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
      !service ||
      !clientCount ||
      !date ||
      !startTime ||
      !endTime ||
      !durationMinutes
    ) {
      return Response.json(
        {
          error:
            "Please complete all required booking details.",
        },
        { status: 400 }
      );
    }

    const numberOfClients = Number(clientCount);
    const requestedDuration = Number(durationMinutes);

    // Validate number of clients.
    if (
      !Number.isInteger(numberOfClients) ||
      numberOfClients < 1 ||
      numberOfClients > 4
    ) {
      return Response.json(
        { error: "Invalid number of clients." },
        { status: 400 }
      );
    }

    // Validate booking date format.
    if (!isValidDate(date)) {
      return Response.json(
        { error: "Please provide a valid booking date." },
        { status: 400 }
      );
    }

    // Prevent bookings for dates that have already passed.
    const todayInSouthAfrica = getSouthAfricaDate();

    if (date < todayInSouthAfrica) {
      return Response.json(
        {
          error:
            "You cannot book a date that has already passed.",
        },
        { status: 400 }
      );
    }

    // Sunday is closed.
    const selectedDate = new Date(`${date}T12:00:00`);

    if (selectedDate.getDay() === 0) {
      return Response.json(
        {
          error: "Freddy Nails is closed on Sundays.",
        },
        { status: 400 }
      );
    }

    // Validate time formats.
    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      return Response.json(
        { error: "Please provide valid booking times." },
        { status: 400 }
      );
    }

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (endMinutes <= startMinutes) {
      return Response.json(
        {
          error:
            "The booking end time must be after the start time.",
        },
        { status: 400 }
      );
    }

    /*
      Validate services.

      The frontend sends an array such as:
      [
        "Acrylic Manicure — Plain",
        "Pedicure Set — Gel"
      ]
    */

    if (!Array.isArray(services)) {
      return Response.json(
        {
          error:
            "Please select at least one valid service.",
        },
        { status: 400 }
      );
    }

    if (services.length < 1 || services.length > 4) {
      return Response.json(
        {
          error:
            "You can select between 1 and 4 services.",
        },
        { status: 400 }
      );
    }

    // Make sure every service is recognised.
    const invalidServices = services.filter(
      (serviceName) =>
        typeof serviceName !== "string" ||
        !SERVICE_DURATIONS[serviceName]
    );

    if (invalidServices.length > 0) {
      return Response.json(
        {
          error:
            "One or more selected services are invalid.",
        },
        { status: 400 }
      );
    }

    // Prevent duplicate services in one booking.
    const uniqueServices = new Set(services);

    if (uniqueServices.size !== services.length) {
      return Response.json(
        {
          error:
            "Please choose each service only once.",
        },
        { status: 400 }
      );
    }

    // Calculate the real service duration on the server.
    const singleClientServiceDuration =
      services.reduce(
        (total, serviceName) =>
          total + SERVICE_DURATIONS[serviceName],
        0
      );

    /*
      Multiple clients are scheduled consecutively.

      Example:
      1 service × 2 clients
      = service duration × 2
      + one 15-minute client gap.
    */
    const calculatedDuration =
      singleClientServiceDuration * numberOfClients +
      CLIENT_GAP *
        Math.max(0, numberOfClients - 1);

    // Make sure the browser's duration matches our server calculation.
    if (requestedDuration !== calculatedDuration) {
      return Response.json(
        {
          error:
            "The booking duration does not match the selected services and number of clients.",
        },
        { status: 400 }
      );
    }

    // Make sure the selected end time matches the real duration.
    if (
      endMinutes - startMinutes !==
      calculatedDuration
    ) {
      return Response.json(
        {
          error:
            "The booking end time does not match the selected services.",
        },
        { status: 400 }
      );
    }

    // Enforce Freddy Nails business hours.
    if (
      startMinutes < OPEN_MINUTES ||
      endMinutes > CLOSE_MINUTES
    ) {
      return Response.json(
        {
          error:
            "Bookings are available between 09:30 and 17:30.",
        },
        { status: 400 }
      );
    }

    const depositAmount =
      DEPOSIT_PER_CLIENT * numberOfClients;

    const amountInCents = depositAmount * 100;

    // Release expired unpaid bookings.
    const { error: expiryError } = await supabase
      .from("appointments")
      .update({
        booking_status: "cancelled",
      })
      .eq("booking_status", "pending")
      .lt("expires_at", new Date().toISOString());

    if (expiryError) {
      console.error(
        "Pending booking expiry error:",
        expiryError
      );
    }

    // Hold the booking for 15 minutes while payment is completed.
    const expiresAt = new Date(
      Date.now() + 15 * 60 * 1000
    ).toISOString();

    // Store the selected services together in the existing service_name column.
    const serviceSummary = services.join(" + ");

    // Create the appointment as pending.
    const {
      data: appointment,
      error: appointmentError,
    } = await supabase
      .from("appointments")
      .insert({
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        service_name: serviceSummary,
        client_count: numberOfClients,
        booking_date: date,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: calculatedDuration,
        deposit_per_client: DEPOSIT_PER_CLIENT,
        deposit_amount: depositAmount,
        payment_status: "pending",
        booking_status: "pending",
        notes: notes || null,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (appointmentError) {
      console.error(
        "Supabase appointment error:",
        appointmentError
      );

      // PostgreSQL exclusion constraint violation.
      if (appointmentError.code === "23P01") {
        return Response.json(
          {
            error:
              "That time was just booked by someone else. Please choose another available time.",
          },
          { status: 409 }
        );
      }

      return Response.json(
        { error: "Unable to save your booking." },
        { status: 500 }
      );
    }

    // Create the Yoco checkout.
    const response = await fetch(
      "https://payments.yoco.com/api/checkouts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
        },
        body: JSON.stringify({
          amount: amountInCents,
          currency: "ZAR",
          successUrl: `https://freddy-nails.vercel.app/?booking=success&appointment=${appointment.id}`,
          cancelUrl: `https://freddy-nails.vercel.app/?booking=cancelled&appointment=${appointment.id}`,
          failureUrl: `https://freddy-nails.vercel.app/?booking=failed&appointment=${appointment.id}`,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Yoco checkout error:", data);

      await supabase
        .from("appointments")
        .update({
          booking_status: "cancelled",
        })
        .eq("id", appointment.id);

      return Response.json(
        {
          error: "Unable to create Yoco checkout.",
        },
        { status: 500 }
      );
    }

    // Save the Yoco checkout ID.
    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        yoco_checkout_id: data.id,
      })
      .eq("id", appointment.id);

    if (updateError) {
      console.error(
        "Unable to save Yoco checkout ID:",
        updateError
      );
    }

    return Response.json({
      success: true,
      appointmentId: appointment.id,
      checkoutId: data.id,
      redirectUrl: data.redirectUrl,
      amount: depositAmount,
    });
  } catch (error) {
    console.error(
      "Checkout API error:",
      error
    );

    return Response.json(
      {
        error:
          "Something went wrong creating the payment.",
      },
      { status: 500 }
    );
  }
}
