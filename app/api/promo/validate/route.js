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

function normaliseStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function isSuccessfulBooking(appointment) {
  const bookingStatus = normaliseStatus(
    appointment?.booking_status
  );

  const paymentStatus = normaliseStatus(
    appointment?.payment_status
  );

  /*
   * A booking counts as a previous client booking when
   * it has actually been approved/confirmed or the deposit
   * has been paid.
   *
   * Pending/cancelled/unpaid abandoned bookings do not make
   * someone lose FIRSTVISIT eligibility.
   */

  if (
    bookingStatus === "cancelled" ||
    bookingStatus === "canceled"
  ) {
    return false;
  }

  if (
    paymentStatus === "paid" ||
    paymentStatus === "deposit_paid"
  ) {
    return true;
  }

  if (
    bookingStatus === "approved" ||
    bookingStatus === "confirmed"
  ) {
    return true;
  }

  return false;
}

function isPromotionCurrentlyActive(promo) {
  if (!promo?.active) {
    return {
      valid: false,
      error: "That promo code is no longer active.",
    };
  }

  const now = new Date();

  if (promo.starts_at) {
    const startsAt = new Date(promo.starts_at);

    if (
      Number.isFinite(startsAt.getTime()) &&
      now < startsAt
    ) {
      return {
        valid: false,
        error:
          "This promotion is not available yet.",
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
        error:
          "This promotion has expired.",
      };
    }
  }

  return {
    valid: true,
  };
}

function getMonthDay(dateValue) {
  if (!dateValue) {
    return null;
  }

  const value = String(dateValue).slice(0, 10);

  const parts = value.split("-");

  if (parts.length !== 3) {
    return null;
  }

  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  return {
    month,
    day,
  };
}

function isBirthdayEligible(dateOfBirth) {
  const birthday = getMonthDay(dateOfBirth);

  if (!birthday) {
    return {
      eligible: false,
      error:
        "Add your date of birth to your Freddy Nails profile to use the birthday offer.",
    };
  }

  const today = new Date();

  const currentMonth =
    today.getMonth() + 1;

  const currentDay =
    today.getDate();

  /*
   * Birthday offers are valid during the client's
   * birthday month.
   *
   * This can later be changed to a specific birthday
   * window such as 7 days before/after.
   */

  if (
    birthday.month !== currentMonth
  ) {
    return {
      eligible: false,
      error:
        "Your birthday offer becomes available during your birthday month.",
    };
  }

  return {
    eligible: true,
  };
}

