export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import { calculateAvailabilitySlots } from "@/lib/availabilitySlots";
import { isClosedDate } from "@/lib/closedDates";
import { getBusyForDate } from "@/lib/busyTimes";
import { getBlockedRangesForDate } from "@/lib/blockedTimes";

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

function saDateTimeParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    date: `${value.year}-${value.month}-${value.day}`,
    minutes: Number(value.hour) * 60 + Number(value.minute),
  };
}

// ---------- Google Calendar (direct check) ----------
// Service Account so the website can check YOUR calendar server-side.
// Env vars (Vercel > Settings > Environment Variables):
//   GOOGLE_CALENDAR_ID
//   GOOGLE_SERVICE_ACCOUNT_EMAIL
//   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
// Share your calendar with the service-account email ("See all event details").

function base64UrlEncode(input) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getGoogleAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !privateKey) return null;
  privateKey = privateKey.replace(/\\n/g, "\n");
  const crypto = await import("node:crypto");
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64UrlEncode(JSON.stringify({
    iss: email,
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }));
  const unsigned = `${header}.${claim}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(privateKey);
  const jwt = `${unsigned}.${base64UrlEncode(signature)}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Google Calendar token error:", res.status, text);
    return null;
  }
  const data = await res.json();
  return data.access_token || null;
}

// Returns bookings in the exact shape availabilitySlots expects:
// { start, end, fromGoogle: true } where start/end are SAST minutes since midnight.
// The 5-min gap after each event is applied inside availabilitySlots.
async function getGoogleBusyForDate(date) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) return [];
  const token = await getGoogleAccessToken();
  if (!token) return [];

  const timeMin = new Date(`${date}T00:00:00+02:00`).toISOString();
  const timeMax = new Date(`${date}T23:59:59+02:00`).toISOString();
  const url =
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events` +
    `?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=250`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Google Calendar events error:", res.status, text);
    return [];
  }
  const data = await res.json();
  const toSaMinutes = (iso) => {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso));
    const v = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return Number(v.hour) * 60 + Number(v.minute);
  };

  return (data.items || [])
    .filter((event) => {
      if (event.status === "cancelled") return false;
      if (event.transparency === "transparent") return false;
      return true;
    })
    .map((event) => {
      if (event.start?.date && !event.start?.dateTime) {
        return { start: 0, end: 24 * 60, fromGoogle: true, summary: event.summary || "Busy" };
      }
      const startRaw = event.start?.dateTime;
      const endRaw = event.end?.dateTime;
      if (!startRaw || !endRaw) return null;
      let start = toSaMinutes(startRaw);
      let end = toSaMinutes(endRaw);
      if (end === 0 && new Date(endRaw) > new Date(startRaw)) end = 24 * 60;
      return { start, end, fromGoogle: true, summary: event.summary || "Busy" };
    })
    .filter(Boolean);
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get("date");
    const durationParam = url.searchParams.get("duration");
    const duration = Number(durationParam);

    if (!date) {
      return Response.json({ error: "Booking date is required." }, { status: 400 });
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      return Response.json({ error: "Valid appointment duration is required." }, { status: 400 });
    }

    const requestedDate = new Date(`${date}T12:00:00`);
    if (Number.isNaN(requestedDate.getTime())) {
      return Response.json({ error: "Invalid booking date." }, { status: 400 });
    }

    // Sunday is closed.
    if (requestedDate.getDay() === 0) {
      return Response.json({ date, availableTimes: [], allSlots: [] });
    }

    // Days the owner has marked as closed.
    if (await isClosedDate(supabase, date)) {
      return Response.json({ date, availableTimes: [], allSlots: [] });
    }

    // Release expired pending parent bookings.
    const now = new Date().toISOString();
    const { data: expiredAppointments, error: expiredLookupError } = await supabase
      .from("appointments")
      .select("id")
      .eq("booking_status", "pending")
      .not("expires_at", "is", null)
      .lt("expires_at", now);

    if (expiredLookupError) {
      console.error("Expired booking lookup error:", expiredLookupError);
    }

    const expiredIds = (expiredAppointments || []).map((appointment) => appointment.id);

    if (expiredIds.length > 0) {
      const { error: expireParentError } = await supabase
        .from("appointments")
        .update({ booking_status: "cancelled" })
        .in("id", expiredIds);
      if (expireParentError) console.error("Expired parent booking update error:", expireParentError);

      const { error: expireClientError } = await supabase
        .from("appointment_clients")
        .update({ booking_status: "cancelled" })
        .in("appointment_id", expiredIds)
        .eq("booking_status", "pending");
      if (expireClientError) console.error("Expired client booking update error:", expireClientError);
    }

    // Get all active individual client appointments.
    let bookedClients = [];
    let bookedClientsError = null;
    try {
      bookedClients = await getBusyForDate(supabase, date);
    } catch (lookupError) {
      bookedClientsError = lookupError;
    }

    if (bookedClientsError) {
      console.error("Availability lookup error:", bookedClientsError);
      return Response.json({ error: "Unable to load availability." }, { status: 500 });
    }

    // Owner-blocked time ranges.
    const blockedRanges = await getBlockedRangesForDate(supabase, date);

    // --- Google Calendar: anything on your calendar blocks that time online ---
    // If Google fails, log it and fall back to Supabase-only instead of crashing.
    let googleBusy = [];
    let googleCalendarChecked = false;
    try {
      googleBusy = await getGoogleBusyForDate(date);
      googleCalendarChecked = true;
    } catch (googleError) {
      console.error("Google Calendar availability error:", googleError);
      googleCalendarChecked = false;
    }

    const combinedBookings = [...(bookedClients || []), ...googleBusy];

    const localNow = saDateTimeParts();
    const { slots: allSlots, availableTimes } = calculateAvailabilitySlots({
      date,
      duration,
      bookings: combinedBookings,
      blockedRanges,
      today: localNow.date,
      nowMinutes: localNow.minutes,
    });

    return Response.json({
      date,
      availableTimes,
      allSlots,
      googleCalendarChecked,
    });
  } catch (error) {
    console.error("Availability API error:", error);
    return Response.json({ error: "Something went wrong loading availability." }, { status: 500 });
  }
}
