import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import {
  createGoogleCalendarEvent,
  findGoogleCalendarEventId,
} from "@/lib/google-calendar";
import { bookingRef } from "@/lib/bookingRef";
import {
  OWNER_EMAIL,
  sendEmail,
  sendOwnerNotification,
  sendCustomerConfirmation,
} from "@/lib/booking-emails";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function sameSecret(a, b) {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/*
  Owner-only tool.

  1) Check that email is working:
     /api/admin/resend-booking-emails?key=YOUR_CRON_SECRET&test=1

  2) Re-send the emails for a booking that was missed:
     /api/admin/resend-booking-emails?key=YOUR_CRON_SECRET&id=BOOKING_ID
     (add &only=customer or &only=owner to send just one of them)

  3) See the latest bookings and which ones are missing from Google Calendar:
     /api/admin/resend-booking-emails?key=YOUR_CRON_SECRET&list=1

  5) Bring back a booking that was cancelled by mistake (keeps the paid deposit):
     /api/admin/resend-booking-emails?key=YOUR_CRON_SECRET&ref=FN-F94052&reinstate=1

  4) Add a missing booking to Google Calendar (use the id OR the FN- reference):
     /api/admin/resend-booking-emails?key=YOUR_CRON_SECRET&id=BOOKING_ID&calendar=1
     /api/admin/resend-booking-emails?key=YOUR_CRON_SECRET&ref=FN-F94052&calendar=1

  The page shows exactly what Resend or Google said, so failures are easy to read.
*/
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);

  if (!secret || !sameSecret(searchParams.get("key"), secret)) {
    return Response.json({ error: "Not allowed." }, { status: 401 });
  }

  if (searchParams.get("test")) {
    const result = await sendEmail({
      to: OWNER_EMAIL,
      subject: "Freddy Nails email test",
      html:
        '<p style="font-family:Arial,sans-serif">If you can read this, booking emails are working. 💅</p>',
    });
    return Response.json({ test: true, sentTo: OWNER_EMAIL, ...result });
  }

  if (searchParams.get("list")) {
    const { data: recent, error: listError } = await supabase
      .from("appointments")
      .select(
        "id, customer_name, booking_date, start_time, payment_status, booking_status, google_event_id, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(12);

    if (listError) {
      return Response.json({ error: listError.message }, { status: 500 });
    }

    return Response.json({
      latest: (recent || []).map((a) => ({
        ref: bookingRef(a.id),
        id: a.id,
        client: a.customer_name,
        date: a.booking_date,
        time: String(a.start_time || "").slice(0, 5),
        payment: a.payment_status,
        status: a.booking_status,
        inGoogleCalendar: a.google_event_id ? "yes" : "NO",
      })),
    });
  }

  let id = searchParams.get("id");

  const ref = (searchParams.get("ref") || "").toUpperCase().trim();
  if (!id && ref) {
    const { data: recent } = await supabase
      .from("appointments")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(500);
    const match = (recent || []).find((a) => bookingRef(a.id) === ref);
    if (match) id = match.id;
  }

  if (!id) {
    return Response.json(
      { error: "Add &id=BOOKING_ID, &ref=FN-XXXXXX, &list=1 or &test=1." },
      { status: 400 }
    );
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select(
      "id, customer_name, customer_phone, customer_email, service_name, client_count, booking_date, start_time, end_time, duration_minutes, notes, deposit_amount, payment_status, booking_status, google_event_id, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !appointment) {
    return Response.json({ error: "Booking not found." }, { status: 404 });
  }

  if (searchParams.get("reinstate")) {
    const toMinutes = (t) => {
      const parts = String(t).split(":").map(Number);
      return parts[0] * 60 + parts[1];
    };

    if (String(appointment.payment_status).toLowerCase() !== "paid") {
      return Response.json(
        { error: "The deposit was not paid, so this booking cannot be brought back." },
        { status: 400 }
      );
    }

    // Make sure nobody has taken the slot since it was cancelled.
    const { data: others } = await supabase
      .from("appointment_clients")
      .select("appointment_id, start_time, end_time")
      .eq("booking_date", appointment.booking_date)
      .in("booking_status", ["pending", "confirmed"])
      .neq("appointment_id", appointment.id);

    const start = toMinutes(appointment.start_time);
    const end = toMinutes(appointment.end_time);
    const clash = (others || []).some(
      (o) => start < toMinutes(o.end_time) && end > toMinutes(o.start_time)
    );

    if (clash) {
      return Response.json(
        { error: "Someone else has booked that time since the cancellation, so it cannot be restored." },
        { status: 409 }
      );
    }

    const { error: apptError } = await supabase
      .from("appointments")
      .update({ booking_status: "confirmed" })
      .eq("id", appointment.id);

    const { error: clientsError } = await supabase
      .from("appointment_clients")
      .update({ booking_status: "confirmed" })
      .eq("appointment_id", appointment.id);

    if (apptError || clientsError) {
      return Response.json(
        { error: (apptError || clientsError).message },
        { status: 500 }
      );
    }

    // Reuse the calendar event if it is still there, otherwise create a new one.
    let calendar = { ok: true };
    try {
      const existingId = await findGoogleCalendarEventId(appointment.id);
      if (existingId) {
        await supabase
          .from("appointments")
          .update({ google_event_id: existingId })
          .eq("id", appointment.id);
        calendar = { ok: true, note: "Kept the event already in Google Calendar." };
      } else {
        const created = await createGoogleCalendarEvent({
          ...appointment,
          google_event_id: null,
          payment_status: "paid",
          booking_status: "confirmed",
        });
        calendar = { ok: true, note: "Created a new Google Calendar event.", result: created };
      }
    } catch (calendarError) {
      calendar = {
        ok: false,
        error: calendarError && calendarError.message ? calendarError.message : String(calendarError),
      };
    }

    return Response.json({
      reinstated: true,
      booking: appointment.id,
      client: appointment.customer_name,
      date: appointment.booking_date,
      time: String(appointment.start_time).slice(0, 5),
      calendar,
    });
  }

  if (
    String(appointment.payment_status).toLowerCase() !== "paid" ||
    String(appointment.booking_status).toLowerCase() !== "confirmed"
  ) {
    return Response.json(
      { error: "That booking is not paid and confirmed yet." },
      { status: 400 }
    );
  }

  if (searchParams.get("calendar")) {
    try {
      const result = await createGoogleCalendarEvent({
        ...appointment,
        payment_status: "paid",
        booking_status: "confirmed",
      });
      return Response.json({
        booking: appointment.id,
        client: appointment.customer_name,
        calendar: result,
      });
    } catch (calendarError) {
      return Response.json(
        {
          booking: appointment.id,
          client: appointment.customer_name,
          calendar: {
            ok: false,
            error: calendarError && calendarError.message
              ? calendarError.message
              : String(calendarError),
          },
        },
        { status: 500 }
      );
    }
  }

  const only = searchParams.get("only");
  const out = { booking: appointment.id, client: appointment.customer_name };

  if (only !== "customer") {
    out.owner = await sendOwnerNotification(appointment);
  }
  if (only !== "owner") {
    out.customer = await sendCustomerConfirmation(appointment);
    out.customerEmail = appointment.customer_email;
  }

  return Response.json(out);
}
