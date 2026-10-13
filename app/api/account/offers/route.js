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

function isCurrentlyActive(promo) {
  if (!promo?.active) {
    return false;
  }

  const now = new Date();

  if (promo.starts_at) {
    const startsAt = new Date(
      promo.starts_at
    );

    if (
      Number.isFinite(
        startsAt.getTime()
      ) &&
      now < startsAt
    ) {
      return false;
    }
  }

  if (promo.expires_at) {
    const expiresAt = new Date(
      promo.expires_at
    );

    if (
      Number.isFinite(
        expiresAt.getTime()
      ) &&
      now > expiresAt
    ) {
      return false;
    }
  }

  return true;
}

function birthdayIsEligible(
  dateOfBirth
) {
  if (!dateOfBirth) {
    return false;
  }

  const value =
    String(dateOfBirth).slice(
      0,
      10
    );

  const parts =
    value.split("-");

  if (parts.length !== 3) {
    return false;
  }

  const birthMonth =
    Number(parts[1]);

  const now = new Date();

  const currentMonth =
    now.getMonth() + 1;

  return (
    birthMonth ===
    currentMonth
  );
}

async function authenticate(
  request
) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (!authorization) {
    return null;
  }

  const match =
    authorization.match(
      /^Bearer\s+(.+)$/i
    );

  if (!match) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(
    match[1]
  );

  if (error || !user) {
    return null;
  }

  return user;
}

export async function GET(
  request
) {
  try {
    const user =
      await authenticate(
        request
      );

    if (!user) {
      return json(
        {
          success: false,
          requiresLogin: true,
          error:
            "Please log in to view your offers.",
        },
        401
      );
    }

    /*
     * ------------------------------------------------------
     * PROFILE
     * ------------------------------------------------------
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
          date_of_birth
        `)
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error(
        "Account offers profile error:",
        profileError
      );

      return json(
        {
          success: false,
          error:
            "Unable to load your profile.",
        },
        500
      );
    }

    if (!profile) {
      return json(
        {
          success: false,
          error:
            "Your client profile could not be found.",
        },
        400
      );
    }

    /*
     * ------------------------------------------------------
     * APPOINTMENT HISTORY
     * ------------------------------------------------------
     */

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
        "Account offers appointment error:",
        appointmentsError
      );

      return json(
        {
          success: false,
          error:
            "Unable to check your booking history.",
        },
        500
      );
    }

    const hasPreviousBooking =
      (appointments || []).some(
        isSuccessfulBooking
      );

    /*
     * ------------------------------------------------------
     * PROMOTION LIST
     * ------------------------------------------------------
     */

    const {
      data: promotions,
      error: promotionsError,
    } =
      await supabase
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
        .eq(
          "active",
          true
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

    if (promotionsError) {
      console.error(
        "Account offers promotion error:",
        promotionsError
      );

      return json(
        {
          success: false,
          error:
            "Unable to load current promotions.",
        },
        500
      );
    }

    /*
     * ------------------------------------------------------
     * CLIENT PROMO USAGE
     * ------------------------------------------------------
     */

    const {
      data: usage,
      error: usageError,
    } =
      await supabase
        .from("promo_code_usage")
        .select(`
          promo_code_id,
          used_at
        `)
        .eq(
          "profile_id",
          profile.id
        );

    if (usageError) {
      console.error(
        "Account offers usage error:",
        usageError
      );

      return json(
        {
          success: false,
          error:
            "Unable to check your promotion history.",
        },
        500
      );
    }

    const usedPromoIds =
      new Set(
        (usage || []).map(
          (item) =>
            item.promo_code_id
        )
      );

    /*
     * ------------------------------------------------------
     * GLOBAL PROMO USAGE
     * ------------------------------------------------------
     */

    const globalUsageCounts =
      new Map();

    if (
      promotions &&
      promotions.length > 0
    ) {
      const promoIds =
        promotions.map(
          (promo) => promo.id
        );

      const {
        data: globalUsage,
        error:
          globalUsageError,
      } =
        await supabase
          .from(
            "promo_code_usage"
          )
          .select(
            "promo_code_id"
          )
          .in(
            "promo_code_id",
            promoIds
          );

      if (globalUsageError) {
        console.error(
          "Global promo usage error:",
          globalUsageError
        );

        return json(
          {
            success: false,
            error:
              "Unable to verify promotion availability.",
          },
          500
        );
      }

      for (
        const item of
        globalUsage || []
      ) {
        const current =
          globalUsageCounts.get(
            item.promo_code_id
          ) || 0;

        globalUsageCounts.set(
          item.promo_code_id,
          current + 1
        );
      }
    }

    /*
     * ------------------------------------------------------
     * DETERMINE ELIGIBLE OFFERS
     * ------------------------------------------------------
     */

    const eligibleOffers =
      [];

    for (
      const promo of
      promotions || []
    ) {
      if (
        !isCurrentlyActive(
          promo
        )
      ) {
        continue;
      }

      /*
       * One use per client
       */

      if (
        promo.one_use_per_client &&
        usedPromoIds.has(
          promo.id
        )
      ) {
        continue;
      }

      /*
       * Global usage limit
       */

      if (
        Number.isInteger(
          promo.max_uses
        ) &&
        promo.max_uses > 0
      ) {
        const usageCount =
          globalUsageCounts.get(
            promo.id
          ) || 0;

        if (
          usageCount >=
          promo.max_uses
        ) {
          continue;
        }
      }

      /*
       * New client
       */

      if (
        promo.new_clients_only &&
        hasPreviousBooking
      ) {
        continue;
      }

      /*
       * Birthday
       */

      if (
        promo.birthday_offer &&
        !birthdayIsEligible(
          profile.date_of_birth
        )
      ) {
        continue;
      }

      /*
       * Format offer for frontend
       */

      eligibleOffers.push({
        id: promo.id,

        code: promo.code,

        discountType:
          promo.discount_type,

        discountValue:
          Number(
            promo.discount_value
          ),

        description:
          promo.description ||
          "",

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
      });
    }

    return json({
      success: true,

      offers:
        eligibleOffers,

      client: {
        id: profile.id,

        isNewClient:
          !hasPreviousBooking,

        hasDateOfBirth:
          Boolean(
            profile.date_of_birth
          ),
      },
    });
  } catch (error) {
    console.error(
      "Unexpected account offers error:",
      error
    );

    return json(
      {
        success: false,
        error:
          "Unable to load your offers. Please try again.",
      },
      500
    );
  }
}
