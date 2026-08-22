"use client";

import { useEffect, useMemo, useState } from "react";

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

const NAIL_SHAPES = [
  { name: "Almond", desc: "Tapered, rounded tip" },
  { name: "Square", desc: "Flat edge, sharp corners" },
  { name: "Squoval", desc: "Square with soft corners" },
  { name: "Oval", desc: "Rounded, classic" },
  { name: "Coffin", desc: "Tapered, squared tip" },
  { name: "Stiletto", desc: "Long, sharp point" },
];

function isNailService(serviceName) {
  if (!serviceName) return false;

  // Gel Overlay does not require a nail shape.
  if (serviceName === "Gel — Overlay (R200)") {
    return false;
  }

  return (
    serviceName.startsWith("Acrylic —") ||
    serviceName.startsWith("Gel —")
  );
}

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Booking() {
  const [clientCount, setClientCount] = useState(1);

  const [form, setForm] = useState({
    clients: [
      {
        name: "",
        email: "",
        phone: "",
        services: [],
        clientShapes: [""],
      },
    ],
    date: "",
    time: "",
  });

  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shape = params.get("shape");

    if (!shape) return;

    const validShape = NAIL_SHAPES.find(
      (item) => item.name === shape
    );

    if (!validShape) return;

    setForm((current) => ({
      ...current,
      clients: current.clients.map((client, index) =>
        index === 0
          ? {
              ...client,
              clientShapes: [
                validShape.name,
                ...client.clientShapes.slice(1),
              ],
            }
          : client
      ),
    }));
  }, []);

  function changeClientCount(count) {
    const nextCount = Math.min(Math.max(count, 1), 4);

    setClientCount(nextCount);

    setForm((current) => {
      const clients = [...current.clients];

      while (clients.length < nextCount) {
        clients.push({
          name: "",
          email: "",
          phone: "",
          services: [],
          clientShapes: [""],
        });
      }

      clients.length = nextCount;

      return {
        ...current,
        clients,
      };
    });
  }

  function updateClient(clientIndex, field, value) {
    setForm((current) => {
      const clients = [...current.clients];

      clients[clientIndex] = {
        ...clients[clientIndex],
        [field]: value,
      };

      return {
        ...current,
        clients,
      };
    });
  }

  function toggleService(clientIndex, service) {
    if (service.disabled) return;

    setForm((current) => {
      const clients = [...current.clients];
      const client = clients[clientIndex];

      const exists = client.services.some(
        (item) => item.name === service.name
      );

      const services = exists
        ? client.services.filter(
            (item) => item.name !== service.name
          )
        : [...client.services, service];

      clients[clientIndex] = {
        ...client,
        services,
      };

      return {
        ...current,
        clients,
      };
    });
  }

  function updateClientShape(clientIndex, shape) {
    setForm((current) => {
      const clients = [...current.clients];

      const client = clients[clientIndex];

      clients[clientIndex] = {
        ...client,
        clientShapes: [shape],
      };

      return {
        ...current,
        clients,
      };
    });
  }

  const totalDuration = useMemo(() => {
    return form.clients.reduce((total, client) => {
      return (
        total +
        client.services.reduce(
          (serviceTotal, service) =>
            serviceTotal + (service.duration || 0),
          0
        )
      );
    }, 0);
  }, [form.clients]);

  const totalPrice = useMemo(() => {
    return form.clients.reduce((total, client) => {
      return (
        total +
        client.services.reduce((serviceTotal, service) => {
          const match = service.name.match(/R(\d+)/);
          return serviceTotal + (match ? Number(match[1]) : 0);
        }, 0)
      );
    }, 0);
  }, [form.clients]);

  const deposit = 90 * clientCount;

  useEffect(() => {
    if (!form.date || totalDuration <= 0) {
      setAvailableSlots([]);
      return;
    }

    async function loadAvailability() {
      setLoadingSlots(true);
      setError("");

      try {
        const response = await fetch(
          `/api/availability?date=${encodeURIComponent(
            form.date
          )}&duration=${totalDuration}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || "Unable to load available times."
          );
        }

        setAvailableSlots(data.slots || []);
      } catch (err) {
        setAvailableSlots([]);
        setError(err.message || "Unable to load available times.");
      } finally {
        setLoadingSlots(false);
      }
    }

    loadAvailability();
  }, [form.date, totalDuration]);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setConfirmedBooking(null);

    for (let clientIndex = 0; clientIndex < form.clients.length; clientIndex++) {
      const client = form.clients[clientIndex];

      if (!client.name.trim()) {
        setError(
          `Please enter the name for Client ${clientIndex + 1}.`
        );
        return;
      }

      if (!client.email.trim()) {
        setError(
          `Please enter the email for Client ${clientIndex + 1}.`
        );
        return;
      }

      if (!client.phone.trim()) {
        setError(
          `Please enter the phone number for Client ${clientIndex + 1}.`
        );
        return;
      }

      if (client.services.length === 0) {
        setError(
          `Please choose at least one service for Client ${
            clientIndex + 1
          }.`
        );
        return;
      }

      const hasNailService = client.services.some(
        (service) => isNailService(service.name)
      );

      if (
        hasNailService &&
        !client.clientShapes?.[0]
      ) {
        setError(
          `Please choose a nail shape for Client ${
            clientIndex + 1
          }.`
        );
        return;
      }
    }

    if (!form.date) {
      setError("Please choose a booking date.");
      return;
    }

    if (!form.time) {
      setError("Please choose an available time.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clients: form.clients,
          clientShapes: form.clients.map(
            (client) => client.clientShapes?.[0] || ""
          ),
          date: form.date,
          time: form.time,
          duration: totalDuration,
          total: totalPrice,
          deposit,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to create booking."
        );
      }

      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      setSuccess(
        "Your booking request has been received."
      );

      setConfirmedBooking(data);
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="booking" className="bg-nude">
      <div className="max-w-[1180px] mx-auto px-5 py-20">
        <div className="max-w-[640px] mb-12">
          <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
            Reserve your appointment
          </p>

          <h2 className="font-serif font-medium text-[clamp(1.9rem,4vw,2.6rem)] mt-3.5">
            Book your nails.
          </h2>

          <p className="mt-3 text-ink-soft leading-relaxed">
            Select your services, choose your preferred shape and
            reserve your time with a R90 deposit per client.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="border border-line bg-white/30 p-5 md:p-7 rounded-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.18em] font-bold text-gold">
                  Number of clients
                </p>

                <p className="font-serif text-xl mt-1">
                  {clientCount}{" "}
                  {clientCount === 1 ? "client" : "clients"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((number) => (
                  <button
                    key={number}
                    type="button"
                    onClick={() =>
                      changeClientCount(number)
                    }
                    className={`w-10 h-10 rounded-sm border text-sm font-bold transition-colors ${
                      clientCount === number
                        ? "bg-ink text-nude border-ink"
                        : "border-line hover:border-gold"
                    }`}
                  >
                    {number}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {form.clients.map((client, clientIndex) => {
            const hasNailService = client.services.some(
              (service) =>
                isNailService(service.name)
            );

            return (
              <div
                key={clientIndex}
                className="border border-line bg-white/30 p-5 md:p-7 rounded-sm"
              >
                <div className="mb-6">
                  <p className="text-[0.68rem] uppercase tracking-[0.18em] font-bold text-gold">
                    Client {clientIndex + 1}
                  </p>

                  <h3 className="font-serif text-2xl mt-1">
                    Appointment details
                  </h3>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-7">
                  <input
                    type="text"
                    placeholder="Full name"
                    value={client.name}
                    onChange={(e) =>
                      updateClient(
                        clientIndex,
                        "name",
                        e.target.value
                      )
                    }
                    className="w-full border border-line bg-white px-4 py-3 rounded-sm outline-none focus:border-gold"
                  />

                  <input
                    type="email"
                    placeholder="Email address"
                    value={client.email}
                    onChange={(e) =>
                      updateClient(
                        clientIndex,
                        "email",
                        e.target.value
                      )
                    }
                    className="w-full border border-line bg-white px-4 py-3 rounded-sm outline-none focus:border-gold"
                  />

                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={client.phone}
                    onChange={(e) =>
                      updateClient(
                        clientIndex,
                        "phone",
                        e.target.value
                      )
                    }
                    className="w-full border border-line bg-white px-4 py-3 rounded-sm outline-none focus:border-gold"
                  />
                </div>

                <div className="mb-7">
                  <p className="text-[0.72rem] uppercase tracking-[0.18em] font-bold text-gold mb-4">
                    Choose your service
                  </p>

                  <div className="space-y-5">
                    {SERVICE_CATEGORIES.map(
                      (category) => (
                        <div key={category.category}>
                          <p className="font-serif text-lg mb-2">
                            {category.category}
                          </p>

                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {category.items.map(
                              (service) => {
                                const selected =
                                  client.services.some(
                                    (item) =>
                                      item.name ===
                                      service.name
                                  );

                                return (
                                  <button
                                    key={service.name}
                                    type="button"
                                    disabled={
                                      service.disabled
                                    }
                                    onClick={() =>
                                      toggleService(
                                        clientIndex,
                                        service
                                      )
                                    }
                                    className={`text-left border px-3.5 py-3 rounded-sm transition-all ${
                                      service.disabled
                                        ? "opacity-40 cursor-not-allowed"
                                        : selected
                                        ? "border-gold bg-gold/10"
                                        : "border-line bg-white hover:border-gold"
                                    }`}
                                  >
                                    <span className="block text-[0.8rem] font-bold">
                                      {service.name}
                                    </span>

                                    <span className="block text-[0.68rem] text-ink-soft mt-1">
                                      {service.disabled
                                        ? "Coming soon"
                                        : `${service.duration} min`}
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
                </div>

                <div
                  className={`border border-line rounded-sm p-5 transition-all duration-300 ${
                    hasNailService
                      ? "bg-white/40"
                      : "opacity-35 grayscale pointer-events-none select-none"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="text-[0.72rem] uppercase tracking-[0.18em] font-bold text-gold">
                        Nail shape
                      </p>

                      <p className="text-sm text-ink-soft mt-1">
                        {hasNailService
                          ? "Choose the shape you want."
                          : "Available for nail services only."}
                      </p>
                    </div>

                    {!hasNailService && (
                      <span className="text-[0.62rem] uppercase tracking-[0.16em] font-bold">
                        Not applicable
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {NAIL_SHAPES.map((shape) => {
                      const selected =
                        client.clientShapes?.[0] ===
                        shape.name;

                      return (
                        <button
                          key={shape.name}
                          type="button"
                          onClick={() =>
                            updateClientShape(
                              clientIndex,
                              shape.name
                            )
                          }
                          className={`border px-3 py-3 rounded-sm text-center transition-all ${
                            selected
                              ? "border-gold bg-gold/10"
                              : "border-line bg-white hover:border-gold"
                          }`}
                        >
                          <span className="block text-[0.78rem] font-bold">
                            {shape.name}
                          </span>

                          <span className="block text-[0.65rem] text-ink-soft mt-1">
                            {shape.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="border border-line bg-white/30 p-5 md:p-7 rounded-sm">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[0.72rem] uppercase tracking-[0.18em] font-bold text-gold mb-2">
                  Choose date
                </label>

                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      date: e.target.value,
                      time: "",
                    }))
                  }
                  min={
                    new Date()
                      .toISOString()
                      .split("T")[0]
                  }
                  className="w-full border border-line bg-white px-4 py-3 rounded-sm outline-none focus:border-gold"
                />

                {form.date && (
                  <p className="text-xs text-ink-soft mt-2">
                    {formatDate(form.date)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[0.72rem] uppercase tracking-[0.18em] font-bold text-gold mb-2">
                  Available time
                </label>

                {!form.date ? (
                  <p className="border border-line bg-white px-4 py-3 text-sm text-ink-soft">
                    Choose a date first.
                  </p>
                ) : loadingSlots ? (
                  <p className="border border-line bg-white px-4 py-3 text-sm text-ink-soft">
                    Checking availability...
                  </p>
                ) : availableSlots.length === 0 ? (
                  <p className="border border-line bg-white px-4 py-3 text-sm text-ink-soft">
                    No available times for this date.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableSlots.map((slot) => {
                      const value =
                        typeof slot === "string"
                          ? slot
                          : slot.time;

                      const available =
                        typeof slot === "string"
                          ? true
                          : slot.available !== false;

                      return (
                        <button
                          key={value}
                          type="button"
                          disabled={!available}
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              time: value,
                            }))
                          }
                          className={`border px-3 py-3 rounded-sm text-sm font-bold transition-colors ${
                            !available
                              ? "opacity-30 cursor-not-allowed"
                              : form.time === value
                              ? "bg-ink text-nude border-ink"
                              : "border-line bg-white hover:border-gold"
                          }`}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border border-ink bg-ink text-nude p-6 md:p-8 rounded-sm">
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.18em] text-gold-bright font-bold">
                  Services
                </p>
                <p className="font-serif text-2xl mt-1">
                  R{totalPrice}
                </p>
              </div>

              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.18em] text-gold-bright font-bold">
                  Deposit
                </p>
                <p className="font-serif text-2xl mt-1">
                  R{deposit}
                </p>
              </div>

              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.18em] text-gold-bright font-bold">
                  Duration
                </p>
                <p className="font-serif text-2xl mt-1">
                  {totalDuration} min
                </p>
              </div>
            </div>

            <p className="text-xs text-[#A79A87] mt-6 leading-relaxed">
              Your R90 deposit per client is used to secure the
              appointment. The remaining balance is payable
              according to Freddy Nails booking terms.
            </p>
          </div>

          {error && (
            <div className="border border-red-300 bg-red-50 text-red-800 px-4 py-3 rounded-sm text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="border border-green-300 bg-green-50 text-green-800 px-4 py-3 rounded-sm text-sm">
              {success}
            </div>
          )}

          {confirmedBooking && (
            <div className="border border-gold bg-white p-5 rounded-sm">
              <p className="text-[0.68rem] uppercase tracking-[0.18em] font-bold text-gold">
                Booking received
              </p>

              <p className="font-serif text-xl mt-1">
                Thank you for booking with Freddy Nails.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center justify-center bg-ink text-nude border border-ink px-8 py-4 rounded-sm text-[0.8rem] font-bold uppercase tracking-[0.12em] hover:bg-gold hover:border-gold hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? "Processing..."
              : `Continue to deposit — R${deposit}`}
          </button>
        </form>
      </div>
    </section>
  );
}
