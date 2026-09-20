import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

function json(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control":
        "no-store, no-cache, must-revalidate",
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

/*
|--------------------------------------------------------------------------
| Built-in Freddy Nails promo codes
|--------------------------------------------------------------------------
*/

const BUILT_IN_PROMOS = {
  FIRSTVISIT: {
    code: "FIRSTVISIT",
    discount_type: "percent",
    discount_value: 15,
    description: "15% off your first visit",
    active: true,
  },

  FRIEND50: {
    code: "FRIEND50",
    discount_type: "fixed",
    discount_value: 50,
    description: "R50 off when you bring a friend",
    active: true,
  },

  BIRTHDAY: {
    code: "BIRTHDAY",
    discount_type: "fixed",
    discount_value: 50,
    description: "Birthday special — R50 off",
    active: true,
  },
};

/*
|--------------------------------------------------------------------------
| Validate promo configuration
|--------------------------------------------------------------------------
*/

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

  const discountValue = Number(
    promo.discount_value
  );

  if (
    !Number.isFinite(discountValue) ||
    discountValue < 0
  ) {
    console.error(
      "Invalid promo discount value:",
      promo
    );

    return {
      valid: false,
      error:
        "This promo code is configured incorrectly.",
    };
  }

  const discountType =
    String(
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
      error:
        "This promo code has an invalid discount type.",
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

    /*
     * WELCOME10 is stored in Supabase with
     * new_clients_only = true.
     *
     * We return this flag so the frontend can
     * understand that eligibility is restricted.
     *
     * The actual security enforcement happens
     * again inside the checkout API.
     */
    newClientsOnly:
      promo.new_clients_only === true,
  };
}

/*
|--------------------------------------------------------------------------
| Get promo
|--------------------------------------------------------------------------
*/

async function getPromo(code) {
  const normalizedCode =
    normalizeCode(code);

  if (!normalizedCode) {
    return null;
  }

  /*
   * Built-in promos first.
   */
  if (
    BUILT_IN_PROMOS[normalizedCode]
  ) {
    return BUILT_IN_PROMOS[
      normalizedCode
    ];
  }

  /*
   * Database promos.
   */
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
    .eq("active", true)
    .limit(100);

  if (error) {
    console.error(
      "Supabase promo lookup error:",
      error
    );

    throw error;
  }

  const now = new Date();

  const matchingPromo =
    (data || []).find((promo) => {
      if (
        normalizeCode(promo.code) !==
        normalizedCode
      ) {
        return false;
      }

      /*
       * Respect optional start date.
       */
      if (promo.starts_at) {
        const startsAt =
          new Date(promo.starts_at);

        if (
          Number.isFinite(
            startsAt.getTime()
          ) &&
          now < startsAt
        ) {
          return false;
        }
      }

      /*
       * Respect optional expiry date.
       */
      if (promo.expires_at) {
        const expiresAt =
          new Date(promo.expires_at);

        if (
          Number.isFinite(
            expiresAt.getTime()
          ) &&
          now >= expiresAt
        ) {
          return false;
        }
      }

      return true;
    });

  return matchingPromo || null;
}

/*
|--------------------------------------------------------------------------
| GET /api/promo/validate?code=WELCOME10
|--------------------------------------------------------------------------
|
| The promo can be validated as a valid promotion here.
|
| IMPORTANT:
| Actual new-client eligibility for WELCOME10 is
| enforced again inside /api/checkout.
|
| This prevents anyone from bypassing the restriction
| by calling the checkout API directly.
|--------------------------------------------------------------------------
*/

export async function GET(request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const rawCode =
      searchParams.get("code");

    if (
      !rawCode ||
      !rawCode.trim()
    ) {
      return json(
        {
          valid: false,
          error:
            "Please enter a promo code.",
        },
        400
      );
    }

    const code =
      normalizeCode(rawCode);

    const promo =
      await getPromo(code);

    if (!promo) {
      return json(
        {
          valid: false,
          error:
            "That promo code isn't valid.",
        },
        400
      );
    }

    const result =
      validatePromoConfiguration(
        promo
      );

    if (!result.valid) {
      return json(result, 400);
    }

    return json(result, 200);
  } catch (error) {
    console.error(
      "Unexpected promo validation error:",
      error
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
