function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request) {
  try {
    const body = await request.json();

    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim();

    if (!name || !email) {
      return Response.json(
        { error: "Name and email are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error("RESEND_API_KEY is not configured.");

      return Response.json(
        { error: "Email service is not configured." },
        { status: 500 }
      );
    }

    const safeName = escapeHtml(name);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "Freddy Nails <onboarding@resend.dev>",

        to: [email],

        subject: "Welcome to Freddy Nails ✨",

        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Freddy Nails</title>
</head>

<body style="margin:0;padding:0;background:#0f0e0d;color:#f4eee6;font-family:Arial,Helvetica,sans-serif;">

  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="background:#0f0e0d;margin:0;padding:0;"
  >
    <tr>
      <td align="center" style="padding:36px 16px;">

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="max-width:620px;background:#181614;border:1px solid rgba(214,179,106,0.25);"
        >

          <!-- HEADER -->

          <tr>
            <td align="center" style="padding:38px 30px 24px;">

              <img
                src="https://freddynails.co.za/watermark.png"
                alt="Freddy Nails"
                width="82"
                style="display:block;width:82px;height:auto;max-width:82px;margin:0 auto 20px;border:0;"
              />

              <div
                style="
                  color:#d6b36a;
                  font-size:11px;
                  font-weight:bold;
                  letter-spacing:4px;
                  text-transform:uppercase;
                "
              >
                FREDDY NAILS
              </div>

              <div
                style="
                  width:48px;
                  height:1px;
                  background:#d6b36a;
                  margin:20px auto 0;
                "
              ></div>

            </td>
          </tr>

          <!-- MAIN -->

          <tr>
            <td style="padding:10px 38px 38px;">

              <p
                style="
                  margin:0 0 10px;
                  color:#d6b36a;
                  font-size:11px;
                  font-weight:bold;
                  letter-spacing:3px;
                  text-transform:uppercase;
                "
              >
                Welcome to the experience
              </p>

              <h1
                style="
                  margin:0;
                  color:#f4eee6;
                  font-family:Georgia,'Times New Roman',serif;
                  font-size:36px;
                  line-height:1.2;
                  font-weight:400;
                "
              >
                Welcome, ${safeName} ✨
              </h1>

              <p
                style="
                  margin:24px 0 0;
                  color:#c9c0b6;
                  font-size:15px;
                  line-height:1.8;
                "
              >
                Congratulations! Your Freddy Nails account has officially
                been created.
              </p>

              <p
                style="
                  margin:14px 0 0;
                  color:#c9c0b6;
                  font-size:15px;
                  line-height:1.8;
                "
              >
                You're now part of the Freddy Nails experience — where
                every set is created with detail, personality and precision.
              </p>

              <!-- BENEFITS -->

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="margin-top:30px;border-top:1px solid rgba(255,255,255,0.08);"
              >

                <tr>
                  <td
                    style="
                      padding:18px 0;
                      border-bottom:1px solid rgba(255,255,255,0.08);
                    "
                  >
                    <strong
                      style="
                        color:#d6b36a;
                        font-size:12px;
                        letter-spacing:1px;
                      "
                    >
                      YOUR ACCOUNT
                    </strong>

                    <br />

                    <span
                      style="
                        color:#a79a87;
                        font-size:13px;
                        line-height:1.6;
                      "
                    >
                      Manage your personal details and Freddy Nails
                      appointments in one place.
                    </span>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:18px 0;
                      border-bottom:1px solid rgba(255,255,255,0.08);
                    "
                  >
                    <strong
                      style="
                        color:#d6b36a;
                        font-size:12px;
                        letter-spacing:1px;
                      "
                    >
                      YOUR APPOINTMENTS
                    </strong>

                    <br />

                    <span
                      style="
                        color:#a79a87;
                        font-size:13px;
                        line-height:1.6;
                      "
                    >
                      Keep track of upcoming bookings, deposits and
                      appointment status.
                    </span>
                  </td>
                </tr>

                <tr>
                  <td style="padding:18px 0;">
                    <strong
                      style="
                        color:#d6b36a;
                        font-size:12px;
                        letter-spacing:1px;
                      "
                    >
                      YOUR FREDDY NAILS EXPERIENCE
                    </strong>

                    <br />

                    <span
                      style="
                        color:#a79a87;
                        font-size:13px;
                        line-height:1.6;
                      "
                    >
                      Explore the latest nail artistry, services and
                      signature Freddy Nails looks.
                    </span>
                  </td>
                </tr>

              </table>

              <!-- ACCOUNT BUTTON -->

              <table
                role="presentation"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="margin:30px 0 12px;"
              >
                <tr>
                  <td>
                    <a
                      href="https://freddynails.co.za/account"
                      style="
                        display:inline-block;
                        background:#d6b36a;
                        color:#11100f;
                        text-decoration:none;
                        padding:14px 23px;
                        font-size:12px;
                        font-weight:bold;
                        letter-spacing:1.5px;
                        text-transform:uppercase;
                      "
                    >
                      My Account →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- BOOKING BUTTON -->

              <table
                role="presentation"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="margin:0 0 32px;"
              >
                <tr>
                  <td>
                    <a
                      href="https://freddynails.co.za/#booking"
                      style="
                        display:inline-block;
                        border:1px solid rgba(214,179,106,0.65);
                        color:#d6b36a;
                        text-decoration:none;
                        padding:13px 23px;
                        font-size:12px;
                        font-weight:bold;
                        letter-spacing:1.5px;
                        text-transform:uppercase;
                      "
                    >
                      Book an Appointment
                    </a>
                  </td>
                </tr>
              </table>

              <!-- SOCIAL -->

              <div
                style="
                  border-top:1px solid rgba(255,255,255,0.08);
                  padding-top:25px;
                "
              >

                <p
                  style="
                    margin:0 0 14px;
                    color:#817970;
                    font-size:10px;
                    font-weight:bold;
                    letter-spacing:2px;
                    text-transform:uppercase;
                  "
                >
                  Follow Freddy Nails
                </p>

                <p
                  style="
                    margin:0;
                    font-size:13px;
                    line-height:1.9;
                  "
                >
                  <a
                    href="https://instagram.com/nailsby_freddy"
                    style="color:#d6b36a;text-decoration:none;"
                  >
                    Instagram
                  </a>

                  <span style="color:#5e5953;padding:0 8px;">•</span>

                  <a
                    href="https://tiktok.com/@nailsby_freddy"
                    style="color:#d6b36a;text-decoration:none;"
                  >
                    TikTok
                  </a>

                  <span style="color:#5e5953;padding:0 8px;">•</span>

                  <a
                    href="https://wa.me/27710888897"
                    style="color:#d6b36a;text-decoration:none;"
                  >
                    WhatsApp
                  </a>
                </p>

              </div>

            </td>
          </tr>

          <!-- FOOTER -->

          <tr>
            <td
              align="center"
              style="
                border-top:1px solid rgba(255,255,255,0.08);
                padding:26px 24px 30px;
              "
            >

              <p
                style="
                  margin:0;
                  color:#d6b36a;
                  font-family:Georgia,'Times New Roman',serif;
                  font-size:17px;
                "
              >
                Crafted to Perfection.
              </p>

              <p
                style="
                  margin:10px 0 0;
                  color:#817970;
                  font-size:11px;
                  line-height:1.6;
                "
              >
                Freddy Nails Studio
                <br />
                <a
                  href="https://freddynails.co.za"
                  style="color:#817970;text-decoration:none;"
                >
                  freddynails.co.za
                </a>
              </p>

              <p
                style="
                  margin:18px 0 0;
                  color:#5f5a55;
                  font-size:10px;
                "
              >
                © 2026 Freddy Nails Studio.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
        `,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend error:", result);

      return Response.json(
        {
          error: "The welcome email could not be sent.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      id: result?.id || null,
    });
  } catch (error) {
    console.error("Welcome email error:", error);

    return Response.json(
      {
        error: "Something went wrong while sending the welcome email.",
      },
      { status: 500 }
    );
  }
}
