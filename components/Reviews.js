"use client";

import Script from "next/script";

export default function Reviews() {
  return (
    <section
      id="reviews"
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
        style={{ width: "100%", display: "block" }}
      />

      <Script
        src="https://embed.famewall.io/newFrame.js"
        strategy="afterInteractive"
      />
    </section>
  );
}
