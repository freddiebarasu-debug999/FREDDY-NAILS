"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const NAILS = [
  { name: "Rose chrome", shape: "hero-nail--almond", tone: "hero-nail--rose", position: "hero-nail-pos--one" },
  { name: "Champagne gloss", shape: "hero-nail--coffin", tone: "hero-nail--champagne", position: "hero-nail-pos--two" },
  { name: "Nude blush", shape: "hero-nail--oval", tone: "hero-nail--blush", position: "hero-nail-pos--three" },
  { name: "Gold shimmer", shape: "hero-nail--stiletto", tone: "hero-nail--gold", position: "hero-nail-pos--four" },
  { name: "Mauve gloss", shape: "hero-nail--almond", tone: "hero-nail--mauve", position: "hero-nail-pos--five" },
];

export default function Hero() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  function handlePointerMove(event) {
    if (reduceMotion || window.matchMedia("(hover: none)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -7, y: x * 9 });
  }

  function resetTilt() {
    setTilt({ x: 0, y: 0 });
  }

  return (
    <section
      id="home"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      className="relative min-h-[640px] md:min-h-[760px] flex items-center overflow-hidden bg-[#0c0b0a] hero-alive"
    >
      <div className="absolute inset-0">
        <Image
          src="/hero-slide-1.jpg"
          alt="Freddy Nails luxury nail art in gold and nude tones"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c0b0a] via-[#0c0b0a]/85 to-[#0c0b0a]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b0a]/75 via-transparent to-[#0c0b0a]/15" />
      </div>

      {/* Lightweight CSS 3D nail sculpture: no large WebGL bundle on first load. */}
      <div className="hero-sculpture-wrap" aria-hidden="true">
        <div
          className={`hero-sculpture ${reduceMotion ? "hero-sculpture--still" : ""}`}
          style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        >
          <div className="hero-sculpture-halo" />
          {NAILS.map((nail, index) => (
            <div key={nail.name} className={`hero-nail ${nail.shape} ${nail.tone} ${nail.position}`} style={{ "--nail-index": index }}>
              <span className="hero-nail-glint" />
              <span className="hero-nail-edge" />
            </div>
          ))}
          <div className="hero-sculpture-caption">
            <span>THE SIGNATURE COLLECTION</span>
            <i />
            <span>CRAFTED TO PERFECTION</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-[1180px] mx-auto px-5 w-full py-24 md:py-32">
        <div className="max-w-[620px] hero-copy">
          <p className="hero-eyebrow">FREDDY NAILS STUDIO · EAST LONDON</p>
          <h1 className="font-serif font-medium leading-[1.05] text-[clamp(2.6rem,6vw,4.2rem)] text-[#f4eee6]">
            Nails by Freddy,
            <br />
            <span className="hero-title-accent">Crafted to Perfection.</span>
          </h1>
          <div className="mt-6 h-px w-16 bg-[#d6b36a]/80" />
          <p className="mt-6 text-[1.05rem] leading-relaxed text-[#e0d5c8] max-w-[46ch]">
            Luxury nail services designed to elevate your style and confidence — from timeless elegance to statement-making nail art.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="/account/book" className="hero-primary-cta">
              Explore appointments <span aria-hidden="true">↗</span>
            </a>
            <a href="#gallery" className="hero-secondary-cta">Discover the artistry</a>
          </div>
          <p className="hero-note">PERSONALISED SETS · CONSIDERED DETAILS · YOUR SIGNATURE LOOK</p>
        </div>
      </div>
      <div className="hero-bottom-line" aria-hidden="true"><span /> A LITTLE LUXURY, AT YOUR FINGERTIPS <span /></div>
    </section>
  );
}
