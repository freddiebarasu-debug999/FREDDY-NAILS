"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import SlotPicker from "@/components/SlotPicker";
import NailShapeIcon from "@/components/NailShapeIcon";
import {
  clashesWithOtherServices,
  findPrimaryConflict,
} from "@/lib/serviceRules";

const DEPOSIT_PER_CLIENT = 90;

function stripServicePrice(name) {
  return String(name || "")
    .replace(/\s*\(R\s*[\d.,]+(?:\s*[–—-]\s*R?\s*[\d.,]+)?\)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isSoakOffOnly(services) {
  if (!Array.isArray(services) || !services.length) return false;
  return services.every((s) => {
    const n = stripServicePrice(s).toLowerCase();
    return n.includes("soak off") || n.includes("soak-off");
  });
}

function soakOffPrice(serviceName) {
  const n = stripServicePrice(serviceName).toLowerCase();
  if (n.includes("other")) return 70;
  return 50;
}

function depositForServices(services, waive) {
  if (waive) return 0;
  if (isSoakOffOnly(services)) {
    return services.reduce((sum, s) => sum + soakOffPrice(s), 0);
  }
  return DEPOSIT_PER_CLIENT;
}

const CLIENT_GAP = 15;
const MAX_CLIENTS = 4;
const WHATSAPP_NUMBER = "27710888897";

const SERVICE_CATEGORIES = [
  {
    category: "Acrylic Manicure",
    items: [
      { name: "Acrylic — Plain Short–Medium", duration: 90 },
      { name: "Acrylic — Plain Long", duration: 105 },
      { name: "Acrylic — Plain XL–XXXL", duration: 120 },
      { name: "Acrylic — French Short–Medium", duration: 100 },
      { name: "Acrylic — French Long", duration: 115 },
      { name: "Acrylic — French XL–XXL", duration: 130 },
      { name: "Acrylic — Ombré Short–Medium", duration: 120 },
      { name: "Acrylic — Ombré Long", duration: 135 },
      { name: "Acrylic — Ombré XL–XXXL", duration: 150 },
    ],
  },
  {
    category: "Gel Manicure",
    items: [
      { name: "Gel — Overlay", duration: 75 },
      { name: "Gel — Plain Short–Medium", duration: 90 },
      { name: "Gel — Plain Long", duration: 100 },
      { name: "Gel — French Short–Medium", duration: 95 },
      { name: "Gel — French Long", duration: 110 },
    ],
  },
  {
    category: "Pedicure Sets",
    items: [
      { name: "Pedicure — Gel Overlay", duration: 45 },
      { name: "Pedicure — Gel Full Tips", duration: 60 },
      { name: "Pedicure — Acrylic Overlay", duration: 55 },
      { name: "Pedicure — Acrylic Full Tips", duration: 65 },
      { name: "Pedicure — Acrylic French Tips", duration: 75 },
    ],
  },
  {
    category: "Eyelash Extensions",
    items: [
      { name: "Lashes — Cluster", duration: 45 },
      { name: "Lashes — Cateye", duration: 60 },
      { name: "Lashes — Classic", duration: 90 },
      {
        name: "Lashes — Hybrid (Coming soon)",
        duration: 105,
        disabled: true,
      },
      {
        name: "Lashes — Volume (Coming soon)",
        duration: 120,
        disabled: true,
      },
      {
        name: "Lashes — Mega Volume (Coming soon)",
        duration: 135,
        disabled: true,
      },
    ],
  },
  {
    category: "Foot Spa",
    items: [
      { name: "Foot Spa — Basic", duration: 30 },
      { name: "Foot Spa — Luxury", duration: 45 },
    ],
  },
  {
    category: "Extras — add-on to a service above",
    items: [
      { name: "Extra — Buff & Shine", duration: 30 },
      { name: "Extra — Fill-in @3 weeks", duration: 75 },
      { name: "Extra — Nail Repair", duration: 15 },
      { name: "Extra — Soak Off (own work)", duration: 20 },
      { name: "Extra — Soak Off (other salon)", duration: 20 },
      { name: "Extra — Nail Art", duration: 20 },
      { name: "Extra — Rhinestones", duration: 10 },
      { name: "Extra — 3D Art", duration: 30 },
    ],
  },
];

const SERVICE_OPTIONS =
  SERVICE_CATEGORIES.flatMap(
    (group) => group.items
  );

const NAIL_SHAPES = [
  {
    name: "Almond",
    desc: "Tapered, rounded tip",
  },
  {
    name: "Square",
    desc: "Flat edge, sharp corners",
  },
  {
    name: "Squoval",
    desc: "Square with soft corners",
  },
  {
    name: "Oval",
    desc: "Rounded, classic",
  },
  {
    name: "Coffin",
    desc: "Tapered, squared tip",
  },
  {
    name: "Stiletto",
    desc: "Long, sharp point",
  },
];

function isShapeEligibleService(serviceName) {
  if (!serviceName) return false;

  if (
    serviceName ===
    "Gel — Overlay"
  ) {
    return false;
  }

  return (
    serviceName.startsWith("Acrylic —") ||
    serviceName.startsWith("Gel —")
  );
}

function extractServicePrice(serviceName) {
  if (!serviceName) return 0;

  const match = serviceName.match(
    /\(R(\d+)(?:–\d+)?\)/
  );

  if (!match) return 0;

  return Number(match[1]) || 0;
}

function calculateServicesTotal(services) {
  return services.reduce(
    (total, serviceName) =>
      total +
      extractServicePrice(serviceName),
    0
  );
}

function timeToMinutes(time) {
  if (!time) return null;

  const [hours, minutes] =
    time.split(":").map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(
    minutes / 60
  );

  const mins = minutes % 60;

  return `${String(hours).padStart(
    2,
    "0"
  )}:${String(mins).padStart(2, "0")}`;
}

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(
    `${dateString}T12:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString(
    "en-ZA",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

function formatTime(time) {
  if (!time) return "";

  const [hours, minutes] =
    time.split(":").map(Number);

  const date = new Date();

  date.setHours(
    hours,
    minutes,
    0,
    0
  );

  return date.toLocaleTimeString(
    "en-ZA",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function getTodayString() {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isSunday(dateString) {
  if (!dateString) return false;

  const date = new Date(
    `${dateString}T12:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.getDay() === 0;
}

function isPastDate(dateString) {
  if (!dateString) return false;

  return dateString < getTodayString();
}

function isBookableDate(dateString) {
  if (!dateString) return false;

  if (isPastDate(dateString)) {
    return false;
  }

  if (isSunday(dateString)) {
    return false;
  }

  return true;
}

function calculateServicesDuration(
  services
) {
  return services.reduce(
    (total, serviceName) => {
      const service =
        SERVICE_OPTIONS.find(
          (option) =>
            option.name === serviceName
        );

      return (
        total +
        (service?.duration || 0)
      );
    },
    0
  );
}

function getClientLabel(clientIndex) {
  return clientIndex === 0
    ? "Your appointment"
    : `Guest ${clientIndex}`;
}

const inputClass =
  "w-full px-4 py-3 border border-white/[0.12] rounded-md bg-[#181614] text-base sm:text-[0.92rem] text-[#f4eee6] placeholder:text-[#8f877e] focus:outline-none focus:border-[#d6b36a]/60 focus:ring-1 focus:ring-[#d6b36a]/20 transition-all";

/* Dark-gold selects (Number of clients, services, times) — overrides browser white dropdown chrome */
const selectClass =
  "w-full px-4 py-3 border border-[#d6b36a]/25 rounded-md bg-[#181614] text-base sm:text-[0.92rem] text-[#f4eee6] appearance-none focus:outline-none focus:border-[#d6b36a]/70 focus:ring-1 focus:ring-[#d6b36a]/25 transition-all cursor-pointer [color-scheme:dark]";

const labelClass =
  "block text-xs font-bold tracking-[0.12em] uppercase mb-2 text-[#c9c0b6]";

export default function Booking() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    clientServices: [
      [""],
    ],
    clientShapes: [""],
    clients: "1",
    clientDates: [""],
    clientTimes: [""],
    notes: "",
  });

  const [accountLoaded, setAccountLoaded] =
    useState(false);

  const [loggedIn, setLoggedIn] =
    useState(false);

  const [availableTimes, setAvailableTimes] =
    useState([[]]);
  const [allSlotsByClient, setAllSlotsByClient] =
    useState([[]]);

  const [
    loadingAvailability,
    setLoadingAvailability,
  ] = useState([false]);

  const [
    availabilityErrors,
    setAvailabilityErrors,
  ] = useState([""]);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const errorRef = useRef(null);

  // Show the error next to the pay button so it is never off-screen on a phone.
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [error]);

  const [
    confirmedBooking,
    setConfirmedBooking,
  ] = useState(null);

  const [
    confirmingBooking,
    setConfirmingBooking,
  ] = useState(false);

  const [promoCode, setPromoCode] =
    useState("");

  const [
    appliedPromo,
    setAppliedPromo,
  ] = useState(null);

  const [
    promoChecking,
    setPromoChecking,
  ] = useState(false);

  const [promoError, setPromoError] =
    useState("");

  const [promoOpen, setPromoOpen] =
    useState(false);

  const clientCount =
    Number(form.clients);

  const todayString =
    getTodayString();

  const clientDurations =
    useMemo(
      () =>
        form.clientServices.map(
          (services) =>
            calculateServicesDuration(
              services
            )
        ),
      [form.clientServices]
    );

  const totalServiceAmount =
    useMemo(
      () =>
        form.clientServices.reduce(
          (total, services) =>
            total +
            calculateServicesTotal(
              services
            ),
          0
        ),
      [form.clientServices]
    );

  const discountedServiceTotal =
    appliedPromo
      ? appliedPromo.discountType ===
        "percent"
        ? Math.max(
            0,
            Math.round(
              totalServiceAmount *
                (1 -
                  appliedPromo.discountValue /
                    100)
            )
          )
        : Math.max(
            0,
            totalServiceAmount -
              appliedPromo.discountValue
          )
      : totalServiceAmount;

  const serviceDiscountAmount =
    Math.max(
      0,
      totalServiceAmount -
        discountedServiceTotal
    );

  // A personal free-set code waives the deposit completely.
  const isFreeSet = Boolean(appliedPromo?.freeSet);

  const depositAmount = useMemo(() => {
    if (isFreeSet) return 0;
    return form.clientServices.reduce(
      (sum, services) => sum + depositForServices(services, false),
      0
    );
  }, [isFreeSet, form.clientServices]);

  /*
   * Applies both built-in Freddy Nails
   * promotions and database promotions.
   *
   * Built-in codes:
   * FRIEND50 = R50 off
   * BIRTHDAY = R50 off
   *
   * Database codes such as WELCOME10
   * continue through /api/promo/validate
   * so first-time eligibility is checked
   * against the customer's booking history.
   */
  async function applyPromoCodeValue(code) {
    const cleanCode =
      code?.trim().toUpperCase();

    if (!cleanCode) {
      setPromoError(
        "Please enter a promo code."
      );

      return false;
    }

    setPromoChecking(true);
    setPromoError("");

    try {
      const BUILT_IN_PROMOS = {
        FRIEND50: {
          code: "FRIEND50",
          discountType: "fixed",
          discountValue: 50,
          description:
            "R50 off when you bring a friend",
        },

        BIRTHDAY: {
          code: "BIRTHDAY",
          discountType: "fixed",
          discountValue: 50,
          description:
            "R50 birthday discount",
        },
      };

      /*
       * These three codes are already built
       * into the Freddy Nails checkout system.
       * Handle them directly instead of sending
       * them to the database promo validator.
       */
      if (
        BUILT_IN_PROMOS[cleanCode]
      ) {
        setPromoCode(cleanCode);

        setAppliedPromo(
          BUILT_IN_PROMOS[cleanCode]
        );

        setPromoError("");

        return true;
      }

      /*
       * Database promo codes such as WELCOME10
       * continue through the existing validation
       * endpoint.
       */
      const params =
        new URLSearchParams();

      params.set(
        "code",
        cleanCode
      );

      if (form.email.trim()) {
        params.set(
          "email",
          form.email.trim()
        );
      }

      if (form.phone.trim()) {
        params.set(
          "phone",
          form.phone.trim()
        );
      }

      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      const headers = {};

      if (
        session?.access_token
      ) {
        headers.Authorization =
          `Bearer ${session.access_token}`;
      }

      const response =
        await fetch(
          `/api/promo/validate?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
            headers,
          }
        );

      const rawText =
        await response.text();

      let data = null;

      if (rawText) {
        try {
          data =
            JSON.parse(rawText);
        } catch (parseError) {
          console.error(
            "Promo validation response was not valid JSON:",
            rawText,
            parseError
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "That code isn't valid."
        );
      }

      if (
        !data ||
        data.valid !== true ||
        !data.code ||
        !data.discountType ||
        typeof data.discountValue !==
          "number"
      ) {
        throw new Error(
          data?.error ||
            "That code isn't valid."
        );
      }

      setPromoCode(
        String(
          data.code
        ).toUpperCase()
      );

      setAppliedPromo({
        ...data,
        code: String(
          data.code
        ).toUpperCase(),
        discountType:
          data.discountType,
        discountValue:
          Number(
            data.discountValue
          ),
      });

      setPromoError("");

      return true;
    } catch (err) {
      setAppliedPromo(null);

      setPromoError(
        err?.message ||
          "Unable to check that code."
      );

      return false;
    } finally {
      setPromoChecking(false);
    }
  }

  async function applyPromoCode() {
    const code =
      promoCode.trim();

    if (!code) {
      setPromoError(
        "Please enter a promo code."
      );

      return;
    }

    await applyPromoCodeValue(
      code
    );
  }

  function removePromoCode() {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoError("");
    setPromoOpen(false);
  }

  // One-tap rebook: the account page can pass in the service from the
  // client's last visit. Use it once, then clear it.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("freddynails_rebook_service");
      if (!saved) return;
      window.localStorage.removeItem("freddynails_rebook_service");
      const matches = SERVICE_OPTIONS.filter((option) =>
        saved.includes(option.name)
      ).map((option) => option.name);
      if (matches.length > 0) {
        setForm((current) => ({
          ...current,
          clientServices: [matches, ...current.clientServices.slice(1)],
        }));
      }
    } catch (e) {
      // localStorage unavailable: ignore
    }
  }, []);

  // Try-on: carry the client's chosen shape and a note into the booking form.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("freddynails_tryon");
      if (!raw) return;
      window.localStorage.removeItem("freddynails_tryon");
      const saved = JSON.parse(raw);
      const shapeMatch = NAIL_SHAPES.find((item) => item.name === saved.shape);
      setForm((current) => ({
        ...current,
        clientShapes: shapeMatch
          ? [shapeMatch.name, ...current.clientShapes.slice(1)]
          : current.clientShapes,
        notes: saved.note
          ? current.notes
            ? current.notes + "\n" + saved.note
            : saved.note
          : current.notes,
      }));
    } catch (e) {
      // ignore bad data
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadAccount() {
      try {
        const {
          data: { user },
        } =
          await supabase.auth.getUser();

        if (!mounted) return;

        if (!user) {
          setLoggedIn(false);
          setAccountLoaded(true);
          return;
        }

        setLoggedIn(true);

        const { data: profile } =
          await supabase
            .from("profiles")
            .select(
              "full_name, phone, email"
            )
            .eq("id", user.id)
            .maybeSingle();

        if (!mounted) return;

        const metadata =
          user.user_metadata || {};

        setForm((current) => ({
          ...current,

          name:
            profile?.full_name ||
            metadata.full_name ||
            current.name ||
            "",

          phone:
            profile?.phone ||
            metadata.phone ||
            user.phone ||
            current.phone ||
            "",

          email:
            profile?.email ||
            user.email ||
            current.email ||
            "",
        }));
      } catch (accountError) {
        console.error(
          "Unable to load client account:",
          accountError
        );
      } finally {
        if (mounted) {
          setAccountLoaded(true);
        }
      }
    }

    loadAccount();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * If the customer changes their email or
   * phone after applying a first-time promo,
   * remove the applied promo. It must be
   * revalidated against the new identity.
   */
  useEffect(() => {
    if (!appliedPromo) return;

    const timeout =
      setTimeout(() => {
        setAppliedPromo(null);
      }, 0);

    return () =>
      clearTimeout(timeout);
  }, [
    form.email,
    form.phone,
  ]);

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const shapeParam =
      params.get("shape");

    const serviceParam =
      params.get("service");

    const promoParam =
      params.get("promo") ||
      params.get("offer") ||
      params.get("promoCode");

    const validShape = shapeParam
      ? NAIL_SHAPES.find(
          (item) =>
            item.name.toLowerCase() ===
            shapeParam
              .trim()
              .toLowerCase()
        )
      : null;

    const normalise = (value) =>
      value
        ?.replace(/[–—]/g, "-")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

    const normalisedService =
      normalise(serviceParam);

    const validService =
      normalisedService
        ? SERVICE_OPTIONS.find(
            (option) =>
              normalise(
                option.name
              ) ===
              normalisedService
          )
        : null;

    if (
      validShape ||
      validService
    ) {
      setForm((current) => ({
        ...current,

        clientServices:
          validService
            ? [[validService.name]]
            : current.clientServices,

        clientShapes: validShape
          ? [
              validShape.name,
              ...current.clientShapes.slice(
                1
              ),
            ]
          : current.clientShapes,
      }));
    }

    /*
     * Promo links such as:
     * /booking?promo=WELCOME10
     *
     * are checked after the account/details
     * fields have had a chance to load.
     */
    if (promoParam) {
      const cleanPromo =
        promoParam.trim();

      if (cleanPromo) {
        setPromoCode(cleanPromo);
      }
    }
  }, []);

  useEffect(() => {
    if (
      !accountLoaded ||
      !promoCode.trim() ||
      appliedPromo ||
      promoChecking
    ) {
      return;
    }

    const params =
      new URLSearchParams(
        window.location.search
      );

    const promoParam =
      params.get("promo") ||
      params.get("offer") ||
      params.get("promoCode");

    if (
      !promoParam ||
      promoParam.trim().toUpperCase() !==
        promoCode.trim().toUpperCase()
    ) {
      return;
    }

    applyPromoCodeValue(
      promoCode
    );
  }, [
    accountLoaded,
    form.email,
    form.phone,
  ]);

  function updateClientServices(
    clientIndex,
    services
  ) {
    setForm((current) => {
      const updated = [
        ...current.clientServices,
      ];

      updated[clientIndex] =
        services;

      return {
        ...current,
        clientServices: updated,
      };
    });

    setError("");
  }

  function updateClientShape(
    clientIndex,
    shape
  ) {
    setForm((current) => {
      const updated = [
        ...current.clientShapes,
      ];

      updated[clientIndex] =
        shape;

      return {
        ...current,
        clientShapes: updated,
      };
    });

    setError("");
  }

  function addService(clientIndex) {
    setForm((current) => {
      const updated = [
        ...current.clientServices,
      ];

      if (
        updated[clientIndex]
          .length >= 4
      ) {
        return current;
      }

      const unused =
        SERVICE_OPTIONS.find(
          (option) =>
            !updated[
              clientIndex
            ].includes(option.name) &&
            !clashesWithOtherServices(
              option.name,
              updated[clientIndex]
            )
        );

      if (!unused) return current;

      updated[clientIndex] = [
        ...updated[clientIndex],
        "",
      ];

      return {
        ...current,
        clientServices: updated,
      };
    });

    setError("");
  }

  function removeService(
    clientIndex,
    serviceIndex
  ) {
    setForm((current) => {
      const updated = [
        ...current.clientServices,
      ];

      if (
        updated[clientIndex]
          .length <= 1
      ) {
        return current;
      }

      updated[clientIndex] =
        updated[
          clientIndex
        ].filter(
          (_, index) =>
            index !==
            serviceIndex
        );

      return {
        ...current,
        clientServices: updated,
      };
    });

    setError("");
  }

  function changeClientCount(
    value
  ) {
    const nextCount =
      Number(value);

    setForm((current) => {
      const services = [
        ...current.clientServices,
      ];

      const shapes = [
        ...current.clientShapes,
      ];

      const dates = [
        ...current.clientDates,
      ];

      const times = [
        ...current.clientTimes,
      ];

      while (
        services.length <
        nextCount
      ) {
        services.push([""]);

        shapes.push("");
        dates.push("");
        times.push("");
      }

      services.length =
        nextCount;

      shapes.length =
        nextCount;

      dates.length =
        nextCount;

      times.length =
        nextCount;

      return {
        ...current,
        clients:
          String(nextCount),
        clientServices:
          services,
        clientShapes:
          shapes,
        clientDates:
          dates,
        clientTimes:
          times,
      };
    });

    setAvailableTimes(
      Array.from(
        {
          length: nextCount,
        },
        () => []
      )
    );

    setLoadingAvailability(
      Array.from(
        {
          length: nextCount,
        },
        () => false
      )
    );

    setAvailabilityErrors(
      Array.from(
        {
          length: nextCount,
        },
        () => ""
      )
    );

    setError("");
  }

  function updateClientDate(
    clientIndex,
    date
  ) {
    if (
      date &&
      isPastDate(date)
    ) {
      setError(
        "Previous dates cannot be booked. Please choose today or a future date."
      );

      setForm((current) => {
        const dates = [
          ...current.clientDates,
        ];

        const times = [
          ...current.clientTimes,
        ];

        dates[clientIndex] =
          "";

        times[clientIndex] =
          "";

        return {
          ...current,
          clientDates:
            dates,
          clientTimes:
            times,
        };
      });

      return;
    }

    if (
      date &&
      isSunday(date)
    ) {
      setError(
        "Sundays are unavailable for bookings. Please choose Monday to Saturday."
      );

      setForm((current) => {
        const dates = [
          ...current.clientDates,
        ];

        const times = [
          ...current.clientTimes,
        ];

        dates[clientIndex] =
          "";

        times[clientIndex] =
          "";

        return {
          ...current,
          clientDates:
            dates,
          clientTimes:
            times,
        };
      });

      return;
    }

    setForm((current) => {
      const dates = [
        ...current.clientDates,
      ];

      const times = [
        ...current.clientTimes,
      ];

      dates[clientIndex] =
        date;

      times[clientIndex] =
        "";

      return {
        ...current,
        clientDates:
          dates,
        clientTimes:
          times,
      };
    });

    setError("");
  }

  function updateClientTime(
    clientIndex,
    time
  ) {
    setForm((current) => {
      const times = [
        ...current.clientTimes,
      ];

      times[clientIndex] =
        time;

      return {
        ...current,
        clientTimes:
          times,
      };
    });

    setError("");
  }

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      const results =
        Array.from(
          {
            length:
              clientCount,
          },
          () => []
        );

      const slotResults =
        Array.from(
          {
            length:
              clientCount,
          },
          () => []
        );

      const loading =
        Array.from(
          {
            length:
              clientCount,
          },
          () => false
        );

      const errors =
        Array.from(
          {
            length:
              clientCount,
          },
          () => ""
        );

      for (
        let clientIndex = 0;
        clientIndex <
        clientCount;
        clientIndex++
      ) {
        const date =
          form.clientDates[
            clientIndex
          ];

        const duration =
          clientDurations[
            clientIndex
          ];

        if (
          !date ||
          !duration ||
          !isBookableDate(date)
        ) {
          continue;
        }

        loading[
          clientIndex
        ] = true;
      }

      if (!cancelled) {
        setLoadingAvailability(
          loading
        );

        setAvailabilityErrors(
          errors
        );
      }

      await Promise.all(
        Array.from(
          {
            length:
              clientCount,
          },
          async (
            _,
            clientIndex
          ) => {
            const date =
              form.clientDates[
                clientIndex
              ];

            const duration =
              clientDurations[
                clientIndex
              ];

            if (
              !date ||
              !duration ||
              !isBookableDate(date)
            ) {
              return;
            }

            try {
              const response =
                await fetch(
                  `/api/availability?date=${encodeURIComponent(
                    date
                  )}&duration=${duration}`,
                  {
                    cache:
                      "no-store",
                  }
                );

              const data =
                await response.json();

              if (
                !response.ok
              ) {
                throw new Error(
                  data.error ||
                    "Unable to load availability."
                );
              }

              results[
                clientIndex
              ] =
                data.availableTimes ||
                [];
              slotResults[
                clientIndex
              ] =
                data.allSlots ||
                [];
            } catch (
              requestError
            ) {
              errors[
                clientIndex
              ] =
                requestError.message ||
                "Unable to load availability.";
            } finally {
              loading[
                clientIndex
              ] = false;
            }
          }
        )
      );

      if (!cancelled) {
        setAvailableTimes(
          results
        );

        setAllSlotsByClient(
          slotResults
        );

        setLoadingAvailability(
          loading
        );

        setAvailabilityErrors(
          errors
        );
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [
    clientCount,
    form.clientDates,
    clientDurations,
  ]);

  function getClientAvailableTimes(
    clientIndex
  ) {
    let times =
      availableTimes[
        clientIndex
      ] || [];

    if (
      clientIndex > 0 &&
      form.clientDates[
        clientIndex
      ] &&
      form.clientDates[
        clientIndex - 1
      ] ===
        form.clientDates[
          clientIndex
        ] &&
      form.clientTimes[
        clientIndex - 1
      ]
    ) {
      const previousStart =
        timeToMinutes(
          form.clientTimes[
            clientIndex - 1
          ]
        );

      const previousDuration =
        clientDurations[
          clientIndex - 1
        ];

      const earliestStart =
        previousStart +
        previousDuration +
        CLIENT_GAP;

      times =
        times.filter(
          (time) =>
            timeToMinutes(
              time
            ) >=
            earliestStart
        );
    }

    return times;
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setError("");

    if (!form.name.trim()) {
      setError(
        "Please enter your name."
      );

      return;
    }

    if (!form.phone.trim()) {
      setError(
        "Please enter your phone number."
      );

      return;
    }

    if (!form.email.trim()) {
      setError(
        "Please enter your email address."
      );

      return;
    }

    /*
     * Promo codes are optional. If the client typed
     * something but never pressed Apply, try it now.
     * An invalid code never blocks the booking: it is
     * dropped and the client books normally.
     */
    let promoCodeToSend =
      appliedPromo?.code || null;

    if (
      !appliedPromo &&
      promoCode.trim()
    ) {
      const typedCode =
        promoCode.trim().toUpperCase();

      const typedCodeOk =
        await applyPromoCodeValue(
          typedCode
        );

      if (typedCodeOk) {
        promoCodeToSend = typedCode;
      } else {
        promoCodeToSend = null;
        setPromoCode("");
      }
    }

    /*
     * Re-check a first-time-only promo
     * immediately before checkout.
     */
    if (
      appliedPromo?.newClientsOnly
    ) {
      const stillValid =
        await applyPromoCodeValue(
          appliedPromo.code
        );

      if (!stillValid) {
        return;
      }
    }

    for (
      let clientIndex = 0;
      clientIndex <
      clientCount;
      clientIndex++
    ) {
      const services =
        form.clientServices[
          clientIndex
        ] || [];

      if (!services.length || services.some((service) => !service)) {
        setError(`Please choose at least one service for ${getClientLabel(clientIndex)}.`);
        return;
      }

      const primaryConflict =
        findPrimaryConflict(
          services
        );

      if (primaryConflict) {
        setError(
          `${getClientLabel(clientIndex)} can only have one ${
            primaryConflict.label
          }. Please remove the extra one.`
        );

        return;
      }

      const needsShape =
        services.some(
          isShapeEligibleService
        );

      if (
        needsShape &&
        !form.clientShapes[
          clientIndex
        ]
      ) {
        setError(
          `Please choose a nail shape for ${getClientLabel(clientIndex)}.`
        );

        return;
      }
    }

    for (
      let clientIndex = 0;
      clientIndex <
      clientCount;
      clientIndex++
    ) {
      const date =
        form.clientDates[
          clientIndex
        ];

      if (!date) {
        setError(
          `Please choose a preferred date for ${getClientLabel(clientIndex)}.`
        );

        return;
      }

      if (
        !isBookableDate(date)
      ) {
        if (
          isPastDate(date)
        ) {
          setError(
            `${getClientLabel(clientIndex)} has selected a previous date. Please choose today or a future date.`
          );
        } else if (
          isSunday(date)
        ) {
          setError(
            `${getClientLabel(clientIndex)} has selected a Sunday. Sundays are unavailable for bookings.`
          );
        } else {
          setError(
            `Please choose a valid booking date for ${getClientLabel(clientIndex)}.`
          );
        }

        return;
      }

      if (
        !form.clientTimes[
          clientIndex
        ]
      ) {
        setError(
          `Please choose an available time for ${getClientLabel(clientIndex)}.`
        );

        return;
      }
    }

    for (
      let clientIndex = 1;
      clientIndex <
      clientCount;
      clientIndex++
    ) {
      if (
        form.clientDates[
          clientIndex
        ] ===
        form.clientDates[
          clientIndex - 1
        ]
      ) {
        const previousStart =
          timeToMinutes(
            form.clientTimes[
              clientIndex - 1
            ]
          );

        const previousEnd =
          previousStart +
          clientDurations[
            clientIndex - 1
          ];

        const currentStart =
          timeToMinutes(
            form.clientTimes[
              clientIndex
            ]
          );

        if (
          currentStart <
          previousEnd +
            CLIENT_GAP
        ) {
          setError(
            `${getClientLabel(clientIndex)} needs to start at least 15 minutes after ${getClientLabel(clientIndex - 1)} finishes when booked on the same date.`
          );

          return;
        }
      }
    }

    setSubmitting(true);

    try {
      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      const headers = {
        "Content-Type":
          "application/json",
      };

      if (
        session?.access_token
      ) {
        headers.Authorization =
          `Bearer ${session.access_token}`;
      }

      const clientEndTimes =
        form.clientTimes.map(
          (
            startTime,
            index
          ) =>
            minutesToTime(
              timeToMinutes(
                startTime
              ) +
                clientDurations[
                  index
                ]
            )
        );

      const response =
        await fetch(
          "/api/checkout",
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              name:
                form.name.trim(),

              phone:
                form.phone.trim(),

              email:
                form.email.trim(),

              clientServices:
                form.clientServices,

              clientShapes:
                form.clientShapes,

              clientCount,

              clientDates:
                form.clientDates,

              clientStartTimes:
                form.clientTimes,

              clientEndTimes,

              notes:
                form.notes.trim(),

              promoCode:
                promoCodeToSend,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to start checkout."
        );
      }

      if (
        !data.redirectUrl
      ) {
        throw new Error(
          "No payment link was returned."
        );
      }

      window.location.href =
        data.redirectUrl;
    } catch (
      submitError
    ) {
      setError(
        submitError.message ||
          "Something went wrong. Please try again."
      );

      setSubmitting(false);
    }
  }

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    if (
      params.get("booking") !==
        "success" ||
      !params.get("appointment")
    ) {
      return;
    }

    const appointmentId =
      params.get(
        "appointment"
      );

    document
      .getElementById("booking")
      ?.scrollIntoView({
        behavior:
          "smooth",
        block: "start",
      });

    async function loadConfirmedBooking(
      attempt = 1
    ) {
      const MAX_ATTEMPTS = 8;

      if (attempt === 1) {
        setConfirmingBooking(
          true
        );
      }

      try {
        const response =
          await fetch(
            `/api/booking?id=${encodeURIComponent(
              appointmentId
            )}`,
            {
              cache:
                "no-store",
            }
          );

        const data =
          await response.json();

        if (
          !response.ok
        ) {
          if (
            attempt <
            MAX_ATTEMPTS
          ) {
            setTimeout(
              () =>
                loadConfirmedBooking(
                  attempt + 1
                ),
              2000
            );

            return;
          }

          setConfirmingBooking(
            false
          );

          throw new Error(
            data.error ||
              "Unable to load booking."
          );
        }

        setConfirmedBooking(
          data.appointment
        );

        setConfirmingBooking(
          false
        );

        window.history.replaceState(
          {},
          "",
          window.location.pathname
        );
      } catch (
        bookingError
      ) {
        console.error(
          "Confirmation lookup error:",
          bookingError
        );

        setConfirmingBooking(
          false
        );
      }
    }

    loadConfirmedBooking();
  }, []);

  if (
    confirmingBooking &&
    !confirmedBooking
  ) {
    return (
      <section
        id="booking"
        className="max-w-[1180px] mx-auto px-5 py-22"
      >
        <div className="max-w-[560px] mx-auto text-center py-12">
          <div className="w-12 h-12 rounded-full border-2 border-gold border-t-transparent animate-spin mx-auto mb-5" />

          <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
            Freddy Nails Studio
          </p>

          <h2 className="font-serif font-medium text-[clamp(1.7rem,4vw,2.3rem)] mt-3 mb-2 text-[#f4eee6]">
            Confirming your booking...
          </h2>

          <p className="text-[#c9c0b6] leading-relaxed">
            Your payment went through — just
            finalising the details. This usually
            takes a few seconds.
          </p>
        </div>
      </section>
    );
  }

  if (confirmedBooking) {
    const firstAppointmentDate =
      confirmedBooking.clients?.[0]
        ?.bookingDate ||
      confirmedBooking.bookingDate;

    const firstAppointmentTime =
      confirmedBooking.clients?.[0]
        ?.startTime ||
      confirmedBooking.startTime;

    const whatsappMessage =
      encodeURIComponent(
        `Hey Freddy! ${confirmedBooking.customerName} here.\nI just booked an appointment for ${formatDate(
          firstAppointmentDate
        )} at ${formatTime(
          firstAppointmentTime
        )}.\nI can't wait to get this set done💅`
      );

    const calendarUrl =
      `/api/calendar?appointment=${encodeURIComponent(
        confirmedBooking.id
      )}`;

    return (
      <section
        id="booking"
        className="relative max-w-[1180px] mx-auto px-5 py-16 sm:py-22"
      >
        <div className="max-w-[620px] mx-auto">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-gold/10 blur-xl" />

              <div className="relative w-16 h-16 rounded-full bg-gold text-[#11100f] text-2xl font-bold flex items-center justify-center shadow-[0_0_35px_rgba(214,179,106,0.18)]">
                ✓
              </div>
            </div>

            <p className="text-[0.72rem] font-bold tracking-[0.24em] uppercase text-gold">
              Freddy Nails Studio
            </p>

            <h2 className="font-serif font-medium text-[clamp(1.9rem,5vw,2.8rem)] mt-3 text-[#f4eee6] leading-tight">
              You&apos;ve successfully booked
              your appointment
            </h2>

            <p className="font-serif italic text-lg sm:text-xl text-gold-bright mt-4">
              You&apos;re all booked! 💅
            </p>

            <p className="text-[#c9c0b6] leading-relaxed mt-4 max-w-[500px] mx-auto">
              Your payment has been received
              and your appointment is confirmed.
              Your booking has been added to the
              Freddy Nails calendar.
            </p>
          </div>

          {confirmedBooking.clients &&
            confirmedBooking.clients.length >
              0 && (
              <div className="mt-9 border border-white/[0.10] bg-[#181614]/80 rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.08]">
                  <p className="text-[0.68rem] font-bold tracking-[0.20em] uppercase text-gold">
                    Booking summary
                  </p>
                </div>

                <div className="px-5">
                  {confirmedBooking.clients.map(
                    (
                      client,
                      index
                    ) => (
                      <div
                        key={
                          client.id ||
                          index
                        }
                        className={`py-5 flex flex-col gap-1.5 ${
                          index <
                          confirmedBooking
                            .clients
                            .length -
                            1
                            ? "border-b border-white/[0.08]"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <strong className="text-xs uppercase tracking-[0.14em] text-gold">
                            {getClientLabel(index)}
                          </strong>

                          {client.durationMinutes && (
                            <span className="text-xs text-[#8f877e]">
                              {
                                client.durationMinutes
                              }{" "}
                              min
                            </span>
                          )}
                        </div>

                        <span className="text-[#f4eee6] text-sm leading-relaxed">
                          {
                            client.service
                          }
                        </span>

                        {client.shape && (
                          <span className="text-[#c9c0b6] text-sm">
                            Shape:{" "}
                            {
                              client.shape
                            }
                          </span>
                        )}

                        <span className="text-[#c9c0b6] text-sm mt-1">
                          {formatDate(
                            client.bookingDate
                          )}
                        </span>

                        <span className="text-[#c9c0b6] text-sm">
                          {formatTime(
                            client.startTime
                          )}{" "}
                          –{" "}
                          {formatTime(
                            client.endTime
                          )}
                        </span>
                      </div>
                    )
                  )}
                </div>

                <div className="px-5 py-4 border-t border-white/[0.08] bg-gold/[0.04] flex items-center justify-between gap-4">
                  <div>
                    <span className="block text-[0.65rem] uppercase tracking-[0.14em] text-[#8f877e]">
                      Deposit paid
                    </span>

                    <span className="text-xs text-[#8f877e]">
                      R90 per client
                    </span>
                  </div>

                  <strong className="font-serif text-xl text-gold">
                    R
                    {
                      confirmedBooking.depositAmount
                    }
                  </strong>
                </div>
              </div>
            )}

          <div className="text-center mt-6 space-y-2">
            <p className="text-sm text-[#c9c0b6] leading-relaxed">
              A confirmation email has been sent
              to{" "}
              <strong className="text-[#f4eee6]">
                {
                  confirmedBooking.customerEmail
                }
              </strong>
              .
            </p>

            <p className="text-sm text-[#8f877e] leading-relaxed">
              Keep your booking details handy
              and arrive on time for your
              appointment.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2.5 w-full bg-gold text-[#11100f] px-6 py-4 rounded-sm text-[0.82rem] font-bold uppercase tracking-wide hover:bg-gold-bright transition-colors"
            >
              <span className="text-base">
                💬
              </span>

              Message Freddy Nails on WhatsApp
            </a>

            <a
              href={calendarUrl}
              className="flex items-center justify-center gap-2.5 w-full border border-gold/45 bg-gold/[0.06] text-gold px-6 py-4 rounded-sm text-[0.82rem] font-bold uppercase tracking-wide hover:bg-gold/10 hover:border-gold/70 transition-colors"
            >
              <span className="text-base">
                📅
              </span>

              Add to Calendar
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <a
              href="/"
              className="flex items-center justify-center px-5 py-3.5 border border-white/[0.10] text-[#c9c0b6] rounded-sm text-xs font-bold uppercase tracking-wide hover:border-gold/35 hover:text-gold transition-colors"
            >
              ← Back to Home
            </a>

            <a
              href="/account"
              className="flex items-center justify-center px-5 py-3.5 border border-white/[0.10] text-[#c9c0b6] rounded-sm text-xs font-bold uppercase tracking-wide hover:border-gold/35 hover:text-gold transition-colors"
            >
              View My Bookings
            </a>
          </div>

          <div className="text-center mt-7">
            <p className="text-[0.68rem] text-[#8f877e]">
              Booking ID:{" "}
              <span className="text-[#c9c0b6]">
                {confirmedBooking.id ||
                  "Confirmed"}
              </span>
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="booking"
      className="relative max-w-[1180px] mx-auto px-5 py-22 overflow-x-clip"
    >
      <div className="max-w-[820px] mx-auto mb-12">
        <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
          Book your appointment
        </p>

        <h2 className="font-serif font-medium text-[clamp(1.9rem,4vw,2.6rem)] mt-3.5 text-[#f4eee6]">
          Reserve your nail appointment
        </h2>

        <div className="mt-5 h-px w-16 bg-gold/60" />

        <p className="text-[#c9c0b6] leading-relaxed text-[0.94rem] mt-5 max-w-[650px]">
          Book your own appointment or bring friends and family. Choose each person’s services and time below.
        </p>

        {loggedIn &&
          accountLoaded && (
            <div className="mt-5 border border-gold/20 bg-gold/[0.05] px-4 py-3 text-sm text-[#c9c0b6]">
              <span className="text-gold font-semibold">
                Your account is connected.
              </span>{" "}
              Your saved details have been
              filled in automatically.
            </div>
          )}
      </div>

      <div className="max-w-[820px] mx-auto min-w-0">
        <form onSubmit={handleSubmit} className="w-full min-w-0">
          <div className="pb-8 border-b border-white/[0.09]">
            <div className="flex items-center gap-4 mb-6">
              <p className="text-[0.68rem] font-bold tracking-[0.22em] uppercase text-gold">
                Your details
              </p>

              <div className="h-px flex-1 bg-white/[0.08]" />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label>
                <span
                  className={labelClass}
                >
                  Full name
                </span>

                <input
                  type="text"
                  className={inputClass}
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: event.target
                        .value,
                    })
                  }
                  placeholder="Your full name"
                  name="name"
                  autoComplete="name"
                  autoCapitalize="words"
                  enterKeyHint="next"
                  required
                />
              </label>

              <label>
                <span
                  className={labelClass}
                >
                  Phone number
                </span>

                <input
                  type="tel"
                  className={inputClass}
                  value={form.phone}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      phone: event.target
                        .value,
                    })
                  }
                  placeholder="e.g. 071 234 5678"
                  name="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  enterKeyHint="next"
                  required
                />
              </label>

              <label>
                <span
                  className={labelClass}
                >
                  Email address
                </span>

                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      email: event.target
                        .value,
                    })
                  }
                  placeholder="you@example.com"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  required
                />
              </label>

              <label>
                <span
                  className={labelClass}
                >
                  Who are you booking for?
                </span>

                <select
                  className={selectClass}
                  value={form.clients}
                  onChange={(event) =>
                    changeClientCount(
                      event.target.value
                    )
                  }
                >
                  {Array.from(
                    {
                      length:
                        MAX_CLIENTS,
                    },
                    (_, index) => (
                      <option
                        key={
                          index + 1
                        }
                        value={
                          index + 1
                        }
                      >
                        {index === 0
                          ? "Just me"
                          : `Me + ${index} guest${index > 1 ? "s" : ""}`}
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>
          </div>

          <div className="pt-8">
            <div className="flex items-center gap-4 mb-7">
              <p className="text-[0.68rem] font-bold tracking-[0.22em] uppercase text-gold">
                Appointment details
              </p>

              <div className="h-px flex-1 bg-white/[0.08]" />
            </div>

            <div className="space-y-10">
              {Array.from(
                {
                  length:
                    clientCount,
                },
                (_, clientIndex) => {
                  const services =
                    form
                      .clientServices[
                      clientIndex
                    ] || [];

                  const times =
                    getClientAvailableTimes(
                      clientIndex
                    );

                  const needsShape =
                    services.some(
                      isShapeEligibleService
                    );

                  return (
                    <div
                      key={
                        clientIndex
                      }
                      className="relative"
                    >
                      <div className="flex justify-between items-start gap-4 mb-5">
                        <div>
                          <span className="block text-xs font-bold uppercase tracking-[0.16em] text-gold mb-1.5">
                            {getClientLabel(clientIndex)}
                          </span>

                          <h3 className="font-serif text-xl font-medium text-[#f4eee6]">
                            Choose services and time
                          </h3>
                        </div>

                        <span className="shrink-0 text-xs font-bold tracking-wide text-[#c9c0b6] border-b border-gold/40 pb-1">
                          {clientDurations[clientIndex]
                            ? `${clientDurations[clientIndex]} min`
                            : "Service needed"}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {services.map(
                          (
                            serviceName,
                            serviceIndex
                          ) => (
                            <div
                              key={`${clientIndex}-${serviceIndex}`}
                              className="flex gap-2 items-center"
                            >
                              <select
                                aria-label={`Service ${serviceIndex + 1} for ${getClientLabel(clientIndex)}`}
                                className={`${selectClass} flex-1 min-w-0`}
                                value={
                                  serviceName
                                }
                                onChange={(
                                  event
                                ) => {
                                  const updated =
                                    [
                                      ...services,
                                    ];

                                  updated[
                                    serviceIndex
                                  ] =
                                    event
                                      .target
                                      .value;

                                  updateClientServices(
                                    clientIndex,
                                    updated
                                  );
                                }}
                              >
                                <option value="">Choose a service...</option>
                                {SERVICE_CATEGORIES.map(
                                  (
                                    group
                                  ) => (
                                    <optgroup
                                      key={
                                        group.category
                                      }
                                      label={
                                        group.category
                                      }
                                    >
                                      {group.items.map(
                                        (
                                          option
                                        ) => (
                                          <option
                                            key={
                                              option.name
                                            }
                                            value={
                                              option.name
                                            }
                                            disabled={
                                              option.disabled ||
                                              (option.name !==
                                                serviceName &&
                                                clashesWithOtherServices(
                                                  option.name,
                                                  services.filter(
                                                    (_, i) =>
                                                      i !==
                                                      serviceIndex
                                                  )
                                                ))
                                            }
                                          >
                                            {option.name.replace(/\s*\(R[^)]*\)/g, "")}
                                          </option>
                                        )
                                      )}
                                    </optgroup>
                                  )
                                )}
                              </select>

                              {services.length >
                                1 && (
                                <button
                                  type="button"
                                  className="shrink-0 text-xs font-bold uppercase tracking-wide text-[#c17a78] hover:text-[#e39a96] px-2 py-1 transition-colors"
                                  onClick={() =>
                                    removeService(
                                      clientIndex,
                                      serviceIndex
                                    )
                                  }
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          )
                        )}

                        {services.length <
                          4 && (
                          <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded-md border border-gold/45 bg-gold/[0.07] px-4 py-3 text-xs font-bold uppercase tracking-wide text-gold hover:bg-gold/[0.13] hover:border-gold/70 transition-colors"
                            onClick={() =>
                              addService(
                                clientIndex
                              )
                            }
                          >
                            + Add another service
                          </button>
                        )}
                      </div>

                      <div
                        className={`mt-7 pt-6 border-t border-white/[0.08] transition-all duration-300 ${
                          !needsShape
                            ? "opacity-35 grayscale pointer-events-none select-none"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div>
                            <span className="block text-xs font-bold uppercase tracking-[0.14em] text-gold">
                              Nail shape
                            </span>

                            <p className="text-xs text-[#9f978f] mt-1">
                              {needsShape
                                ? "Choose your preferred shape."
                                : "Available for nail services only."}
                            </p>
                          </div>

                          {!needsShape && (
                            <span className="text-[0.6rem] font-bold uppercase tracking-wide text-[#8f877e]">
                              Not applicable
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {NAIL_SHAPES.map(
                            (shape) => {
                              const selected =
                                form
                                  .clientShapes[
                                  clientIndex
                                ] ===
                                shape.name;

                              return (
                                <button
                                  key={
                                    shape.name
                                  }
                                  type="button"
                                  onClick={() =>
                                    updateClientShape(
                                      clientIndex,
                                      shape.name
                                    )
                                  }
                                  className={`px-3 py-3 rounded-md text-center transition-all ${
                                    selected
                                      ? "bg-gold/10 text-gold border border-gold/60"
                                      : "bg-[#181614] border border-white/[0.09] text-[#f4eee6] hover:border-gold/40"
                                  }`}
                                >
                                  <span className="mb-2 block">
                                    <NailShapeIcon
                                      shape={shape.name}
                                      selected={selected}
                                      height={58}
                                    />
                                  </span>

                                  <span
                                    className={`block text-xs font-bold ${
                                      selected
                                        ? "text-gold"
                                        : "text-[#f4eee6]"
                                    }`}
                                  >
                                    {
                                      shape.name
                                    }
                                  </span>

                                  <span className="block text-[0.68rem] text-[#9f978f] mt-1">
                                    {
                                      shape.desc
                                    }
                                  </span>
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>

                      {services.some(Boolean) ? (
                        <SlotPicker
                          date={form.clientDates[clientIndex] || ""}
                          time={form.clientTimes[clientIndex] || ""}
                          times={times}
                          allSlots={allSlotsByClient[clientIndex] || []}
                          loading={Boolean(loadingAvailability[clientIndex])}
                          duration={clientDurations[clientIndex] || 0}
                          minDate={todayString}
                          onDate={(value) =>
                            updateClientDate(clientIndex, value)
                          }
                          onTime={(value) =>
                            updateClientTime(clientIndex, value)
                          }
                        />
                      ) : (
                        <p className="mt-6 rounded-md border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-sm text-[#9f978f]">
                          Choose a service above to see available dates and times.
                        </p>
                      )}

                      {availabilityErrors[
                        clientIndex
                      ] && (
                        <div className="mt-4 border-l-2 border-red-400 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                          {
                            availabilityErrors[
                              clientIndex
                            ]
                          }
                        </div>
                      )}

                      {form
                        .clientDates[
                        clientIndex
                      ] &&
                        times.length ===
                          0 &&
                        !loadingAvailability[
                          clientIndex
                        ] &&
                        !availabilityErrors[
                          clientIndex
                        ] && (
                          <p className="text-xs text-[#9f978f] italic mt-3">
                            No appointment
                            times are
                            currently
                            available for
                            this date.
                            Please choose
                            another date.
                          </p>
                        )}

                      {clientIndex >
                        0 &&
                        form
                          .clientDates[
                          clientIndex
                        ] ===
                          form
                            .clientDates[
                            clientIndex -
                              1
                          ] &&
                        form
                          .clientTimes[
                          clientIndex -
                            1
                        ] && (
                          <p className="text-xs text-[#9f978f] italic mt-3">
                            Same-day clients
                            are automatically
                            scheduled with a
                            15-minute gap
                            between
                            appointments.
                          </p>
                        )}

                      {clientIndex <
                        clientCount -
                          1 && (
                        <div className="mt-10 h-px bg-white/[0.08]" />
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>

          <label className="block mt-10 pt-8 border-t border-white/[0.09]">
            <span
              className={labelClass}
            >
              Notes (optional)
            </span>

            <textarea
              className={`${inputClass} min-h-[100px] resize-y`}
              value={form.notes}
              onChange={(event) =>
                setForm({
                  ...form,
                  notes:
                    event.target.value,
                })
              }
              placeholder="Add inspiration or special requests here. Please select all services above instead of listing them in the notes."
              rows={4}
            />
          </label>

          <div className="mt-8 pt-6 border-t border-white/[0.09]">
            {!appliedPromo &&
            !promoOpen &&
            !promoCode.trim() &&
            !promoError ? (
              <button
                type="button"
                onClick={() =>
                  setPromoOpen(true)
                }
                className="text-sm text-gold underline underline-offset-4"
              >
                Have a promo or referral code?
              </button>
            ) : (
              <>
            <span className="block text-xs font-bold tracking-[0.12em] uppercase mb-2 text-[#c9c0b6]">
              Promo code / Offer (optional)
            </span>

            {appliedPromo ? (
              <div className="border border-gold/40 bg-gold/10 px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gold font-bold">
                    {
                      appliedPromo.code
                    }
                  </span>

                  <span className="text-xs text-[#c9c0b6] flex-1">
                    {
                      appliedPromo.description ||
                      "Offer applied successfully."
                    }
                  </span>

                  <button
                    type="button"
                    onClick={
                      removePromoCode
                    }
                    className="text-xs text-[#8f877e] hover:text-gold underline"
                  >
                    Remove
                  </button>
                </div>

                <p className="text-xs text-gold/80 mt-2">
                  Your offer has been
                  applied to eligible services.
                </p>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(event) => {
                    setPromoCode(
                      event.target
                        .value
                    );

                    setPromoError(
                      ""
                    );

                    if (
                      appliedPromo
                    ) {
                      setAppliedPromo(
                        null
                      );
                    }
                  }}
                  placeholder="Have a code? Enter it here (optional)"
                  name="freddy-promo-code"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  className={`${inputClass} flex-1 min-w-0`}
                />

                <button
                  type="button"
                  onClick={
                    applyPromoCode
                  }
                  disabled={
                    promoChecking ||
                    !promoCode.trim()
                  }
                  className="shrink-0 border border-gold/50 text-gold px-5 py-3 text-xs font-bold uppercase tracking-wide hover:bg-gold/10 transition-colors disabled:opacity-50"
                >
                  {promoChecking
                    ? "Checking..."
                    : "Apply"}
                </button>
              </div>
            )}

            {promoChecking &&
              !appliedPromo && (
                <p className="text-xs text-[#9f978f] mt-2">
                  Checking your eligibility...
                </p>
              )}

            {promoError && (
              <div className="mt-3 border-l-2 border-red-400 bg-red-400/10 px-4 py-3">
                <p className="text-xs text-red-300 leading-relaxed">
                  {promoError}
                </p>

                <p className="text-xs text-[#c9c0b6] leading-relaxed mt-1">
                  A promo code is optional.
                </p>

                {promoCode.trim() && (
                  <button
                    type="button"
                    onClick={removePromoCode}
                    className="text-xs text-gold underline mt-2"
                  >
                    Clear code
                  </button>
                )}
              </div>
            )}
              </>
            )}
          </div>

          {/* Booking summary */}
          {form.clientServices
            .slice(0, clientCount)
            .some(
              (_, index) =>
                form.clientDates[index] &&
                form.clientTimes[index]
            ) && (
            <div className="mt-6 border border-white/[0.10] bg-[#181614]/80 rounded-lg px-4 py-4">
              <p className="text-[0.68rem] font-bold tracking-[0.22em] uppercase text-gold mb-3">
                Your booking summary
              </p>

              <div className="space-y-3">
                {form.clientServices
                  .slice(0, clientCount)
                  .map((services, index) => {
                    const date =
                      form.clientDates[index];
                    const start =
                      form.clientTimes[index];
                    const hasSlot =
                      date && start;

                    return (
                      <div
                        key={`summary-${index}`}
                        className="text-sm text-[#c9c0b6] leading-relaxed break-words"
                      >
                        {clientCount > 1 && (
                          <span className="block text-[#f4eee6] font-semibold">
                            {getClientLabel(index)}
                          </span>
                        )}

                        <span className="block">
                          {(services || []).length > 0
                            ? services.join(", ")
                            : "No service chosen yet"}
                        </span>

                        <span className="block text-[#8f877e]">
                          {hasSlot
                            ? `${formatDate(date)}, ${formatTime(start)} to ${formatTime(
                                minutesToTime(
                                  timeToMinutes(start) +
                                    (clientDurations[index] || 0)
                                )
                              )}`
                            : "Date and time not chosen yet"}
                        </span>
                      </div>
                    );
                  })}
              </div>

              {appliedPromo && (
                <p className="text-xs text-gold mt-3">
                  Code applied: {appliedPromo.code}
                </p>
              )}
            </div>
          )}

          <div className="border-t border-white/[0.09] pt-6 mt-6 space-y-4">
            <div className="flex justify-between items-center gap-4">
              <div className="min-w-0">
                <span className="block text-xs uppercase tracking-[0.12em] text-[#8f877e] mb-1">
                  Booking deposit
                </span>

                <span className="text-xs text-[#8f877e]">
                  {isFreeSet
                    ? "Waived with your free set code"
                    : "R90 per client"}
                </span>
              </div>

              <strong className="font-serif text-2xl text-gold shrink-0">
                R{depositAmount}
              </strong>
            </div>

            <div className="text-xs text-[#8f877e] leading-relaxed break-words">
              {isFreeSet
                ? "Your free set code covers this booking. No payment is needed, and your slot is confirmed as soon as you tap the button below."
                : "Standard deposit is R90 per client (soak-off only is R50 / R70 in full). Final service pricing is confirmed at your appointment with Freddy Nails before your appointment."}
            </div>
          </div>

          {error && (
            <div
              ref={errorRef}
              role="alert"
              className="mt-7 border-l-2 border-red-400 bg-red-400/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <div className="sticky bottom-0 z-20 -mx-5 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] mt-5 bg-[#11100f]/95 backdrop-blur border-t border-white/[0.09] sm:mx-0 sm:px-0 sm:border-t-0 sm:bg-transparent sm:backdrop-blur-none">
          <button
            type="submit"
            disabled={submitting || promoChecking}
            className="flex items-center justify-center gap-2.5 w-full bg-gold text-[#11100f] py-4 rounded-sm font-bold uppercase tracking-wide text-[0.85rem] hover:bg-gold-bright transition-colors disabled:opacity-50"
          >
            {submitting
              ? isFreeSet
                ? "Confirming your booking..."
                : "Preparing secure payment..."
              : isFreeSet
              ? "Confirm my free set"
              : `Pay R${depositAmount} deposit`}
          </button>
          </div>

          <p className="text-xs text-[#8f877e] text-center mt-3">
            {isFreeSet
              ? "No payment is taken with a free set code."
              : "You'll be securely redirected to Yoco to pay your booking deposit."}
          </p>
        </form>
      </div>
    </section>
  );
}
