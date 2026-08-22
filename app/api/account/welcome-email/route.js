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

    const escapeHtml = (value) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

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
          <html>
            <body style="margin:0;padding:0;background:#11100f;color:#f4eee6;font-family:Arial,Helvetica,sans-serif;">
              <div style="max-width:620px;margin:0 auto;padding:40px 24px;">
                
                <div style="border:1px solid rgba(214,179,106,0.25);background:#181614;padding:40px 30px;">
                  
                  <p style="margin:0 0 12px;color:#d6b36a;font-size:12px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;">
                    Freddy Nails
                  </p>

                  <h1 style="margin:0;color:#f4eee6;font-family:Georgia,serif;font-size:34px;font-weight:400;">
                    Welcome, ${safeName} ✨
                  </h1>

                  <div style="width:55px;height:1px;background:#d6b36a;margin:22px 0;"></div>

                  <p style="color:#c9c0b6;font-size:15px;line-height:1.7;">
                    Congratulations! Your Freddy Nails account has been created successfully.
                  </p>

                  <p style="color:#c9c0b6;font-size:15px;line-height:1.7;">
                    Your account makes it easier to manage your appointments,
                    keep your details saved and stay connected with your Freddy Nails experience.
                  </p>

                  <div style="margin:30px 0;">
                    <a
                      href="https://freddynails.co.za/account"
                      style="display:inline-block;background:#d6b36a;color:#11100f;text-decoration:none;padding:14px 22px;font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;"
                    >
                      Visit My Account
                    </a>
                  </div>

                  <p style="color:#8f877e;font-size:13px;line-height:1.6;">
                    We look forward to welcoming you to Freddy Nails.
                  </p>

                  <p style="margin-top:28px;color:#d6b36a;font-family:Georgia,serif;font-size:16px;">
                    Crafted to Perfection.
                  </p>

                </div>

                <p style="text-align:center;color:#817970;font-size:11px;margin-top:22px;">
                  © 2026 Freddy Nails Studio.
                </p>

              </div>
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
