"use client";

import { useState } from "react";

/**
 * Shape guide styled after real product photography:
 * soft nude polish, bright horizontal gloss, natural proportions.
 */

const SHAPES = [
  {
    name: "Oval",
    desc: "Rounded tip, classic & soft",
    detail:
      "A timeless rounded tip that flatters most hands. Easy to wear every day.",
    // width % of container, height, free-edge style
    style: "oval",
  },
  {
    name: "Square",
    desc: "Flat edge, sharp corners",
    detail:
      "Straight free edge with clean corners. Strong look, great for shorter lengths.",
    style: "square",
  },
  {
    name: "Soft Square",
    desc: "Square with soft corners",
    detail:
      "The best of both — square strength with gently rounded corners.",
    style: "soft-square",
  },
  {
    name: "Almond",
    desc: "Tapered, rounded tip",
    detail:
      "Tapers toward a soft point. Elongates fingers and suits medium to long sets.",
    style: "almond",
  },
  {
    name: "Coffin",
    desc: "Tapered, squared tip (Ballerina)",
    detail:
      "Tapers in then finishes with a flat tip. Popular for long glamorous sets.",
    style: "coffin",
  },
  {
    name: "Stiletto",
    desc: "Long, sharp point",
    detail:
      "Dramatic tapered point. Statement length — best for experienced wearers.",
    style: "stiletto",
  },
];

/** Shared nude gel look matching reference photo */
const POLISH = {
  gradient:
    "linear-gradient(180deg, #E8D0C4 0%, #D9B9AB 35%, #CFA898 70%, #C49A8A 100%)",
};

function nailGeometry(style) {
  switch (style) {
    case "oval":
      return {
        width: 42,
        height: 78,
        borderRadius: "40% 40% 45% 45% / 18% 18% 55% 55%",
      };
    case "square":
      return {
        width: 42,
        height: 72,
        borderRadius: "10px 10px 6px 6px",
      };
    case "soft-square":
      return {
        width: 42,
        height: 74,
        borderRadius: "12px 12px 14px 14px",
      };
    case "almond":
      return {
        width: 40,
        height: 88,
        borderRadius: "50% 50% 40% 40% / 12% 12% 60% 60%",
      };
    case "coffin":
      return {
        width: 40,
        height: 92,
        borderRadius: "8px 8px 4px 4px",
        clipPath:
          "polygon(18% 0%, 82% 0%, 100% 28%, 92% 100%, 8% 100%, 0% 28%)",
      };
    case "stiletto":
      return {
        width: 36,
        height: 100,
        borderRadius: "50% 50% 30% 30% / 8% 8% 55% 55%",
        clipPath:
          "polygon(38% 0%, 62% 0%, 100% 30%, 90% 100%, 10% 100%, 0% 30%)",
      };
    default:
      return { width: 42, height: 78, borderRadius: "40%" };
  }
}

function RealisticNail({ style, active, large }) {
  const geo = nailGeometry(style);
  const scale = large ? 1.35 : 1;
  const w = geo.width * scale;
  const h = geo.height * scale;

  return (
    <div
      className="relative flex items-end justify-center"
      style={{ width: w + 8, height: h + 6 }}
    >
      {/* Soft contact shadow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-black/30 blur-[6px]"
        style={{ width: w * 0.7, height: 6 }}
        aria-hidden
      />

      <div
        className="relative overflow-hidden transition-transform duration-300"
        style={{
          width: w,
          height: h,
          background: POLISH.gradient,
          borderRadius: geo.borderRadius,
          clipPath: geo.clipPath,
          boxShadow: active
            ? `
              inset 0 1px 2px rgba(255,255,255,0.65),
              inset 0 -6px 12px rgba(140,100,85,0.25),
              inset 3px 0 6px rgba(255,255,255,0.2),
              inset -3px 0 8px rgba(100,70,55,0.15),
              0 0 0 1.5px rgba(214,179,106,0.6),
              0 10px 20px rgba(0,0,0,0.35)
            `
            : `
              inset 0 1px 2px rgba(255,255,255,0.6),
              inset 0 -6px 12px rgba(140,100,85,0.22),
              inset 3px 0 6px rgba(255,255,255,0.18),
              inset -3px 0 8px rgba(100,70,55,0.12),
              0 8px 16px rgba(0,0,0,0.28)
            `,
        }}
      >
        {/* Bright horizontal gloss — matches reference photo */}
        <div
          className="pointer-events-none absolute"
          style={{
            left: "18%",
            top: "14%",
            width: "38%",
            height: "55%",
            borderRadius: "50%",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.35) 40%, rgba(255,255,255,0.05) 75%, transparent 100%)",
            filter: "blur(1.5px)",
            transform: "rotate(-6deg)",
          }}
        />
        {/* Thin secondary sheen */}
        <div
          className="pointer-events-none absolute"
          style={{
            right: "16%",
            top: "22%",
            width: "12%",
            height: "40%",
            borderRadius: "50%",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)",
            filter: "blur(1px)",
          }}
        />
        {/* Soft tip shadow for depth */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{
            height: "22%",
            background:
              "linear-gradient(to top, rgba(120,80,65,0.2), transparent)",
          }}
        />
      </div>
    </div>
  );
}

export default function ShapeGuide() {
  const [selected, setSelected] = useState(null);

  function bookShape(shapeName) {
    // Map Soft Square → Squoval for booking compatibility
    const bookingName =
      shapeName === "Soft Square" ? "Squoval" : shapeName;
    window.location.href = `/?shape=${encodeURIComponent(bookingName)}#booking`;
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
            Soft nude tips styled like real sets — tap a shape, then take it
            into your booking.
          </p>
        </div>

        {/* Vertical list on mobile / compact grid desktop — mirrors chart layout */}
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
                className={`relative flex flex-col items-center rounded-xl border px-3 pt-8 pb-5 text-center transition-all duration-300 ${
                  isSelected
                    ? "border-[#d6b36a] bg-[#211e1a] shadow-[0_0_0_1px_rgba(214,179,106,0.35)]"
                    : "border-white/[0.08] bg-[#181614] hover:border-[#d6b36a]/40 hover:bg-[#1d1a17]"
                }`}
              >
                <RealisticNail
                  style={shape.style}
                  active={isSelected}
                />

                <p
                  className={`mt-5 text-xs font-bold tracking-[0.14em] uppercase ${
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
                <div className="flex-shrink-0 self-center sm:self-auto px-4">
                  <RealisticNail
                    style={shape.style}
                    active
                    large
                  />
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
