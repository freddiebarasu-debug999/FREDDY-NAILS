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
    <section
      id="about"
      className="max-w-[1180px] mx-auto px-5 py-22"
    >
      <div className="grid gap-14 md:grid-cols-[0.9fr_1.1fr] md:items-start">
        {/* Freddy Nails Experience */}
        <div className="relative">
          <div className="border-t border-white/[0.09] pt-7">
            <p className="text-[0.68rem] font-bold tracking-[0.25em] uppercase text-gold-bright">
              The Freddy Nails
            </p>
            <h3 className="font-serif text-[clamp(2rem,4vw,2.6rem)] leading-tight mt-3 text-ink">
              Experience
            </h3>
            <div className="mt-5 h-px w-16 bg-gold/60" />
            <p className="text-ink-soft leading-relaxed text-[0.94rem] mt-5 max-w-[480px]">
              Detail-focused nail artistry, carefully selected designs, and a
              polished experience from booking to final set.
            </p>
          </div>
          {/* Experience points */}
          <div className="mt-9">
            {EXPERIENCE_POINTS.map((point, index) => (
              <div
                key={point.title}
                className={`flex gap-4 items-start py-5 ${
                  index !== EXPERIENCE_POINTS.length - 1
                    ? "border-b border-white/[0.09]"
                    : ""
                }`}
              >
                <span className="text-gold-bright text-base leading-none mt-1">
                  ✦
                </span>
                <div>
                  <p className="font-serif text-[1.08rem] text-ink">
                    {point.title}
                  </p>
                  <p className="text-ink-soft/80 text-sm leading-relaxed mt-1">
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* About the Studio */}
        <div>
          <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
            About the studio
          </p>
          <h2 className="font-serif font-medium text-[clamp(1.9rem,4vw,2.6rem)] mt-3.5 mb-5">
            Clean, detailed work — every set.
          </h2>
          <div className="h-px w-16 bg-gold/60 mb-6" />
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
          {/* Studio details */}
          <div className="mt-9 pt-6 border-t border-white/[0.09] flex gap-9 flex-wrap">
            <div>
              <b className="block font-serif text-3xl text-ink">
                By appt
              </b>
              <span className="text-xs tracking-wide uppercase text-ink-soft">
                Personalised booking
              </span>
            </div>
            <div>
              <b className="block font-serif text-3xl text-ink">
                100%
              </b>
              <span className="text-xs tracking-wide uppercase text-ink-soft">
                Custom designs
              </span>
            </div>
            <div>
              <b className="block font-serif text-3xl text-ink">
                East London
              </b>
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
