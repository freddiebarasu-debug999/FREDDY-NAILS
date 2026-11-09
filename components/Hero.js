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
    <section
      id="home"
      className="relative min-h-[640px] md:min-h-[760px] flex items-center overflow-hidden bg-[#0c0b0a]"
    >
      <div className="absolute inset-0">
        <Image
          src="/hero-slide-1.jpg"
          alt="Freddy Nails gold leaf signature set"
          fill
          priority
          sizes="100vw"
          className={`object-cover transition-transform duration-[1.6s] ease-out ${
            ready ? "scale-100" : "scale-105"
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c0b0a] via-[#0c0b0a]/70 to-[#0c0b0a]/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b0a]/60 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1180px] px-5 pt-16 md:pt-20">
        <div
          className={`max-w-[620px] transition-all duration-700 ease-out ${
            ready
              ? "translate-y-0 opacity-100"
              : "translate-y-10 opacity-0"
          }`}
        >
          <h1 className="font-serif font-medium leading-[1.05] text-[clamp(2.6rem,6vw,4.2rem)] text-[#f4eee6]">
            Nails by Freddy,
            <br />
            Crafted to Perfection
          </h1>

          <div
            className={`mt-6 h-px w-16 bg-[#d6b36a]/70 transition-all delay-150 duration-700 ${
              ready ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
            } origin-left`}
          />

          <p
            className={`mt-6 max-w-[46ch] text-[1.05rem] leading-relaxed text-[#c9c0b6] transition-all delay-200 duration-700 ${
              ready ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            Luxury nail services designed to elevate your style and confidence.
          </p>

          <div
            className={`mt-6 transition-all delay-300 duration-700 ${
              ready ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            <a
              href="/account/book"
              className="inline-flex items-center gap-2 rounded-sm border border-[#d6b36a] px-5 py-2.5 text-[0.8rem] font-semibold text-[#d6b36a] transition-colors hover:bg-[#d6b36a] hover:text-[#11100f]"
            >
              Book now
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
