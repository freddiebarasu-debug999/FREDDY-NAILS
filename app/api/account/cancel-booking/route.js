import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { deleteGoogleCalendarEvent } from "@/lib/google-calendar";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request) {
  try {
    /*
     * ---------------------------------------------------------
     * 1. Verify the customer's Supabase session
     * ---------------------------------------------------------
     */

    const authorization =
      request.headers.get("authorization") || "";

    if (!authorization.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error:
            "You must be logged in to cancel an appointment.",
        },
        { status: 401 }
      );
    }

    const accessToken =
      authorization.replace("Bearer ", "").trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "Your login session could not be verified.",
        },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      console.error(
        "Cancel booking authentication error:",
        userError
      );

      return NextResponse.json(
        {
          error:
            "Your session has expired. Please log in again.",
        },
        { status: 401 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 2. Get appointment ID from request
     * ---------------------------------------------------------
     */

    const body = await request.json();

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

    /*
     * ---------------------------------------------------------
     * 3. Find the appointment
     *
     * IMPORTANT:
     * We check BOTH:
     *   - appointment ID
     *   - profile_id = logged-in user's ID
     *
     * This prevents one customer from cancelling
     * another customer's appointment.
     * ---------------------------------------------------------
     */

    const {
      data: appointment,
      error: appointmentError,
    } = await supabaseAdmin
      .from("appointments")
      .select(`
        id,
        profile_id,
        booking_status,
        payment_status,
        booking_date,
        start_time,
        end_time,
        google_event_id
      `)
      .eq("id", appointmentId)
      .eq("profile_id", user.id)
      .maybeSingle();

    if (appointmentError) {
      console.error(
        "Appointment lookup error:",
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
            "Appointment not found or you do not have permission to cancel it.",
        },
        { status: 404 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 4. Prevent cancelling an appointment twice
     * ---------------------------------------------------------
     */

    const currentStatus =
      String(
        appointment.booking_status || ""
      ).toLowerCase();

    if (
      currentStatus === "cancelled" ||
      currentStatus === "canceled"
    ) {
      return NextResponse.json(
        {
          error:
            "This appointment has already been cancelled.",
        },
        { status: 400 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 5. Delete the Google Calendar event
     *
     * We do this before changing the database status.
     * If there is no Google event, we simply continue.
     * ---------------------------------------------------------
     */

    if (appointment.google_event_id) {
      try {
        await deleteGoogleCalendarEvent(
          appointment.google_event_id
        );
      } catch (calendarError) {
        /*
         * Do not prevent the customer from cancelling
         * their booking just because the Google Calendar
         * event could not be removed.
         *
         * The appointment will still be cancelled in
         * Supabase.
         */

        console.error(
          "Google Calendar cancellation error:",
          calendarError
        );
      }
    }

    /*
     * ---------------------------------------------------------
     * 6. Cancel the main appointment
     * ---------------------------------------------------------
     */

    const {
      data: updatedAppointment,
      error: updateError,
    } = await supabaseAdmin
      .from("appointments")
      .update({
        booking_status: "cancelled",
        google_event_id: null,
      })
      .eq("id", appointment.id)
      .eq("profile_id", user.id)
      .select(`
        id,
        booking_status,
        payment_status,
        booking_date,
        start_time,
        end_time
      `)
      .single();

    if (updateError) {
      console.error(
        "Appointment cancellation update error:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "Unable to cancel this appointment right now.",
        },
        { status: 500 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 7. Cancel all client records belonging to this booking
     * ---------------------------------------------------------
     */

    const {
      error: clientsUpdateError,
    } = await supabaseAdmin
      .from("appointment_clients")
      .update({
        booking_status: "cancelled",
      })
      .eq(
        "appointment_id",
        appointment.id
      );

    if (clientsUpdateError) {
      /*
       * The parent appointment is already cancelled.
       * Log the related-record problem rather than
       * pretending the whole cancellation failed.
       */

      console.error(
        "Appointment clients cancellation error:",
        clientsUpdateError
      );
    }

    /*
     * ---------------------------------------------------------
     * 8. Return success
     * ---------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,
        message:
          "Your appointment has been cancelled successfully.",
        appointment: updatedAppointment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Cancel booking route error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unable to cancel your appointment.",
      },
      { status: 500 }
    );
  }
}
