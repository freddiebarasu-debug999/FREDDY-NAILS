export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import {
  OPEN_MINUTES,
  CLOSE_MINUTES,
  MAX_CLIENTS_PER_DAY,
  clashesWithBuffer,
} from "@/lib/bookingRules";
import { createGoogleCalendarEvent } from "@/lib/google-calendar";
import {
  sendOwnerNotification,
  sendCustomerConfirmation,
} from "@/lib/booking-emails";
import {
  findFreeSetCode,
  checkFreeSetCode,
  claimFreeSetCode,
  releaseFreeSetCodeById,
  releaseFreeSetCodeByAppointment,
} from "@/lib/freeSetCodes";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable."
  );
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const DEPOSIT_PER_CLIENT = 90;
const MAX_CLIENTS = 4;
const MAX_SERVICES_PER_CLIENT = 4;


const SERVICE_OPTIONS = {
  "Acrylic — Plain Short–Medium (R200)": 90,
  "Acrylic — Plain Long (R250)": 105,
  "Acrylic — Plain XL–XXXL (R300)": 120,
  "Acrylic — French Short–Medium (R300)": 100,
  "Acrylic — French Long (R350)": 115,
  "Acrylic — French XL–XXL (R400)": 130,
  "Acrylic — Ombré Short–Medium (R250)": 120,
  "Acrylic — Ombré Long (R300)": 135,
  "Acrylic — Ombré XL–XXXL (R350)": 150,

  "Gel — Overlay (R200)": 75,
  "Gel — Plain Short–Medium (R250)": 90,
  "Gel — Plain Long (R300)": 100,
  "Gel — French Short–Medium (R300)": 95,
  "Gel — French Long (R350)": 110,

  "Pedicure — Gel Overlay (R150)": 45,
  "Pedicure — Gel Full Tips (R200)": 60,
  "Pedicure — Acrylic Overlay (R180)": 55,
  "Pedicure — Acrylic Full Tips (R200)": 65,
  "Pedicure — Acrylic French Tips (R250)": 75,

  "Lashes — Cluster (R130)": 45,
  "Lashes — Cateye (R150)": 60,
  "Lashes — Classic (R180)": 90,

  "Foot Spa — Basic (R200)": 30,
  "Foot Spa — Luxury (R280)": 45,

  "Extra — Buff & Shine (R150)": 30,
  "Extra — Fill-in @3 weeks (R180)": 75,
  "Extra — Nail Repair (R20–R30)": 15,
  "Extra — Soak Off (R50)": 20,
  "Extra — Nail Art (R30–R50)": 20,
  "Extra — Rhinestones (R10–R15)": 10,
  "Extra — 3D Art (R50–R100)": 30,
};

