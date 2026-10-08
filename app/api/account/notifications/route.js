import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  isPushConfigured,
  getVapidPublicKey,
  sendPushToProfile,
} from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function getUser(request) {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.replace("Bearer ", "").trim();
  if (!token) return null;
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);
  return error || !user ? null : user;
}

const unauthorized = () =>
  NextResponse.json({ error: "Please log in again." }, { status: 401 });

export async function GET(request) {
  const user = await getUser(request);
  if (!user) return unauthorized();

  const [{ data: prefs }, { data: subs }] = await Promise.all([
    supabaseAdmin
      .from("notification_prefs")
      .select("appointment_email, rebook_email")
      .eq("profile_id", user.id)
      .maybeSingle(),
    supabaseAdmin
      .from("push_subscriptions")
      .select("endpoint")
      .eq("profile_id", user.id),
  ]);

  return NextResponse.json({
    pushAvailable: isPushConfigured(),
    publicKey: isPushConfigured() ? getVapidPublicKey() : "",
    endpoints: (subs || []).map((s) => s.endpoint),
    prefs: {
      appointment_email: prefs?.appointment_email ?? true,
      rebook_email: prefs?.rebook_email ?? false,
    },
  });
}

export async function POST(request) {
  const user = await getUser(request);
  if (!user) return unauthorized();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const action = body?.action;

  if (action === "subscribe") {
    const sub = body.subscription;
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
    }
    const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
      {
        profile_id: user.id,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        user_agent: (request.headers.get("user-agent") || "").slice(0, 300),
      },
      { onConflict: "endpoint" }
    );
    if (error) {
      console.error("Subscribe error:", error);
      return NextResponse.json({ error: "Could not save notifications." }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (action === "unsubscribe") {
    if (!body.endpoint) {
      return NextResponse.json({ error: "Missing endpoint." }, { status: 400 });
    }
    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", body.endpoint)
      .eq("profile_id", user.id);
    return NextResponse.json({ success: true });
  }

  if (action === "prefs") {
    const { error } = await supabaseAdmin.from("notification_prefs").upsert(
      {
        profile_id: user.id,
        appointment_email: Boolean(body.appointment_email),
        rebook_email: Boolean(body.rebook_email),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" }
    );
    if (error) {
      console.error("Prefs error:", error);
      return NextResponse.json({ error: "Could not save your choices." }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (action === "test") {
    const delivered = await sendPushToProfile(supabaseAdmin, user.id, {
      title: "Freddy Nails 💅",
      body: "Notifications are on. We'll remind you before your appointments.",
      url: "/account",
      tag: "test",
    });
    return NextResponse.json({ success: delivered > 0, delivered });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