async function getAuthenticatedUser(request) {
  const authorization =
    request.headers.get("authorization");

  if (!authorization) {
    return {
      user: null,
      error:
        "Please log in to use account promotions.",
    };
  }

  const match =
    authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return {
      user: null,
      error:
        "Invalid authentication token.",
    };
  }

  const accessToken = match[1];

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(
    accessToken
  );

  if (error || !user) {
    console.error(
      "Promo authentication error:",
      error
    );

    return {
      user: null,
      error:
        "Your session has expired. Please log in again.",
    };
  }

  return {
    user,
    error: null,
  };
}

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
      rawCode.trim().toUpperCase();

    /*
     * -------------------------------------------------------
     * AUTHENTICATION
     * -------------------------------------------------------
     *
     * Account promotions are now validated against the
     * logged-in client's account.
     */

    const {
      user,
      error: authError,
    } =
      await getAuthenticatedUser(
        request
      );

    if (!user) {
      return json(
        {
          valid: false,
          requiresLogin: true,
          error:
            authError ||
            "Please log in to use this promotion.",
        },
        401
      );
    }

    /*
     * -------------------------------------------------------
     * LOAD PROMOTION
     * -------------------------------------------------------
     */

    const {
      data: promo,
      error: promoError,
    } = await supabase
      .from("promo_codes")
      .select(`
        id,
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
      `)
      .eq("code", code)
      .maybeSingle();

    if (promoError) {
      console.error(
        "Promo lookup error:",
        promoError
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

    /*
     * -------------------------------------------------------
     * ACTIVE / DATE CHECK
     * -------------------------------------------------------
     */

    const activeResult =
      isPromotionCurrentlyActive(
        promo
      );

    if (!activeResult.valid) {
      return json(
        {
          valid: false,
          error: activeResult.error,
        },
        400
      );
    }

    /*
     * -------------------------------------------------------
     * DISCOUNT VALIDATION
     * -------------------------------------------------------
     */

    const discountValue =
      Number(
        promo.discount_value
      );

    if (
      !Number.isFinite(
        discountValue
      ) ||
      discountValue <= 0
    ) {
      console.error(
        "Invalid promo discount:",
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
      promo.discount_type !==
        "percent" &&
      promo.discount_type !==
        "fixed"
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

    /*
     * -------------------------------------------------------
     * LOAD CLIENT PROFILE
     * -------------------------------------------------------
     */

    const {
      data: profile,
      error: profileError,
    } =
      await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          date_of_birth
        `)
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error(
        "Profile lookup error:",
        profileError
      );

      return json(
        {
          valid: false,
          error:
            "Unable to verify your client profile.",
        },
        500
      );
    }

    if (!profile) {
      return json(
        {
          valid: false,
          error:
            "Your client profile could not be found.",
        },
        400
      );
    }

    /*
     * -------------------------------------------------------
     * CHECK PROMO USAGE
     * -------------------------------------------------------
     */

    const {
      data: previousUsage,
      error: usageError,
    } =
      await supabase
        .from("promo_code_usage")
        .select(`
          id,
          used_at,
          appointment_id
        `)
        .eq(
          "promo_code_id",
          promo.id
        )
        .eq(
          "profile_id",
          profile.id
        )
        .limit(1);

    if (usageError) {
      console.error(
        "Promo usage lookup error:",
        usageError
      );

      return json(
        {
          valid: false,
          error:
            "Unable to verify your promotion history.",
        },
        500
      );
    }

    if (
      promo.one_use_per_client &&
      previousUsage &&
      previousUsage.length > 0
    ) {
      return json(
        {
          valid: false,
          error:
            "You have already used this promotion.",
        },
        400
      );
    }

    /*
     * -------------------------------------------------------
     * MAX GLOBAL USE CHECK
     * -------------------------------------------------------
     */

    if (
      Number.isInteger(
        promo.max_uses
      ) &&
      promo.max_uses > 0
    ) {
      const {
        count,
        error: countError,
      } =
        await supabase
          .from("promo_code_usage")
          .select(
            "id",
            {
              count: "exact",
              head: true,
            }
          )
          .eq(
            "promo_code_id",
            promo.id
          );

      if (countError) {
        console.error(
          "Promo usage count error:",
          countError
        );

        return json(
          {
            valid: false,
            error:
              "Unable to verify promotion availability.",
          },
          500
        );
      }

      if (
        Number(count || 0) >=
        promo.max_uses
      ) {
        return json(
          {
            valid: false,
            error:
              "This promotion has reached its usage limit.",
          },
          400
        );
      }
    }

    /*
     * -------------------------------------------------------
     * NEW CLIENT CHECK
     * -------------------------------------------------------
     */

    if (
      promo.new_clients_only
    ) {
      const {
        data: appointments,
        error:
          appointmentsError,
      } =
        await supabase
          .from("appointments")
          .select(`
            id,
            booking_status,
            payment_status
          `)
          .eq(
            "profile_id",
            profile.id
          )
          .limit(100);

      if (appointmentsError) {
        console.error(
          "Appointment eligibility error:",
          appointmentsError
        );

        return json(
          {
            valid: false,
            error:
              "Unable to verify your client status.",
          },
          500
        );
      }

      const hasPreviousBooking =
        (appointments || []).some(
          isSuccessfulBooking
        );

      if (hasPreviousBooking) {
        return json(
          {
            valid: false,
            error:
              "This promotion is only available to new Freddy Nails clients.",
          },
          400
        );
      }
    }

    /*
     * -------------------------------------------------------
     * BIRTHDAY CHECK
     * -------------------------------------------------------
     */

    if (
      promo.birthday_offer
    ) {
      const birthdayResult =
        isBirthdayEligible(
          profile.date_of_birth
        );

      if (
        !birthdayResult.eligible
      ) {
        return json(
          {
            valid: false,
            error:
              birthdayResult.error,
          },
          400
        );
      }
    }

    /*
     * -------------------------------------------------------
     * RETURN VALID PROMOTION
     * -------------------------------------------------------
     */

    return json({
      valid: true,

      code: promo.code,

      discountType:
        promo.discount_type,

      discountValue,

      description:
        promo.description || "",

      active: true,

      minimumSpend:
        promo.minimum_spend !== null
          ? Number(
              promo.minimum_spend
            )
          : null,

      newClientsOnly:
        Boolean(
          promo.new_clients_only
        ),

      birthdayOffer:
        Boolean(
          promo.birthday_offer
        ),

      referralOffer:
        Boolean(
          promo.referral_offer
        ),

      oneUsePerClient:
        Boolean(
          promo.one_use_per_client
        ),

      /*
       * This tells the frontend that the promotion
       * has been verified for the currently logged-in
       * client.
       */
      accountVerified: true,

      profileId: profile.id,
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
