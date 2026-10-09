"use client";

import { useEffect, useState } from "react";

const REBOOK_KEY = "freddynails_rebook_service";
const REVIEW_URL = "https://g.page/r/CcR1DUgY4s7NEBM/review";

function findLastSet(appointments) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const done = (appointments || []).filter(function (a) {
    const booking = String(a.booking_status || "").toLowerCase();
    const payment = String(a.payment_status || "").toLowerCase();
    if (booking === "cancelled" || booking === "canceled") return false;
    const good =
      payment === "paid" ||
      payment === "deposit_paid" ||
      booking === "confirmed" ||
      booking === "approved";
    if (!good || !a.booking_date || !a.service_name) return false;
    return new Date(a.booking_date + "T00:00:00") <= today;
  });

  done.sort(function (a, b) {
    return a.booking_date < b.booking_date ? 1 : -1;
  });
  return done[0] || null;
}

function shortDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

const ICONS = {
  book: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" />
    </>
  ),
  rebook: (
    <>
      <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
      <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
      <path d="M21 3v5h-5M3 21v-5h5" />
    </>
  ),
  sets: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </>
  ),
  review: (
    <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21.1 7 14.2 2 9.3l6.9-1z" />
  ),
};

function Tile({ icon, title, sub, onClick, href, external, index, mounted, highlight }) {
  const classes =
    "group relative flex w-full flex-col items-start gap-3 overflow-hidden rounded-2xl border p-4 text-left transition-all duration-500 hover:-translate-y-1 hover:border-[#d6b36a]/70 active:scale-[0.96] " +
    (highlight
      ? "border-[#d6b36a]/50 bg-gradient-to-br from-[#d6b36a]/25 to-[#ad8a4e]/5 "
      : "border-[#d6b36a]/20 bg-gradient-to-br from-[#d6b36a]/10 to-white/[0.02] ") +
    (mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0");

  const inner = (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"
      />
      <span className="relative grid h-10 w-10 place-items-center rounded-full bg-[#d6b36a]/15 text-[#d6b36a] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {ICONS[icon]}
        </svg>
      </span>
      <span className="relative">
        <span className="block font-serif text-base text-[#f4eee6]">{title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-[#a79a87]">{sub}</span>
      </span>
    </>
  );

  const style = { transitionDelay: mounted ? index * 70 + "ms" : "0ms" };

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        style={style}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes} style={style}>
      {inner}
    </button>
  );
}

export default function QuickActions({ appointments }) {
  const [mounted, setMounted] = useState(false);
  const last = findLastSet(appointments);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  function rebook() {
    try {
      if (last) window.localStorage.setItem(REBOOK_KEY, last.service_name);
    } catch (e) {
      // ignore
    }
    window.location.assign("/account/book");
  }

  function goToSets() {
    const el = document.getElementById("my-sets");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section aria-label="Quick actions" className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
      <Tile
        index={0}
        mounted={mounted}
        icon="book"
        title="Book a visit"
        sub="Pick a service, date and time"
        href="/account/book"
      />
      <Tile
        index={1}
        mounted={mounted}
        icon="rebook"
        highlight={Boolean(last)}
        title={last ? "Rebook my last set" : "Your first set"}
        sub={
          last
            ? last.service_name + " · " + shortDate(last.booking_date)
            : "Book your first appointment"
        }
        onClick={last ? rebook : undefined}
        href={last ? undefined : "/account/book"}
      />
      <Tile
        index={2}
        mounted={mounted}
        icon="sets"
        title="My sets"
        sub="Your photo gallery of past looks"
        onClick={goToSets}
      />
      <Tile
        index={3}
        mounted={mounted}
        icon="review"
        title="Review and reward"
        sub="Leave a Google review, win a discount"
        href={REVIEW_URL}
        external
      />
    </section>
  );
}
