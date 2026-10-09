// ---------------------------------------------------------
// EMAIL
// ---------------------------------------------------------

const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL ||
  "Freddy Nails <bookings@freddynails.co.za>";

// The business inbox. Owner alerts go here, and client replies come back here.
export const OWNER_EMAIL =
  process.env.OWNER_EMAIL || "freddynails.business@gmail.com";

const REPLY_TO = process.env.REPLY_TO_EMAIL || OWNER_EMAIL;

const LOGO_URL =
  "https://freddynails.co.za/freddy-nails-logo-email.png";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Sends one email through Resend. Retries a couple of times if Resend is
// busy, and ALWAYS returns { ok, error } so callers can see what happened.
export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("RESEND_API_KEY is not set; skipping email send.");
    return { ok: false, error: "RESEND_API_KEY is not set in Vercel." };
  }

  let lastError = "Unknown error";

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
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

      if (res.ok) {
        console.log("Email sent to", to);
        return { ok: true };
      }

      const errText = await res.text();
      lastError = "Resend " + res.status + ": " + errText;
      console.error("Resend send failed (attempt " + attempt + "):", to, lastError);

      // Only retry when Resend is busy or having a hiccup.
      if (res.status !== 429 && res.status < 500) break;
    } catch (err) {
      lastError = "Network error: " + (err && err.message ? err.message : String(err));
      console.error("Error sending email to", to, err);
    }

    if (attempt < 3) await wait(attempt * 1200);
  }

  return { ok: false, error: lastError };
}

// ---------------------------------------------------------
// DATE / TIME FORMATTING
// ---------------------------------------------------------

function formatBookingDate(dateStr) {
  if (!dateStr) return "—";

  const date = new Date(`${dateStr}T00:00:00+02:00`);

  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  return date.toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  });
}

function formatTime(timeStr) {
  if (!timeStr) return "—";

  const parts = timeStr.split(":");

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return timeStr;
  }

  const period = hours >= 12 ? "PM" : "AM";
  const displayHour =
    hours % 12 || 12;

  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

function toGoogleCalDate(dateStr, timeStr) {
  if (!dateStr || !timeStr) {
    return null;
  }

  const hhmm = String(timeStr).slice(0, 5);

  const d = new Date(
    `${dateStr}T${hhmm}:00+02:00`
  );

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return (
    d.toISOString()
      .replace(/[-:]/g, "")
      .split(".")[0] + "Z"
  );
}

// ---------------------------------------------------------
// OWNER NOTIFICATION
// ---------------------------------------------------------

