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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TILES.map((t) => (
          <div
            key={t.label}
            className="relative aspect-square rounded-sm border border-line overflow-hidden flex items-end p-3.5"
          >
            <Image
              src={t.src}
              alt={t.label}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <span className="relative bg-nude/85 text-ink text-[0.78rem] font-bold px-2.5 py-1 rounded-sm">
              {t.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
