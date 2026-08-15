const TILES = [
  { label: "Gold-foil French", gradient: "from-[#E9D4B4] to-[#B98A50]" },
  { label: "Espresso chrome", gradient: "from-[#2b2621] to-[#5c4326]" },
  { label: "Almond nude set", gradient: "from-[#e7c9a8] to-[#8f6a44]" },
  { label: "Hand-painted florals", gradient: "from-[#3a2f22] to-[#a67c46]" },
  { label: "Milky coffin BIAB", gradient: "from-[#d8b98d] to-[#7d5c34]" },
  { label: "Cat-eye gel", gradient: "from-[#c9ab7c] to-[#433625]" },
  { label: "Bridal chrome set", gradient: "from-[#211b16] to-[#8a6a3d]" },
  { label: "Classic red square", gradient: "from-[#e3c9a5] to-[#c7a26a]" },
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
            className={`aspect-square rounded-sm border border-line flex items-end p-3.5 bg-gradient-to-br ${t.gradient}`}
          >
            <span className="bg-nude/75 text-ink text-[0.78rem] font-bold px-2.5 py-1 rounded-sm">
              {t.label}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[0.85rem] text-ink-soft mt-4.5">
        Placeholder gallery — swap these tiles for real client photography
        (use next/image) before launch.
      </p>
    </section>
  );
}
