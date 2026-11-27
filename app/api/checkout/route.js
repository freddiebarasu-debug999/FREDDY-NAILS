export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import {
  OPEN_MINUTES,
  CLOSE_MINUTES,
  MAX_CLIENTS_PER_DAY,
  clashesWithBuffer,
  explainClash,
  BUFFER_MINUTES,
} from "@/lib/bookingRules";
import { createGoogleCalendarEvent } from "@/lib/google-calendar";
import { findPrimaryConflict } from "@/lib/serviceRules";
import {
  isNailSetOnlyCode,
  isAccountOnlyCode,
  isNailSetService,
  NAIL_SETS_ONLY_MESSAGE,
} from "@/lib/promoRules";
import { isClosedDate } from "@/lib/closedDates";
import { getBusyForDate } from "@/lib/busyTimes";
import {
  getBlockedRangesForDate,
  overlapsBlockedRange,
} from "@/lib/blockedTimes";
import {
  sendOwnerNotification,
  sendCustomerConfirmation,
} from "@/lib/booking-emails";
import {
  formatServiceList,
  depositForClientServices,
  normalizeServiceName,
  SOAK_OFF_ALIASES,
} from "@/lib/serviceNames";
import {
  findReferrerByCode,
  recordSuccessfulReferral,
  normalizeReferralCode,
} from "@/lib/referralCodes";
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
// How long a slot is held while the client pays. Change this one number
// to make the hold longer or shorter.
const HOLD_MINUTES = 30;
const MAX_CLIENTS = 4;
const MAX_SERVICES_PER_CLIENT = 4;

function clientLabel(index) {
  return index === 0 ? "Your appointment" : `Guest ${index}`;
}

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

// --- FIX: Normalized lookup so frontend (no price, hyphen) matches backend (with price, en-dash) ---
const SERVICE_OPTIONS_BY_NORMALIZED = Object.fromEntries(
  Object.entries(SERVICE_OPTIONS).map(([name, duration]) => [
    normalizeServiceName(name),
    { originalName: name, duration },
  ])
);

// Add soak-off aliases so (own work) / (other salon) don't fail validation
for (const [alias, canonical] of Object.entries(SOAK_OFF_ALIASES)) {
  if (!SERVICE_OPTIONS_BY_NORMALIZED[alias] && SERVICE_OPTIONS[canonical]) {
    SERVICE_OPTIONS_BY_NORMALIZED[alias] = {
      originalName: canonical,
      duration: SERVICE_OPTIONS[canonical],
    };
  }
}

function lookupService(serviceName) {
  return SERVICE_OPTIONS_BY_NORMALIZED[normalizeServiceName(serviceName)] || null;
}
// --- END FIX ---

