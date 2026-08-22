 "use client";

import { useEffect, useMemo, useState } from "react";

const DEPOSIT_PER_CLIENT = 90;
const CLIENT_GAP = 15;
const MAX_CLIENTS = 4;
const WHATSAPP_NUMBER = "27710888897";

const SERVICE_CATEGORIES = [
  {
    category: "Acrylic Manicure",
    items: [
      { name: "Acrylic — Plain Short–Medium (R200)", duration: 90 },
      { name: "Acrylic — Plain Long (R250)", duration: 105 },
      { name: "Acrylic — Plain XL–XXXL (R300)", duration: 120 },
      { name: "Acrylic — French Short–Medium (R300)", duration: 100 },
      { name: "Acrylic — French Long (R350)", duration: 115 },
      { name: "Acrylic — French XL–XXL (R400)", duration: 130 },
      { name: "Acrylic — Ombré Short–Medium (R250)", duration: 120 },
      { name: "Acrylic — Ombré Long (R300)", duration: 135 },
      { name: "Acrylic — Ombré XL–XXXL (R350)", duration: 150 },
    ],
  },
  {
    category: "Gel Manicure",
    items: [
      { name: "Gel — Overlay (R200)", duration: 75 },
      { name: "Gel — Plain Short–Medium (R250)", duration: 90 },
      { name: "Gel — Plain Long (R300)", duration: 100 },
      { name: "Gel — French Short–Medium (R300)", duration: 95 },
      { name: "Gel — French Long (R350)", duration: 110 },
    ],
  },
  {
    category: "Pedicure Sets",
    items: [
      { name: "Pedicure — Gel Overlay (R150)", duration: 45 },
      { name: "Pedicure — Gel Full Tips (R200)", duration: 60 },
      { name: "Pedicure — Acrylic Overlay (R180)", duration: 55 },
      { name: "Pedicure — Acrylic Full Tips (R200)", duration: 65 },
      { name: "Pedicure — Acrylic French Tips (R250)", duration: 75 },
    ],
  },
  {
    category: "Eyelash Extensions",
    items: [
      { name: "Lashes — Cluster (R130)", duration: 45 },
      { name: "Lashes — Cateye (R150)", duration: 60 },
      { name: "Lashes — Classic (R180)", duration: 90 },
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
      { name: "Foot Spa — Basic (R200)", duration: 30 },
      { name: "Foot Spa — Luxury (R280)", duration: 45 },
    ],
  },
  {
    category: "Extras — add-on to a service above",
    items: [
      { name: "Extra — Buff & Shine (R150)", duration: 30 },
      { name: "Extra — Fill-in @3 weeks (R180)", duration: 75 },
      { name: "Extra — Nail Repair (R20–R30)", duration: 15 },
      { name: "Extra — Soak Off (R50)", duration: 20 },
      { name: "Extra — Nail Art (R30–R50)", duration: 20 },
      { name: "Extra — Rhinestones (R10–R15)", duration: 10 },
      { name: "Extra — 3D Art (R50–R100)", duration: 30 },
    ],
  },
];

const SERVICE_OPTIONS = SERVICE_CATEGORIES.flatMap(
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

  if (serviceName === "Gel — Overlay (R200)") {
    return false;
  }

  return (
    serviceName.startsWith("Acrylic —") ||
    serviceName.startsWith("Gel —")
  );
}

