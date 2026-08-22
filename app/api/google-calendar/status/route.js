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
export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("google_calendar_connections")
      .select("email, calendar_id, updated_at")
      .eq("provider", "google")
      .maybeSingle();
    if (error) {
      console.error("Google Calendar status error:", error);
      return NextResponse.json(
        {
          connected: false,
          error: "Unable to check Google Calendar connection.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({
      connected: Boolean(data),
      email: data?.email || "",
      calendarId: data?.calendar_id || "",
      updatedAt: data?.updated_at || null,
    });
  } catch (error) {
    console.error("Google Calendar status route error:", error);
    return NextResponse.json(
      {
        connected: false,
        error: "Google Calendar is not configured.",
      },
      { status: 500 }
    );
  }
}
