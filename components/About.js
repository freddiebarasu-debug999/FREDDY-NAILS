const EXPERIENCE_POINTS = [
  {
    title: "Precision",
    description: "Clean shaping and detailed finishing",
  },
  {
    title: "Custom Designs",
    description: "Sets tailored to your style",
  },
  {
    title: "Quality",
    description: "Professional products and careful application",
  },
  {
    title: "Luxury Experience",
    description: "A relaxed, personalised appointment",
  },
];

export default function About() {
  return (
    <section id="about" className="max-w-[1180px] mx-auto px-5 py-22">
      <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-stretch">
        <div className="relative aspect-[3/4] rounded overflow-hidden border border-gold/25 bg-ink text-nude p-8 md:p-10 flex flex-col justify-center">
          <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_30%_20%,white,transparent_60%)]" />

          <p className="relative text-[0.68rem] font-bold tracking-[0.25em] uppercase text-gold-bright mb-3">
            The Freddy Nails
          </p>
          <h3 className="relative font-serif text-3xl md:text-[2.1rem] leading-tight mb-4">
            Experience
          </h3>
          <p className="relative text-nude/70 leading-relaxed text-[0.94rem] mb-8">
            Detail-focused nail artistry, carefully selected designs, and a
            polished experience from booking to final set.
          </p>

          <div className="relative space-y-5">
            {EXPERIENCE_POINTS.map((point) => (
              <div key={point.title} className="flex gap-3.5 items-start">
                <span className="text-gold-bright text-lg leading-none mt-0.5">
                  ✦
                </span>
                <div>
                  <p className="font-serif text-lg text-nude">
                    {point.title}
                  </p>
                  <p className="text-nude/60 text-sm leading-relaxed">
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
            About the studio
          </p>
          <h2 className="font-serif font-medium text-[clamp(1.9rem,4vw,2.6rem)] mt-3.5 mb-5">
            Clean, detailed work — every set.
          </h2>
          <div className="space-y-4 text-ink-soft leading-relaxed">
            <p>
              Freddy Nails is a professional nail-tech business based in East
              London, Eastern Cape, run by nail artist Alfred Mensah
              (&quot;Freddy&quot;). The focus is quality nail services with
              clean, detailed work and personalised designs.
            </p>
            <p>
              The brand carries a modern luxury feel while staying welcoming
              and accessible — from a simple acrylic overlay to a fully
              custom French or ombré set with hand-placed art and
              rhinestones.
            </p>
            <p>
              Every appointment is by request, so it&apos;s booked around you
              rather than squeezed into a fixed slot.
            </p>
          </div>

          <div className="flex gap-9 flex-wrap mt-8">
            <div>
              <b className="block font-serif text-3xl">By appt</b>
              <span className="text-xs tracking-wide uppercase text-ink-soft">
                Personalised booking
              </span>
            </div>
            <div>
              <b className="block font-serif text-3xl">100%</b>
              <span className="text-xs tracking-wide uppercase text-ink-soft">
                Custom designs
              </span>
            </div>
            <div>
              <b className="block font-serif text-3xl">East London</b>
              <span className="text-xs tracking-wide uppercase text-ink-soft">
                Eastern Cape, SA
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
