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
    <section id="about" className="max-w-[1180px] mx-auto px-5 py-22">
      <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-start">
        <div className="relative aspect-[3/4] rounded overflow-hidden border border-line">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <span className="absolute bottom-5 left-5 font-serif italic text-nude text-lg">
            — Alfred &quot;Freddy&quot; Mensah
          </span>
          <div className="absolute right-4 top-4 flex gap-2">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.src}
                aria-label={`Show slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-6 bg-gold-bright" : "w-1.5 bg-nude/50"
                }`}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
            About the studio
          </p>
          <h2 className="font-serif font-medium text-[clamp(1.9rem,4vw,2.6rem)] mt-3.5 mb-5">
            Clean, detailed work — every set.
          </h2>
          <div className="space-y-4 text-ink-soft leading-relaxed">
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

          <div className="flex gap-9 flex-wrap mt-8">
            <div>
              <b className="block font-serif text-3xl">By appt</b>
              <span className="text-xs tracking-wide uppercase text-ink-soft">
                Personalised booking
              </span>
            </div>
            <div>
              <b className="block font-serif text-3xl">100%</b>
              <span className="text-xs tracking-wide uppercase text-ink-soft">
                Custom designs
              </span>
            </div>
            <div>
              <b className="block font-serif text-3xl">East London</b>
              <span className="text-xs tracking-wide uppercase text-ink-soft">
                Eastern Cape, SA
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
