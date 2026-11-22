import { getAdminSupabase } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Public: the banner message shown on the website (if one is switched on).
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("announcements")
      .select("message, active")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data || !data.active || !String(data.message || "").trim()) {
      return Response.json({ message: null }, { headers });
    }
    return Response.json({ message: String(data.message).trim() }, { headers });
  } catch {
    return Response.json({ message: null }, { headers });
  }
}
