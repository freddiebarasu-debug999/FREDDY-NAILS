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
    console.error(
      "Supabase authentication error:",
      error
    );

    return null;
  }

  return user;
}

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return Response.json(
        {
          error:
            "You must be logged in to continue to payment.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const appointmentId = body?.appointmentId;

    if (!appointmentId) {
      return Response.json(
        {
          error: "Booking ID is required.",
        },
        { status: 400 }
      );
    }

    /*
     * Fetch the exact booking.
     */
    const {
      data: appointment,
      error: appointmentError,
    } = await supabase
      .from("appointments")
      .select(`
        id,
        profile_id,
        customer_name,
        customer_email,
        booking_date,
        start_time,
        end_time,
        deposit_amount,
        payment_status,
        booking_status,
        expires_at
      `)
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return Response.json(
        {
          error: "Booking could not be found.",
        },
        { status: 404 }
      );
    }

    /*
     * Never trust an appointment ID by itself.
     * It must belong to the logged-in account.
     */
    if (appointment.profile_id !== user.id) {
      return Response.json(
        {
          error:
            "You are not allowed to pay for this booking.",
        },
        { status: 403 }
      );
    }

    const bookingStatus =
      String(
        appointment.booking_status || ""
      ).toLowerCase();

    const paymentStatus =
      String(
        appointment.payment_status || ""
      ).toLowerCase();

    /*
     * Cancelled bookings can never be paid.
     */
    if (bookingStatus === "cancelled") {
      return Response.json(
        {
          error:
            "This booking has been cancelled and can no longer be paid.",
        },
        { status: 409 }
      );
    }

    /*
     * Already-paid bookings should not create
     * another payment.
     */
    if (
      paymentStatus === "paid" ||
      paymentStatus === "deposit_paid" ||
      bookingStatus === "confirmed"
    ) {
      return Response.json(
        {
          error:
            "The deposit for this booking has already been paid.",
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
            "This booking is not currently available for payment.",
        },
        { status: 409 }
      );
    }

    /*
     * If the booking has expired, don't allow the client
     * to pay for a slot that is no longer being held.
     */
    if (appointment.expires_at) {
      const expiresAt = new Date(
        appointment.expires_at
      );

      if (
        !Number.isNaN(expiresAt.getTime()) &&
        expiresAt.getTime() < Date.now()
      ) {
        await supabase
          .from("appointments")
          .update({
            booking_status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", appointment.id)
          .eq("profile_id", user.id);

        await supabase
          .from("appointment_clients")
          .update({
            booking_status: "cancelled",
          })
          .eq(
            "appointment_id",
            appointment.id
          );

        return Response.json(
          {
            error:
              "This booking hold has expired. Please make a new booking.",
          },
          { status: 409 }
        );
      }
    }

    const depositAmount = Number(
      appointment.deposit_amount
    );

    if (
      !Number.isFinite(depositAmount) ||
      depositAmount <= 0
    ) {
      return Response.json(
        {
          error:
            "The deposit amount for this booking is invalid.",
        },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      new URL(request.url).origin;

    const successUrl =
      `${baseUrl}/?booking=success&appointment=${appointment.id}`;

    const cancelUrl =
      `${baseUrl}/?booking=cancelled&appointment=${appointment.id}`;

    const failureUrl =
      `${baseUrl}/?booking=failed&appointment=${appointment.id}`;

    /*
     * Create a fresh Yoco checkout for this exact
     * appointment.
     */
    const yocoResponse = await fetch(
      "https://payments.yoco.com/api/checkouts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            `Bearer ${process.env.YOCO_SECRET_KEY}`,
        },
        body: JSON.stringify({
          amount: Math.round(
            depositAmount * 100
          ),
          currency: "ZAR",
          successUrl,
          cancelUrl,
          failureUrl,
        }),
      }
    );

    const yocoData =
      await yocoResponse.json();

    if (!yocoResponse.ok) {
      console.error(
        "Account Yoco checkout error:",
        yocoData
      );

      return Response.json(
        {
          error:
            "Unable to start the secure payment. Please try again.",
        },
        { status: 500 }
      );
    }

    const checkoutId =
      yocoData.id;

    const redirectUrl =
      yocoData.redirectUrl;

    if (!checkoutId || !redirectUrl) {
      console.error(
        "Incomplete Yoco account checkout response:",
        yocoData
      );

      return Response.json(
        {
          error:
            "Yoco did not return a valid checkout link.",
        },
        { status: 500 }
      );
    }

    /*
     * Replace the stored checkout ID with the newest
     * payment attempt.
     */
    const { error: updateError } =
      await supabase
        .from("appointments")
        .update({
          yoco_checkout_id: checkoutId,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", appointment.id)
        .eq("profile_id", user.id);

    if (updateError) {
      console.error(
        "Account checkout ID update error:",
        updateError
      );

      return Response.json(
        {
          error:
            "Unable to save the payment session. Please try again.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      redirectUrl,
    });
  } catch (error) {
    console.error(
      "Account checkout API error:",
      error
    );

    return Response.json(
      {
        error:
          error?.message ||
          "Something went wrong starting payment.",
      },
      { status: 500 }
    );
  }
}
