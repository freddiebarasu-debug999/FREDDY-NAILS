import { sendEmail } from "@/lib/booking-emails";

// When a booking is cancelled, email the people on the waitlist who wanted
// that day (or any day). Slots are first come, first served, so we tell up
// to MAX_PER_SLOT people at once. This function never throws: a problem here
// must never stop a cancellation from going through.

const MAX_PER_SLOT = 3;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://freddynails.co.za";

function hhmm(t) {
  return String(t || "").slice(0, 5);
}

function toMin(t) {
  const [h, m] = String(t || "0:0").split(":").map(Number);
  return h * 60 + (m || 0);
}

function saToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" });
}

function saNowMinutes() {
  const text = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Johannesburg",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
  const [h, m] = text.split(":").map(Number);
  return (h % 24) * 60 + m;
}

function niceDate(date) {
  return new Date(date + "T00:00:00+02:00").toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Africa/Johannesburg",
  });
}

function lengthText(minutes) {
  const hours = Math.round((minutes / 60) * 2) / 2;
  if (hours <= 0) return "";
  return hours === 1 ? "about 1 hour" : `about ${hours} hours`;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function emailHtml({ name, dateText, startText, length }) {
  const first = escapeHtml(String(name || "").trim().split(" ")[0] || "there");
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#0c0b0a;">
  <div style="background-color:#0c0b0a;padding:32px 16px;font-family:Georgia,'Times New Roman',serif;">
    <div style="max-width:480px;margin:0 auto;background-color:#11100f;border:1px solid rgba(214,179,106,0.2);border-radius:6px;padding:32px 28px;color:#f4eee6;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#d6b36a;">Freddy Nails</p>
      <h1 style="margin:0 0 18px;font-size:26px;font-weight:normal;">A slot just opened up ✨</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#c9c0b6;">Hi ${first}, you asked us to tell you when a spot opened. One just did:</p>
      <div style="margin:0 0 20px;padding:16px;border:1px solid rgba(214,179,106,0.3);border-radius:6px;">
        <p style="margin:0;font-size:18px;color:#f4eee6;">${escapeHtml(dateText)}</p>
        <p style="margin:6px 0 0;font-size:15px;color:#d6b36a;">From ${escapeHtml(startText)}${length ? ` · ${escapeHtml(length)} available` : ""}</p>
      </div>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#c9c0b6;">Slots go to whoever books first, so don&rsquo;t wait too long.</p>
      <p style="margin:0 0 22px;"><a href="${SITE_URL}/#booking" style="display:inline-block;background-color:#d6b36a;color:#11100f;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;padding:12px 22px;border-radius:6px;">Book this slot</a></p>
      <p style="margin:0;font-size:12px;line-height:1.6;color:#9f978f;">Not for you? No problem, just ignore this email. You&rsquo;ll stay on the waitlist for the next opening.</p>
    </div>
  </div>
</body></html>`;
}

export async function notifyWaitlistForCancelledBooking(supabase, appointmentId) {
  try {
    const { data: appt } = await supabase
      .from("appointments")
      .select("id, customer_email, customer_phone")
      .eq("id", appointmentId)
      .maybeSingle();

    const { data: rows } = await supabase
      .from("appointment_clients")
      .select("booking_date, start_time, end_time")
      .eq("appointment_id", appointmentId)
      .order("client_number", { ascending: true });

    const today = saToday();
    const nowMin = saNowMinutes();
    const slots = (rows || [])
      .filter((r) => r.booking_date > today || (r.booking_date === today && toMin(r.start_time) > nowMin))
      .map((r) => ({ date: r.booking_date, start: hhmm(r.start_time), minutes: toMin(r.end_time) - toMin(r.start_time) }));
    if (!slots.length) return { notified: 0 };

    const { data: waiting, error } = await supabase
      .from("waitlist")
      .select("id, name, phone, email, wanted_date, created_at")
      .eq("status", "waiting")
      .not("email", "is", null)
      .order("created_at", { ascending: true })
      .limit(300);
    if (error || !waiting?.length) return { notified: 0 };

    const cancelledEmail = String(appt?.customer_email || "").trim().toLowerCase();
    const cancelledPhone = String(appt?.customer_phone || "").replace(/\D/g, "").slice(-9);

    const notified = new Set();
    for (const slot of slots) {
      const candidates = waiting
        .filter((w) => !notified.has(w.id))
        .filter((w) => !w.wanted_date || w.wanted_date === slot.date)
        .filter((w) => String(w.email || "").trim().toLowerCase() !== cancelledEmail)
        .filter((w) => !cancelledPhone || String(w.phone || "").replace(/\D/g, "").slice(-9) !== cancelledPhone)
        // People who asked for this exact day go first, then "any day" people.
        .sort((a, b) => (a.wanted_date ? 0 : 1) - (b.wanted_date ? 0 : 1));

      let count = 0;
      for (const w of candidates) {
        if (count >= MAX_PER_SLOT) break;
        const dateText = niceDate(slot.date);
        const result = await sendEmail({
          to: w.email,
          subject: "A slot just opened at Freddy Nails ✨",
          html: emailHtml({ name: w.name, dateText, startText: slot.start, length: lengthText(slot.minutes) }),
        });
        if (!result.ok) continue;

        await supabase
          .from("waitlist")
          .update({
            status: "offered",
            offered_at: new Date().toISOString(),
            offered_slot: `${dateText} at ${slot.start}`,
          })
          .eq("id", w.id);
        notified.add(w.id);
        count += 1;
      }
    }
    return { notified: notified.size };
  } catch (error) {
    console.error("Waitlist notification error:", error);
    return { notified: 0 };
  }
}
