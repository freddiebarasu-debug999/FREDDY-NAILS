"use client";

import { useState } from "react";

/**
 * Visual nail shape guide — illustrated silhouettes + short descriptions.
 * Matches the style of salon shape charts (oval, square, soft square, almond, coffin, stiletto).
 */
const SHAPES = [
  {
    name: "Oval",
    desc: "Rounded tip, classic & soft",
    detail:
      "A timeless rounded tip that flatters most hands. Easy to wear every day.",
    // Soft oval tip
    d: "M18 4 C22 4 26 8 26 14 L24 38 C24 42 20 46 16 46 C12 46 8 42 8 38 L6 14 C6 8 10 4 14 4 Z",
  },
  {
    name: "Square",
    desc: "Flat edge, sharp corners",
    detail:
      "Straight free edge with clean corners. Strong look, great for shorter lengths.",
    d: "M8 6 L24 6 L24 40 C24 44 20 46 16 46 C12 46 8 44 8 40 Z",
  },
  {
    name: "Squoval",
    desc: "Square with soft corners",
    detail:
      "The best of both — square strength with gently rounded corners.",
    d: "M9 6 L23 6 C24 6 25 8 25 10 L24 40 C24 44 20 46 16 46 C12 46 8 44 8 40 L7 10 C7 8 8 6 9 6 Z",
  },
  {
    name: "Almond",
    desc: "Tapered, rounded tip",
    detail:
      "Tapers toward a soft point. Elongates fingers and suits medium to long sets.",
    d: "M16 2 C20 2 26 10 26 16 L24 38 C24 42 20 46 16 46 C12 46 8 42 8 38 L6 16 C6 10 12 2 16 2 Z",
  },
  {
    name: "Coffin",
    desc: "Tapered, squared tip (Ballerina)",
    detail:
      "Tapers in then finishes with a flat tip. Popular for long glamorous sets.",
    d: "M10 4 L22 4 L26 16 L24 38 C24 42 20 46 16 46 C12 46 8 42 8 38 L6 16 Z",
  },
  {
    name: "Stiletto",
    desc: "Long, sharp point",
    detail:
      "Dramatic tapered point. Statement length — best for experienced wearers.",
    d: "M16 0 C19 4 26 14 26 20 L24 38 C24 42 20 46 16 46 C12 46 8 42 8 38 L6 20 C6 14 13 4 16 0 Z",
  },
];

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
            Tap a shape to see the look, then take it straight into your
            booking.
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
                className={`relative rounded-xl border px-3 pt-6 pb-5 text-center transition-all duration-300 ${
                  isSelected
                    ? "border-[#d6b36a] bg-[#211e1a] shadow-[0_0_0_1px_rgba(214,179,106,0.35)]"
                    : "border-white/[0.08] bg-[#181614] hover:border-[#d6b36a]/40 hover:bg-[#1d1a17]"
                }`}
              >
                <div className="mx-auto mb-4 flex h-24 items-end justify-center">
                  <svg
                    viewBox="0 0 32 48"
                    className={`h-24 w-12 transition-colors ${
                      isSelected ? "text-[#d6b36a]" : "text-[#c9c0b6]"
                    }`}
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d={shape.d} opacity="0.92" />
                    <path
                      d={shape.d}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.6"
                      opacity="0.5"
                    />
                  </svg>
                </div>

                <p
                  className={`text-xs font-bold tracking-[0.14em] uppercase ${
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
                className="flex flex-col sm:flex-row sm:items-center gap-5"
              >
                <div className="flex-shrink-0">
                  <svg
                    viewBox="0 0 32 48"
                    className="h-28 w-14 text-[#d6b36a]"
                    fill="currentColor"
                  >
                    <path d={shape.d} />
                  </svg>
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
