"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SLIDES = [
  { src: "/hero-slide-1.jpg", alt: "Freddy Nails gold leaf signature branded set", caption: "Gold Leaf Signature" },
  { src: "/hero-slide-2.jpg", alt: "Freddy Nails pink and white floral French set", caption: "Floral French Set" },
  { src: "/hero-slide-3.jpg", alt: "Freddy Nails gilded cross charm set", caption: "Gilded Cross Set" },
];

export default function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      id="home"
      className="max-w-[1180px] mx-auto px-5 py-16 md:py-24 grid gap-9 md:grid-cols-[1.1fr_0.9fr] md:items-center"
    >
      <div>
        <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
          Freddy Nails Studio
        </p>
        <h1 className="font-serif font-medium leading-[1.02] tracking-tight text-[clamp(2.5rem,6vw,4.3rem)] mt-4 mb-5">
          Nails, made
          <br />
          <em className="not-italic font-normal italic text-gold-bright">an occasion.</em>
        </h1>
        <p className="text-[1.08rem] leading-relaxed max-w-[46ch] text-ink-soft">
          A quiet, precise studio for gel manicures, hand-painted art and
          long-wear extensions — for the women who notice detail and the
          professionals who don&apos;t have time to.
        </p>
        <div className="flex flex-wrap gap-3.5 mt-7">
          <a
            href="#booking"
            className="inline-flex items-center gap-2.5 bg-ink text-nude border border-ink px-7 py-[15px] rounded-sm text-[0.85rem] font-bold uppercase tracking-wide hover:bg-gold hover:border-gold hover:text-ink transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.28-1.38c1.45.79 3.08 1.21 4.71 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" />
            </svg>
            Book on WhatsApp
          </a>
          <a
            href="#services"
            className="border border-ink px-6.5 py-[15px] rounded-sm text-[0.85rem] font-bold uppercase tracking-wide hover:bg-ink hover:text-nude transition-colors"
          >
            View services
          </a>
        </div>
      </div>

      <div className="relative aspect-[4/5] rounded overflow-hidden border border-line">
        {SLIDES.map((slide, i) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            fill
            priority={i === 0}
            className={`object-cover transition-opacity duration-1000 ease-in-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            sizes="(max-width: 768px) 100vw, 45vw"
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute left-6 bottom-6 text-nude">
          <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold-bright">
            Signature finish
          </p>
          <p className="font-serif text-2xl mt-1.5">{SLIDES[index].caption}</p>
        </div>
        <div className="absolute right-5 bottom-6 flex gap-2">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.src}
              aria-label={`Show slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-gold-bright" : "w-1.5 bg-nude/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
