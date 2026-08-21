const GROUPS = [
  {
    title: "Acrylic Manicure",
    items: [
      {
        name: "Plain — Short to Medium",
        price: "R200",
        description:
          "Acrylic enhancement in a simple, clean finish for short to medium-length nails.",
      },
      {
        name: "Plain — Long",
        price: "R250",
        description:
          "Acrylic enhancement for longer nails with a smooth, simple finish.",
      },
      {
        name: "Plain — XL to XXXL",
        price: "R300",
        description:
          "Extra-long acrylic set for clients who prefer dramatic length.",
      },
      {
        name: "French — Short to Medium",
        price: "R300",
        description:
          "Classic French tip design on a short to medium acrylic set.",
      },
      {
        name: "French — Long",
        price: "R350",
        description: "French tip design on a longer acrylic set.",
      },
      {
        name: "French — XL to XXL",
        price: "R400",
        description: "Longer, more dramatic French acrylic set.",
      },
      {
        name: "Ombré — Short to Medium",
        price: "R250",
        description:
          "Soft colour-blended ombré finish on a short to medium acrylic set.",
      },
      {
        name: "Ombré — Long",
        price: "R300",
        description: "Elegant blended ombré finish on longer acrylic nails.",
      },
      {
        name: "Ombré — XL to XXXL",
        price: "R350",
        description: "Extra-long acrylic set with a bold ombré finish.",
      },
    ],
  },
  {
    title: "Gel Manicure",
    items: [
      {
        name: "Gel Overlay",
        price: "R200",
        description:
          "Gel applied over the natural nails for a neat, glossy finish and added strength.",
      },
      {
        name: "Plain — Short to Medium",
        price: "R250",
        description:
          "Plain gel manicure for a clean, polished look on short to medium nails.",
      },
      {
        name: "Plain — Long",
        price: "R300",
        description: "Plain gel manicure for clients who prefer longer nails.",
      },
      {
        name: "French — Short to Medium",
        price: "R300",
        description: "Classic French finish using gel on short to medium nails.",
      },
      {
        name: "French — Long",
        price: "R350",
        description: "French gel finish on longer nails.",
      },
    ],
  },
  {
    title: "Pedicure Sets",
    items: [
      {
        name: "Gel Overlay",
        price: "R150",
        description:
          "Gel applied over the natural toenails for a neat, glossy finish.",
      },
      {
        name: "Gel Full Tips",
        price: "R200",
        description: "Gel pedicure with full tips for added length and shape.",
      },
      {
        name: "Acrylic Overlay",
        price: "R180",
        description:
          "Acrylic applied over the natural toenails for strength and a polished finish.",
      },
      {
        name: "Acrylic Full Tips",
        price: "R200",
        description:
          "Acrylic pedicure with full tips for added length and definition.",
      },
      {
        name: "Acrylic French Tips",
        price: "R250",
        description:
          "Acrylic full-tip pedicure finished with a classic French design.",
      },
    ],
  },
  {
    title: "Extras",
    items: [
      {
        name: "Buff & Shine",
        price: "R150",
        description:
          "Natural nail shaping, buffing and polishing for a clean, glossy natural finish.",
      },
      {
        name: "Fill-in — at 3 weeks",
        price: "R180",
        description:
          "Refills the grown-out area of an existing acrylic set to refresh the look and structure.",
      },
      {
        name: "Nail Repair",
        price: "R20–R30",
        description:
          "Repair of a damaged or broken nail. Price depends on the repair required.",
      },
      {
        name: "Soak Off",
        price: "R50",
        description: "Safe removal of existing product from the nails.",
      },
      {
        name: "Nail Art",
        price: "R30–R50",
        description:
          "Decorative nail designs added to your set. Price depends on the design.",
      },
      {
        name: "Rhinestones",
        price: "R10–R15",
        description: "Rhinestone embellishments added for extra sparkle.",
      },
      {
        name: "3D Art",
        price: "R50–R100",
        description: "Raised decorative nail art for a bold, detailed finish.",
      },
    ],
  },
  {
    title: "Eyelash Extensions",
    badge: "New",
    items: [
      {
        name: "Cluster Lashes",
        price: "R130",
        description:
          "Pre-made lash clusters applied in small groups for a fuller look — a quicker, more affordable option.",
      },
      {
        name: "Cateye Lashes",
        price: "R150",
        description:
          "A dramatic lash shape with added length at the outer corners, creating a lifted, cat-eye effect.",
      },
      {
        name: "Classic Lashes",
        price: "R180",
        description:
          "A natural-looking lash set with one extension applied to each suitable natural lash.",
      },
      {
        name: "Hybrid Lashes",
        price: "Coming soon",
        description:
          "A blend of classic and volume techniques for a fuller look while staying soft and versatile.",
      },
      {
        name: "Volume Lashes",
        price: "Coming soon",
        description:
          "Lightweight lash fans create a fuller, more noticeable and glamorous appearance.",
      },
      {
        name: "Mega Volume Lashes",
        price: "Coming soon",
        description:
          "The most dramatic lash option, creating an extra-full and bold finish.",
      },
    ],
  },
  {
    title: "Foot Spa",
    badge: "New",
    items: [
      {
        name: "Basic Foot Spa",
        price: "R200",
        description:
          "A relaxing foot soak followed by gentle exfoliation and moisturising to leave feet refreshed and soft.",
      },
      {
        name: "Luxury Foot Spa",
        price: "R280",
        description:
          "A more indulgent treatment with a relaxing soak, exfoliation, nourishing treatment and massage.",
      },
    ],
  },
];

