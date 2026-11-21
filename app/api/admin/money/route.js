import { requireAdmin } from "@/lib/adminAuth";
import { parseStoredServices, servicesPrice } from "@/lib/serviceCatalogue";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CATEGORIES = ["Acrylic", "Gel", "Polish", "Tips", "Lashes", "Tools", "Other"];

function json(body, status = 200) {
  return Response.json(body, { status });
}

function saToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" });
}

function iso(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
}

function rangeFor(period, today) {
  if (period === "today") return { from: today, to: today, label: "Today" };
  if (period === "week") {
    const dow = new Date(today + "T00:00:00Z").getUTCDay();
    const from = addDays(today, -((dow + 6) % 7)); // Monday
    return { from, to: addDays(from, 6), label: "This week" };
  }
  const [y, m] = today.split("-").map(Number);
  if (period === "lastmonth") {
    return {
      from: iso(new Date(Date.UTC(y, m - 2, 1))),
      to: iso(new Date(Date.UTC(y, m - 1, 0))),
      label: "Last month",
    };
  }
  return {
    from: iso(new Date(Date.UTC(y, m - 1, 1))),
    to: iso(new Date(Date.UTC(y, m, 0))),
    label: "This month",
  };
}

function isCancelled(a) {
  return ["cancelled", "canceled"].includes(String(a.booking_status || "").toLowerCase());
}
function isPaid(a) {
  return String(a.payment_status || "").toLowerCase() === "paid";
}
function normalizeCode(code) {
  return String(code || "").trim().replace(/\s+/g, "").toUpperCase();
}

async function loadClientRows(supabase, ids) {
  const map = {};
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const { data, error } = await supabase
      .from("appointment_clients")
      .select("appointment_id, client_number, service_name")
      .in("appointment_id", chunk);
    if (error) throw new Error(error.message);
    for (const row of data || []) (map[row.appointment_id] ||= []).push(row);
  }
  return map;
}

