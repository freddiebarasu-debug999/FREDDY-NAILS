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
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
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
  const clientCount = bookings.filter((booking) => !booking.fromGoogle).length;
  const dayIsFull = clientCount >= MAX_CLIENTS_PER_DAY;
  const isToday = date === today;
  const slots = [];
  const availableTimes = [];
 
  for (let start = OPEN_MINUTES; start <= CLOSE_MINUTES; start += SLOT_INTERVAL) {
    const end = start + duration;
    const time = minutesToTime(start);
    const isPastTime = isToday && start <= nowMinutes;
    const isBlocked = overlapsBlockedRange(start, end, blockedRanges);
    const clashes = bookings.some((booking) =>
      start < booking.end + BUFFER_MINUTES &&
      end + BUFFER_MINUTES > booking.start
    );
    const available = !isPastTime && !isBlocked && !dayIsFull && !clashes;
    const reason = isPastTime ? "past" : isBlocked ? "blocked" : undefined;
    slots.push({ time, available, reason });
    if (available) availableTimes.push(time);
  }
  return { slots, availableTimes };
}
