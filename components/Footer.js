const LINKS = [
  { href: "/#gallery", label: "Gallery" },
  { href: "/#reviews", label: "Reviews" },
  { href: "/services", label: "Services" },
  { href: "/offers", label: "Specials & Promos" },
  { href: "/faq", label: "FAQs" },
  { href: "/about", label: "About" },
  { href: "/#contact", label: "Contact" },
  { href: "/account", label: "My Account" },
];

export default function Footer() {
  return (
    <footer className="bg-[#11100f] text-[#a79a87] px-5 pt-14 pb-8 border-t border-white/[0.08]">
      <div className="max-w-[1180px] mx-auto">
        <div className="flex flex-wrap justify-between items-start gap-8">
          {/* Brand */}
          <div>
            <a
              href="/"
              className="font-serif text-xl text-[#f4eee6]"
            >
              Freddy{" "}
              <span className="text-[#d6b36a]">
                Nails
              </span>
            </a>

            <p className="mt-3 max-w-[280px] text-[0.78rem] leading-relaxed text-[#817970]">
              Professional nail artistry, personalised designs and a
              polished studio experience in East London.
            </p>
          </div>

          {/* Navigation */}
          <div className="flex max-w-[500px] flex-wrap gap-x-6 gap-y-3 text-[0.82rem]">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[#a79a87] hover:text-[#d6b36a] transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom line */}
        <div className="max-w-[1180px] mx-auto mt-9 border-t border-white/[0.09] pt-5 text-[0.75rem] text-[#817970] flex justify-between flex-wrap gap-3">
          <span>©️ 2026 Freddy Nails Studio.</span>

          <span>
            Built with Next.js · Nude / Black / Gold
          </span>
        </div>
      </div>
    </footer>
  );
}
