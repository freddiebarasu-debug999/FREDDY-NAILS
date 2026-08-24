export const dynamic = "force-dynamic";

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
const MAX_SERVICES_PER_CLIENT = 4;

const OPEN_MINUTES = 9 * 60 + 30;
const CLOSE_MINUTES = 17 * 60 + 30;

const SERVICE_OPTIONS = {
  "Acrylic — Plain Short–Medium (R200)": {
    duration: 90,
    price: 200,
  },
  "Acrylic — Plain Long (R250)": {
    duration: 105,
    price: 250,
  },
  "Acrylic — Plain XL–XXXL (R300)": {
    duration: 120,
    price: 300,
  },
  "Acrylic — French Short–Medium (R300)": {
    duration: 100,
    price: 300,
  },
  "Acrylic — French Long (R350)": {
    duration: 115,
    price: 350,
  },
  "Acrylic — French XL–XXL (R400)": {
    duration: 130,
    price: 400,
  },
  "Acrylic — Ombré Short–Medium (R250)": {
    duration: 120,
    price: 250,
  },
  "Acrylic — Ombré Long (R300)": {
    duration: 135,
    price: 300,
  },
  "Acrylic — Ombré XL–XXXL (R350)": {
    duration: 150,
    price: 350,
  },

  "Gel — Overlay (R200)": {
    duration: 75,
    price: 200,
  },
  "Gel — Plain Short–Medium (R250)": {
    duration: 90,
    price: 250,
  },
  "Gel — Plain Long (R300)": {
    duration: 100,
    price: 300,
  },
  "Gel — French Short–Medium (R300)": {
    duration: 95,
    price: 300,
  },
  "Gel — French Long (R350)": {
    duration: 110,
    price: 350,
  },

  "Pedicure — Gel Overlay (R150)": {
    duration: 45,
    price: 150,
  },
  "Pedicure — Gel Full Tips (R200)": {
    duration: 60,
    price: 200,
  },
  "Pedicure — Acrylic Overlay (R180)": {
    duration: 55,
    price: 180,
  },
  "Pedicure — Acrylic Full Tips (R200)": {
    duration: 65,
    price: 200,
  },
  "Pedicure — Acrylic French Tips (R250)": {
    duration: 75,
    price: 250,
  },

  "Lashes — Cluster (R130)": {
    duration: 45,
    price: 130,
  },
  "Lashes — Cateye (R150)": {
    duration: 60,
    price: 150,
  },
  "Lashes — Classic (R180)": {
    duration: 90,
    price: 180,
  },

  "Foot Spa — Basic (R200)": {
    duration: 30,
    price: 200,
  },
  "Foot Spa — Luxury (R280)": {
    duration: 45,
    price: 280,
  },

  "Extra — Buff & Shine (R150)": {
    duration: 30,
    price: 150,
  },
  "Extra — Fill-in @3 weeks (R180)": {
    duration: 75,
    price: 180,
  },
  "Extra — Nail Repair (R20–R30)": {
    duration: 15,
    price: 30,
  },
  "Extra — Soak Off (R50)": {
    duration: 20,
    price: 50,
  },
  "Extra — Nail Art (R30–R50)": {
    duration: 20,
    price: 50,
  },
  "Extra — Rhinestones (R10–R15)": {
    duration: 10,
    price: 15,
  },
  "Extra — 3D Art (R50–R100)": {
    duration: 30,
    price: 100,
  },
};

