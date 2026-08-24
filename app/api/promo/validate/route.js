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

/*
 * Built-in Freddy Nails promos.
 *
 * These work even if the promo_codes table has a problem.
 * Supabase promos can still override these when the same
 * code exists in the database.
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

function calculateDiscount(amount, promo) {
  const discountValue = Number(
    promo.discount_value
  );

  if (
    !Number.isFinite(discountValue) ||
    discountValue < 0
  ) {
    return {
      discountAmount: 0,
      finalAmount: amount,
    };
  }

  let finalAmount = amount;

  if (promo.discount_type === "percent") {
    const percentage = Math.min(
      discountValue,
      100
    );

    finalAmount = Math.round(
      amount * (1 - percentage / 100)
    );
  }

  if (promo.discount_type === "fixed") {
    finalAmount = Math.max(
      0,
      amount - discountValue
    );
  }

  return {
    discountAmount: Math.max(
      0,
      Math.round(amount - finalAmount)
    ),
    finalAmount: Math.max(
      0,
      Math.round(finalAmount)
    ),
  };
}

export async function POST(request) {
  try {
    const body = await request.json();

    const rawCode = body?.code;
    const amount = Number(body?.amount);

    if (
      typeof rawCode !== "string" ||
      !rawCode.trim()
    ) {
      return Response.json(
        {
          valid: false,
          error: "Please enter a promo code.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      return Response.json(
        {
          valid: false,
          error: "Invalid booking amount.",
        },
        { status: 400 }
      );
    }

    const normalizedCode =
      rawCode.trim().toUpperCase();

    /*
     * First try Supabase.
     */
    let promo = null;

    const {
      data,
      error,
    } = await supabase
      .from("promo_codes")
      .select(
        "code, discount_type, discount_value, description, active"
      )
      .eq(
        "code",
        normalizedCode
      )
      .maybeSingle();

    if (!error && data) {
      promo = data;
    }

    /*
     * If Supabase doesn't contain the code,
     * use the built-in Freddy Nails promos.
     */
    if (!promo) {
      promo =
        BUILT_IN_PROMOS[
          normalizedCode
        ] || null;
    }

    if (!promo || !promo.active) {
      return Response.json(
        {
          valid: false,
          error:
            "That promo code isn't valid.",
        },
        { status: 400 }
      );
    }

    const discount =
      calculateDiscount(
        amount,
        promo
      );

    return Response.json({
      valid: true,

      code: promo.code,

      description:
        promo.description || null,

      discountType:
        promo.discount_type,

      discountValue:
        Number(
          promo.discount_value
        ),

      discountAmount:
        discount.discountAmount,

      finalAmount:
        discount.finalAmount,
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
          "Unable to verify the promo code. Please try again.",
      },
      { status: 500 }
    );
  }
}
