import {
  OPEN_MINUTES,
  CLOSE_MINUTES,
  SLOT_INTERVAL,
  BUFFER_MINUTES,
  MAX_CLIENTS_PER_DAY,
} from "@/lib/bookingRules";

import { overlapsBlockedRange } from "@/lib/blockedTimes";

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return String(hours).padStart(2, "0") + ":" + String(mins).padStart(2, "0");
}

function timeStringToMinutes(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const m = value.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

// Normalise Supabase, Google Calendar, and fallback booking shapes
// to { start, end, fromGoogle } in minutes after midnight.
function normaliseBookings(bookings = []) {
  return (bookings || [])
    .map((b) => {
      if (!b) return null;
      const start =
        timeStringToMinutes(b.start) ??
        timeStringToMinutes(b.start_time) ??
        timeStringToMinutes(b.startMinutes);
      const end =
        timeStringToMinutes(b.end) ??
        timeStringToMinutes(b.end_time) ??
        timeStringToMinutes(b.endMinutes);
      if (start == null || end == null) return null;
      return {
        start,
        end,
        fromGoogle: Boolean(b.fromGoogle || b.source === "google-calendar"),
        summary: b.summary || b.client_name || "",
      };
    })
    .filter(Boolean);
}

// The single source of truth for daily slot lists and monthly day counts.
export function calculateAvailabilitySlots({
  date,
  duration,
  bookings = [],
  blockedRanges = [],
  today,
  nowMinutes,
}) {
  // Keep the gap AFTER an existing booking only. A slot may end exactly
  // when the next booking starts; a new slot cannot start during the gap.
  const normalised = normaliseBookings(bookings);

  const clientCount = normalised.filter((booking) => !booking.fromGoogle).length;
  const dayIsFull = clientCount >= MAX_CLIENTS_PER_DAY;
  const isToday = date === today;

  const slots = [];
  const availableTimes = [];

  for (let start = OPEN_MINUTES; start <= CLOSE_MINUTES; start += SLOT_INTERVAL) {
    const end = start + duration;
    const time = minutesToTime(start);

    const isPastTime = isToday && start <= nowMinutes;
    const isBlocked = overlapsBlockedRange(start, end, blockedRanges);

    const clashingBooking = normalised.find(
      (booking) =>
        start < booking.end + BUFFER_MINUTES &&
        end > booking.start
    );

    const isInGapAfterBooking = clashingBooking
      ? start >= clashingBooking.end &&
        start < clashingBooking.end + BUFFER_MINUTES
      : false;

    const available =
      !isPastTime && !isBlocked && !dayIsFull && !clashingBooking;

    let reason;
    if (isPastTime) reason = "past";
    else if (dayIsFull) reason = "full";
    else if (isBlocked) reason = "blocked";
    else if (clashingBooking) reason = isInGapAfterBooking ? "gap" : "booked";
    else reason = "available";

    // Return every start time so the client can show unavailable times
    // struck through rather than hiding them.
    slots.push({ time, available, reason });

    if (available) availableTimes.push(time);
  }

  return { slots, availableTimes };
}
