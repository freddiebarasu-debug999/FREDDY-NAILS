import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(body, status = 200) {
  return Response.json(body, { status });
}

function missingTable(error) {
  return error?.code === "42P01" || /announcements/.test(error?.message || "");
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  const { supabase } = auth;

  const { data, error } = await supabase
    .from("announcements")
    .select("message, active")
    .eq("id", 1)
    .maybeSingle();
  if (error) {
    if (missingTable(error)) return json({ message: "", active: false, ready: false });
    console.error("Admin announcement GET error:", error);
    return json({ error: "Could not load the banner." }, 500);
  }
  return json({ message: data?.message || "", active: data?.active === true, ready: true });
}

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  const { supabase } = auth;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const message = String(body.message || "").trim().slice(0, 160);
  const active = !!body.active;
  if (active && !message) return json({ error: "Type a message before switching the banner on." }, 400);

  const { error } = await supabase
    .from("announcements")
    .upsert({ id: 1, message, active, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) {
    if (missingTable(error)) return json({ error: "The banner table has not been created in Supabase yet. Run the SQL first." }, 400);
    console.error("Admin announcement POST error:", error);
    return json({ error: error.message || "Could not save the banner." }, 500);
  }
  return json({ saved: true });
}
