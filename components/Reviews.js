"use client";
import { useEffect, useState } from "react";

const REVIEWS = [
  {
    quote:
      "The most even gel application I've had — and it actually lasted the full three weeks.",
    name: "Amara O.",
    service: "Signature Gel Manicure",
  },
  {
    quote:
      "Booked last minute through WhatsApp and they fit me in before a work trip. Painless.",
    name: "Priya S.",
    service: "Classic Manicure",
  },
  {
    quote:
      "First salon that's ever asked about my nail health before pushing extensions on me.",
    name: "Chloe M.",
    service: "Extensions",
  },
  {
    quote:
      "The gold foil French was exactly what I sent as a reference. Down to the angle.",
    name: "Bianca R.",
    service: "Nail Art",
  },
];

export default function Reviews() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setCurrent((c) => (c + 1) % REVIEWS.length),
      6000
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="reviews" className="max-w-[1180px] mx-auto px-5 py-22">
      <div className="max-w-[640px] mb-12">
        <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
          Word of mouth
        </p>
        <h2 className="font-serif font-medium text-[clamp(1.9rem,4vw,2.6rem)] mt-3.5">
          What clients say
        </h2>
      </div>

      <div className="overflow-hidden relative">
        <p className="font-serif italic text-[clamp(1.3rem,2.6vw,1.7rem)] leading-relaxed max-w-[60ch]">
          &ldquo;{REVIEWS[current].quote}&rdquo;
        </p>
        <p className="mt-5 text-[0.85rem] font-bold">
          {REVIEWS[current].name}{" "}
          <span className="font-normal text-ink-soft">
            — {REVIEWS[current].service}
          </span>
        </p>
      </div>

      <div className="flex gap-2 mt-7">
        {REVIEWS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Show review ${i + 1}`}
            className={`w-2 h-2 rounded-full border border-gold ${
              i === current ? "bg-gold" : "bg-transparent"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
