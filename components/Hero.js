export default function Hero() {
  return (
    <div
      id="home"
      className="max-w-[1180px] mx-auto px-5 py-16 md:py-24 grid gap-9 md:grid-cols-[1.1fr_0.9fr] md:items-center"
    >
      <div>
        <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold">
          Freddy Nails Studio
        </p>
        <h1 className="font-serif font-medium leading-[1.02] tracking-tight text-[clamp(2.5rem,6vw,4.3rem)] mt-4 mb-5">
          Nails, made
          <br />
          <em className="not-italic font-normal italic text-gold-bright">an occasion.</em>
        </h1>
        <p className="text-[1.08rem] leading-relaxed max-w-[46ch] text-ink-soft">
          A quiet, precise studio for gel manicures, hand-painted art and
          long-wear extensions — for the women who notice detail and the
          professionals who don&apos;t have time to.
        </p>
        <div className="flex flex-wrap gap-3.5 mt-7">
          <a
            href="#booking"
            className="inline-flex items-center gap-2.5 bg-ink text-nude border border-ink px-7 py-[15px] rounded-sm text-[0.85rem] font-bold uppercase tracking-wide hover:bg-gold hover:border-gold hover:text-ink transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.28-1.38c1.45.79 3.08 1.21 4.71 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" />
            </svg>
            Book on WhatsApp
          </a>
          <a
            href="#services"
            className="border border-ink px-6.5 py-[15px] rounded-sm text-[0.85rem] font-bold uppercase tracking-wide hover:bg-ink hover:text-nude transition-colors"
          >
            View services
          </a>
        </div>
      </div>

      <div className="relative aspect-[4/5] rounded overflow-hidden border border-line bg-[radial-gradient(circle_at_30%_20%,#E7CFA1_0%,transparent_45%),radial-gradient(circle_at_75%_70%,#C79A66_0%,transparent_50%),linear-gradient(160deg,#2A2420_0%,#171412_60%,#0F0C0A_100%)]">
        <div className="absolute inset-3.5 border border-gold-bright/40" />
        <div className="absolute left-6 bottom-6 text-nude">
          <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-gold-bright">
            Signature finish
          </p>
          <p className="font-serif text-2xl mt-1.5">Gold Leaf Signature</p>
        </div>
      </div>
    </div>
  );
}
