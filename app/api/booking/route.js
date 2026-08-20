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

    const appointmentId =
      url.searchParams.get("id");

    if (!appointmentId) {
      return Response.json(
        {
          error:
            "Booking ID is required.",
        },
        { status: 400 }
      );
    }

    const {
      data: appointment,
      error: appointmentError,
    } = await supabase
      .from("appointments")
      .select(
        `
        id,
        customer_name,
        customer_email,
        service_name,
        client_count,
        booking_date,
        start_time,
        end_time,
        deposit_amount,
        payment_status,
        booking_status
        `
      )
      .eq("id", appointmentId)
      .maybeSingle();

    if (appointmentError) {
      console.error(
        "Booking lookup error:",
        appointmentError
      );

      return Response.json(
        {
          error:
            "Unable to find booking.",
        },
        { status: 500 }
      );
    }

    if (!appointment) {
      return Response.json(
        {
          error:
            "Booking not found.",
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
      return Response.json(
        {
          error:
            "This booking is not confirmed.",
        },
        { status: 403 }
      );
    }

    /*
     * Load every individual client appointment.
     */
    const {
      data: clients,
      error: clientsError,
    } = await supabase
      .from("appointment_clients")
      .select(
        `
        id,
        client_number,
        service_name,
        booking_date,
        start_time,
        end_time,
        duration_minutes,
        booking_status
        `
      )
      .eq(
        "appointment_id",
        appointmentId
      )
      .eq(
        "booking_status",
        "confirmed"
      )
      .order(
        "client_number",
        {
          ascending: true,
        }
      );

    if (clientsError) {
      console.error(
        "Client appointment lookup error:",
        clientsError
      );

      return Response.json(
        {
          error:
            "Unable to load individual appointments.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      appointment: {
        id: appointment.id,

        customerName:
          appointment.customer_name,

        customerEmail:
          appointment.customer_email,

        service:
          appointment.service_name,

        clientCount:
          appointment.client_count,

        bookingDate:
          appointment.booking_date,

        startTime:
          appointment.start_time,

        endTime:
          appointment.end_time,

        depositAmount:
          appointment.deposit_amount,

        clients:
          (clients || []).map(
            (client) => ({
              id: client.id,

              clientNumber:
                client.client_number,

              service:
                client.service_name,

              bookingDate:
                client.booking_date,

              startTime:
                client.start_time,

              endTime:
                client.end_time,

              durationMinutes:
                client.duration_minutes,
            })
          ),
      },
    });
  } catch (error) {
    console.error(
      "Booking API error:",
      error
    );

    return Response.json(
      {
        error:
          "Something went wrong loading the booking.",
      },
      { status: 500 }
    );
  }
}
