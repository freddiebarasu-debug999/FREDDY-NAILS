// Freddy Nails working rules. Change a number here and it applies everywhere
// (the calendar, the time slots and the final booking check).

export const OPEN_MINUTES = 7 * 60 + 30; // 07:30
export const CLOSE_MINUTES = 18 * 60 + 30; // 18:30
export const SLOT_INTERVAL = 30; // start times every 30 minutes
export const BUFFER_MINUTES = 5; // gap after an existing client
export const MAX_CLIENTS_PER_DAY = 7; // a day is "full" after this many clients

// A new appointment may finish immediately before an existing booking.
// The 5-minute buffer applies after the existing booking, not before it.
export function clashesWithBuffer(start, end, booked) {
  return booked.some(
    (b) => start < b.end + BUFFER_MINUTES && end > b.start
  );
}

// Explain why a proposed slot clashes with an existing booking.
// "gap" = the proposed start is in the 5-minute gap after a booking.
// "taken" = the proposed start falls during an existing booking.
// "overrun" = the proposed appointment runs into an existing booking.
export function explainClash(start, end, booked) {
  const clash = booked.find(
    (b) => start < b.end + BUFFER_MINUTES && end > b.start
  );
  if (!clash) return null;
  if (start >= clash.end && start < clash.end + BUFFER_MINUTES) return "gap";
  if (start >= clash.start && start < clash.end) return "taken";
  return "overrun";
}
