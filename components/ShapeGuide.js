"use client";

import { useState } from "react";

const SHAPES = [
  {
    name: "Almond",
    desc: "Tapered, rounded tip",
    d: "M14 40 L12 14 Q20 2 28 14 L26 40 Q20 46 14 40 Z",
  },
  {
    name: "Square",
    desc: "Flat edge, sharp corners",
    d: "M13 40 L12 12 L28 12 L27 40 Q20 46 13 40 Z",
  },
  {
    name: "Squoval",
    desc: "Square with soft corners",
    d: "M13 40 L12 14 Q20 8 28 14 L27 40 Q20 46 13 40 Z",
  },
  {
    name: "Oval",
    desc: "Rounded, classic",
    d: "M14 40 L13 20 Q20 6 27 20 L26 40 Q20 46 14 40 Z",
  },
  {
    name: "Coffin",
    desc: "Tapered, squared tip",
    d: "M15 40 L13 16 L27 16 L25 40 Q20 47 15 40 Z",
  },
  {
    name: "Stiletto",
    desc: "Long, sharp point",
    d: "M16 40 L14 8 Q20 2 26 8 L24 40 Q20 46 16 40 Z",
  },
];

export default function ShapeGuide() {
  const [selected, setSelected] = useState(null);

  function bookShape(shapeName) {
    window.location.href = `/?shape=${encodeURIComponent(
      shapeName
    )}#booking`;
  }

  return (
    <section id="shape-guide" className="bg-ink text-nude">
      <div className="max-w-[1180px] mx-auto px-5 py-18">
        <div className="max-w-[640px] mb-12">
          <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold-bright">
            Not sure what to book?
          </p>

          <h2 className="font-serif font-medium text-[clamp(1.9rem,4vw,2.6rem)] mt-3.5">
            Find your shape first.
          </h2>

          <p className="mt-3 text-[0.95rem] text-[#C9BBA9] leading-relaxed">
            Choose the nail shape you love, then take it straight into your
            booking.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-white/10">
          {SHAPES.map((shape) => {
            const isSelected = selected === shape.name;

            return (
              <button
                key={shape.name}
                type="button"
                onClick={() =>
                  setSelected(
                    isSelected ? null : shape.name
                  )
                }
                className={`relative bg-ink text-center px-3.5 pt-6.5 pb-5 group transition-all duration-300 ${
                  isSelected
                    ? "bg-[#26201B]"
                    : "hover:bg-[#211C18]"
                }`}
              >
                <span
                  className={`absolute top-0 left-0 right-0 h-[2px] bg-gold-bright transition-all duration-300 ${
                    isSelected
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-70"
                  }`}
                />

                <svg
                  viewBox="0 0 40 60"
                  className={`w-[42px] h-[60px] mx-auto mb-3.5 block transition-all duration-500 ${
                    isSelected
                      ? "scale-110 -translate-y-1"
                      : "group-hover:scale-105"
                  }`}
                >
                  <path
                    d={shape.d}
                    className={`fill-none stroke-gold-bright stroke-[1.4] transition-all duration-300 ${
                      isSelected
                        ? "fill-gold-bright/[0.18]"
                        : "group-hover:fill-gold-bright/[0.10]"
                    }`}
                  />
                </svg>

                <div
                  className={`text-[0.82rem] font-bold tracking-wide ${
                    isSelected
                      ? "text-gold-bright"
                      : "text-nude"
                  }`}
                >
                  {shape.name}
                </div>

                <div className="text-[0.74rem] text-[#A79A87] mt-1 leading-tight">
                  {shape.desc}
                </div>

                {isSelected && (
                  <div className="mt-3 text-[0.62rem] uppercase tracking-[0.18em] font-bold text-gold-bright">
                    Selected
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="mt-6 border border-gold/30 bg-[#1D1916] px-5 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.18em] text-gold-bright font-bold">
                Your selected shape
              </p>

              <p className="font-serif text-xl mt-1">
                {selected}
              </p>

              <p className="text-xs text-[#A79A87] mt-1">
                This will be selected automatically when you book.
              </p>
            </div>

            <button
              type="button"
              onClick={() => bookShape(selected)}
              className="inline-flex items-center justify-center bg-gold-bright text-ink px-5 py-3 rounded-sm text-[0.75rem] font-bold uppercase tracking-wide hover:bg-gold transition-colors"
            >
              Book this shape →
            </button>
          </div>
        )}

        <p className="text-center text-[0.68rem] text-[#817668] mt-8">
          Not sure which shape suits your hands? Freddy can help you choose
          during your appointment.
        </p>
      </div>
    </section>
  );
}
