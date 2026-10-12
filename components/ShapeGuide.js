"use client";

import { useState } from "react";

/**
 * Realistic 3D nail shape guide — product-photo style tips in soft nude.
 * Each shape has a distinct free-edge silhouette.
 */

const SHAPES = [
  {
    name: "Oval",
    desc: "Rounded tip, classic & soft",
    detail:
      "A timeless rounded tip that flatters most hands. Easy to wear every day.",
    // clip-path: rounded oval free edge
    clip: "polygon(18% 4%, 82% 4%, 92% 22%, 88% 88%, 70% 100%, 30% 100%, 12% 88%, 8% 22%)",
    radius: "45% 45% 40% 40% / 12% 12% 55% 55%",
  },
  {
    name: "Square",
    desc: "Flat edge, sharp corners",
    detail:
      "Straight free edge with clean corners. Strong look, great for shorter lengths.",
    clip: "polygon(16% 6%, 84% 6%, 84% 92%, 70% 100%, 30% 100%, 16% 92%)",
    radius: "8% 8% 12% 12% / 4% 4% 20% 20%",
  },
  {
    name: "Squoval",
    desc: "Square with soft corners",
    detail:
      "The best of both — square strength with gently rounded corners.",
    clip: "polygon(16% 6%, 84% 6%, 88% 18%, 86% 90%, 68% 100%, 32% 100%, 14% 90%, 12% 18%)",
    radius: "18% 18% 28% 28% / 8% 8% 40% 40%",
  },
  {
    name: "Almond",
    desc: "Tapered, rounded tip",
    detail:
      "Tapers toward a soft point. Elongates fingers and suits medium to long sets.",
    clip: "polygon(28% 2%, 72% 2%, 94% 28%, 88% 88%, 70% 100%, 30% 100%, 12% 88%, 6% 28%)",
    radius: "50% 50% 35% 35% / 8% 8% 55% 55%",
  },
  {
    name: "Coffin",
    desc: "Tapered, squared tip (Ballerina)",
    detail:
      "Tapers in then finishes with a flat tip. Popular for long glamorous sets.",
    clip: "polygon(22% 4%, 78% 4%, 96% 30%, 88% 90%, 68% 100%, 32% 100%, 12% 90%, 4% 30%)",
    radius: "6% 6% 30% 30% / 3% 3% 45% 45%",
  },
  {
    name: "Stiletto",
    desc: "Long, sharp point",
    detail:
      "Dramatic tapered point. Statement length — best for experienced wearers.",
    clip: "polygon(42% 0%, 58% 0%, 96% 32%, 88% 88%, 70% 100%, 30% 100%, 12% 88%, 4% 32%)",
    radius: "50% 50% 28% 28% / 2% 2% 50% 50%",
  },
];

const NUDE = {
  base: "#D4B5A5",
  mid: "#C4A090",
  deep: "#A88878",
};

function ShapeNail({ shape, active }) {
  const gradient = `linear-gradient(165deg, ${NUDE.base} 0%, ${NUDE.mid} 48%, ${NUDE.deep} 100%)`;

  return (
    <div className="relative mx-auto w-[56px] h-[120px] sm:w-[64px] sm:h-[138px]">
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-9 h-2.5 rounded-full bg-black/35 blur-md"
        aria-hidden
      />
      <div
        className="relative h-full w-full overflow-hidden transition-shadow duration-300"
        style={{
          background: gradient,
          borderRadius: shape.radius,
          clipPath: shape.clip,
          boxShadow: active
            ? `
              inset 0 2px 6px rgba(255,255,255,0.5),
              inset 0 -8px 14px rgba(0,0,0,0.25),
              inset 3px 0 8px rgba(255,255,255,0.15),
              inset -4px 0 10px rgba(0,0,0,0.2),
              0 0 0 1px rgba(214,179,106,0.55),
              0 14px 28px rgba(0,0,0,0.5)
            `
            : `
              inset 0 2px 6px rgba(255,255,255,0.45),
              inset 0 -8px 14px rgba(0,0,0,0.22),
              inset 3px 0 8px rgba(255,255,255,0.12),
              inset -4px 0 10px rgba(0,0,0,0.18),
              0 10px 22px rgba(0,0,0,0.4)
            `,
        }}
      >
        <div
          className="pointer-events-none absolute left-[16%] top-[8%] h-[40%] w-[26%] rounded-full"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.12) 60%, transparent 100%)",
            filter: "blur(1.2px)",
            transform: "rotate(-7deg)",
          }}
        />
        <div
          className="pointer-events-none absolute right-[10%] top-[18%] h-[28%] w-[9%] rounded-full"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)",
            filter: "blur(1px)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[30%]"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.3), transparent)",
          }}
        />
      </div>
    </div>
  );
}

export default function ShapeGuide() {
  const [selected, setSelected] = useState(null);

  function bookShape(shapeName) {
    window.location.href = `/?shape=${encodeURIComponent(shapeName)}#booking`;
  }

  return (
    <section id="shape-guide" className="bg-[#11100f] text-[#f4eee6]">
      <div className="max-w-[1180px] mx-auto px-5 py-18">
        <div className="max-w-[640px] mb-12">
          <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-[#d6b36a]">
            Not sure what to book?
          </p>
          <h2 className="font-serif font-medium text-[clamp(1.9rem,4vw,2.6rem)] mt-3.5 text-[#f4eee6]">
            Find your shape first.
          </h2>
          <div className="mt-5 h-px w-16 bg-[#d6b36a]/60" />
          <p className="mt-5 text-[0.95rem] text-[#c9c0b6] leading-relaxed">
            Real product-style tips — tap a shape to see the look, then take it
            into your booking.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {SHAPES.map((shape) => {
            const isSelected = selected === shape.name;

            return (
              <button
                key={shape.name}
                type="button"
                onClick={() =>
                  setSelected(isSelected ? null : shape.name)
                }
                className={`relative rounded-xl border px-3 pt-7 pb-5 text-center transition-all duration-300 ${
                  isSelected
                    ? "border-[#d6b36a] bg-[#211e1a] shadow-[0_0_0_1px_rgba(214,179,106,0.35)]"
                    : "border-white/[0.08] bg-[#181614] hover:border-[#d6b36a]/40 hover:bg-[#1d1a17]"
                }`}
              >
                <ShapeNail shape={shape} active={isSelected} />

                <p
                  className={`mt-4 text-xs font-bold tracking-[0.14em] uppercase ${
                    isSelected ? "text-[#d6b36a]" : "text-[#f4eee6]"
                  }`}
                >
                  {shape.name}
                </p>
                <p className="mt-1.5 text-[0.68rem] leading-snug text-[#9f978f]">
                  {shape.desc}
                </p>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="mt-8 rounded-xl border border-[#d6b36a]/25 bg-[#181614] p-5 md:p-6">
            {SHAPES.filter((s) => s.name === selected).map((shape) => (
              <div
                key={shape.name}
                className="flex flex-col sm:flex-row sm:items-center gap-6"
              >
                <div className="flex-shrink-0 self-center sm:self-auto">
                  <ShapeNail shape={shape} active />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-2xl text-[#f4eee6]">
                    {shape.name}
                  </h3>
                  <p className="mt-2 text-sm text-[#c9c0b6] leading-relaxed">
                    {shape.detail}
                  </p>
                  <button
                    type="button"
                    onClick={() => bookShape(shape.name)}
                    className="mt-4 inline-flex items-center border border-[#d6b36a]/50 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-[#d6b36a] transition-colors hover:bg-[#d6b36a] hover:text-[#11100f]"
                  >
                    Book this shape
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
