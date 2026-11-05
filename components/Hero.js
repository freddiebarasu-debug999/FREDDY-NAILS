"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-[100svh] md:min-h-[860px] flex items-center overflow-hidden bg-[#0c0b0a]"
    >
      {/* Background photography with depth */}
      <div className="absolute inset-0">
        <Image
          src="/hero-slide-1.jpg"
          alt="Freddy Nails — signature nail art"
          fill
          priority
          sizes="100vw"
          className={`object-cover object-[72%_center] md:object-[78%_center] scale-105 transition-transform duration-[1.8s] ease-out ${
            ready ? "scale-100" : "scale-105"
          }`}
        />
        {/* Cinematic multi-stop fade so full fingers stay visible on the right */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #0c0b0a 0%, #0c0b0a 28%, rgba(12,11,10,0.88) 42%, rgba(12,11,10,0.45) 58%, rgba(12,11,10,0.12) 72%, transparent 88%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b0a] via-transparent to-[#0c0b0a]/35" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(214,179,106,0.12),transparent_55%)]" />
      </div>

      {/* Soft gold particles (CSS only — light on mobile) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-60" aria-hidden>
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            className="absolute block rounded-full bg-[#d6b36a]/40 blur-[1px] animate-float-gold"
            style={{
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              left: `${8 + i * 7.5}%`,
              top: `${15 + (i * 13) % 70}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${6 + (i % 5)}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1180px] px-5 py-24 md:py-28">
        <div
          className={`max-w-[560px] transition-all duration-1000 ease-out ${
            ready ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.28em] text-[#d6b36a]">
            Quigney · East London
          </p>

          <h1
            className="mt-5 font-serif font-medium leading-[1.05] text-[clamp(2.75rem,7vw,4.5rem)] text-[#f4eee6]"
            style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
          >
            Nails, Made an{" "}
            <span className="italic text-[#d6b36a]">Occasion.</span>
          </h1>

          <div className="mt-6 h-px w-20 bg-gradient-to-r from-[#d6b36a] to-transparent" />

          <p className="mt-6 max-w-[42ch] text-[1.05rem] leading-relaxed text-[#c9c0b6]">
            Beautifully crafted nail experiences, designed around your style —
            acrylics, gels, art and more at Freddy Nails Studio.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-sm border border-[#d6b36a]/70 bg-transparent px-6 py-3.5 text-[0.8rem] font-bold uppercase tracking-[0.12em] text-[#d6b36a] transition-all hover:bg-[#d6b36a]/10"
            >
              Explore Services
            </Link>
            <Link
              href="/account/book"
              className="inline-flex items-center justify-center rounded-sm bg-[#d6b36a] px-6 py-3.5 text-[0.8rem] font-bold uppercase tracking-[0.12em] text-[#11100f] shadow-[0_0_32px_rgba(214,179,106,0.25)] transition-all hover:bg-[#e4c57a] hover:shadow-[0_0_40px_rgba(214,179,106,0.35)]"
            >
              Book an Appointment
            </Link>
          </div>

          <p className="mt-8 text-[0.72rem] uppercase tracking-[0.2em] text-[#8f877e]">
            Crafted to Perfection · By appointment
          </p>
        </div>
      </div>
    </section>
  );
}
