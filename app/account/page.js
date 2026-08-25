"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const MAX_CLIENTS = 4;
const MAX_SERVICES_PER_CLIENT = 4;
const DEPOSIT_PER_CLIENT = 90;
const CLIENT_GAP = 15;
const OPEN_MINUTES = 9 * 60 + 30;
const CLOSE_MINUTES = 17 * 60 + 30;

const SERVICE_CATEGORIES = [
  {
    title: "Acrylic Manicure",
    services: [
      {
        name: "Acrylic — Plain Short–Medium (R200)",
        price: 200,
        duration: 90,
      },
      {
        name: "Acrylic — Plain Long (R250)",
        price: 250,
        duration: 105,
      },
      {
        name: "Acrylic — Plain XL–XXXL (R300)",
        price: 300,
        duration: 120,
      },
      {
        name: "Acrylic — French Short–Medium (R300)",
        price: 300,
        duration: 100,
      },
      {
        name: "Acrylic — French Long (R350)",
        price: 350,
        duration: 115,
      },
      {
        name: "Acrylic — French XL–XXL (R400)",
        price: 400,
        duration: 130,
      },
      {
        name: "Acrylic — Ombré Short–Medium (R250)",
        price: 250,
        duration: 120,
      },
      {
        name: "Acrylic — Ombré Long (R300)",
        price: 300,
        duration: 135,
      },
      {
        name: "Acrylic — Ombré XL–XXXL (R350)",
        price: 350,
        duration: 150,
      },
    ],
  },

  {
    title: "Gel Manicure",
    services: [
      {
        name: "Gel — Overlay (R200)",
        price: 200,
        duration: 75,
      },
      {
        name: "Gel — Plain Short–Medium (R250)",
        price: 250,
        duration: 90,
      },
      {
        name: "Gel — Plain Long (R300)",
        price: 300,
        duration: 100,
      },
      {
        name: "Gel — French Short–Medium (R300)",
        price: 300,
        duration: 95,
      },
      {
        name: "Gel — French Long (R350)",
        price: 350,
        duration: 110,
      },
    ],
  },

  {
    title: "Pedicure Sets",
    services: [
      {
        name: "Pedicure — Gel Overlay (R150)",
        price: 150,
        duration: 45,
      },
      {
        name: "Pedicure — Gel Full Tips (R200)",
        price: 200,
        duration: 60,
      },
      {
        name: "Pedicure — Acrylic Overlay (R180)",
        price: 180,
        duration: 55,
      },
      {
        name: "Pedicure — Acrylic Full Tips (R200)",
        price: 200,
        duration: 65,
      },
      {
        name: "Pedicure — Acrylic French Tips (R250)",
        price: 250,
        duration: 75,
      },
    ],
  },

  {
    title: "Eyelash Extensions",
    services: [
      {
        name: "Lashes — Cluster (R130)",
        price: 130,
        duration: 45,
      },
      {
        name: "Lashes — Cateye (R150)",
        price: 150,
        duration: 60,
      },
      {
        name: "Lashes — Classic (R180)",
        price: 180,
        duration: 90,
      },
    ],
  },

  {
    title: "Foot Spa",
    services: [
      {
        name: "Foot Spa — Basic (R200)",
        price: 200,
        duration: 30,
      },
      {
        name: "Foot Spa — Luxury (R280)",
        price: 280,
        duration: 45,
      },
    ],
  },

  {
    title: "Extras",
    services: [
      {
        name: "Extra — Buff & Shine (R150)",
        price: 150,
        duration: 30,
      },
      {
        name: "Extra — Fill-in @3 weeks (R180)",
        price: 180,
        duration: 75,
      },
      {
        name: "Extra — Nail Repair (R20–R30)",
        price: 20,
        duration: 15,
      },
      {
        name: "Extra — Soak Off (R50)",
        price: 50,
        duration: 20,
      },
      {
        name: "Extra — Nail Art (R30–R50)",
        price: 30,
        duration: 20,
      },
      {
        name: "Extra — Rhinestones (R10–R15)",
        price: 10,
        duration: 10,
      },
      {
        name: "Extra — 3D Art (R50–R100)",
        price: 50,
        duration: 30,
      },
    ],
  },
];

const SERVICE_LOOKUP = SERVICE_CATEGORIES.reduce(
  (result, category) => {
    category.services.forEach((service) => {
      result[service.name] = service;
    });

    return result;
  },
  {}
);

const BUILT_IN_PROMOS = {
  FIRSTVISIT: {
    code: "FIRSTVISIT",
    discountType: "percent",
    discountValue: 15,
    description: "15% off your first visit",
  },

  FRIEND50: {
    code: "FRIEND50",
    discountType: "fixed",
    discountValue: 50,
    description: "R50 off when you bring a friend",
  },

  BIRTHDAY: {
    code: "BIRTHDAY",
    discountType: "fixed",
    discountValue: 50,
    description: "Birthday special — R50 off",
  },
};

