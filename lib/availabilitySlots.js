import {
  OPEN_MINUTES,
  CLOSE_MINUTES,
  SLOT_INTERVAL,
  MAX_CLIENTS_PER_DAY,
} from "@/lib/bookingRules";

import { overlapsBlockedRange } from "@/lib/blockedTimes";

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function timeStringToMinutes(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const m = value.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

// Bookings can arrive in different shapes depending on where they came from:
// Supabase: { start, end } as minutes (numbers)
// Google Calendar (route.js): { start, end } as "HH:MM" strings + fromGoogle: true
// Fallback: { start_time, end_time } / { startMinutes, endMinutes }
// Normalise everything to { start, end, fromGoogle } in minutes.
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
  // 5-minute gap AFTER every booking / calendar event / blocked range.
  // Example: booking 10:00-11:00 -> next bookable slot is 11:05, not 11:00.
  // A slot ending exactly when a booking starts (09:00-10:00 before a 10:00 booking)
  // IS allowed - the gap is only after a booking, not before it.
  const GAP_AFTER_MINUTES = 5;

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

    // Does this slot overlap a booking, or start inside the 5-min gap after one?
    // Overlap: start < booking.end AND end > booking.start
    // Gap: start >= booking.end AND start < booking.end + 5
    // Combined: start < booking.end + 5 AND end > booking.start
    // Note: end > booking.start (not end + 5) is what allows back-to-back BEFORE a booking.
    const clashingBooking = normalised.find(
      (booking) => start < booking.end + GAP_AFTER_MINUTES && end > booking.start
    );

    // Is this slot only blocked because it's in the 5-min gap after a booking?
    const isInGapAfterBooking = clashingBooking
      ? start >= clashingBooking.end && start < clashingBooking.end + GAP_AFTER_MINUTES
      : false;

    const available = !isPastTime && !isBlocked && !dayIsFull && !clashingBooking;

    let reason;
    if (isPastTime) reason = "past";
    else if (dayIsFull) reason = "full";
    else if (isBlocked) reason = "blocked";
    else if (clashingBooking) reason = isInGapAfterBooking ? "gap" : "booked";
    else reason = "available";

    // Every slot is returned, with its status - the frontend uses this
    // to show booked ones scratched out instead of hiding them.
    slots.push({ time, available, reason });

    if (available) {
      availableTimes.push(time);
    }
  }

  return { slots, availableTimes };
}
