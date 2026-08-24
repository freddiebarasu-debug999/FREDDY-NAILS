import { NextResponse } from "next/server";
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

function json(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
    },
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

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

    const code = rawCode.trim().toUpperCase();

    const { data: promo, error } = await supabase
      .from("promo_codes")
      .select(
        "code, discount_type, discount_value, description, active"
      )
      .eq("code", code)
      .maybeSingle();

    if (error) {
      console.error("Promo validation error:", error);

      return json(
        {
          valid: false,
          error:
            "Unable to verify the promo code. Please try again.",
        },
        500
      );
    }

    if (!promo) {
      return json(
        {
          valid: false,
          error: "That promo code isn't valid.",
        },
        400
      );
    }

    if (!promo.active) {
      return json(
        {
          valid: false,
          error: "That promo code is no longer active.",
        },
        400
      );
    }

    const discountValue = Number(promo.discount_value);

    if (
      !Number.isFinite(discountValue) ||
      discountValue < 0
    ) {
      console.error(
        "Invalid promo discount value:",
        promo
      );

      return json(
        {
          valid: false,
          error:
            "This promo code is configured incorrectly.",
        },
        500
      );
    }

    if (
      promo.discount_type !== "percent" &&
      promo.discount_type !== "fixed"
    ) {
      return json(
        {
          valid: false,
          error:
            "This promo code has an invalid discount type.",
        },
        500
      );
    }

    return json({
      valid: true,
      code: promo.code,
      discountType: promo.discount_type,
      discountValue,
      description: promo.description || "",
      active: true,
    });
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
