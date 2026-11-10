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
      className="relative flex min-h-[92vh] items-center overflow-hidden bg-[#0c0b0a] md:min-h-[82vh]"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes hero-kenburns {
              0% { transform: scale(1.0) translate3d(0, 0, 0); }
              100% { transform: scale(1.03) translate3d(-0.5%, 0.3%, 0); }
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
              letter-spacing: 0.01em;
              line-height: 0.98;
            }
            .hero-headline span { display: block; }
            .hero-badge {
              font-family: var(--font-inter), sans-serif;
              letter-spacing: 0.14em;
            }
            .hero-sub {
              font-family: var(--font-inter), sans-serif;
            }
            /* MOBILE EXACT FADE - matches mockup: solid black left panel */
            .hero-fade-mobile {
              background: linear-gradient(90deg, #0c0b0a 0%, #0c0b0a 38%, rgba(12,11,10,0.88) 46%, rgba(12,11,10,0.45) 58%, rgba(12,11,10,0.12) 68%, transparent 78%);
            }
            /* DESKTOP - softer, full-bleed */
            .hero-fade-desktop {
              background: linear-gradient(90deg, rgba(12,11,10,0.82) 0%, rgba(12,11,10,0.58) 18%, rgba(12,11,10,0.28) 34%, rgba(12,11,10,0.10) 48%, transparent 62%);
            }
            @media (prefers-reduced-motion: reduce) {
              .hero-photo-anim, .hero-rise-1, .hero-rise-2, .hero-rise-3 {
                animation: none !important;
                opacity: 1 !important;
                transform: none !important;
              }
            }
          `,
        }}
      />

      {/* BACKGROUND: on mobile image is SMALLER - only right 72%, left is solid black */}
      <div className="absolute inset-0 bg-[#0c0b0a]">
        {/* Mobile image - right side only */}
        <div className="absolute inset-y-0 right-0 w-[72%] overflow-hidden md:hidden">
          <Image
            src="/hero-slide-1.jpg"
            alt="Freddy Nails gold leaf signature set"
            fill
            priority
            sizes="72vw"
            className={`object-cover object-[68%_center] ${ready ? "hero-photo-anim" : "scale-100"}`}
          />
        </div>
        {/* Desktop image - full bleed */}
        <div className="absolute inset-0 hidden overflow-hidden md:block">
          <Image
            src="/hero-slide-1.jpg"
            alt="Freddy Nails gold leaf signature set"
            fill
            priority
            sizes="100vw"
            className={`object-cover object-[68%_center] ${ready ? "hero-photo-anim" : "scale-100"}`}
          />
        </div>

        {/* FADE - mobile exact, desktop soft */}
        <div className="hero-fade-mobile absolute inset-0 md:hidden" />
        <div className="hero-fade-desktop absolute inset-0 hidden md:block" />

        {/* Top + bottom blends */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(12,11,10,0.30) 0%, transparent 14%)" }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[16%] md:h-[20%]"
          style={{ background: "linear-gradient(to top, #0c0b0a 0%, rgba(12,11,10,0.60) 35%, rgba(12,11,10,0.18) 70%, transparent 100%)" }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1180px] px-5 pb-16 pt-36 md:pb-28 md:pt-28">
        <div className="max-w-[620px]">
          <div
            className={`inline-flex items-center rounded-full border border-[#c9a86a]/70 bg-black/25 px-3.5 py-1.5 backdrop-blur-[2px] ${
              ready ? "hero-rise-1" : "opacity-0"
            }`}
          >
            <span className="hero-badge text-[11px] font-medium uppercase text-[#c9a86a] md:text-xs">
              Quigney • East London
            </span>
          </div>

          {/* LARGE on mobile, with real space between lines - no overlap */}
          <h1
            className={`hero-headline mt-5 text-[clamp(4.1rem,21vw,5.6rem)] uppercase text-[#fdf8f0] drop-shadow-[0_2px_18px_rgba(0,0,0,0.6)] md:text-[clamp(4rem,7vw,6.8rem)] ${
              ready ? "hero-rise-2" : "opacity-0"
            }`}
          >
            <span>Hands /</span>
            <span>That /</span>
            <span>Talk.</span>
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
