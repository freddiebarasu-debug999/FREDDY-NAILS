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
      if (!cancelled && attempt < 4) {
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

  const name = booking && booking.customer_name ? booking.customer_name : "";
  const when =
    booking && booking.booking_date
      ? formatDate(booking.booking_date) +
        (booking.start_time ? " at " + formatTime(booking.start_time) : "")
      : "";

  const message = when
    ? "Hey Freddy! " +
      (name ? name + " here.\n" : "") +
      "I just booked an appointment for " +
      when +
      ".\nI can't wait to get this set done 💅"
    : "Hey Freddy! I just booked an appointment on your website 💅";

  const whatsappUrl =
    "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);

  const masked = booking ? maskEmail(booking.customer_email) : "";

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
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#d6b36a]/15 text-3xl">
              💬
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
              <span aria-hidden="true">💬</span> Open WhatsApp
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
