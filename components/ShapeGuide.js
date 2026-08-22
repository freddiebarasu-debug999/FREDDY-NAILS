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
  const [selected, setSelected] = useState<string | null>(null);

  function bookShape(shapeName: string) {
    window.location.href = `/?shape=${encodeURIComponent(
      shapeName
    )}#booking`;
  }

  return (
    <section
      id="shape-guide"
      className="bg-[#11100f] text-[#f4eee6]"
    >
      <div className="max-w-[1180px] mx-auto px-5 py-18">
        {/* Heading */}
        <div className="max-w-[640px] mb-12">
          <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-[#d6b36a]">
            Not sure what to book?
          </p>

          <h2 className="font-serif font-medium text-[clamp(1.9rem,4vw,2.6rem)] mt-3.5 text-[#f4eee6]">
            Find your shape first.
          </h2>

          <div className="mt-5 h-px w-16 bg-[#d6b36a]/60" />

          <p className="mt-5 text-[0.95rem] text-[#c9c0b6] leading-relaxed">
            Choose the nail shape you love, then take it straight into your
            booking.
          </p>
        </div>

        {/* Shape grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-white/[0.08]">
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
                className={`relative bg-[#181614] text-center px-3.5 pt-6.5 pb-5 group transition-all duration-300 ${
                  isSelected
                    ? "bg-[#211e1a]"
                    : "hover:bg-[#1d1a17]"
                }`}
              >
                {/* Gold active line */}
                <span
                  className={`absolute top-0 left-0 right-0 h-[2px] bg-[#d6b36a] transition-all duration-300 ${
                    isSelected
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-70"
                  }`}
                />

                {/* Shape illustration */}
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
                    className={`fill-none stroke-[#d6b36a] stroke-[1.4] transition-all duration-300 ${
                      isSelected
                        ? "fill-[#d6b36a]/[0.18]"
                        : "group-hover:fill-[#d6b36a]/[0.10]"
                    }`}
                  />
                </svg>

                {/* Shape name */}
                <div
                  className={`text-[0.82rem] font-bold tracking-wide ${
                    isSelected
                      ? "text-[#d6b36a]"
                      : "text-[#f4eee6]"
                  }`}
                >
                  {shape.name}
                </div>

                {/* Description */}
                <div className="text-[0.74rem] text-[#8f877e] mt-1 leading-tight">
                  {shape.desc}
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <div className="mt-3 text-[0.62rem] uppercase tracking-[0.18em] font-bold text-[#d6b36a]">
                    Selected
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selection panel */}
        {selected && (
          <div className="mt-6 border border-[#d6b36a]/30 bg-[#181614] px-5 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.18em] text-[#d6b36a] font-bold">
                Your selected shape
              </p>

              <p className="font-serif text-xl mt-1 text-[#f4eee6]">
                {selected}
              </p>

              <p className="text-xs text-[#8f877e] mt-1">
                This will be selected automatically when you book.
              </p>
            </div>

            <button
              type="button"
              onClick={() => bookShape(selected)}
              className="inline-flex items-center justify-center bg-[#d6b36a] text-[#11100f] px-5 py-3 rounded-sm text-[0.75rem] font-bold uppercase tracking-wide hover:bg-[#ad8a4e] transition-colors"
            >
              Book this shape →
            </button>
          </div>
        )}

        {/* Help text */}
        <p className="text-center text-[0.68rem] text-[#817970] mt-8">
          Not sure which shape suits your hands? Freddy can help you choose
          during your appointment.
        </p>
      </div>
    </section>
  );
}
