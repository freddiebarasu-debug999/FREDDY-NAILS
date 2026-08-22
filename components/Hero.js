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
      setIndex((current) => (current + 1) % SLIDES.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-nude"
    >
      <div className="relative max-w-[1180px] mx-auto min-h-[720px] md:min-h-[760px] px-5 py-16 md:py-20 grid md:grid-cols-[0.9fr_1.1fr] items-center gap-4">

        {/* SUBTLE BACKGROUND GLOW */}
        <div className="absolute pointer-events-none w-[650px] h-[650px] rounded-full bg-gold/10 blur-[110px] right-[-100px] top-1/2 -translate-y-1/2" />

        {/* LEFT — BRAND / INSCRIPTION */}
        <div
          className={`relative z-40 max-w-[540px] transition-all duration-[1200ms] ease-out ${
            loaded
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-10"
          }`}
        >
          <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
            Freddy Nails Studio
          </p>

          <h1 className="font-serif font-medium leading-[1.02] tracking-tight text-[clamp(2.8rem,6vw,4.8rem)] mt-4 mb-5">
            Nails, made
            <br />
            <em className="not-italic font-normal italic text-gold-bright">
              an occasion.
            </em>
          </h1>

          <p className="text-[1.02rem] leading-relaxed max-w-[46ch] text-ink-soft">
            A quiet, precise studio for gel manicures, hand-painted art and
            long-wear extensions — for the women who notice detail and the
            professionals who don&apos;t have time to.
          </p>

          <div className="flex flex-wrap gap-3.5 mt-7">
            <a
              href="#gallery"
              className="inline-flex items-center justify-center bg-ink text-nude border border-ink px-7 py-[15px] rounded-sm text-[0.85rem] font-bold uppercase tracking-wide hover:bg-gold hover:border-gold hover:text-ink transition-colors"
            >
              Explore the Artistry
            </a>

            <a
              href="#shape-guide"
              className="inline-flex items-center justify-center border border-ink bg-transparent px-6 py-[15px] rounded-sm text-[0.85rem] font-bold uppercase tracking-wide hover:bg-ink hover:text-nude transition-colors"
            >
              Discover Your Style
            </a>
          </div>
        </div>

        {/* RIGHT — FLOATING IMAGE FIELD */}
        <div className="relative min-h-[540px] md:min-h-[650px]">

          {/* Decorative ring */}
          <div
            className={`absolute z-0 w-[78%] aspect-square rounded-full border border-gold/25 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-[1800ms] ${
              loaded
                ? "opacity-100 scale-100 rotate-0"
                : "opacity-0 scale-75 rotate-45"
            }`}
          />

          {/* MAIN IMAGE */}
          <div
            className={`absolute z-20
              w-[58%] md:w-[55%]
              aspect-[4/5]
              left-[23%] top-[8%]
              transition-all duration-[1400ms] ease-out
              ${
                loaded
                  ? "opacity-100 translate-y-0 scale-100 rotate-[-3deg]"
                  : "opacity-0 translate-y-28 scale-75 rotate-6"
              }
            `}
            style={{
              animation: loaded
                ? "mainFloat 7s ease-in-out infinite"
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
                  className="object-cover rounded-[38%_38%_30%_30%/28%_28%_45%_45%] drop-shadow-[0_30px_55px_rgba(0,0,0,0.22)]"
                  sizes="(max-width: 768px) 55vw, 420px"
                />
              </div>
            ))}
          </div>

          {/* LEFT FLOATING IMAGE */}
          <div
            className={`absolute z-10
              w-[31%] aspect-[4/5]
              left-[0%] top-[32%]
              transition-all duration-[1500ms] ease-out delay-200
              ${
                loaded
                  ? "opacity-85 translate-x-0 rotate-[-10deg]"
                  : "opacity-0 -translate-x-24 rotate-[-20deg]"
              }
            `}
            style={{
              animation: loaded
                ? "leftFloat 8s ease-in-out 1s infinite"
                : "none",
            }}
          >
            <Image
              src="/hero-slide-2.jpg"
              alt="Freddy Nails floral French set"
              fill
              className="object-cover rounded-[38%_38%_30%_30%/28%_28%_45%_45%] drop-shadow-[0_20px_40px_rgba(0,0,0,0.18)]"
              sizes="220px"
            />
          </div>

          {/* RIGHT FLOATING IMAGE */}
          <div
            className={`absolute z-10
              w-[30%] aspect-[4/5]
              right-[0%] top-[25%]
              transition-all duration-[1600ms] ease-out delay-300
              ${
                loaded
                  ? "opacity-85 translate-x-0 rotate-[10deg]"
                  : "opacity-0 translate-x-24 rotate-[20deg]"
              }
            `}
            style={{
              animation: loaded
                ? "rightFloat 8.5s ease-in-out 1.5s infinite"
                : "none",
            }}
          >
            <Image
              src="/hero-slide-3.jpg"
              alt="Freddy Nails gilded cross charm set"
              fill
              className="object-cover rounded-[38%_38%_30%_30%/28%_28%_45%_45%] drop-shadow-[0_20px_40px_rgba(0,0,0,0.18)]"
              sizes="220px"
            />
          </div>

          {/* CAPTION */}
          <div
            className={`absolute z-30 bottom-[3%] left-1/2 -translate-x-1/2 text-center whitespace-nowrap transition-all duration-[1200ms] delay-700 ${
              loaded
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }`}
          >
            <p className="text-[0.65rem] font-bold tracking-[0.22em] uppercase text-gold">
              Signature finish
            </p>

            <p className="font-serif text-xl mt-1.5">
              {SLIDES[index].caption}
            </p>

            <div className="flex justify-center gap-2 mt-3">
              {SLIDES.map((slide, i) => (
                <button
                  key={slide.src}
                  type="button"
                  aria-label={`Show slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index
                      ? "w-7 bg-gold-bright"
                      : "w-1.5 bg-ink/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes mainFloat {
          0%,
          100% {
            transform: translateY(0) rotate(-3deg);
          }

          50% {
            transform: translateY(-12px) rotate(-1deg);
          }
        }

        @keyframes leftFloat {
          0%,
          100% {
            transform: translateY(0) rotate(-10deg);
          }

          50% {
            transform: translateY(-15px) rotate(-7deg);
          }
        }

        @keyframes rightFloat {
          0%,
          100% {
            transform: translateY(0) rotate(10deg);
          }

          50% {
            transform: translateY(-17px) rotate(7deg);
          }
        }

        @media (max-width: 768px) {
          @keyframes mainFloat {
            0%,
            100% {
              transform: translateY(0) rotate(-3deg);
            }

            50% {
              transform: translateY(-7px) rotate(-1deg);
            }
          }

          @keyframes leftFloat {
            0%,
            100% {
              transform: translateY(0) rotate(-10deg);
            }

            50% {
              transform: translateY(-8px) rotate(-7deg);
            }
          }

          @keyframes rightFloat {
            0%,
            100% {
              transform: translateY(0) rotate(10deg);
            }

            50% {
              transform: translateY(-9px) rotate(7deg);
            }
          }
        }
      `}</style>
    </section>
  );
}
