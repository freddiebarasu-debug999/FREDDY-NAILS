import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// These codes live in the website code, not the database. They are shown
// here for reference but cannot be edited from the dashboard.
const BUILT_IN = [
  { code: "FRIEND50", discount_type: "fixed", discount_value: 50, description: "R50 off when you bring a friend" },
  { code: "BIRTHDAY", discount_type: "fixed", discount_value: 50, description: "Birthday special — R50 off" },
];
const RESERVED = new Set([...BUILT_IN.map((p) => p.code), "FIRSTVISIT"]);

function json(body, status = 200) {
  return Response.json(body, { status });
}

function normalizeCode(code) {
  return String(code || "").trim().replace(/\s+/g, "").toUpperCase();
}

function escapeLike(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

async function findPromo(supabase, code) {
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .ilike("code", escapeLike(code))
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data || null;
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  const { supabase } = auth;

  try {
    const { data: promos, error } = await supabase.from("promo_codes").select("*");
    if (error) throw new Error(error.message);

    // How many paid, not-cancelled bookings used each code.
    const { data: appts, error: apptError } = await supabase
      .from("appointments")
      .select("promo_code, payment_status, booking_status")
      .not("promo_code", "is", null)
      .limit(5000);
    if (apptError) throw new Error(apptError.message);

    const used = {};
    for (const a of appts || []) {
      const code = normalizeCode(a.promo_code);
      if (!code) continue;
      const paid = String(a.payment_status || "").toLowerCase() === "paid";
      const cancelled = ["cancelled", "canceled"].includes(String(a.booking_status || "").toLowerCase());
      if (paid && !cancelled) used[code] = (used[code] || 0) + 1;
    }

    const rows = (promos || [])
      .map((p) => ({ ...p, used: used[normalizeCode(p.code)] || 0 }))
      .sort((a, b) => String(a.code).localeCompare(String(b.code)));

    const builtIn = BUILT_IN.map((p) => ({ ...p, used: used[p.code] || 0 }));
    return json({ promos: rows, builtIn });
  } catch (error) {
    console.error("Admin promos GET error:", error);
    return json({ error: error.message || "Could not load promo codes." }, 500);
  }
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
    const code = normalizeCode(body.code);

    if (body.action === "toggle") {
      if (RESERVED.has(code)) return json({ error: "That code is built into the website and can't be switched here." }, 400);
      const existing = await findPromo(supabase, code);
      if (!existing) return json({ error: "Promo code not found." }, 404);
      const { error } = await supabase
        .from("promo_codes")
        .update({ active: !!body.active })
        .eq("code", existing.code);
      if (error) throw new Error(error.message);
      return json({ saved: true });
    }

    if (body.action !== "save") return json({ error: "Unknown action." }, 400);

    if (!/^[A-Z0-9_-]{3,24}$/.test(code)) {
      return json({ error: "Code must be 3–24 letters or numbers (no spaces)." }, 400);
    }
    if (RESERVED.has(code)) {
      return json({ error: `${code} is a built-in code and can't be created or changed here.` }, 400);
    }

    const type = body.discount_type === "percent" ? "percent" : body.discount_type === "fixed" ? "fixed" : null;
    if (!type) return json({ error: "Choose percent or rand amount." }, 400);

    const value = Number(body.discount_value);
    if (!Number.isFinite(value) || value <= 0) return json({ error: "Enter a discount bigger than 0." }, 400);
    if (type === "percent" && value > 100) return json({ error: "A percentage can't be more than 100." }, 400);
    if (type === "percent" && value === 15) {
      // The website blocks any 15% code (the old first-visit offer).
      return json({ error: "A 15% code would be rejected at checkout (the old first-visit offer). Use another percentage." }, 400);
    }

    let expires_at = null;
    if (body.expires) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.expires))) return json({ error: "Expiry date is not valid." }, 400);
      expires_at = `${body.expires}T23:59:59+02:00`; // end of that day, South Africa time
    }

    const maxUses = body.max_uses === "" || body.max_uses == null ? null : Math.floor(Number(body.max_uses));
    if (maxUses !== null && (!Number.isFinite(maxUses) || maxUses < 1)) {
      return json({ error: "Max uses must be 1 or more, or left empty." }, 400);
    }

    const minSpend = body.minimum_spend === "" || body.minimum_spend == null ? null : Number(body.minimum_spend);
    if (minSpend !== null && (!Number.isFinite(minSpend) || minSpend < 0)) {
      return json({ error: "Minimum spend is not valid." }, 400);
    }

    const row = {
      discount_type: type,
      discount_value: value,
      description: String(body.description || "").trim().slice(0, 200) || null,
      active: body.active !== false,
      expires_at,
      max_uses: maxUses,
      minimum_spend: minSpend,
      new_clients_only: !!body.new_clients_only,
      one_use_per_client: !!body.one_use_per_client,
    };

    const existing = await findPromo(supabase, code);

    if (existing) {
      if (body.isNew) return json({ error: `${code} already exists. Edit it from the list instead.` }, 409);
      const { error } = await supabase.from("promo_codes").update(row).eq("code", existing.code);
      if (error) throw new Error(error.message);
      return json({ saved: true });
    }

    if (!body.isNew) return json({ error: "Promo code not found." }, 404);
    const { error } = await supabase.from("promo_codes").insert({ code, ...row });
    if (error) throw new Error(error.message);
    return json({ saved: true });
  } catch (error) {
    console.error("Admin promos POST error:", error);
    return json({ error: error.message || "Something went wrong." }, 500);
  }
}
