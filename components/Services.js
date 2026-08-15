const GROUPS = [
  {
    title: "Acrylic Manicure",
    items: [
      { name: "Plain Short–Medium", price: "R200" },
      { name: "Plain Long", price: "R250" },
      { name: "Plain XL–XXXL", price: "R300" },
      { name: "French Short–Medium", price: "R300" },
      { name: "French Long", price: "R350" },
      { name: "French XL–XXL", price: "R400" },
      { name: "Ombré Short–Medium", price: "R250" },
      { name: "Ombré Long", price: "R300" },
      { name: "Ombré XL–XXXL", price: "R350" },
    ],
  },
  {
    title: "Gel Manicure",
    items: [
      { name: "Gel Overlay", price: "R200" },
      { name: "Plain Short–Medium", price: "R250" },
      { name: "Plain Long", price: "R300" },
      { name: "French Short–Medium", price: "R300" },
      { name: "French Long", price: "R350" },
    ],
  },
  {
    title: "Pedicure Sets",
    items: [
      { name: "Gel Overlay", price: "R150" },
      { name: "Gel Full Tips", price: "R200" },
      { name: "Acrylic Overlay", price: "R180" },
      { name: "Acrylic Full Tips", price: "R200" },
      { name: "Acrylic French Tips", price: "R250" },
    ],
  },
  {
    title: "Extras",
    items: [
      { name: "Buff & Shine", price: "R150" },
      { name: "Fill-in (@3 weeks)", price: "R180" },
      { name: "Nail Repair", price: "R20–R30" },
      { name: "Soak Off", price: "R50" },
      { name: "Nail Art", price: "R30–R50" },
      { name: "Rhinestones", price: "R10–R15" },
      { name: "3D Art", price: "R50–R100" },
    ],
  },
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
            <h3 className="text-[1.05rem] font-bold tracking-wide uppercase text-gold mb-4">
              {g.title}
            </h3>
            {g.items.map((item) => (
              <div
                key={item.name}
                className="flex justify-between gap-4 py-2.5 border-b border-line last:border-none text-[0.94rem]"
              >
                <span className="text-ink-soft">{item.name}</span>
                <span className="font-bold whitespace-nowrap">{item.price}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="text-[0.85rem] text-ink-soft italic mt-4.5">
        Prices may change according to certain designs and nail art.
      </p>
    </section>
  );
}
