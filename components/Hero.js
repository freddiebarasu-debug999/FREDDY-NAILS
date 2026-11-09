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
      className="relative flex min-h-[70vh] items-center overflow-hidden md:min-h-[78vh]"
    >
      {/* Photo layer */}
      <div className="absolute inset-0">
        <Image
          src="/hero-slide-1.jpg"
          alt="Freddy Nails gold leaf signature set"
          fill
          priority
          sizes="100vw"
          className={`object-cover object-[70%_center] transition-transform duration-[1.6s] ease-out md:object-[75%_center] ${
            ready ? "scale-100" : "scale-105"
          }`}
        />

        {/* Left readability fade - LIGHTER NOW, photo shows more */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(12,11,10,0.82) 0%, rgba(12,11,10,0.65) 22%, rgba(12,11,10,0.35) 38%, rgba(12,11,10,0.10) 55%, transparent 72%)",
          }}
        />

        {/* Soft top (under header) - LIGHTER */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(12,11,10,0.25) 0%, transparent 18%)",
          }}
        />

        {/* Bottom blend - SHORTER + LIGHTER, no hard black block */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[22%] md:h-[25%]"
          style={{
            background:
              "linear-gradient(to top, rgba(12,11,10,0.75) 0%, rgba(12,11,10,0.35) 45%, transparent 100%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1180px] px-5 pb-24 pt-20 md:pb-32 md:pt-24">
        <div
          className={`max-w-[620px] transition-all duration-700 ease-out ${
            ready ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <h1 className="font-serif text-[clamp(2.6rem,6vw,4.2rem)] font-medium leading-[1.05] text-[#f4eee6]">
            Nails by Freddy,
            <br />
            Crafted to Perfection
          </h1>

          <div
            className={`mt-6 h-px w-16 origin-left bg-[#d6b36a]/70 transition-all delay-150 duration-700 ${
              ready ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
            }`}
          />

          <p
            className={`mt-6 max-w-[46ch] text-[1.05rem] leading-relaxed text-[#c9c0b6] transition-all delay-200 duration-700 ${
              ready ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            Luxury nail services designed to elevate your style and confidence.
          </p>
        </div>
      </div>
    </section>
  );
}
