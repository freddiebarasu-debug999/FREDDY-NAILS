export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import { calculateAvailabilitySlots } from "@/lib/availabilitySlots";
import { isClosedDate } from "@/lib/closedDates";
import { getBusyForDate } from "@/lib/busyTimes";
import { getBlockedRangesForDate } from "@/lib/blockedTimes";

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

function saDateTimeParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    date: `${value.year}-${value.month}-${value.day}`,
    minutes: Number(value.hour) * 60 + Number(value.minute),
  };
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get("date");
    const durationParam = url.searchParams.get("duration");
    const duration = Number(durationParam);

    if (!date) {
      return Response.json({ error: "Booking date is required." }, { status: 400 });
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      return Response.json({ error: "Valid appointment duration is required." }, { status: 400 });
    }

    const requestedDate = new Date(`${date}T12:00:00`);
    if (Number.isNaN(requestedDate.getTime())) {
      return Response.json({ error: "Invalid booking date." }, { status: 400 });
    }

    // Sunday is closed.
    if (requestedDate.getDay() === 0) {
      return Response.json({ date, availableTimes: [], allSlots: [] });
    }

    // Days the owner has marked as closed.
    if (await isClosedDate(supabase, date)) {
      return Response.json({ date, availableTimes: [], allSlots: [] });
    }

    // Release expired pending parent bookings.
    const now = new Date().toISOString();
    const { data: expiredAppointments, error: expiredLookupError } = await supabase
      .from("appointments")
      .select("id")
      .eq("booking_status", "pending")
      .not("expires_at", "is", null)
      .lt("expires_at", now);

    if (expiredLookupError) {
      console.error("Expired booking lookup error:", expiredLookupError);
    }

    const expiredIds = (expiredAppointments || []).map((appointment) => appointment.id);

    if (expiredIds.length > 0) {
      const { error: expireParentError } = await supabase
        .from("appointments")
        .update({ booking_status: "cancelled" })
        .in("id", expiredIds);
      if (expireParentError) console.error("Expired parent booking update error:", expireParentError);

      const { error: expireClientError } = await supabase
        .from("appointment_clients")
        .update({ booking_status: "cancelled" })
        .in("appointment_id", expiredIds)
        .eq("booking_status", "pending");
      if (expireClientError) console.error("Expired client booking update error:", expireClientError);
    }

    // Get all active bookings for this date.
    // This ALREADY includes Google Calendar via lib/busyTimes.js ->
    // lib/google-calendar.js (OAuth, google_calendar_connections table).
    // Do NOT add a second service-account Google check here.
    let bookedClients = [];
    let bookedClientsError = null;
    try {
      bookedClients = await getBusyForDate(supabase, date);
    } catch (lookupError) {
      bookedClientsError = lookupError;
    }

    if (bookedClientsError) {
      console.error("Availability lookup error:", bookedClientsError);
      return Response.json({ error: "Unable to load availability." }, { status: 500 });
    }

    // Owner-blocked time ranges.
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

    return Response.json({ date, availableTimes, allSlots });
  } catch (error) {
    console.error("Availability API error:", error);
    return Response.json({ error: "Something went wrong loading availability." }, { status: 500 });
  }
}
