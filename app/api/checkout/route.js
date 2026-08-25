export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
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
const DEPOSIT_PER_CLIENT = 90;
const MAX_CLIENTS = 4;
const MAX_SERVICES_PER_CLIENT = 4;
const OPEN_MINUTES = 9 * 60 + 30;
const CLOSE_MINUTES = 17 * 60 + 30;
const SERVICE_OPTIONS: Record<string, number> = {
  "Acrylic — Plain Short–Medium (R200)": 90,
  "Acrylic — Plain Long (R250)": 105,
  "Acrylic — Plain XL–XXXL (R300)": 120,
  "Acrylic — French Short–Medium (R300)": 100,
  "Acrylic — French Long (R350)": 115,
  "Acrylic — French XL–XXL (R400)": 130,
  "Acrylic — Ombré Short–Medium (R250)": 120,
  "Acrylic — Ombré Long (R300)": 135,
  "Acrylic — Ombré XL–XXXL (R350)": 150,
  "Gel — Overlay (R200)": 75,
  "Gel — Plain Short–Medium (R250)": 90,
  "Gel — Plain Long (R300)": 100,
  "Gel — French Short–Medium (R300)": 95,
  "Gel — French Long (R350)": 110,
  "Pedicure — Gel Overlay (R150)": 45,
  "Pedicure — Gel Full Tips (R200)": 60,
  "Pedicure — Acrylic Overlay (R180)": 55,
  "Pedicure — Acrylic Full Tips (R200)": 65,
  "Pedicure — Acrylic French Tips (R250)": 75,
  "Lashes — Cluster (R130)": 45,
  "Lashes — Cateye (R150)": 60,
  "Lashes — Classic (R180)": 90,
  "Foot Spa — Basic (R200)": 30,
  "Foot Spa — Luxury (R280)": 45,
  "Extra — Buff & Shine (R150)": 30,
  "Extra — Fill-in @3 weeks (R180)": 75,
  "Extra — Nail Repair (R20–R30)": 15,
  "Extra — Soak Off (R50)": 20,
  "Extra — Nail Art (R30–R50)": 20,
  "Extra — Rhinestones (R10–R15)": 10,
  "Extra — 3D Art (R50–R100)": 30,
};
type Promo = {
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  description: string | null;
  active: boolean;
};
type BookingBody = {
  name?: string;
  phone?: string;
  email?: string;
  clientServices?: string[][];
  clientCount?: number;
  clientDates?: string[];
  clientStartTimes?: string[];
  notes?: string;
  promoCode?: string;
};
type AppointmentInsert = {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  service_name: string;
  client_count: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  deposit_per_client: number;
  deposit_amount: number;
  payment_status: string;
  booking_status: string;
  expires_at: string;
  notes: string | null;
  profile_id: string | null;
  promo_code: string | null;
};
const BUILT_IN_PROMOS: Record<
  string,
  Promo
