export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import {
  OPEN_MINUTES,
  CLOSE_MINUTES,
  SLOT_INTERVAL,
  BUFFER_MINUTES,
  MAX_CLIENTS_PER_DAY,
} from "@/lib/bookingRules";

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


function timeToMinutes(time) {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    mins
  ).padStart(2, "0")}`;
}

export async function GET(request) {
  try {
    const url = new URL(request.url);

    const date =
      url.searchParams.get("date");

    const durationParam =
      url.searchParams.get("duration");

    const duration = Number(
      durationParam
    );

    if (!date) {
      return Response.json(
        {
          error:
            "Booking date is required.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      return Response.json(
        {
          error:
            "Valid appointment duration is required.",
        },
        { status: 400 }
      );
    }

    const requestedDate =
      new Date(`${date}T12:00:00`);

    if (
      Number.isNaN(
        requestedDate.getTime()
      )
    ) {
      return Response.json(
        {
          error:
            "Invalid booking date.",
        },
        { status: 400 }
      );
    }

    /*
     * Sunday is closed.
     */
    if (
      requestedDate.getDay() === 0
    ) {
      return Response.json({
        date,
        availableTimes: [],
      });
    }

    /*
     * Release expired pending parent bookings.
     */
    const now =
      new Date().toISOString();

    const {
      data: expiredAppointments,
      error: expiredLookupError,
    } = await supabase
      .from("appointments")
      .select("id")
      .eq("booking_status", "pending")
      .not("expires_at", "is", null)
      .lt("expires_at", now);

    if (expiredLookupError) {
      console.error(
        "Expired booking lookup error:",
        expiredLookupError
      );
    }

    const expiredIds =
      (expiredAppointments || []).map(
        (appointment) =>
          appointment.id
      );

    if (expiredIds.length > 0) {
      /*
       * Cancel the parent payment records.
       */
      const {
        error: expireParentError,
      } = await supabase
        .from("appointments")
        .update({
          booking_status:
            "cancelled",
        })
        .in("id", expiredIds);

      if (expireParentError) {
        console.error(
          "Expired parent booking update error:",
          expireParentError
        );
      }

      /*
       * Cancel their individual client slots too.
       */
      const {
        error: expireClientError,
      } = await supabase
        .from("appointment_clients")
        .update({
          booking_status:
            "cancelled",
        })
        .in(
          "appointment_id",
          expiredIds
        )
        .eq(
          "booking_status",
          "pending"
        );

      if (expireClientError) {
        console.error(
          "Expired client booking update error:",
          expireClientError
        );
      }
    }

    /*
     * Get all active individual client appointments
     * for this date.
     */
    const {
      data: bookedClients,
      error: bookedClientsError,
    } = await supabase
      .from("appointment_clients")
      .select(
        "start_time, end_time, booking_status"
      )
      .eq(
        "booking_date",
        date
      )
      .in(
        "booking_status",
        ["pending", "confirmed"]
      )
      .order(
        "start_time",
        { ascending: true }
      );

    if (bookedClientsError) {
      console.error(
        "Availability lookup error:",
        bookedClientsError
      );

      return Response.json(
        {
          error:
            "Unable to load availability.",
        },
        { status: 500 }
      );
    }

    const availableTimes = [];

    // A day with the maximum number of clients is full.
    const dayIsFull =
      (bookedClients || []).length >=
      MAX_CLIENTS_PER_DAY;

    /*
     * Check every 30-minute start time. Closing time is the latest
     * permitted START time; treatment duration may extend beyond closing.
     */
    for (
      let start = OPEN_MINUTES;
      !dayIsFull &&
      start <= CLOSE_MINUTES;
      start += SLOT_INTERVAL
    ) {
      const proposedStart =
        start;

      const proposedEnd =
        start + duration;

      const overlaps =
        (bookedClients || []).some(
          (booking) => {
            const bookedStart =
              timeToMinutes(
                booking.start_time
              );

            const bookedEnd =
              timeToMinutes(
                booking.end_time
              );

            // Keep a 15-minute gap before and after every booking.
            return (
              proposedStart <
                bookedEnd + BUFFER_MINUTES &&
              proposedEnd + BUFFER_MINUTES >
                bookedStart
            );
          }
        );

      if (!overlaps) {
        availableTimes.push(
          minutesToTime(start)
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
          "Something went wrong loading availability.",
      },
      { status: 500 }
    );
  }
}
