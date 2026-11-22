import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(body, status = 200) {
  return Response.json(body, { status });
}

function saToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" });
}

function validDate(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d))) return false;
  const x = new Date(d + "T00:00:00Z");
  return !Number.isNaN(x.getTime()) && x.toISOString().slice(0, 10) === d;
}

function missingTable(error) {
  return error?.code === "42P01" || /closed_dates/.test(error?.message || "");
}

function hhmm(t) {
  return String(t || "").slice(0, 5);
}

// Existing bookings on the given dates, so the owner can move or cancel them.
async function bookingsOn(supabase, dates) {
  const result = {};
  if (!dates.length) return result;
  const { data: rows } = await supabase
    .from("appointment_clients")
    .select("appointment_id, booking_date, start_time")
    .in("booking_date", dates)
    .in("booking_status", ["pending", "confirmed"]);
  const ids = [...new Set((rows || []).map((r) => r.appointment_id))];
  const names = {};
  if (ids.length) {
    const { data: appts } = await supabase.from("appointments").select("id, customer_name").in("id", ids);
    for (const a of appts || []) names[a.id] = a.customer_name;
  }
  for (const r of rows || []) {
    const key = String(r.booking_date).slice(0, 10);
    (result[key] ||= []).push({ name: names[r.appointment_id] || "Client", start: hhmm(r.start_time) });
  }
  for (const key of Object.keys(result)) result[key].sort((a, b) => a.start.localeCompare(b.start));
  return result;
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  const { supabase } = auth;

  const { data, error } = await supabase
    .from("closed_dates")
    .select("closed_date, reason")
    .gte("closed_date", saToday())
    .order("closed_date", { ascending: true })
    .limit(200);
  if (error) {
    if (missingTable(error)) return json({ dates: [], ready: false });
    console.error("Admin closed dates GET error:", error);
    return json({ error: "Could not load closed days." }, 500);
  }

  const dates = (data || []).map((d) => String(d.closed_date).slice(0, 10));
  const bookings = await bookingsOn(supabase, dates);
  return json({
    ready: true,
    dates: (data || []).map((d) => ({
      date: String(d.closed_date).slice(0, 10),
      reason: d.reason || "",
      bookings: bookings[String(d.closed_date).slice(0, 10)] || [],
    })),
  });
}

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  const { supabase } = auth;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  try {
    if (body.action === "add") {
      const from = String(body.from || "");
      const to = String(body.to || "") || from;
      if (!validDate(from) || !validDate(to)) return json({ error: "Choose a valid date." }, 400);
      if (from < saToday()) return json({ error: "That date is in the past." }, 400);
      if (to < from) return json({ error: "The last day can't be before the first day." }, 400);

      const days = [];
      for (let d = new Date(from + "T00:00:00Z"); d.toISOString().slice(0, 10) <= to; d.setUTCDate(d.getUTCDate() + 1)) {
        days.push(d.toISOString().slice(0, 10));
        if (days.length > 62) return json({ error: "Please block 62 days or fewer at a time." }, 400);
      }

      const reason = String(body.reason || "").trim().slice(0, 80) || null;
      const { error } = await supabase
        .from("closed_dates")
        .upsert(days.map((d) => ({ closed_date: d, reason })), { onConflict: "closed_date" });
      if (error) {
        if (missingTable(error)) return json({ error: "The closed days table has not been created in Supabase yet. Run the SQL first." }, 400);
        throw new Error(error.message);
      }

      const bookings = await bookingsOn(supabase, days);
      const affected = Object.values(bookings).reduce((n, list) => n + list.length, 0);
      return json({ saved: true, added: days.length, affectedBookings: affected });
    }

    if (body.action === "remove") {
      if (!validDate(String(body.date || ""))) return json({ error: "Date not recognised." }, 400);
      const { error } = await supabase.from("closed_dates").delete().eq("closed_date", body.date);
      if (error) throw new Error(error.message);
      return json({ saved: true });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (error) {
    console.error("Admin closed dates POST error:", error);
    return json({ error: error.message || "Something went wrong." }, 500);
  }
}
