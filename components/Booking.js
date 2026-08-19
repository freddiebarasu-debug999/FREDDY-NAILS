"use client";
import { useMemo, useState } from "react";
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
export default function Booking() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    service: SERVICE_OPTIONS[0].name,
    clients: "1",
    date: "",
    time: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const update = (field) => (e) =>
    setForm((current) => ({
      ...current,
      [field]: e.target.value,
    }));
  const selectedService = useMemo(
    () =>
      SERVICE_OPTIONS.find((service) => service.name === form.service) ||
      SERVICE_OPTIONS[0],
    [form.service]
  );
  const clientCount = Math.max(1, Number(form.clients) || 1);
  const totalDuration =
    selectedService.duration * clientCount +
    CLIENT_GAP * Math.max(0, clientCount - 1);
  const depositAmount = DEPOSIT_PER_CLIENT * clientCount;
  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientCount,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || "Unable to start the payment."
        );
      }
      if (!data.redirectUrl) {
        throw new Error("Yoco did not return a checkout link.");
      }
      window.location.href = data.redirectUrl;
    } catch (error) {
      console.error("Payment error:", error);
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
  return (
    <section id="booking" className="max-w-[1180px] mx-auto px-5 py-22">
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
            Choose your service, date and time.
          </h3>
          <p className="text-ink-soft leading-relaxed text-[0.94rem]">
            Select how many clients are booking together. A R90 deposit is
            required for each client. When multiple clients book together,
            appointments are scheduled consecutively where availability allows.
          </p>
          <div className="mt-7 border border-line bg-nude p-5 rounded-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-gold">
              Your booking
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-ink-soft">Clients</span>
                <span className="font-bold">{clientCount}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-ink-soft">Estimated time</span>
                <span className="font-bold">
                  {formatDuration(totalDuration)}
                </span>
              </div>
              <div className="flex justify-between gap-4 pt-2 border-t border-line">
                <span className="text-ink-soft">Deposit</span>
                <span className="font-bold text-gold">
                  R{depositAmount}
                </span>
              </div>
            </div>
            <p className="mt-4 text-xs text-ink-soft leading-relaxed">
              R90 deposit per client. A 15-minute gap is included between
              clients.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="b-name">
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
              <label className={labelClass} htmlFor="b-phone">
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
          <label className={labelClass} htmlFor="b-service">
            Service
          </label>
          <select
            id="b-service"
            className={inputClass}
            value={form.service}
            onChange={update("service")}
          >
            {SERVICE_OPTIONS.map((service) => (
              <option key={service.name} value={service.name}>
                {service.name}
              </option>
            ))}
          </select>
          <label className={labelClass} htmlFor="b-clients">
            Number of clients
          </label>
          <select
            id="b-clients"
            className={inputClass}
            value={form.clients}
            onChange={update("clients")}
          >
            <option value="1">1 client — R90 deposit</option>
            <option value="2">2 clients — R180 deposit</option>
            <option value="3">3 clients — R270 deposit</option>
            <option value="4">4 clients — R360 deposit</option>
          </select>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="b-date">
                Preferred date
              </label>
              <input
                id="b-date"
                type="date"
                required
                className={inputClass}
                value={form.date}
                onChange={update("date")}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="b-time">
                Preferred time
              </label>
              <input
                id="b-time"
                type="time"
                required
                className={inputClass}
                value={form.time}
                onChange={update("time")}
              />
            </div>
          </div>
          <label className={labelClass} htmlFor="b-notes">
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