export async function sendOwnerNotification(appointment) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1B1714;">
      
      <h2 style="color: #AD8A4E; margin-bottom: 4px;">
        New paid booking 💅
      </h2>

      <p style="margin-top: 0; color: #555;">
        A deposit has been confirmed on Freddy Nails.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        
        <tr>
          <td style="padding: 6px 0; color: #888;">Client</td>
          <td style="padding: 6px 0; font-weight: bold;">
            ${appointment.customer_name}
          </td>
        </tr>

        <tr>
          <td style="padding: 6px 0; color: #888;">Phone</td>
          <td style="padding: 6px 0;">
            ${appointment.customer_phone}
          </td>
        </tr>

        <tr>
          <td style="padding: 6px 0; color: #888;">Email</td>
          <td style="padding: 6px 0;">
            ${appointment.customer_email || "—"}
          </td>
        </tr>

        <tr>
          <td style="padding: 6px 0; color: #888;">Booking summary</td>
          <td style="padding: 6px 0;">
            ${appointment.service_name}
          </td>
        </tr>

        <tr>
          <td style="padding: 6px 0; color: #888;">Clients</td>
          <td style="padding: 6px 0;">
            ${appointment.client_count}
          </td>
        </tr>

        <tr>
          <td style="padding: 6px 0; color: #888;">Deposit paid</td>
          <td style="padding: 6px 0; font-weight: bold;">
            R${appointment.deposit_amount}
          </td>
        </tr>

        ${
          appointment.notes
            ? `
              <tr>
                <td style="padding: 6px 0; color: #888;">Notes</td>
                <td style="padding: 6px 0;">
                  ${appointment.notes}
                </td>
              </tr>
            `
            : ""
        }

      </table>

      <p style="margin-top: 20px; font-size: 13px; color: #999;">
        Freddy Nails booking system
      </p>

    </div>
  `;

  return await sendEmail({
    to: OWNER_EMAIL,
    subject:
      `New paid booking — ${appointment.customer_name}`,
    html,
  });
}

// ---------------------------------------------------------
// CUSTOMER CONFIRMATION
// ---------------------------------------------------------

export async function sendCustomerConfirmation(appointment) {
  if (!appointment.customer_email) {
    console.log(
      "No customer email on file; skipping customer confirmation."
    );
    return { ok: false, error: "No customer email on file." };
  }

  const dateLabel = formatBookingDate(
    appointment.booking_date
  );

  const timeLabel = formatTime(
    appointment.start_time
  );

  const whatsappText = encodeURIComponent(
    `Hey Freddy! ${appointment.customer_name} here.\nI just booked an appointment for ${dateLabel} at ${timeLabel}.\nI can't wait to get this set done💅`
  );

  const whatsappUrl =
    `https://wa.me/27710888897?text=${whatsappText}`;

  const startUTC = toGoogleCalDate(
    appointment.booking_date,
    appointment.start_time
  );

  const endUTC = toGoogleCalDate(
    appointment.booking_date,
    appointment.end_time
  );

  const googleCalUrl =
    startUTC && endUTC
      ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
          "Freddy Nails Appointment"
        )}&dates=${startUTC}/${endUTC}&details=${encodeURIComponent(
          appointment.service_name ||
            "Nail appointment"
        )}&location=${encodeURIComponent(
          "8 Rhodes St, Quigney, East London"
        )}`
      : null;

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />
    <title>Freddy Nails Appointment</title>
  </head>

  <body style="margin:0; padding:0; background-color:#0c0b0a;">

    <div
      style="
        background-color:#0c0b0a;
        padding:32px 16px;
        font-family:Georgia, 'Times New Roman', serif;
      "
    >

      <div
        style="
          max-width:480px;
          margin:0 auto;
          background-color:#11100f;
          border:1px solid rgba(214,179,106,0.2);
          border-radius:6px;
          overflow:hidden;
        "
      >

        <!-- HEADER -->

        <div
          style="
            background-color:#181614;
            padding:28px 24px;
            text-align:center;
            border-bottom:1px solid rgba(214,179,106,0.2);
          "
        >

          <img
            src="${LOGO_URL}"
            alt="Freddy Nails"
            width="72"
            height="72"
            style="
              display:block;
              margin:0 auto;
              width:72px;
              height:72px;
              border-radius:50%;
            "
          />

          <p
            style="
              margin:14px 0 0;
              font-style:italic;
              font-size:26px;
              color:#d6b36a;
              letter-spacing:0.5px;
            "
          >
            Freddy Nails
          </p>

          <p
            style="
              margin:6px 0 0;
              font-size:11px;
              letter-spacing:3px;
              color:#8f877e;
              text-transform:uppercase;
            "
          >
            Beauty &middot; Confidence &middot; You
          </p>

        </div>

        <!-- CONTENT -->

        <div style="padding:32px 28px;">

          <!-- DATE + TIME -->

          <p
            style="
              margin:0;
              text-align:center;
              font-size:18px;
              color:#f4eee6;
              font-weight:bold;
            "
          >
            ${dateLabel} &middot; ${timeLabel}
          </p>

          <p
            style="
              margin:4px 0 0;
              text-align:center;
              font-size:12px;
              letter-spacing:1px;
              color:#8f877e;
              text-transform:uppercase;
            "
          >
            Freddy Nails Appointment
          </p>

          <!-- HEADING -->

          <h1
            style="
              margin:28px 0 0;
              text-align:center;
              font-size:30px;
              color:#f4eee6;
              font-weight:normal;
            "
          >
            You&rsquo;re all booked!
          </h1>

          <!-- MESSAGE -->

          <p
            style="
              margin:16px 0 0;
              text-align:center;
              font-size:15px;
              line-height:1.6;
              color:#c9c0b6;
            "
          >
            You&rsquo;re officially booked at Freddy Nails!
            We&rsquo;re excited to have you in the chair.
            Your appointment details are below &mdash;
            feel free to message Freddy on WhatsApp
            anytime with questions or special requests.
          </p>

          <!-- SUMMARY -->

          <table
            role="presentation"
            width="100%"
            style="
              margin-top:28px;
              border:1px solid rgba(214,179,106,0.25);
              border-radius:4px;
              border-collapse:collapse;
            "
          >

            <tr>
              <td
                style="
                  padding:14px 18px;
                  color:#8f877e;
                  font-size:13px;
                  border-bottom:1px solid rgba(255,255,255,0.06);
                "
              >
                Service
              </td>

              <td
                style="
                  padding:14px 18px;
                  color:#f4eee6;
                  font-size:13px;
                  font-weight:bold;
                  text-align:right;
                  border-bottom:1px solid rgba(255,255,255,0.06);
                "
              >
                ${appointment.service_name || "—"}
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:14px 18px;
                  color:#8f877e;
                  font-size:13px;
                  border-bottom:1px solid rgba(255,255,255,0.06);
                "
              >
                Date
              </td>

              <td
                style="
                  padding:14px 18px;
                  color:#f4eee6;
                  font-size:13px;
                  text-align:right;
                  border-bottom:1px solid rgba(255,255,255,0.06);
                "
              >
                ${dateLabel}
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:14px 18px;
                  color:#8f877e;
                  font-size:13px;
                  border-bottom:1px solid rgba(255,255,255,0.06);
                "
              >
                Time
              </td>

              <td
                style="
                  padding:14px 18px;
                  color:#f4eee6;
                  font-size:13px;
                  text-align:right;
                  border-bottom:1px solid rgba(255,255,255,0.06);
                "
              >
                ${timeLabel}
              </td>
            </tr>

            ${
              appointment.duration_minutes
                ? `
                  <tr>
                    <td
                      style="
                        padding:14px 18px;
                        color:#8f877e;
                        font-size:13px;
                        border-bottom:1px solid rgba(255,255,255,0.06);
                      "
                    >
                      Duration
                    </td>

                    <td
                      style="
                        padding:14px 18px;
                        color:#f4eee6;
                        font-size:13px;
                        text-align:right;
                        border-bottom:1px solid rgba(255,255,255,0.06);
                      "
                    >
                      ${appointment.duration_minutes} minutes
                    </td>
                  </tr>
                `
                : ""
            }

            <tr>
              <td
                style="
                  padding:14px 18px;
                  color:#8f877e;
                  font-size:13px;
                "
              >
                Deposit paid
              </td>

              <td
                style="
                  padding:14px 18px;
                  color:#d6b36a;
                  font-size:13px;
                  font-weight:bold;
                  text-align:right;
                "
              >
                R${appointment.deposit_amount}
              </td>
            </tr>

          </table>

          ${
            appointment.notes
              ? `
                <p
                  style="
                    margin:16px 0 0;
                    font-size:13px;
                    color:#8f877e;
                  "
                >
                  <strong style="color:#c9c0b6;">
                    Your notes:
                  </strong>
                  ${appointment.notes}
                </p>
              `
              : ""
          }

          <!-- WHATSAPP -->

          <a
            href="${whatsappUrl}"
            style="
              display:block;
              margin-top:28px;
              background-color:#d6b36a;
              color:#11100f;
              text-align:center;
              padding:16px;
              border-radius:4px;
              font-weight:bold;
              font-size:15px;
              text-decoration:none;
            "
          >
            Message Freddy on WhatsApp
          </a>

          <!-- CALENDAR -->

          ${
            googleCalUrl
              ? `
                <a
                  href="${googleCalUrl}"
                  style="
                    display:block;
                    margin-top:12px;
                    border:1px solid rgba(214,179,106,0.5);
                    color:#d6b36a;
                    text-align:center;
                    padding:15px;
                    border-radius:4px;
                    font-weight:bold;
                    font-size:14px;
                    text-decoration:none;
                  "
                >
                  Add to Calendar
                </a>
              `
              : ""
          }

          <!-- POLICIES -->

          <div
            style="
              margin-top:30px;
              padding-top:22px;
              border-top:1px solid rgba(255,255,255,0.08);
            "
          >

            <p
              style="
                margin:0 0 10px;
                font-size:11px;
                letter-spacing:2px;
                color:#8f877e;
                text-transform:uppercase;
                text-align:center;
              "
            >
              Good to know
            </p>

            <ul
              style="
                margin:0;
                padding:0 0 0 18px;
                font-size:12.5px;
                line-height:1.7;
                color:#9f978f;
              "
            >
              <li>
                Deposits are non-refundable, but
                appointments can be rescheduled with
                enough notice, subject to availability.
              </li>
              <li>
                Please give at least 24 hours&rsquo;
                notice to cancel or reschedule.
              </li>
              <li>
                A 15-minute grace period applies from
                your scheduled time &mdash; arriving
                later may result in your appointment
                being cancelled or rescheduled.
              </li>
              <li>
                No-shows without prior notice forfeit
                their deposit and may require a higher
                deposit for future bookings.
              </li>
            </ul>

          </div>

        </div>

        <!-- FOOTER -->

        <div
          style="
            padding:20px 24px;
            border-top:1px solid rgba(255,255,255,0.06);
            text-align:center;
          "
        >

          <p
            style="
              margin:0;
              font-size:12px;
              color:#8f877e;
            "
          >
            Freddy Nails &middot;
            8 Rhodes St, Quigney, East London
            (street parking available) &middot;
            @nailsby_freddy
          </p>

          <p
            style="
              margin:6px 0 0;
              font-size:12px;
              color:#665f56;
            "
          >
            Reply to this email or WhatsApp us anytime.
          </p>

        </div>

      </div>

    </div>

  </body>
  </html>
  `;

  return await sendEmail({
    to: appointment.customer_email,
    subject:
      "You're all booked! — Freddy Nails",
    html,
  });
}

