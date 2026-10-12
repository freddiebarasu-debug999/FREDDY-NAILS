"use client";

/**
 * View-only gel / rubber-base colour inspiration.
 * Clients can browse shades — selection is not required for booking.
 * Inspired by Lastik Rubberbase style swatches.
 */
const GEL_COLOURS = [
  { name: "Ballet", hex: "#D4A89A", finish: "Cream" },
  { name: "Cover", hex: "#C98B7B", finish: "Cream" },
  { name: "French", hex: "#F2DDD4", finish: "Sheer" },
  { name: "Pink Lace", hex: "#E8C4BC", finish: "Cream" },
  { name: "Rose", hex: "#C99588", finish: "Cream" },
  { name: "Shell", hex: "#C4A090", finish: "Cream" },
  { name: "Shimmer Baby Pink", hex: "#E8C8C4", finish: "Shimmer" },
  { name: "Shimmer Pink", hex: "#D4A09A", finish: "Shimmer" },
  { name: "Clear", hex: "#F5F0EB", finish: "Transparent" },
  { name: "Nude Soft", hex: "#C9B0A0", finish: "Cream" },
  { name: "Warm Sand", hex: "#B8957A", finish: "Cream" },
  { name: "Deep Rose", hex: "#A86B62", finish: "Cream" },
];

export default function ColourPalette() {
  return (
    <section
      id="colour-palette"
      className="bg-[#11100f] text-[#f4eee6] border-t border-[#d6b36a]/15"
    >
      <div className="max-w-[1180px] mx-auto px-5 py-18">
        <div className="max-w-[640px] mb-12">
          <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-[#d6b36a]">
            Gel inspiration
          </p>
          <h2 className="font-serif font-medium text-[clamp(1.9rem,4vw,2.6rem)] mt-3.5 text-[#f4eee6]">
            Browse our soft nudes &amp; pinks.
          </h2>
          <div className="mt-5 h-px w-16 bg-[#d6b36a]/60" />
          <p className="mt-5 text-[0.95rem] text-[#c9c0b6] leading-relaxed">
            A visual guide to popular gel and rubber-base tones. You don’t need
            to choose a colour when booking — share your favourite in the notes
            or on the day.
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
          {GEL_COLOURS.map((swatch) => (
            <div
              key={swatch.name}
              className="group text-center"
            >
              <div
                className="relative mx-auto aspect-[2/5] max-w-[72px] rounded-full rounded-b-[2rem] border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:-translate-y-1"
                style={{
                  background:
                    swatch.name === "Clear"
                      ? "linear-gradient(180deg, rgba(255,255,255,0.25), rgba(245,240,235,0.5))"
                      : swatch.hex,
                }}
                title={swatch.name}
              >
                <div className="absolute inset-x-2 top-3 h-8 rounded-full bg-white/20 blur-[1px] opacity-40" />
              </div>
              <p className="mt-3 text-[0.72rem] font-bold tracking-wide text-[#f4eee6]">
                {swatch.name}
              </p>
              <p className="text-[0.62rem] text-[#8f877e] uppercase tracking-wider">
                {swatch.finish}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-[#9f978f]">
          Prefer a custom shade? Tell us in your booking notes or WhatsApp{" "}
          <a
            href="https://wa.me/27710888897"
            className="text-[#d6b36a] hover:underline"
          >
            +27 71 088 8897
          </a>
          .
        </p>
      </div>
    </section>
  );
}
