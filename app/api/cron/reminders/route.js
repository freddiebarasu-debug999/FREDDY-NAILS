import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendPushToProfile,
  sendEmail,
  appointmentReminderEmail,
  rebookEmail,
  formatDateLabel,
  formatTimeLabel,
} from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Rebook nudge rules
const REBOOK_AFTER_DAYS = 28; // nudge once it has been this long since the last visit
const REBOOK_MAX_DAYS = 90; // ...but stop bothering people after this long
const REBOOK_COOLDOWN_DAYS = 56; // never nudge the same client more than once per 8 weeks

// South Africa is UTC+2 all year (no daylight saving).
function saDate(offsetDays = 0) {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000 + offsetDays * 86400000);
  return d.toISOString().slice(0, 10);
}

function isSuccessful(a) {
  const booking = String(a.booking_status || "").toLowerCase();
  const payment = String(a.payment_status || "").toLowerCase();
  if (booking === "cancelled" || booking === "canceled") return false;
  return (
    payment === "paid" ||
    payment === "deposit_paid" ||
    booking === "confirmed" ||
    booking === "approved"
  );
}

async function getEmail(profileId) {
  const { data } = await supabaseAdmin.auth.admin.getUserById(profileId);
  return data?.user?.email || null;
}

async function getPrefs(profileId) {
  const { data } = await supabaseAdmin
    .from("notification_prefs")
    .select("appointment_email, rebook_email")
    .eq("profile_id", profileId)
    .maybeSingle();
  return {
    appointment_email: data?.appointment_email ?? true,
    rebook_email: data?.rebook_email ?? false,
  };
}

async function runAppointmentReminders(summary) {
  const tomorrow = saDate(1);

  const { data: appts, error } = await supabaseAdmin
    .from("appointments")
    .select(
      "id, profile_id, customer_name, customer_email, service_name, booking_date, start_time, booking_status, payment_status"
    )
    .eq("booking_date", tomorrow)
    .not("profile_id", "is", null);

  if (error) {
    console.error("Reminder query error:", error);
    summary.errors.push("appointments query failed");
    return;
  }

  for (const a of (appts || []).filter(isSuccessful)) {
    // The unique index guarantees one reminder per booking, even if this runs twice.
    const { error: logError } = await supabaseAdmin
      .from("notification_log")
      .insert({
        profile_id: a.profile_id,
        appointment_id: String(a.id),
        kind: "appointment_reminder",
      });
    if (logError) continue; // already reminded (or log failed)

    const timeLabel = formatTimeLabel(a.start_time);
    const pushed = await sendPushToProfile(supabaseAdmin, a.profile_id, {
      title: "See you tomorrow 💅",
      body: `${a.service_name || "Your appointment"} at ${timeLabel}`,
      url: "/account",
      tag: `appt-${a.id}`,
    });
    summary.appointmentPush += pushed;

    const prefs = await getPrefs(a.profile_id);
    if (prefs.appointment_email) {
      const to = a.customer_email || (await getEmail(a.profile_id));
      if (to) {
        const mail = appointmentReminderEmail({
          name: a.customer_name,
          service: a.service_name || "Your appointment",
          dateLabel: formatDateLabel(a.booking_date),
          timeLabel,
        });
        if (await sendEmail({ to, ...mail })) summary.appointmentEmail += 1;
      }
    }
  }
}

async function runRebookNudges(summary) {
  const today = saDate(0);
  const since = saDate(-(REBOOK_MAX_DAYS + 30));

  const { data: appts, error } = await supabaseAdmin
    .from("appointments")
    .select("profile_id, customer_name, booking_date, booking_status, payment_status")
    .gte("booking_date", since)
    .not("profile_id", "is", null);

  if (error) {
    console.error("Rebook query error:", error);
    summary.errors.push("rebook query failed");
    return;
  }

  // Per client: latest completed visit, and whether anything is booked ahead.
  const byProfile = new Map();
  for (const a of appts || []) {
    const entry = byProfile.get(a.profile_id) || { last: null, future: false, name: "" };
    const booking = String(a.booking_status || "").toLowerCase();
    const live = booking !== "cancelled" && booking !== "canceled";
    if (live && a.booking_date > today) entry.future = true;
    if (isSuccessful(a) && a.booking_date <= today) {
      if (!entry.last || a.booking_date > entry.last) entry.last = a.booking_date;
      entry.name = a.customer_name || entry.name;
    }
    byProfile.set(a.profile_id, entry);
  }

  const todayMs = new Date(`${today}T00:00:00Z`).getTime();
  const cooldownCut = new Date(Date.now() - REBOOK_COOLDOWN_DAYS * 86400000).toISOString();

  for (const [profileId, info] of byProfile) {
    if (info.future || !info.last) continue;
    const days = Math.floor((todayMs - new Date(`${info.last}T00:00:00Z`).getTime()) / 86400000);
    if (days < REBOOK_AFTER_DAYS || days > REBOOK_MAX_DAYS) continue;

    const { data: recent } = await supabaseAdmin
      .from("notification_log")
      .select("id")
      .eq("profile_id", profileId)
      .eq("kind", "rebook_nudge")
      .gte("sent_at", cooldownCut)
      .limit(1);
    if (recent?.length) continue;

    const prefs = await getPrefs(profileId);
    const pushed = await sendPushToProfile(supabaseAdmin, profileId, {
      title: "Time for a fresh set? 💅",
      body: "It's been a few weeks. Tap to book your next appointment.",
      url: "/account/book",
      tag: "rebook",
    });
    summary.rebookPush += pushed;

    let emailed = false;
    if (prefs.rebook_email) {
      const to = await getEmail(profileId);
      if (to) {
        const mail = rebookEmail({ name: info.name });
        emailed = await sendEmail({ to, ...mail });
        if (emailed) summary.rebookEmail += 1;
      }
    }

    if (pushed > 0 || emailed) {
      await supabaseAdmin.from("notification_log").insert({
        profile_id: profileId,
        appointment_id: null,
        kind: "rebook_nudge",
      });
    }
  }
}

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not set." }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const summary = {
    appointmentPush: 0,
    appointmentEmail: 0,
    rebookPush: 0,