function timeToMinutes(time) {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    mins
  ).padStart(2, "0")}`;
}

function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidTime(time) {
  return /^\d{2}:\d{2}$/.test(time);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function calculateClientDuration(services) {
  return services.reduce(
    (total, serviceName) =>
      total +
      (SERVICE_OPTIONS[serviceName]?.duration || 0),
    0
  );
}

function calculateClientPrice(services) {
  return services.reduce(
    (total, serviceName) =>
      total +
      (SERVICE_OPTIONS[serviceName]?.price || 0),
    0
  );
}

function calculateDiscount(amount, promo) {
  if (!promo || !promo.active) {
    return {
      discountedTotal: amount,
      discountAmount: 0,
    };
  }

  const value = Number(
    promo.discount_value
  );

  if (!Number.isFinite(value) || value < 0) {
    return {
      discountedTotal: amount,
      discountAmount: 0,
    };
  }

  let discountedTotal = amount;

  if (promo.discount_type === "percent") {
    discountedTotal = Math.round(
      amount *
        (1 - Math.min(value, 100) / 100)
    );
  }

  if (promo.discount_type === "fixed") {
    discountedTotal = Math.max(
      0,
      amount - value
    );
  }

  discountedTotal = Math.max(
    0,
    Math.round(discountedTotal)
  );

  return {
    discountedTotal,
    discountAmount:
      amount - discountedTotal,
  };
}

async function getAuthenticatedUser(request) {
  const authorization =
    request.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  if (
    !authorization
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    return null;
  }

  const accessToken =
    authorization.slice(7).trim();

  if (!accessToken) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(
    accessToken
  );

  if (error || !user) {
    return null;
  }

  return user;
}

export async function POST(request) {
  let appointmentId = null;

  try {
    const authenticatedUser =
      await getAuthenticatedUser(request);

    const profileId =
      authenticatedUser?.id || null;

    const body = await request.json();

    const {
      name,
      phone,
      email,
      clientServices,
      clientCount,
      clientDates,
      clientStartTimes,
      notes,
      promoCode,
    } = body;

    if (!name || !phone || !email) {
      return Response.json(
        {
          error:
            "Please complete all required customer details.",
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return Response.json(
        {
          error:
            "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(clientCount) ||
      clientCount < 1 ||
      clientCount > MAX_CLIENTS
    ) {
      return Response.json(
        {
          error:
            "You can book between 1 and 4 clients.",
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(clientServices) ||
      clientServices.length !== clientCount
    ) {
      return Response.json(
        {
          error:
            "Please select services for every client.",
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(clientDates) ||
      clientDates.length !== clientCount
    ) {
      return Response.json(
        {
          error:
            "Please choose a preferred date for every client.",
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(clientStartTimes) ||
      clientStartTimes.length !== clientCount
    ) {
      return Response.json(
        {
          error:
            "Please choose an available time for every client.",
        },
        { status: 400 }
      );
    }

    for (
      let i = 0;
      i < clientCount;
      i++
    ) {
      const services =
        clientServices[i];

      if (
        !Array.isArray(services) ||
        services.length < 1 ||
        services.length >
          MAX_SERVICES_PER_CLIENT
      ) {
        return Response.json(
          {
            error: `Client ${
              i + 1
            } must have between 1 and 4 services.`,
          },
          { status: 400 }
        );
      }

      if (
        new Set(services).size !==
        services.length
      ) {
        return Response.json(
          {
            error: `Client ${
              i + 1
            } cannot have the same service selected more than once.`,
          },
          { status: 400 }
        );
      }

      for (const service of services) {
        if (
          !Object.prototype.hasOwnProperty.call(
            SERVICE_OPTIONS,
            service
          )
        ) {
          return Response.json(
            {
              error:
                "One or more selected services are invalid.",
            },
            { status: 400 }
          );
        }
      }
    }

    for (
      let i = 0;
      i < clientCount;
      i++
    ) {
      const date = clientDates[i];
      const time = clientStartTimes[i];

      if (!isValidDate(date)) {
        return Response.json(
          {
            error: `Please choose a valid date for Client ${
              i + 1
            }.`,
          },
          { status: 400 }
        );
      }

      if (!isValidTime(time)) {
        return Response.json(
          {
            error: `Please choose a valid time for Client ${
              i + 1
            }.`,
          },
          { status: 400 }
        );
      }

      const dateObject =
        new Date(`${date}T12:00:00`);

      if (
        Number.isNaN(
          dateObject.getTime()
        )
      ) {
        return Response.json(
          {
            error: `Please choose a valid date for Client ${
              i + 1
            }.`,
          },
          { status: 400 }
        );
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const bookingDate =
        new Date(`${date}T00:00:00`);

      if (bookingDate < today) {
        return Response.json(
          {
            error: `Client ${
              i + 1
            } cannot be booked for a date in the past.`,
          },
          { status: 400 }
        );
      }

      if (dateObject.getDay() === 0) {
        return Response.json(
          {
            error: `Client ${
              i + 1
            } cannot be booked on Sunday.`,
          },
          { status: 400 }
        );
      }
    }

    const clientDurations =
      clientServices.map(
        calculateClientDuration
      );

    const clientPrices =
      clientServices.map(
        calculateClientPrice
      );

    const serviceTotal =
      clientPrices.reduce(
        (sum, price) => sum + price,
        0
      );

    const clientEndTimes =
      clientStartTimes.map(
        (startTime, i) => {
          const start =
            timeToMinutes(startTime);

          const end =
            start + clientDurations[i];

          if (
            start < OPEN_MINUTES ||
            end > CLOSE_MINUTES
          ) {
            throw new Error(
              `Client ${
                i + 1
              }'s appointment is outside business hours.`
            );
          }

          return minutesToTime(end);
        }
      );

    for (
      let i = 1;
      i < clientCount;
      i++
    ) {
      if (
        clientDates[i] ===
        clientDates[i - 1]
      ) {
        const previousEnd =
          timeToMinutes(
            clientEndTimes[i - 1]
          );

        const currentStart =
          timeToMinutes(
            clientStartTimes[i]
          );

        if (
          currentStart <
          previousEnd + 15
        ) {
          return Response.json(
            {
              error: `Client ${
                i + 1
              } must start at least 15 minutes after Client ${
                i
              } finishes.`,
            },
            { status: 400 }
          );
        }
      }
    }

    /*
     * IMPORTANT:
     *
     * Yoco deposit is NEVER discounted.
     */
    const depositAmount =
      DEPOSIT_PER_CLIENT *
      clientCount;

    let discountedServiceTotal =
      serviceTotal;

    let promoDiscountAmount = 0;

    let appliedPromoCode = null;

    if (
      typeof promoCode === "string" &&
      promoCode.trim()
    ) {
      const normalizedCode =
        promoCode.trim().toUpperCase();

      const {
        data: promo,
        error: promoError,
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

      if (promoError) {
        console.error(
          "Promo lookup error:",
          promoError
        );

        return Response.json(
          {
            error:
              "Unable to verify the promo code.",
          },
          { status: 500 }
        );
      }

      if (!promo || !promo.active) {
        return Response.json(
          {
            error:
              "That promo code isn't valid.",
          },
          { status: 400 }
        );
      }

      const discount =
        calculateDiscount(
          serviceTotal,
          promo
        );

      discountedServiceTotal =
        discount.discountedTotal;

      promoDiscountAmount =
        discount.discountAmount;

      appliedPromoCode =
        promo.code;
    }

    const serviceSummary =
      clientServices
        .map(
          (services, i) =>
            `Client ${
              i + 1
            }: ${services.join(
              " + "
            )} — ${clientDates[i]} ${clientStartTimes[i]}–${clientEndTimes[i]}`
        )
        .join(" | ");

    const expiresAt =
      new Date(
        Date.now() + 15 * 60 * 1000
      ).toISOString();

    const appointmentInsert = {
      customer_name: name,
      customer_phone: phone,
      customer_email: email,
      service_name: serviceSummary,
      client_count: clientCount,
      booking_date: clientDates[0],
      start_time: clientStartTimes[0],
      end_time: clientEndTimes[0],
      duration_minutes: clientDurations[0],

      deposit_per_client:
        DEPOSIT_PER_CLIENT,

      /*
       * This remains the actual Yoco
       * payment amount.
       */
      deposit_amount:
        depositAmount,

      payment_status: "pending",
      booking_status: "pending",
      expires_at: expiresAt,
      notes: notes || null,
      profile_id: profileId,
      promo_code:
        appliedPromoCode,
    };

    const {
      data: appointment,
      error: appointmentError,
    } = await supabase
      .from("appointments")
      .insert(appointmentInsert)
      .select("id")
      .single();

    if (appointmentError) {
      console.error(
        "Appointment insert error:",
        appointmentError
      );

      if (
        appointmentError.code ===
        "23P01"
      ) {
        return Response.json(
          {
            error:
              "That time was just booked by someone else. Please choose another available time.",
          },
          { status: 409 }
        );
      }

      return Response.json(
        {
          error:
            "Unable to reserve the booking.",
        },
        { status: 500 }
      );
    }

    appointmentId =
      appointment.id;

    const clientRows =
      clientServices.map(
        (services, i) => ({
          appointment_id:
            appointmentId,

          client_number:
            i + 1,

          service_name:
            services.join(" + "),

          booking_date:
            clientDates[i],

          start_time:
            clientStartTimes[i],

          end_time:
            clientEndTimes[i],

          duration_minutes:
            clientDurations[i],

          booking_status:
            "pending",
        })
      );

    const {
      error: clientInsertError,
    } = await supabase
      .from("appointment_clients")
      .insert(clientRows);

    if (clientInsertError) {
      console.error(
        "Client appointment insert error:",
        clientInsertError
      );

      await supabase
        .from("appointments")
        .update({
          booking_status:
            "cancelled",
        })
        .eq(
          "id",
          appointmentId
        );

      return Response.json(
        {
          error:
            "Unable to reserve all client appointment times.",
        },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      new URL(request.url).origin;

    const successUrl =
      `${baseUrl}/?booking=success&appointment=${appointmentId}#booking`;

    const cancelUrl =
      `${baseUrl}/?booking=cancelled&appointment=${appointmentId}#booking`;

    const failureUrl =
      `${baseUrl}/?booking=failed&appointment=${appointmentId}#booking`;

    /*
     * Yoco ALWAYS receives R90 per client.
     *
     * Promo discounts service price only.
     */
    const yocoAmountCents =
      depositAmount * 100;

    const yocoResponse =
      await fetch(
        "https://payments.yoco.com/api/checkouts",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${process.env.YOCO_SECRET_KEY}`,
          },

          body: JSON.stringify({
            amount:
              yocoAmountCents,

            currency: "ZAR",

            successUrl,
            cancelUrl,
            failureUrl,
          }),
        }
      );

    const yocoData =
      await yocoResponse.json();

    if (!yocoResponse.ok) {
      console.error(
        "Yoco checkout error:",
        yocoData
      );

      await supabase
        .from("appointment_clients")
        .delete()
        .eq(
          "appointment_id",
          appointmentId
        );

      await supabase
        .from("appointments")
        .update({
          booking_status:
            "cancelled",
        })
        .eq(
          "id",
          appointmentId
        );

      return Response.json(
        {
          error:
            "Unable to start the secure payment. Please try again.",
        },
        { status: 500 }
      );
    }

    const checkoutId =
      yocoData.id;

    const redirectUrl =
      yocoData.redirectUrl;

    if (
      !checkoutId ||
      !redirectUrl
    ) {
      return Response.json(
        {
          error:
            "Yoco did not return a valid checkout link.",
        },
        { status: 500 }
      );
    }

    await supabase
      .from("appointments")
      .update({
        yoco_checkout_id:
          checkoutId,
      })
      .eq(
        "id",
        appointmentId
      );

    return Response.json({
      redirectUrl,
      appointmentId,

      /*
       * What Yoco actually charges.
       */
      depositAmount,

      /*
       * Service pricing information.
       */
      serviceTotal,
      discountAmount:
        promoDiscountAmount,
      discountedServiceTotal,

      promoCode:
        appliedPromoCode,
    });
  } catch (error) {
    console.error(
      "Checkout API error:",
      error
    );

    if (appointmentId) {
      await supabase
        .from("appointment_clients")
        .delete()
        .eq(
          "appointment_id",
          appointmentId
        );

      await supabase
        .from("appointments")
        .update({
          booking_status:
            "cancelled",
        })
        .eq(
          "id",
          appointmentId
        );
    }

    return Response.json(
      {
        error:
          error.message ||
          "Something went wrong starting your booking.",
      },
      { status: 500 }
    );
  }
}