const BUILT_IN_PROMOS = {
  FIRSTVISIT: {
    code: "FIRSTVISIT",
    discount_type: "percent",
    discount_value: 15,
    description: "15% off your first visit",
    active: true,
    new_clients_only: true,
  },

  FRIEND50: {
    code: "FRIEND50",
    discount_type: "fixed",
    discount_value: 50,
    description: "R50 off when you bring a friend",
    active: true,
    new_clients_only: false,
  },

  BIRTHDAY: {
    code: "BIRTHDAY",
    discount_type: "fixed",
    discount_value: 50,
    description: "Birthday special — R50 off",
    active: true,
    new_clients_only: false,
  },
};

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    mins
  ).padStart(2, "0")}`;
}

function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidTime(time) {
  return /^\d{2}:\d{2}$/.test(time);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function phoneMatches(phoneA, phoneB) {
  const a = normalizePhone(phoneA);
  const b = normalizePhone(phoneB);

  if (!a || !b) {
    return false;
  }

  if (a === b) {
    return true;
  }

  // Compare the last 9 digits so 071 088 8897, +27 71 088 8897
  // and 27710888897 are recognised as the same South African number.
  const aLast9 = a.slice(-9);
  const bLast9 = b.slice(-9);

  return (
    aLast9.length === 9 &&
    bLast9.length === 9 &&
    aLast9 === bLast9
  );
}

function calculateClientDuration(services) {
  return services.reduce(
    (total, serviceName) =>
      total + (SERVICE_OPTIONS[serviceName] ?? 0),
    0
  );
}

function extractServicePrice(serviceName) {
  if (!serviceName) return 0;

  const match = serviceName.match(/\(R(\d+)(?:–\d+)?\)/);

  if (!match) return 0;

  return Number(match[1]) || 0;
}

function calculateServiceTotal(clientServices) {
  return clientServices.reduce(
    (total, services) =>
      total +
      services.reduce(
        (clientTotal, serviceName) =>
          clientTotal + extractServicePrice(serviceName),
        0
      ),
    0
  );
}

function calculateDiscountedAmount(amount, promo) {
  if (!promo || !promo.active) {
    return {
      finalAmount: amount,
      discountAmount: 0,
    };
  }

  const discountValue = Number(promo.discount_value);

  if (!Number.isFinite(discountValue) || discountValue < 0) {
    return {
      finalAmount: amount,
      discountAmount: 0,
    };
  }

  let finalAmount = amount;

  if (promo.discount_type === "percent") {
    const percentage = Math.min(discountValue, 100);

    finalAmount = Math.round(amount * (1 - percentage / 100));
  } else if (promo.discount_type === "fixed") {
    finalAmount = Math.max(0, amount - discountValue);
  }

  finalAmount = Math.max(0, Math.round(finalAmount));

  return {
    finalAmount,
    discountAmount: Math.max(0, Math.round(amount - finalAmount)),
  };
}

async function getAuthenticatedUser(request) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  if (!authorization.toLowerCase().startsWith("bearer ")) {
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
    console.error("Supabase authentication error:", error);

    return null;
  }

  return user;
}

function normalizePromoCode(code) {
  return String(code || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

function escapeLikeValue(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

async function getPromo(code) {
  const normalizedCode = normalizePromoCode(code);

  if (!normalizedCode) {
    return null;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      BUILT_IN_PROMOS,
      normalizedCode
    )
  ) {
    return BUILT_IN_PROMOS[normalizedCode];
  }

  const escapedCode = escapeLikeValue(normalizedCode);

  const { data, error } = await supabase
    .from("promo_codes")
    .select(
      `
        code,
        discount_type,
        discount_value,
        description,
        active,
        starts_at,
        expires_at,
        minimum_spend,
        new_clients_only,
        birthday_offer,
        referral_offer,
        max_uses,
        one_use_per_client
      `
    )
    .ilike("code", escapedCode)
    .maybeSingle();

  if (error) {
    console.error("Promo lookup error:", error);

    return null;
  }

  if (!data) {
    return null;
  }

  const now = new Date();

  if (data.starts_at) {
    const startsAt = new Date(data.starts_at);

    if (Number.isFinite(startsAt.getTime()) && now < startsAt) {
      return null;
    }
  }

  if (data.expires_at) {
    const expiresAt = new Date(data.expires_at);

    if (Number.isFinite(expiresAt.getTime()) && now >= expiresAt) {
      return null;
    }
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| New-client check
|--------------------------------------------------------------------------
|
| A client counts as existing if their profile, email or phone number
| appears on a previous appointment.
|
| Abandoned checkout attempts (never paid, and now pending or cancelled)
| are ignored, so a client who started paying and gave up still counts
| as new when they try again.
|
*/

function countsAsPreviousBooking(appointment) {
  const paymentStatus = String(
    appointment.payment_status || ""
  ).toLowerCase();

  const bookingStatus = String(
    appointment.booking_status || ""
  ).toLowerCase();

  const abandoned =
    paymentStatus === "pending" &&
    (bookingStatus === "pending" || bookingStatus === "cancelled");

  return !abandoned;
}

async function hasPreviousAppointment({ profileId, email, phone }) {
  if (profileId) {
    const { data, error } = await supabase
      .from("appointments")
      .select("id, payment_status, booking_status")
      .eq("profile_id", profileId)
      .limit(200);

    if (error) {
      console.error(
        "Previous profile appointment lookup error:",
        error
      );

      throw new Error("Unable to verify client eligibility.");
    }

    if ((data || []).some(countsAsPreviousBooking)) {
      return true;
    }
  }

  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail) {
    const { data, error } = await supabase
      .from("appointments")
      .select(
        "id, customer_email, payment_status, booking_status"
      )
      .ilike("customer_email", escapeLikeValue(normalizedEmail))
      .limit(200);

    if (error) {
      console.error(
        "Previous email appointment lookup error:",
        error
      );

      throw new Error("Unable to verify client eligibility.");
    }

    const emailMatch = (data || []).some(
      (appointment) =>
        normalizeEmail(appointment.customer_email) ===
          normalizedEmail && countsAsPreviousBooking(appointment)
    );

    if (emailMatch) {
      return true;
    }
  }

  const normalizedPhone = normalizePhone(phone);

  if (normalizedPhone) {
    const { data, error } = await supabase
      .from("appointments")
      .select(
        "id, customer_phone, payment_status, booking_status"
      )
      .limit(1000);

    if (error) {
      console.error(
        "Previous phone appointment lookup error:",
        error
      );

      throw new Error("Unable to verify client eligibility.");
    }

    const phoneMatch = (data || []).some(
      (appointment) =>
        phoneMatches(appointment.customer_phone, normalizedPhone) &&
        countsAsPreviousBooking(appointment)
    );

    if (phoneMatch) {
      return true;
    }
  }

  return false;
}

async function cancelExpiredPendingBookings() {
  const { error } = await supabase
    .from("appointments")
    .update({
      booking_status: "cancelled",
    })
    .eq("booking_status", "pending")
    .lt("expires_at", new Date().toISOString());

  if (error) {
    console.error("Expired booking cleanup error:", error);
  }
}

async function cancelAppointment(appointmentId) {
  await supabase
    .from("appointment_clients")
    .delete()
    .eq("appointment_id", appointmentId);

  await supabase
    .from("appointments")
    .update({
      booking_status: "cancelled",
    })
    .eq("id", appointmentId);

  // If this booking used a free-set code, give the code back.
  await releaseFreeSetCodeByAppointment(supabase, appointmentId);
}

export async function POST(request) {
  let appointmentId = null;

  try {
    const authenticatedUser = await getAuthenticatedUser(request);

    const profileId = authenticatedUser?.id ?? null;

    let body;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          error: "Invalid booking request.",
        },
        { status: 400 }
      );
    }

    const {
      name,
      phone,
      email,
      clientServices,
      clientCount,
      clientDates,
      clientStartTimes,
      notes,
      promoCode,
    } = body;

    if (!name || !phone || !email) {
      return Response.json(
        {
          error: "Please complete all required customer details.",
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return Response.json(
        {
          error: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(clientCount) ||
      clientCount < 1 ||
      clientCount > MAX_CLIENTS
    ) {
      return Response.json(
        {
          error: "You can book between 1 and 4 clients.",
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(clientServices) ||
      clientServices.length !== clientCount
    ) {
      return Response.json(
        {
          error: "Please select services for every client.",
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(clientDates) ||
      clientDates.length !== clientCount
    ) {
      return Response.json(
        {
          error: "Please choose a preferred date for every client.",
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(clientStartTimes) ||
      clientStartTimes.length !== clientCount
    ) {
      return Response.json(
        {
          error: "Please choose an available time for every client.",
        },
        { status: 400 }
      );
    }

    for (
      let clientIndex = 0;
      clientIndex < clientCount;
      clientIndex++
    ) {
      const services = clientServices[clientIndex];

      if (
        !Array.isArray(services) ||
        services.length < 1 ||
        services.length > MAX_SERVICES_PER_CLIENT
      ) {
        return Response.json(
          {
            error: `Client ${
              clientIndex + 1
            } must have between 1 and 4 services.`,
          },
          { status: 400 }
        );
      }

      const uniqueServices = new Set(services);

      if (uniqueServices.size !== services.length) {
        return Response.json(
          {
            error: `Client ${
              clientIndex + 1
            } cannot have the same service selected more than once.`,
          },
          { status: 400 }
        );
      }

      for (const serviceName of services) {
        if (
          !Object.prototype.hasOwnProperty.call(
            SERVICE_OPTIONS,
            serviceName
          )
        ) {
          return Response.json(
            {
              error: "One or more selected services are invalid.",
            },
            { status: 400 }
          );
        }
      }
    }

    for (
      let clientIndex = 0;
      clientIndex < clientCount;
      clientIndex++
    ) {
      const clientDate = clientDates[clientIndex];

      const clientTime = clientStartTimes[clientIndex];

      if (!isValidDate(clientDate)) {
        return Response.json(
          {
            error: `Please choose a valid date for Client ${
              clientIndex + 1
            }.`,
          },
          { status: 400 }
        );
      }

      if (!isValidTime(clientTime)) {
        return Response.json(
          {
            error: `Please choose a valid time for Client ${
              clientIndex + 1
            }.`,
          },
          { status: 400 }
        );
      }

      const selectedDate = new Date(`${clientDate}T12:00:00`);

      const today = new Date();

      today.setHours(0, 0, 0, 0);

      const bookingDate = new Date(`${clientDate}T00:00:00`);

      if (bookingDate < today) {
        return Response.json(
          {
            error: `Client ${
              clientIndex + 1
            } cannot be booked for a date in the past.`,
          },
          { status: 400 }
        );
      }

      if (selectedDate.getDay() === 0) {
        return Response.json(
          {
            error: `Client ${
              clientIndex + 1
            } cannot be booked on Sunday because Freddy Nails is closed.`,
          },
          { status: 400 }
        );
      }
    }

    const clientDurations = clientServices.map(
      calculateClientDuration
    );

    let clientEndTimes;

    try {
      clientEndTimes = clientStartTimes.map(
        (startTime, clientIndex) => {
          const startMinutes = timeToMinutes(startTime);

          const endMinutes =
            startMinutes + clientDurations[clientIndex];

          // 18:30 is the latest permitted appointment START time.
          // Treatments may finish after closing; the 15-minute buffer
          // still applies between clients booked on the same day.
          if (
            startMinutes < OPEN_MINUTES ||
            startMinutes > CLOSE_MINUTES
          ) {
            throw new Error(
              `Client ${
                clientIndex + 1
              }'s appointment is outside business hours.`
            );
          }

          return minutesToTime(endMinutes);
        }
      );
    } catch (timeError) {
      return Response.json(
        {
          error:
            timeError instanceof Error
              ? timeError.message
              : "One or more appointments are outside business hours.",
        },
        { status: 400 }
      );
    }

    for (
      let clientIndex = 1;
      clientIndex < clientCount;
      clientIndex++
    ) {
      if (
        clientDates[clientIndex] === clientDates[clientIndex - 1]
      ) {
        const previousEnd = timeToMinutes(
          clientEndTimes[clientIndex - 1]
        );

        const currentStart = timeToMinutes(
          clientStartTimes[clientIndex]
        );

        if (currentStart < previousEnd + 15) {
          return Response.json(
            {
              error: `Client ${
                clientIndex + 1
              } must start at least 15 minutes after Client ${clientIndex} finishes when they are booked on the same date.`,
            },
            { status: 400 }
          );
        }
      }
    }

    await cancelExpiredPendingBookings();

    /*
     * Final safety check, so nobody can book a time that breaks the rules:
     * a 15-minute gap between clients, and a daily maximum.
     */
    for (const checkDate of [...new Set(clientDates)]) {
      const { data: existingForDate } = await supabase
        .from("appointment_clients")
        .select("start_time, end_time")
        .eq("booking_date", checkDate)
        .in("booking_status", ["pending", "confirmed"]);

      const booked = (existingForDate || []).map((row) => ({
        start: timeToMinutes(row.start_time),
        end: timeToMinutes(row.end_time),
      }));

      const newForDate = clientDates.filter((d) => d === checkDate).length;

      if (booked.length + newForDate > MAX_CLIENTS_PER_DAY) {
        return Response.json(
          { error: "Freddy Nails is fully booked on that day. Please choose another date." },
          { status: 409 }
        );
      }

      for (let i = 0; i < clientCount; i++) {
        if (clientDates[i] !== checkDate) continue;

        const startMin = timeToMinutes(clientStartTimes[i]);
        const endMin = timeToMinutes(clientEndTimes[i]);

        if (clashesWithBuffer(startMin, endMin, booked)) {
          return Response.json(
            {
              error: `Client ${i + 1}'s time is no longer available. Please choose another time.`,
            },
            { status: 409 }
          );
        }
      }
    }

    const serviceTotalAmount = calculateServiceTotal(clientServices);

    let discountedServiceTotal = serviceTotalAmount;

    let serviceDiscountAmount = 0;

    let appliedPromoCode = null;

    /*
    |--------------------------------------------------------------------------
    | Promo validation + new-client enforcement
    |--------------------------------------------------------------------------
    */

    let freeSetRow = null;

    if (typeof promoCode === "string" && promoCode.trim()) {
      const freeLookup = await findFreeSetCode(supabase, promoCode);

      if (freeLookup.row) {
        const freeCheck = checkFreeSetCode(freeLookup.row);

        if (!freeCheck.valid) {
          return Response.json(
            { error: freeCheck.error },
            { status: 400 }
          );
        }

        freeSetRow = freeLookup.row;
      }
    }

    if (
      !freeSetRow &&
      typeof promoCode === "string" &&
      promoCode.trim()
    ) {
      const promo = await getPromo(promoCode);

      if (!promo || !promo.active) {
        return Response.json(
          {
            error: "That promo code isn't valid.",
          },
          { status: 400 }
        );
      }

      const normalizedPromoCode = normalizePromoCode(promo.code);

      // Any promo flagged new_clients_only (FIRSTVISIT, or a database
      // code with the flag switched on) is checked on the server
      // immediately before the appointment is created.
      if (promo.new_clients_only === true) {
        const existingClient = await hasPreviousAppointment({
          profileId,
          email,
          phone,
        });

        if (existingClient) {
          return Response.json(
            {
              error: `${normalizedPromoCode} is available to new Freddy Nails clients only. It looks like you've booked with us before.`,
              promoCode: normalizedPromoCode,
            },
            { status: 400 }
          );
        }
      }

      const discount = calculateDiscountedAmount(
        serviceTotalAmount,
        promo
      );

      discountedServiceTotal = discount.finalAmount;

      serviceDiscountAmount = discount.discountAmount;

      appliedPromoCode = normalizedPromoCode;
    }

    // Free-set code: claim it now so it can only ever be used once.
    if (freeSetRow) {
      const claimed = await claimFreeSetCode(supabase, freeSetRow);

      if (!claimed) {
        return Response.json(
          { error: "That code has already been used." },
          { status: 400 }
        );
      }

      appliedPromoCode = normalizePromoCode(freeSetRow.code);
      discountedServiceTotal = 0;
      serviceDiscountAmount = serviceTotalAmount;
    }

    /*
     * IMPORTANT:
     * The deposit is NEVER discounted.
     * It remains R90 per client.
     * The only exception is a personal free-set code, which waives it.
     */
    const depositAmount = freeSetRow
      ? 0
      : DEPOSIT_PER_CLIENT * clientCount;

    const serviceSummary = clientServices
      .map(
        (services, index) =>
          `Client ${index + 1}: ${services.join(" + ")} — ${
            clientDates[index]
          } ${clientStartTimes[index]}–${clientEndTimes[index]}`
      )
      .join(" | ");

    const parentStartTime = clientStartTimes[0];

    const parentEndTime = clientEndTimes[0];

    const parentDuration = clientDurations[0];

    const expiresAt = new Date(
      Date.now() + 15 * 60 * 1000
    ).toISOString();

    const appointmentInsert = {
      customer_name: name,
      customer_phone: phone,
      customer_email: email,
      service_name: serviceSummary,
      client_count: clientCount,
      booking_date: clientDates[0],
      start_time: parentStartTime,
      end_time: parentEndTime,
      duration_minutes: parentDuration,
      deposit_per_client: DEPOSIT_PER_CLIENT,
      deposit_amount: depositAmount,
      payment_status: freeSetRow ? "paid" : "pending",
      booking_status: freeSetRow ? "confirmed" : "pending",
      expires_at: freeSetRow ? null : expiresAt,
      notes: freeSetRow
        ? "FREE SET (code " +
          appliedPromoCode +
          "). No deposit paid." +
          (notes ? " " + notes : "")
        : notes || null,
      profile_id: profileId,
      promo_code: appliedPromoCode,
    };

    const { data: appointment, error: appointmentError } =
      await supabase
        .from("appointments")
        .insert(appointmentInsert)
        .select("id")
        .single();

    if (appointmentError) {
      console.error("Appointment insert error:", appointmentError);

      if (freeSetRow) {
        await releaseFreeSetCodeById(supabase, freeSetRow.id);
      }

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
        {
          error: "Unable to reserve the booking.",
        },
        { status: 500 }
      );
    }

    appointmentId = appointment.id;

    if (freeSetRow) {
      await supabase
        .from("free_set_codes")
        .update({ used_appointment_id: appointmentId })
        .eq("id", freeSetRow.id);
    }

    const clientRows = clientServices.map((services, index) => ({
      appointment_id: appointmentId,
      client_number: index + 1,
      service_name: services.join(" + "),
      booking_date: clientDates[index],
      start_time: clientStartTimes[index],
      end_time: clientEndTimes[index],
      duration_minutes: clientDurations[index],
      booking_status: freeSetRow ? "confirmed" : "pending",
    }));

    const { error: clientInsertError } = await supabase
      .from("appointment_clients")
      .insert(clientRows);

    if (clientInsertError) {
      console.error(
        "Client appointment insert error:",
        clientInsertError
      );

      await cancelAppointment(appointmentId);

      return Response.json(
        {
          error: "Unable to reserve all client appointment times.",
        },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

    const successUrl = profileId
      ? `${baseUrl}/account?booking=success&appointment=${appointmentId}`
      : `${baseUrl}/?booking=success&appointment=${appointmentId}#booking`;

    const cancelUrl = `${baseUrl}/?booking=cancelled&appointment=${appointmentId}#booking`;

    const failureUrl = `${baseUrl}/?booking=failed&appointment=${appointmentId}#booking`;

    // Free set: no payment is taken. Confirm it now, exactly like a paid booking.
    if (freeSetRow) {
      const { data: freeAppointment } = await supabase
        .from("appointments")
        .select(
          "id, customer_name, customer_phone, customer_email, service_name, client_count, booking_date, start_time, end_time, duration_minutes, notes, deposit_amount, payment_status, booking_status, google_event_id"
        )
        .eq("id", appointmentId)
        .maybeSingle();

      if (freeAppointment) {
        try {
          await createGoogleCalendarEvent({
            ...freeAppointment,
            payment_status: "paid",
            booking_status: "confirmed",
          });
        } catch (calendarError) {
          console.error("Free set calendar error:", calendarError);
        }

        try {
          await sendOwnerNotification(freeAppointment);
        } catch (ownerError) {
          console.error("Free set owner email error:", ownerError);
        }

        try {
          await sendCustomerConfirmation(freeAppointment);
        } catch (customerError) {
          console.error("Free set customer email error:", customerError);
        }
      }

      return Response.json({
        redirectUrl: successUrl,
        appointmentId,
        free: true,
        serviceTotalAmount,
        discountAmount: serviceDiscountAmount,
        discountedServiceTotal,
        promoCode: appliedPromoCode,
        depositAmount: 0,
        yocoAmount: 0,
      });
    }

    const yocoAmountCents = Math.round(depositAmount * 100);

    const yocoSecretKey = process.env.YOCO_SECRET_KEY;

    if (!yocoSecretKey) {
      await cancelAppointment(appointmentId);

      return Response.json(
        {
          error:
            "Payment configuration is missing. Please contact Freddy Nails.",
        },
        { status: 500 }
      );
    }

    const yocoResponse = await fetch(
      "https://payments.yoco.com/api/checkouts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${yocoSecretKey}`,
        },
        body: JSON.stringify({
          amount: yocoAmountCents,
          currency: "ZAR",
          successUrl,
          cancelUrl,
          failureUrl,
        }),
      }
    );

    let yocoData;

    try {
      yocoData = await yocoResponse.json();
    } catch {
      yocoData = {};
    }

    if (!yocoResponse.ok) {
      console.error("Yoco checkout error:", yocoData);

      await cancelAppointment(appointmentId);

      return Response.json(
        {
          error:
            "Unable to start the secure payment. Please try again.",
        },
        { status: 500 }
      );
    }

    const checkoutId = yocoData.id;

    const redirectUrl = yocoData.redirectUrl;

    if (!checkoutId || !redirectUrl) {
      console.error(
        "Yoco returned incomplete checkout data:",
        yocoData
      );

      await cancelAppointment(appointmentId);

      return Response.json(
        {
          error: "Yoco did not return a valid checkout link.",
        },
        { status: 500 }
      );
    }

    await supabase
      .from("appointments")
      .update({
        yoco_checkout_id: checkoutId,
      })
      .eq("id", appointmentId);

    return Response.json({
      redirectUrl,
      appointmentId,
      serviceTotalAmount,
      discountAmount: serviceDiscountAmount,
      discountedServiceTotal,
      promoCode: appliedPromoCode,
      depositAmount,
      yocoAmount: depositAmount,
    });
  } catch (error) {
    console.error("Checkout API error:", error);

    if (appointmentId) {
      await cancelAppointment(appointmentId);
    }

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong starting your booking.",
      },
      { status: 500 }
    );
  }
}
