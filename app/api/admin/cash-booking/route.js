import { requireAdmin } from "@/lib/adminAuth";
import { bookingRef } from "@/lib/bookingRef";
import {
  OPEN_MINUTES,
  CLOSE_MINUTES,
  BUFFER_MINUTES,
  MAX_CLIENTS_PER_DAY,
  clashesWithBuffer,
} from "@/lib/bookingRules";
import { findPrimaryConflict } from "@/lib/serviceRules";
import { formatServiceList, depositForClientServices, normalizeServiceName } from "@/lib/serviceNames";
import { findService, servicesDuration } from "@/lib/serviceCatalogue";
import { createGoogleCalendarEvent } from "@/lib/google-calendar";
import { isClosedDate } from "@/lib/closedDates";
import { sendCustomerConfirmation } from "@/lib/booking-emails";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEPOSIT_PER_CLIENT = 90; // same standard deposit the website charges
const APPT_FIELDS =
  "id, customer_name, customer_phone, customer_email, service_name, client_count, booking_date, start_time, end_time, duration_minutes, notes, deposit_amount, payment_status, booking_status, google_event_id";

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

// Owner-only: record a booking whose deposit was paid in CASH and put it
// straight on the schedule (confirmed, calendar event, client email).
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
    const name = String(body.name || "").trim().slice(0, 80);
    const phone = String(body.phone || "").trim().slice(0, 25);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 120);
    const extraNotes = String(body.notes || "").trim().slice(0, 300);
    const input = Array.isArray(body.clients) ? body.clients : [];

    if (name.length < 2) return json({ error: "Enter the client's name." }, 400);
    if (phone.replace(/\D/g, "").length < 9) return json({ error: "Enter a valid phone number." }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Enter the client's email address. Her confirmation is sent there." }, 400);
    }
    if (input.length < 1 || input.length > 4) return json({ error: "A booking needs between 1 and 4 clients." }, 400);

    const today = saToday();
    const computed = [];
    for (let i = 0; i < input.length; i++) {
      const c = input[i] || {};
      const label = `Client ${i + 1}`;
      const services = Array.isArray(c.services) ? c.services : [];
      if (services.length < 1 || services.length > 4) return json({ error: `${label} needs between 1 and 4 services.` }, 400);
      const unique = new Set(services.map((s) => normalizeServiceName(s)));
      if (unique.size !== services.length) return json({ error: `${label} has the same service twice.` }, 400);
      for (const s of services) {
        if (!findService(s)) return json({ error: `${label}: "${s}" is not on the service menu.` }, 400);
      }
      const conflict = findPrimaryConflict(services);
      if (conflict) return json({ error: `${label} can only have one ${conflict.label}.` }, 400);
      if (!validDate(c.date)) return json({ error: `${label}: choose a valid date.` }, 400);
      if (c.date < today) return json({ error: `${label}: that date is in the past.` }, 400);
      if (!validTime(c.start)) return json({ error: `${label}: choose a start time.` }, 400);

      const duration = servicesDuration(services);
      const startMin = toMin(c.start);
      const endMin = startMin + duration;
      if (endMin >= 24 * 60) return json({ error: `${label}: the appointment runs past midnight.` }, 400);

      computed.push({
        number: i + 1,
        services,
        serviceText: formatServiceList(services),
        date: c.date,
        start: c.start,
        end: fromMin(endMin),
        startMin,
        endMin,
        duration,
        deposit: depositForClientServices(services, { standardDeposit: DEPOSIT_PER_CLIENT, waiveDeposit: false }),
      });
    }
    const depositAmount = computed.reduce((sum, c) => sum + c.deposit, 0);

    // ---- Warnings (the owner can still book anyway) ----
    const warnings = [];
    for (const c of computed) {
      if (new Date(c.date + "T00:00:00Z").getUTCDay() === 0) warnings.push(`Client ${c.number} is on a Sunday (closed).`);
      if (await isClosedDate(supabase, c.date)) warnings.push(`Client ${c.number} is on a day you marked as closed (${c.date}).`);
      if (c.startMin < OPEN_MINUTES || c.endMin > CLOSE_MINUTES) {
        warnings.push(`Client ${c.number} is outside opening hours (${fromMin(OPEN_MINUTES)}–${fromMin(CLOSE_MINUTES)}).`);
      }
    }
    for (let i = 0; i < computed.length; i++) {
      for (let j = i + 1; j < computed.length; j++) {
        const a = computed[i];
        const b = computed[j];
        if (a.date === b.date && clashesWithBuffer(a.startMin, a.endMin, [{ start: b.startMin, end: b.endMin }])) {
          warnings.push(`Client ${a.number} and Client ${b.number} overlap or are less than ${BUFFER_MINUTES} minutes apart.`);
        }
      }
    }
    for (const date of [...new Set(computed.map((c) => c.date))]) {
      const { data: others } = await supabase
        .from("appointment_clients")
        .select("appointment_id, start_time, end_time")
        .eq("booking_date", date)
        .in("booking_status", ["pending", "confirmed"]);
      const booked = (others || []).map((o) => ({ start: toMin(o.start_time), end: toMin(o.end_time) }));
      const mine = computed.filter((x) => x.date === date);
      for (const c of mine) {
        if (clashesWithBuffer(c.startMin, c.endMin, booked)) {
          warnings.push(`Client ${c.number} (${c.start}–${c.end} on ${date}) clashes with another booking.`);
        }
      }
      if (booked.length + mine.length > MAX_CLIENTS_PER_DAY) {
        warnings.push(`${date} would have more than ${MAX_CLIENTS_PER_DAY} clients.`);
      }
    }

    if (warnings.length && !body.force) {
      return json({ saved: false, needsConfirm: true, warnings, deposit: depositAmount });
    }

    // ---- Create the booking (already paid + confirmed) ----
    const first = computed[0];
    const summary = computed
      .map((c) => `Client ${c.number}: ${c.serviceText} — ${c.date} ${c.start}–${c.end}`)
      .join(" | ");

    const { data: created, error: createError } = await supabase
      .from("appointments")
      .insert({
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        service_name: summary,
        client_count: computed.length,
        booking_date: first.date,
        start_time: first.start,
        end_time: first.end,
        duration_minutes: first.duration,
        deposit_per_client: DEPOSIT_PER_CLIENT,
        deposit_amount: depositAmount,
        payment_status: "paid",
        booking_status: "confirmed",
        expires_at: null,
        notes: `CASH DEPOSIT received (R${depositAmount}).${extraNotes ? " " + extraNotes : ""}`,
        profile_id: null,
        promo_code: null,
      })
      .select("id")
      .single();

    if (createError) {
      console.error("Cash booking insert error:", createError);
      if (createError.code === "23P01") {
        return json({ error: "That time overlaps another booking. Choose a different time." }, 409);
      }
      return json({ error: "Could not create the booking." }, 500);
    }

    const id = created.id;
    const clientRows = computed.map((c) => ({
      appointment_id: id,
      client_number: c.number,
      service_name: c.serviceText,
      booking_date: c.date,
      start_time: c.start,
      end_time: c.end,
      duration_minutes: c.duration,
      booking_status: "confirmed",
    }));
    const { error: clientError } = await supabase.from("appointment_clients").insert(clientRows);
    if (clientError) {
      console.error("Cash booking client insert error:", clientError);
      await supabase.from("appointments").update({ booking_status: "cancelled" }).eq("id", id);
      return json(
        {
          error:
            clientError.code === "23P01"
              ? "That time overlaps another booking. Nothing was booked. Choose a different time."
              : "Could not reserve all the times. Nothing was booked.",
        },
        clientError.code === "23P01" ? 409 : 500
      );
    }

    const { data: appointment } = await supabase.from("appointments").select(APPT_FIELDS).eq("id", id).maybeSingle();

    let calendar = { ok: true, message: "Added to Google Calendar." };
    try {
      await createGoogleCalendarEvent({ ...appointment, payment_status: "paid", booking_status: "confirmed" });
    } catch (calendarError) {
      console.error("Cash booking calendar error:", calendarError);
      calendar = { ok: false, message: `Booked, but Google Calendar failed: ${calendarError.message}. Open the booking and press "Re-sync calendar".` };
    }

    let emailResult = { ok: true, message: `Confirmation emailed to ${email}.` };
    try {
      const sent = await sendCustomerConfirmation(appointment);
      if (sent && sent.ok === false) emailResult = { ok: false, message: `Booked, but the confirmation email failed: ${sent.error || "unknown error"}.` };
    } catch (emailError) {
      console.error("Cash booking email error:", emailError);
      emailResult = { ok: false, message: "Booked, but the confirmation email failed." };
    }

    // If she came from the waitlist, mark that entry as booked.
    if (body.waitlist_id && /^[0-9a-f-]{36}$/i.test(String(body.waitlist_id))) {
      try {
        await supabase.from("waitlist").update({ status: "booked" }).eq("id", body.waitlist_id);
      } catch (waitlistError) {
        console.error("Cash booking waitlist update error:", waitlistError);
      }
    }

    return json({ saved: true, ref: bookingRef(id), deposit: depositAmount, calendar, email: emailResult });
  } catch (error) {
    console.error("Admin cash booking error:", error);
    return json({ error: error.message || "Something went wrong." }, 500);
  }
}