const BUILT_IN_PROMOS = {
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
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
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
  return String(email || "").trim().toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function phoneMatches(phoneA, phoneB) {
  const a = normalizePhone(phoneA);
  const b = normalizePhone(phoneB);
  if (!a || !b) return false;
  if (a === b) return true;
  const aLast9 = a.slice(-9);
  const bLast9 = b.slice(-9);
  return aLast9.length === 9 && bLast9.length === 9 && aLast9 === bLast9;
}

function calculateClientDuration(services) {
  return services.reduce(
    (total, serviceName) => total + (lookupService(serviceName)?.duration ?? 0),
    0
  );
}

function extractServicePrice(serviceName) {
  const canonical = lookupService(serviceName)?.originalName || serviceName;
  if (!canonical) return 0;
  const match = canonical.match(/\(R(\d+)(?:–\d+)?\)/);
  if (!match) return 0;
  return Number(match[1]) || 0;
}

function calculateServiceTotal(clientServices) {
  return clientServices.reduce(
    (total, services) =>
      total +
      services.reduce(
        (clientTotal, serviceName) => clientTotal + extractServicePrice(serviceName),
        0
      ),
    0
  );
}

function calculateDiscountedAmount(amount, promo) {
  if (!promo || !promo.active) {
    return { finalAmount: amount, discountAmount: 0 };
  }
  const discountValue = Number(promo.discount_value);
  if (!Number.isFinite(discountValue) || discountValue < 0) {
    return { finalAmount: amount, discountAmount: 0 };
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
  if (!authorization) return null;
  if (!authorization.toLowerCase().startsWith("bearer ")) return null;
  const accessToken = authorization.slice(7).trim();
  if (!accessToken) return null;
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
  return String(code || "").trim().replace(/\s+/g, "").toUpperCase();
}

function escapeLikeValue(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

async function getPromo(code) {
  const normalizedCode = normalizePromoCode(code);
  if (!normalizedCode) return null;
  if (Object.prototype.hasOwnProperty.call(BUILT_IN_PROMOS, normalizedCode)) {
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
  if (!data) return null;
  const now = new Date();
  if (data.starts_at) {
    const startsAt = new Date(data.starts_at);
    if (Number.isFinite(startsAt.getTime()) && now < startsAt) return null;
  }
  if (data.expires_at) {
    const expiresAt = new Date(data.expires_at);
    if (Number.isFinite(expiresAt.getTime()) && now >= expiresAt) return null;
  }
  return data;
}

function countsAsPreviousBooking(appointment) {
  const paymentStatus = String(appointment.payment_status || "").toLowerCase();
  const bookingStatus = String(appointment.booking_status || "").toLowerCase();
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
      console.error("Previous profile appointment lookup error:", error);
      throw new Error("Unable to verify client eligibility.");
    }
    if ((data || []).some(countsAsPreviousBooking)) return true;
  }
  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail) {
    const { data, error } = await supabase
      .from("appointments")
      .select("id, customer_email, payment_status, booking_status")
      .ilike("customer_email", escapeLikeValue(normalizedEmail))
      .limit(200);
    if (error) {
      console.error("Previous email appointment lookup error:", error);
      throw new Error("Unable to verify client eligibility.");
    }
    const emailMatch = (data || []).some(
      (appointment) =>
        normalizeEmail(appointment.customer_email) === normalizedEmail &&
        countsAsPreviousBooking(appointment)
    );
    if (emailMatch) return true;
  }
  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone) {
    const { data, error } = await supabase
      .from("appointments")
      .select("id, customer_phone, payment_status, booking_status")
      .limit(1000);
    if (error) {
      console.error("Previous phone appointment lookup error:", error);
      throw new Error("Unable to verify client eligibility.");
    }
    const phoneMatch = (data || []).some(
      (appointment) =>
        phoneMatches(appointment.customer_phone, normalizedPhone) &&
        countsAsPreviousBooking(appointment)
    );
    if (phoneMatch) return true;
  }
  return false;
}

async function cancelExpiredPendingBookings() {
  const { error } = await supabase
    .from("appointments")
    .update({ booking_status: "cancelled" })
    .eq("booking_status", "pending")
    .lt("expires_at", new Date().toISOString());
  if (error) console.error("Expired booking cleanup error:", error);
}

// When a client starts paying, we hold their slot. If they leave to check
// their bank and come back to book again, their OWN unpaid hold would block
// the same slot ("time is no longer available"). So before checking the
// slot we release this client's own unpaid, still-pending holds.
// Paid or confirmed bookings are never touched.
async function releaseOwnUnpaidHolds({ profileId, email }) {
  try {
    const ids = new Set();
    const select = "id, payment_status, booking_status, expires_at";

    if (profileId) {
      const { data } = await supabase
        .from("appointments")
        .select(select)
        .eq("profile_id", profileId)
        .eq("booking_status", "pending")
        .eq("payment_status", "pending");
      (data || []).forEach((row) => row.expires_at && ids.add(row.id));
    }

    const cleanEmail = String(email || "").trim();
    if (cleanEmail) {
      const { data } = await supabase
        .from("appointments")
        .select(select)
        .ilike("customer_email", escapeLikeValue(cleanEmail))
        .eq("booking_status", "pending")
        .eq("payment_status", "pending");
      (data || []).forEach((row) => row.expires_at && ids.add(row.id));
    }

    for (const id of ids) {
      await cancelAppointment(id);
    }
  } catch (releaseError) {
    console.error("Release own unpaid holds error:", releaseError);
  }
}

