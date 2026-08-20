"use client";
import { useEffect, useMemo, useState } from "react";
const SERVICE_OPTIONS = [
  {
    name: "Acrylic Manicure — Plain",
    duration: 90,
  },
  {
    name: "Acrylic Manicure — French",
    duration: 90,
  },
  {
    name: "Acrylic Manicure — Ombré",
    duration: 150,
  },
  {
    name: "Gel Manicure — Overlay",
    duration: 90,
  },
  {
    name: "Gel Manicure — Plain",
    duration: 90,
  },
  {
    name: "Gel Manicure — French",
    duration: 90,
  },
  {
    name: "Pedicure Set — Gel",
    duration: 45,
  },
  {
    name: "Pedicure Set — Acrylic",
    duration: 45,
  },
  {
    name: "Fill-in",
    duration: 90,
  },
  {
    name: "Nail Art / Rhinestones / 3D Art",
    duration: 150,
  },
  {
    name: "Repair / Soak Off",
    duration: 30,
  },
];
const DEPOSIT_PER_CLIENT = 90;
const CLIENT_GAP = 15;
const WHATSAPP_NUMBER = "27710888897";
function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins} minutes`;
  }
  if (mins === 0) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return `${hours}h ${mins}min`;
}
function calculateEndTime(startTime, durationMinutes) {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes =
    hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, "0")}:${String(
    endMinutes
  ).padStart(2, "0")}`;
}
function formatBookingDate(dateString) {
  if (!dateString) return "";
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function formatBookingTime(timeString) {
  if (!timeString) return "";
  const [hours, minutes] = timeString
    .slice(0, 5)
    .split(":")
    .map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString("en-ZA", {
    hour: "numeric",
    minute: "2-digit",
  });
}
function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(
    2,
    "0"
  );
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
export default function Booking() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    services: [SERVICE_OPTIONS[0].name],
    clients: "1",
    date: "",
    time: "",
    notes: "",
  });
  const [availableTimes, setAvailableTimes] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] =
    useState(false);
  const [availabilityError, setAvailabilityError] =
    useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingSuccess, setBookingSuccess] =
    useState(false);
  const [confirmedBooking, setConfirmedBooking] =
    useState(null);
  const [confirmationLoading, setConfirmationLoading] =
    useState(false);
  const [confirmationError, setConfirmationError] =
    useState("");
  const update = (field) => (e) =>
    setForm((current) => ({
      ...current,
      [field]: e.target.value,
    }));
  const todayDate = getTodayDate();
  const selectedServices = useMemo(
    () =>
      form.services
        .map((serviceName) =>
          SERVICE_OPTIONS.find(
            (service) => service.name === serviceName
          )
        )
        .filter(Boolean),
    [form.services]
  );
  const servicesDuration = selectedServices.reduce(
    (total, service) => total + service.duration,
    0
  );
  const clientCount = Math.max(
    1,
    Number(form.clients) || 1
  );
  const totalDuration =
    servicesDuration * clientCount +
    CLIENT_GAP * Math.max(0, clientCount - 1);
  const depositAmount =
    DEPOSIT_PER_CLIENT * clientCount;
  function updateService(index, value) {
    setForm((current) => {
      const services = [...current.services];
      services[index] = value;
      return {
        ...current,
        services,
        time: "",
      };
    });
  }
  function addService() {
    if (form.services.length >= 4) return;
    const nextAvailableService = SERVICE_OPTIONS.find(
      (service) => !form.services.includes(service.name)
    );
    if (!nextAvailableService) return;
    setForm((current) => ({
      ...current,
      services: [
        ...current.services,
        nextAvailableService.name,
      ],
      time: "",
    }));
  }
  function removeService(index) {
    if (form.services.length === 1) return;
    setForm((current) => ({
      ...current,
      services: current.services.filter(
        (_, serviceIndex) => serviceIndex !== index
      ),
      time: "",
    }));
  }
  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );
    const bookingStatus = params.get("booking");
    const appointmentId = params.get("appointment");
    if (
      bookingStatus === "success" &&
      appointmentId
    ) {
      setBookingSuccess(true);
      setConfirmationLoading(true);
      setConfirmationError("");
      async function loadConfirmedBooking() {
        try {
          const response = await fetch(
            `/api/booking?id=${encodeURIComponent(
              appointmentId
            )}`
          );
          const data = await response.json();
          if (!response.ok) {
            throw new Error(
              data.error ||
                "Unable to load your booking details."
            );
          }
          setConfirmedBooking({
            appointmentId,
            ...data.appointment,
          });
        } catch (error) {
          console.error(
            "Confirmation booking error:",
            error
          );
          setConfirmationError(
            "Your payment was successful, but we couldn't load the booking details. Please contact Freddy Nails on WhatsApp."
          );
        } finally {
          setConfirmationLoading(false);
        }
      }
      loadConfirmedBooking();
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }
  }, []);
  useEffect(() => {
    setForm((current) => ({
      ...current,
      time: "",
    }));
    if (!form.date) {
      setAvailableTimes([]);
      setAvailabilityError("");
      return;
    }
    let cancelled = false;
    async function loadAvailability() {
      setAvailabilityLoading(true);
      setAvailabilityError("");
      try {
        const response = await fetch(
          `/api/availability?date=${encodeURIComponent(
            form.date
          )}&duration=${totalDuration}`
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to check availability."
          );
        }
        if (!cancelled) {
          setAvailableTimes(
            data.availableTimes || []
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Availability error:",
            error
          );
          setAvailableTimes([]);
          setAvailabilityError(
            "Unable to load available times. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setAvailabilityLoading(false);
        }
      }
    }
    loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [form.date, totalDuration]);
  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    if (form.services.length === 0) {
      setError(
        "Please choose at least one service."
      );
      return;
    }
    if (!form.time) {
      setError(
        "Please choose an available appointment time."
      );
      return;
    }
    if (!form.email) {
      setError(
        "Please enter your email address so we can send your confirmation."
      );
      return;
    }
    setLoading(true);
    setError("");
    try {
      const endTime = calculateEndTime(
        form.time,
        totalDuration
      );
      const serviceSummary =
        form.services.join(" + ");
      const response = await fetch(
        "/api/checkout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name,
            phone: form.phone,
            email: form.email,
            service: serviceSummary,
            services: form.services,
            clientCount,
            date: form.date,
            startTime: form.time,
            endTime,
            durationMinutes: totalDuration,
            notes: form.notes,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to start the payment."
        );
      }
      if (!data.redirectUrl) {
        throw new Error(
          "Yoco did not return a checkout link."
        );
      }
      window.location.href = data.redirectUrl;
    } catch (error) {
      console.error(
        "Payment error:",
        error
      );
      setError(
        error.message ||
          "Something went wrong. Please try again."
      );
      setLoading(false);
    }
  }
  const inputClass =
    "w-full px-3.5 py-3 border border-line rounded-sm bg-nude text-[0.92rem] text-ink mb-4.5";
  const labelClass =
    "block text-xs font-bold tracking-wide uppercase mb-1.5 text-ink-soft";
  if (bookingSuccess) {
    const whatsappMessage = confirmedBooking
      ? encodeURIComponent(
          `Hi Freddy Nails! 💅 My booking is confirmed.\n\nName: ${confirmedBooking.customerName}\nEmail: ${confirmedBooking.customerEmail}\nService: ${confirmedBooking.service}\nDate: ${formatBookingDate(confirmedBooking.bookingDate)}\nTime: ${formatBookingTime(confirmedBooking.startTime)}\nClients: ${confirmedBooking.clientCount}\nDeposit: R${confirmedBooking.depositAmount}`
        )
      : "";
    return (
      <section
        id="booking"
        className="max-w-[1180px] mx-auto px-5 py-22"
      >
        <div className="max-w-[720px] mx-auto">
          <div className="bg-nude-deep border border-line rounded p-7 md:p-13 text-center">
            <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
              Booking confirmed
            </p>
            <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-ink text-2xl text-white">
              ✓
            </div>
            <h2 className="font-serif font-medium text-[clamp(2rem,4vw,3rem)] mt-6">
              You're booked! 💅
            </h2>
            <p className="text-ink-soft leading-relaxed mt-4 max-w-[52ch] mx-auto">
              Your payment has been received and your
              appointment is confirmed.
            </p>
            <div className="mt-8 border border-line bg-nude p-5 rounded-sm text-left">
              <p className="text-xs font-bold uppercase tracking-wide text-gold">
                What happens next
              </p>
              <div className="mt-4 space-y-3 text-sm text-ink-soft">
                <p>
                  ✓ Your R90-per-client deposit has been
                  received.
                </p>
                <p>
                  ✓ A confirmation email has been sent
                  to you.
                </p>
                <p>
                  ✓ Freddy Nails has also received your
                  booking notification.
                </p>
              </div>
            </div>
            {confirmationLoading && (
              <p className="mt-6 text-sm text-ink-soft">
                Loading your booking details…
              </p>
            )}
            {confirmationError && (
              <div className="mt-6 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {confirmationError}
              </div>
            )}
            {confirmedBooking && (
              <div className="mt-7 border border-line bg-nude p-5 rounded-sm text-left">
                <p className="text-xs font-bold uppercase tracking-wide text-gold">
                  Your appointment
                </p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-ink-soft">
                      Name
                    </span>
                    <span className="font-bold text-right">
                      {confirmedBooking.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-ink-soft">
                      Service
                    </span>
                    <span className="font-bold text-right">
                      {confirmedBooking.service}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-ink-soft">
                      Date
                    </span>
                    <span className="font-bold text-right">
                      {formatBookingDate(
                        confirmedBooking.bookingDate
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-ink-soft">
                      Time
                    </span>
                    <span className="font-bold text-right">
                      {formatBookingTime(
                        confirmedBooking.startTime
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-ink-soft">
                      Clients
                    </span>
                    <span className="font-bold">
                      {confirmedBooking.clientCount}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 pt-2 border-t border-line">
                    <span className="text-ink-soft">
                      Deposit paid
                    </span>
                    <span className="font-bold text-gold">
                      R{confirmedBooking.depositAmount}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-7">
              <p className="text-sm text-ink-soft mb-4">
                Need to contact us about your appointment?
              </p>
              <a
                href={
                  whatsappMessage
                    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`
                    : "#"
                }
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!whatsappMessage) {
                    e.preventDefault();
                  }
                }}
                className={`inline-flex items-center justify-center rounded-sm px-6 py-3.5 text-sm font-bold uppercase tracking-wide transition-colors ${
                  whatsappMessage
                    ? "bg-ink text-white hover:bg-gold hover:text-ink"
                    : "bg-ink/40 text-white cursor-not-allowed"
                }`}
              >
                Message us on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section
      id="booking"
      className="max-w-[1180px] mx-auto px-5 py-22"
    >
      <div className="max-w-[640px] mb-12">
        <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
          Reserve your chair
        </p>
        <h2 className="font-serif font-medium text-[clamp(1.9rem,4vw,2.6rem)] mt-3.5">
          Book an appointment
        </h2>
      </div>
      <div className="grid gap-9 bg-nude-deep border border-line rounded p-7 md:p-13 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
            How it works
          </p>
          <h3 className="font-serif text-[1.4rem] font-medium mt-3 mb-4">
            Choose your services, date and time.
          </h3>
          <p className="text-ink-soft leading-relaxed text-[0.94rem]">
            Select up to 4 services for each booking.
            You can also book for multiple clients
            together. A R90 deposit is required for each
            client. When multiple clients book together,
            appointments are scheduled consecutively
            where availability allows.
          </p>
          <div className="mt-7 border border-line bg-nude p-5 rounded-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-gold">
              Your booking
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-ink-soft">
                  Services
                </span>
                <span className="font-bold text-right">
                  {form.services.length}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-ink-soft">
                  Clients
                </span>
                <span className="font-bold">
                  {clientCount}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-ink-soft">
                  Estimated time
                </span>
                <span className="font-bold">
                  {formatDuration(totalDuration)}
                </span>
              </div>
              <div className="flex justify-between gap-4 pt-2 border-t border-line">
                <span className="text-ink-soft">
                  Deposit
                </span>
                <span className="font-bold text-gold">
                  R{depositAmount}
                </span>
              </div>
            </div>
            <p className="mt-4 text-xs text-ink-soft leading-relaxed">
              R90 deposit per client. A 15-minute gap is
              included between clients.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className={labelClass}
                htmlFor="b-name"
              >
                Name
              </label>
              <input
                id="b-name"
                type="text"
                required
                placeholder="Your name"
                className={inputClass}
                value={form.name}
                onChange={update("name")}
              />
            </div>
            <div>
              <label
                className={labelClass}
                htmlFor="b-phone"
              >
                Phone
              </label>
              <input
                id="b-phone"
                type="tel"
                required
                placeholder="07…"
                className={inputClass}
                value={form.phone}
                onChange={update("phone")}
              />
            </div>
          </div>
          <label
            className={labelClass}
            htmlFor="b-email"
          >
            Email
          </label>
          <input
            id="b-email"
            type="email"
            required
            placeholder="you@example.com"
            className={inputClass}
            value={form.email}
            onChange={update("email")}
          />
          <div className="mb-5">
            <div className="flex items-center justify-between gap-4 mb-2">
              <label
                className={`${labelClass} mb-0`}
              >
                Services
              </label>
              <span className="text-xs text-ink-soft">
                {form.services.length}/4 selected
              </span>
            </div>
            <div className="space-y-2">
              {form.services.map(
                (serviceName, index) => {
                  const selectedNames =
                    form.services.filter(
                      (_, serviceIndex) =>
                        serviceIndex !== index
                    );
                  return (
                    <div
                      key={`${serviceName}-${index}`}
                      className="flex items-center gap-2"
                    >
                      <select
                        id={`b-service-${index}`}
                        className={`${inputClass} flex-1 mb-0`}
                        value={serviceName}
                        onChange={(e) =>
                          updateService(
                            index,
                            e.target.value
                          )
                        }
                      >
                        {SERVICE_OPTIONS.map(
                          (service) => (
                            <option
                              key={service.name}
                              value={service.name}
                              disabled={selectedNames.includes(
                                service.name
                              )}
                            >
                              {service.name}
                            </option>
                          )
                        )}
                      </select>
                      {form.services.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeService(index)
                          }
                          className="shrink-0 h-[46px] px-3 border border-line rounded-sm text-xs font-bold uppercase tracking-wide text-ink-soft hover:border-gold hover:text-ink transition-colors"
                          aria-label={`Remove ${serviceName}`}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                }
              )}
            </div>
            {form.services.length < 4 && (
              <button
                type="button"
                onClick={addService}
                className="mt-3 inline-flex items-center justify-center border border-line rounded-sm px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-ink hover:border-gold hover:bg-gold hover:text-ink transition-colors"
              >
                + Add another service
              </button>
            )}
            <p className="mt-2 text-xs text-ink-soft">
              You can select up to 4 services in one
              appointment.
            </p>
          </div>
          <label
            className={labelClass}
            htmlFor="b-clients"
          >
            Number of clients
          </label>
          <select
            id="b-clients"
            className={inputClass}
            value={form.clients}
            onChange={update("clients")}
          >
            <option value="1">
              1 client — R90 deposit
            </option>
            <option value="2">
              2 clients — R180 deposit
            </option>
            <option value="3">
              3 clients — R270 deposit
            </option>
            <option value="4">
              4 clients — R360 deposit
            </option>
          </select>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className={labelClass}
                htmlFor="b-date"
              >
                Preferred date
              </label>
              <input
                id="b-date"
                type="date"
                required
                min={todayDate}
                className={inputClass}
                value={form.date}
                onChange={update("date")}
              />
            </div>
            <div>
              <label
                className={labelClass}
                htmlFor="b-time"
              >
                Available time
              </label>
              <select
                id="b-time"
                required
                className={inputClass}
                value={form.time}
                onChange={update("time")}
                disabled={
                  !form.date ||
                  availabilityLoading
                }
              >
                <option value="">
                  {!form.date
                    ? "Select a date first"
                    : availabilityLoading
                    ? "Checking availability…"
                    : availableTimes.length === 0
                    ? "No times available"
                    : "Select a time"}
                </option>
                {availableTimes.map((time) => (
                  <option
                    key={time}
                    value={time}
                  >
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {availabilityError && (
            <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {availabilityError}
            </div>
          )}
          <label
            className={labelClass}
            htmlFor="b-notes"
          >
            Notes
          </label>
          <textarea
            id="b-notes"
            placeholder="e.g. Almond shape, nude with gold foil tips"
            className={`${inputClass} min-h-[80px] resize-y`}
            value={form.notes}
            onChange={update("notes")}
          />
          {error && (
            <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2.5 w-full bg-ink text-nude py-4 rounded-sm font-bold uppercase tracking-wide text-[0.85rem] hover:bg-gold hover:text-ink transition-colors disabled:opacity-50"
          >
            {loading
              ? "Opening secure payment…"
              : `Continue to deposit — R${depositAmount}`}
          </button>
        </form>
      </div>
    </section>
  );
}
