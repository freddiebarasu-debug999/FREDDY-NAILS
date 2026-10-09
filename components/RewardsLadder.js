"use client";

import { useEffect, useState } from "react";

const TIERS = [
  { name: "New", at: 0, sub: "Welcome" },
  { name: "Regular", at: 1, sub: "Returning Client" },
  { name: "VIP", at: 3, sub: "Valued Client" },
  { name: "Elite", at: 6, sub: "Gold Member" },
];

// Where each tier sits on the bar (column centres of a 4-column grid).
function fillPercent(visits) {
  if (visits >= 6) return 100;
  const points = [0, 1, 3, 6];
  const spots = [0, 33.333, 66.667, 100];
  for (let i = 0; i < points.length - 1; i += 1) {
    if (visits >= points[i] && visits < points[i + 1]) {
      const t = (visits - points[i]) / (points[i + 1] - points[i]);
      return spots[i] + t * (spots[i + 1] - spots[i]);
    }
  }
  return 0;
}

export default function RewardsLadder({ visits }) {
  const count = Number(visits) || 0;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(fillPercent(count)), 250);
    return () => clearTimeout(t);
  }, [count]);

  const currentIndex = TIERS.reduce(function (acc, tier, i) {
    return count >= tier.at ? i : acc;
  }, 0);
  const next = TIERS[currentIndex + 1] || null;
  const remaining = next ? next.at - count : 0;

  return (
    <section
      aria-labelledby="ladder-title"
      className="mt-7 rounded-[20px] border border-[#d6b36a]/20 bg-white/[0.03] p-5 md:p-6"
    >
      <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[#d6b36a]">
        Loyalty journey
      </p>
      <h2 id="ladder-title" className="mt-2 font-serif text-xl text-[#f4eee6]">
        {next
          ? remaining + (remaining === 1 ? " more visit" : " more visits") + " to " + next.name
          : "You're an Elite client"}
      </h2>
      <p className="mt-1 text-sm text-[#c9c0b6]">
        {next
          ? "Every visit moves you closer to the next level."
          : "Thank you for being part of Freddy Nails."}
      </p>

      <div className="relative mt-7">
        <div className="absolute left-[12.5%] right-[12.5%] top-[15px] h-1 rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#ad8a4e] to-[#f0d58f] transition-[width] duration-[1400ms] ease-out"
            style={{ width: animated + "%" }}
          />
        </div>

        <ol className="relative grid grid-cols-4">
          {TIERS.map(function (tier, i) {
            const reached = count >= tier.at;
            const isCurrent = i === currentIndex;
            return (
              <li key={tier.name} className="flex flex-col items-center text-center">
                <span
                  className={
                    "relative grid h-8 w-8 place-items-center rounded-full border-2 text-xs font-bold transition-all duration-500 " +
                    (reached
                      ? "border-[#d6b36a] bg-[#d6b36a] text-[#11100f]"
                      : "border-white/20 bg-[#141210] text-[#8f877e]")
                  }
                >
                  {reached ? "✓" : i + 1}
                  {isCurrent && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 animate-ping rounded-full bg-[#d6b36a]/40"
                    />
                  )}
                </span>
                <span
                  className={
                    "mt-2 text-xs font-semibold " +
                    (reached ? "text-[#f4eee6]" : "text-[#8f877e]")
                  }
                >
                  {tier.name}
                </span>
                <span className="text-[0.65rem] leading-tight text-[#a79a87]">
                  {tier.at === 0
                    ? tier.sub
                    : tier.at + (tier.at === 1 ? " visit" : " visits")}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
