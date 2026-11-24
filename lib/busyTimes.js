// One shared answer to "which times are already taken?".
// The website, the month calendar, the final checkout check and the owner's
// Day slots screen all use this, so they can never disagree.
//
// A time is taken when it belongs to a booking that is:
//   pending (payment hold still running), confirmed, or completed.
// We read the individual client rows first. If a live booking has NO client
// row on that day (missing or out of step), we fall back to the booking's own
// date and time, so a booking that is on your Google Calendar can never show
// as free on the website.

const LIVE = ["pending", "confirmed", "completed"];

function dateKey(value) {
  return String(value || "").slice(0, 10);
}

function toMinutes(time) {
  const [h, m] = String(time || "").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Returns { "YYYY-MM-DD": [{ start, end, appointmentId, fromBooking }] }
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
    console.error("Busy-times fallback skipped:", fallbackError?.message || fallbackError);
  }

  return byDate;
}

export async function getBusyForDate(supabase, date) {
  const byDate = await getBusyByDate(supabase, date, date);
  return byDate[date] || [];
}
