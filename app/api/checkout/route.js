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
const MAX_CLIENTS = 4;
const MAX_SERVICES_PER_CLIENT = 4;

const OPEN_MINUTES = 9 * 60 + 30;
const CLOSE_MINUTES = 17 * 60 + 30;

const SERVICE_OPTIONS = {
  "Acrylic — Plain Short–Medium (R200)": 90,
  "Acrylic — Plain Long (R250)": 105,
  "Acrylic — Plain XL–XXXL (R300)": 120,
  "Acrylic — French Short–Medium (R300)": 100,
  "Acrylic — French Long (R350)": 115,
  "Acrylic — French XL–XXL (R400)": 130,
  "Acrylic — Ombré Short–Medium (R250)": 120,
  "Acrylic — Ombré Long (R300)": 135,
  "Acrylic — Ombré XL–XXXL (R350)": 150,

  "Gel — Overlay (R200)": 75,
  "Gel — Plain Short–Medium (R250)": 90,
  "Gel — Plain Long (R300)": 100,
  "Gel — French Short–Medium (R300)": 95,
  "Gel — French Long (R350)": 110,

  "Pedicure — Gel Overlay (R150)": 45,
  "Pedicure — Gel Full Tips (R200)": 60,
  "Pedicure — Acrylic Overlay (R180)": 55,
  "Pedicure — Acrylic Full Tips (R200)": 65,
  "Pedicure — Acrylic French Tips (R250)": 75,

  "Lashes — Cluster (R130)": 45,
  "Lashes — Cateye (R150)": 60,
  "Lashes — Classic (R180)": 90,
  // Hybrid, Volume, and Mega Volume are intentionally left out here —
  // they're shown but disabled on the booking form since they're not
  // offered yet. Leaving them out of this object means the server
  // rejects them too, not just the UI.

  "Foot Spa — Basic (R200)": 30,
  "Foot Spa — Luxury (R280)": 45,

  "Extra — Buff & Shine (R150)": 30,
  "Extra — Fill-in @3 weeks (R180)": 75,
  "Extra — Nail Repair (R20–R30)": 15,
  "Extra — Soak Off (R50)": 20,
  "Extra — Nail Art (R30–R50)": 20,
  "Extra — Rhinestones (R10–R15)": 10,
  "Extra — 3D Art (R50–R100)": 30,
};
function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    mins
  ).padStart(2, "0")}`;
}

function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidTime(time) {
  return /^\d{2}:\d{2}$/.test(time);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function calculateClientDuration(services) {
  return services.reduce(
    (total, serviceName) =>
      total + SERVICE_OPTIONS[serviceName],
    0
  );
}

function datesAreSame(dateA, dateB) {
  return dateA === dateB;
}

export async function POST(request) {
  let appointmentId = null;
  let insertedClientIds = [];

  try {
    const body = await request.json();

    const {
      name,
      phone,
      email,
      clientServices,
      clientCount,
      clientDates,
      clientStartTimes,
      notes,
    } = body;

    if (
      !name ||
      !phone ||
      !email
    ) {
      return Response.json(
        {
          error:
            "Please complete all required customer details.",
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

    if (
      !Array.isArray(clientDates) ||
      clientDates.length !== clientCount
    ) {
      return Response.json(
        {
          error:
            "Please choose a preferred date for every client.",
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(clientStartTimes) ||
      clientStartTimes.length !== clientCount
    ) {
      return Response.json(
        {
          error:
            "Please choose an available time for every client.",
        },
        { status: 400 }
      );
    }

    /*
     * Validate every client's services.
     */
    for (
      let clientIndex = 0;
      clientIndex < clientCount;
      clientIndex++
    ) {
      const services =
        clientServices[clientIndex];

      if (
        !Array.isArray(services) ||
        services.length < 1 ||
        services.length > MAX_SERVICES_PER_CLIENT
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

    /*
     * Validate every client's date and time.
     */
    for (
      let clientIndex = 0;
      clientIndex < clientCount;
      clientIndex++
    ) {
      const clientDate =
        clientDates[clientIndex];

      const clientTime =
        clientStartTimes[clientIndex];

      if (!isValidDate(clientDate)) {
        return Response.json(
          {
            error: `Please choose a valid date for Client ${
              clientIndex + 1
            }.`,
          },
          { status: 400 }
        );
      }

      if (!isValidTime(clientTime)) {
        return Response.json(
          {
            error: `Please choose a valid time for Client ${
              clientIndex + 1
            }.`,
          },
          { status: 400 }
        );
      }

      const selectedDate =
        new Date(`${clientDate}T12:00:00`);

      if (
        Number.isNaN(
          selectedDate.getTime()
        )
      ) {
        return Response.json(
          {
            error: `Please choose a valid date for Client ${
              clientIndex + 1
            }.`,
          },
          { status: 400 }
        );
      }

      const today = new Date();

      today.setHours(0, 0, 0, 0);

      const bookingDate =
        new Date(`${clientDate}T00:00:00`);

      if (bookingDate < today) {
        return Response.json(
          {
            error: `Client ${
              clientIndex + 1
            } cannot be booked for a date in the past.`,
          },
          { status: 400 }
        );
      }

      if (
        selectedDate.getDay() === 0
      ) {
        return Response.json(
          {
            error: `Client ${
              clientIndex + 1
            } cannot be booked on Sunday because Freddy Nails is closed.`,
          },
          { status: 400 }
        );
      }
    }

    /*
     * Calculate each client's duration.
     */
    const clientDurations =
      clientServices.map(
        calculateClientDuration
      );

    /*
     * Validate each client's time against
     * business hours.
     */
    const clientEndTimes =
      clientStartTimes.map(
        (startTime, clientIndex) => {
          const startMinutes =
            timeToMinutes(startTime);

          const endMinutes =
            startMinutes +
            clientDurations[clientIndex];

          if (
            startMinutes < OPEN_MINUTES ||
            endMinutes > CLOSE_MINUTES
          ) {
            throw new Error(
              `Client ${
                clientIndex + 1
              }'s appointment is outside business hours.`
            );
          }

          return minutesToTime(
            endMinutes
          );
        }
      );

    /*
     * If multiple clients chose the same date,
     * they can be scheduled consecutively.
     *
     * If they chose different dates, there is no
     * consecutive-time requirement between them.
     */
    for (
      let clientIndex = 0;
      clientIndex < clientCount;
      clientIndex++
    ) {
      if (clientIndex === 0) {
        continue;
      }

      const currentDate =
        clientDates[clientIndex];

      const previousDate =
        clientDates[
          clientIndex - 1
        ];

      if (
        datesAreSame(
          currentDate,
          previousDate
        )
      ) {
        const previousEnd =
          timeToMinutes(
            clientEndTimes[
              clientIndex - 1
            ]
          );

        const currentStart =
          timeToMinutes(
            clientStartTimes[
              clientIndex
            ]
          );

        if (
          currentStart <
          previousEnd + 15
        ) {
          return Response.json(
            {
              error: `Client ${
                clientIndex + 1
              } must start at least 15 minutes after Client ${
                clientIndex
              } finishes when they are booked on the same date.`,
            },
            { status: 400 }
          );
        }
      }
    }

    /*
     * Clean up expired pending parent bookings.
     */
    const { error: expiryError } =
      await supabase
        .from("appointments")
        .update({
          booking_status: "cancelled",
        })
        .eq("booking_status", "pending")
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

    /*
     * Store a readable summary in the existing
     * appointments table.
     */
    const serviceSummary =
      clientServices
        .map(
          (services, index) =>
            `Client ${
              index + 1
            }: ${services.join(
              " + "
            )} — ${
              clientDates[index]
            } ${clientStartTimes[index]}–${clientEndTimes[index]}`
        )
        .join(" | ");

    /*
     * The existing appointments table still needs
     * a booking date/time.
     *
     * We use Client 1's date/time for the parent
     * payment record. The real individual schedules
     * are stored in appointment_clients below.
     */
    const parentStartTime =
      clientStartTimes[0];

    const parentEndTime =
      clientEndTimes[0];

    const parentDuration =
      clientDurations[0];

    const expiresAt = new Date(
      Date.now() + 15 * 60 * 1000
    ).toISOString();

    /*
     * Create the main payment/booking record.
     */
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
        client_count: clientCount,
        booking_date: clientDates[0],
        start_time: parentStartTime,
        end_time: parentEndTime,
        duration_minutes: parentDuration,
        deposit_per_client:
          DEPOSIT_PER_CLIENT,
        deposit_amount: depositAmount,
        payment_status: "pending",
        booking_status: "pending",
        expires_at: expiresAt,
        notes: notes || null,
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
            "Unable to reserve the booking.",
        },
        { status: 500 }
      );
    }

    appointmentId =
      appointment.id;

    /*
     * Create the individual client appointments.
     *
     * The database exclusion constraint on
     * appointment_clients provides the final
     * race-condition protection.
     */
    const clientRows =
      clientServices.map(
        (services, index) => ({
          appointment_id:
            appointmentId,

          client_number:
            index + 1,

          service_name:
            services.join(" + "),

          booking_date:
            clientDates[index],

          start_time:
            clientStartTimes[index],

          end_time:
            clientEndTimes[index],

          duration_minutes:
            clientDurations[index],

          booking_status:
            "pending",
        })
      );

    const {
      data: insertedClients,
      error: clientInsertError,
    } = await supabase
      .from("appointment_clients")
      .insert(clientRows)
      .select("id");

    if (clientInsertError) {
      console.error(
        "Client appointment insert error:",
        clientInsertError
      );

      /*
       * Cancel the parent booking because the
       * individual appointment slots could not
       * all be reserved.
       */
      await supabase
        .from("appointments")
        .update({
          booking_status: "cancelled",
        })
        .eq("id", appointmentId);

      if (
        clientInsertError.code ===
        "23P01"
      ) {
        return Response.json(
          {
            error:
              "One of the selected client times was just booked by someone else. Please choose another available time.",
          },
          { status: 409 }
        );
      }

      return Response.json(
        {
          error:
            "Unable to reserve all client appointment times.",
        },
        { status: 500 }
      );
    }

    insertedClientIds =
      (insertedClients || []).map(
        (client) => client.id
      );

    /*
     * Use the live Freddy Nails domain from Vercel.
     */
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      new URL(request.url).origin;

    const successUrl =
      `${baseUrl}/?booking=success&appointment=${appointmentId}`;

    const cancelUrl =
      `${baseUrl}/?booking=cancelled&appointment=${appointmentId}`;

    const failureUrl =
      `${baseUrl}/?booking=failed&appointment=${appointmentId}`;

    /*
     * Create Yoco checkout.
     *
     * IMPORTANT: Yoco's Checkout API expects the field
     * to be named "amount", not "amountInCents". The
     * value itself is still in cents.
     */
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
            amount:
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
        .from("appointment_clients")
        .delete()
        .eq(
          "appointment_id",
          appointmentId
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
        .from("appointment_clients")
        .delete()
        .eq(
          "appointment_id",
          appointmentId
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

    const { error: updateError } =
      await supabase
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

    /*
     * If something failed after the parent
     * appointment was created, clean up the
     * individual client rows and cancel the
     * parent booking.
     */
    if (appointmentId) {
      await supabase
        .from("appointment_clients")
        .delete()
        .eq(
          "appointment_id",
          appointmentId
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
    }

    return Response.json(
      {
        error:
          error.message ||
          "Something went wrong starting your booking.",
      },
      { status: 500 }
    );
  }
}
