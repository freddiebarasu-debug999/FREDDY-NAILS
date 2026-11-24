export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import {
  OPEN_MINUTES,
  CLOSE_MINUTES,
  SLOT_INTERVAL,
  BUFFER_MINUTES,
  MAX_CLIENTS_PER_DAY,
} from "@/lib/bookingRules";
import { getClosedDatesInRange } from "@/lib/closedDates";
import { getBusyByDate } from "@/lib/busyTimes";

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


function timeToMinutes(time) {
  const parts = String(time).split(":").map(Number);
  return parts[0] * 60 + parts[1];
}

function pad(n) {
  return String(n).padStart(2, "0");
}

// South Africa is UTC+2 all year.
function saDateTimeParts() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { date: `${value.year}-${value.month}-${value.day}`, minutes: Number(value.hour) * 60 + Number(value.minute) };
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

    let busy;
    try {
      busy = await getBusyByDate(supabase, first, last);
    } catch (error) {
      console.error("Month availability error:", error);
      return Response.json({ error: "Unable to load availability." }, { status: 500 });
    }

    const byDate = {};
    for (const [key, list] of Object.entries(busy)) {
      byDate[key] = list.map((b) => [b.start, b.end]);
    }

    const closedDates = await getClosedDatesInRange(supabase, first, last);

    const localNow = saDateTimeParts();
    const today = localNow.date;
    const days = {};

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = month + "-" + pad(day);
      if (date < today) continue;
      if (new Date(date + "T12:00:00").getDay() === 0) continue; // Sunday
      if (closedDates.has(date)) continue; // owner's day off

      const taken = byDate[date] || [];
      let free = 0;

      // A full day (maximum clients) has no free times.
      if (taken.length < MAX_CLIENTS_PER_DAY) {
        for (
          let start = OPEN_MINUTES;
          start <= CLOSE_MINUTES;
          start += SLOT_INTERVAL
        ) {
          const end = start + duration;
          // Keep a 15-minute gap before and after every booking.
          const pastToday = date === today && start <= localNow.minutes;
          const clash = pastToday || taken.some(
            (t) => start < t[1] + BUFFER_MINUTES && end + BUFFER_MINUTES > t[0]
          );
          if (!clash) free += 1;
        }
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
