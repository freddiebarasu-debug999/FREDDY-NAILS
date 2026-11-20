import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

async function getGoogleAccessToken() {
  const supabaseAdmin =
    getSupabaseAdmin();

  const {
    data: connection,
    error,
  } = await supabaseAdmin
    .from(
      "google_calendar_connections"
    )
    .select(
      "calendar_id, refresh_token"
    )
    .eq("provider", "google")
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to load Google Calendar connection: ${error.message}`
    );
  }

  if (!connection?.refresh_token) {
    throw new Error(
      "Google Calendar is not connected."
    );
  }

  const clientId =
    process.env.GOOGLE_CLIENT_ID;

  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET."
    );
  }

  const tokenResponse =
    await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token:
            connection.refresh_token,
          grant_type:
            "refresh_token",
        }).toString(),
      }
    );

  const tokenData =
    await tokenResponse.json();

  if (
    !tokenResponse.ok ||
    !tokenData.access_token
  ) {
    console.error(
      "Google access token refresh failed:",
      tokenData
    );

    throw new Error(
      tokenData?.error_description ||
        tokenData?.error ||
        "Unable to refresh Google Calendar access."
    );
  }

  return {
    accessToken:
      tokenData.access_token,
    calendarId:
      connection.calendar_id ||
      "primary",
  };
}

/*
 * Google Calendar event IDs may only contain:
 *
 * 0123456789abcdefghijklmnopqrstuv
 *
 * Convert the appointment ID into a safe hexadecimal ID.
 */
function createSafeGoogleEventId(
  value
) {
  const input = String(value);

  let output = "";

  for (
    let i = 0;
    i < input.length;
    i++
  ) {
    output += input
      .charCodeAt(i)
      .toString(16)
      .padStart(2, "0");
  }

  return `f${output}`;
}

function buildEventId(
  appointmentId
) {
  return createSafeGoogleEventId(
    `freddynails-${appointmentId}`
  );
}

/*
 * Normalises Supabase/Postgres time values.
 *
 * Handles:
 * 09:30
 * 09:30:00
 * 09:30:00+02:00
 *
 * and converts them into:
 * 09:30:00
 */
function normalizeTime(value) {
  if (!value) {
    return null;
  }

  const text = String(value)
    .trim();

  const match = text.match(
    /^(\d{2}):(\d{2})(?::(\d{2}))?/
  );

  if (!match) {
    throw new Error(
      `Invalid appointment time: ${text}`
    );
  }

  const hours =
    Number(match[1]);

  const minutes =
    Number(match[2]);

  const seconds =
    Number(match[3] || 0);

  if (
    hours > 23 ||
    minutes > 59 ||
    seconds > 59
  ) {
    throw new Error(
      `Invalid appointment time: ${text}`
    );
  }

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":");
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const text = String(value)
    .trim();

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      text
    )
  ) {
    throw new Error(
      `Invalid appointment date: ${text}`
    );
  }

  return text;
}

/*
 * ---------------------------------------------------------------
 * ONE CALENDAR EVENT PER CLIENT
 *
 * A booking with 2+ clients creates one Google Calendar event for
 * each client, using that client's own date, time and services
 * (from the appointment_clients table).
 *
 * Every event gets a fixed ID built from the booking ID and the
 * client number, so the events can always be found again for
 * cancelling, and creating them twice is harmless.
 *
 * A single-client booking still makes one event with the original
 * ID, exactly as before.
 * ---------------------------------------------------------------
 */

const MAX_CLIENT_EVENTS = 4;

function buildClientEventId(
  appointmentId,
  clientNumber
) {
  return createSafeGoogleEventId(
    `freddynails-${appointmentId}-client-${clientNumber}`
  );
}

async function loadClientRows(
  appointmentId
) {
  const supabaseAdmin =
    getSupabaseAdmin();

  const { data, error } =
    await supabaseAdmin
      .from("appointment_clients")
      .select(
        "client_number, service_name, booking_date, start_time, end_time, booking_status"
      )
      .eq(
        "appointment_id",
        appointmentId
      )
      .order("client_number", {
        ascending: true,
      });

  if (error) {
    console.error(
      "Unable to load appointment clients for calendar:",
      error
    );

    return [];
  }

  return data || [];
}

function buildCalendarEvent(
  appointment,
  {
    id,
    clientRow = null,
    clientNumber = 1,
    clientTotal = 1,
  }
) {
  const bookingDate =
    normalizeDate(
      clientRow?.booking_date ||
        appointment.booking_date
    );

  const startTime =
    normalizeTime(
      clientRow?.start_time ||
        appointment.start_time
    );

  const endTime =
    normalizeTime(
      clientRow?.end_time ||
        appointment.end_time
    );

  if (
    !bookingDate ||
    !startTime ||
    !endTime
  ) {
    throw new Error(
      "Appointment is missing booking date or start/end time."
    );
  }

  const isMulti =
    clientTotal > 1;

  const serviceText =
    clientRow?.service_name ||
    appointment.service_name ||
    "—";

  const customerName =
    appointment.customer_name;

  return {
    id,

    summary: isMulti
      ? `Freddy Nails — ${customerName} (Client ${clientNumber} of ${clientTotal})`
      : `Freddy Nails — ${customerName}`,

    description: [
      "FREDDY NAILS",
      "",
      `Client: ${customerName}`,
      isMulti
        ? `Client ${clientNumber} of ${clientTotal} in this booking`
        : null,
      `Phone: ${appointment.customer_phone || "—"}`,
      `Email: ${appointment.customer_email || "—"}`,
      `Service: ${serviceText}`,
      `Clients in booking: ${clientTotal}`,
      isMulti
        ? `Deposit (whole booking): R${appointment.deposit_amount || 0}`
        : `Deposit: R${appointment.deposit_amount || 0}`,
      "Payment status: Paid",
      `Booking status: ${
        appointment.booking_status ||
        "Confirmed"
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
      dateTime: `${bookingDate}T${startTime}`,
      timeZone:
        "Africa/Johannesburg",
    },

    end: {
      dateTime: `${bookingDate}T${endTime}`,
      timeZone:
        "Africa/Johannesburg",
    },

    reminders: {
      useDefault: true,
    },
  };
}

