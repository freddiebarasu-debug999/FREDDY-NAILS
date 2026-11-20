import { requireAdmin } from "@/lib/adminAuth";
import { parseStoredServices, servicesPrice } from "@/lib/serviceCatalogue";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(body, status = 200) {
  return Response.json(body, { status });
}

function phoneKey(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

function groupKey(a) {
  const p = phoneKey(a.customer_phone);
  if (p) return `p${p}`;
  const e = String(a.customer_email || "").trim().toLowerCase();
  return e ? `e${e}` : `i${a.id}`;
}

function saToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" });
}

function isCancelled(a) {
  return ["cancelled", "canceled"].includes(String(a.booking_status || "").toLowerCase());
}
function isPaid(a) {
  return String(a.payment_status || "").toLowerCase() === "paid";
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  const { supabase } = auth;

  try {
    const { data: appts, error } = await supabase
      .from("appointments")
      .select("id, customer_name, customer_phone, customer_email, service_name, booking_date, booking_status, payment_status")
      .order("booking_date", { ascending: false })
      .limit(3000);
    if (error) throw new Error(error.message);

    const { data: clientRows, error: clientError } = await supabase
      .from("appointment_clients")
      .select("appointment_id, client_number, service_name")
      .order("client_number", { ascending: true })
      .limit(8000);
    if (clientError) throw new Error(clientError.message);

    const byAppt = {};
    for (const row of clientRows || []) (byAppt[row.appointment_id] ||= []).push(row);

    function servicesOf(a) {
      const rows = byAppt[a.id];
      if (rows?.length) return parseStoredServices(rows[0].service_name);
      return parseStoredServices(a.service_name);
    }
    function totalOf(a) {
      const rows = byAppt[a.id];
      if (rows?.length) return rows.reduce((s, r) => s + servicesPrice(parseStoredServices(r.service_name)), 0);
      return servicesPrice(parseStoredServices(a.service_name));
    }

    // Notes table is optional: if it has not been created yet we say so.
    let notesReady = true;
    const notes = {};
    {
      const { data, error: notesError } = await supabase
        .from("client_notes")
        .select("client_key, notes, allergy_flag, allergy_details");
      if (notesError) {
        notesReady = false;
      } else {
        for (const n of data || []) notes[n.client_key] = n;
      }
    }

    const groups = {};
    for (const a of appts || []) (groups[groupKey(a)] ||= []).push(a); // already newest first

    const today = saToday();
    const clients = Object.entries(groups).map(([key, list]) => {
      const latest = list[0];
      const counted = list.filter((a) => isPaid(a) && !isCancelled(a));
      const cancelled = list.filter(isCancelled).length;
      const past = counted.filter((a) => a.booking_date <= today);
      const lastBooking = past[0] || counted[0] || null;
      const upcoming = list
        .filter((a) => !isCancelled(a) && a.booking_date >= today)
        .sort((a, b) => a.booking_date.localeCompare(b.booking_date))[0] || null;

      const n = counted.length;
      const tag = n >= 5 ? "VIP" : n >= 2 ? "Regular" : "New";
      const note = notes[key] || {};

      return {
        key,
        name: latest.customer_name,
        phone: latest.customer_phone,
        email: latest.customer_email,
        bookings: n,
        cancelled,
        spent: counted.reduce((s, a) => s + totalOf(a), 0),
        tag,
        lastDate: lastBooking?.booking_date || null,
        lastSet: lastBooking ? servicesOf(lastBooking).join(" + ") : "",
        nextDate: upcoming?.booking_date || null,
        notes: note.notes || "",
        allergyFlag: note.allergy_flag === true,
        allergyDetails: note.allergy_details || "",
        history: list.slice(0, 12).map((a) => ({
          id: a.id,
          date: a.booking_date,
          services: servicesOf(a).join(" + "),
          status: isCancelled(a) ? "cancelled" : isPaid(a) ? "paid" : "pending",
        })),
      };
    });

    clients.sort((a, b) => String(b.lastDate || b.nextDate || "").localeCompare(String(a.lastDate || a.nextDate || "")));
    return json({ clients: clients.slice(0, 600), notesReady });
  } catch (error) {
    console.error("Admin clients GET error:", error);
    return json({ error: error.message || "Could not load clients." }, 500);
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
    if (body.action !== "save_note") return json({ error: "Unknown action." }, 400);
    const key = String(body.key || "");
    if (!key || key.length > 120) return json({ error: "Client not recognised." }, 400);

    const { error } = await supabase.from("client_notes").upsert(
      {
        client_key: key,
        notes: String(body.notes || "").slice(0, 2000),
        allergy_flag: !!body.allergy_flag,
        allergy_details: String(body.allergy_details || "").slice(0, 500),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_key" }
    );
    if (error) {
      if (error.code === "42P01" || /client_notes/.test(error.message)) {
        return json({ error: "The notes table has not been created in Supabase yet. Run the SQL first." }, 400);
      }
      throw new Error(error.message);
    }
    return json({ saved: true });
  } catch (error) {
    console.error("Admin clients POST error:", error);
    return json({ error: error.message || "Something went wrong." }, 500);
  }
}
