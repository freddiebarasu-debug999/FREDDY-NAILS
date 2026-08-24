import { createClient } from "@supabase/supabase-js";

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

const DEPOSIT_PER_CLIENT = 90;
const MAX_CLIENTS = 4;

function calculateDiscount(amount, promo) {
  const discountValue =
    Number(promo.discount_value);

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

  if (
    promo.discount_type === "percent"
  ) {
    const percentage =
      Math.min(discountValue, 100);

    finalAmount = Math.round(
      amount *
        (1 - percentage / 100)
    );
  } else if (
    promo.discount_type === "fixed"
  ) {
    finalAmount = Math.max(
      0,
      amount - discountValue
    );
  }

  finalAmount =
    Math.max(
      0,
      Math.round(finalAmount)
    );

  return {
    discountAmount:
      Math.max(
        0,
        amount - finalAmount
      ),

    finalAmount,
  };
}

export async function GET(request) {
  const { searchParams } =
    new URL(request.url);

  const code =
    (
      searchParams.get("code") ||
      ""
    )
      .trim()
      .toUpperCase();

  const clientCountRaw =
    searchParams.get(
      "clientCount"
    );

  const clientCount =
    Number(clientCountRaw);

  if (!code) {
    return Response.json(
      {
        error:
          "Enter a promo code.",
      },
      { status: 400 }
    );
  }

  /*
   * The deposit is R90 per client.
   *
   * If clientCount wasn't supplied,
   * validation defaults to one client.
   */
  const safeClientCount =
    Number.isInteger(clientCount) &&
    clientCount >= 1 &&
    clientCount <= MAX_CLIENTS
      ? clientCount
      : 1;

  const depositAmount =
    DEPOSIT_PER_CLIENT *
    safeClientCount;

  const {
    data,
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
      "Promo lookup error:",
      error
    );

    return Response.json(
      {
        error:
          "Unable to check that code right now.",
      },
      { status: 500 }
    );
  }

  if (
    !data ||
    !data.active
  ) {
    return Response.json(
      {
        error:
          "That promo code isn't valid.",
      },
      { status: 404 }
    );
  }

  const {
    discountAmount,
    finalAmount,
  } =
    calculateDiscount(
      depositAmount,
      data
    );

  return Response.json({
    code: data.code,

    discountType:
      data.discount_type,

    discountValue:
      Number(
        data.discount_value
      ),

    description:
      data.description,

    clientCount:
      safeClientCount,

    depositAmount,

    discountAmount,

    finalDepositAmount:
      finalAmount,
  });
}
