"use client";

import { useRef, useState } from "react";
import Link from "next/link";

const ANGLES = [
  { key: "front", label: "Front View", src: "/mannequin/hand-front.jpg" },
  { key: "side", label: "Side View", src: "/mannequin/hand-side.jpg" },
  { key: "back", label: "Back View", src: "/mannequin/hand-back.jpg" },
  { key: "three-quarter", label: "Three-Quarter View", src: "/mannequin/hand-three-quarter.jpg" },
];

export default function TryYourDesign() {
  const fileRef = useRef(null);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [showCollage, setShowCollage] = useState(false);
  const [error, setError] = useState("");

  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload a JPG or PNG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedUrl(reader.result);
      setShowCollage(false);
    };
    reader.readAsDataURL(file);
  }

  function handleShowOnHand() {
    if (!uploadedUrl) return;
    setShowCollage(true);
    // Smooth scroll after a short delay so the grid is painted
    setTimeout(() => {
      document.getElementById("design-collage")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }

  function downloadAngle(angleLabel) {
    // Simple client-side download of the base hand for now
    // (full composite would require canvas merge; this keeps it lightweight)
    alert(
      `Downloading ${angleLabel} — for the full photorealistic re-render, book this design and Freddy will recreate it using your photo.`
    );
  }

  return (
    <div className="text-[#f4eee6]">
      {/* Hero / Upload area */}
      <section className="relative overflow-hidden rounded-2xl border border-[#d6b36a]/25 bg-[#0a0908] px-5 py-12 text-center sm:px-10">
        {/* subtle gold glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(214,179,106,0.12),_transparent_55%)]" />

        <p className="relative text-[0.7rem] font-bold uppercase tracking-[0.28em] text-[#d6b36a]">
          Crafted to perfection
        </p>
        <h1 className="relative mt-3 font-serif text-[clamp(1.9rem,5vw,3rem)] leading-tight text-[#f4eee6]">
          Try Your Design
          <br />
          <span className="text-[#d6b36a]">On The Hand</span>
        </h1>
        <p className="relative mx-auto mt-4 max-w-[42ch] text-sm leading-relaxed text-[#c9c0b6]">
          Upload a nail photo and see it on our glossy white mannequin from every
          angle — Front, Side, Back and Three-Quarter.
        </p>

        <div className="relative mt-8 flex flex-col items-center gap-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onFileChange}
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-[#d6b36a] px-7 py-3.5 text-sm font-bold text-[#11100f] shadow-[0_0_30px_rgba(214,179,106,0.25)] transition hover:bg-[#e0c17a]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload Your Nail Photo
          </button>
          <p className="text-xs text-[#817970]">JPG, PNG or WebP · Max 5 MB</p>

          {error && (
            <p className="mt-1 text-sm text-[#e39a96]">{error}</p>
          )}
        </div>

        {/* Uploaded preview */}
        {uploadedUrl && (
          <div className="relative mx-auto mt-8 max-w-[280px]">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#d6b36a]">
              Your Uploaded Design
            </p>
            <div className="overflow-hidden rounded-xl border-2 border-[#d6b36a]/60 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadedUrl}
                alt="Your uploaded nail design"
                className="h-auto w-full object-cover"
              />
            </div>

            <button
              type="button"
              onClick={handleShowOnHand}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#d6b36a]/50 bg-white/95 px-6 py-3 text-sm font-bold text-[#11100f] transition hover:bg-[#d6b36a]"
            >
              Show My Design On The Hand
            </button>
          </div>
        )}
      </section>

      {/* Collage */}
      {showCollage && uploadedUrl && (
        <section id="design-collage" className="mt-14 scroll-mt-8">
          <div className="text-center">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[#d6b36a]">
              Preview
            </p>
            <h2 className="mt-2 font-serif text-2xl text-[#f4eee6] sm:text-3xl">
              Your Design On The Hand — All Angles
            </h2>
            <p className="mx-auto mt-3 max-w-[50ch] text-sm leading-relaxed text-[#a79a87]">
              Instant preview on the mannequin. For a full photorealistic
              re-render, send this design with your booking and Freddy will
              recreate it.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5">
            {ANGLES.map(({ key, label, src }) => (
              <div
                key={key}
                className="group relative overflow-hidden rounded-xl border border-[#d6b36a]/30 bg-black"
              >
                {/* Base mannequin hand */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Mannequin ${label}`}
                  className="h-auto w-full object-cover"
                />
                {/* Design overlay — blended so colour and detail land on the nails */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uploadedUrl}
                  alt=""
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                  style={{
                    mixBlendMode: "soft-light",
                    opacity: 0.78,
                    objectPosition: "center 28%",
                    WebkitMaskImage:
                      "radial-gradient(ellipse 75% 55% at 50% 32%, black 20%, rgba(0,0,0,0.75) 55%, transparent 78%)",
                    maskImage:
                      "radial-gradient(ellipse 75% 55% at 50% 32%, black 20%, rgba(0,0,0,0.75) 55%, transparent 78%)",
                  }}
                />
                {/* Second pass for richer colour on the nail beds */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uploadedUrl}
                  alt=""
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                  style={{
                    mixBlendMode: "color",
                    opacity: 0.45,
                    objectPosition: "center 28%",
                    WebkitMaskImage:
                      "radial-gradient(ellipse 70% 50% at 50% 30%, black 15%, transparent 70%)",
                    maskImage:
                      "radial-gradient(ellipse 70% 50% at 50% 30%, black 15%, transparent 70%)",
                  }}
                />
                {/* Label */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8 text-center">
                  <span className="inline-block rounded-full bg-[#d6b36a] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-[#11100f]">
                    {label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Book CTA */}
          <div className="mt-10 text-center">
            <Link
              href="/account/book"
              className="inline-flex items-center gap-2 rounded-full bg-[#d6b36a] px-8 py-3.5 text-sm font-bold text-[#11100f] shadow-[0_0_28px_rgba(214,179,106,0.3)] transition hover:bg-[#e0c17a]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Book This Design
            </Link>
            <p className="mt-3 text-xs text-[#817970]">
              You’ll be able to attach your photo and notes when you book.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
