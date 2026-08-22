"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SLIDES = [
  {
    src: "/hero-slide-1.jpg",
    alt: "Freddy Nails gold leaf signature branded set",
    caption: "Gold Leaf Signature",
  },
  {
    src: "/hero-slide-2.jpg",
    alt: "Freddy Nails pink and white floral French set",
    caption: "Floral French Set",
  },
  {
    src: "/hero-slide-3.jpg",
    alt: "Freddy Nails gilded cross charm set",
    caption: "Gilded Cross Set",
  },
];

export default function Hero() {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);

    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      id="home"
      className="max-w-[1180px] mx-auto px-5 py-16 md:py-24 grid gap-10 md:grid-cols-[1.05fr_0.95fr] md:items-center overflow-hidden"
    >
      {/* LEFT SIDE */}
      <div
        className={`transition-all duration-[1200ms] ease-out ${
          loaded
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-10"
        }`}
      >
        <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
          Freddy Nails Studio
        </p>

        <h1 className="font-serif font-medium leading-[1.02] tracking-tight text-[clamp(2.5rem,6vw,4.3rem)] mt-4 mb-5">
          Nails, made
          <br />
          <em className="not-italic font-normal italic text-gold-bright">
            an occasion.
          </em>
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
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.28-1.38c1.45.79 3.08 1.21 4.71 1.21h.01c5.46 0 9.9-4.45 9.9-9.91c0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" />
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

      {/* RIGHT SIDE — FLOATING TRANSPARENT HERO */}
      <div className="relative min-h-[500px] md:min-h-[620px] flex items-center justify-center">
        {/* Soft luxury glow */}
        <div
          className={`absolute w-[75%] aspect-square rounded-full bg-gold/10 blur-[80px] transition-all duration-[1600ms] ${
            loaded ? "opacity-100 scale-100" : "opacity-0 scale-50"
          }`}
        />

        {/* Main image */}
        <div
          className={`absolute z-20 w-[68%] max-w-[330px] aspect-[4/5] transition-all duration-[1400ms] ease-out ${
            loaded
              ? "opacity-100 translate-y-0 scale-100 rotate-0"
              : "opacity-0 translate-y-32 scale-75 rotate-6"
          }`}
          style={{
            animation: loaded
              ? "heroFloat 6s ease-in-out infinite"
              : "none",
          }}
        >
          {SLIDES.map((slide, i) => (
            <div
              key={slide.src}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                i === index
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95"
              }`}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={i === 0}
                className="object-cover rounded-[45%_45%_42%_42%/30%_30%_55%_55%] drop-shadow-[0_25px_45px_rgba(0,0,0,0.25)]"
                sizes="(max-width: 768px) 65vw, 330px"
              />
            </div>
          ))}
        </div>

        {/* Floating secondary image */}
        <div
          className={`absolute z-30 right-[2%] top-[10%] w-[25%] max-w-[125px] aspect-square transition-all duration-[1600ms] ease-out delay-300 ${
            loaded
              ? "opacity-100 translate-x-0 translate-y-0 rotate-6"
              : "opacity-0 translate-x-20 -translate-y-10 rotate-12"
          }`}
          style={{
            animation: loaded
              ? "heroFloatSmall 5s ease-in-out 1s infinite"
              : "none",
          }}
        >
          <Image
            src="/hero-slide-2.jpg"
            alt="Freddy Nails floral French set"
            fill
            className="object-cover rounded-full border border-gold/40 shadow-xl"
            sizes="125px"
          />
        </div>

        {/* Floating third image */}
        <div
          className={`absolute z-30 left-[3%] bottom-[13%] w-[24%] max-w-[120px] aspect-square transition-all duration-[1600ms] ease-out delay-500 ${
            loaded
              ? "opacity-100 translate-x-0 translate-y-0 -rotate-6"
              : "opacity-0 -translate-x-20 translate-y-10 -rotate-12"
          }`}
          style={{
            animation: loaded
              ? "heroFloatSmall 5.5s ease-in-out 1.5s infinite"
              : "none",
          }}
        >
          <Image
            src="/hero-slide-3.jpg"
            alt="Freddy Nails gilded cross charm set"
            fill
            className="object-cover rounded-full border border-gold/40 shadow-xl"
            sizes="120px"
          />
        </div>

        {/* Gold decorative ring */}
        <div
          className={`absolute z-10 w-[82%] max-w-[410px] aspect-square rounded-full border border-gold/25 transition-all duration-[1800ms] ${
            loaded
              ? "opacity-100 scale-100 rotate-0"
              : "opacity-0 scale-75 rotate-45"
          }`}
        />

        {/* Caption */}
        <div
          className={`absolute z-40 bottom-4 left-1/2 -translate-x-1/2 text-center whitespace-nowrap transition-all duration-[1200ms] delay-700 ${
            loaded
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-[0.65rem] font-bold tracking-[0.22em] uppercase text-gold">
            Signature finish
          </p>

          <p className="font-serif text-xl mt-1.5 text-ink">
            {SLIDES[index].caption}
          </p>
        </div>

        {/* Slide controls */}
        <div className="absolute z-50 bottom-[-5px] right-0 flex gap-2">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              aria-label={`Show slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index
                  ? "w-6 bg-gold-bright"
                  : "w-1.5 bg-ink/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Animation */}
      <style jsx>{`
        @keyframes heroFloat {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }

          50% {
            transform: translateY(-12px) rotate(1deg);
          }
        }

        @keyframes heroFloatSmall {
          0%,
          100% {
            transform: translateY(0) rotate(6deg);
          }

          50% {
            transform: translateY(-10px) rotate(2deg);
          }
        }

        @media (max-width: 768px) {
          @keyframes heroFloat {
            0%,
            100% {
              transform: translateY(0);
            }

            50% {
              transform: translateY(-7px);
            }
          }

          @keyframes heroFloatSmall {
            0%,
            100% {
              transform: translateY(0);
            }

            50% {
              transform: translateY(-6px);
            }
          }
        }
      `}</style>
    </div>
  );
}
