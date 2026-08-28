export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-[640px] md:min-h-[760px] flex items-center overflow-hidden bg-[#0c0b0a]"
    >
      {/* Background photo */}
      <div className="absolute inset-0">
        <img
          src="/hero-slide-1.jpg"
          alt="Freddy Nails gold leaf signature set"
          className="h-full w-full object-contain object-[65%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c0b0a] via-[#0c0b0a]/70 to-[#0c0b0a]/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b0a]/60 via-transparent to-transparent" />
      </div>
      {/* Content */}
      <div className="relative z-10 max-w-[1180px] mx-auto px-5 w-full">
        <div className="max-w-[620px]">
          <h1 className="font-serif font-medium leading-[1.05] text-[clamp(2.6rem,6vw,4.2rem)] text-[#d6b36a]">
            Nails by Freddy,
            <br />
            Crafted to Perfection
          </h1>
          <div className="mt-6 h-px w-16 bg-[#d6b36a]/70" />
          <p className="mt-6 text-[1.05rem] leading-relaxed text-[#d6b36a] max-w-[46ch]">
            Luxury nail services designed to elevate your style and
            confidence.
          </p>
          <div className="mt-8">
            <a
              href="/account/signup"
              className="inline-flex items-center gap-2.5 bg-[#d6b36a] text-[#11100f] px-7 py-[15px] rounded-sm text-[0.9rem] font-bold hover:bg-[#ad8a4e] transition-colors"
            >
              Book Your Appointment →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
