// A short booking reference clients can quote as proof of booking,
// for example FN-F94052. It comes from the booking ID, so it never changes.
export function bookingRef(id) {
  const clean = String(id || "").replace(/-/g, "").slice(0, 6).toUpperCase();
  return clean ? "FN-" + clean : "";
}