async function cancelAppointment(appointmentId) {
  await supabase.from("appointment_clients").delete().eq("appointment_id", appointmentId);
  await supabase
    .from("appointments")
    .update({ booking_status: "cancelled" })
    .eq("id", appointmentId);
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
      return Response.json({ error: "Invalid booking request." }, { status: 400 });
    }

    let {
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
        { error: "Please complete all required customer details." },
        { status: 400 }
      );
    }
    if (!isValidEmail(email)) {
      return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!Number.isInteger(clientCount) || clientCount < 1 || clientCount > MAX_CLIENTS) {
      return Response.json({ error: "You can book between 1 and 4 clients." }, { status: 400 });
    }
    if (!Array.isArray(clientServices) || clientServices.length !== clientCount) {
      return Response.json({ error: "Please select services for every client." }, { status: 400 });
    }
    if (!Array.isArray(clientDates) || clientDates.length !== clientCount) {
      return Response.json({ error: "Please choose a preferred date for every client." }, { status: 400 });
    }
    if (!Array.isArray(clientStartTimes) || clientStartTimes.length !== clientCount) {
      return Response.json({ error: "Please choose an available time for every client." }, { status: 400 });
    }

    for (let clientIndex = 0; clientIndex < clientCount; clientIndex++) {
      const services = clientServices[clientIndex];
      if (!Array.isArray(services) || services.length < 1 || services.length > MAX_SERVICES_PER_CLIENT) {
        return Response.json(
          { error: `${clientLabel(clientIndex)} must have between 1 and 4 services.` },
          { status: 400 }
        );
      }
      const uniqueServices = new Set(services.map((s) => normalizeServiceName(s)));
      if (uniqueServices.size !== services.length) {
        return Response.json(
          { error: `${clientLabel(clientIndex)} cannot have the same service selected more than once.` },
          { status: 400 }
        );
      }
      const primaryConflict = findPrimaryConflict(services);
      if (primaryConflict) {
        return Response.json(
          {
            error: `${clientLabel(clientIndex)} can only have one ${primaryConflict.label}. Please remove the extra one, or book it for another client.`,
          },
          { status: 400 }
        );
      }
      for (const serviceName of services) {
        if (!lookupService(serviceName)) {
          return Response.json(
            { error: "One or more selected services are invalid." },
            { status: 400 }
          );
        }
      }
    }

    for (let clientIndex = 0; clientIndex < clientCount; clientIndex++) {
      const clientDate = clientDates[clientIndex];
      const clientTime = clientStartTimes[clientIndex];
      if (!isValidDate(clientDate)) {
        return Response.json(
          { error: `Please choose a valid date for ${clientLabel(clientIndex)}.` },
          { status: 400 }
        );
      }
      if (!isValidTime(clientTime)) {
        return Response.json(
          { error: `Please choose a valid time for ${clientLabel(clientIndex)}.` },
          { status: 400 }
        );
      }
      const selectedDate = new Date(`${clientDate}T12:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bookingDate = new Date(`${clientDate}T00:00:00`);
      if (bookingDate < today) {
        return Response.json(
          { error: `${clientLabel(clientIndex)} cannot be booked for a date in the past.` },
          { status: 400 }
        );
      }
      if (selectedDate.getDay() === 0) {
        return Response.json(
          { error: `${clientLabel(clientIndex)} cannot be booked on Sunday because Freddy Nails is closed.` },
          { status: 400 }
        );
      }
      if (await isClosedDate(supabase, clientDate)) {
        return Response.json(
          { error: `${clientLabel(clientIndex)} cannot be booked on that date because Freddy Nails is closed. Please choose another day.` },
          { status: 400 }
        );
      }
    }

    const clientDurations = clientServices.map(calculateClientDuration);

    // Pre-load blocked ranges per unique date so we only hit the DB once per day.
    const blockedCache = {};
    async function blockedFor(date) {
      if (!(date in blockedCache)) {
        blockedCache[date] = await getBlockedRangesForDate(supabase, date);
      }
      return blockedCache[date];
    }

    let clientEndTimes;
    try {
      clientEndTimes = [];
      for (let clientIndex = 0; clientIndex < clientStartTimes.length; clientIndex++) {
        const startTime = clientStartTimes[clientIndex];
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = startMinutes + clientDurations[clientIndex];
        if (startMinutes < OPEN_MINUTES || startMinutes > CLOSE_MINUTES) {
          throw new Error(`${clientLabel(clientIndex)}'s appointment is outside business hours.`);
        }
        const ranges = await blockedFor(clientDates[clientIndex]);
        if (overlapsBlockedRange(startMinutes, endMinutes, ranges)) {
          throw new Error(
            `${clientLabel(clientIndex)}'s time is blocked (owner unavailable). Please choose another slot.`
          );
        }
        clientEndTimes.push(minutesToTime(endMinutes));
      }
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

    for (let clientIndex = 1; clientIndex < clientCount; clientIndex++) {
      if (clientDates[clientIndex] === clientDates[clientIndex - 1]) {
        const previousEnd = timeToMinutes(clientEndTimes[clientIndex - 1]);
        const currentStart = timeToMinutes(clientStartTimes[clientIndex]);
        if (currentStart < previousEnd + BUFFER_MINUTES) {
          return Response.json(
            {
              error: `${clientLabel(clientIndex)} must start at least ${BUFFER_MINUTES} minutes after ${clientLabel(clientIndex - 1)} finishes when they are booked on the same date.`,
            },
            { status: 400 }
          );
        }
      }
    }

    await cancelExpiredPendingBookings();
    await releaseOwnUnpaidHolds({ profileId, email });

    for (const checkDate of [...new Set(clientDates)]) {
      const existingForDate = await getBusyForDate(supabase, checkDate);
      const booked = existingForDate.map((row) => ({
        start: row.start,
        end: row.end,
      }));
      // Google-only calendar blocks do not count toward the client limit.
      const existingClientCount = existingForDate.filter((r) => !r.fromGoogle).length;
      const newForDate = clientDates.filter((d) => d === checkDate).length;
      if (existingClientCount + newForDate > MAX_CLIENTS_PER_DAY) {
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
          const who = i === 0 ? "Your" : `Guest ${i}'s`;
          const reason = explainClash(startMin, endMin, booked);
          const message =
            reason === "overrun"
              ? `${who} selected service${i === 0 ? "(s) would" : "s would"} run into the next appointment. Please choose an earlier time or a shorter service combination.`
              : `${who} chosen time has just been booked by someone else. Please choose another time.`;
          return Response.json(
            { error: message, availabilityChanged: true },
            { status: 409 }
          );
        }
      }
    }

    const serviceTotalAmount = calculateServiceTotal(clientServices);
    let discountedServiceTotal = serviceTotalAmount;
    let serviceDiscountAmount = 0;
    let appliedPromoCode = null;
    let freeSetRow = null;

    if (typeof promoCode === "string" && promoCode.trim()) {
      const freeLookup = await findFreeSetCode(supabase, promoCode);
      if (freeLookup.row) {
        const freeCheck = checkFreeSetCode(freeLookup.row);
        if (!freeCheck.valid) {
          return Response.json({ error: freeCheck.error }, { status: 400 });
        }
        freeSetRow = freeLookup.row;
      }
    }

    let pendingReferral = null;

    if (!freeSetRow && typeof promoCode === "string" && promoCode.trim()) {
      const referrer = await findReferrerByCode(supabase, promoCode);
      if (referrer) {
        if (profileId && profileId === referrer.id) {
          return Response.json({ error: "You can't use your own referral code." }, { status: 400 });
        }
        appliedPromoCode = normalizeReferralCode(promoCode);
        pendingReferral = {
          referrerProfileId: referrer.id,
          referralCode: appliedPromoCode,
        };
        notes = (
          (notes ? String(notes).trim() + " " : "") +
          "REFERRAL 10% OFF FINAL SERVICE (code " +
          appliedPromoCode +
          ")."
        ).trim();
        serviceDiscountAmount = Math.round(Number(serviceTotalAmount || 0) * 0.1);
        discountedServiceTotal = Math.max(0, Number(serviceTotalAmount || 0) - serviceDiscountAmount);
      } else {
        const promo = await getPromo(promoCode);
        if (!promo || !promo.active) {
          return Response.json({ error: "That promo code isn't valid." }, { status: 400 });
        }
        const normalizedPromoCode = normalizePromoCode(promo.code);
        const promoType = String(promo.discount_type || "").trim().toLowerCase();
        const promoValue = Number(promo.discount_value || 0);
        if (
          normalizedPromoCode === "FIRSTVISIT" ||
          ((promoType === "percent" || promoType === "percentage") && promoValue === 15)
        ) {
          return Response.json(
            { error: "The 15% first-visit offer is no longer available." },
            { status: 400 }
          );
        }
        if (promo.new_clients_only === true) {
          const existingClient = await hasPreviousAppointment({ profileId, email, phone });
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
        // Account-holder-only offers (e.g. BLACKFRIDAY40) need a login.
        if (isAccountOnlyCode(normalizedPromoCode) && !profileId) {
          return Response.json(
            {
              error: `${normalizedPromoCode} is exclusive to Freddy Nails account holders. Please log in to your account to use it.`,
              promoCode: normalizedPromoCode,
            },
            { status: 400 }
          );
        }

        if (isNailSetOnlyCode(normalizedPromoCode)) {
          // Discount only the nail sets (Acrylic / Gel). Soak offs and
          // all other services stay at full price.
          const nailSetTotal = clientServices.reduce(
            (total, services) =>
              total +
              services
                .filter((serviceName) => isNailSetService(serviceName))
                .reduce((sum, serviceName) => sum + extractServicePrice(serviceName), 0),
            0
          );
          if (nailSetTotal <= 0) {
            return Response.json(
              {
                error: `${normalizedPromoCode} applies to nail sets only (Acrylic & Gel). Please add a nail set, or remove the code.`,
                promoCode: normalizedPromoCode,
              },
              { status: 400 }
            );
          }
          const nailDiscount = calculateDiscountedAmount(nailSetTotal, promo);
          serviceDiscountAmount = nailDiscount.discountAmount;
          discountedServiceTotal = Math.max(0, serviceTotalAmount - serviceDiscountAmount);
          notes = (
            (notes ? String(notes).trim() + " " : "") +
            `PROMO ${normalizedPromoCode}: R${serviceDiscountAmount} off nail sets only (nail sets R${nailSetTotal}).`
          ).trim();
        } else {
          const discount = calculateDiscountedAmount(serviceTotalAmount, promo);
          discountedServiceTotal = discount.finalAmount;
          serviceDiscountAmount = discount.discountAmount;
        }
        appliedPromoCode = normalizedPromoCode;
      }
    }

    if (freeSetRow) {
      const claimed = await claimFreeSetCode(supabase, freeSetRow);
      if (!claimed) {
        return Response.json({ error: "That code has already been used." }, { status: 400 });
      }
      appliedPromoCode = normalizePromoCode(freeSetRow.code);
      discountedServiceTotal = 0;
      serviceDiscountAmount = serviceTotalAmount;
    }

    const depositAmount = freeSetRow
      ? 0
      : clientServices.reduce(
          (sum, services) =>
            sum +
            depositForClientServices(services, {
              standardDeposit: DEPOSIT_PER_CLIENT,
              waiveDeposit: false,
            }),
          0
        );

    const serviceSummary = clientServices
      .map(
        (services, index) =>
          `${clientLabel(index)}: ${formatServiceList(services)} — ${clientDates[index]} ${clientStartTimes[index]}–${clientEndTimes[index]}`
      )
      .join(" | ");

    const parentStartTime = clientStartTimes[0];
    const parentEndTime = clientEndTimes[0];
    const parentDuration = clientDurations[0];
    const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000).toISOString();

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
        ? "FREE SET (code " + appliedPromoCode + "). No deposit paid." + (notes ? " " + notes : "")
        : notes || null,
      profile_id: profileId,
      promo_code: appliedPromoCode,
    };

    const { data: appointment, error: appointmentError } = await supabase
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
          { error: "That time was just booked by someone else. Please choose another available time." },
          { status: 409 }
        );
      }
      return Response.json({ error: "Unable to reserve the booking." }, { status: 500 });
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
      service_name: formatServiceList(services),
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
      console.error("Client appointment insert error:", clientInsertError);
      await cancelAppointment(appointmentId);
      return Response.json({ error: "Unable to reserve all client appointment times." }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const successUrl = profileId
      ? `${baseUrl}/account?booking=success&appointment=${appointmentId}`
      : `${baseUrl}/?booking=success&appointment=${appointmentId}#booking`;
    const cancelUrl = `${baseUrl}/?booking=cancelled&appointment=${appointmentId}#booking`;
    const failureUrl = `${baseUrl}/?booking=failed&appointment=${appointmentId}#booking`;

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
          await createGoogleCalendarEvent({ ...freeAppointment, payment_status: "paid", booking_status: "confirmed" });
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
        { error: "Payment configuration is missing. Please contact Freddy Nails." },
        { status: 500 }
      );
    }

    const yocoResponse = await fetch("https://payments.yoco.com/api/checkouts", {
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
    });

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
        { error: "Unable to start the secure payment. Please try again." },
        { status: 500 }
      );
    }

    const checkoutId = yocoData.id;
    const redirectUrl = yocoData.redirectUrl;
    if (!checkoutId || !redirectUrl) {
      console.error("Yoco returned incomplete checkout data:", yocoData);
      await cancelAppointment(appointmentId);
      return Response.json({ error: "Yoco did not return a valid checkout link." }, { status: 500 });
    }

    await supabase
      .from("appointments")
      .update({ yoco_checkout_id: checkoutId })
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
      { error: error instanceof Error ? error.message : "Something went wrong starting your booking." },
      { status: 500 }
    );
  }
}
