"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

/** Try-on promo — phone mockup + checklist, matches reference */

const SLIDES = [
  { src: "/gallery/gallery-7.jpg", alt: "Try-on look 1" },
  { src: "/gallery/gallery-1.jpg", alt: "Try-on look 2" },
  { src: "/gallery/gallery-3.jpg", alt: "Try-on look 3" },
];

const FEATURES = [
  "Realistic hand detection",
  "Multiple nail shapes & lengths",
  "Colours, finishes & design uploads",
  "Download your look or book it",
];

export default function TryOnPromo() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="bg-[#0c0b0a] text-[#f4eee6]">
      <div className="max-w-[1180px] mx-auto px-5 py-14 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
          {/* Phone mockup */}
          <div className="relative mx-auto w-full max-w-[300px]">
            <div className="relative aspect-[9/16] overflow-hidden rounded-[2rem] border border-white/10 bg-[#181614] shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
              <div className="absolute top-0 inset-x-0 h-7 bg-black/40 z-10 flex items-center justify-center">
                <span className="h-1.5 w-16 rounded-full bg-white/20" />
              </div>
              <Image
                src={SLIDES[i].src}
                alt={SLIDES[i].alt}
                fill
                sizes="300px"
                className="object-cover"
              />
              <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5 z-10">
                {SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Slide ${idx + 1}`}
                    onClick={() => setI(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === i ? "w-5 bg-[#d6b36a]" : "w-1.5 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Copy */}
          <div>
            <h2
              className="text-[clamp(1.8rem,3.5vw,2.5rem)] font-medium leading-tight"
              style={{ fontFamily: "var(--font-fraunces), serif" }}
            >
              Try It On Virtually
            </h2>
            <p className="mt-2 text-[#d6b36a] text-sm font-medium">
              Find your perfect look before you book.
            </p>
            <p className="mt-4 text-[#c9c0b6] leading-relaxed max-w-[42ch]">
              Upload a photo of your hand and explore different nail shapes,
              colours, finishes and designs — all in real time. Our virtual
              try-on helps you visualise your next set with confidence.
            </p>

            <ul className="mt-6 space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#e8e0d6]">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d6b36a]/15 text-[#d6b36a] text-xs">
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Link
                href="/try-on"
                className="inline-flex items-center gap-2 rounded-full bg-[#d6b36a] px-6 py-3.5 text-[0.75rem] font-bold uppercase tracking-[0.14em] text-[#11100f] transition-colors hover:bg-[#e0c078]"
              >
                Try it now
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
