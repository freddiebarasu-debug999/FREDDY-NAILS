"use client";

import { useEffect, useRef, useState } from "react";

const WHATSAPP_NUMBER = "27710888897";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const parts = String(timeStr).split(":");
  const hour = Number(parts[0]);
  const suffix = hour >= 12 ? "pm" : "am";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return h12 + ":" + (parts[1] || "00") + " " + suffix;
}

function maskEmail(email) {
  if (!email || email.indexOf("@") < 1) return "";
  const parts = email.split("@");
  return parts[0].charAt(0) + "***@" + parts[1];
}

function buildMessage(booking) {
  if (!booking) {
    return "Hey Freddy! I just booked an appointment on your website 💅";
  }

  const lines = [];
  lines.push(
    "Hey Freddy!" + (booking.customerName ? " " + booking.customerName + " here." : "")
  );

  const clients = booking.clients || [];

  if (clients.length > 1) {
    lines.push("I just booked " + clients.length + " appointments:");
    clients.forEach(function (c, i) {
      lines.push(
        i + 1 + ". " + (c.service || "Appointment") + " on " +
          formatDate(c.bookingDate) + " at " + formatTime(c.startTime)
      );
    });
  } else {
    const c = clients[0] || {};
    const service = c.service || booking.service || "an appointment";
    const date = c.bookingDate || booking.bookingDate;
    const time = c.startTime || booking.startTime;
    lines.push(
      "I just booked " + service +
        (date ? " for " + formatDate(date) : "") +
        (time ? " at " + formatTime(time) : "") + "."
    );
  }

  const notes = String(booking.notes || "").trim();
  if (notes) {
    lines.push("Notes: " + notes.slice(0, 400));
  }

  lines.push("I can't wait to get this set done 💅");
  return lines.join("\n");
}

function WhatsAppIcon({ size, color }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={color}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export default function BookingSuccessPopup() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState(null);
  const primaryRef = useRef(null);

  // Detect the return from the payment page (?booking=success&appointment=ID)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("booking") !== "success") return;

    const id = params.get("appointment") || params.get("appointmentId") || "";
    const key = "fn-booking-popup-" + (id || "unknown");

    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch (e) {
      // sessionStorage unavailable: still show the popup once
    }

    setOpen(true);

    // Look up the booking so the WhatsApp message can be filled in for them.
    if (!id) return;
    let cancelled = false;

    async function load(attempt) {
      try {
        const res = await fetch("/api/booking?id=" + encodeURIComponent(id), {
          cache: "no-store",
        });
        const data = await res.json();
        if (!cancelled && res.ok && data && data.appointment) {
          setBooking(data.appointment);
          return;
        }
      } catch (e) {
        // try again below
      }
      if (!cancelled && attempt < 8) {
        setTimeout(function () {
          load(attempt + 1);
        }, 2000);
      }
    }

    load(1);
    return function () {
      cancelled = true;
    };
  }, []);

  // Lock page scroll, close on Escape, focus the main button
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return function () {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open && primaryRef.current) primaryRef.current.focus();
  }, [open, step]);

  if (!open) return null;

  const message = buildMessage(booking);

  const whatsappUrl =
    "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);

  const masked = booking ? maskEmail(booking.customerEmail) : "";

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-popup-title"
    >
      <div className="relative w-full max-w-sm rounded-3xl border border-[#d6b36a]/40 bg-[#141210] p-7 text-center shadow-2xl">
        <button
          type="button"
          onClick={function () {
            setOpen(false);
          }}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-xl text-[#c9c0b6] hover:text-white"
        >
          ×
        </button>

        {step === 1 ? (
          <>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#d6b36a]/15 text-3xl">
              ✉️
            </div>
            <h2
              id="booking-popup-title"
              className="mt-4 font-serif text-2xl text-[#f4eee6]"
            >
              Booking received 🎉
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#c9c0b6]">
              Thank you! Please <strong className="text-[#d6b36a]">check your email</strong>{" "}
              for your booking confirmation.
              {masked ? " We sent it to " + masked + "." : ""}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#9f978f]">
              Can&apos;t see it? Look in your spam or promotions folder.
            </p>

            <button
              ref={primaryRef}
              type="button"
              onClick={function () {
                setStep(2);
              }}
              className="mt-6 w-full rounded-full bg-[#d6b36a] py-3.5 text-sm font-bold text-[#11100f] transition-transform duration-200 hover:scale-[1.02] active:scale-95"
            >
              Next
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#d6b36a]/15">
              <WhatsAppIcon size={38} color="#25D366" />
            </div>
            <h2
              id="booking-popup-title"
              className="mt-4 font-serif text-2xl text-[#f4eee6]"
            >
              One last step
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#c9c0b6]">
              Message Freddy on WhatsApp so your appointment details can be
              confirmed and you can ask anything about your set.
            </p>

            <a
              ref={primaryRef}
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={function () {
                setTimeout(function () {
                  setOpen(false);
                }, 400);
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#d6b36a] py-3.5 text-sm font-bold text-[#11100f] transition-transform duration-200 hover:scale-[1.02] active:scale-95"
            >
              <WhatsAppIcon size={20} color="#11100f" /> Open WhatsApp
            </a>
            <p className="mt-2 text-xs text-[#9f978f]">
              Your message is already written for you. Just tap send.
            </p>

            <button
              type="button"
              onClick={function () {
                setOpen(false);
              }}
              className="mt-4 text-xs text-[#c9c0b6] underline"
            >
              I&apos;ll do it later
            </button>
          </>
        )}
      </div>
    </div>
  );
}
