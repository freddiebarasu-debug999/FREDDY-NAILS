import Image from "next/image";
import Link from "next/link";

/** Bottom promo strip — offer + voucher matching mockup */

export default function HomePromoRow() {
  return (
    <section className="bg-[#f4eee6]">
      <div className="max-w-[1180px] mx-auto px-5 py-10 md:py-14">
        <div className="grid md:grid-cols-2 gap-4 md:gap-5">
          {/* Featured combo */}
          <div className="relative overflow-hidden rounded-2xl min-h-[240px] bg-[#181614]">
            <Image
              src="/gallery/gallery-8.jpg"
              alt="Spring Glow Combo"
              fill
              sizes="(max-width:768px) 100vw, 50vw"
              className="object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/20" />
            <div className="relative z-10 p-6 md:p-8 text-[#f4eee6]">
              <p className="text-[0.68rem] font-bold tracking-[0.18em] uppercase text-[#d6b36a]">
                September
              </p>
              <h3
                className="mt-2 text-2xl"
                style={{ fontFamily: "var(--font-fraunces), serif" }}
              >
                Spring Glow Combo
              </h3>
              <p className="mt-1 text-[#d6b36a] font-semibold text-lg">R300</p>
              <p className="mt-2 text-sm text-[#c9c0b6] max-w-[32ch]">
                Mani + Pedi (base only). Extras charged. Lashes & Foot Spa
                available.
              </p>
              <Link
                href="/account/book"
                className="mt-5 inline-flex rounded-full bg-[#d6b36a] px-5 py-2.5 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#11100f] hover:bg-[#e0c078]"
              >
                Book now →
              </Link>
            </div>
          </div>

          {/* Voucher */}
          <div className="relative overflow-hidden rounded-2xl min-h-[240px] border border-[#d6b36a]/20 bg-[#181614] p-6 md:p-8 text-[#f4eee6] flex flex-col justify-center">
            <p className="text-[0.68rem] font-bold tracking-[0.18em] uppercase text-[#d6b36a]">
              Welcome offer
            </p>
            <h3
              className="mt-2 text-3xl"
              style={{ fontFamily: "var(--font-fraunces), serif" }}
            >
              15% OFF
            </h3>
            <p className="mt-1 text-lg">Your Next Set</p>
            <p className="mt-3 text-sm text-[#c9c0b6] max-w-[36ch]">
              Use our exclusive voucher and treat yourself.
            </p>
            <Link
              href="/offers"
              className="mt-6 inline-flex w-fit rounded-full border border-[#d6b36a] px-5 py-2.5 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#d6b36a] transition-colors hover:bg-[#d6b36a] hover:text-[#11100f]"
            >
              Get voucher →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
