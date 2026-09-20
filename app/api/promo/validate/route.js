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
    new_clients_only: false,
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
  return String(phone || "")
    .replace(/\D/g, "");
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

  /*
   * Compare the last 9 digits so that:
   *
   * 0710888897
   * 270710888897
   * +27710888897
   *
   * are recognized as the same South African number.
   */
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
  const authorization =
    request.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  if (
    !authorization
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    return null;
  }

  const accessToken =
    authorization.slice(7).trim();

  if (!accessToken) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(
    accessToken
  );

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
  const normalizedCode =
    normalizePromoCode(code);

  if (!normalizedCode) {
    return null;
  }

  /*
   * FIRSTVISIT / FRIEND50 / BIRTHDAY
   */
  if (
    Object.prototype.hasOwnProperty.call(
      BUILT_IN_PROMOS,
      normalizedCode
    )
  ) {
    return BUILT_IN_PROMOS[
      normalizedCode
    ];
  }

  /*
   * Database promo
   */
  const escapedCode =
    escapeLikeValue(normalizedCode);

  const {
    data,
    error,
  } = await supabase
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
    console.error(
      "Promo lookup error:",
      error
    );

    throw new Error(
      "Unable to verify the promo code."
    );
  }

  if (!data) {
    return null;
  }

  const now = new Date();

  /*
   * Start date
   */
  if (data.starts_at) {
    const startsAt =
      new Date(data.starts_at);

    if (
      Number.isFinite(
        startsAt.getTime()
      ) &&
      now < startsAt
    ) {
      return null;
    }
  }

  /*
   * Expiry date
   */
  if (data.expires_at) {
    const expiresAt =
      new Date(data.expires_at);

    if (
      Number.isFinite(
        expiresAt.getTime()
      ) &&
      now >= expiresAt
    ) {
      return null;
    }
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| Check previous booking history
|--------------------------------------------------------------------------
*/

async function hasPreviousAppointment({
  profileId,
  email,
  phone,
}) {
  /*
   * 1. Logged-in profile
   */
  if (profileId) {
    const {
      data,
      error,
    } = await supabase
      .from("appointments")
      .select("id")
      .eq("profile_id", profileId)
      .limit(1);

    if (error) {
      console.error(
        "Previous profile appointment lookup error:",
        error
      );

      throw new Error(
        "Unable to verify first-time booking eligibility."
      );
    }

    if (data && data.length > 0) {
      return true;
    }
  }

  /*
   * 2. Email
   */
  const normalizedEmail =
    normalizeEmail(email);

  if (normalizedEmail) {
    const {
      data,
      error,
    } = await supabase
      .from("appointments")
      .select(
        "id, customer_email"
      )
      .limit(1000);

    if (error) {
      console.error(
        "Previous email appointment lookup error:",
        error
      );

      throw new Error(
        "Unable to verify first-time booking eligibility."
      );
    }

    const emailMatch =
      (data || []).some(
        (appointment) =>
          normalizeEmail(
            appointment.customer_email
          ) === normalizedEmail
      );

    if (emailMatch) {
      return true;
    }
  }

  /*
   * 3. Phone
   */
  const normalizedPhone =
    normalizePhone(phone);

  if (normalizedPhone) {
    const {
      data,
      error,
    } = await supabase
      .from("appointments")
      .select(
        "id, customer_phone"
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

    const phoneMatch =
      (data || []).some(
        (appointment) =>
          phoneMatches(
            appointment.customer_phone,
            normalizedPhone
          )
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
    const { searchParams } =
      new URL(request.url);

    const rawCode =
      searchParams.get("code") || "";

    const normalizedCode =
      normalizePromoCode(rawCode);

    if (!normalizedCode) {
      return Response.json(
        {
          valid: false,
          error:
            "Please enter a promo code.",
        },
        { status: 400 }
      );
    }

    /*
     * Find promo.
     */
    const promo =
      await getPromo(normalizedCode);

    if (!promo) {
      return Response.json(
        {
          valid: false,
          error:
            "That promo code isn't valid.",
        },
        { status: 400 }
      );
    }

    /*
     * Check active status.
     */
    if (promo.active === false) {
      return Response.json(
        {
          valid: false,
          error:
            "That promo code isn't currently active.",
        },
        { status: 400 }
      );
    }

    /*
     * Customer information.
     *
     * Booking.js sends these when available.
     */
    const email =
      searchParams.get("email") || "";

    const phone =
      searchParams.get("phone") || "";

    /*
     * Logged-in user, if available.
     */
    const authenticatedUser =
      await getAuthenticatedUser(
        request
      );

    const profileId =
      authenticatedUser?.id || null;

    const customerEmail =
      email ||
      authenticatedUser?.email ||
      "";

    /*
    |--------------------------------------------------------------------------
    | FIRST-TIME PROMO CHECK
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | Only promos explicitly marked new_clients_only
    | are checked against previous appointments.
    |
    | Therefore:
    |
    | WELCOME10 → checked
    | FIRSTVISIT → allowed through
    | FRIEND50 → allowed through
    | BIRTHDAY → allowed through
    |
    */

    if (
      promo.new_clients_only === true
    ) {
      const existingClient =
        await hasPreviousAppointment({
          profileId,
          email: customerEmail,
          phone,
        });

      if (existingClient) {
        return Response.json(
          {
            valid: false,
            error:
              `${normalizedCode} is only applicable to first-time bookings. Since you've booked with Freddy Nails before, this code can't be applied to this booking.`,
            promoCode:
              normalizedCode,
          },
          { status: 400 }
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Optional minimum spend
    |--------------------------------------------------------------------------
    */

    const minimumSpend =
      Number(promo.minimum_spend);

    const amount =
      Number(
        searchParams.get("amount")
      );

    if (
      Number.isFinite(
        minimumSpend
      ) &&
      minimumSpend > 0 &&
      Number.isFinite(amount) &&
      amount < minimumSpend
    ) {
      return Response.json(
        {
          valid: false,
          error:
            `${normalizedCode} requires a minimum spend of R${minimumSpend}.`,
          promoCode:
            normalizedCode,
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SUCCESS
    |--------------------------------------------------------------------------
    */

    return Response.json({
      valid: true,

      promo: {
        code: normalizedCode,

        discount_type:
          promo.discount_type,

        discount_value:
          Number(
            promo.discount_value
          ),

        description:
          promo.description ||
          "Offer applied successfully.",

        active:
          promo.active !== false,

        new_clients_only:
          promo.new_clients_only === true,
      },
    });
  } catch (error) {
    console.error(
      "Promo validation error:",
      error
    );

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
