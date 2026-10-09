import webpush from "web-push";

const SITE_URL = "https://freddynails.co.za";
const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL ||
  "Freddy Nails <bookings@freddynails.co.za>";
const REPLY_TO =
  process.env.REPLY_TO_EMAIL ||
  process.env.OWNER_EMAIL ||
  "freddynails.business@gmail.com";

let vapidReady = false;

export function getVapidPublicKey() {
  return (
    process.env.VAPID_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    ""
  );
}

export function isPushConfigured() {
  return Boolean(getVapidPublicKey() && process.env.VAPID_PRIVATE_KEY);
}

function setupVapid() {
  if (vapidReady) return true;
  if (!isPushConfigured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:bookings@freddynails.co.za",
    getVapidPublicKey(),
    process.env.VAPID_PRIVATE_KEY
  );
  vapidReady = true;
  return true;
}

/**
 * Send a push notification to every saved device of one client.
 * Dead subscriptions (client uninstalled / turned off) are removed.
 * Returns the number of devices reached.
 */
export async function sendPushToProfile(supabaseAdmin, profileId, payload) {
  if (!setupVapid()) return 0;

  const { data: subs, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("profile_id", profileId);

  if (error || !subs?.length) return 0;

  let delivered = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
        { TTL: 60 * 60 * 12 }
      );
      delivered += 1;
    } catch (err) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await supabaseAdmin
          .from("push_subscriptions")
          .delete()
          .eq("id", sub.id);
      } else {
        console.error("Push send failed:", err?.statusCode, err?.body || err?.message);
      }
    }
  }

  return delivered;
}

export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !to) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        reply_to: REPLY_TO,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      console.error("Resend failed:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend error:", err);
    return false;
  }
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function shell({ heading, lines, buttonLabel, buttonUrl }) {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0c0b0a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c0b0a;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#141210;border:1px solid rgba(214,179,106,0.35);border-radius:10px;">
<tr><td align="center" style="padding:28px 24px 8px;">
<img src="${SITE_URL}/freddy-nails-logo-email.png" width="72" height="72" alt="Freddy Nails" style="border-radius:50%;display:block;">
</td></tr>
<tr><td align="center" style="padding:8px 28px 4px;font-family:Georgia,serif;font-size:24px;color:#d6b36a;">${esc(heading)}</td></tr>
<tr><td style="padding:12px 32px 8px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#efe6da;">
${lines.map((l) => `<p style="margin:0 0 12px;">${l}</p>`).join("")}
</td></tr>
<tr><td align="center" style="padding:12px 32px 28px;">
<a href="${buttonUrl}" style="display:inline-block;background:#ad8a4e;color:#0c0b0a;font-family:Arial,sans-serif;font-weight:bold;font-size:14px;text-decoration:none;padding:13px 28px;border-radius:3px;">${esc(buttonLabel)}</a>
</td></tr>
<tr><td align="center" style="padding:0 24px 24px;font-family:Arial,sans-serif;font-size:11px;line-height:1.5;color:#9f978f;">
Freddy Nails &middot; 8 Rhodes Street, Quigney, East London<br>
You can change these reminders any time in <a href="${SITE_URL}/account" style="color:#d6b36a;">your account</a>.
</td></tr>
</table></td></tr></table></body></html>`;
}

export function appointmentReminderEmail({ name, service, dateLabel, timeLabel }) {
  const first = esc(String(name || "").split(" ")[0] || "there");
  return {
    subject: `See you tomorrow at ${timeLabel} 💅`,
    html: shell({
      heading: "Your appointment is tomorrow",
      lines: [
        `Hi ${first},`,
        `A quick reminder that you're booked in at Freddy Nails.`,
        `<strong style="color:#d6b36a;">${esc(service)}</strong><br>${esc(dateLabel)} at ${esc(timeLabel)}`,
        `8 Rhodes Street, Quigney, East London. Need to change something? Message us on WhatsApp on +27 71 088 8897.`,
      ],
      buttonLabel: "View my booking",
      buttonUrl: `${SITE_URL}/account`,
    }),
  };
}

export function rebookEmail({ name }) {
  const first = esc(String(name || "").split(" ")[0] || "there");
  return {
    subject: "Time for a fresh set? 💅",
    html: shell({
      heading: "Time for a fresh set?",
      lines: [
        `Hi ${first},`,
        `It's been a few weeks since your last visit to Freddy Nails. Your nails are probably ready for some attention.`,
        `Pick a time that suits you and we'll take care of the rest.`,
      ],
      buttonLabel: "Book my next set",
      buttonUrl: `${SITE_URL}/account/book`,
    }),
  };
}

export function formatDateLabel(dateStr) {
  const d = new Date(`${dateStr}T00:00:00+02:00`);
  return d.toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Africa/Johannesburg",
  });
}

export function formatTimeLabel(timeStr) {
  if (!timeStr) return "";
  const [h, m] = String(timeStr).split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "pm" : "am";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${m || "00"} ${suffix}`;
}
