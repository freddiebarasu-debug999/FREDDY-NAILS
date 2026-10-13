import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OfferTab from "@/components/OfferTab";
import ChatBot from "../../ChatBot";
import { SERVICE_LANDINGS, getLanding } from "@/lib/serviceLandings";

const SITE_URL = "https://freddynails.co.za";

export function generateStaticParams() {
  return SERVICE_LANDINGS.map(function (s) {
    return { slug: s.slug };
  });
}

export function generateMetadata({ params }) {
  const page = getLanding(params.slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: SITE_URL + "/services/" + page.slug },
    openGraph: {
      type: "article",
      url: SITE_URL + "/services/" + page.slug,
      title: page.title,
      description: page.description,
      locale: "en_ZA",
    },
  };
}

export default function ServiceLandingPage({ params }) {
  const page = getLanding(params.slug);
  if (!page) notFound();

  const url = SITE_URL + "/services/" + page.slug;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: page.short + " in East London",
      description: page.description,
      url: url,
      provider: { "@id": SITE_URL + "/#business" },
      areaServed: [
        { "@type": "Place", name: "Quigney" },
        { "@type": "City", name: "East London" },
        { "@type": "City", name: "KuGompo City" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faqs.map(function (f) {
        return {
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        };
      }),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
        { "@type": "ListItem", position: 2, name: "Services", item: SITE_URL + "/services" },
        { "@type": "ListItem", position: 3, name: page.short, item: url },
      ],
    },
  ];

  const others = SERVICE_LANDINGS.filter(function (s) {
    return s.slug !== page.slug;
  });

  return (
    <>
      <OfferTab />
      <Header />

      <main className="mx-auto max-w-[900px] px-5 pb-24 pt-16 text-[#f4eee6]">
        {jsonLd.map(function (block, i) {
          return (
            <script
              key={i}
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(block).replace(/</g, "\\u003c"),
              }}
            />
          );
        })}

        <nav aria-label="Breadcrumb" className="text-xs text-[#9f978f]">
          <a href="/" className="hover:text-[#d6b36a]">Home</a> /{" "}
          <a href="/services" className="hover:text-[#d6b36a]">Services</a> / {page.short}
        </nav>

        <h1 className="mt-4 font-serif text-[clamp(2rem,5vw,3.4rem)] leading-tight">
          {page.h1}
        </h1>
        <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-[#c9c0b6]">
          {page.intro}
        </p>

        <a
          href="/account/signup"
          className="mt-7 inline-block rounded-full bg-[#d6b36a] px-8 py-3 text-sm font-bold text-[#11100f] transition-transform hover:scale-105"
        >
          Book {page.short.toLowerCase()} online
        </a>

        <section className="mt-14">
          <h2 className="font-serif text-2xl">Prices</h2>
          <ul className="mt-4 divide-y divide-white/[0.08] rounded-xl border border-white/[0.08] bg-white/[0.02]">
            {page.menu.map(function (item) {
              return (
                <li key={item} className="px-5 py-3 text-[#e9e0d4]">
                  {item}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-[#8f877e]">
            See the <a href="/services" className="text-[#d6b36a] underline">full service menu</a> for every option and price.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">Why clients choose Freddy Nails</h2>
          <ul className="mt-4 space-y-3 text-[#c9c0b6]">
            {page.why.map(function (w) {
              return (
                <li key={w} className="flex gap-3">
                  <span aria-hidden="true" className="text-[#d6b36a]">&#10022;</span>
                  <span>{w}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">Find us</h2>
          <p className="mt-3 text-[#c9c0b6]">
            Freddy Nails is at 8 Rhodes Street, Quigney, East London (KuGompo City),
            Eastern Cape. Message us on WhatsApp on 071 088 8897 or book online.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">Questions</h2>
          <div className="mt-4 space-y-5">
            {page.faqs.map(function (f) {
              return (
                <div key={f.q}>
                  <h3 className="font-semibold text-[#f4eee6]">{f.q}</h3>
                  <p className="mt-1 text-[#c9c0b6]">{f.a}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-14 border-t border-white/[0.08] pt-8">
          <h2 className="font-serif text-xl">More from Freddy Nails</h2>
          <ul className="mt-4 flex flex-wrap gap-3 text-sm">
            {others.map(function (o) {
              return (
                <li key={o.slug}>
                  <a
                    href={"/services/" + o.slug}
                    className="rounded-full border border-[#d6b36a]/40 px-4 py-2 text-[#d6b36a] hover:bg-[#d6b36a]/10"
                  >
                    {o.short}
                  </a>
                </li>
              );
            })}
            <li>
              <a href="/shape-guide" className="rounded-full border border-[#d6b36a]/40 px-4 py-2 text-[#d6b36a] hover:bg-[#d6b36a]/10">
                Shape guide
              </a>
            </li>
            <li>
              <a href="/colours" className="rounded-full border border-[#d6b36a]/40 px-4 py-2 text-[#d6b36a] hover:bg-[#d6b36a]/10">
                Gel colours
              </a>
            </li>
          </ul>
        </section>
      </main>

      <Footer />
      <ChatBot />
    </>
  );
}
