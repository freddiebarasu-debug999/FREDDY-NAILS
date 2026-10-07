"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

export default function Reviews() {
  const sectionRef = useRef(null);
  const [loadEmbed, setLoadEmbed] = useState(false);

  // Only download the Famewall reviews script when the section is close to
  // the screen, so it never competes with the first paint.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    if (!("IntersectionObserver" in window)) {
      setLoadEmbed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setLoadEmbed(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="reviews"
      ref={sectionRef}
      className="max-w-[1180px] mx-auto px-5 py-16 md:py-24"
    >
      <div className="text-center mb-10">
        <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
          Client love
        </p>

        <h2 className="font-serif text-[clamp(2rem,4vw,3.2rem)] mt-3">
          What our clients say
        </h2>

        <p className="text-ink-soft max-w-[48ch] mx-auto mt-4 leading-relaxed">
          Real experiences from clients who have visited Freddy Nails Studio.
        </p>
      </div>

      <div
        className="famewall-embed"
        data-src="freddynails"
        data-format="slider"
        style={{ width: "100%", display: "block", minHeight: 280 }}
      />

      {loadEmbed && (
        <Script
          src="https://embed.famewall.io/newFrame.js"
          strategy="afterInteractive"
        />
      )}
    </section>
  );
}
