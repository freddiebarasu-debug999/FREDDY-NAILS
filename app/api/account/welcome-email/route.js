export async function POST(request) {
  try {
    const body = await request.json();

    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!name || !email) {
      return Response.json(
        {
          error: "Name and email are required.",
        },
        {
          status: 400,
        }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error("Missing RESEND_API_KEY environment variable.");

      return Response.json(
        {
          error: "Email service is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Use your verified Freddy Nails sender when available.
     *
     * If RESEND_FROM_EMAIL is already configured in Vercel,
     * it will be used automatically.
     *
     * Otherwise Resend's onboarding sender is used.
     */
    const fromEmail =
      process.env.RESEND_FROM_EMAIL ||
      "Freddy Nails <onboarding@resend.dev>";

    const accountUrl = "https://freddynails.co.za/account";

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>Welcome to Freddy Nails</title>
        </head>

        <body
          style="
            margin:0;
            padding:0;
            background:#11100f;
            color:#f4eee6;
            font-family:Arial,Helvetica,sans-serif;
          "
        >
          <div
            style="
              max-width:620px;
              margin:0 auto;
              padding:40px 20px;
            "
          >
            <div
              style="
                border:1px solid rgba(214,179,106,0.25);
                background:#181614;
                padding:40px 30px;
              "
            >
              <div
                style="
                  text-align:center;
                  margin-bottom:32px;
                "
              >
                <div
                  style="
                    font-family:Georgia,'Times New Roman',serif;
                    font-size:28px;
                    color:#f4eee6;
                  "
                >
                  Freddy
                  <span style="color:#d6b36a;">
                    Nails
                  </span>
                </div>

                <div
                  style="
                    margin-top:8px;
                    color:#d6b36a;
                    font-size:10px;
                    font-weight:bold;
                    letter-spacing:3px;
                    text-transform:uppercase;
                  "
                >
                  Crafted to Perfection
                </div>
              </div>

              <div
                style="
                  height:1px;
                  background:rgba(214,179,106,0.25);
                  margin-bottom:32px;
                "
              ></div>

              <p
                style="
                  margin:0 0 10px;
                  color:#d6b36a;
                  font-size:11px;
                  font-weight:bold;
                  letter-spacing:2px;
                  text-transform:uppercase;
                "
              >
                Welcome to Freddy Nails
              </p>

              <h1
                style="
                  margin:0 0 20px;
                  font-family:Georgia,'Times New Roman',serif;
                  font-size:32px;
                  line-height:1.2;
                  font-weight:500;
                  color:#f4eee6;
                "
              >
                Welcome, ${escapeHtml(name)} ✨
              </h1>

              <p
                style="
                  margin:0 0 20px;
                  color:#c9c0b6;
                  font-size:15px;
                  line-height:1.8;
                "
              >
                Congratulations! Your Freddy Nails account has
                officially been created.
              </p>

              <p
                style="
                  margin:0 0 26px;
                  color:#c9c0b6;
                  font-size:15px;
                  line-height:1.8;
                "
              >
                You're now part of the Freddy Nails experience,
                where every set is crafted with detail, creativity
                and care.
              </p>

              <div
                style="
                  border-top:1px solid rgba(255,255,255,0.08);
                  border-bottom:1px solid rgba(255,255,255,0.08);
                  padding:22px 0;
                  margin:28px 0;
                "
              >
                <p
                  style="
                    margin:0 0 12px;
                    color:#f4eee6;
                    font-size:14px;
                    font-weight:bold;
                  "
                >
                  Your account gives you access to:
                </p>

                <p
                  style="
                    margin:8px 0;
                    color:#a79a87;
                    font-size:14px;
                  "
                >
                  ✦ Book your Freddy Nails appointments
                </p>

                <p
                  style="
                    margin:8px 0;
                    color:#a79a87;
                    font-size:14px;
                  "
                >
                  ✦ View upcoming appointments
                </p>

                <p
                  style="
                    margin:8px 0;
                    color:#a79a87;
                    font-size:14px;
                  "
                >
                  ✦ Track your booking and deposit status
                </p>

                <p
                  style="
                    margin:8px 0;
                    color:#a79a87;
                    font-size:14px;
                  "
                >
                  ✦ View your appointment history
                </p>

                <p
                  style="
                    margin:8px 0;
                    color:#a79a87;
                    font-size:14px;
                  "
                >
                  ✦ Keep your contact details saved
                </p>
              </div>

              <div style="text-align:center;margin:32px 0;">
                <a
                  href="${accountUrl}"
                  style="
                    display:inline-block;
                    padding:14px 25px;
                    background:#d6b36a;
                    color:#11100f;
                    text-decoration:none;
                    font-size:12px;
                    font-weight:bold;
                    letter-spacing:1px;
                    text-transform:uppercase;
                  "
                >
                  Go to My Account →
                </a>
              </div>

              <p
                style="
                  margin:30px 0 0;
                  color:#8f877e;
                  font-size:13px;
                  line-height:1.7;
                  text-align:center;
                "
              >
                We look forward to creating something beautiful
                for you.
              </p>

              <p
                style="
                  margin:22px 0 0;
                  color:#d6b36a;
                  font-family:Georgia,'Times New Roman',serif;
                  font-size:18px;
                  text-align:center;
                "
              >
                Freddy Nails
              </p>

              <p
                style="
                  margin:6px 0 0;
                  color:#817970;
                  font-size:11px;
                  text-align:center;
                "
              >
                Crafted to Perfection
              </p>
            </div>

            <p
              style="
                margin:22px 0 0;
                color:#625c56;
                font-size:10px;
                line-height:1.6;
                text-align:center;
              "
            >
              This email was sent because a Freddy Nails account
              was created using this email address.
            </p>
          </div>
        </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: "Welcome to Freddy Nails ✨",
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);

      return Response.json(
        {
          error:
            data?.message ||
            data?.error ||
            "Unable to send welcome email.",
        },
        {
          status: response.status,
        }
      );
    }

    return Response.json({
      success: true,
      id: data?.id || null,
    });
  } catch (error) {
    console.error("Welcome email route error:", error);

    return Response.json(
      {
        error: "Unable to send welcome email.",
      },
      {
        status: 500,
      }
    );
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
