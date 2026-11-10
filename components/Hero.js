"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function Hero() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setReady(true);
      return;
    }
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section
      id="home"
      className="relative flex min-h-[70vh] items-center overflow-hidden md:min-h-[78vh]"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes hero-kenburns {
              0% { transform: scale(1.04) translate3d(0, 0, 0); }
              100% { transform: scale(1.09) translate3d(-1%, 0.5%, 0); }
            }
            @keyframes hero-fade-up {
              from { opacity: 0; transform: translate3d(0, 24px, 0); }
              to { opacity: 1; transform: translate3d(0, 0, 0); }
            }
            .hero-photo-anim {
              animation: hero-kenburns 22s ease-in-out infinite alternate;
              will-change: transform;
            }
            .hero-rise-1 { animation: hero-fade-up 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both; }
            .hero-rise-2 { animation: hero-fade-up 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.25s both; }
            .hero-rise-3 { animation: hero-fade-up 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both; }
            .hero-headline {
              font-family: var(--font-anton), 'Archivo Black', 'Oswald', sans-serif;
              font-weight: 400;
              letter-spacing: -0.01em;
            }
            .hero-badge {
              font-family: var(--font-inter), sans-serif;
              letter-spacing: 0.14em;
            }
            .hero-sub {
              font-family: var(--font-inter), sans-serif;
            }
            @media (prefers-reduced-motion: reduce) {
              .hero-photo-anim,
              .hero-rise-1,
              .hero-rise-2,
              .hero-rise-3 {
                animation: none !important;
                opacity: 1 !important;
                transform: none !important;
              }
            }
          `,
        }}
      />

      <div className="absolute inset-0">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/hero-slide-1.jpg"
            alt="Freddy Nails gold leaf signature set"
            fill
            priority
            sizes="100vw"
            className={`object-cover object-[72%_center] md:object-[78%_center] ${
              ready ? "hero-photo-anim" : "scale-105"
            }`}
          />
        </div>

        {/* Light left fade — reduced, hand stays bright */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(12,11,10,0.82) 0%, rgba(12,11,10,0.58) 18%, rgba(12,11,10,0.28) 34%, rgba(12,11,10,0.10) 48%, transparent 62%)",
          }}
        />

        {/* Very light top under header */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(12,11,10,0.30) 0%, transparent 14%)",
          }}
        />

        {/* Soft bottom blend only */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[18%] md:h-[22%]"
          style={{
            background:
              "linear-gradient(to top, #0c0b0a 0%, rgba(12,11,10,0.65) 35%, rgba(12,11,10,0.20) 70%, transparent 100%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1180px] px-5 pb-20 pt-20 md:pb-28 md:pt-24">
        <div className="max-w-[640px]">
          <div
            className={`inline-flex items-center rounded-full border border-[#c9a86a]/70 px-3.5 py-1.5 ${
              ready ? "hero-rise-1" : "opacity-0"
            }`}
          >
            <span className="hero-badge text-[11px] font-medium uppercase text-[#c9a86a] md:text-xs">
              Quigney • East London
            </span>
          </div>

          <h1
            className={`hero-headline mt-5 text-[clamp(3.4rem,9.5vw,6.8rem)] uppercase leading-[0.88] text-[#fdf8f0] drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)] ${
              ready ? "hero-rise-2" : "opacity-0"
            }`}
          >
            Hands /
            <br />
            That /
            <br />
            Talk.
          </h1>

          <p
            className={`hero-sub mt-6 max-w-[32ch] text-[1.05rem] leading-relaxed text-[#f4eee6] drop-shadow-[0_1px_12px_rgba(0,0,0,0.5)] md:text-[1.15rem] ${
              ready ? "hero-rise-3" : "opacity-0"
            }`}
          >
            Luxury nails, built to turn heads.
          </p>
        </div>
      </div>
    </section>
  );
}