function formatMoney(amount) {
  return `R${Number(amount || 0).toFixed(0)}`;
}

function getServicePrice(serviceName) {
  return SERVICE_LOOKUP[serviceName]?.price || 0;
}

function getServiceDuration(serviceName) {
  return SERVICE_LOOKUP[serviceName]?.duration || 0;
}

function getClientDuration(services) {
  return services.reduce(
    (total, service) =>
      total + getServiceDuration(service),
    0
  );
}

function getClientTotal(services) {
  return services.reduce(
    (total, service) =>
      total + getServicePrice(service),
    0
  );
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    mins
  ).padStart(2, "0")}`;
}

function timeToMinutes(time) {
  if (!time) return 0;

  const [hours, minutes] = time
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}

function formatTime(time) {
  if (!time) return "";

  const [hours, minutes] = time
    .split(":")
    .map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return time;
  }

  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-ZA", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(
    `${dateString}T12:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getTodayString() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isSunday(dateString) {
  if (!dateString) return false;

  const date = new Date(
    `${dateString}T12:00:00`
  );

  return date.getDay() === 0;
}

function getInitialClients() {
  return [
    {
      services: [],
      date: "",
      time: "",
      availableTimes: [],
      loadingTimes: false,
      availabilityError: "",
    },
  ];
}

