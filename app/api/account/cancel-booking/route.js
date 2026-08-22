export const dynamic = "force-dynamic";

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

async function getAuthenticatedUser(request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const accessToken = authorization.slice(7).trim();

  if (!accessToken) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return null;
  }

  return user;
}

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return Response.json(
        { error: "You must be logged in to cancel a booking." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const appointmentId = body?.appointmentId;

    if (!appointmentId) {
      return Response.json(
        { error: "Booking ID is required." },
        { status: 400 }
      );
    }

    const {
      data: appointment,
      error: appointmentError,
    } = await supabase
      .from("appointments")
      .select(`
        id,
        profile_id,
        booking_status,
        payment_status,
        booking_date,
        start_time,
        expires_at
      `)
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return Response.json(
        { error: "Booking could not be found." },
        { status: 404 }
      );
    }

    /*
     * The booking must belong to the currently
     * authenticated client.
     */
    if (appointment.profile_id !== user.id) {
      return Response.json(
        { error: "You are not allowed to cancel this booking." },
        { status: 403 }
      );
    }

    const bookingStatus =
      String(appointment.booking_status || "").toLowerCase();

    const paymentStatus =
      String(appointment.payment_status || "").toLowerCase();

    if (bookingStatus === "cancelled") {
      return Response.json(
        { error: "This booking has already been cancelled." },
        { status: 409 }
      );
    }

    if (
      bookingStatus === "confirmed" ||
      paymentStatus === "paid" ||
      paymentStatus === "deposit_paid"
    ) {
      return Response.json(
        {
          error:
            "This booking can no longer be cancelled from your account. Please contact Freddy Nails.",
        },
        { status: 409 }
      );
    }

    if (
      bookingStatus !== "pending" &&
      bookingStatus !== "approved"
    ) {
      return Response.json(
        {
          error:
            "This booking cannot be cancelled at its current stage.",
        },
        { status: 409 }
      );
    }

    /*
     * Keep the appointment in the database so it remains
     * visible in booking history, but release its slot by
     * changing the booking status to cancelled.
     */
    const {
      data: updatedAppointment,
      error: updateError,
    } = await supabase
      .from("appointments")
      .update({
        booking_status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .eq("profile_id", user.id)
      .select("id, booking_status, payment_status")
      .single();

    if (updateError || !updatedAppointment) {
      console.error(
        "Cancel booking update error:",
        updateError
      );

      return Response.json(
        { error: "Unable to cancel your booking." },
        { status: 500 }
      );
    }

    /*
     * Keep the child client appointment records in sync.
     */
    const { error: clientUpdateError } =
      await supabase
        .from("appointment_clients")
        .update({
          booking_status: "cancelled",
        })
        .eq("appointment_id", appointmentId);

    if (clientUpdateError) {
      console.error(
        "Client appointment cancellation sync error:",
        clientUpdateError
      );
    }

    return Response.json({
      success: true,
      appointment: updatedAppointment,
      message: "Your booking has been cancelled.",
    });
  } catch (error) {
    console.error(
      "Cancel booking API error:",
      error
    );

    return Response.json(
      {
        error:
          error?.message ||
          "Something went wrong cancelling your booking.",
      },
      { status: 500 }
    );
  }
}
