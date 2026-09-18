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

const TIME_ZONE = "Africa/Johannesburg";
const LOCATION = "8 Rhodes, Quigney, East London, Eastern Cape, South Africa";

function escapeICSText(value = "") {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function formatICSDate(date, time) {
  const cleanTime = String(time || "00:00:00").slice(0, 8);

  const [hours = "00", minutes = "00", seconds = "00"] =
    cleanTime.split(":");

  return `${date.replace(/-/g, "")}T${hours.padStart(
    2,
    "0"
  )}${minutes.padStart(2, "0")}${seconds.padStart(2, "0")}`;
}

function formatICSDateUTC(date = new Date()) {
  return (
    date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "") + "Z"
  );
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const appointmentId = url.searchParams.get("appointment");

    if (!appointmentId) {
      return new Response("Booking ID is required.", {
        status: 400,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select(`
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
        booking_status,
        notes
      `)
      .eq("id", appointmentId)
      .maybeSingle();

    if (appointmentError) {
      console.error("Calendar appointment lookup error:", appointmentError);

      return new Response("Unable to load booking.", {
        status: 500,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    if (!appointment) {
      return new Response("Booking not found.", {
        status: 404,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    if (
      appointment.payment_status !== "paid" ||
      appointment.booking_status !== "confirmed"
    ) {
      return new Response("This booking is not confirmed.", {
        status: 403,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    const { data: clients, error: clientsError } = await supabase
      .from("appointment_clients")
      .select(`
        id,
        client_number,
        service_name,
        booking_date,
        start_time,
        end_time,
        duration_minutes,
        booking_status
      `)
      .eq("appointment_id", appointmentId)
      .eq("booking_status", "confirmed")
      .order("client_number", { ascending: true });

    if (clientsError) {
      console.error("Calendar clients lookup error:", clientsError);

      return new Response("Unable to load booking clients.", {
        status: 500,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    const confirmedClients = clients || [];

    /*
     * The current booking system supports multiple clients.
     *
     * If all clients are booked for the same date, use the earliest
     * start and latest end so the calendar event covers the complete visit.
     *
     * If clients have different dates, the calendar file contains the
     * primary/first appointment because one ICS VEVENT cannot represent
     * multiple separate dates.
     */

    let bookingDate = appointment.booking_date;
    let startTime = appointment.start_time;
    let endTime = appointment.end_time;

    if (confirmedClients.length > 0) {
      const sameDate = confirmedClients.every(
        (client) => client.booking_date === confirmedClients[0].booking_date
      );

      if (sameDate) {
        bookingDate = confirmedClients[0].booking_date;

        const sorted = [...confirmedClients].sort((a, b) =>
          String(a.start_time).localeCompare(String(b.start_time))
        );

        startTime = sorted[0].start_time;

        endTime = sorted.reduce((latest, client) => {
          return String(client.end_time).localeCompare(String(latest)) > 0
            ? client.end_time
            : latest;
        }, sorted[0].end_time);
      } else {
        bookingDate = confirmedClients[0].booking_date;
        startTime = confirmedClients[0].start_time;
        endTime = confirmedClients[0].end_time;
      }
    }

    const start = formatICSDate(bookingDate, startTime);
    const end = formatICSDate(bookingDate, endTime);
    const now = formatICSDateUTC();

    const clientLines =
      confirmedClients.length > 0
        ? confirmedClients
            .map(
              (client) =>
                `Client ${client.client_number}: ${client.service_name} — ${client.booking_date} ${client.start_time}-${client.end_time}`
            )
            .join("\n")
        : `Service: ${appointment.service_name || "Freddy Nails appointment"}`;

    const description = [
      "FREDDY NAILS",
      "",
      `Client: ${appointment.customer_name || ""}`,
      `Service: ${appointment.service_name || ""}`,
      `Clients: ${appointment.client_count || 1}`,
      "",
      clientLines,
      "",
      `Deposit paid: R${appointment.deposit_amount || 0}`,
      appointment.notes ? `Notes: ${appointment.notes}` : null,
      "",
      "Booked through freddynails.co.za",
      "WhatsApp: +27 71 088 8897",
    ]
      .filter(Boolean)
      .join("\n");

    const event = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Freddy Nails//Appointment//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:freddy-nails-${escapeICSText(appointment.id)}@freddynails.co.za`,
      `DTSTAMP:${now}`,
      `DTSTART;TZID=${TIME_ZONE}:${start}`,
      `DTEND;TZID=${TIME_ZONE}:${end}`,
      `SUMMARY:${escapeICSText(
        `Freddy Nails — ${appointment.customer_name || "Appointment"}`
      )}`,
      `LOCATION:${escapeICSText(LOCATION)}`,
      `DESCRIPTION:${escapeICSText(description)}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    return new Response(event, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="freddy-nails-${appointment.id}.ics"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Calendar file error:", error);

    return new Response("Unable to create calendar file.", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}
