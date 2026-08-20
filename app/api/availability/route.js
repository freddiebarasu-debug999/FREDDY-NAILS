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

const OPEN_MINUTES = 9 * 60 + 30;
const CLOSE_MINUTES = 17 * 60 + 30;
const SLOT_INTERVAL = 15;

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

export async function GET(request) {
  try {
    const url = new URL(request.url);

    const date = url.searchParams.get("date");
    const duration = Number(
      url.searchParams.get("duration")
    );

    if (!date || !isValidDate(date)) {
      return Response.json(
        {
          error:
            "Please provide a valid booking date.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(duration) ||
      duration <= 0
    ) {
      return Response.json(
        {
          error:
            "Please provide a valid booking duration.",
        },
        { status: 400 }
      );
    }

    /*
     * Release expired pending bookings.
     *
     * This keeps abandoned Yoco checkouts from blocking
     * appointment times after their 15-minute window.
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

    /*
     * A Sunday is closed.
     */
    const selectedDate = new Date(
      `${date}T12:00:00`
    );

    const dayOfWeek =
      selectedDate.getDay();

    if (dayOfWeek === 0) {
      return Response.json({
        date,
        availableTimes: [],
      });
    }

    /*
     * Get individual client appointments for this date.
     *
     * These are now the source of truth for availability.
     */
    const {
      data: clientAppointments,
      error,
    } = await supabase
      .from("appointment_clients")
      .select(
        "start_time, end_time, booking_status, appointment_id"
      )
      .eq("booking_date", date)
      .in("booking_status", [
        "pending",
        "confirmed",
      ]);

    if (error) {
      console.error(
        "Availability Supabase error:",
        error
      );

      return Response.json(
        {
          error:
            "Unable to check availability.",
        },
        { status: 500 }
      );
    }

    const availableTimes = [];

    /*
     * Check every 15-minute starting point.
     */
    for (
      let startMinutes = OPEN_MINUTES;
      startMinutes + duration <= CLOSE_MINUTES;
      startMinutes += SLOT_INTERVAL
    ) {
      const endMinutes =
        startMinutes + duration;

      const overlaps =
        (clientAppointments || []).some(
          (appointment) => {
            const appointmentStart =
              timeToMinutes(
                String(
                  appointment.start_time
                ).slice(0, 5)
              );

            const appointmentEnd =
              timeToMinutes(
                String(
                  appointment.end_time
                ).slice(0, 5)
              );

            return (
              startMinutes <
                appointmentEnd &&
              endMinutes >
                appointmentStart
            );
          }
        );

      if (!overlaps) {
        availableTimes.push(
          minutesToTime(startMinutes)
        );
      }
    }

    return Response.json({
      date,
      availableTimes,
    });
  } catch (error) {
    console.error(
      "Availability API error:",
      error
    );

    return Response.json(
      {
        error:
          "Something went wrong checking availability.",
      },
      { status: 500 }
    );
  }
}
