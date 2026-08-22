import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function getGoogleAccessToken() {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: connection, error } = await supabaseAdmin
    .from("google_calendar_connections")
    .select("calendar_id, refresh_token")
    .eq("provider", "google")
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to load Google Calendar connection: ${error.message}`
    );
  }

  if (!connection?.refresh_token) {
    throw new Error("Google Calendar is not connected.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET."
    );
  }

  const tokenResponse = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: connection.refresh_token,
        grant_type: "refresh_token",
      }).toString(),
    }
  );

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenData.access_token) {
    console.error(
      "Google access token refresh failed:",
      tokenData
    );

    throw new Error(
      "Unable to refresh Google Calendar access."
    );
  }

  return {
    accessToken: tokenData.access_token,
    calendarId: connection.calendar_id || "primary",
  };
}

/*
 * Google Calendar event IDs must use only:
 *
 * 0123456789abcdefghijklmnopqrstuv
 *
 * This function converts arbitrary text into a safe ID.
 */
function createSafeGoogleEventId(value) {
  const input = String(value);

  let output = "";

  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);

    output += code
      .toString(16)
      .padStart(2, "0");
  }

  // Hexadecimal only uses 0-9 and a-f,
  // which are all valid Google Calendar ID characters.
  return `f${output}`;
}

function buildEventId(appointmentId) {
  return createSafeGoogleEventId(
    `freddynails-${appointmentId}`
  );
}

function buildCalendarEvent(appointment) {
  const startTime = appointment.start_time;
  const endTime = appointment.end_time;

  if (
    !appointment.booking_date ||
    !startTime ||
    !endTime
  ) {
    throw new Error(
      "Appointment is missing booking date or start/end time."
    );
  }

  const clientCount = Number(
    appointment.client_count || 1
  );

  return {
    id: buildEventId(appointment.id),

    summary: `Freddy Nails — ${appointment.customer_name}`,

    description: [
      "FREDDY NAILS",
      "",
      `Client: ${appointment.customer_name}`,
      `Phone: ${appointment.customer_phone || "—"}`,
      `Email: ${appointment.customer_email || "—"}`,
      `Service: ${appointment.service_name || "—"}`,
      `Clients: ${clientCount}`,
      `Deposit: R${appointment.deposit_amount || 0}`,
      "Payment status: Paid",
      `Booking status: ${
        appointment.booking_status || "Confirmed"
      }`,
      `Booking ID: ${appointment.id}`,
      appointment.notes
        ? `Notes: ${appointment.notes}`
        : null,
      "",
      "Booked through freddynails.co.za",
    ]
      .filter(Boolean)
      .join("\n"),

    start: {
      dateTime: `${appointment.booking_date}T${startTime}:00`,
      timeZone: "Africa/Johannesburg",
    },

    end: {
      dateTime: `${appointment.booking_date}T${endTime}:00`,
      timeZone: "Africa/Johannesburg",
    },

    reminders: {
      useDefault: true,
    },
  };
}

export async function createGoogleCalendarEvent(
  appointment
) {
  const supabaseAdmin = getSupabaseAdmin();

  if (appointment.google_event_id) {
    console.log(
      "Google Calendar event already exists:",
      appointment.google_event_id
    );

    return {
      success: true,
      eventId: appointment.google_event_id,
      alreadyExists: true,
    };
  }

  const {
    accessToken,
    calendarId,
  } = await getGoogleAccessToken();

  const event =
    buildCalendarEvent(appointment);

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 409) {
      console.log(
        "Google Calendar event already exists:",
        event.id
      );

      const {
        error: saveExistingError,
      } = await supabaseAdmin
        .from("appointments")
        .update({
          google_event_id: event.id,
        })
        .eq("id", appointment.id);

      if (saveExistingError) {
        throw new Error(
          `Google event exists, but saving its ID failed: ${saveExistingError.message}`
        );
      }

      return {
        success: true,
        eventId: event.id,
        alreadyExists: true,
      };
    }

    console.error(
      "Google Calendar event creation failed:",
      data
    );

    throw new Error(
      data?.error?.message ||
        "Unable to create Google Calendar event."
    );
  }

  const {
    error: saveError,
  } = await supabaseAdmin
    .from("appointments")
    .update({
      google_event_id: data.id,
    })
    .eq("id", appointment.id);

  if (saveError) {
    throw new Error(
      `Calendar event was created, but its ID could not be saved: ${saveError.message}`
    );
  }

  console.log(
    "Google Calendar event created:",
    data.id
  );

  return {
    success: true,
    eventId: data.id,
    alreadyExists: false,
  };
}

export async function deleteGoogleCalendarEvent(
  appointment
) {
  if (!appointment?.google_event_id) {
    return {
      success: true,
      deleted: false,
    };
  }

  const {
    accessToken,
    calendarId,
  } = await getGoogleAccessToken();

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events/${encodeURIComponent(
      appointment.google_event_id
    )}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (
    !response.ok &&
    response.status !== 404
  ) {
    const data = await response
      .json()
      .catch(() => null);

    console.error(
      "Google Calendar event deletion failed:",
      data
    );

    throw new Error(
      data?.error?.message ||
        "Unable to delete Google Calendar event."
    );
  }

  const {
    error,
  } = await supabaseAdmin
    .from("appointments")
    .update({
      google_event_id: null,
    })
    .eq("id", appointment.id);

  if (error) {
    throw new Error(
      `Google Calendar event was deleted, but the appointment could not be updated: ${error.message}`
    );
  }

  return {
    success: true,
    deleted: true,
  };
}
