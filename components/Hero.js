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
      className="relative min-h-[760px] md:min-h-[850px] overflow-hidden bg-nude"
    >
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 w-[75vw] h-[75vw] max-w-[900px] max-h-[900px] rounded-full bg-gold/10 blur-[100px]" />

        <div className="absolute inset-0 bg-gradient-to-b from-nude/30 via-transparent to-nude" />
      </div>

      {/* IMAGE FIELD */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Main large image */}
        <div
          className={`absolute
            w-[58vw] max-w-[560px]
            h-[68vh] max-h-[700px]
            left-[50%] top-[45%]
            -translate-x-1/2 -translate-y-1/2
            transition-all duration-[1500ms] ease-out
            ${
              loaded
                ? "opacity-100 scale-100 rotate-[-3deg]"
                : "opacity-0 scale-75 rotate-6 translate-y-24"
            }
          `}
          style={{
            animation: loaded
              ? "heroMainFloat 7s ease-in-out infinite"
              : "none",
          }}
        >
          {SLIDES.map((slide, i) => (
            <div
              key={slide.src}
              className={`absolute inset-0 transition-all duration-[1200ms] ease-in-out ${
                i === index
                  ? "opacity-[0.92] scale-100"
                  : "opacity-0 scale-95"
              }`}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={i === 0}
                className="object-cover rounded-[42%_42%_35%_35%/30%_30%_45%_45%] drop-shadow-[0_35px_70px_rgba(0,0,0,0.24)]"
                sizes="(max-width: 768px) 80vw, 560px"
              />

              <div className="absolute inset-0 rounded-[42%_42%_35%_35%/30%_30%_45%_45%] bg-gradient-to-t from-ink/25 via-transparent to-white/5" />
            </div>
          ))}
        </div>

        {/* LEFT IMAGE */}
        <div
          className={`absolute
            w-[30vw] max-w-[310px]
            h-[48vh] max-h-[500px]
            left-[-4%] top-[27%]
            transition-all duration-[1600ms] ease-out delay-200
            ${
              loaded
                ? "opacity-80 translate-x-0 rotate-[-9deg]"
                : "opacity-0 -translate-x-32 rotate-[-18deg]"
            }
          `}
          style={{
            animation: loaded
              ? "heroSideFloat 8s ease-in-out 1s infinite"
              : "none",
          }}
        >
          <Image
            src="/hero-slide-2.jpg"
            alt="Freddy Nails floral French set"
            fill
            className="object-cover rounded-[40%_40%_35%_35%/30%_30%_50%_50%] drop-shadow-[0_25px_50px_rgba(0,0,0,0.18)]"
            sizes="310px"
          />
        </div>

        {/* RIGHT IMAGE */}
        <div
          className={`absolute
            w-[31vw] max-w-[320px]
            h-[50vh] max-h-[520px]
            right-[-4%] top-[24%]
            transition-all duration-[1700ms] ease-out delay-300
            ${
              loaded
                ? "opacity-80 translate-x-0 rotate-[9deg]"
                : "opacity-0 translate-x-32 rotate-[18deg]"
            }
          `}
          style={{
            animation: loaded
              ? "heroSideFloatRight 8.5s ease-in-out 1.5s infinite"
              : "none",
          }}
        >
          <Image
            src="/hero-slide-3.jpg"
            alt="Freddy Nails gilded cross charm set"
            fill
            className="object-cover rounded-[40%_40%_35%_35%/30%_30%_50%_50%] drop-shadow-[0_25px_50px_rgba(0,0,0,0.18)]"
            sizes="320px"
          />
        </div>

        {/* Decorative gold rings */}
        <div
          className={`absolute left-[10%] top-[18%] w-24 h-24 md:w-36 md:h-36 rounded-full border border-gold/30 transition-all duration-[1800ms] ${
            loaded
              ? "opacity-100 scale-100 rotate-0"
              : "opacity-0 scale-50 rotate-45"
          }`}
        />

        <div
          className={`absolute right-[10%] bottom-[15%] w-28 h-28 md:w-44 md:h-44 rounded-full border border-gold/20 transition-all duration-[2000ms] delay-300 ${
            loaded
              ? "opacity-100 scale-100 rotate-0"
              : "opacity-0 scale-50 rotate-[-45deg]"
          }`}
        />
      </div>

      {/* TEXT OVER THE IMAGES */}
      <div className="relative z-40 max-w-[1180px] mx-auto px-5 min-h-[760px] md:min-h-[850px] flex flex-col items-center justify-center text-center">
        <div
          className={`transition-all duration-[1300ms] ease-out ${
            loaded
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <p className="text-[0.72rem] font-bold tracking-[0.25em] uppercase text-gold">
            Freddy Nails Studio
          </p>

          <h1 className="font-serif font-medium leading-[0.92] tracking-tight text-[clamp(3.4rem,9vw,7.5rem)] mt-5">
            Nails, made
            <br />
            <em className="not-italic font-normal italic text-gold-bright">
              an occasion.
            </em>
          </h1>

          <p className="mx-auto mt-6 max-w-[520px] text-[0.98rem] md:text-[1.05rem] leading-relaxed text-ink-soft bg-nude/55 backdrop-blur-[3px] px-4 py-2 rounded-sm">
            A quiet, precise studio for gel manicures, hand-painted art and
            long-wear extensions — for the women who notice detail and the
            professionals who don&apos;t have time to.
          </p>

          <div className="flex flex-wrap justify-center gap-3.5 mt-7">
            <a
              href="#booking"
              className="inline-flex items-center gap-2.5 bg-ink text-nude border border-ink px-7 py-[15px] rounded-sm text-[0.85rem] font-bold uppercase tracking-wide shadow-xl hover:bg-gold hover:border-gold hover:text-ink transition-colors"
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
              className="border border-ink bg-nude/40 backdrop-blur-sm px-6.5 py-[15px] rounded-sm text-[0.85rem] font-bold uppercase tracking-wide hover:bg-ink hover:text-nude transition-colors"
            >
              View services
            </a>
          </div>
        </div>

        {/* Current image caption */}
        <div
          className={`absolute bottom-10 left-1/2 -translate-x-1/2 z-50 text-center transition-all duration-[1200ms] delay-700 ${
            loaded
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
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

      <style jsx>{`
        @keyframes heroMainFloat {
          0%,
          100% {
            transform: translate(-50%, -50%) translateY(0) rotate(-3deg);
          }

          50% {
            transform: translate(-50%, -50%) translateY(-14px) rotate(-1deg);
          }
        }

        @keyframes heroSideFloat {
          0%,
          100% {
            transform: translateY(0) rotate(-9deg);
          }

          50% {
            transform: translateY(-16px) rotate(-6deg);
          }
        }

        @keyframes heroSideFloatRight {
          0%,
          100% {
            transform: translateY(0) rotate(9deg);
          }

          50% {
            transform: translateY(-18px) rotate(6deg);
          }
        }

        @media (max-width: 768px) {
          @keyframes heroMainFloat {
            0%,
            100% {
              transform: translate(-50%, -50%) translateY(0) rotate(-3deg);
            }

            50% {
              transform: translate(-50%, -50%) translateY(-8px) rotate(-1deg);
            }
          }

          @keyframes heroSideFloat {
            0%,
            100% {
              transform: translateY(0) rotate(-9deg);
            }

            50% {
              transform: translateY(-8px) rotate(-6deg);
            }
          }

          @keyframes heroSideFloatRight {
            0%,
            100% {
              transform: translateY(0) rotate(9deg);
            }

            50% {
              transform: translateY(-9px) rotate(6deg);
            }
          }
        }
      `}</style>
    </section>
  );
}
