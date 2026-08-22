"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SLIDES = [
  { src: "/about-slide-2.jpg", alt: "Freddy in the Freddy Nails studio" },
  { src: "/about-slide-3.jpg", alt: "Freddy, founder of Freddy Nails" },
];

export default function About() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="about"
      className="relative max-w-[1180px] mx-auto px-5 py-22"
    >
      {/* Section heading */}
      <div className="max-w-[820px] mx-auto mb-14">
        <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-[#d6b36a]">
          About the studio
        </p>

        <h2 className="font-serif font-medium text-[clamp(2rem,4vw,2.7rem)] mt-3.5 text-[#f4eee6]">
          Clean, detailed work — every set.
        </h2>

        <div className="mt-5 h-px w-16 bg-[#d6b36a]/60" />
      </div>

      {/* Main editorial layout */}
      <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:items-center">
        {/* Image slideshow */}
        <div className="relative">
          <div className="relative aspect-[3/4] overflow-hidden rounded-md border border-white/[0.10] bg-[#181614]">
            {SLIDES.map((slide, i) => (
              <Image
                key={slide.src}
                src={slide.src}
                alt={slide.alt}
                fill
                className={`object-cover transition-opacity duration-1000 ease-in-out ${
                  i === index ? "opacity-100" : "opacity-0"
                }`}
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            ))}

            {/* Editorial image overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

            {/* Freddy label */}
            <span className="absolute bottom-5 left-5 font-serif italic text-[#f4eee6] text-lg tracking-wide">
              FREDDY
            </span>

            {/* Slide controls */}
            <div className="absolute right-4 top-4 flex gap-2">
              {SLIDES.map((slide, i) => (
                <button
                  key={slide.src}
                  aria-label={`Show slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index
                      ? "w-6 bg-[#d6b36a]"
                      : "w-1.5 bg-[#f4eee6]/50"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Small editorial detail */}
          <div className="absolute -bottom-3 -right-3 h-14 w-14 border-r border-b border-[#d6b36a]/40 pointer-events-none" />
        </div>

        {/* About content */}
        <div>
          <div className="space-y-5 text-[#c9c0b6] leading-relaxed text-[0.95rem]">
            <p>
              Freddy Nails is a professional nail-tech business based in East
              London, Eastern Cape, run by nail artist Alfred Mensah
              (&quot;Freddy&quot;). The focus is quality nail services with
              clean, detailed work and personalised designs.
            </p>

            <p>
              The brand carries a modern luxury feel while staying welcoming
              and accessible — from a simple acrylic overlay to a fully
              custom French or ombré set with hand-placed art and
              rhinestones.
            </p>

            <p>
              Every appointment is by request, so it&apos;s booked around you
              rather than squeezed into a fixed slot.
            </p>
          </div>

          {/* Studio details */}
          <div className="mt-10 pt-7 border-t border-white/[0.09]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-7">
              <div>
                <b className="block font-serif text-2xl text-[#f4eee6]">
                  By appt
                </b>

                <span className="block mt-1 text-[0.68rem] tracking-[0.12em] uppercase text-[#8f877e]">
                  Personalised booking
                </span>
              </div>

              <div>
                <b className="block font-serif text-2xl text-[#f4eee6]">
                  100%
                </b>

                <span className="block mt-1 text-[0.68rem] tracking-[0.12em] uppercase text-[#8f877e]">
                  Custom designs
                </span>
              </div>

              <div>
                <b className="block font-serif text-2xl text-[#f4eee6]">
                  East London
                </b>

                <span className="block mt-1 text-[0.68rem] tracking-[0.12em] uppercase text-[#8f877e]">
                  Eastern Cape, SA
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
