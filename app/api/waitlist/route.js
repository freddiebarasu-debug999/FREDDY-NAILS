import { getAdminSupabase } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(body, status = 200) {
  return Response.json(body, { status });
}

function phoneKey(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

function saToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" });
}

// Public: a client asks to be put on the waitlist.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  // Honeypot: real people never fill this hidden field in. Pretend it worked.
  if (body.website) return json({ ok: true });

  const name = String(body.name || "").trim().slice(0, 60);
  const phone = String(body.phone || "").trim().slice(0, 25);
  const email = String(body.email || "").trim().toLowerCase().slice(0, 120);
  const service = String(body.service || "").trim().slice(0, 120);
  const flexible = String(body.flexible || "").trim().slice(0, 200);
  const notes = String(body.notes || "").trim().slice(0, 300);
  const wantedDate = String(body.wanted_date || "").trim();

  if (name.length < 2) return json({ error: "Please enter your name." }, 400);
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return json({ error: "Please enter a valid WhatsApp number." }, 400);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Please enter a valid email address so we can tell you the moment a slot opens." }, 400);
  }

  let wanted = null;
  if (wantedDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(wantedDate)) return json({ error: "That date is not valid." }, 400);
    const today = saToday();
    const limit = new Date(today + "T00:00:00Z");
    limit.setUTCDate(limit.getUTCDate() + 366);
    if (wantedDate < today || wantedDate > limit.toISOString().slice(0, 10)) {
      return json({ error: "Please choose a date from today onwards." }, 400);
    }
    wanted = wantedDate;
  }

  try {
    const supabase = getAdminSupabase();

    const { data: waiting, error: listError } = await supabase
      .from("waitlist")
      .select("phone, wanted_date")
      .eq("status", "waiting")
      .limit(800);
    if (listError) throw new Error(listError.message);

    if ((waiting || []).length >= 600) {
      return json({ error: "The waitlist is full right now. Please message us on WhatsApp instead." }, 429);
    }

    const key = phoneKey(phone);
    const mine = (waiting || []).filter((w) => phoneKey(w.phone) === key);
    if (mine.some((w) => (w.wanted_date || null) === wanted)) return json({ ok: true }); // already on the list
    if (mine.length >= 3) {
      return json({ error: "You are already on the waitlist. We'll message you when a slot opens." }, 429);
    }

    const { error } = await supabase.from("waitlist").insert({
      name,
      phone,
      email,
      service: service || null,
      flexible: flexible || null,
      notes: notes || null,
      wanted_date: wanted,
      source: "website",
    });
    if (error) throw new Error(error.message);
    return json({ ok: true });
  } catch (error) {
    console.error("Waitlist POST error:", error);
    return json({ error: "Could not join the waitlist right now. Please try again shortly." }, 500);
  }
}
