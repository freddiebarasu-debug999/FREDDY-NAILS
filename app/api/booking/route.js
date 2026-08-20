import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const appointmentId = url.searchParams.get("id");

    if (!appointmentId) {
      return Response.json(
        { error: "Booking ID is required." },
        { status: 400 }
      );
    }

    const { data: appointment, error } = await supabase
      .from("appointments")
      .select(
        "id, customer_name, customer_email, service_name, client_count, booking_date, start_time, end_time, deposit_amount, payment_status, booking_status"
      )
      .eq("id", appointmentId)
      .maybeSingle();

    if (error) {
      console.error("Booking lookup error:", error);

      return Response.json(
        { error: "Unable to find booking." },
        { status: 500 }
      );
    }

    if (!appointment) {
      return Response.json(
        { error: "Booking not found." },
        { status: 404 }
      );
    }

    if (
      appointment.payment_status !== "paid" ||
      appointment.booking_status !== "confirmed"
    ) {
      return Response.json(
        { error: "This booking is not confirmed." },
        { status: 403 }
      );
    }

    return Response.json({
      appointment: {
        customerName: appointment.customer_name,
        customerEmail: appointment.customer_email,
        service: appointment.service_name,
        clientCount: appointment.client_count,
        bookingDate: appointment.booking_date,
        startTime: appointment.start_time,
        endTime: appointment.end_time,
        depositAmount: appointment.deposit_amount,
      },
    });
  } catch (error) {
    console.error("Booking API error:", error);

    return Response.json(
      { error: "Something went wrong loading the booking." },
      { status: 500 }
    );
  }
}
