import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

function json(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control":
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Content-Type": "application/json",
    },
  });
}

function normalizeCode(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

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

function validatePromoConfiguration(promo) {
  if (!promo) {
    return {
      valid: false,
      error: "That promo code isn't valid.",
    };
  }

  if (promo.active === false) {
    return {
      valid: false,
      error: "That promo code is no longer active.",
    };
  }

  const discountValue = Number(promo.discount_value);

  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    console.error(
      "Invalid promo discount value:",
      promo
    );

    return {
      valid: false,
      error: "This promo code is configured incorrectly.",
    };
  }

  const discountType = String(
    promo.discount_type || ""
  ).toLowerCase();

  if (
    discountType !== "percent" &&
    discountType !== "fixed"
  ) {
    console.error(
      "Invalid promo discount type:",
      promo
    );

    return {
      valid: false,
      error: "This promo code has an invalid discount type.",
    };
  }

  if (
    discountType === "percent" &&
    discountValue > 100
  ) {
    return {
      valid: false,
      error:
        "This promo code has an invalid percentage discount.",
    };
  }

  return {
    valid: true,
    code: normalizeCode(promo.code),
    discountType,
    discountValue,
    description: promo.description || "",
    active: true,
    newClientsOnly:
      promo.new_clients_only === true,
    minimumSpend:
      promo.minimum_spend !== null &&
      promo.minimum_spend !== undefined
        ? Number(promo.minimum_spend)
        : null,
  };
}

async function getDatabasePromo(code) {
  const normalizedCode = normalizeCode(code);

  if (!normalizedCode) {
    return null;
  }

  if (
    !supabaseUrl ||
    !supabaseServiceRoleKey
  ) {
    throw new Error(
      "Supabase environment variables are missing."
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
   * Do NOT filter by active here.
   *
   * We want to retrieve the promo first so that we can
   * correctly tell the customer if the code exists but
   * is inactive.
   *
   * We also use limit(1) instead of maybeSingle() so that
   * the API does not fail if an old duplicate somehow exists.
   */
  const { data, error } = await supabase
    .from("promo_codes")
    .select(`
      code,
      discount_type,
      discount_value,
      active,
      description,
      starts_at,
      expires_at,
      minimum_spend,
      new_clients_only,
      birthday_offer,
      referral_offer,
      max_uses,
      one_use_per_client
    `)
    .ilike("code", normalizedCode)
    .limit(1);

  if (error) {
    console.error(
      "Supabase promo lookup failed:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw error;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return data[0];
}

function checkPromoDates(promo) {
  const now = new Date();

  if (promo.starts_at) {
    const startsAt = new Date(promo.starts_at);

    if (
      Number.isFinite(startsAt.getTime()) &&
      now < startsAt
    ) {
      return {
        valid: false,
        error: "This promo code is not active yet.",
      };
    }
  }

  if (promo.expires_at) {
    const expiresAt = new Date(promo.expires_at);

    if (
      Number.isFinite(expiresAt.getTime()) &&
      now > expiresAt
    ) {
      return {
        valid: false,
        error: "This promo code has expired.",
      };
    }
  }

  return {
    valid: true,
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(
      request.url
    );

    const rawCode = searchParams.get("code");

    if (!rawCode || !rawCode.trim()) {
      return json(
        {
          valid: false,
          error: "Please enter a promo code.",
        },
        400
      );
    }

    const code = normalizeCode(rawCode);

    /*
     * Built-in promotions
     */
    if (BUILT_IN_PROMOS[code]) {
      const result =
        validatePromoConfiguration(
          BUILT_IN_PROMOS[code]
        );

      if (!result.valid) {
        return json(result, 400);
      }

      return json(result, 200);
    }

    /*
     * Database promotions
     */
    const promo = await getDatabasePromo(code);

    if (!promo) {
      return json(
        {
          valid: false,
          error: "That promo code isn't valid.",
        },
        400
      );
    }

    /*
     * Check whether the database promotion is active.
     */
    const configuration =
      validatePromoConfiguration(promo);

    if (!configuration.valid) {
      return json(configuration, 400);
    }

    /*
     * Check start / expiry dates.
     */
    const dateCheck =
      checkPromoDates(promo);

    if (!dateCheck.valid) {
      return json(dateCheck, 400);
    }

    /*
     * Minimum spend is returned to the frontend.
     * The checkout route remains responsible for
     * enforcing the final amount.
     */
    return json(
      {
        ...configuration,
        birthdayOffer:
          promo.birthday_offer === true,
        referralOffer:
          promo.referral_offer === true,
        maxUses:
          promo.max_uses ?? null,
        oneUsePerClient:
          promo.one_use_per_client === true,
      },
      200
    );
  } catch (error) {
    /*
     * Keep the customer-facing message clean,
     * but log the REAL Supabase/server error so
     * Vercel logs tell us exactly what went wrong.
     */
    console.error(
      "PROMO VALIDATION ERROR:",
      {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        stack: error?.stack,
      }
    );

    return json(
      {
        valid: false,
        error:
          "Unable to verify the promo code. Please try again.",
      },
      500
    );
  }
}
