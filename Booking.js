"use client";
import { useState } from "react";

// Freddy Nails WhatsApp — digits only, country code, no + or spaces
const WHATSAPP_NUMBER = "27710888897";

const SERVICE_OPTIONS = [
  "Acrylic Manicure — Plain",
  "Acrylic Manicure — French",
  "Acrylic Manicure — Ombré",
  "Gel Manicure — Overlay",
  "Gel Manicure — Plain",
  "Gel Manicure — French",
  "Pedicure Set — Gel",
  "Pedicure Set — Acrylic",
  "Fill-in",
  "Nail Art / Rhinestones / 3D Art",
  "Repair / Soak Off",
];

export default function Booking() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    service: SERVICE_OPTIONS[0],
    date: "",
    time: "",
    notes: "",
  });

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    let msg = `Hi Freddy Nails! I'd like to book:\n`;
    msg += `Name: ${form.name}\nPhone: ${form.phone}\nService: ${form.service}\n`;
    if (form.date) msg += `Date: ${form.date}\n`;
    if (form.time) msg += `Time: ${form.time}\n`;
    if (form.notes) msg += `Notes: ${form.notes}\n`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

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
            Fill this in, then send it straight to WhatsApp.
          </h3>
          <p className="text-ink-soft leading-relaxed text-[0.94rem]">
            We reply within office hours to confirm your slot. No account, no
            deposit link needed for standard appointments — extensions and
            party bookings may ask for a small deposit.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="b-name">Name</label>
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
              <label className={labelClass} htmlFor="b-phone">Phone</label>
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

          <label className={labelClass} htmlFor="b-service">Service</label>
          <select
            id="b-service"
            className={inputClass}
            value={form.service}
            onChange={update("service")}
          >
            {SERVICE_OPTIONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="b-date">Preferred date</label>
              <input
                id="b-date"
                type="date"
                className={inputClass}
                value={form.date}
                onChange={update("date")}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="b-time">Preferred time</label>
              <input
                id="b-time"
                type="time"
                className={inputClass}
                value={form.time}
                onChange={update("time")}
              />
            </div>
          </div>

          <label className={labelClass} htmlFor="b-notes">
            Notes (shape, colour, allergies)
          </label>
          <textarea
            id="b-notes"
            placeholder="e.g. Almond shape, nude with gold foil tips"
            className={`${inputClass} min-h-[80px] resize-y`}
            value={form.notes}
            onChange={update("notes")}
          />

          <button
            type="submit"
            className="flex items-center justify-center gap-2.5 w-full bg-ink text-nude py-4 rounded-sm font-bold uppercase tracking-wide text-[0.85rem] hover:bg-gold hover:text-ink transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.28-1.38c1.45.79 3.08 1.21 4.71 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" />
            </svg>
            Send request via WhatsApp
          </button>
        </form>
      </div>
    </section>
  );
}
