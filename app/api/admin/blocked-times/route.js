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

function validTime(t) {
  return /^\d{2}:\d{2}$/.test(String(t || ""));
}

function toMinutes(t) {
  const [h, m] = String(t).slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function hhmm(t) {
  return String(t || "").slice(0, 5);
}

function missingTable(error) {
  return error?.code === "42P01" || /blocked_times/.test(error?.message || "");
}

// Existing bookings that overlap the blocked range (so owner can move/cancel).
async function overlappingBookings(supabase, date, startMin, endMin) {
  const { data: rows } = await supabase
    .from("appointment_clients")
    .select("appointment_id, booking_date, start_time, end_time")
    .eq("booking_date", date)
    .in("booking_status", ["pending", "confirmed"]);

  const ids = [...new Set((rows || []).map((r) => r.appointment_id))];
  const names = {};
  if (ids.length) {
    const { data: appts } = await supabase
      .from("appointments")
      .select("id, customer_name")
      .in("id", ids);
    for (const a of appts || []) names[a.id] = a.customer_name;
  }

  const hits = [];
  for (const r of rows || []) {
    const s = toMinutes(r.start_time);
    const e = toMinutes(r.end_time);
    if (s < endMin && e > startMin) {
      hits.push({
        name: names[r.appointment_id] || "Client",
        start: hhmm(r.start_time),
        end: hhmm(r.end_time),
      });
    }
  }
  hits.sort((a, b) => a.start.localeCompare(b.start));
  return hits;
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  const { supabase } = auth;

  const { data, error } = await supabase
    .from("blocked_times")
    .select("id, block_date, start_time, end_time, reason")
    .gte("block_date", saToday())
    .order("block_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(300);

  if (error) {
    if (missingTable(error)) return json({ blocks: [], ready: false });
    console.error("Admin blocked-times GET error:", error);
    return json({ error: "Could not load blocked times." }, 500);
  }

  const blocks = [];
  for (const row of data || []) {
    const date = String(row.block_date).slice(0, 10);
    const startStr = hhmm(row.start_time);
    const endStr = hhmm(row.end_time);
    const bookings = await overlappingBookings(
      supabase,
      date,
      toMinutes(startStr),
      toMinutes(endStr)
    );
    blocks.push({
      id: row.id,
      date,
      start: startStr,
      end: endStr,
      reason: row.reason || "",
      bookings,
    });
  }

  return json({ ready: true, blocks });
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
      const date = String(body.date || "");
      const start = String(body.start || "").slice(0, 5);
      const end = String(body.end || "").slice(0, 5);
      if (!validDate(date)) return json({ error: "Choose a valid date." }, 400);
      if (date < saToday()) return json({ error: "That date is in the past." }, 400);
      if (!validTime(start) || !validTime(end)) {
        return json({ error: "Choose valid start and end times." }, 400);
      }
      if (toMinutes(start) >= toMinutes(end)) {
        return json({ error: "End time must be after start time." }, 400);
      }

      const reason = String(body.reason || "").trim().slice(0, 80) || null;
      const { data, error } = await supabase
        .from("blocked_times")
        .insert({
          block_date: date,
          start_time: start + ":00",
          end_time: end + ":00",
          reason,
        })
        .select("id")
        .single();

      if (error) {
        if (missingTable(error)) {
          return json(
            {
              error:
                "The blocked_times table has not been created in Supabase yet. Run the SQL first.",
            },
            400
          );
        }
        if (error.code === "23505") {
          return json({ error: "That time range is already blocked." }, 400);
        }
        throw new Error(error.message);
      }

      const bookings = await overlappingBookings(
        supabase,
        date,
        toMinutes(start),
        toMinutes(end)
      );
      return json({
        saved: true,
        id: data?.id,
        affectedBookings: bookings.length,
      });
    }

    if (body.action === "remove") {
      const id = String(body.id || "");
      if (!id) return json({ error: "Missing block id." }, 400);
      const { error } = await supabase.from("blocked_times").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return json({ saved: true });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (error) {
    console.error("Admin blocked-times POST error:", error);
    return json({ error: error.message || "Something went wrong." }, 500);
  }
}
