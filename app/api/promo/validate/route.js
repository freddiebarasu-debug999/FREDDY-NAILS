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

function normalizePhone(value) {
  return String(value || "")
    .replace(/\D/g, "");
}

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

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
    birthday_offer: true,
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

  const now = new Date();

  if (promo.starts_at) {
    const startsAt = new Date(
      promo.starts_at
    );

    if (
      !Number.isNaN(startsAt.getTime()) &&
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
    const expiresAt = new Date(
      promo.expires_at
    );

    if (
      !Number.isNaN(expiresAt.getTime()) &&
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
    code: normalizeCode(promo.code),
    discountType,
    discountValue,
    description: promo.description || "",
    active: true,
    newClientsOnly:
      promo.new_clients_only === true,
    birthdayOffer:
      promo.birthday_offer === true,
    referralOffer:
      promo.referral_offer === true,
    minimumSpend:
      promo.minimum_spend !== null &&
      promo.minimum_spend !== undefined
        ? Number(promo.minimum_spend)
        : null,
  };
}

function getSupabase() {
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
  const normalizedCode =
    normalizeCode(code);

  if (!normalizedCode) {
    return null;
  }

  if (
    BUILT_IN_PROMOS[normalizedCode]
  ) {
    return BUILT_IN_PROMOS[
      normalizedCode
    ];
  }

  const supabase =
    getSupabase();

  /*
   * Do not filter by active here.
   *
   * We deliberately retrieve the promo first
   * so inactive/expired promos can return a
   * useful message instead of falling through
   * to the generic "unable to verify" error.
   */
  const { data, error } =
    await supabase
      .from("promo_codes")
      .select(
        [
          "id",
          "code",
          "discount_type",
          "discount_value",
          "active",
          "description",
          "created_at",
          "starts_at",
          "expires_at",
          "minimum_spend",
          "new_clients_only",
          "birthday_offer",
          "referral_offer",
          "max_uses",
          "one_use_per_client",
        ].join(", ")
      )
      .ilike("code", normalizedCode)
      .limit(1);

  if (error) {
    console.error(
      "Supabase promo lookup error:",
      error
    );

    throw error;
  }

  return data?.[0] || null;
}

async function getAuthenticatedUser(
  request
) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization ||
    !authorization
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    return null;
  }

  const token =
    authorization
      .slice(7)
      .trim();

  if (!token) {
    return null;
  }

  const supabase =
    getSupabase();

  const {
    data: { user },
    error,
  } =
    await supabase.auth.getUser(
      token
    );

  if (error) {
    console.error(
      "Unable to verify authenticated user:",
      error
    );

    return null;
  }

  return user || null;
}

async function hasPreviousAppointment({
  profileId,
  email,
  phone,
}) {
  const supabase =
    getSupabase();

  /*
   * 1. Logged-in account:
   * profile_id is the strongest identifier.
   */
  if (profileId) {
    const { data, error } =
      await supabase
        .from("appointments")
        .select("id")
        .eq(
          "profile_id",
          profileId
        )
        .limit(1);

    if (error) {
      console.error(
        "Previous appointment profile lookup error:",
        error
      );

      throw error;
    }

    if (data?.length) {
      return true;
    }
  }

  /*
   * 2. Email fallback.
   */
  const normalizedEmail =
    normalizeEmail(email);

  if (normalizedEmail) {
    const { data, error } =
      await supabase
        .from("appointments")
        .select(
          "id, customer_email"
        )
        .not(
          "customer_email",
          "is",
          null
        )
        .limit(1000);

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
   * 3. Phone fallback.
   */
  const normalizedPhone =
    normalizePhone(phone);

  if (normalizedPhone) {
    const { data, error } =
      await supabase
        .from("appointments")
        .select(
          "id, customer_phone"
        )
        .not(
          "customer_phone",
          "is",
          null
        )
        .limit(1000);

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

export async function GET(request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const rawCode =
      searchParams.get("code");

    const suppliedEmail =
      searchParams.get("email") || "";

    const suppliedPhone =
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

    const result =
      validatePromoConfiguration(
        promo
      );

    if (!result.valid) {
      return json(
        result,
        400
      );
    }

    /*
     * New-client-only validation.
     *
     * WELCOME10 is stored in Supabase with
     * new_clients_only = true.
     *
     * FIRSTVISIT is also treated as a
     * first-time-client promotion.
     */
    if (
      result.newClientsOnly
    ) {
      const authenticatedUser =
        await getAuthenticatedUser(
          request
        );

      const profileId =
        authenticatedUser?.id ||
        null;

      const email =
        suppliedEmail ||
        authenticatedUser?.email ||
        "";

      const phone =
        suppliedPhone ||
        authenticatedUser?.phone ||
        "";

      const previousBooking =
        await hasPreviousAppointment({
          profileId,
          email,
          phone,
        });

      if (previousBooking) {
        return json(
          {
            valid: false,
            code: result.code,
            newClientsOnly: true,
            error:
              "This promo code is only applicable to first-time bookings. It looks like you've booked with Freddy Nails before.",
          },
          400
        );
      }
    }

    return json(
      result,
      200
    );
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
