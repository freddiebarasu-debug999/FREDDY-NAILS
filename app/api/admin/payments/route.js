import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const METHODS = ["cash", "transfer", "card"];

function json(body, status = 200) {
  return Response.json(body, { status });
}

function missingTable(error) {
  return error?.code === "42P01" || /booking_payments/.test(error?.message || "");
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get("appointment_id") || "");
  if (!id || id.length > 64) return json({ error: "Booking not recognised." }, 400);

  const { data, error } = await supabase
    .from("booking_payments")
    .select("id, amount, method, is_tip, created_at")
    .eq("appointment_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    if (missingTable(error)) return json({ payments: [], ready: false });
    console.error("Admin payments GET error:", error);
    return json({ error: "Could not load payments." }, 500);
  }
  return json({
    payments: (data || []).map((p) => ({ ...p, amount: Number(p.amount) })),
    ready: true,
  });
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
      const id = String(body.appointment_id || "");
      if (!id || id.length > 64) return json({ error: "Booking not recognised." }, 400);
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
        return json({ error: "Enter an amount bigger than 0." }, 400);
      }
      if (!METHODS.includes(body.method)) return json({ error: "Choose cash, transfer or card." }, 400);

      const { data: appt, error: apptError } = await supabase
        .from("appointments")
        .select("id")
        .eq("id", id)
        .maybeSingle();
      if (apptError) throw new Error(apptError.message);
      if (!appt) return json({ error: "Booking not found." }, 404);

      const { error } = await supabase.from("booking_payments").insert({
        appointment_id: id,
        amount: Math.round(amount * 100) / 100,
        method: body.method,
        is_tip: !!body.is_tip,
      });
      if (error) {
        if (missingTable(error)) return json({ error: "The payments table has not been created in Supabase yet. Run the SQL first." }, 400);
        throw new Error(error.message);
      }
      return json({ saved: true });
    }

    if (body.action === "delete") {
      const id = String(body.id || "");
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Payment not recognised." }, 400);
      const { error } = await supabase.from("booking_payments").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return json({ saved: true });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (error) {
    console.error("Admin payments POST error:", error);
    return json({ error: error.message || "Something went wrong." }, 500);
  }
}
