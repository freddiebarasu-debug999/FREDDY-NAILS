"use client";

/**
 * Realistic 3D gel / rubber-base nail tips (product-poster style).
 * View-only inspiration — not required for booking.
 */

const GEL_COLOURS = [
  {
    name: "Ballet",
    base: "#D4A89A",
    mid: "#C99588",
    deep: "#B87A6C",
    finish: "Cream",
  },
  {
    name: "Cover",
    base: "#C98B7B",
    mid: "#B87868",
    deep: "#A06658",
    finish: "Cream",
  },
  {
    name: "French",
    base: "#F5E6DE",
    mid: "#E8D4CA",
    deep: "#D4B8AC",
    finish: "Sheer",
  },
  {
    name: "Pink Lace",
    base: "#E8C4BC",
    mid: "#D9AFA6",
    deep: "#C49890",
    finish: "Cream",
  },
  {
    name: "Rose",
    base: "#C99588",
    mid: "#B87A6C",
    deep: "#9E6558",
    finish: "Cream",
  },
  {
    name: "Shell",
    base: "#C4A090",
    mid: "#B08C78",
    deep: "#987868",
    finish: "Cream",
  },
  {
    name: "Shimmer Baby Pink",
    base: "#E8C8C4",
    mid: "#D9B0AC",
    deep: "#C49894",
    finish: "Shimmer",
    shimmer: true,
  },
  {
    name: "Shimmer Pink",
    base: "#D4A09A",
    mid: "#C08882",
    deep: "#A8706A",
    finish: "Shimmer",
    shimmer: true,
  },
  {
    name: "Clear",
    base: "rgba(255,255,255,0.35)",
    mid: "rgba(245,240,235,0.55)",
    deep: "rgba(220,210,200,0.4)",
    finish: "Transparent",
    clear: true,
  },
  {
    name: "Nude Soft",
    base: "#C9B0A0",
    mid: "#B89A88",
    deep: "#A08270",
    finish: "Cream",
  },
  {
    name: "Warm Sand",
    base: "#B8957A",
    mid: "#A48068",
    deep: "#8C6C58",
    finish: "Cream",
  },
  {
    name: "Deep Rose",
    base: "#A86B62",
    mid: "#925850",
    deep: "#7A4840",
    finish: "Cream",
  },
];

function NailTip({ swatch }) {
  const gradient = swatch.clear
    ? `linear-gradient(165deg,
        rgba(255,255,255,0.55) 0%,
        rgba(245,240,235,0.35) 35%,
        rgba(220,210,200,0.45) 70%,
        rgba(200,190,180,0.5) 100%)`
    : `linear-gradient(165deg,
        ${swatch.base} 0%,
        ${swatch.mid} 45%,
        ${swatch.deep} 100%)`;

  return (
    <div className="relative mx-auto w-[68px] h-[150px] sm:w-[76px] sm:h-[168px]">
      {/* Soft ground shadow */}
      <div
        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-3 rounded-full bg-black/40 blur-md"
        aria-hidden
      />

      {/* Nail body — stiletto / long oval product shape */}
      <div
        className="nail-3d relative h-full w-full overflow-hidden"
        style={{
          background: gradient,
          borderRadius: "50% 50% 28% 28% / 18% 18% 72% 72%",
          boxShadow: `
            inset 0 2px 6px rgba(255,255,255,0.45),
            inset 0 -8px 16px rgba(0,0,0,0.22),
            inset 4px 0 10px rgba(255,255,255,0.12),
            inset -5px 0 12px rgba(0,0,0,0.18),
            0 12px 28px rgba(0,0,0,0.45),
            0 2px 6px rgba(0,0,0,0.3)
          `,
          border: swatch.clear
            ? "1px solid rgba(255,255,255,0.25)"
            : "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {/* Primary gloss streak */}
        <div
          className="pointer-events-none absolute left-[18%] top-[8%] h-[42%] w-[28%] rounded-full"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.15) 55%, transparent 100%)",
            filter: "blur(1.5px)",
            transform: "rotate(-8deg)",
          }}
        />
        {/* Secondary edge light */}
        <div
          className="pointer-events-none absolute right-[12%] top-[20%] h-[30%] w-[10%] rounded-full"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)",
            filter: "blur(1px)",
          }}
        />
        {/* Tip depth */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[28%]"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.28), transparent)",
          }}
        />
        {/* Shimmer flecks */}
        {swatch.shimmer && (
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage: `
                radial-gradient(circle at 30% 25%, rgba(255,255,255,0.7) 0 1px, transparent 1.5px),
                radial-gradient(circle at 55% 40%, rgba(255,255,255,0.55) 0 0.8px, transparent 1.2px),
                radial-gradient(circle at 40% 60%, rgba(255,255,255,0.45) 0 1px, transparent 1.5px),
                radial-gradient(circle at 65% 55%, rgba(255,255,255,0.5) 0 0.7px, transparent 1px),
                radial-gradient(circle at 35% 75%, rgba(255,255,255,0.4) 0 0.9px, transparent 1.3px)
              `,
            }}
          />
        )}
      </div>
    </div>
  );
}

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
            Product-style gel and rubber-base tips. You don’t need to choose a
            colour when booking — share your favourite in the notes or on the
            day.
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-10 md:gap-x-5">
          {GEL_COLOURS.map((swatch) => (
            <div key={swatch.name} className="group text-center">
              <div className="transition-transform duration-300 group-hover:-translate-y-1.5">
                <NailTip swatch={swatch} />
              </div>
              <p className="mt-4 text-[0.72rem] font-bold tracking-wide text-[#f4eee6]">
                {swatch.name}
              </p>
              <p className="text-[0.62rem] text-[#8f877e] uppercase tracking-wider">
                {swatch.finish}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-sm text-[#9f978f]">
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
