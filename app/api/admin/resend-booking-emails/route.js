import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
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

  The page shows exactly what Resend said, so failures are easy to read.
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

  const id = searchParams.get("id");
  if (!id) {
    return Response.json(
      { error: "Add &id=BOOKING_ID (or &test=1)." },
      { status: 400 }
    );
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select(
      "id, customer_name, customer_phone, customer_email, service_name, client_count, booking_date, start_time, end_time, duration_minutes, notes, deposit_amount, payment_status, booking_status"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !appointment) {
    return Response.json({ error: "Booking not found." }, { status: 404 });
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
