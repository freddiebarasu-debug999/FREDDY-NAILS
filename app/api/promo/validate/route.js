import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.SUPABASE_URL;
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
    .toUpperCase();
}

function escapeLikeValue(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

function validatePromoConfiguration(promo) {
  if (!promo) {
    return {
      valid: false,
      error: "That promo code isn't valid.",
    };
  }

  if (!promo.active) {
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

  if (
    promo.discount_type !== "percent" &&
    promo.discount_type !== "fixed"
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
    promo.discount_type === "percent" &&
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
    discountType: promo.discount_type,
    discountValue,
    description: promo.description || "",
    active: true,
  };
}

async function getPromo(code) {
  const normalizedCode = normalizeCode(code);

  if (!normalizedCode) {
    return null;
  }

  const builtInPromo =
    BUILT_IN_PROMOS[normalizedCode];

  if (builtInPromo) {
    return builtInPromo;
  }

  const escapedCode =
    escapeLikeValue(normalizedCode);

  const {
    data,
    error,
  } = await supabase
    .from("promo_codes")
    .select(
      "code, discount_type, discount_value, description, active"
    )
    .ilike("code", escapedCode)
    .maybeSingle();

  if (error) {
    console.error(
      "Supabase promo lookup error:",
      error
    );

    throw error;
  }

  return data || null;
}

export async function GET(request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const rawCode =
      searchParams.get("code");

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

    const promo = await getPromo(code);

    if (!promo) {
      return json(
        {
          valid: false,
          error: "That promo code isn't valid.",
        },
        400
      );
    }

    const result =
      validatePromoConfiguration(promo);

    if (!result.valid) {
      return json(result, 400);
    }

    return json(result);
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
