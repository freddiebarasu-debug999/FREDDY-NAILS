export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import { calculateAvailabilitySlots } from "@/lib/availabilitySlots";
import {
  OPEN_MINUTES,
  CLOSE_MINUTES,
  SLOT_INTERVAL,
  BUFFER_MINUTES,
  MAX_CLIENTS_PER_DAY,
} from "@/lib/bookingRules";
import { isClosedDate } from "@/lib/closedDates";
import { getBusyForDate } from "@/lib/busyTimes";
import {
  getBlockedRangesForDate,
  overlapsBlockedRange,
} from "@/lib/blockedTimes";

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

function saDateTimeParts() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { date: `${value.year}-${value.month}-${value.day}`, minutes: Number(value.hour) * 60 + Number(value.minute) };
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
      return Response.json({ date, availableTimes: [], allSlots: [] });
    }

    /*
     * Days the owner has marked as closed (days off).
     */
    if (await isClosedDate(supabase, date)) {
      return Response.json({ date, availableTimes: [], allSlots: [] });
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
    let bookedClients = [];
    let bookedClientsError = null;
    try {
      bookedClients = await getBusyForDate(supabase, date);
    } catch (lookupError) {
      bookedClientsError = lookupError;
    }

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

    // Owner-blocked time ranges (partial day blocks).
    const blockedRanges = await getBlockedRangesForDate(supabase, date);

    const localNow = saDateTimeParts();
    const { slots: allSlots, availableTimes } = calculateAvailabilitySlots({
      date,
      duration,
      bookings: bookedClients || [],
      blockedRanges,
      today: localNow.date,
      nowMinutes: localNow.minutes,
    });

    return Response.json({
      date,
      availableTimes,
      allSlots,
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
