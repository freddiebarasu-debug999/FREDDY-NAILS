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
      yocoCheckoutId,
    } = body;
    if (!name || !phone || !service || !clientCount || !date || !startTime || !endTime) {
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
    const { data, error } = await supabase
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
        yoco_checkout_id: yocoCheckoutId || null,
        notes: notes || null,
      })
      .select()
      .single();
    if (error) {
      console.error("Supabase booking error:", error);
      return Response.json(
        { error: "Unable to save the booking." },
        { status: 500 }
      );
    }
    return Response.json({
      success: true,
      appointment: data,
    });
  } catch (error) {
    console.error("Appointments API error:", error);
    return Response.json(
      { error: "Something went wrong while creating the appointment." },
      { status: 500 }
    );
  }
}
