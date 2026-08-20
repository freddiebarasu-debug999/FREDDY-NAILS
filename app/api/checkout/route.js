import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEPOSIT_PER_CLIENT = 90;

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      name,
      phone,
      email,
      service,
      clientCount,
      date,
      startTime,
      endTime,
      durationMinutes,
      notes,
    } = body;

    if (
      !name ||
      !phone ||
      !service ||
      !clientCount ||
      !date ||
      !startTime ||
      !endTime ||
      !durationMinutes
    ) {
      return Response.json(
        { error: "Please complete all required booking details." },
        { status: 400 }
      );
    }

    const numberOfClients = Number(clientCount);

    if (
      !Number.isInteger(numberOfClients) ||
      numberOfClients < 1 ||
      numberOfClients > 4
    ) {
      return Response.json(
        { error: "Invalid number of clients." },
        { status: 400 }
      );
    }

    const depositAmount = DEPOSIT_PER_CLIENT * numberOfClients;
    const amountInCents = depositAmount * 100;

    // Create the appointment first as pending.
    // The database exclusion constraint protects against double-booking.
    const { data: appointment, error: appointmentError } =
      await supabase
        .from("appointments")
        .insert({
          customer_name: name,
          customer_phone: phone,
          customer_email: email || null,
          service_name: service,
          client_count: numberOfClients,
          booking_date: date,
          start_time: startTime,
          end_time: endTime,
          duration_minutes: Number(durationMinutes),
          deposit_per_client: DEPOSIT_PER_CLIENT,
          deposit_amount: depositAmount,
          payment_status: "pending",
          booking_status: "pending",
          notes: notes || null,
        })
        .select()
        .single();

    if (appointmentError) {
      console.error(
        "Supabase appointment error:",
        appointmentError
      );

      // PostgreSQL exclusion constraint violation.
      // This means somebody else booked the same time first.
      if (appointmentError.code === "23P01") {
        return Response.json(
          {
            error:
              "That time was just booked by someone else. Please choose another available time.",
          },
          { status: 409 }
        );
      }

      return Response.json(
        { error: "Unable to save your booking." },
        { status: 500 }
      );
    }

    // Create the Yoco checkout.
    const response = await fetch(
      "https://payments.yoco.com/api/checkouts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
        },
        body: JSON.stringify({
          amount: amountInCents,
          currency: "ZAR",
          successUrl: `https://freddy-nails.vercel.app/?booking=success&appointment=${appointment.id}`,
          cancelUrl: `https://freddy-nails.vercel.app/?booking=cancelled&appointment=${appointment.id}`,
          failureUrl: `https://freddy-nails.vercel.app/?booking=failed&appointment=${appointment.id}`,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Yoco checkout error:", data);

      // Payment checkout failed, so mark the appointment as cancelled.
      await supabase
        .from("appointments")
        .update({
          booking_status: "cancelled",
        })
        .eq("id", appointment.id);

      return Response.json(
        { error: "Unable to create Yoco checkout." },
        { status: 500 }
      );
    }

    // Save the Yoco checkout ID against the appointment.
    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        yoco_checkout_id: data.id,
      })
      .eq("id", appointment.id);

    if (updateError) {
      console.error(
        "Unable to save Yoco checkout ID:",
        updateError
      );
    }

    return Response.json({
      success: true,
      appointmentId: appointment.id,
      checkoutId: data.id,
      redirectUrl: data.redirectUrl,
      amount: depositAmount,
    });
  } catch (error) {
    console.error("Checkout API error:", error);

    return Response.json(
      { error: "Something went wrong creating the payment." },
      { status: 500 }
    );
  }
}