> = {
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
    description:
      "R50 off when you bring a friend",
    active: true,
  },
  BIRTHDAY: {
    code: "BIRTHDAY",
    discount_type: "fixed",
    discount_value: 50,
    description:
      "Birthday special — R50 off",
    active: true,
  },
};
function timeToMinutes(time: string): number {
  const [hours, minutes] =
    time.split(":").map(Number);
  return hours * 60 + minutes;
}
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(
    2,
    "0"
  )}:${String(mins).padStart(2, "0")}`;
}
function isValidDate(
  date: string
): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}
function isValidTime(
  time: string
): boolean {
  return /^\d{2}:\d{2}$/.test(time);
}
function isValidEmail(
  email: string
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}
function calculateClientDuration(
  services: string[]
): number {
  return services.reduce(
    (total, serviceName) =>
      total +
      (SERVICE_OPTIONS[serviceName] ?? 0),
    0
  );
}
function extractServicePrice(
  serviceName: string
): number {
  if (!serviceName) return 0;
  const match =
    serviceName.match(
      /\(R(\d+)(?:–\d+)?\)/
    );
  if (!match) return 0;
  return Number(match[1]) || 0;
}
function calculateServiceTotal(
  clientServices: string[][]
): number {
  return clientServices.reduce(
    (total, services) =>
      total +
      services.reduce(
        (clientTotal, serviceName) =>
          clientTotal +
          extractServicePrice(
            serviceName
          ),
        0
      ),
    0
  );
}
function calculateDiscountedAmount(
  amount: number,
  promo: Promo | null
): {
  finalAmount: number;
  discountAmount: number;
} {
  if (!promo || !promo.active) {
    return {
      finalAmount: amount,
      discountAmount: 0,
    };
  }
  const discountValue = Number(
    promo.discount_value
  );
  if (
    !Number.isFinite(discountValue) ||
    discountValue < 0
  ) {
    return {
      finalAmount: amount,
      discountAmount: 0,
    };
  }
  let finalAmount = amount;
  if (
    promo.discount_type ===
    "percent"
  ) {
    const percentage = Math.min(
      discountValue,
      100
    );
    finalAmount = Math.round(
      amount *
        (1 - percentage / 100)
    );
  } else if (
    promo.discount_type ===
    "fixed"
  ) {
    finalAmount = Math.max(
      0,
      amount - discountValue
    );
  }
  finalAmount = Math.max(
    0,
    Math.round(finalAmount)
  );
  return {
    finalAmount,
    discountAmount: Math.max(
      0,
      Math.round(
        amount - finalAmount
      )
    ),
  };
}
async function getAuthenticatedUser(
  request: NextRequest
) {
  const authorization =
    request.headers.get(
      "authorization"
    );
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
    authorization
      .slice(7)
      .trim();
  if (!accessToken) {
    return null;
  }
  const {
    data: { user },
    error,
  } =
    await supabase.auth.getUser(
      accessToken
    );
  if (error || !user) {
    console.error(
      "Supabase authentication error:",
      error
    );
    return null;
  }
  return user;
}
async function getPromo(
  code: string
): Promise<Promo | null> {
  const normalizedCode =
    code.trim().toUpperCase();
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
    return data as Promo;
  }
  return (
    BUILT_IN_PROMOS[
      normalizedCode
    ] ?? null
  );
}
async function cancelExpiredPendingBookings() {
  const { error } =
    await supabase
      .from("appointments")
      .update({
        booking_status:
          "cancelled",
      })
      .eq(
        "booking_status",
        "pending"
      )
      .lt(
        "expires_at",
        new Date().toISOString()
      );
  if (error) {
    console.error(
      "Expired booking cleanup error:",
      error
    );
  }
}
async function cancelAppointment(
  appointmentId: string
) {
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
export async function POST(
  request: NextRequest
) {
  let appointmentId: string | null =
    null;
  try {
    const authenticatedUser =
      await getAuthenticatedUser(
        request
      );
    const profileId =
      authenticatedUser?.id ??
      null;
    let body: BookingBody;
    try {
      body =
        (await request.json()) as BookingBody;
    } catch {
      return Response.json(
        {
          error:
            "Invalid booking request.",
        },
        { status: 400 }
      );
    }
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
    if (
      !name ||
      !phone ||
      !email
    ) {
      return Response.json(
        {
          error:
            "Please complete all required customer details.",
        },
        { status: 400 }
      );
    }
    if (
      !isValidEmail(email)
    ) {
      return Response.json(
        {
          error:
            "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }
    if (
      !Number.isInteger(
        clientCount
      ) ||
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
      !Array.isArray(
        clientServices
      ) ||
      clientServices.length !==
        clientCount
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
      !Array.isArray(
        clientDates
      ) ||
      clientDates.length !==
        clientCount
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
      !Array.isArray(
        clientStartTimes
      ) ||
      clientStartTimes.length !==
        clientCount
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
      let clientIndex = 0;
      clientIndex < clientCount;
      clientIndex++
    ) {
      const services =
        clientServices[
          clientIndex
        ];
      if (
        !Array.isArray(
          services
        ) ||
        services.length < 1 ||
        services.length >
          MAX_SERVICES_PER_CLIENT
      ) {
        return Response.json(
          {
            error: `Client ${
              clientIndex + 1
            } must have between 1 and 4 services.`,
          },
          { status: 400 }
        );
      }
      const uniqueServices =
        new Set(services);
      if (
        uniqueServices.size !==
        services.length
      ) {
        return Response.json(
          {
            error: `Client ${
              clientIndex + 1
            } cannot have the same service selected more than once.`,
          },
          { status: 400 }
        );
      }
      for (
        const serviceName of services
      ) {
        if (
          !Object.prototype.hasOwnProperty.call(
            SERVICE_OPTIONS,
            serviceName
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
      let clientIndex = 0;
      clientIndex < clientCount;
      clientIndex++
    ) {
      const clientDate =
        clientDates[
          clientIndex
        ];
      const clientTime =
        clientStartTimes[
          clientIndex
        ];
      if (
        !isValidDate(
          clientDate
        )
      ) {
        return Response.json(
          {
            error: `Please choose a valid date for Client ${
              clientIndex + 1
            }.`,
          },
          { status: 400 }
        );
      }
      if (
        !isValidTime(
          clientTime
        )
      ) {
        return Response.json(
          {
            error: `Please choose a valid time for Client ${
              clientIndex + 1
            }.`,
          },
          { status: 400 }
        );
      }
      const selectedDate =
        new Date(
          `${clientDate}T12:00:00`
        );
      const today =
        new Date();
      today.setHours(
        0,
        0,
        0,
        0
      );
      const bookingDate =
        new Date(
          `${clientDate}T00:00:00`
        );
      if (
        bookingDate < today
      ) {
        return Response.json(
          {
            error: `Client ${
              clientIndex + 1
            } cannot be booked for a date in the past.`,
          },
          { status: 400 }
        );
      }
      if (
        selectedDate.getDay() ===
        0
      ) {
        return Response.json(
          {
            error: `Client ${
              clientIndex + 1
            } cannot be booked on Sunday because Freddy Nails is closed.`,
          },
          { status: 400 }
        );
      }
    }
    const clientDurations =
      clientServices.map(
        calculateClientDuration
      );
    let clientEndTimes: string[];
    try {
      clientEndTimes =
        clientStartTimes.map(
          (
            startTime,
            clientIndex
          ) => {
            const startMinutes =
              timeToMinutes(
                startTime
              );
            const endMinutes =
              startMinutes +
              clientDurations[
                clientIndex
              ];
            if (
              startMinutes <
                OPEN_MINUTES ||
              endMinutes >
                CLOSE_MINUTES
            ) {
              throw new Error(
                `Client ${
                  clientIndex + 1
                }'s appointment is outside business hours.`
              );
            }
            return minutesToTime(
              endMinutes
            );
          }
        );
    } catch (
      timeError
    ) {
      return Response.json(
        {
          error:
            timeError instanceof
            Error
              ? timeError.message
              : "One or more appointments are outside business hours.",
        },
        { status: 400 }
      );
    }
    for (
      let clientIndex = 1;
      clientIndex < clientCount;
      clientIndex++
    ) {
      if (
        clientDates[
          clientIndex
        ] ===
        clientDates[
          clientIndex - 1
        ]
      ) {
        const previousEnd =
          timeToMinutes(
            clientEndTimes[
              clientIndex - 1
            ]
          );
        const currentStart =
          timeToMinutes(
            clientStartTimes[
              clientIndex
            ]
          );
        if (
          currentStart <
          previousEnd + 15
        ) {
          return Response.json(
            {
              error: `Client ${
                clientIndex + 1
              } must start at least 15 minutes after Client ${
                clientIndex
              } finishes when they are booked on the same date.`,
            },
            { status: 400 }
          );
        }
      }
    }
    await cancelExpiredPendingBookings();
    /*
     * SERVICE TOTAL
     */
    const serviceTotalAmount =
      calculateServiceTotal(
        clientServices
      );
    let discountedServiceTotal =
      serviceTotalAmount;
    let serviceDiscountAmount =
      0;
    let appliedPromoCode:
      string | null = null;
    /*
     * PROMO
     */
    if (
      typeof promoCode ===
        "string" &&
      promoCode.trim()
    ) {
      const promo =
        await getPromo(
          promoCode
        );
      if (
        !promo ||
        !promo.active
      ) {
        return Response.json(
          {
            error:
              "That promo code isn't valid.",
          },
          { status: 400 }
        );
      }
      const discount =
        calculateDiscountedAmount(
          serviceTotalAmount,
          promo
        );
      discountedServiceTotal =
        discount.finalAmount;
      serviceDiscountAmount =
        discount.discountAmount;
      appliedPromoCode =
        promo.code;
    }
    /*
     * DEPOSIT
     *
     * PROMOS NEVER DISCOUNT THE DEPOSIT.
     */
    const depositAmount =
      DEPOSIT_PER_CLIENT *
      clientCount;
    const serviceSummary =
      clientServices
        .map(
          (
            services,
            index
          ) =>
            `Client ${
              index + 1
            }: ${services.join(
              " + "
            )} — ${
              clientDates[
                index
              ]
            } ${
              clientStartTimes[
                index
              ]
            }–${
              clientEndTimes[
                index
              ]
            }`
        )
        .join(" | ");
    const parentStartTime =
      clientStartTimes[0];
    const parentEndTime =
      clientEndTimes[0];
    const parentDuration =
      clientDurations[0];
    const expiresAt =
      new Date(
        Date.now() +
          15 * 60 * 1000
      ).toISOString();
    const appointmentInsert: AppointmentInsert =
      {
        customer_name: name,
        customer_phone:
          phone,
        customer_email:
          email,
        service_name:
          serviceSummary,
        client_count:
          clientCount,
        booking_date:
          clientDates[0],
        start_time:
          parentStartTime,
        end_time:
          parentEndTime,
        duration_minutes:
          parentDuration,
        deposit_per_client:
          DEPOSIT_PER_CLIENT,
        deposit_amount:
          depositAmount,
        payment_status:
          "pending",
        booking_status:
          "pending",
        expires_at:
          expiresAt,
        notes:
          notes || null,
        profile_id:
          profileId,
        promo_code:
          appliedPromoCode,
      };
    const {
      data: appointment,
      error:
        appointmentError,
    } =
      await supabase
        .from(
          "appointments"
        )
        .insert(
          appointmentInsert
        )
        .select("id")
        .single();
    if (
      appointmentError
    ) {
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
      appointment.id as string;
    const clientRows =
      clientServices.map(
        (
          services,
          index
        ) => ({
          appointment_id:
            appointmentId,
          client_number:
            index + 1,
          service_name:
            services.join(
              " + "
            ),
          booking_date:
            clientDates[index],
          start_time:
            clientStartTimes[
              index
            ],
          end_time:
            clientEndTimes[
              index
            ],
          duration_minutes:
            clientDurations[
              index
            ],
          booking_status:
            "pending",
        })
      );
    const {
      error:
        clientInsertError,
    } =
      await supabase
        .from(
          "appointment_clients"
        )
        .insert(
          clientRows
        );
    if (
      clientInsertError
    ) {
      console.error(
        "Client appointment insert error:",
        clientInsertError
      );
      await cancelAppointment(
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
      process.env
        .NEXT_PUBLIC_SITE_URL ||
      new URL(
        request.url
      ).origin;
    const successUrl =
      `${baseUrl}/?booking=success&appointment=${appointmentId}#booking`;
    const cancelUrl =
      `${baseUrl}/?booking=cancelled&appointment=${appointmentId}#booking`;
    const failureUrl =
      `${baseUrl}/?booking=failed&appointment=${appointmentId}#booking`;
    /*
     * YOCO
     *
     * ALWAYS CHARGE ONLY THE DEPOSIT.
     *
     * R90 × number of clients.
     *
     * Promo codes do not change this amount.
     */
    const yocoAmountCents =
      Math.round(
        depositAmount * 100
      );
    const yocoSecretKey =
      process.env.YOCO_SECRET_KEY;
    if (!yocoSecretKey) {
      await cancelAppointment(
        appointmentId
      );
      return Response.json(
        {
          error:
            "Payment configuration is missing. Please contact Freddy Nails.",
        },
        { status: 500 }
      );
    }
    const yocoResponse =
      await fetch(
        "https://payments.yoco.com/api/checkouts",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${yocoSecretKey}`,
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
    let yocoData: {
      id?: string;
      redirectUrl?: string;
      [key: string]: unknown;
    };
    try {
      yocoData =
        (await yocoResponse.json()) as {
          id?: string;
          redirectUrl?: string;
          [key: string]: unknown;
        };
    } catch {
      yocoData = {};
    }
    if (
      !yocoResponse.ok
    ) {
      console.error(
        "Yoco checkout error:",
        yocoData
      );
      await cancelAppointment(
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
      console.error(
        "Yoco returned incomplete checkout data:",
        yocoData
      );
      await cancelAppointment(
        appointmentId
      );
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
      serviceTotalAmount,
      discountAmount:
        serviceDiscountAmount,
      discountedServiceTotal,
      promoCode:
        appliedPromoCode,
      depositAmount,
      yocoAmount:
        depositAmount,
    });
  } catch (
    error: unknown
  ) {
    console.error(
      "Checkout API error:",
      error
    );
    if (appointmentId) {
      await cancelAppointment(
        appointmentId
      );
    }
    return Response.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Something went wrong starting your booking.",
      },
      { status: 500 }
    );
  }
}
