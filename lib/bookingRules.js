// Freddy Nails working rules. Change a number here and it applies everywhere
// (the calendar, the time slots and the final booking check).

export const OPEN_MINUTES = 7 * 60 + 30; // 07:30
export const CLOSE_MINUTES = 18 * 60 + 30; // 18:30
export const SLOT_INTERVAL = 30; // start times every 30 minutes
export const BUFFER_MINUTES = 5; // 5-minute gap between clients
export const MAX_CLIENTS_PER_DAY = 7; // a day is "full" after this many clients

// Does a proposed slot (in minutes) clash with the bookings already made,
// once the gap (BUFFER_MINUTES) is included? booked = [{ start, end }].
export function clashesWithBuffer(start, end, booked) {
  return booked.some(
    (b) => start < b.end + BUFFER_MINUTES && end + BUFFER_MINUTES > b.start
  );
}

// Why does a proposed slot clash? Lets us give a clear message.
//   "taken"   = the start time itself is inside, or touching, another booking
//   "overrun" = the start is free, but the chosen service(s) run on into the
//               next booking
//   null      = no clash
export function explainClash(start, end, booked) {
  const clash = booked.find(
    (b) => start < b.end + BUFFER_MINUTES && end + BUFFER_MINUTES > b.start
  );
  if (!clash) return null;
  return start >= clash.start - BUFFER_MINUTES ? "taken" : "overrun";
}
