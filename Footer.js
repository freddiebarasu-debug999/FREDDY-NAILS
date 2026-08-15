const LINKS = [
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
  { href: "#gallery", label: "Gallery" },
  { href: "#booking", label: "Booking" },
  { href: "#contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-[#A79A87] px-5 pt-12 pb-7">
      <div className="max-w-[1180px] mx-auto flex flex-wrap justify-between items-center gap-6">
        <div className="font-serif text-xl text-nude">
          Freddy <span className="text-gold-bright">Nails</span>
        </div>
        <div className="flex gap-6 flex-wrap text-[0.85rem]">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-gold-bright transition-colors">
              {l.label}
            </a>
          ))}
        </div>
      </div>
      <div className="max-w-[1180px] mx-auto mt-6.5 border-t border-white/10 pt-5 text-[0.78rem] flex justify-between flex-wrap gap-2.5">
        <span>© 2026 Freddy Nails Studio.</span>
        <span>Built with Next.js · Nude / Black / Gold</span>
      </div>
    </footer>
  );
}
