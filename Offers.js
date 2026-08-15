const OFFERS = [
  {
    badge: "First visit",
    title: "15% off your first set",
    desc: "New clients get 15% off any gel manicure or extension service on their first appointment.",
  },
  {
    badge: "Referral",
    title: "Bring a friend",
    desc: "You both take R50 off when a friend books their first appointment through you.",
  },
  {
    badge: "Birthday",
    title: "Free art in your birthday month",
    desc: "One complimentary nail art design added to any manicure during your birthday month.",
  },
];

export default function Offers() {
  return (
    <section id="offers" className="max-w-[1180px] mx-auto px-5 py-22">
      <div className="max-w-[640px] mb-12">
        <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
          Current offers
        </p>
        <h2 className="font-serif font-medium text-[clamp(1.9rem,4vw,2.6rem)] mt-3.5">
          Ways to save
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {OFFERS.map((o) => (
          <div key={o.title} className="border border-line rounded-sm p-7 bg-nude">
            <span className="inline-block text-[0.7rem] font-extrabold tracking-wide uppercase text-gold border border-gold px-2.5 py-1 rounded-full mb-4">
              {o.badge}
            </span>
            <h3 className="text-xl font-medium mb-2.5">{o.title}</h3>
            <p className="text-[0.9rem] text-ink-soft leading-relaxed">{o.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
