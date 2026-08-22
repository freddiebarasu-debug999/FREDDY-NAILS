const LINKS = [
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
  { href: "#gallery", label: "Gallery" },
  { href: "#booking", label: "Booking" },
  { href: "#contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="bg-[#11100f] text-[#a79a87] px-5 pt-14 pb-8 border-t border-white/[0.08]">
      <div className="max-w-[1180px] mx-auto flex flex-wrap justify-between items-center gap-7">
        {/* Brand */}
        <div className="font-serif text-xl text-[#f4eee6]">
          Freddy{" "}
          <span className="text-[#d6b36a]">
            Nails
          </span>
        </div>

        {/* Navigation */}
        <div className="flex gap-6 flex-wrap text-[0.82rem]">
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
      <div className="max-w-[1180px] mx-auto mt-7 border-t border-white/[0.09] pt-5 text-[0.75rem] text-[#817970] flex justify-between flex-wrap gap-3">
        <span>© 2026 Freddy Nails Studio.</span>

        <span>
          Built with Next.js · Nude / Black / Gold
        </span>
      </div>
    </footer>
  );
}
