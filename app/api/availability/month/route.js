export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Same opening hours as /api/availability
const OPEN_MINUTES = 9 * 60 + 30;
const CLOSE_MINUTES = 17 * 60 + 30;
const SLOT_INTERVAL = 15;

function timeToMinutes(time) {
  const parts = String(time).split(":").map(Number);
  return parts[0] * 60 + parts[1];
}

function pad(n) {
  return String(n).padStart(2, "0");
}

// South Africa is UTC+2 all year.
function saToday() {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

/*
  GET /api/availability/month?month=2026-10&duration=90

  Returns how many free start times each day has, so the calendar can show
  green (available) and red (fully booked) days.
    { month, days: { "2026-10-14": 12, "2026-10-15": 0, ... } }
  Sundays and past days are left out.
*/
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const month = url.searchParams.get("month") || "";
    const duration = Number(url.searchParams.get("duration"));

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return Response.json({ error: "Valid month is required (YYYY-MM)." }, { status: 400 });
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      return Response.json(
        { error: "Valid appointment duration is required." },
        { status: 400 }
      );
    }

    const year = Number(month.slice(0, 4));
    const monthIndex = Number(month.slice(5, 7)) - 1;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const first = month + "-01";
    const last = month + "-" + pad(daysInMonth);

    // Release expired pending bookings first (same rule as the day view).
    const nowIso = new Date().toISOString();
    const { data: expired } = await supabase
      .from("appointments")
      .select("id")
      .eq("booking_status", "pending")
      .not("expires_at", "is", null)
      .lt("expires_at", nowIso);

    const expiredIds = (expired || []).map((a) => a.id);
    if (expiredIds.length > 0) {
      await supabase
        .from("appointments")
        .update({ booking_status: "cancelled" })
        .in("id", expiredIds);

      await supabase
        .from("appointment_clients")
        .update({ booking_status: "cancelled" })
        .in("appointment_id", expiredIds)
        .eq("booking_status", "pending");
    }

    const { data: booked, error } = await supabase
      .from("appointment_clients")
      .select("booking_date, start_time, end_time")
      .gte("booking_date", first)
      .lte("booking_date", last)
      .in("booking_status", ["pending", "confirmed"]);

    if (error) {
      console.error("Month availability error:", error);
      return Response.json({ error: "Unable to load availability." }, { status: 500 });
    }

    const byDate = {};
    (booked || []).forEach((b) => {
      const key = String(b.booking_date).slice(0, 10);
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push([timeToMinutes(b.start_time), timeToMinutes(b.end_time)]);
    });

    const today = saToday();
    const days = {};

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = month + "-" + pad(day);
      if (date < today) continue;
      if (new Date(date + "T12:00:00").getDay() === 0) continue; // Sunday

      const taken = byDate[date] || [];
      let free = 0;

      for (
        let start = OPEN_MINUTES;
        start + duration <= CLOSE_MINUTES;
        start += SLOT_INTERVAL
      ) {
        const end = start + duration;
        const clash = taken.some((t) => start < t[1] && end > t[0]);
        if (!clash) free += 1;
      }

      days[date] = free;
    }

    return Response.json(
      { month, days },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("Month availability API error:", err);
    return Response.json(
      { error: "Something went wrong loading availability." },
      { status: 500 }
    );
  }
}
