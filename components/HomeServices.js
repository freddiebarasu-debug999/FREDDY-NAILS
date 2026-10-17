import Image from "next/image";
import Link from "next/link";

/** Six service cards — cream band matching the mockup */

const CARDS = [
  { title: "Acrylic Nails", price: "R200 – R400", href: "/services", img: "/gallery/gallery-1.jpg" },
  { title: "Gel Overlay", price: "R200", href: "/services", img: "/gallery/gallery-2.jpg" },
  { title: "Gel Nails", price: "R250 – R350", href: "/services", img: "/gallery/gallery-3.jpg" },
  { title: "Pedicure", price: "R150 – R250", href: "/services", img: "/gallery/gallery-4.jpg" },
  { title: "Lashes", price: "R130 – R180", href: "/services", img: "/gallery/gallery-5.jpg" },
  { title: "Foot Spa", price: "R200 – R280", href: "/services", img: "/gallery/gallery-6.jpg" },
];

export default function HomeServices() {
  return (
    <section id="services-preview" className="bg-[#f4eee6] text-[#11100f]">
      <div className="max-w-[1180px] mx-auto px-5 py-12 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h2
              className="text-[clamp(1.75rem,3.2vw,2.25rem)] font-medium"
              style={{ fontFamily: "var(--font-fraunces), serif" }}
            >
              Our Services
            </h2>
            <p className="mt-1.5 text-sm text-[#5c534c]">
              Tailored to your style. Designed for your satisfaction.
            </p>
          </div>
          <Link
            href="/services"
            className="text-sm font-semibold text-[#8a6a35] hover:underline underline-offset-4"
          >
            View all services →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {CARDS.map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className="group relative overflow-hidden rounded-2xl bg-[#181614] aspect-[5/6] shadow-sm"
            >
              <Image
                src={c.img}
                alt={c.title}
                fill
                sizes="(max-width:768px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3.5 md:p-4 flex items-end justify-between gap-2">
                <div>
                  <p className="text-[0.92rem] font-semibold text-white leading-tight">{c.title}</p>
                  <p className="mt-0.5 text-[0.78rem] text-[#d6b36a]">{c.price}</p>
                </div>
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white text-sm transition-colors group-hover:bg-[#d6b36a] group-hover:text-[#11100f]"
                >
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
