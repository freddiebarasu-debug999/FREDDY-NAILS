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

export async function GET(request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const code =
      searchParams
        .get("code")
        ?.trim()
        .toUpperCase();

    if (!code) {
      return Response.json(
        {
          error:
            "Please enter a promo code.",
        },
        { status: 400 }
      );
    }

    const {
      data: promo,
      error,
    } = await supabase
      .from("promo_codes")
      .select(
        "code, discount_type, discount_value, description, active"
      )
      .eq("code", code)
      .maybeSingle();

    if (error) {
      console.error(
        "Promo validation error:",
        error
      );

      return Response.json(
        {
          error:
            "Unable to verify the promo code. Please try again.",
        },
        { status: 500 }
      );
    }

    if (!promo) {
      return Response.json(
        {
          error:
            "That promo code isn't valid.",
        },
        { status: 400 }
      );
    }

    if (!promo.active) {
      return Response.json(
        {
          error:
            "That promo code is no longer active.",
        },
        { status: 400 }
      );
    }

    const discountValue =
      Number(promo.discount_value);

    if (
      !Number.isFinite(discountValue) ||
      discountValue < 0
    ) {
      return Response.json(
        {
          error:
            "This promo code has an invalid discount.",
        },
        { status: 400 }
      );
    }

    if (
      promo.discount_type !== "percent" &&
      promo.discount_type !== "fixed"
    ) {
      return Response.json(
        {
          error:
            "This promo code has an invalid discount type.",
        },
        { status: 400 }
      );
    }

    const safeDiscountValue =
      promo.discount_type === "percent"
        ? Math.min(discountValue, 100)
        : discountValue;

    return Response.json({
      code: promo.code,

      discountType:
        promo.discount_type,

      discountValue:
        safeDiscountValue,

      description:
        promo.description ||
        "Promo code applied.",

      active: true,
    });
  } catch (error) {
    console.error(
      "Promo API error:",
      error
    );

    return Response.json(
      {
        error:
          "Unable to validate the promo code.",
      },
      { status: 500 }
    );
  }
}
