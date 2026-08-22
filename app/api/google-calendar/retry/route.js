import { NextResponse } from "next/server";
import { createGoogleCalendarEvent } from "@/lib/google-calendar";
import { createClient } from "@supabase/supabase-js";

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
    const { searchParams } =
      new URL(request.url);

    const appointmentId =
      searchParams.get("id");

    if (!appointmentId) {
      return NextResponse.json(
        {
          error:
            "Missing appointment ID.",
        },
        { status: 400 }
      );
    }

    const {
      data: appointment,
      error,
    } = await supabase
      .from("appointments")
      .select(
        `
          id,
          customer_name,
          customer_phone,
          customer_email,
          service_name,
          client_count,
          booking_date,
          start_time,
          end_time,
          duration_minutes,
          notes,
          deposit_amount,
          payment_status,
          booking_status,
          google_event_id
        `
      )
      .eq(
        "id",
        appointmentId
      )
      .maybeSingle();

    if (error) {
      console.error(
        "Appointment lookup failed:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Appointment lookup failed.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    if (!appointment) {
      return NextResponse.json(
        {
          error:
            "Appointment not found.",
        },
        { status: 404 }
      );
    }

    if (
      appointment.payment_status !==
        "paid" ||
      appointment.booking_status !==
        "confirmed"
    ) {
      return NextResponse.json(
        {
          error:
            "Appointment is not a paid confirmed booking.",
          payment_status:
            appointment.payment_status,
          booking_status:
            appointment.booking_status,
        },
        { status: 400 }
      );
    }

    console.log(
      "Retrying Google Calendar for:",
      appointment.id
    );

    const result =
      await createGoogleCalendarEvent(
        appointment
      );

    console.log(
      "Google Calendar retry result:",
      result
    );

    return NextResponse.json({
      success: true,
      appointmentId:
        appointment.id,
      result,
    });
  } catch (error) {
    console.error(
      "Google Calendar retry failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Google Calendar retry failed.",
        stack:
          error?.stack ||
          null,
      },
      { status: 500 }
    );
  }
}