async function loadPayments(supabase, ids) {
  const map = {};
  let ready = true;
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const { data, error } = await supabase
      .from("booking_payments")
      .select("appointment_id, amount, method, is_tip")
      .in("appointment_id", chunk);
    if (error) {
      ready = false;
      break;
    }
    for (const row of data || []) (map[row.appointment_id] ||= []).push(row);
  }
  return { map, ready };
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  const { supabase } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const period = ["today", "week", "month", "lastmonth"].includes(searchParams.get("period"))
      ? searchParams.get("period")
      : "month";
    const today = saToday();
    const { from, to, label } = rangeFor(period, today);

    const { data: appts, error } = await supabase
      .from("appointments")
      .select("id, booking_date, booking_status, payment_status, deposit_amount, promo_code, notes, service_name")
      .gte("booking_date", from)
      .lte("booking_date", to)
      .limit(1000);
    if (error) throw new Error(error.message);

    const apptIds = (appts || []).map((a) => a.id);
    const clientMap = await loadClientRows(supabase, apptIds);
    const { map: paymentMap, ready: paymentsReady } = await loadPayments(supabase, apptIds);

    // Promo values, used to ESTIMATE discounts (they are not stored per booking).
    const promoValues = {
      FRIEND50: { type: "fixed", value: 50 },
      BIRTHDAY: { type: "fixed", value: 50 },
    };
    const { data: promoRows } = await supabase.from("promo_codes").select("code, discount_type, discount_value");
    for (const p of promoRows || []) {
      promoValues[normalizeCode(p.code)] = {
        type: String(p.discount_type).toLowerCase().startsWith("percent") ? "percent" : "fixed",
        value: Number(p.discount_value || 0),
      };
    }

    function menuValue(a) {
      const rows = clientMap[a.id];
      if (rows?.length) return rows.reduce((s, r) => s + servicesPrice(parseStoredServices(r.service_name)), 0);
      return 0;
    }
    function estDiscount(a, menu) {
      const code = normalizeCode(a.promo_code);
      if (!code || menu <= 0) return 0;
      const p = promoValues[code];
      let d;
      if (p) d = p.type === "percent" ? (menu * Math.min(p.value, 100)) / 100 : p.value;
      else d = menu * 0.1; // a client referral code (10% off)
      return Math.min(Math.max(d, 0), menu);
    }

    let bookings = 0;
    let takings = 0;
    let deposits = 0;
    let balanceDue = 0; // outstanding on appointments up to today
    let collected = 0; // balance payments you have recorded
    let tips = 0;
    const byMethod = { cash: 0, transfer: 0, card: 0 };
    let soFar = 0;
    let cancelledCount = 0;
    let cancelledValue = 0;
    const serviceCounts = {};

    for (const a of appts || []) {
      const menu = menuValue(a);
      if (isCancelled(a)) {
        if (isPaid(a)) {
          cancelledCount += 1;
          cancelledValue += menu;
        }
        continue;
      }
      if (!isPaid(a)) continue; // unpaid deposits are not counted as bookings yet

      const freeSet = String(a.notes || "").startsWith("FREE SET");
      const net = freeSet ? 0 : Math.max(menu - estDiscount(a, menu), 0);
      const dep = Math.min(Number(a.deposit_amount || 0), net || Number(a.deposit_amount || 0));

      const pays = paymentMap[a.id] || [];
      const balancePaid = pays.filter((p) => !p.is_tip).reduce((x, p) => x + Number(p.amount), 0);
      for (const p of pays) {
        if (p.is_tip) tips += Number(p.amount);
        else if (byMethod[p.method] !== undefined) byMethod[p.method] += Number(p.amount);
      }

      bookings += 1;
      takings += net;
      deposits += Number(a.deposit_amount || 0);
      collected += balancePaid;
      if (a.booking_date <= today) {
        soFar += net;
        balanceDue += Math.max(net - dep - balancePaid, 0);
      }

      for (const r of clientMap[a.id] || []) {
        for (const s of parseStoredServices(r.service_name)) {
          if (s.startsWith("Extra")) continue;
          serviceCounts[s] = (serviceCounts[s] || 0) + 1;
        }
      }
    }

    const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0] || null;

    let expensesReady = true;
    let expenses = [];
    {
      const { data, error: expError } = await supabase
        .from("expenses")
        .select("id, expense_date, item, category, amount")
        .gte("expense_date", from)
        .lte("expense_date", to)
        .order("expense_date", { ascending: false })
        .limit(300);
      if (expError) expensesReady = false;
      else expenses = (data || []).map((e) => ({ ...e, amount: Number(e.amount) }));
    }
    const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);

    return json({
      period,
      label,
      from,
      to,
      today,
      bookings,
      takings: Math.round(takings),
      soFar: Math.round(soFar),
      toCome: Math.round(takings - soFar),
      deposits: Math.round(deposits),
      collected: Math.round(collected),
      balanceDue: Math.round(balanceDue),
      tips: Math.round(tips * 100) / 100,
      byMethod: {
        cash: Math.round(byMethod.cash),
        transfer: Math.round(byMethod.transfer),
        card: Math.round(byMethod.card),
      },
      paymentsReady,
      cancelledCount,
      cancelledValue: Math.round(cancelledValue),
      topService: topService ? { name: topService[0], count: topService[1] } : null,
      expensesReady,
      expenses,
      expenseTotal: Math.round(expenseTotal * 100) / 100,
      profit: Math.round((takings - expenseTotal) * 100) / 100,
      categories: CATEGORIES,
    });
  } catch (error) {
    console.error("Admin money GET error:", error);
    return json({ error: error.message || "Could not load the money figures." }, 500);
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
    if (body.action === "add_expense") {
      const item = String(body.item || "").trim().slice(0, 80);
      const amount = Number(body.amount);
      const category = CATEGORIES.includes(body.category) ? body.category : "Other";
      if (!item) return json({ error: "Enter what you bought." }, 400);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) return json({ error: "Enter an amount bigger than 0." }, 400);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.date))) return json({ error: "Choose a valid date." }, 400);

      const { error } = await supabase
        .from("expenses")
        .insert({ expense_date: body.date, item, category, amount: Math.round(amount * 100) / 100 });
      if (error) {
        if (error.code === "42P01") return json({ error: "The expenses table has not been created in Supabase yet. Run the SQL first." }, 400);
        throw new Error(error.message);
      }
      return json({ saved: true });
    }

    if (body.action === "delete_expense") {
      const id = String(body.id || "");
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Expense not recognised." }, 400);
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return json({ saved: true });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (error) {
    console.error("Admin money POST error:", error);
    return json({ error: error.message || "Something went wrong." }, 500);
  }
}
