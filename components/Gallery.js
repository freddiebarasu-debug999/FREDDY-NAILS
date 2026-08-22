"use client";

import { useState } from "react";
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

  return (
    <section id="gallery" className="max-w-[1180px] mx-auto px-5 py-22">
      <div className="max-w-[640px] mb-12">
        <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
          Recent work
        </p>

        <h2 className="font-serif font-medium text-[clamp(1.9rem,4vw,2.6rem)] mt-3.5">
          Gallery
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {TILES.map((t, index) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setSelectedImage(t)}
            className="gallery-float relative aspect-square-[4/5] rounded-md border border-line overflow-hidden flex items-end p-3.5 text-left cursor-pointer group"
            style={{
              animationDelay: `${index * -0.7}s`,
              animationDuration: `${5 + (index % 3)}s`,
            }}
            aria-label={`View ${t.label}`}
          >
            <Image
              src={t.src}
              alt={t.label}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

            <span className="relative text-white text-[0.78rem] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {/* Continuous floating animation */}
      <style jsx>{`
        .gallery-float {
          animation-name: galleryFloat;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
          will-change: transform;
        }

        @keyframes galleryFloat {
          0% {
            transform: translateY(0px);
          }

          50% {
            transform: translateY(-7px);
          }

          100% {
            transform: translateY(4px);
          }
        }

        .gallery-float:hover {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .gallery-float {
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
