import { createClient } from "@supabase/supabase-js";

// Server-only helpers for the owner dashboard.
// The service-role key is read here, on the server, and is never sent to the browser.

export function getAdminSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Only the email address(es) listed in the ADMIN_EMAILS setting (Vercel
// environment variable, comma separated) may use the dashboard.
export async function requireAdmin(request) {
  const allowed = String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!allowed.length) {
    return {
      ok: false,
      status: 503,
      error: "The dashboard is not switched on yet: ADMIN_EMAILS is not set.",
    };
  }

  const header = request.headers.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return { ok: false, status: 401, error: "Please sign in." };
  }

  const token = header.slice(7).trim();
  if (!token) return { ok: false, status: 401, error: "Please sign in." };

  const supabase = getAdminSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user?.email) {
    return { ok: false, status: 401, error: "Please sign in again." };
  }
  if (!user.email_confirmed_at) {
    return { ok: false, status: 403, error: "Please confirm your email address first." };
  }
  if (!allowed.includes(user.email.toLowerCase())) {
    return { ok: false, status: 403, error: "This account is not allowed to use the dashboard." };
  }

  return { ok: true, user, supabase };
}
