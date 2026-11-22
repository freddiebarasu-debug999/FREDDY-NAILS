import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATUSES = ["waiting", "offered", "booked", "removed"];

function json(body, status = 200) {
  return Response.json(body, { status });
}

function missingTable(error) {
  return error?.code === "42P01" || /waitlist/.test(error?.message || "");
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  const { supabase } = auth;

  const { data, error } = await supabase
    .from("waitlist")
    .select("id, name, phone, email, service, flexible, notes, wanted_date, status, source, created_at, offered_at, offered_slot")
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) {
    if (missingTable(error)) return json({ entries: [], ready: false });
    console.error("Admin waitlist GET error:", error);
    return json({ error: "Could not load the waitlist." }, 500);
  }
  return json({ entries: data || [], ready: true });
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

  try {
    if (body.action === "add") {
      const name = String(body.name || "").trim().slice(0, 60);
      const phone = String(body.phone || "").trim().slice(0, 25);
      if (name.length < 2) return json({ error: "Enter the client's name." }, 400);
      if (phone.replace(/\D/g, "").length < 9) return json({ error: "Enter a valid WhatsApp number." }, 400);
      const email = String(body.email || "").trim().toLowerCase().slice(0, 120);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "That email address is not valid." }, 400);
      let wanted = null;
      if (body.wanted_date) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.wanted_date))) return json({ error: "Date is not valid." }, 400);
        wanted = body.wanted_date;
      }
      const { error } = await supabase.from("waitlist").insert({
        name,
        phone,
        email: email || null,
        service: String(body.service || "").trim().slice(0, 120) || null,
        flexible: String(body.flexible || "").trim().slice(0, 200) || null,
        notes: null,
        wanted_date: wanted,
        source: "owner",
      });
      if (error) {
        if (missingTable(error)) return json({ error: "The waitlist table has not been created in Supabase yet. Run the SQL first." }, 400);
        throw new Error(error.message);
      }
      return json({ saved: true });
    }

    if (body.action === "status") {
      const id = String(body.id || "");
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Entry not recognised." }, 400);
      if (!STATUSES.includes(body.status)) return json({ error: "Unknown status." }, 400);
      const { error } = await supabase.from("waitlist").update({ status: body.status }).eq("id", id);
      if (error) throw new Error(error.message);
      return json({ saved: true });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (error) {
    console.error("Admin waitlist POST error:", error);
    return json({ error: error.message || "Something went wrong." }, 500);
  }
}
