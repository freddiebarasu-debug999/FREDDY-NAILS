"use client";

import { useState } from "react";
import Image from "next/image";

const SHAPES = [
  {
    name: "Oval",
    desc: "Rounded tip, classic & soft",
    detail: "A timeless rounded tip that flatters most hands. Easy to wear every day.",
    src: "/gallery/shapes/oval.jpg",
  },
  {
    name: "Square",
    desc: "Flat edge, sharp corners",
    detail: "Straight free edge with clean corners. Strong look, great for shorter lengths.",
    src: "/gallery/shapes/square.jpg",
  },
  {
    name: "Soft Square",
    desc: "Square with soft corners",
    bookingName: "Squoval",
    detail: "The best of both — square strength with gently rounded corners.",
    src: "/gallery/shapes/soft-square.jpg",
  },
  {
    name: "Almond",
    desc: "Tapered, rounded tip",
    detail: "Tapers toward a soft point. Elongates fingers and suits medium to long sets.",
    src: "/gallery/shapes/almond.jpg",
  },
  {
    name: "Coffin",
    desc: "Tapered, squared tip (Ballerina)",
    detail: "Tapers in then finishes with a flat tip. Popular for long glamorous sets.",
    src: "/gallery/shapes/coffin.jpg",
  },
  {
    name: "Stiletto",
    desc: "Long, sharp point",
    detail: "Dramatic tapered point. Statement length — best for experienced wearers.",
    src: "/gallery/shapes/stiletto.jpg",
  },
];

export default function ShapeGuide() {
  const [selected, setSelected] = useState(null);

  function bookShape(shape) {
    const bookingName = shape.bookingName || shape.name;
    window.location.href = `/?shape=${encodeURIComponent(bookingName)}#booking`;
  }

  const active = SHAPES.find((s) => s.name === selected);

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
            Real soft-nude tips — tap a shape, then take it into your booking.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {SHAPES.map((shape) => {
            const isSelected = selected === shape.name;
            return (
              <button
                key={shape.name}
                type="button"
                onClick={() => setSelected(isSelected ? null : shape.name)}
                className={`relative overflow-hidden rounded-xl border text-left transition-all duration-300 ${
                  isSelected
                    ? "border-[#d6b36a] bg-[#211e1a] shadow-[0_0_0_1px_rgba(214,179,106,0.35)]"
                    : "border-white/[0.08] bg-[#181614] hover:border-[#d6b36a]/40 hover:bg-[#1d1a17]"
                }`}
              >
                <div className="relative aspect-[5/3] w-full overflow-hidden bg-[#1a1816]">
                  <Image
                    src={shape.src}
                    alt={`${shape.name} nail shape`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className="object-cover object-center"
                  />
                </div>
                <div className="px-3 py-3.5">
                  <p className={`text-xs font-bold tracking-[0.14em] uppercase ${isSelected ? "text-[#d6b36a]" : "text-[#f4eee6]"}`}>
                    {shape.name}
                  </p>
                  <p className="mt-1 text-[0.68rem] leading-snug text-[#9f978f]">{shape.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {active && (
          <div className="mt-8 rounded-xl border border-[#d6b36a]/25 bg-[#181614] p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="relative w-full sm:w-56 aspect-[5/3] flex-shrink-0 overflow-hidden rounded-lg border border-white/10">
                <Image src={active.src} alt={active.name} fill sizes="224px" className="object-cover" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-2xl text-[#f4eee6]">{active.name}</h3>
                <p className="mt-2 text-sm text-[#c9c0b6] leading-relaxed">{active.detail}</p>
                <button
                  type="button"
                  onClick={() => bookShape(active)}
                  className="mt-4 inline-flex items-center border border-[#d6b36a]/50 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-[#d6b36a] transition-colors hover:bg-[#d6b36a] hover:text-[#11100f]"
                >
                  Book this shape
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
