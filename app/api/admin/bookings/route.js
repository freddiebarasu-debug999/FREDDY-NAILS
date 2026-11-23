import { requireAdmin } from "@/lib/adminAuth";
import { bookingRef } from "@/lib/bookingRef";
import {
  OPEN_MINUTES,
  CLOSE_MINUTES,
  BUFFER_MINUTES,
  clashesWithBuffer,
} from "@/lib/bookingRules";
import { findPrimaryConflict } from "@/lib/serviceRules";
import { formatServiceList } from "@/lib/serviceNames";
import {
  findService,
  parseStoredServices,
  servicesDuration,
} from "@/lib/serviceCatalogue";
import {
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from "@/lib/google-calendar";
import { releaseFreeSetCodeByAppointment } from "@/lib/freeSetCodes";
import { notifyWaitlistForCancelledBooking } from "@/lib/waitlist";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const APPT_FIELDS =
  "id, customer_name, customer_phone, customer_email, service_name, client_count, booking_date, start_time, end_time, duration_minutes, notes, deposit_amount, payment_status, booking_status, google_event_id, created_at";
const CLIENT_FIELDS =
  "appointment_id, client_number, service_name, booking_date, start_time, end_time, duration_minutes, booking_status";

function json(body, status = 200) {
  return Response.json(body, { status });
}

function toMin(t) {
  const [h, m] = String(t || "0:0").split(":").map(Number);
  return h * 60 + (m || 0);
}
function fromMin(n) {
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
}
function hhmm(t) {
  return String(t || "").slice(0, 5);
}
function saToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" });
}
function validDate(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d))) return false;
  const x = new Date(d + "T00:00:00Z");
  return !Number.isNaN(x.getTime()) && x.toISOString().slice(0, 10) === d;
}
function validTime(t) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(t));
}

// Things the owner should look at on a booking.
function flagsFor(appt, clients) {
  const flags = [];
  for (const c of clients) {
    const conflict = findPrimaryConflict(parseStoredServices(c.service_name));
    if (conflict) flags.push(`Client ${c.client_number}: two ${conflict.label} services`);
  }
  const status = String(appt.booking_status || "").toLowerCase();
  const paid = String(appt.payment_status || "").toLowerCase() === "paid";
  if (paid && status === "confirmed" && !appt.google_event_id) flags.push("Not in Google Calendar");
  if (clients.length !== Number(appt.client_count || 1)) flags.push("Client details do not match the client count");
  return flags;
}

async function loadClients(supabase, ids) {
  if (!ids.length) return {};
  const { data, error } = await supabase
    .from("appointment_clients")
    .select(CLIENT_FIELDS)
    .in("appointment_id", ids)
    .order("client_number", { ascending: true });
  if (error) throw new Error(error.message);
  const map = {};
  for (const row of data || []) (map[row.appointment_id] ||= []).push(row);
  return map;
}

function present(appt, clients) {
  return {
    ...appt,
    ref: bookingRef(appt.id),
    clients: clients.map((c) => ({
      client_number: c.client_number,
      services: parseStoredServices(c.service_name),
      date: c.booking_date,
      start: hhmm(c.start_time),
      end: hhmm(c.end_time),
      duration: c.duration_minutes,
      status: c.booking_status,
    })),
    flags: flagsFor(appt, clients),
  };
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  const { supabase } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const { data: appt, error } = await supabase
        .from("appointments")
        .select(APPT_FIELDS)
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!appt) return json({ error: "Booking not found." }, 404);
      const map = await loadClients(supabase, [id]);
      return json({ booking: present(appt, map[id] || []) });
    }

    const scope = searchParams.get("scope") || "upcoming";
    const q = String(searchParams.get("q") || "").trim().toLowerCase();
    const today = saToday();

    let query = supabase.from("appointments").select(APPT_FIELDS);
    if (q || scope === "all") {
      query = query.order("booking_date", { ascending: false }).limit(400);
    } else if (scope === "cancelled") {
      query = query.eq("booking_status", "cancelled").order("booking_date", { ascending: false }).limit(100);
    } else {
      query = query
        .gte("booking_date", today)
        .in("booking_status", ["pending", "confirmed"])
        .order("booking_date", { ascending: true })
        .limit(200);
    }

    const { data: appts, error } = await query;
    if (error) throw new Error(error.message);

    const clientMap = await loadClients(supabase, (appts || []).map((a) => a.id));
    let rows = (appts || []).map((a) => present(a, clientMap[a.id] || []));

    if (q) {
      rows = rows.filter((b) =>
        [b.customer_name, b.customer_phone, b.customer_email, b.ref, b.id]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    if (scope === "attention" && !q) rows = rows.filter((b) => b.flags.length);

    return json({ bookings: rows.slice(0, 150), today });
  } catch (error) {
    console.error("Admin bookings GET error:", error);
    return json({ error: error.message || "Could not load bookings." }, 500);
  }
}