const NOTES = [
  "Prices may change according to the length, design and level of nail art required.",
  "Nail art, rhinestones and 3D art are priced according to the design selected.",
  "For eyelash extensions, the final suitability and style will depend on the client's natural lashes.",
  "Please advise Freddy Nails of any existing product, damage or special requirements when booking.",
];

export default function Services() {
  return (
    <section id="services" className="max-w-[1180px] mx-auto px-5 py-22">
      <div className="max-w-[640px] mb-12">
        <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
          Menu
        </p>
        <h2 className="font-serif font-medium text-[clamp(1.9rem,4vw,2.6rem)] mt-3.5">
          Services &amp; pricing
        </h2>
      </div>

      <div className="grid gap-px bg-line border border-line md:grid-cols-2">
        {GROUPS.map((g) => (
          <div key={g.title} className="bg-nude p-7 md:p-8">
            <div className="flex items-center gap-2.5 mb-4">
              <h3 className="text-[1.05rem] font-bold tracking-wide uppercase text-gold">
                {g.title}
              </h3>
              {g.badge && (
                <span className="text-[0.62rem] font-bold uppercase tracking-wide text-ink bg-gold-bright px-2 py-0.5 rounded-sm">
                  {g.badge}
                </span>
              )}
            </div>

            {g.items.map((item) => (
              <div
                key={item.name}
                className={`py-3 border-b border-line last:border-none ${
                  item.price === "Coming soon" ? "opacity-50" : ""
                }`}
              >
                <div className="flex justify-between gap-4 text-[0.94rem]">
                  <span className="font-bold">{item.name}</span>
                  <span className="font-bold text-gold whitespace-nowrap">
                    {item.price}
                  </span>
                </div>
                <p className="text-[0.82rem] text-ink-soft leading-relaxed mt-1">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-7 border border-line bg-nude-deep rounded-sm p-6">
        <p className="text-[0.68rem] font-bold tracking-[0.22em] uppercase text-gold mb-3">
          Good to know
        </p>
        <ul className="space-y-2">
          {NOTES.map((note) => (
            <li
              key={note}
              className="text-[0.85rem] text-ink-soft leading-relaxed flex gap-2"
            >
              <span className="text-gold">•</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
        <p className="text-[0.85rem] text-gold-bright italic mt-4">
          Student nail-art discount: 20% off (where applicable)
        </p>
      </div>
    </section>
  );
}
