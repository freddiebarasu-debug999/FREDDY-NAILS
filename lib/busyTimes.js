// One shared answer to "which times are already taken?".
// The website, the month calendar, the final checkout check and the owner's
// Day slots screen all use this, so they can never disagree.
//
// A time is taken when it belongs to:
//   1. A booking in the database that is pending, confirmed, or completed
//      (we read individual client rows first; if a live booking has no client
//      row on that day we fall back to the parent booking row), OR
//   2. Any event already on the connected Google Calendar
//      (manual entries, cash bookings that only made it to the calendar, etc.)
//
// Google Calendar is the safety net so anything visible on your phone calendar
// is blocked online, even if the website database is out of step.
//
// IMPORTANT FIX: Google errors must NOT crash availability.
// If Google fails (bad key format, calendar not shared, env var missing),
// we log it and keep using the database bookings. Only a DB failure
// still returns "Unable to load availability."

import { getGoogleCalendarBusyByDate } from "@/lib/google-calendar";

const LIVE = ["pending", "confirmed", "completed"];

function dateKey(value) {
  return String(value || "").slice(0, 10);
}

function toMinutes(time) {
  const [h, m] = String(time || "").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Returns { "YYYY-MM-DD": [{ start, end, appointmentId?, fromBooking?, fromGoogle? }] }
// with start/end in minutes.
export async function getBusyByDate(supabase, from, to) {
  const { data: rows, error } = await supabase
    .from("appointment_clients")
    .select("appointment_id, booking_date, start_time, end_time")
    .gte("booking_date", from)
    .lte("booking_date", to)
    .in("booking_status", LIVE);
  if (error) throw new Error(error.message);

  const byDate = {};
  const covered = new Set();

  for (const row of rows || []) {
    if (!row.start_time || !row.end_time) continue;
    const key = dateKey(row.booking_date);
    (byDate[key] ||= []).push({
      start: toMinutes(row.start_time),
      end: toMinutes(row.end_time),
      appointmentId: row.appointment_id,
      fromBooking: false,
    });
    covered.add(`${row.appointment_id}|${key}`);
  }

  // Safety net: live bookings with no usable client row on their date.
  try {
    const { data: parents, error: parentError } = await supabase
      .from("appointments")
      .select("id, booking_date, start_time, end_time, booking_status, expires_at")
      .gte("booking_date", from)
      .lte("booking_date", to)
      .in("booking_status", LIVE);
    if (parentError) throw parentError;

    const now = Date.now();
    for (const parent of parents || []) {
      if (!parent.start_time || !parent.end_time) continue;
      if (parent.booking_status === "pending" && parent.expires_at) {
        const expires = new Date(parent.expires_at).getTime();
        if (!Number.isNaN(expires) && expires <= now) continue; // hold ran out
      }
      const key = dateKey(parent.booking_date);
      if (covered.has(`${parent.id}|${key}`)) continue;
      (byDate[key] ||= []).push({
        start: toMinutes(parent.start_time),
        end: toMinutes(parent.end_time),
        appointmentId: parent.id,
        fromBooking: true,
      });
    }
  } catch (fallbackError) {
    console.error("Busy-times parent booking lookup failed:", fallbackError?.message || fallbackError);
    throw new Error("Unable to verify existing bookings in the database.");
  }

  // Merge anything already on Google Calendar (manual entries, etc.).
  // Overlaps with DB bookings are fine — the slot stays blocked either way.
  try {
    const googleBusy = await getGoogleCalendarBusyByDate(from, to);
    for (const [key, list] of Object.entries(googleBusy || {})) {
      if (!list?.length) continue;
      const existing = byDate[key] || [];
      for (const g of list) {
        // Skip ranges that are already fully covered by a DB booking so we
        // do not inflate client counts for the "day is full" rule.
        const alreadyCovered = existing.some(
          (b) => !b.fromGoogle && g.start >= b.start && g.end <= b.end
        );
        if (alreadyCovered) continue;
        (byDate[key] ||= []).push({
          start: g.start,
          end: g.end,
          fromGoogle: true,
        });
      }
    }
  } catch (googleError) {
    console.error(
      "Google Calendar busy merge failed (falling back to database bookings only):",
      googleError?.message || googleError
    );
    // Do NOT throw here. Availability must still work from the database
    // even if Google is misconfigured / not shared / key is bad.
    // The error is logged in Vercel Logs so you can still fix Google.
  }

  return byDate;
}

export async function getBusyForDate(supabase, date) {
  const byDate = await getBusyByDate(supabase, date, date);
  return byDate[date] || [];
}
