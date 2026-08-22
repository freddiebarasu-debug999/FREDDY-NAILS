import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { deleteGoogleCalendarEvent } from "@/lib/google-calendar";
function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
export async function POST(request) {
  try {
    const authorization =
      request.headers.get("authorization") || "";
    if (!authorization.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }
    const accessToken =
      authorization.slice(7);
    const supabaseAdmin =
      getSupabaseAdmin();
    const {
      data: {
        user,
      },
      error: userError,
    } = await supabaseAdmin.auth.getUser(
      accessToken
    );
    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }
    const body =
      await request.json();
    const appointmentId =
      body?.appointmentId;
    if (!appointmentId) {
      return NextResponse.json(
        {
          error:
            "Appointment ID is required.",
        },
        { status: 400 }
      );
    }
    const {
      data: appointment,
      error: appointmentError,
    } =
      await supabaseAdmin
        .from("appointments")
        .select(
          `
            id,
            profile_id,
            booking_status,
            payment_status,
            google_event_id
          `
        )
        .eq(
          "id",
          appointmentId
        )
        .eq(
          "profile_id",
          user.id
        )
        .maybeSingle();
    if (appointmentError) {
      console.error(
        "Cancel booking lookup failed:",
        appointmentError
      );
      return NextResponse.json(
        {
          error:
            "Unable to find this appointment.",
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
      appointment.booking_status ===
      "cancelled"
    ) {
      return NextResponse.json({
        success: true,
        message:
          "This appointment is already cancelled.",
      });
    }
    if (
      appointment.booking_status ===
        "confirmed" ||
      appointment.payment_status ===
        "paid" ||
      appointment.booking_status ===
        "deposit_paid"
    ) {
      return NextResponse.json(
        {
          error:
            "This appointment cannot be cancelled from your account. Please contact Freddy Nails.",
        },
        { status: 400 }
      );
    }
    /*
     * Delete the matching Google Calendar event
     * before marking the appointment cancelled.
     *
     * If there is no Google event, this safely
     * returns without doing anything.
     */
    if (
      appointment.google_event_id
    ) {
      try {
        const calendarResult =
          await deleteGoogleCalendarEvent(
            appointment
          );
        console.log(
          "Google Calendar cancellation sync:",
          calendarResult
        );
      } catch (calendarError) {
        console.error(
          "Google Calendar cancellation failed:",
          calendarError
        );
        return NextResponse.json(
          {
            error:
              "The booking could not be cancelled because the Google Calendar event could not be removed. Please try again.",
          },
          { status: 500 }
        );
      }
    }
    const {
      error: updateError,
    } =
      await supabaseAdmin
        .from("appointments")
        .update({
          booking_status:
            "cancelled",
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          appointmentId
        )
        .eq(
          "profile_id",
          user.id
        );
    if (updateError) {
      console.error(
        "Appointment cancellation failed:",
        updateError
      );
      return NextResponse.json(
        {
          error:
            "Unable to cancel the appointment.",
        },
        { status: 500 }
      );
    }
    const {
      error: clientsError,
    } =
      await supabaseAdmin
        .from(
          "appointment_clients"
        )
        .update({
          booking_status:
            "cancelled",
        })
        .eq(
          "appointment_id",
          appointmentId
        );
    if (clientsError) {
      console.error(
        "Appointment clients cancellation update failed:",
        clientsError
      );
    }
    return NextResponse.json({
      success: true,
      message:
        "Appointment cancelled successfully.",
    });
  } catch (error) {
    console.error(
      "Cancel booking route error:",
      error
    );
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unable to cancel appointment.",
      },
      { status: 500 }
    );
  }
}
