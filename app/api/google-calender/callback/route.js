import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const storedState = request.cookies.get(
    "google_calendar_oauth_state"
  )?.value;
  if (error) {
    return NextResponse.redirect(
      new URL(
        `/admin/calendar?error=${encodeURIComponent(error)}`,
        request.url
      )
    );
  }
  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      new URL(
        "/admin/calendar?error=invalid_oauth_state",
        request.url
      )
    );
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(
      new URL(
        "/admin/calendar?error=google_not_configured",
        request.url
      )
    );
  }
  try {
    const tokenResponse = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }).toString(),
      }
    );
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.refresh_token) {
      console.error("Google token exchange failed:", tokenData);
      return NextResponse.redirect(
        new URL(
          "/admin/calendar?error=token_exchange_failed",
          request.url
        )
      );
    }
    const accessToken = tokenData.access_token;
    const calendarResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const calendarData = await calendarResponse.json();
    if (!calendarResponse.ok) {
      console.error(
        "Google calendar lookup failed:",
        calendarData
      );
      return NextResponse.redirect(
        new URL(
          "/admin/calendar?error=calendar_lookup_failed",
          request.url
        )
      );
    }
    const email = calendarData.summaryOverride || calendarData.summary;
    const supabaseAdmin = getSupabaseAdmin();
    const { error: dbError } = await supabaseAdmin
      .from("google_calendar_connections")
      .upsert(
        {
          provider: "google",
          email,
          calendar_id: "primary",
          refresh_token: tokenData.refresh_token,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "provider",
        }
      );
    if (dbError) {
      console.error(
        "Failed to save Google Calendar connection:",
        dbError
      );
      return NextResponse.redirect(
        new URL(
          "/admin/calendar?error=database_save_failed",
          request.url
        )
      );
    }
    const response = NextResponse.redirect(
      new URL(
        "/admin/calendar?connected=1",
        request.url
      )
    );
    response.cookies.delete("google_calendar_oauth_state");
    return response;
  } catch (error) {
    console.error("Google Calendar callback error:", error);
    return NextResponse.redirect(
      new URL(
        "/admin/calendar?error=callback_failed",
        request.url
      )
    );
  }
}
