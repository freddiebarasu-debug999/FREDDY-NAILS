export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

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

/*
|--------------------------------------------------------------------------
| Built-in Freddy Nails promotions
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizePromoCode(code) {
  return String(code || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
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

  // Compare the last 9 digits so 0710888897, 270710888897 and
  // +27710888897 are recognised as the same South African number.
  const aLast9 = a.slice(-9);
  const bLast9 = b.slice(-9);

  return (
    aLast9.length === 9 &&
    bLast9.length === 9 &&
    aLast9 === bLast9
  );
}

function escapeLikeValue(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

/*
|--------------------------------------------------------------------------
| Authenticated user
|--------------------------------------------------------------------------
*/

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
    return null;
  }

  return user;
}

/*
|--------------------------------------------------------------------------
| Get promo
|--------------------------------------------------------------------------
|
| Built-in promos are checked first.
| Database promos such as WELCOME10 are checked second.
|
*/

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
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Promo lookup error:", error);

    throw new Error("Unable to verify the promo code.");
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
| Check previous booking history
|--------------------------------------------------------------------------
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

      throw new Error(
        "Unable to verify first-time booking eligibility."
      );
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

      throw new Error(
        "Unable to verify first-time booking eligibility."
      );
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

      throw new Error(
        "Unable to verify first-time booking eligibility."
      );
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

/*
|--------------------------------------------------------------------------
| GET /api/promo/validate
|--------------------------------------------------------------------------
*/

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const rawCode = searchParams.get("code") || "";

    const normalizedCode = normalizePromoCode(rawCode);

    if (!normalizedCode) {
      return Response.json(
        {
          valid: false,
          error: "Please enter a promo code.",
        },
        { status: 400 }
      );
    }

    const promo = await getPromo(normalizedCode);

    if (!promo) {
      return Response.json(
        {
          valid: false,
          error: "That promo code isn't valid.",
        },
        { status: 400 }
      );
    }

    if (promo.active === false) {
      return Response.json(
        {
          valid: false,
          error: "That promo code isn't currently active.",
        },
        { status: 400 }
      );
    }

    // The booking form sends these when available.
    const email = searchParams.get("email") || "";

    const phone = searchParams.get("phone") || "";

    const authenticatedUser = await getAuthenticatedUser(request);

    const profileId = authenticatedUser?.id || null;

    const customerEmail = email || authenticatedUser?.email || "";

    /*
    |--------------------------------------------------------------------------
    | First-time promo check
    |--------------------------------------------------------------------------
    |
    | Only promos marked new_clients_only are checked against previous
    | appointments. FIRSTVISIT is marked this way. For database codes such
    | as WELCOME10, the flag is the new_clients_only column in Supabase.
    |
    */

    if (promo.new_clients_only === true) {
      const existingClient = await hasPreviousAppointment({
        profileId,
        email: customerEmail,
        phone,
      });

      if (existingClient) {
        return Response.json(
          {
            valid: false,
            error: `${normalizedCode} is only applicable to first-time bookings. Since you've booked with Freddy Nails before, this code can't be applied to this booking.`,
            promoCode: normalizedCode,
          },
          { status: 400 }
        );
      }
    }

    const minimumSpend = Number(promo.minimum_spend);

    const amount = Number(searchParams.get("amount"));

    if (
      Number.isFinite(minimumSpend) &&
      minimumSpend > 0 &&
      Number.isFinite(amount) &&
      amount < minimumSpend
    ) {
      return Response.json(
        {
          valid: false,
          error: `${normalizedCode} requires a minimum spend of R${minimumSpend}.`,
          promoCode: normalizedCode,
        },
        { status: 400 }
      );
    }

    const description =
      promo.description || "Offer applied successfully.";

    const discountValue = Number(promo.discount_value);

    const newClientsOnly = promo.new_clients_only === true;

    /*
     * The booking form reads code, discountType, discountValue,
     * description and newClientsOnly from the top level, so they are
     * returned there. The nested "promo" object is kept for anything
     * else that already uses it.
     */
    return Response.json({
      valid: true,

      code: normalizedCode,
      discountType: promo.discount_type,
      discountValue,
      description,
      newClientsOnly,

      promo: {
        code: normalizedCode,
        discount_type: promo.discount_type,
        discount_value: discountValue,
        description,
        active: promo.active !== false,
        new_clients_only: newClientsOnly,
      },
    });
  } catch (error) {
    console.error("Promo validation error:", error);

    return Response.json(
      {
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to validate the promo code.",
      },
      { status: 500 }
    );
  }
}
