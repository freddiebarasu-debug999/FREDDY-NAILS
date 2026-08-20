"use client";

import { useEffect, useMemo, useState } from "react";

const DEPOSIT_PER_CLIENT = 90;
const CLIENT_GAP = 15;
const MAX_CLIENTS = 4;
const WHATSAPP_NUMBER = "27710888897";

const SERVICE_OPTIONS = [
  { name: "Acrylic Manicure — Plain", duration: 90 },
  { name: "Acrylic Manicure — French", duration: 90 },
  { name: "Acrylic Manicure — Ombré", duration: 150 },
  { name: "Gel Manicure — Overlay", duration: 90 },
  { name: "Gel Manicure — Plain", duration: 90 },
  { name: "Gel Manicure — French", duration: 90 },
  { name: "Pedicure Set — Gel", duration: 45 },
  { name: "Pedicure Set — Acrylic", duration: 45 },
  { name: "Fill-in", duration: 90 },
  { name: "Nail Art / Rhinestones / 3D Art", duration: 150 },
  { name: "Repair / Soak Off", duration: 30 },
];

function timeToMinutes(time) {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
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
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateServicesDuration(services) {
  return services.reduce((total, serviceName) => {
    const service = SERVICE_OPTIONS.find(
      (option) => option.name === serviceName
    );
    return total + (service?.duration || 0);
  }, 0);
}

const inputClass =
  "w-full px-3.5 py-3 border border-line rounded-sm bg-nude text-[0.92rem] text-ink";

const labelClass =
  "block text-xs font-bold tracking-wide uppercase mb-1.5 text-ink-soft";

export default function Booking() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    clientServices: [[SERVICE_OPTIONS[0].name]],
    clients: "1",
    clientDates: [""],
    clientTimes: [""],
    notes: "",
  });

  const [availableTimes, setAvailableTimes] = useState([[]]);
  const [loadingAvailability, setLoadingAvailability] = useState([false]);
  const [availabilityErrors, setAvailabilityErrors] = useState([""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const clientCount = Number(form.clients);
  const todayString = getTodayString();

  const clientDurations = useMemo(
    () => form.clientServices.map(calculateServicesDuration),
    [form.clientServices]
  );

  const totalDeposit = clientCount * DEPOSIT_PER_CLIENT;

  function updateClientServices(clientIndex, services) {
    setForm((current) => {
      const updated = [...current.clientServices];
      updated[clientIndex] = services;
      return { ...current, clientServices: updated };
    });
    setError("");
  }

  function addService(clientIndex) {
    setForm((current) => {
      const updated = [...current.clientServices];
      if (updated[clientIndex].length >= 4) return current;

      const unused = SERVICE_OPTIONS.find(
        (option) => !updated[clientIndex].includes(option.name)
      );
      if (!unused) return current;

      updated[clientIndex] = [...updated[clientIndex], unused.name];
      return { ...current, clientServices: updated };
    });
    setError("");
  }

  function removeService(clientIndex, serviceIndex) {
    setForm((current) => {
      const updated = [...current.clientServices];
      if (updated[clientIndex].length <= 1) return current;

      updated[clientIndex] = updated[clientIndex].filter(
        (_, index) => index !== serviceIndex
      );
      return { ...current, clientServices: updated };
    });
    setError("");
  }

  function changeClientCount(value) {
    const nextCount = Number(value);

    setForm((current) => {
      const services = [...current.clientServices];
      const dates = [...current.clientDates];
      const times = [...current.clientTimes];

      while (services.length < nextCount) {
        services.push([SERVICE_OPTIONS[0].name]);
        dates.push("");
        times.push("");
      }

      services.length = nextCount;
      dates.length = nextCount;
      times.length = nextCount;

      return {
        ...current,
        clients: String(nextCount),
        clientServices: services,
        clientDates: dates,
        clientTimes: times,
      };
    });

    setAvailableTimes(Array.from({ length: nextCount }, () => []));
    setLoadingAvailability(Array.from({ length: nextCount }, () => false));
    setAvailabilityErrors(Array.from({ length: nextCount }, () => ""));
    setError("");
  }

  function updateClientDate(clientIndex, date) {
    setForm((current) => {
      const dates = [...current.clientDates];
      const times = [...current.clientTimes];
      dates[clientIndex] = date;
      times[clientIndex] = "";
      return { ...current, clientDates: dates, clientTimes: times };
    });
    setError("");
  }

  function updateClientTime(clientIndex, time) {
    setForm((current) => {
      const times = [...current.clientTimes];
      times[clientIndex] = time;
      return { ...current, clientTimes: times };
    });
    setError("");
  }

  // Fetch availability independently for every client's chosen date.
  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      const results = Array.from({ length: clientCount }, () => []);
      const loading = Array.from({ length: clientCount }, () => false);
      const errors = Array.from({ length: clientCount }, () => "");

      for (let clientIndex = 0; clientIndex < clientCount; clientIndex++) {
        const date = form.clientDates[clientIndex];
        const duration = clientDurations[clientIndex];
        if (!date || !duration) continue;
        loading[clientIndex] = true;
      }

      if (!cancelled) {
        setLoadingAvailability(loading);
        setAvailabilityErrors(errors);
      }

      await Promise.all(
        Array.from({ length: clientCount }, async (_, clientIndex) => {
          const date = form.clientDates[clientIndex];
          const duration = clientDurations[clientIndex];
          if (!date || !duration) return;

          try {
            const response = await fetch(
              `/api/availability?date=${encodeURIComponent(
                date
              )}&duration=${duration}`,
              { cache: "no-store" }
            );
            const data = await response.json();
            if (!response.ok) {
              throw new Error(
                data.error || "Unable to load availability."
              );
            }
            results[clientIndex] = data.availableTimes || [];
          } catch (requestError) {
            errors[clientIndex] =
              requestError.message || "Unable to load availability.";
          } finally {
            loading[clientIndex] = false;
          }
        })
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
  }, [clientCount, form.clientDates, clientDurations]);

  function getClientAvailableTimes(clientIndex) {
    let times = availableTimes[clientIndex] || [];

    // If this client and the previous client have the same date,
    // enforce the 15-minute gap.
    if (
      clientIndex > 0 &&
      form.clientDates[clientIndex] &&
      form.clientDates[clientIndex - 1] === form.clientDates[clientIndex] &&
      form.clientTimes[clientIndex - 1]
    ) {
      const previousStart = timeToMinutes(form.clientTimes[clientIndex - 1]);
      const previousDuration = clientDurations[clientIndex - 1];
      const earliestStart = previousStart + previousDuration + CLIENT_GAP;

      times = times.filter((time) => timeToMinutes(time) >= earliestStart);
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
      setError("Please enter your phone number.");
      return;
    }
    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    for (let clientIndex = 0; clientIndex < clientCount; clientIndex++) {
      if (!form.clientDates[clientIndex]) {
        setError(
          `Please choose a preferred date for Client ${clientIndex + 1}.`
        );
        return;
      }
      if (!form.clientTimes[clientIndex]) {
        setError(
          `Please choose an available time for Client ${clientIndex + 1}.`
        );
        return;
      }
    }

    // Make sure same-day clients are scheduled with the required gap.
    for (let clientIndex = 1; clientIndex < clientCount; clientIndex++) {
      if (form.clientDates[clientIndex] === form.clientDates[clientIndex - 1]) {
        const previousStart = timeToMinutes(form.clientTimes[clientIndex - 1]);
        const previousEnd = previousStart + clientDurations[clientIndex - 1];
        const currentStart = timeToMinutes(form.clientTimes[clientIndex]);

        if (currentStart < previousEnd + CLIENT_GAP) {
          setError(
            `Client ${clientIndex + 1} needs to start at least 15 minutes after Client ${clientIndex} finishes when booked on the same date.`
          );
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      const clientEndTimes = form.clientTimes.map((startTime, index) =>
        minutesToTime(timeToMinutes(startTime) + clientDurations[index])
      );

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          clientServices: form.clientServices,
          clientCount,
          clientDates: form.clientDates,
          clientStartTimes: form.clientTimes,
          clientEndTimes,
          notes: form.notes.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to start checkout.");
      }
      if (!data.redirectUrl) {
        throw new Error("No payment link was returned.");
      }

      window.location.href = data.redirectUrl;
    } catch (submitError) {
      setError(
        submitError.message || "Something went wrong. Please try again."
      );
      setSubmitting(false);
    }
  }

  // Check for a successful booking after returning from Yoco.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("booking") !== "success" || !params.get("appointment")) {
      return;
    }

    const appointmentId = params.get("appointment");

    async function loadConfirmedBooking() {
      try {
        const response = await fetch(
          `/api/booking?id=${encodeURIComponent(appointmentId)}`,
          { cache: "no-store" }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load booking.");
        }

        setConfirmedBooking(data.appointment);
        window.history.replaceState({}, "", window.location.pathname);
      } catch (bookingError) {
        console.error("Confirmation lookup error:", bookingError);
      }
    }

    loadConfirmedBooking();
  }, []);

  if (confirmedBooking) {
    const whatsappMessage = encodeURIComponent(
      `Hi Freddy Nails! 💅 My booking is confirmed.\n\nName: ${confirmedBooking.customerName}\nEmail: ${confirmedBooking.customerEmail}\n\n${
        confirmedBooking.clients
          ? confirmedBooking.clients
              .map(
                (client, index) =>
                  `Client ${index + 1}:\nServices: ${client.service}\nDate: ${formatDate(
                    client.bookingDate
                  )}\nTime: ${formatTime(client.startTime)}`
              )
              .join("\n\n")
          : `Services: ${confirmedBooking.service}\nDate: ${formatDate(
              confirmedBooking.bookingDate
            )}\nTime: ${formatTime(confirmedBooking.startTime)}`
      }\n\nClients: ${confirmedBooking.clientCount}\nDeposit: R${confirmedBooking.depositAmount}`
    );

    return (
      <section id="booking" className="max-w-[1180px] mx-auto px-5 py-22">
        <div className="max-w-[560px] mx-auto text-center bg-nude-deep border border-line rounded p-9 md:p-13">
          <div className="w-14 h-14 rounded-full bg-gold text-ink text-2xl font-bold flex items-center justify-center mx-auto mb-5">
            ✓
          </div>

          <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
            Freddy Nails Studio
          </p>

          <h2 className="font-serif font-medium text-[clamp(1.7rem,4vw,2.3rem)] mt-3 mb-2">
            Booking confirmed
          </h2>

          <p className="font-serif italic text-lg text-gold-bright mb-4">
            You&apos;re booked! 💅
          </p>

          <p className="text-ink-soft leading-relaxed">
            Your payment has been received and your appointment is confirmed.
          </p>

          <p className="text-ink-soft leading-relaxed mt-2">
            Your R{confirmedBooking.depositAmount} deposit has been received.
          </p>

          <p className="text-ink-soft leading-relaxed mt-2">
            A confirmation email has been sent to{" "}
            <strong className="text-ink">
              {confirmedBooking.customerEmail}
            </strong>
            .
          </p>

          <p className="text-ink-soft leading-relaxed mt-2">
            Freddy Nails has also received your booking notification.
          </p>

          {confirmedBooking.clients && confirmedBooking.clients.length > 0 && (
            <div className="space-y-3 my-6 text-left">
              {confirmedBooking.clients.map((client, index) => (
                <div
                  key={client.id || index}
                  className="border border-line bg-nude rounded-sm p-4 flex flex-col gap-1 text-sm"
                >
                  <strong className="text-xs uppercase tracking-wide text-gold">
                    Client {index + 1}
                  </strong>
                  <span>{client.service}</span>
                  <span>{formatDate(client.bookingDate)}</span>
                  <span>
                    {formatTime(client.startTime)} –{" "}
                    {formatTime(client.endTime)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2.5 bg-ink text-nude px-7 py-[15px] rounded-sm text-[0.85rem] font-bold uppercase tracking-wide hover:bg-gold hover:text-ink transition-colors mt-6"
          >
            Message Freddy Nails on WhatsApp
          </a>

          <p className="text-xs text-ink-soft mt-5">
            Booking ID: {confirmedBooking.id || "Confirmed"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="booking" className="max-w-[1180px] mx-auto px-5 py-22">
      <div className="max-w-[820px] mx-auto bg-nude-deep border border-line rounded p-7 md:p-13">
        <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
          Book your appointment
        </p>

        <h2 className="font-serif font-medium text-[clamp(1.9rem,4vw,2.6rem)] mt-3.5 mb-4">
          Reserve your nail appointment
        </h2>

        <p className="text-ink-soft leading-relaxed text-[0.94rem] mb-8">
          Choose the services, preferred date and available time for each
          client.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2 mb-4.5">
            <label>
              <span className={labelClass}>Full name</span>
              <input
                type="text"
                className={inputClass}
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="Your full name"
                required
              />
            </label>

            <label>
              <span className={labelClass}>Phone number</span>
              <input
                type="tel"
                className={inputClass}
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
                placeholder="e.g. 071 234 5678"
                required
              />
            </label>

            <label>
              <span className={labelClass}>Email address</span>
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              <span className={labelClass}>Number of clients</span>
              <select
                className={inputClass}
                value={form.clients}
                onChange={(event) => changeClientCount(event.target.value)}
              >
                {Array.from({ length: MAX_CLIENTS }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {index + 1} {index === 0 ? "client" : "clients"}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-5 mt-2">
            {Array.from({ length: clientCount }, (_, clientIndex) => {
              const services = form.clientServices[clientIndex] || [];
              const times = getClientAvailableTimes(clientIndex);

              return (
                <div
                  key={clientIndex}
                  className="border border-line bg-nude rounded-sm p-5"
                >
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wide text-gold mb-1">
                        Client {clientIndex + 1}
                      </span>
                      <h3 className="font-serif text-lg font-medium">
                        Choose services & appointment time
                      </h3>
                    </div>

                    <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-ink-soft bg-nude-deep border border-line px-2.5 py-1 rounded-sm">
                      {clientDurations[clientIndex]} min
                    </span>
                  </div>

                  <div className="space-y-2.5 mb-4">
                    {services.map((serviceName, serviceIndex) => (
                      <div
                        key={`${clientIndex}-${serviceIndex}`}
                        className="flex gap-2 items-center"
                      >
                        <select
                          className={`${inputClass} flex-1`}
                          value={serviceName}
                          onChange={(event) => {
                            const updated = [...services];
                            updated[serviceIndex] = event.target.value;
                            updateClientServices(clientIndex, updated);
                          }}
                        >
                          {SERVICE_OPTIONS.map((option) => (
                            <option key={option.name} value={option.name}>
                              {option.name}
                            </option>
                          ))}
                        </select>

                        {services.length > 1 && (
                          <button
                            type="button"
                            className="shrink-0 text-xs font-bold uppercase text-red-600 hover:text-red-700 px-2 py-1"
                            onClick={() =>
                              removeService(clientIndex, serviceIndex)
                            }
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}

                    {services.length < 4 && (
                      <button
                        type="button"
                        className="text-xs font-bold uppercase tracking-wide text-gold hover:text-gold-bright underline underline-offset-2"
                        onClick={() => addService(clientIndex)}
                      >
                        + Add another service
                      </button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label>
                      <span className={labelClass}>Preferred date</span>
                      <input
                        type="date"
                        min={todayString}
                        className={inputClass}
                        value={form.clientDates[clientIndex] || ""}
                        onChange={(event) =>
                          updateClientDate(clientIndex, event.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      <span className={labelClass}>Available time</span>
                      <select
                        className={inputClass}
                        value={form.clientTimes[clientIndex] || ""}
                        onChange={(event) =>
                          updateClientTime(clientIndex, event.target.value)
                        }
                        disabled={
                          !form.clientDates[clientIndex] ||
                          loadingAvailability[clientIndex]
                        }
                        required
                      >
                        <option value="">
                          {loadingAvailability[clientIndex]
                            ? "Checking availability..."
                            : !form.clientDates[clientIndex]
                            ? "Choose a date first"
                            : times.length === 0
                            ? "No times available"
                            : "Choose a time"}
                        </option>

                        {times.map((time) => (
                          <option key={time} value={time}>
                            {formatTime(time)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {availabilityErrors[clientIndex] && (
                    <div className="mt-3 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {availabilityErrors[clientIndex]}
                    </div>
                  )}

                  {form.clientDates[clientIndex] &&
                    times.length === 0 &&
                    !loadingAvailability[clientIndex] &&
                    !availabilityErrors[clientIndex] && (
                      <p className="text-xs text-ink-soft italic mt-2">
                        No appointment times are currently available for this
                        date. Please choose another date.
                      </p>
                    )}

                  {clientIndex > 0 &&
                    form.clientDates[clientIndex] ===
                      form.clientDates[clientIndex - 1] &&
                    form.clientTimes[clientIndex - 1] && (
                      <p className="text-xs text-ink-soft italic mt-2">
                        Same-day clients are automatically scheduled with a
                        15-minute gap between appointments.
                      </p>
                    )}
                </div>
              );
            })}
          </div>

          <label className="block mt-6">
            <span className={labelClass}>Notes</span>
            <textarea
              className={`${inputClass} min-h-[80px] resize-y`}
              value={form.notes}
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
              placeholder="Anything Freddy Nails should know?"
              rows={4}
            />
          </label>

          {error && (
            <div className="mt-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-8 border-t border-line pt-5 mt-7">
            <div>
              <span className="block text-xs uppercase tracking-wide text-ink-soft mb-1">
                Clients
              </span>
              <strong className="font-serif text-2xl">{clientCount}</strong>
            </div>

            <div>
              <span className="block text-xs uppercase tracking-wide text-ink-soft mb-1">
                Deposit
              </span>
              <strong className="font-serif text-2xl text-gold">
                R{totalDeposit}
              </strong>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2.5 w-full bg-ink text-nude py-4 rounded-sm font-bold uppercase tracking-wide text-[0.85rem] hover:bg-gold hover:text-ink transition-colors disabled:opacity-50 mt-6"
          >
            {submitting
              ? "Preparing secure payment..."
              : `Pay R${totalDeposit} deposit`}
          </button>

          <p className="text-xs text-ink-soft text-center mt-3">
            You&apos;ll be securely redirected to Yoco to complete your
            deposit payment.
          </p>
        </form>
      </div>
    </section>
  );
}