export default function BookingPage() {
  const [user, setUser] = useState(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [clientCount, setClientCount] =
    useState(1);

  const [clients, setClients] =
    useState(getInitialClients);

  const [promoCode, setPromoCode] =
    useState("");

  const [promo, setPromo] =
    useState(null);

  const [promoLoading, setPromoLoading] =
    useState(false);

  const [promoError, setPromoError] =
    useState("");

  const [submitLoading, setSubmitLoading] =
    useState(false);

  const [submitError, setSubmitError] =
    useState("");

  const [accountLoading, setAccountLoading] =
    useState(true);

  const [accountMessage, setAccountMessage] =
    useState("");

  const [bookingComplete, setBookingComplete] =
    useState(false);

  const [checkoutData, setCheckoutData] =
    useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);

          const metadata =
            session.user.user_metadata || {};

          setName(
            metadata.full_name ||
              metadata.name ||
              ""
          );

          setPhone(
            metadata.phone ||
              ""
          );

          setEmail(
            session.user.email || ""
          );

          const { data: profile } =
            await supabase
              .from("profiles")
              .select(
                "full_name, phone, email"
              )
              .eq(
                "id",
                session.user.id
              )
              .maybeSingle();

          if (!mounted) return;

          if (profile) {
            setName(
              profile.full_name ||
                metadata.full_name ||
                metadata.name ||
                ""
            );

            setPhone(
              profile.phone ||
                metadata.phone ||
                ""
            );

            setEmail(
              profile.email ||
                session.user.email ||
                ""
            );
          }
        }
      } catch (error) {
        console.error(
          "Booking account load error:",
          error
        );
      } finally {
        if (mounted) {
          setAccountLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (clientCount === clients.length) {
      return;
    }

    setClients((current) => {
      if (clientCount > current.length) {
        const expanded = [
          ...current,
        ];

        while (
          expanded.length <
          clientCount
        ) {
          expanded.push({
            services: [],
            date: "",
            time: "",
            availableTimes: [],
            loadingTimes: false,
            availabilityError: "",
          });
        }

        return expanded;
      }

      return current.slice(
        0,
        clientCount
      );
    });
  }, [clientCount, clients.length]);

  const serviceTotal = useMemo(() => {
    return clients.reduce(
      (total, client) =>
        total +
        getClientTotal(
          client.services
        ),
      0
    );
  }, [clients]);

  const depositAmount =
    DEPOSIT_PER_CLIENT *
    clientCount;

  const discountAmount = useMemo(() => {
    if (!promo) return 0;

    if (
      promo.discountType ===
      "percent"
    ) {
      const percentage = Math.min(
        Number(
          promo.discountValue
        ) || 0,
        100
      );

      return Math.round(
        serviceTotal *
          (percentage / 100)
      );
    }

    return Math.min(
      Number(
        promo.discountValue
      ) || 0,
      serviceTotal
    );
  }, [promo, serviceTotal]);

  const discountedTotal =
    Math.max(
      0,
      serviceTotal -
        discountAmount
    );

  function updateClient(
    clientIndex,
    updates
  ) {
    setClients((current) =>
      current.map(
        (client, index) =>
          index === clientIndex
            ? {
                ...client,
                ...updates,
              }
            : client
      )
    );
  }

  function toggleService(
    clientIndex,
    serviceName
  ) {
    setSubmitError("");

    setClients((current) =>
      current.map(
        (client, index) => {
          if (
            index !== clientIndex
          ) {
            return client;
          }

          const alreadySelected =
            client.services.includes(
              serviceName
            );

          if (alreadySelected) {
            return {
              ...client,
              services:
                client.services.filter(
                  (service) =>
                    service !==
                    serviceName
                ),
              time: "",
              availableTimes: [],
              availabilityError: "",
            };
          }

          if (
            client.services.length >=
            MAX_SERVICES_PER_CLIENT
          ) {
            return client;
          }

          return {
            ...client,
            services: [
              ...client.services,
              serviceName,
            ],
            time: "",
            availableTimes: [],
            availabilityError: "",
          };
        }
      )
    );
  }

  async function loadAvailability(
    clientIndex,
    date
  ) {
    const client =
      clients[clientIndex];

    if (!client) return;

    if (
      !date ||
      !client.services.length
    ) {
      updateClient(
        clientIndex,
        {
          date,
          time: "",
          availableTimes: [],
          loadingTimes: false,
          availabilityError: "",
        }
      );

      return;
    }

    if (isSunday(date)) {
      updateClient(
        clientIndex,
        {
          date,
          time: "",
          availableTimes: [],
          loadingTimes: false,
          availabilityError:
            "Freddy Nails is closed on Sundays.",
        }
      );

      return;
    }

    const duration =
      getClientDuration(
        client.services
      );

    updateClient(
      clientIndex,
      {
        date,
        time: "",
        availableTimes: [],
        loadingTimes: true,
        availabilityError: "",
      }
    );

    try {
      const response =
        await fetch(
          `/api/availability?date=${encodeURIComponent(
            date
          )}&duration=${encodeURIComponent(
            duration
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to load available times."
        );
      }

      let times =
        Array.isArray(
          data?.times
        )
          ? data.times
          : Array.isArray(
              data?.availableTimes
            )
          ? data.availableTimes
          : [];

      /*
       * When booking multiple clients on
       * the same day, keep the required
       * 15-minute gap from the previous
       * client's appointment.
       */
      const previousClient =
        clientIndex > 0
          ? clients[
              clientIndex - 1
            ]
          : null;

      if (
        previousClient &&
        previousClient.date === date &&
        previousClient.time
      ) {
        const previousDuration =
          getClientDuration(
            previousClient.services
          );

        const earliestStart =
          timeToMinutes(
            previousClient.time
          ) +
          previousDuration +
          CLIENT_GAP;

        times = times.filter(
          (time) =>
            timeToMinutes(
              time
            ) >= earliestStart
        );
      }

      updateClient(
        clientIndex,
        {
          availableTimes: times,
          loadingTimes: false,
          availabilityError:
            times.length
              ? ""
              : "No suitable times are available for this date.",
        }
      );
    } catch (error) {
      console.error(
        "Availability error:",
        error
      );

      updateClient(
        clientIndex,
        {
          availableTimes: [],
          loadingTimes: false,
          availabilityError:
            error?.message ||
            "Unable to load available times.",
        }
      );
    }
  }

  async function applyPromoCode(
    suppliedCode
  ) {
    const code = String(
      suppliedCode ||
        promoCode ||
        ""
    )
      .trim()
      .toUpperCase();

    if (!code) {
      setPromo(null);
      setPromoError(
        "Please enter a promo code."
      );
      return;
    }

    setPromoLoading(true);
    setPromoError("");
    setPromo(null);

    try {
      let accessToken = null;

      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      accessToken =
        session?.access_token ||
        null;

      /*
       * Account-aware promo validation.
       */
      if (accessToken) {
        const response =
          await fetch(
            `/api/promo/validate?code=${encodeURIComponent(
              code
            )}`,
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (
          response.ok &&
          data?.valid
        ) {
          setPromo({
            code:
              data.code ||
              code,
            discountType:
              data.discountType ||
              data.discount_type ||
              "percent",
            discountValue:
              Number(
                data.discountValue ??
                  data.discount_value ??
                  0
              ),
            description:
              data.description ||
              "",
            minimumSpend:
              data.minimumSpend ??
              data.minimum_spend ??
              null,
          });

          setPromoCode(
            data.code ||
              code
          );

          return;
        }

        /*
         * If the account route says login is
         * required, show that instead of
         * silently falling through.
         */
        if (
          response.status === 401 &&
          data?.requiresLogin
        ) {
          throw new Error(
            "Please log in to use this account promotion."
          );
        }

        /*
         * For the three built-in promotions,
         * retain the frontend fallback so the
         * booking page still works if the
         * database promo endpoint is unavailable.
         */
        if (
          BUILT_IN_PROMOS[code]
        ) {
          const builtIn =
            BUILT_IN_PROMOS[code];

          if (
            code ===
              "FIRSTVISIT" &&
            !user
          ) {
            throw new Error(
              "Please log in to verify your first-visit eligibility."
            );
          }

          setPromo(
            builtIn
          );

          setPromoCode(
            builtIn.code
          );

          return;
        }

        throw new Error(
          data?.error ||
            "That promo code isn't valid."
        );
      }

      /*
       * Built-in fallback when the client
       * is not signed in.
       */
      if (
        BUILT_IN_PROMOS[code]
      ) {
        if (
          code === "FIRSTVISIT"
        ) {
          throw new Error(
            "Please log in to verify your first-visit eligibility."
          );
        }

        setPromo(
          BUILT_IN_PROMOS[code]
        );

        setPromoCode(code);

        return;
      }

      throw new Error(
        "Please log in to use account promotions."
      );
    } catch (error) {
      console.error(
        "Promo validation error:",
        error
      );

      setPromo(null);
      setPromoError(
        error?.message ||
          "Unable to verify this promo code."
      );
    } finally {
      setPromoLoading(false);
    }
  }

  function removePromo() {
    setPromo(null);
    setPromoCode("");
    setPromoError("");
  }

  function validateBooking() {
    if (!name.trim()) {
      return "Please enter your name.";
    }

    if (!phone.trim()) {
      return "Please enter your phone number.";
    }

    if (!email.trim()) {
      return "Please enter your email address.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim()
      )
    ) {
      return "Please enter a valid email address.";
    }

    if (
      clients.length !==
      clientCount
    ) {
      return "Please complete every client booking.";
    }

    for (
      let index = 0;
      index < clients.length;
      index++
    ) {
      const client =
        clients[index];

      if (
        !client.services.length
      ) {
        return `Please select at least one service for Client ${
          index + 1
        }.`;
      }

      if (
        client.services.length >
        MAX_SERVICES_PER_CLIENT
      ) {
        return `Client ${
          index + 1
        } can have a maximum of ${MAX_SERVICES_PER_CLIENT} services.`;
      }

      if (!client.date) {
        return `Please choose a date for Client ${
          index + 1
        }.`;
      }

      if (isSunday(client.date)) {
        return `Client ${
          index + 1
        } cannot be booked on Sunday.`;
      }

      if (!client.time) {
        return `Please choose an available time for Client ${
          index + 1
        }.`;
      }

      const startMinutes =
        timeToMinutes(
          client.time
        );

      const duration =
        getClientDuration(
          client.services
        );

      const endMinutes =
        startMinutes +
        duration;

      if (
        startMinutes <
          OPEN_MINUTES ||
        endMinutes >
          CLOSE_MINUTES
      ) {
        return `Client ${
          index + 1
        }'s appointment is outside business hours.`;
      }

      if (
        !client.availableTimes.includes(
          client.time
        )
      ) {
        return `The selected time for Client ${
          index + 1
        } is no longer available. Please choose another time.`;
      }

      const uniqueServices =
        new Set(
          client.services
        );

      if (
        uniqueServices.size !==
        client.services.length
      ) {
        return `Client ${
          index + 1
        } cannot have the same service selected twice.`;
      }
    }

    for (
      let index = 1;
      index < clients.length;
      index++
    ) {
      const previous =
        clients[index - 1];

      const current =
        clients[index];

      if (
        previous.date ===
        current.date
      ) {
        const previousEnd =
          timeToMinutes(
            previous.time
          ) +
          getClientDuration(
            previous.services
          );

        const currentStart =
          timeToMinutes(
            current.time
          );

        if (
          currentStart <
          previousEnd +
            CLIENT_GAP
        ) {
          return `Client ${
            index + 1
          } must start at least ${CLIENT_GAP} minutes after Client ${
            index
          } finishes.`;
        }
      }
    }

    if (
      promo &&
      promo.minimumSpend !==
        null &&
      promo.minimumSpend !==
        undefined &&
      serviceTotal <
        Number(
          promo.minimumSpend
        )
    ) {
      return `This promotion requires a minimum service total of ${formatMoney(
        promo.minimumSpend
      )}.`;
    }

    return "";
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setSubmitError("");
    setAccountMessage("");

    const validationError =
      validateBooking();

    if (validationError) {
      setSubmitError(
        validationError
      );
      return;
    }

    setSubmitLoading(true);

    try {
      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      const clientServices =
        clients.map(
          (client) =>
            client.services
        );

      const clientDates =
        clients.map(
          (client) =>
            client.date
        );

      const clientStartTimes =
        clients.map(
          (client) =>
            client.time
        );

      const response =
        await fetch(
          "/api/checkout",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              ...(session?.access_token
                ? {
                    Authorization:
                      `Bearer ${session.access_token}`,
                  }
                : {}),
            },
            body: JSON.stringify({
              name:
                name.trim(),
              phone:
                phone.trim(),
              email:
                email.trim(),
              clientServices,
              clientCount,
              clientDates,
              clientStartTimes,
              notes:
                notes.trim(),
              promoCode:
                promo?.code ||
                promoCode
                  .trim()
                  .toUpperCase() ||
                null,
            }),
          }
        );

      let data = null;

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "The booking server returned an invalid response. Please try again."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to start your booking."
        );
      }

      if (
        !data?.redirectUrl
      ) {
        throw new Error(
          "Yoco did not return a payment link."
        );
      }

      setCheckoutData(
        data
      );

      setBookingComplete(
        true
      );

      /*
       * Redirect immediately to Yoco.
       */
      window.location.href =
        data.redirectUrl;
    } catch (error) {
      console.error(
        "Booking submission error:",
        error
      );

      setSubmitError(
        error?.message ||
          "Something went wrong while starting your booking."
      );

      setSubmitLoading(false);
    }
  }

  function addClient() {
    if (
      clientCount >=
      MAX_CLIENTS
    ) {
      return;
    }

    setClientCount(
      (current) =>
        current + 1
    );

    setSubmitError("");
  }

  function removeClient() {
    if (
      clientCount <= 1
    ) {
      return;
    }

    setClientCount(
      (current) =>
        current - 1
    );

    setSubmitError("");
  }

  function clearClientServices(
    clientIndex
  ) {
    updateClient(
      clientIndex,
      {
        services: [],
        time: "",
        availableTimes: [],
        availabilityError: "",
      }
    );
  }

  if (bookingComplete) {
    return (
      <main className="min-h-screen bg-[#11100f] px-5 py-16 text-[#f4eee6]">
        <div className="mx-auto max-w-[720px]">
          <a
            href="/"
            className="text-sm text-[#a79a87] transition-colors hover:text-[#d6b36a]"
          >
            ← Freddy Nails
          </a>

          <div className="mt-12 border border-[#d6b36a]/30 bg-[#181614] p-7 md:p-10">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#d6b36a]">
              Booking reserved
            </p>

            <h1 className="mt-3 font-serif text-4xl text-[#f4eee6]">
              Almost there.
            </h1>

            <p className="mt-5 text-sm leading-relaxed text-[#a79a87]">
              Your selected appointment
              time has been reserved
              temporarily. You are being
              redirected to Yoco to pay
              your deposit of{" "}
              <span className="text-[#d6b36a]">
                {formatMoney(
                  checkoutData?.depositAmount ||
                    depositAmount
                )}
              </span>
              .
            </p>

            <div className="mt-7 border-t border-white/[0.08] pt-6">
              <p className="text-xs uppercase tracking-[0.16em] text-[#8f877e]">
                Important
              </p>

              <p className="mt-2 text-sm leading-relaxed text-[#c9c0b6]">
                Complete the deposit
                payment to secure your
                booking. Your deposit is
                fixed at R90 per client and
                is not reduced by promo
                codes.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (
                  checkoutData?.redirectUrl
                ) {
                  window.location.href =
                    checkoutData.redirectUrl;
                }
              }}
              className="mt-7 inline-flex bg-[#d6b36a] px-6 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-[#11100f] transition-colors hover:bg-[#ad8a4e]"
            >
              Continue to payment →
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#11100f] px-5 py-10 text-[#f4eee6]">
      <div className="mx-auto max-w-[1180px]">
        <header className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <a
              href="/"
              className="text-sm text-[#a79a87] transition-colors hover:text-[#d6b36a]"
            >
              ← Freddy Nails
            </a>

            <p className="mt-8 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#d6b36a]">
              Reserve your appointment
            </p>

            <h1 className="mt-2 font-serif text-4xl text-[#f4eee6] md:text-5xl">
              Book your nails.
            </h1>

            <p className="mt-4 max-w-[650px] text-sm leading-relaxed text-[#a79a87]">
              Choose your services, select
              your preferred date and
              available time, then secure
              your appointment with the
              R90-per-client deposit.
            </p>
          </div>

          {user ? (
            <a
              href="/account"
              className="border border-white/[0.12] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#c9c0b6] transition-colors hover:border-[#d6b36a]/40 hover:text-[#d6b36a]"
            >
              My account
            </a>
          ) : (
            <a
              href="/account/login"
              className="border border-white/[0.12] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#c9c0b6] transition-colors hover:border-[#d6b36a]/40 hover:text-[#d6b36a]"
            >
              Client login
            </a>
          )}
        </header>

        <form
          onSubmit={handleSubmit}
          className="mt-12 grid gap-8 lg:grid-cols-[1fr_380px]"
        >
          <div className="space-y-8">
            <section className="border border-white/[0.10] bg-[#181614] p-6 md:p-8">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#d6b36a]">
                  01
                </p>

                <h2 className="mt-2 font-serif text-2xl text-[#f4eee6]">
                  Your details
                </h2>

                <p className="mt-2 text-sm text-[#8f877e]">
                  {user
                    ? "Your account details have been loaded. You can update them for this booking."
                    : "Enter your contact details so we can connect the booking to you."}
                </p>
              </div>

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#8f877e]">
                    Full name
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value
                      )
                    }
                    placeholder="Your full name"
                    required
                    className="mt-2 w-full border border-white/[0.10] bg-[#11100f] px-4 py-3.5 text-sm text-[#f4eee6] outline-none transition-colors placeholder:text-[#625d58] focus:border-[#d6b36a]/50"
                  />
                </div>

                <div>
                  <label className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#8f877e]">
                    Phone
                  </label>

                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(
                        event.target.value
                      )
                    }
                    placeholder="07..."
                    required
                    className="mt-2 w-full border border-white/[0.10] bg-[#11100f] px-4 py-3.5 text-sm text-[#f4eee6] outline-none transition-colors placeholder:text-[#625d58] focus:border-[#d6b36a]/50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#8f877e]">
                    Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    placeholder="you@example.com"
                    required
                    className="mt-2 w-full border border-white/[0.10] bg-[#11100f] px-4 py-3.5 text-sm text-[#f4eee6] outline-none transition-colors placeholder:text-[#625d58] focus:border-[#d6b36a]/50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#8f877e]">
                    Notes
                  </label>

                  <textarea
                    value={notes}
                    onChange={(event) =>
                      setNotes(
                        event.target.value
                      )
                    }
                    rows={4}
                    placeholder="Shape, colour, nail art ideas, existing product, allergies or anything else Freddy should know..."
                    className="mt-2 w-full resize-y border border-white/[0.10] bg-[#11100f] px-4 py-3.5 text-sm leading-relaxed text-[#f4eee6] outline-none transition-colors placeholder:text-[#625d58] focus:border-[#d6b36a]/50"
                  />
                </div>
              </div>
            </section>

            <section className="border border-white/[0.10] bg-[#181614] p-6 md:p-8">
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#d6b36a]">
                    02
                  </p>

                  <h2 className="mt-2 font-serif text-2xl text-[#f4eee6]">
                    Who is booking?
                  </h2>

                  <p className="mt-2 text-sm text-[#8f877e]">
                    Booking for yourself or
                    multiple clients? Each
                    client gets their own
                    services, date and time.
                  </p>
                </div>

                <div className="flex items-center border border-white/[0.10] bg-[#11100f]">
                  <button
                    type="button"
                    onClick={
                      removeClient
                    }
                    disabled={
                      clientCount <= 1
                    }
                    className="px-4 py-3 text-lg text-[#c9c0b6] hover:text-[#d6b36a] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    −
                  </button>

                  <span className="min-w-[55px] text-center text-sm text-[#f4eee6]">
                    {clientCount}
                  </span>

                  <button
                    type="button"
                    onClick={
                      addClient
                    }
                    disabled={
                      clientCount >=
                      MAX_CLIENTS
                    }
                    className="px-4 py-3 text-lg text-[#c9c0b6] hover:text-[#d6b36a] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-7 space-y-8">
                {clients.map(
                  (
                    client,
                    clientIndex
                  ) => (
                    <div
                      key={
                        clientIndex
                      }
                      className="border border-white/[0.08] bg-[#11100f] p-5 md:p-6"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#d6b36a]">
                            Client{" "}
                            {clientIndex +
                              1}
                          </p>

                          <h3 className="mt-1 font-serif text-xl text-[#f4eee6]">
                            Select services
                          </h3>
                        </div>

                        {client
                          .services
                          .length >
                          0 && (
                          <button
                            type="button"
                            onClick={() =>
                              clearClientServices(
                                clientIndex
                              )
                            }
                            className="text-xs uppercase tracking-[0.12em] text-[#8f877e] hover:text-red-300"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <div className="mt-5 space-y-6">
                        {SERVICE_CATEGORIES.map(
                          (
                            category
                          ) => (
                            <div
                              key={
                                category.title
                              }
                            >
                              <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#8f877e]">
                                {
                                  category.title
                                }
                              </p>

                              <div className="mt-2 grid gap-2">
                                {category.services.map(
                                  (
                                    service
                                  ) => {
                                    const selected =
                                      client.services.includes(
                                        service.name
                                      );

                                    return (
                                      <button
                                        type="button"
                                        key={
                                          service.name
                                        }
                                        onClick={() =>
                                          toggleService(
                                            clientIndex,
                                            service.name
                                          )
                                        }
                                        className={`flex w-full items-center justify-between gap-4 border px-4 py-3 text-left transition-colors ${
                                          selected
                                            ? "border-[#d6b36a]/50 bg-[#d6b36a]/10"
                                            : "border-white/[0.08] bg-[#181614] hover:border-white/[0.18]"
                                        }`}
                                      >
                                        <span>
                                          <span className="block text-sm text-[#f4eee6]">
                                            {
                                              service.name
                                            }
                                          </span>

                                          <span className="mt-1 block text-[0.68rem] text-[#817970]">
                                            {
                                              service.duration
                                            }{" "}
                                            min
                                          </span>
                                        </span>

                                        <span
                                          className={`shrink-0 text-sm font-semibold ${
                                            selected
                                              ? "text-[#d6b36a]"
                                              : "text-[#c9c0b6]"
                                          }`}
                                        >
                                          {formatMoney(
                                            service.price
                                          )}
                                        </span>
                                      </button>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      <div className="mt-6 border-t border-white/[0.08] pt-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs text-[#8f877e]">
                            {
                              client
                                .services
                                .length
                            }{" "}
                            /{" "}
                            {
                              MAX_SERVICES_PER_CLIENT
                            }{" "}
                            services selected
                          </p>

                          <p className="text-sm text-[#d6b36a]">
                            {formatMoney(
                              getClientTotal(
                                client.services
                              )
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#8f877e]">
                            Preferred date
                          </label>

                          <input
                            type="date"
                            min={getTodayString()}
                            value={
                              client.date
                            }
                            onChange={(
                              event
                            ) => {
                              void loadAvailability(
                                clientIndex,
                                event
                                  .target
                                  .value
                              );
                            }}
                            disabled={
                              !client
                                .services
                                .length
                            }
                            className="mt-2 w-full border border-white/[0.10] bg-[#181614] px-4 py-3.5 text-sm text-[#f4eee6] outline-none focus:border-[#d6b36a]/50 disabled:cursor-not-allowed disabled:opacity-40"
                          />

                          {!client
                            .services
                            .length && (
                            <p className="mt-2 text-xs text-[#625d58]">
                              Select at least
                              one service
                              first.
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#8f877e]">
                            Available time
                          </label>

                          <select
                            value={
                              client.time
                            }
                            onChange={(
                              event
                            ) =>
                              updateClient(
                                clientIndex,
                                {
                                  time: event
                                    .target
                                    .value,
                                }
                              )
                            }
                            disabled={
                              !client.date ||
                              client.loadingTimes ||
                              !client
                                .availableTimes
                                .length
                            }
                            className="mt-2 w-full border border-white/[0.10] bg-[#181614] px-4 py-3.5 text-sm text-[#f4eee6] outline-none focus:border-[#d6b36a]/50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <option value="">
                              {client.loadingTimes
                                ? "Checking availability..."
                                : "Select a time"}
                            </option>

                            {client.availableTimes.map(
                              (
                                time
                              ) => (
                                <option
                                  key={
                                    time
                                  }
                                  value={
                                    time
                                  }
                                >
                                  {formatTime(
                                    time
                                  )}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>

                      {client
                        .availabilityError && (
                        <div className="mt-4 border border-[#d6b36a]/20 bg-[#d6b36a]/5 px-4 py-3 text-xs leading-relaxed text-[#a79a87]">
                          {
                            client.availabilityError
                          }
                        </div>
                      )}

                      {client.date &&
                        client.time &&
                        client.services
                          .length >
                          0 && (
                          <div className="mt-5 border-t border-white/[0.08] pt-5">
                            <p className="text-xs text-[#8f877e]">
                              Appointment
                            </p>

                            <p className="mt-1 text-sm text-[#f4eee6]">
                              {formatDate(
                                client.date
                              )}{" "}
                              ·{" "}
                              {formatTime(
                                client.time
                              )}{" "}
                              –{" "}
                              {formatTime(
                                minutesToTime(
                                  timeToMinutes(
                                    client.time
                                  ) +
                                    getClientDuration(
                                      client.services
                                    )
                                )
                              )}
                            </p>
                          </div>
                        )}
                    </div>
                  )
                )}
              </div>
            </section>

            <section className="border border-white/[0.10] bg-[#181614] p-6 md:p-8">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#d6b36a]">
                  03
                </p>

                <h2 className="mt-2 font-serif text-2xl text-[#f4eee6]">
                  Have a promo code?
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-[#8f877e]">
                  Eligible promotions can
                  be applied to your service
                  total. The R90-per-client
                  deposit is always separate
                  and is never discounted.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(event) => {
                    setPromoCode(
                      event.target.value.toUpperCase()
                    );
                    setPromoError("");
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      event.preventDefault();

                      void applyPromoCode();
                    }
                  }}
                  placeholder="Enter promo code"
                  className="min-w-0 flex-1 border border-white/[0.10] bg-[#11100f] px-4 py-3.5 text-sm uppercase tracking-[0.08em] text-[#f4eee6] outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-[#625d58] focus:border-[#d6b36a]/50"
                />

                <button
                  type="button"
                  onClick={() =>
                    void applyPromoCode()
                  }
                  disabled={
                    promoLoading ||
                    !promoCode.trim()
                  }
                  className="bg-[#d6b36a] px-6 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-[#11100f] transition-colors hover:bg-[#ad8a4e] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {promoLoading
                    ? "Checking..."
                    : "Apply"}
                </button>
              </div>

              {promoError && (
                <div className="mt-4 border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                  {promoError}
                </div>
              )}

              {promo && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border border-[#d6b36a]/30 bg-[#d6b36a]/10 px-4 py-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#d6b36a]">
                      {promo.code}
                    </p>

                    <p className="mt-1 text-sm text-[#c9c0b6]">
                      {promo.description ||
                        "Promotion applied"}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-[#d6b36a]">
                      −
                      {formatMoney(
                        discountAmount
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={
                        removePromo
                      }
                      className="text-xs uppercase tracking-[0.12em] text-[#8f877e] hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {!user && (
                <div className="mt-5 border border-white/[0.08] bg-[#11100f] px-4 py-4">
                  <p className="text-sm text-[#c9c0b6]">
                    Create a client account
                    to access account-based
                    promotions such as First
                    Visit and Birthday offers.
                  </p>

                  <a
                    href="/account/login"
                    className="mt-3 inline-block text-xs font-bold uppercase tracking-[0.12em] text-[#d6b36a] hover:text-[#f4eee6]"
                  >
                    Log in / create account →
                  </a>
                </div>
              )}
            </section>

            {submitError && (
              <div className="border border-red-400/30 bg-red-400/10 px-5 py-4 text-sm leading-relaxed text-red-300">
                {submitError}
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="border border-white/[0.10] bg-[#181614] p-6 md:p-7">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#d6b36a]">
                Booking summary
              </p>

              <h2 className="mt-2 font-serif text-2xl text-[#f4eee6]">
                Your appointment
              </h2>

              <div className="mt-6 space-y-5">
                {clients.map(
                  (
                    client,
                    index
                  ) => (
                    <div
                      key={index}
                      className="border-b border-white/[0.08] pb-5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8f877e]">
                          Client{" "}
                          {index +
                            1}
                        </p>

                        <p className="text-sm text-[#d6b36a]">
                          {formatMoney(
                            getClientTotal(
                              client.services
                            )
                          )}
                        </p>
                      </div>

                      {client
                        .services
                        .length ? (
                        <div className="mt-3 space-y-1">
                          {client.services.map(
                            (
                              service
                            ) => (
                              <p
                                key={
                                  service
                                }
                                className="text-xs leading-relaxed text-[#c9c0b6]"
                              >
                                {
                                  service
                                }
                              </p>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-[#625d58]">
                          No services
                          selected
                        </p>
                      )}

                      {client.date && (
                        <p className="mt-3 text-xs text-[#8f877e]">
                          {formatDate(
                            client.date
                          )}
                          {client.time
                            ? ` · ${formatTime(
                                client.time
                              )}`
                            : ""}
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-[#8f877e]">
                    Services
                  </span>

                  <span className="text-[#f4eee6]">
                    {formatMoney(
                      serviceTotal
                    )}
                  </span>
                </div>

                {promo && (
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-[#8f877e]">
                      Promo{" "}
                      {promo.code}
                    </span>

                    <span className="text-[#d6b36a]">
                      −
                      {formatMoney(
                        discountAmount
                      )}
                    </span>
                  </div>
                )}

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-[#8f877e]">
                    Discounted services
                  </span>

                  <span className="text-[#f4eee6]">
                    {formatMoney(
                      discountedTotal
                    )}
                  </span>
                </div>

                <div className="border-t border-white/[0.08] pt-4">
                  <div className="flex justify-between gap-4">
                    <span className="text-sm text-[#c9c0b6]">
                      Deposit
                    </span>

                    <span className="text-lg font-semibold text-[#d6b36a]">
                      {formatMoney(
                        depositAmount
                      )}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-[#817970]">
                    R90 ×{" "}
                    {clientCount}{" "}
                    client
                    {clientCount ===
                    1
                      ? ""
                      : "s"}
                    . Promo codes do
                    not reduce the
                    deposit.
                  </p>
                </div>
              </div>

              <div className="mt-6 border border-[#d6b36a]/20 bg-[#d6b36a]/5 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#d6b36a]">
                  Secure your booking
                </p>

                <p className="mt-2 text-xs leading-relaxed text-[#a79a87]">
                  Your selected times are
                  reserved while you
                  complete the secure Yoco
                  deposit payment.
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  submitLoading ||
                  accountLoading
                }
                className="mt-6 flex w-full items-center justify-center bg-[#d6b36a] px-6 py-4 text-xs font-bold uppercase tracking-[0.14em] text-[#11100f] transition-colors hover:bg-[#ad8a4e] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitLoading
                  ? "Preparing secure payment..."
                  : `Pay ${formatMoney(
                      depositAmount
                    )} Deposit →`}
              </button>

              <p className="mt-4 text-center text-[0.68rem] leading-relaxed text-[#625d58]">
                You will be redirected to
                Yoco to complete payment
                securely.
              </p>
            </div>
          </aside>
        </form>

        <footer className="border-t border-white/[0.08] py-10 text-center">
          <p className="text-xs uppercase tracking-[0.16em] text-[#625d58]">
            Freddy Nails · East London ·
            Nude / Black / Gold
          </p>

          <p className="mt-3 text-xs text-[#4f4a46]">
            Questions? WhatsApp{" "}
            <a
              href="https://wa.me/27710888897"
              className="text-[#8f877e] hover:text-[#d6b36a]"
            >
              071 088 8897
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
