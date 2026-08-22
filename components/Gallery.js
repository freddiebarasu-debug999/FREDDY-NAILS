"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const TILES = [
  { src: "/gallery/gallery-1.jpg", label: "Purple Chrome Ombré" },
  { src: "/gallery/gallery-2.jpg", label: "Black & White French" },
  { src: "/gallery/gallery-3.jpg", label: "Gold Outline & Pearls" },
  { src: "/gallery/gallery-4.jpg", label: "Floral Stiletto Art" },
  { src: "/gallery/gallery-5.jpg", label: "Classic Pink Square" },
  { src: "/gallery/gallery-6.jpg", label: "Mauve French Square" },
  { src: "/gallery/gallery-7.jpg", label: "Lilac Square Set" },
  { src: "/gallery/gallery-8.jpg", label: "Leopard French Cherry" },
];

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [visibleTiles, setVisibleTiles] = useState([]);
  const tileRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.dataset.index);

            setVisibleTiles((current) =>
              current.includes(index) ? current : [...current, index]
            );

            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    tileRefs.current.forEach((tile) => {
      if (tile) observer.observe(tile);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section id="gallery" className="max-w-[1180px] mx-auto px-5 py-22">
      {/* Heading */}
      <div className="max-w-[640px] mb-12">
        <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
          Recent work
        </p>

        <h2 className="font-serif font-medium text-[clamp(1.9rem,4vw,2.6rem)] mt-3.5">
          Gallery
        </h2>
      </div>

      {/* Masonry Gallery */}
      <div className="columns-2 md:columns-3 gap-4 space-y-4">
        {TILES.map((t, index) => (
          <button
            key={t.label}
            ref={(el) => {
              tileRefs.current[index] = el;
            }}
            type="button"
            data-index={index}
            onClick={() => setSelectedImage(t)}
            className={`gallery-tile group relative block w-full overflow-hidden rounded-md border border-line text-left break-inside-avoid cursor-pointer ${
              visibleTiles.includes(index)
                ? "gallery-visible"
                : "gallery-hidden"
            }`}
            style={{
              "--float-delay": `${index * -0.65}s`,
              "--float-duration": `${5 + (index % 3)}s`,
              "--entrance-delay": `${index * 90}ms`,
            }}
            aria-label={`View ${t.label}`}
          >
            <Image
              src={t.src}
              alt={t.label}
              width={900}
              height={1200}
              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
            />

            {/* Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-90" />

            {/* Label */}
            <span className="absolute bottom-3.5 left-3.5 right-3.5 text-white text-[0.78rem] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {t.label}
            </span>
          </button>
        ))}
      </div>

      <style jsx>{`
        /* Initial fly-in */
        .gallery-hidden {
          opacity: 0;
          transform: translateY(45px) scale(0.97);
        }

        .gallery-visible {
          opacity: 1;
          animation:
            galleryEntrance 800ms cubic-bezier(0.22, 1, 0.36, 1)
              var(--entrance-delay) both,
            galleryFloat var(--float-duration) ease-in-out
              calc(var(--entrance-delay) + 800ms) infinite alternate;
        }

        @keyframes galleryEntrance {
          0% {
            opacity: 0;
            transform: translateY(45px) scale(0.97);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Continuous floating after entrance */
        @keyframes galleryFloat {
          0% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-6px);
          }

          100% {
            transform: translateY(4px);
          }
        }

        .gallery-visible:hover {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .gallery-hidden,
          .gallery-visible {
            opacity: 1;
            transform: none;
            animation: none;
          }
        }
      `}</style>

      {/* Full-size image viewer */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-5"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedImage.src}
              alt={selectedImage.label}
              width={1200}
              height={1200}
              className="w-full max-h-[80vh] object-contain rounded-sm"
            />

            <div className="absolute left-4 bottom-4 bg-gray-700/70 backdrop-blur-sm text-white px-4 py-2 rounded-sm">
              <p className="font-serif text-lg">
                {selectedImage.label}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 text-white text-xl hover:bg-gold hover:text-ink transition-colors"
              aria-label="Close image"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
