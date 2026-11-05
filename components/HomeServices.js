import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/Reveal";

const SERVICES = [
  {
    name: "Acrylic Nails",
    desc: "Structure, length and lasting wear — from classic to statement sets.",
    from: "From R200",
    href: "/services",
    img: "/gallery/gallery-2.jpg",
  },
  {
    name: "Gel & Overlays",
    desc: "Glossy, flexible colour with a refined finish.",
    from: "From R200",
    href: "/services",
    img: "/gallery/gallery-5.jpg",
  },
  {
    name: "Nail Art",
    desc: "Chrome, florals, French, 3D and custom designs.",
    from: "From R30",
    href: "/services",
    img: "/gallery/gallery-4.jpg",
  },
  {
    name: "Pedicures",
    desc: "Gel and acrylic options for polished toes.",
    from: "From R150",
    href: "/services",
    img: "/gallery/gallery-7.jpg",
  },
  {
    name: "Lashes",
    desc: "Cluster, cateye and classic lash sets.",
    from: "From R130",
    href: "/services",
    img: "/gallery/gallery-1.jpg",
  },
  {
    name: "Foot Spa",
    desc: "Basic and luxury treatments to reset tired feet.",
    from: "From R200",
    href: "/services",
    img: "/gallery/gallery-3.jpg",
  },
];

export default function HomeServices() {
  return (
    <section className="relative border-y border-[#d6b36a]/12 bg-[#11100f] py-16 md:py-20">
      <div className="mx-auto max-w-[1180px] px-5">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[#d6b36a]">
                Services
              </p>
              <h2
                className="mt-3 font-serif text-[clamp(1.9rem,4vw,2.6rem)] text-[#f4eee6]"
                style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
              >
                Designed around{" "}
                <span className="italic text-[#d6b36a]">your style</span>
              </h2>
            </div>
            <Link
              href="/services"
              className="text-sm font-semibold text-[#d6b36a] underline-offset-4 hover:underline"
            >
              Full menu & pricing →
            </Link>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <Reveal key={s.name}>
              <Link
                href={s.href}
                className="group relative block overflow-hidden rounded-sm border border-[#d6b36a]/15 bg-[#181614] transition-all duration-300 hover:-translate-y-1 hover:border-[#d6b36a]/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={s.img}
                    alt={s.name}
                    fill
                    sizes="(max-width:768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b0a] via-[#0c0b0a]/20 to-transparent" />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-serif text-xl text-[#f4eee6]">{s.name}</h3>
                    <span className="shrink-0 text-xs font-semibold text-[#d6b36a]">
                      {s.from}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#c9c0b6]">
                    {s.desc}
                  </p>
                  <span className="mt-4 inline-block text-xs font-bold uppercase tracking-[0.14em] text-[#d6b36a] opacity-80 transition group-hover:opacity-100">
                    View details →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
