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

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
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

  const discountValue = Number(
    promo.discount_value
  );

  if (
    !Number.isFinite(discountValue) ||
    discountValue <= 0
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
    newClientsOnly:
      promo.new_clients_only === true,
    minimumSpend:
      promo.minimum_spend !== null &&
      promo.minimum_spend !== undefined
        ? Number(promo.minimum_spend)
        : null,
  };
}

async function getSupabaseAdmin() {
  if (
    !supabaseUrl ||
    !supabaseServiceRoleKey
  ) {
    throw new Error(
      "Supabase environment variables are missing."
    );
  }

  return createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

async function getPromo(code) {
  const normalizedCode = normalizeCode(code);

  if (!normalizedCode) {
    return null;
  }

  if (BUILT_IN_PROMOS[normalizedCode]) {
    return BUILT_IN_PROMOS[normalizedCode];
  }

  const supabase =
    await getSupabaseAdmin();

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
    .eq("code", normalizedCode)
    .limit(1);

  if (error) {
    console.error(
      "Supabase promo lookup error:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw error;
  }

  return data?.[0] || null;
}

async function getAuthenticatedUser(request) {
  const authorization =
    request.headers.get("authorization") ||
    request.headers.get("Authorization");

  if (!authorization) {
    return null;
  }

  const match =
    authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return null;
  }

  const accessToken = match[1].trim();

  if (!accessToken) {
    return null;
  }

  const supabase =
    await getSupabaseAdmin();

  const {
    data: {
      user,
    },
    error,
  } = await supabase.auth.getUser(
    accessToken
  );

  if (error) {
    console.error(
      "Supabase auth lookup error:",
      error
    );

    return null;
  }

  return user || null;
}

async function hasPreviousAppointment({
  user,
  email,
  phone,
}) {
  const supabase =
    await getSupabaseAdmin();

  /*
   * 1. Logged-in profile check
   */
  if (user?.id) {
    const {
      data,
      error,
    } = await supabase
      .from("appointments")
      .select("id")
      .eq("profile_id", user.id)
      .limit(1);

    if (error) {
      console.error(
        "Previous appointment profile lookup error:",
        error
      );

      throw error;
    }

    if (data && data.length > 0) {
      return true;
    }
  }

  /*
   * 2. Email check
   *
   * This protects older bookings that may not have
   * been connected to the customer's profile.
   */
  const normalizedEmail =
    normalizeEmail(
      email || user?.email
    );

  if (normalizedEmail) {
    const {
      data,
      error,
    } = await supabase
      .from("appointments")
      .select(
        "id, customer_email"
      )
      .not(
        "customer_email",
        "is",
        null
      )
      .limit(500);

    if (error) {
      console.error(
        "Previous appointment email lookup error:",
        error
      );

      throw error;
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
   * 3. Phone check
   *
   * This catches previous bookings made with the
   * same phone number.
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
      .not(
        "customer_phone",
        "is",
        null
      )
      .limit(500);

    if (error) {
      console.error(
        "Previous appointment phone lookup error:",
        error
      );

      throw error;
    }

    const phoneMatch =
      (data || []).some(
        (appointment) =>
          normalizePhone(
            appointment.customer_phone
          ) === normalizedPhone
      );

    if (phoneMatch) {
      return true;
    }
  }

  return false;
}

function validatePromoDates(promo) {
  const now = new Date();

  if (promo.starts_at) {
    const startsAt =
      new Date(promo.starts_at);

    if (
      Number.isFinite(
        startsAt.getTime()
      ) &&
      now < startsAt
    ) {
      return {
        valid: false,
        error:
          "This promo code is not active yet.",
      };
    }
  }

  if (promo.expires_at) {
    const expiresAt =
      new Date(promo.expires_at);

    if (
      Number.isFinite(
        expiresAt.getTime()
      ) &&
      now > expiresAt
    ) {
      return {
        valid: false,
        error:
          "This promo code has expired.",
      };
    }
  }

  return {
    valid: true,
  };
}

export async function GET(request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const rawCode =
      searchParams.get("code");

    const customerEmail =
      searchParams.get("email") || "";

    const customerPhone =
      searchParams.get("phone") || "";

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

    const configuration =
      validatePromoConfiguration(
        promo
      );

    if (!configuration.valid) {
      return json(
        configuration,
        400
      );
    }

    const dateCheck =
      validatePromoDates(promo);

    if (!dateCheck.valid) {
      return json(
        dateCheck,
        400
      );
    }

    /*
     * WELCOME10 / any future new-client-only promo
     *
     * We check this BEFORE returning "valid: true".
     */
    if (
      promo.new_clients_only === true
    ) {
      const user =
        await getAuthenticatedUser(
          request
        );

      const hasBooked =
        await hasPreviousAppointment({
          user,
          email:
            customerEmail ||
            user?.email ||
            "",
          phone: customerPhone,
        });

      if (hasBooked) {
        return json(
          {
            valid: false,
            code,
            newClientsOnly: true,
            error:
              "WELCOME10 is only applicable to first-time bookings.",
          },
          400
        );
      }
    }

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
    console.error(
      "Unexpected promo validation error:",
      {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
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
