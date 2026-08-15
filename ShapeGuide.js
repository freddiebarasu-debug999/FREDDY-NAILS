const SHAPES = [
  { name: "Almond", desc: "Tapered, rounded tip", d: "M14 40 L12 14 Q20 2 28 14 L26 40 Q20 46 14 40 Z" },
  { name: "Square", desc: "Flat edge, sharp corners", d: "M13 40 L12 12 L28 12 L27 40 Q20 46 13 40 Z" },
  { name: "Squoval", desc: "Square with soft corners", d: "M13 40 L12 14 Q20 8 28 14 L27 40 Q20 46 13 40 Z" },
  { name: "Oval", desc: "Rounded, classic", d: "M14 40 L13 20 Q20 6 27 20 L26 40 Q20 46 14 40 Z" },
  { name: "Coffin", desc: "Tapered, squared tip", d: "M15 40 L13 16 L27 16 L25 40 Q20 47 15 40 Z" },
  { name: "Stiletto", desc: "Long, sharp point", d: "M16 40 L14 8 Q20 2 26 8 L24 40 Q20 46 16 40 Z" },
];

export default function ShapeGuide() {
  return (
    <div className="bg-ink text-nude">
      <section className="max-w-[1180px] mx-auto px-5 py-18">
        <div className="max-w-[640px] mb-12">
          <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold-bright">
            Not sure what to book?
          </p>
          <h2 className="font-serif font-medium text-[clamp(1.9rem,4vw,2.6rem)] mt-3.5">
            Find your shape first.
          </h2>
          <p className="mt-3 text-[0.95rem] text-[#C9BBA9]">
            Tell us the shape when you message us on WhatsApp — it saves time
            in the chair.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-white/10">
          {SHAPES.map((s) => (
            <div
              key={s.name}
              className="bg-ink hover:bg-[#26201B] transition-colors text-center px-3.5 pt-6.5 pb-5 group"
            >
              <svg
                viewBox="0 0 40 60"
                className="w-[34px] h-[52px] mx-auto mb-3.5 block"
              >
                <path
                  d={s.d}
                  className="fill-none stroke-gold-bright stroke-[1.4] group-hover:fill-gold-bright/[0.18] transition-colors"
                />
              </svg>
              <div className="text-[0.82rem] font-bold tracking-wide">{s.name}</div>
              <div className="text-[0.74rem] text-[#A79A87] mt-1 leading-tight">
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
