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
            @keyframes hero-line {
              from { opacity: 0; transform: scaleX(0); }
              to { opacity: 1; transform: scaleX(1); }
            }
            .hero-photo-anim {
              animation: hero-kenburns 22s ease-in-out infinite alternate;
              will-change: transform;
            }
            .hero-rise-1 { animation: hero-fade-up 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both; }
            .hero-rise-3 { animation: hero-fade-up 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both; }
            .hero-line-anim {
              transform-origin: left center;
              animation: hero-line 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.32s both;
            }
            @media (prefers-reduced-motion: reduce) {
              .hero-photo-anim,
              .hero-rise-1,
              .hero-rise-3,
              .hero-line-anim {
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

        {/* Light left fade — only enough for text, nails stay bright on the right */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(12,11,10,0.92) 0%, rgba(12,11,10,0.72) 18%, rgba(12,11,10,0.35) 34%, rgba(12,11,10,0.12) 48%, transparent 62%)",
          }}
        />

        {/* Very light top under header */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(12,11,10,0.35) 0%, transparent 14%)",
          }}
        />

        {/* Soft bottom blend only — short fade, nails still visible */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[22%] md:h-[26%]"
          style={{
            background:
              "linear-gradient(to top, #0c0b0a 0%, rgba(12,11,10,0.75) 35%, rgba(12,11,10,0.25) 70%, transparent 100%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1180px] px-5 pb-20 pt-20 md:pb-28 md:pt-24">
        <div className="max-w-[560px]">
          <h1
            className={`font-serif text-[clamp(2.6rem,6vw,4.2rem)] font-medium leading-[1.05] text-[#f4eee6] drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)] ${
              ready ? "hero-rise-1" : "opacity-0"
            }`}
          >
            Nails by Freddy,
            <br />
            Crafted to Perfection
          </h1>

          <div
            className={`mt-6 h-px w-16 bg-[#d6b36a]/80 ${
              ready ? "hero-line-anim" : "opacity-0"
            }`}
          />

          <p
            className={`mt-6 max-w-[42ch] text-[1.05rem] leading-relaxed text-[#e8e0d6] drop-shadow-[0_1px_12px_rgba(0,0,0,0.5)] ${
              ready ? "hero-rise-3" : "opacity-0"
            }`}
          >
            Luxury nail services designed to elevate your style and confidence.
          </p>
        </div>
      </div>
    </section>
  );
}
