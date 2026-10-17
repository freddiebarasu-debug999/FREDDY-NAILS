import Image from "next/image";
import Link from "next/link";

/** Studio hero — matches reference mockup layout */

function IconPremium() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[#d6b36a] shrink-0">
      <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.12" />
    </svg>
  );
}
function IconCare() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[#d6b36a] shrink-0">
      <path d="M12 21s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.6-7 10-7 10z" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.12" />
    </svg>
  );
}
function IconDesign() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[#d6b36a] shrink-0">
      <path d="M12 3l2.2 6.6H21l-5.4 4 2.2 6.6L12 16.8 6.2 20.2l2.2-6.6L3 9.6h6.8L12 3z" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.12" strokeLinejoin="round" />
    </svg>
  );
}

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-[640px] md:min-h-[720px] flex items-center overflow-hidden bg-[#0c0b0a]"
    >
      <div className="absolute inset-0">
        <Image
          src="/hero-slide-1.jpg"
          alt="Freddy Nails gold leaf signature set"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[55%_36%] sm:object-[58%_34%] md:object-[60%_32%]"
        />
        {/* Soft cinematic left fade — same as reference */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #0c0b0a 0%, #0c0b0a 26%, rgba(12,11,10,0.92) 40%, rgba(12,11,10,0.55) 55%, rgba(12,11,10,0.18) 70%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(12,11,10,0.4) 0%, transparent 20%, transparent 78%, rgba(12,11,10,0.5) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[1180px] mx-auto px-5 py-14 md:py-20">
        <div className="max-w-[520px]">
          <h1
            className="font-serif font-medium leading-[1.08] text-[clamp(2.5rem,5.5vw,3.75rem)] text-[#f4eee6]"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            Freddy Nails Studio
          </h1>

          <p
            className="mt-2 font-serif italic font-normal leading-tight text-[clamp(1.5rem,3vw,2.05rem)] text-[#d6b36a]"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            Nails, made an occasion
          </p>

          <p className="mt-5 font-sans text-[1rem] leading-relaxed text-[#c9c0b6] max-w-[40ch]">
            Luxury nail services, bespoke nail art and premium care
            — because your nails deserve more.
          </p>

          <div className="mt-7">
            <Link
              href="/services"
              className="group inline-flex items-center gap-2.5 rounded-full border border-[#d6b36a] px-6 py-3 font-sans text-[0.75rem] font-bold uppercase tracking-[0.14em] text-[#d6b36a] transition-colors hover:bg-[#d6b36a] hover:text-[#11100f]"
            >
              Explore services
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-4">
            {[
              { Icon: IconPremium, title: "Premium Quality", blurb: "Only the best products" },
              { Icon: IconCare, title: "Expert Care", blurb: "Safe & hygienic" },
              { Icon: IconDesign, title: "Unique Designs", blurb: "Your style, our creativity" },
            ].map(({ Icon, title, blurb }) => (
              <div key={title} className="flex items-start gap-2.5">
                <Icon />
                <div>
                  <p className="font-sans text-[0.8rem] font-semibold text-[#f4eee6]">{title}</p>
                  <p className="mt-0.5 font-sans text-[0.7rem] text-[#9f978f]">{blurb}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