async function readJsonSafely(
  response
) {
  const text =
    await response.text();

  try {
    return text
      ? JSON.parse(text)
      : null;
  } catch {
    return { raw: text };
  }
}

// Creates one event. A 409 means it already exists, which is fine.
async function insertGoogleEvent(
  accessToken,
  calendarId,
  event
) {
  const response =
    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId
      )}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(event),
      }
    );

  const data =
    await readJsonSafely(
      response
    );

  if (response.status === 409) {
    return {
      eventId: event.id,
      alreadyExists: true,
    };
  }

  if (!response.ok) {
    console.error(
      "Google Calendar event creation failed:",
      {
        status: response.status,
        response: data,
        eventId: event.id,
      }
    );

    throw new Error(
      data?.error?.message ||
        data?.error?.errors?.[0]
          ?.message ||
        `Google Calendar returned HTTP ${response.status}.`
    );
  }

  if (!data?.id) {
    throw new Error(
      "Google Calendar created the event but returned no event ID."
    );
  }

  return {
    eventId: data.id,
    alreadyExists: false,
  };
}

async function deleteGoogleEventById(
  accessToken,
  calendarId,
  eventId
) {
  const response =
    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId
      )}/events/${encodeURIComponent(
        eventId
      )}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

  // 404 / 410 = already gone, which is what we want.
  if (
    response.ok ||
    response.status === 404 ||
    response.status === 410
  ) {
    return;
  }

  const data =
    await readJsonSafely(
      response
    );

  console.error(
    "Google Calendar event deletion failed:",
    { eventId, response: data }
  );

  throw new Error(
    data?.error?.message ||
      "Unable to delete Google Calendar event."
  );
}