function timeToMinutes(time) {
  if (!time) return null;

  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    mins
  ).padStart(2, "0")}`;
}

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T12:00:00`);

  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(time) {
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-ZA", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getTodayString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/*
 * Booking date rules
 *
 * 1. Previous dates are not allowed.
 * 2. Sundays are not allowed.
 * 3. Today and future Monday-Saturday dates are allowed.
 */
function isSunday(dateString) {
  if (!dateString) return false;

  const date = new Date(`${dateString}T12:00:00`);

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

function calculateServicesDuration(services) {
  return services.reduce(
    (total, serviceName) => {
      const service = SERVICE_OPTIONS.find(
        (option) => option.name === serviceName
      );

      return total + (service?.duration || 0);
    },
    0
  );
}

const inputClass =
  "w-full px-4 py-3 border border-white/[0.12] rounded-md bg-[#181614] text-[0.92rem] text-[#f4eee6] placeholder:text-[#8f877e] focus:outline-none focus:border-[#d6b36a]/60 focus:ring-1 focus:ring-[#d6b36a]/20 transition-all";

const labelClass =
  "block text-xs font-bold tracking-[0.12em] uppercase mb-2 text-[#c9c0b6]";

export default function Booking() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    clientServices: [[SERVICE_OPTIONS[0].name]],
    clientShapes: [""],
    clients: "1",
    clientDates: [""],
    clientTimes: [""],
    notes: "",
  });

  const [availableTimes, setAvailableTimes] = useState([
    [],
  ]);

  const [loadingAvailability, setLoadingAvailability] =
    useState([false]);

  const [availabilityErrors, setAvailabilityErrors] =
    useState([""]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmedBooking, setConfirmedBooking] =
    useState(null);
  const [confirmingBooking, setConfirmingBooking] =
    useState(false);

  const clientCount = Number(form.clients);
  const todayString = getTodayString();

  const clientDurations = useMemo(
    () =>
      form.clientServices.map(
        calculateServicesDuration
      ),
    [form.clientServices]
  );

  const totalDeposit =
    clientCount * DEPOSIT_PER_CLIENT;

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const shape = params.get("shape");

    if (!shape) return;

    const validShape = NAIL_SHAPES.find(
      (item) => item.name === shape
    );

    if (!validShape) return;

    setForm((current) => ({
      ...current,
      clientShapes: [
        validShape.name,
        ...current.clientShapes.slice(1),
      ],
    }));
  }, []);

  function updateClientServices(
    clientIndex,
    services
  ) {
    setForm((current) => {
      const updated = [
        ...current.clientServices,
      ];

      updated[clientIndex] = services;

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

      updated[clientIndex] = shape;

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
        updated[clientIndex].length >= 4
      ) {
        return current;
      }

      const unused = SERVICE_OPTIONS.find(
        (option) =>
          !updated[clientIndex].includes(
            option.name
          )
      );

      if (!unused) return current;

      updated[clientIndex] = [
        ...updated[clientIndex],
        unused.name,
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
        updated[clientIndex].length <= 1
      ) {
        return current;
      }

      updated[clientIndex] =
        updated[clientIndex].filter(
          (_, index) =>
            index !== serviceIndex
        );

      return {
        ...current,
        clientServices: updated,
      };
    });

    setError("");
  }

  function changeClientCount(value) {
    const nextCount = Number(value);

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

      while (services.length < nextCount) {
        services.push([
          SERVICE_OPTIONS[0].name,
        ]);

        shapes.push("");
        dates.push("");
        times.push("");
      }

      services.length = nextCount;
      shapes.length = nextCount;
      dates.length = nextCount;
      times.length = nextCount;

      return {
        ...current,
        clients: String(nextCount),
        clientServices: services,
        clientShapes: shapes,
        clientDates: dates,
        clientTimes: times,
      };
    });

    setAvailableTimes(
      Array.from(
        { length: nextCount },
        () => []
      )
    );

    setLoadingAvailability(
      Array.from(
        { length: nextCount },
        () => false
      )
    );

    setAvailabilityErrors(
      Array.from(
        { length: nextCount },
        () => ""
      )
    );

    setError("");
  }

  function updateClientDate(
    clientIndex,
    date
  ) {
    /*
     * Explicitly reject dates before today.
     */
    if (date && isPastDate(date)) {
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

        dates[clientIndex] = "";
        times[clientIndex] = "";

        return {
          ...current,
          clientDates: dates,
          clientTimes: times,
        };
      });

      return;
    }

    /*
     * Explicitly reject Sundays.
     */
    if (date && isSunday(date)) {
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

        dates[clientIndex] = "";
        times[clientIndex] = "";

        return {
          ...current,
          clientDates: dates,
          clientTimes: times,
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

      dates[clientIndex] = date;
      times[clientIndex] = "";

      return {
        ...current,
        clientDates: dates,
        clientTimes: times,
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

      times[clientIndex] = time;

      return {
        ...current,
        clientTimes: times,
      };
    });

    setError("");
  }

  /*
   * Availability lookup.
   *
   * Invalid dates are never sent to the API.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      const results = Array.from(
        { length: clientCount },
        () => []
      );

      const loading = Array.from(
        { length: clientCount },
        () => false
      );

      const errors = Array.from(
        { length: clientCount },
        () => ""
      );

      for (
        let clientIndex = 0;
        clientIndex < clientCount;
        clientIndex++
      ) {
        const date =
          form.clientDates[clientIndex];

        const duration =
          clientDurations[clientIndex];

        if (
          !date ||
          !duration ||
          !isBookableDate(date)
        ) {
          continue;
        }

        loading[clientIndex] = true;
      }

      if (!cancelled) {
        setLoadingAvailability(loading);
        setAvailabilityErrors(errors);
      }

      await Promise.all(
        Array.from(
          { length: clientCount },
          async (_, clientIndex) => {
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
              const response = await fetch(
                `/api/availability?date=${encodeURIComponent(
                  date
                )}&duration=${duration}`,
                {
                  cache: "no-store",
                }
              );

              const data =
                await response.json();

              if (!response.ok) {
                throw new Error(
                  data.error ||
                    "Unable to load availability."
                );
              }

              results[clientIndex] =
                data.availableTimes ||
                [];
            } catch (requestError) {
              errors[clientIndex] =
                requestError.message ||
                "Unable to load availability.";
            } finally {
              loading[clientIndex] =
                false;
            }
          }
        )
      );

      if (!cancelled) {
        setAvailableTimes(results);
        setLoadingAvailability(loading);
        setAvailabilityErrors(errors);
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
      availableTimes[clientIndex] || [];

    if (
      clientIndex > 0 &&
      form.clientDates[clientIndex] &&
      form.clientDates[clientIndex - 1] ===
        form.clientDates[clientIndex] &&
      form.clientTimes[clientIndex - 1]
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

      times = times.filter(
        (time) =>
          timeToMinutes(time) >=
          earliestStart
      );
    }

    return times;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!form.name.trim()) {
      setError("Please enter your name.");
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
     * Validate nail shapes.
     */
    for (
      let clientIndex = 0;
      clientIndex < clientCount;
      clientIndex++
    ) {
      const services =
        form.clientServices[
          clientIndex
        ] || [];

      const needsShape = services.some(
        isShapeEligibleService
      );

      if (
        needsShape &&
        !form.clientShapes[
          clientIndex
        ]
      ) {
        setError(
          `Please choose a nail shape for Client ${
            clientIndex + 1
          }.`
        );

        return;
      }
    }

    /*
     * Validate dates and times.
     */
    for (
      let clientIndex = 0;
      clientIndex < clientCount;
      clientIndex++
    ) {
      const date =
        form.clientDates[
          clientIndex
        ];

      if (!date) {
        setError(
          `Please choose a preferred date for Client ${
            clientIndex + 1
          }.`
        );

        return;
      }

      /*
       * Final protection against:
       * - previous dates
       * - Sundays
       */
      if (!isBookableDate(date)) {
        if (isPastDate(date)) {
          setError(
            `Client ${
              clientIndex + 1
            } has selected a previous date. Please choose today or a future date.`
          );
        } else if (isSunday(date)) {
          setError(
            `Client ${
              clientIndex + 1
            } has selected a Sunday. Sundays are unavailable for bookings.`
          );
        } else {
          setError(
            `Please choose a valid booking date for Client ${
              clientIndex + 1
            }.`
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
          `Please choose an available time for Client ${
            clientIndex + 1
          }.`
        );

        return;
      }
    }

    /*
     * Validate the 15-minute same-day gap.
     */
    for (
      let clientIndex = 1;
      clientIndex < clientCount;
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
          previousEnd + CLIENT_GAP
        ) {
          setError(
            `Client ${
              clientIndex + 1
            } needs to start at least 15 minutes after Client ${
              clientIndex
            } finishes when booked on the same date.`
          );

          return;
        }
      }
    }

    setSubmitting(true);

    try {
      const clientEndTimes =
        form.clientTimes.map(
          (startTime, index) =>
            minutesToTime(
              timeToMinutes(startTime) +
                clientDurations[index]
            )
        );

      const response = await fetch(
        "/api/checkout",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
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
            notes: form.notes.trim(),
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

      if (!data.redirectUrl) {
        throw new Error(
          "No payment link was returned."
        );
      }

      window.location.href =
        data.redirectUrl;
    } catch (submitError) {
      setError(
        submitError.message ||
          "Something went wrong. Please try again."
      );

      setSubmitting(false);
    }
  }

  /*
   * Booking confirmation after Yoco payment.
   */
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
      params.get("appointment");

    async function loadConfirmedBooking(
      attempt = 1
    ) {
      const MAX_ATTEMPTS = 8;

      if (attempt === 1) {
        setConfirmingBooking(true);
      }

      try {
        const response = await fetch(
          `/api/booking?id=${encodeURIComponent(
            appointmentId
          )}`,
          {
            cache: "no-store",
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
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

          setConfirmingBooking(false);

          throw new Error(
            data.error ||
              "Unable to load booking."
          );
        }

        setConfirmedBooking(
          data.appointment
        );

        setConfirmingBooking(false);

        window.history.replaceState(
          {},
          "",
          window.location.pathname
        );
      } catch (bookingError) {
        console.error(
          "Confirmation lookup error:",
          bookingError
        );

        setConfirmingBooking(false);
      }
    }

    loadConfirmedBooking();
  }, []);

  /*
   * Confirmation loading state.
   */
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
            Your payment went through —
            just finalising the details.
            This usually takes a few
            seconds.
          </p>
        </div>
      </section>
    );
  }

  /*
   * Confirmed booking state.
   */
  if (confirmedBooking) {
    const whatsappMessage =
      encodeURIComponent(
        `Hi Freddy Nails! 💅 My booking is confirmed.\n\nName: ${confirmedBooking.customerName}\nEmail: ${confirmedBooking.customerEmail}\n\n${
          confirmedBooking.clients
            ? confirmedBooking.clients
                .map(
                  (
                    client,
                    index
                  ) =>
                    `Client ${
                      index + 1
                    }:\nServices: ${
                      client.service
                    }\nDate: ${formatDate(
                      client.bookingDate
                    )}\nTime: ${formatTime(
                      client.startTime
                    )}`
                )
                .join("\n\n")
            : `Services: ${
                confirmedBooking.service
              }\nDate: ${formatDate(
                confirmedBooking.bookingDate
              )}\nTime: ${formatTime(
                confirmedBooking.startTime
              )}`
        }\n\nClients: ${
          confirmedBooking.clientCount
        }\nDeposit: R${
          confirmedBooking.depositAmount
        }`
      );

    return (
      <section
        id="booking"
        className="max-w-[1180px] mx-auto px-5 py-22"
      >
        <div className="max-w-[560px] mx-auto text-center py-8">
          <div className="w-14 h-14 rounded-full bg-gold text-[#11100f] text-2xl font-bold flex items-center justify-center mx-auto mb-5">
            ✓
          </div>

          <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
            Freddy Nails Studio
          </p>

          <h2 className="font-serif font-medium text-[clamp(1.7rem,4vw,2.3rem)] mt-3 mb-2 text-[#f4eee6]">
            Booking confirmed
          </h2>

          <p className="font-serif italic text-lg text-gold-bright mb-4">
            You&apos;re booked! 💅
          </p>

          <p className="text-[#c9c0b6] leading-relaxed">
            Your payment has been
            received and your
            appointment is confirmed.
          </p>

          <p className="text-[#c9c0b6] leading-relaxed mt-2">
            Your R
            {
              confirmedBooking.depositAmount
            }{" "}
            deposit has been received.
          </p>

          <p className="text-[#c9c0b6] leading-relaxed mt-2">
            A confirmation email has
            been sent to{" "}
            <strong className="text-[#f4eee6]">
              {
                confirmedBooking.customerEmail
              }
            </strong>
            .
          </p>

          <p className="text-[#c9c0b6] leading-relaxed mt-2">
            Freddy Nails has also
            received your booking
            notification.
          </p>

          {confirmedBooking.clients &&
            confirmedBooking.clients
              .length > 0 && (
              <div className="space-y-3 my-6 text-left">
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
                      className="border-b border-white/[0.09] py-4 flex flex-col gap-1 text-sm"
                    >
                      <strong className="text-xs uppercase tracking-[0.12em] text-gold">
                        Client{" "}
                        {index + 1}
                      </strong>

                      <span className="text-[#f4eee6]">
                        {
                          client.service
                        }
                      </span>

                      {client.shape && (
                        <span className="text-[#c9c0b6]">
                          Shape:{" "}
                          {
                            client.shape
                          }
                        </span>
                      )}

                      <span className="text-[#c9c0b6]">
                        {formatDate(
                          client.bookingDate
                        )}
                      </span>

                      <span className="text-[#c9c0b6]">
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
            )}

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2.5 bg-gold text-[#11100f] px-7 py-[15px] rounded-sm text-[0.85rem] font-bold uppercase tracking-wide hover:bg-gold-bright transition-colors mt-6"
          >
            Message Freddy Nails on
            WhatsApp
          </a>

          <p className="text-xs text-[#8f877e] mt-5">
            Booking ID:{" "}
            {confirmedBooking.id ||
              "Confirmed"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="booking"
      className="relative max-w-[1180px] mx-auto px-5 py-22"
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
          Choose the services, preferred
          date and available time for each
          client.
        </p>
      </div>

      <div className="max-w-[820px] mx-auto">
        <form onSubmit={handleSubmit}>
          {/* YOUR DETAILS */}

          <div className="pb-8 border-b border-white/[0.09]">
            <div className="flex items-center gap-4 mb-6">
              <p className="text-[0.68rem] font-bold tracking-[0.22em] uppercase text-gold">
                Your details
              </p>

              <div className="h-px flex-1 bg-white/[0.08]" />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label>
                <span className={labelClass}>
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
                  required
                />
              </label>

              <label>
                <span className={labelClass}>
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
                  required
                />
              </label>

              <label>
                <span className={labelClass}>
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
                  required
                />
              </label>

              <label>
                <span className={labelClass}>
                  Number of clients
                </span>

                <select
                  className={inputClass}
                  value={form.clients}
                  onChange={(event) =>
                    changeClientCount(
                      event.target
                        .value
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
                        {index + 1}{" "}
                        {index ===
                        0
                          ? "client"
                          : "clients"}
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>
          </div>

          {/* APPOINTMENT DETAILS */}

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
                    form.clientServices[
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
                      {/* CLIENT HEADING */}

                      <div className="flex justify-between items-start gap-4 mb-5">
                        <div>
                          <span className="block text-xs font-bold uppercase tracking-[0.16em] text-gold mb-1.5">
                            Client{" "}
                            {clientIndex +
                              1}
                          </span>

                          <h3 className="font-serif text-xl font-medium text-[#f4eee6]">
                            Choose
                            services
                            &
                            appointment
                            time
                          </h3>
                        </div>

                        <span className="shrink-0 text-xs font-bold tracking-wide text-[#c9c0b6] border-b border-gold/40 pb-1">
                          {
                            clientDurations[
                              clientIndex
                            ]
                          }{" "}
                          min
                        </span>
                      </div>

                      {/* SERVICES */}

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
                                className={`${inputClass} flex-1`}
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
                                              option.disabled
                                            }
                                          >
                                            {
                                              option.name
                                            }
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
                            className="text-xs font-bold uppercase tracking-wide text-gold hover:text-gold-bright transition-colors"
                            onClick={() =>
                              addService(
                                clientIndex
                              )
                            }
                          >
                            + Add another
                            service
                          </button>
                        )}
                      </div>

                      {/* NAIL SHAPE */}

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
                              Not
                              applicable
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {NAIL_SHAPES.map(
                            (
                              shape
                            ) => {
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
                                  className={`px-3 py-3 rounded-md text-left transition-all ${
                                    selected
                                      ? "bg-gold/10 text-gold border border-gold/60"
                                      : "bg-[#181614] border border-white/[0.09] text-[#f4eee6] hover:border-gold/40"
                                  }`}
                                >
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

                      {/* DATE + TIME */}

                      <div className="grid gap-5 sm:grid-cols-2 mt-7">
                        <label>
                          <span
                            className={
                              labelClass
                            }
                          >
                            Preferred
                            date
                          </span>

                          <input
                            type="date"
                            min={
                              todayString
                            }
                            className={
                              inputClass
                            }
                            value={
                              form
                                .clientDates[
                                clientIndex
                              ] ||
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              updateClientDate(
                                clientIndex,
                                event
                                  .target
                                  .value
                              )
                            }
                            required
                          />

                          <p className="text-[0.68rem] text-[#8f877e] mt-2">
                            Sundays are
                            unavailable.
                          </p>
                        </label>

                        <label>
                          <span
                            className={
                              labelClass
                            }
                          >
                            Available
                            time
                          </span>

                          <select
                            className={
                              inputClass
                            }
                            value={
                              form
                                .clientTimes[
                                clientIndex
                              ] ||
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              updateClientTime(
                                clientIndex,
                                event
                                  .target
                                  .value
                              )
                            }
                            disabled={
                              !form
                                .clientDates[
                                clientIndex
                              ] ||
                              loadingAvailability[
                                clientIndex
                              ]
                            }
                            required
                          >
                            <option value="">
                              {loadingAvailability[
                                clientIndex
                              ]
                                ? "Checking availability..."
                                : !form
                                    .clientDates[
                                    clientIndex
                                  ]
                                ? "Choose a date first"
                                : times.length ===
                                    0
                                  ? "No times available"
                                  : "Choose a time"}
                            </option>

                            {times.map(
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
                        </label>
                      </div>

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

                      {form.clientDates[
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
                            No
                            appointment
                            times are
                            currently
                            available
                            for this
                            date.
                            Please
                            choose
                            another
                            date.
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
                            Same-day
                            clients
                            are
                            automatically
                            scheduled
                            with a
                            15-minute
                            gap
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

          {/* NOTES */}

          <label className="block mt-10 pt-8 border-t border-white/[0.09]">
            <span className={labelClass}>
              Notes
            </span>

            <textarea
              className={`${inputClass} min-h-[100px] resize-y`}
              value={form.notes}
              onChange={(event) =>
                setForm({
                  ...form,
                  notes: event.target
                    .value,
                })
              }
              placeholder="Anything Freddy Nails should know?"
              rows={4}
            />
          </label>

          {/* ERROR */}

          {error && (
            <div className="mt-5 border-l-2 border-red-400 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* SUMMARY */}

          <div className="flex gap-10 border-t border-white/[0.09] pt-6 mt-8">
            <div>
              <span className="block text-xs uppercase tracking-[0.12em] text-[#8f877e] mb-1">
                Clients
              </span>

              <strong className="font-serif text-2xl text-[#f4eee6]">
                {clientCount}
              </strong>
            </div>

            <div>
              <span className="block text-xs uppercase tracking-[0.12em] text-[#8f877e] mb-1">
                Deposit
              </span>

              <strong className="font-serif text-2xl text-gold">
                R{totalDeposit}
              </strong>
            </div>
          </div>

          {/* PAYMENT */}

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2.5 w-full bg-gold text-[#11100f] py-4 rounded-sm font-bold uppercase tracking-wide text-[0.85rem] hover:bg-gold-bright transition-colors disabled:opacity-50 mt-7"
          >
            {submitting
              ? "Preparing secure payment..."
              : `Pay R${totalDeposit} deposit`}
          </button>

          <p className="text-xs text-[#8f877e] text-center mt-3">
            You&apos;ll be securely
            redirected to Yoco to
            complete your deposit
            payment.
          </p>
        </form>
      </div>
    </section>
  );
}
