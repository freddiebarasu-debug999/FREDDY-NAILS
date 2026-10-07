"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "freddynails_welcome_seen_v1";
export const OPEN_EVENT = "freddynails:open-welcome";

export default function WelcomePopup() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  // First-time visitors see the welcome popup, but only once the page has had
  // time to load and paint: after their first scroll/tap, or after 12 seconds.
  // This keeps the big popup from competing with the hero for first paint.
  useEffect(() => {
    let seen = false;
    try {
      seen = !!window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // If localStorage is unavailable, just skip the auto-popup.
      return;
    }
    if (seen) return;

    const events = ["scroll", "pointerdown", "keydown", "touchstart"];
    let fallbackTimer;
    let showTimer;
    let shown = false;

    const cleanup = () => {
      events.forEach((e) => window.removeEventListener(e, onFirstInteraction));
      clearTimeout(fallbackTimer);
    };

    const show = () => {
      if (shown) return;
      shown = true;
      setOpen(true);
      requestAnimationFrame(() => setVisible(true));
    };

    function onFirstInteraction() {
      cleanup();
      showTimer = setTimeout(show, 1500);
    }

    events.forEach((e) =>
      window.addEventListener(e, onFirstInteraction, { passive: true, once: true })
    );
    fallbackTimer = setTimeout(() => {
      cleanup();
      show();
    }, 12000);

    return () => {
      cleanup();
      clearTimeout(showTimer);
    };
  }, []);

  // Allows the popup to be reopened on request by dispatching OPEN_EVENT,
  // regardless of whether it has already been seen once.
  useEffect(() => {
    function handleOpenRequest() {
      setOpen(true);
      requestAnimationFrame(() => setVisible(true));
    }

    window.addEventListener(OPEN_EVENT, handleOpenRequest);
    return () => window.removeEventListener(OPEN_EVENT, handleOpenRequest);
  }, []);

  function close() {
    setVisible(false);
    setTimeout(() => setOpen(false), 300);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Ignore storage errors.
    }
  }

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center px-4 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={close}
    >
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" />

      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-[440px] bg-ink text-nude border border-gold/40 rounded p-8 md:p-10 text-center transition-all duration-300 ${
          visible ? "scale-100 translate-y-0" : "scale-95 translate-y-3"
        }`}
        style={{
          boxShadow: "0 0 0 1px rgba(173,138,78,0.15), 0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute top-4 right-4 text-nude/50 hover:text-gold-bright text-2xl leading-none w-8 h-8 flex items-center justify-center transition-colors"
        >
          &times;
        </button>

        <p className="text-[0.68rem] font-bold tracking-[0.25em] uppercase text-gold">
          Freddy Nails Studio
        </p>

        <h2 className="font-serif text-2xl md:text-[1.7rem] font-medium mt-3 mb-1">
          Welcome
        </h2>

        <p className="text-nude/70 text-sm leading-relaxed mb-6">
          Boutique nail artistry in Quigney, East London — clean, detailed
          work, made just for you.
        </p>

        <div className="border border-gold/30 rounded-sm px-5 py-4 mb-5 bg-gold/5">
          <p className="text-[0.68rem] font-bold tracking-[0.2em] uppercase text-gold-bright mb-1">
            New here?
          </p>
          <p className="font-serif text-xl text-nude">
            15% off your first visit
          </p>
          <p className="text-xs text-nude/60 mt-1.5">
            Brand new to Freddy Nails? Use code{" "}
            <span className="text-gold-bright font-bold">FIRSTVISIT</span>{" "}
            when you book.
          </p>

          <div className="border-t border-gold/20 mt-4 pt-4">
            <p className="font-serif text-lg text-nude">
              10% off when you book online
            </p>
            <p className="text-xs text-nude/60 mt-1.5">
              Use code{" "}
              <span className="text-gold-bright font-bold">WELCOME10</span>{" "}
              when you book through our website.
            </p>
          </div>
        </div>

        <div className="border-t border-nude/10 pt-5 text-left">
          <p className="text-[0.68rem] font-bold tracking-[0.2em] uppercase text-gold mb-2 text-center">
            We&apos;re growing 💅
          </p>
          <p className="text-sm text-nude/75 leading-relaxed">
            Exciting news from Freddy Nails — alongside the nail services you
            love, we&apos;re now introducing professional{" "}
            <span className="text-gold-bright">eyelash extensions</span> and
            luxurious <span className="text-gold-bright">foot spa</span>{" "}
            treatments, for a complete self-care experience in one relaxing
            space. Both are available to book online now.
          </p>
        </div>

        <a
          href="/account/signup"
          onClick={close}
          className="inline-flex items-center justify-center gap-2.5 bg-gold text-ink px-7 py-3.5 rounded-sm text-[0.8rem] font-bold uppercase tracking-wide hover:bg-gold-bright transition-colors mt-7"
        >
          Book now
        </a>
      </div>
    </div>
  );
}
