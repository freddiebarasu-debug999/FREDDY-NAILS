// Freddy Nails working rules. Change a number here and it applies everywhere
// (the calendar, the time slots and the final booking check).

export const OPEN_MINUTES = 7 * 60 + 30; // 07:30
export const CLOSE_MINUTES = 18 * 60 + 30; // 18:30
export const SLOT_INTERVAL = 15; // start times every 15 minutes
export const BUFFER_MINUTES = 15; // gap kept between clients
export const MAX_CLIENTS_PER_DAY = 7; // a day is "full" after this many clients

// Does a proposed slot (in minutes) clash with the bookings already made,
// once the 15-minute gap is included? booked = [{ start, end }].
export function clashesWithBuffer(start, end, booked) {
  return booked.some(
    (b) => start < b.end + BUFFER_MINUTES && end + BUFFER_MINUTES > b.start
  );
}