// ------------------------------------------------------------------
// Actions
// ------------------------------------------------------------------

async function syncCalendar(supabase, id) {
  const { data: fresh, error } = await supabase
    .from("appointments")
    .select(APPT_FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (error || !fresh) return { ok: false, message: "Could not reload the booking." };

  const paid = String(fresh.payment_status || "").toLowerCase() === "paid";
  const confirmed = String(fresh.booking_status || "").toLowerCase() === "confirmed";
  if (!paid || !confirmed) {
    return { ok: true, skipped: true, message: "Not paid and confirmed, so no calendar event was made." };
  }

  try {
    // Passing google_event_id as null makes the calendar code rebuild the
    // events (one per client) and update any that already exist.
    const result = await createGoogleCalendarEvent({
      ...fresh,
      google_event_id: null,
      payment_status: "paid",
      booking_status: "confirmed",
    });
    const count = result?.eventIds?.length || 1;
    return { ok: true, message: `Google Calendar updated (${count} event${count > 1 ? "s" : ""}).` };
  } catch (calendarError) {
    console.error("Admin calendar sync error:", calendarError);
    return {
      ok: false,
      message: `Saved, but Google Calendar could not be updated: ${calendarError.message}. Press "Re-sync calendar".`,
    };
  }
}

async function actionSave(supabase, body) {
  const { id, force } = body;
  const input = Array.isArray(body.clients) ? body.clients : [];

  const { data: appt, error } = await supabase
    .from("appointments")
    .select(APPT_FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (error || !appt) return json({ error: "Booking not found." }, 404);

  const status = String(appt.booking_status || "").toLowerCase();
  if (status === "cancelled" || status === "canceled") {
    return json({ error: "This booking is cancelled, so it cannot be edited." }, 400);
  }

  const rowsMap = await loadClients(supabase, [id]);
  const rows = rowsMap[id] || [];
  if (!rows.length) return json({ error: "This booking has no client details to edit." }, 400);

  const computed = [];
  for (const row of rows) {
    const inp = input.find((c) => Number(c.client_number) === Number(row.client_number));
    if (!inp) return json({ error: `Details for Client ${row.client_number} are missing.` }, 400);

    const services = Array.isArray(inp.services) ? inp.services : [];
    if (services.length < 1 || services.length > 4) {
      return json({ error: `Client ${row.client_number} needs between 1 and 4 services.` }, 400);
    }
    for (const s of services) {
      if (!findService(s)) {
        return json({ error: `Client ${row.client_number}: "${s}" is not on the service menu. Choose a service from the list.` }, 400);
      }
    }
    if (!validDate(inp.date)) return json({ error: `Client ${row.client_number}: please choose a valid date.` }, 400);
    if (!validTime(inp.start)) return json({ error: `Client ${row.client_number}: please choose a valid start time.` }, 400);

    const duration = servicesDuration(services);
    const startMin = toMin(inp.start);
    const endMin = startMin + duration;
    if (endMin >= 24 * 60) return json({ error: `Client ${row.client_number}: the appointment runs past midnight.` }, 400);

    computed.push({
      client_number: row.client_number,
      services,
      serviceText: formatServiceList(services),
      date: inp.date,
      start: inp.start,
      end: fromMin(endMin),
      startMin,
      endMin,
      duration,
    });
  }

  // ---- Warnings (the owner can still save anyway) ----
  const warnings = [];
  for (const c of computed) {
    const conflict = findPrimaryConflict(c.services);
    if (conflict) warnings.push(`Client ${c.client_number} has two ${conflict.label} services.`);
    if (new Date(c.date + "T00:00:00Z").getUTCDay() === 0) warnings.push(`Client ${c.client_number} is on a Sunday (closed).`);
    if (c.startMin < OPEN_MINUTES || c.endMin > CLOSE_MINUTES) {
      warnings.push(`Client ${c.client_number} is outside opening hours (${fromMin(OPEN_MINUTES)}–${fromMin(CLOSE_MINUTES)}).`);
    }
  }
  for (let i = 0; i < computed.length; i++) {
    for (let j = i + 1; j < computed.length; j++) {
      const a = computed[i];
      const b = computed[j];
      if (a.date !== b.date) continue;
      if (clashesWithBuffer(a.startMin, a.endMin, [{ start: b.startMin, end: b.endMin }])) {
        warnings.push(`Client ${a.client_number} and Client ${b.client_number} overlap or are less than ${BUFFER_MINUTES} minutes apart.`);
      }
    }
  }
  for (const date of [...new Set(computed.map((c) => c.date))]) {
    const { data: others } = await supabase
      .from("appointment_clients")
      .select("appointment_id, start_time, end_time")
      .eq("booking_date", date)
      .in("booking_status", ["pending", "confirmed"])
      .neq("appointment_id", id);
    const booked = (others || []).map((o) => ({ start: toMin(o.start_time), end: toMin(o.end_time) }));
    for (const c of computed.filter((x) => x.date === date)) {
      if (clashesWithBuffer(c.startMin, c.endMin, booked)) {
        warnings.push(`Client ${c.client_number} (${c.start}–${c.end} on ${date}) clashes with another booking.`);
      }
    }
  }

  if (warnings.length && !force) {
    return json({ saved: false, needsConfirm: true, warnings });
  }

  // ---- Save (with rollback if something fails part-way) ----
  const first = computed[0];
  const summary = computed
    .map((c) => `Client ${c.client_number}: ${c.serviceText} — ${c.date} ${c.start}–${c.end}`)
    .join(" | ");

  const restore = async () => {
    await supabase
      .from("appointments")
      .update({
        service_name: appt.service_name,
        booking_date: appt.booking_date,
        start_time: appt.start_time,
        end_time: appt.end_time,
        duration_minutes: appt.duration_minutes,
      })
      .eq("id", id);
    for (const row of rows) {
      await supabase
        .from("appointment_clients")
        .update({
          service_name: row.service_name,
          booking_date: row.booking_date,
          start_time: row.start_time,
          end_time: row.end_time,
          duration_minutes: row.duration_minutes,
        })
        .eq("appointment_id", id)
        .eq("client_number", row.client_number);
    }
  };

  const clashMessage = "That time overlaps another booking in the database. Choose a different time.";

  const { error: parentError } = await supabase
    .from("appointments")
    .update({
      service_name: summary,
      booking_date: first.date,
      start_time: first.start,
      end_time: first.end,
      duration_minutes: first.duration,
    })
    .eq("id", id);

  if (parentError) {
    console.error("Admin save (appointment) error:", parentError);
    return json({ error: parentError.code === "23P01" ? clashMessage : parentError.message }, parentError.code === "23P01" ? 409 : 500);
  }

  for (const c of computed) {
    const { error: clientError } = await supabase
      .from("appointment_clients")
      .update({
        service_name: c.serviceText,
        booking_date: c.date,
        start_time: c.start,
        end_time: c.end,
        duration_minutes: c.duration,
      })
      .eq("appointment_id", id)
      .eq("client_number", c.client_number);

    if (clientError) {
      console.error("Admin save (client) error:", clientError);
      await restore();
      return json(
        { error: clientError.code === "23P01" ? clashMessage : `Nothing was changed. ${clientError.message}` },
        clientError.code === "23P01" ? 409 : 500
      );
    }
  }

  const calendar = await syncCalendar(supabase, id);
  const map = await loadClients(supabase, [id]);
  const { data: fresh } = await supabase.from("appointments").select(APPT_FIELDS).eq("id", id).maybeSingle();

  return json({ saved: true, calendar, booking: present(fresh || appt, map[id] || []) });
}

async function actionResync(supabase, body) {
  const calendar = await syncCalendar(supabase, body.id);
  const { data: fresh } = await supabase.from("appointments").select(APPT_FIELDS).eq("id", body.id).maybeSingle();
  const map = await loadClients(supabase, [body.id]);
  return json({ saved: true, calendar, booking: fresh ? present(fresh, map[body.id] || []) : null });
}

async function actionCancel(supabase, body) {
  const { id } = body;
  const { data: appt, error } = await supabase
    .from("appointments")
    .select(APPT_FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (error || !appt) return json({ error: "Booking not found." }, 404);

  const status = String(appt.booking_status || "").toLowerCase();
  if (status === "cancelled" || status === "canceled") {
    return json({ error: "This booking is already cancelled." }, 400);
  }

  let calendarMessage = "No calendar event to remove.";
  if (appt.google_event_id) {
    try {
      await deleteGoogleCalendarEvent(appt);
      calendarMessage = "Calendar events removed.";
    } catch (calendarError) {
      console.error("Admin cancel calendar error:", calendarError);
      calendarMessage = `Calendar events could not be removed: ${calendarError.message}. Please delete them by hand.`;
    }
  }

  const { error: updateError } = await supabase
    .from("appointments")
    .update({ booking_status: "cancelled", google_event_id: null })
    .eq("id", id);
  if (updateError) return json({ error: updateError.message }, 500);

  await supabase.from("appointment_clients").update({ booking_status: "cancelled" }).eq("appointment_id", id);

  try {
    await releaseFreeSetCodeByAppointment(supabase, id);
  } catch (releaseError) {
    console.error("Admin cancel free-set release error:", releaseError);
  }

  // Tell people on the waitlist that this slot is free (never blocks the cancel).
  let waitlistNotified = 0;
  try {
    const result = await notifyWaitlistForCancelledBooking(supabase, id);
    waitlistNotified = result?.notified || 0;
  } catch (waitlistError) {
    console.error("Admin cancel waitlist error:", waitlistError);
  }

  return json({
    saved: true,
    cancelled: true,
    calendar: { ok: true, message: calendarMessage },
    note:
      "The deposit stays recorded. Handle any refund yourself." +
      (waitlistNotified ? ` ${waitlistNotified} waitlist client${waitlistNotified > 1 ? "s were" : " was"} emailed about the free slot.` : ""),
  });
}

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  if (!body?.id) return json({ error: "Booking ID is required." }, 400);

  try {
    if (body.action === "save") return await actionSave(auth.supabase, body);
    if (body.action === "resync") return await actionResync(auth.supabase, body);
    if (body.action === "cancel") return await actionCancel(auth.supabase, body);
    if (["completed", "not_completed"].includes(body.action)) {
      const targetStatus = body.action === "not_completed" ? "no_show" : body.action;
      const { data: current, error: lookupError } = await auth.supabase.from("appointments").select("id, booking_status").eq("id", body.id).maybeSingle();
      if (lookupError || !current) return json({ error: "Booking not found." }, 404);
      if (["cancelled", "canceled"].includes(String(current.booking_status || "").toLowerCase())) return json({ error: "Cancelled bookings cannot be updated." }, 400);
      const { error: statusError } = await auth.supabase.from("appointments").update({ booking_status: targetStatus }).eq("id", body.id);
      if (statusError) return json({ error: statusError.message }, 500);
      if (["completed", "no_show"].includes(targetStatus)) {
        const { error: clientStatusError } = await auth.supabase.from("appointment_clients").update({ booking_status: targetStatus }).eq("appointment_id", body.id);
        if (clientStatusError) return json({ error: clientStatusError.message }, 500);
      }
      const { data: fresh } = await auth.supabase.from("appointments").select(APPT_FIELDS).eq("id", body.id).maybeSingle();
      const map = await loadClients(auth.supabase, [body.id]);
      return json({ saved: true, booking: fresh ? present(fresh, map[body.id] || []) : null });
    }
    return json({ error: "Unknown action." }, 400);
  } catch (error) {
    console.error("Admin bookings POST error:", error);
    return json({ error: error.message || "Something went wrong." }, 500);
  }
}
