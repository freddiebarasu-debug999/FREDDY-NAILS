"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function Hero() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section id="home" className="relative overflow-hidden bg-[#0C0B0A] pt-20 pb-10 md:pt-24">
      <div className="mx-auto w-full max-w-[1180px] px-5">

        {/* TOP BAR */}
        <div className="mb-6 flex items-center justify-between">
          <span className="font-serif text-2xl font-bold tracking-[0.15em] text-white">
            FREDDY<span className="text-[#FF4D8D]">.</span>
          </span>
          <a href="#book" className="rounded-full bg-[#FF4D8D] px-5 py-2.5 text-sm font-bold text-white">
            BOOK NOW
          </a>
        </div>

        {/* HERO CARD - YOUR ORIGINAL IMAGE */}
        <div className="relative flex min-h-[560px] items-center overflow-hidden rounded-[28px] bg-[#151312] md:min-h-[520px]">
          
          {/* YOUR EXISTING HERO IMAGE - NOT THE NEW ONE */}
          <div className="absolute inset-0">
            <Image
              src="/hero-slide-1.jpg"
              alt="Freddy Nails gold leaf signature set"
              fill
              priority
              sizes="100vw"
              className="object-cover object-[70%_center] md:object-[75%_center]"
            />
            {/* TRANSPARENT fade - only on left for text, hand stays clear */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0C0B0A] via-[#0C0B0A]/70 via-35% to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>

          {/* YOUR ORIGINAL INSCRIPTION */}
          <div className={`relative z-10 max-w-[580px] p-6 md:p-10 transition-all duration-700 ${ready ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
            <span className="inline-block rounded-full bg-black px-4 py-2 text-[11px] font-bold tracking-[0.25em] text-white">
              QUIGNEY • EAST LONDON
            </span>

            <h1 className="mt-6 font-serif text-[clamp(2.6rem,6vw,4.2rem)] font-medium leading-[1.05] text-[#f4eee6]">
              Nails by Freddy,
              <br />
              Crafted to Perfection
            </h1>

            <div className="mt-6 h-px w-16 bg-[#D6B36A]/70" />

            <p className="mt-6 max-w-[42ch] text-[1.05rem] leading-relaxed text-[#E8E0D8]">
              Luxury nail services designed to elevate your style and confidence.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#book" className="rounded-full bg-[#FF4D8D] px-7 py-3.5 text-sm font-bold text-white shadow-lg">
                BOOK YOUR SET
              </a>
              <a href="#gallery" className="rounded-full border border-white/70 px-7 py-3.5 text-sm font-bold text-white">
                SEE THE WORK
              </a>
            </div>
          </div>
        </div>

        {/* PRICE PILLS */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: "ACRYLIC", price: "R350+" },
            { label: "GEL", price: "R250+" },
            { label: "PEDICURE", price: "R300+" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-[#151312] px-4 py-4 text-center">
              <p className="text-sm font-bold text-white">{s.label}</p>
              <p className="mt-1 text-sm font-bold text-[#FF4D8D]">{s.price}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