export async function createGoogleCalendarEvent(
  appointment
) {
  const supabaseAdmin =
    getSupabaseAdmin();

  if (
    appointment.google_event_id
  ) {
    console.log(
      "Google Calendar event already exists:",
      appointment.google_event_id
    );

    return {
      success: true,
      eventId:
        appointment.google_event_id,
      alreadyExists: true,
    };
  }

  const clientRows =
    await loadClientRows(
      appointment.id
    );

  const isMulti =
    clientRows.length > 1;

  const {
    accessToken,
    calendarId,
  } =
    await getGoogleAccessToken();

  const results = [];
  const failures = [];

  if (!isMulti) {
    // One client: one event, same ID as before.
    const event =
      buildCalendarEvent(
        appointment,
        {
          id: buildEventId(
            appointment.id
          ),
          clientRow:
            clientRows[0] || null,
          clientNumber: 1,
          clientTotal: 1,
        }
      );

    results.push(
      await insertGoogleEvent(
        accessToken,
        calendarId,
        event
      )
    );
  } else {
    // Two or more clients: remove the old combined event if an
    // earlier version of the site made one, then create one event
    // per client.
    try {
      await deleteGoogleEventById(
        accessToken,
        calendarId,
        buildEventId(appointment.id)
      );
    } catch (legacyError) {
      console.error(
        "Could not remove old combined event:",
        legacyError
      );
    }

    const total = Math.min(
      clientRows.length,
      MAX_CLIENT_EVENTS
    );

    for (
      let i = 0;
      i < total;
      i++
    ) {
      const row = clientRows[i];

      const clientNumber =
        Number(
          row.client_number
        ) || i + 1;

      try {
        const event =
          buildCalendarEvent(
            appointment,
            {
              id: buildClientEventId(
                appointment.id,
                clientNumber
              ),
              clientRow: row,
              clientNumber,
              clientTotal: total,
            }
          );

        results.push(
          await insertGoogleEvent(
            accessToken,
            calendarId,
            event
          )
        );
      } catch (clientError) {
        failures.push(
          `Client ${clientNumber}: ${
            clientError?.message ||
            clientError
          }`
        );
      }
    }
  }

  if (failures.length) {
    // Events that did work stay in the calendar. Running this
    // again only creates the missing ones.
    throw new Error(
      `Some calendar events could not be created. ${failures.join(
        " | "
      )}`
    );
  }

  const firstEventId =
    results[0].eventId;

  const {
    error: saveError,
  } =
    await supabaseAdmin
      .from("appointments")
      .update({
        google_event_id:
          firstEventId,
      })
      .eq("id", appointment.id);

  if (saveError) {
    throw new Error(
      `Calendar event was created, but its ID could not be saved: ${saveError.message}`
    );
  }

  console.log(
    "Google Calendar events ready:",
    results.map((r) => r.eventId)
  );

  return {
    success: true,
    eventId: firstEventId,
    eventIds: results.map(
      (r) => r.eventId
    ),
    alreadyExists: results.every(
      (r) => r.alreadyExists
    ),
  };
}

export async function deleteGoogleCalendarEvent(
  appointment
) {
  const supabaseAdmin =
    getSupabaseAdmin();

  if (
    !appointment?.google_event_id
  ) {
    return {
      success: true,
      deleted: false,
    };
  }

  const clientRows =
    await loadClientRows(
      appointment.id
    );

  // Every event that could belong to this booking.
  const eventIds =
    new Set([
      appointment.google_event_id,
      buildEventId(appointment.id),
    ]);

  const clientTotal = Math.min(
    Math.max(
      clientRows.length,
      Number(
        appointment.client_count
      ) || 1
    ),
    MAX_CLIENT_EVENTS
  );

  if (clientTotal > 1) {
    for (
      let n = 1;
      n <= clientTotal;
      n++
    ) {
      eventIds.add(
        buildClientEventId(
          appointment.id,
          n
        )
      );
    }
  }

  const {
    accessToken,
    calendarId,
  } =
    await getGoogleAccessToken();

  const failures = [];

  for (const eventId of eventIds) {
    try {
      await deleteGoogleEventById(
        accessToken,
        calendarId,
        eventId
      );
    } catch (deleteError) {
      failures.push(
        deleteError?.message ||
          String(deleteError)
      );
    }
  }

  if (failures.length) {
    throw new Error(
      failures.join(" | ")
    );
  }

  const { error } =
    await supabaseAdmin
      .from("appointments")
      .update({
        google_event_id: null,
      })
      .eq("id", appointment.id);

  if (error) {
    throw new Error(
      `Google Calendar events were deleted, but the appointment could not be updated: ${error.message}`
    );
  }

  console.log(
    "Google Calendar events deleted:",
    [...eventIds]
  );

  return {
    success: true,
    deleted: true,
  };
}

/*
  Finds the calendar event(s) already made for a booking by searching for
  the booking ID that every event description contains.

  Returns the first event id, or null. For a booking with several clients it
  returns null unless EVERY client already has an event, so the missing ones
  get created.
*/
export async function findGoogleCalendarEventId(text) {
  const { accessToken, calendarId } = await getGoogleAccessToken();

  const clientRows = await loadClientRows(text);
  const expected = Math.min(
    Math.max(clientRows.length, 1),
    MAX_CLIENT_EVENTS
  );

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/" +
      encodeURIComponent(calendarId) +
      "/events?singleEvents=true&maxResults=10&q=" +
      encodeURIComponent(text),
    { headers: { Authorization: "Bearer " + accessToken } }
  );

  if (!response.ok) {
    throw new Error(
      "Google Calendar search failed: " + response.status + " " + (await response.text())
    );
  }

  const data = await response.json();
  const found = (data.items || []).filter((e) => e.status !== "cancelled");

  if (found.length < expected) return null;
  return found[0] ? found[0].id : null;
}
