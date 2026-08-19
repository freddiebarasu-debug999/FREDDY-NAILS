"use client";

import { useEffect } from "react";

export default function Reviews() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://elfsightcdn.com/platform.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Keep the Elfsight script loaded for the site
    };
  }, []);

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
        className="elfsight-app-fbd66433-9d6c-4b79-81fc-d7c22d0c5ea9"
        data-elfsight-app-lazy
      />
    </section>
  );
}
