"use client";

import { useState } from "react";

const LINKS = [
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
  { href: "#gallery", label: "Gallery" },
  { href: "#offers", label: "Offers" },
  { href: "#reviews", label: "Reviews" },
  { href: "#contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#11100f]/95 backdrop-blur-xl border-b border-[#d6b36a]/20">
      <div className="max-w-[1180px] mx-auto px-5 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <div className="font-serif text-xl tracking-tight text-[#f4eee6]">
          Freddy <span className="text-[#d6b36a]">Nails</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-7 text-sm font-semibold">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="nav-link text-[#f4eee6]/85 hover:text-[#d6b36a] hover:opacity-100 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop Book Button */}
        <a
          href="#booking"
          className="hidden md:inline-block bg-[#d6b36a] text-[#11100f] px-5 py-[11px] rounded-sm text-xs font-bold uppercase tracking-wide hover:bg-[#ad8a4e] transition-colors"
        >
          Book now
        </a>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="md:hidden flex flex-col gap-[5px] p-2"
        >
          <span className="w-[22px] h-[1.5px] bg-[#f4eee6] block" />
          <span className="w-[22px] h-[1.5px] bg-[#f4eee6] block" />
          <span className="w-[22px] h-[1.5px] bg-[#f4eee6] block" />
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div
          id="mobile-menu"
          className="flex flex-col gap-3 px-5 pb-6 pt-4 bg-[#151311] border-t border-[#d6b36a]/20"
        >
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="font-semibold text-[0.95rem] py-1.5 text-[#f4eee6] hover:text-[#d6b36a] transition-colors"
            >
              {l.label}
            </a>
          ))}

          <a
            href="#booking"
            onClick={() => setOpen(false)}
            className="inline-block w-fit bg-[#d6b36a] text-[#11100f] px-5 py-[11px] rounded-sm text-xs font-bold uppercase tracking-wide hover:bg-[#ad8a4e] transition-colors"
          >
            Book now
          </a>
        </div>
      )}
    </header>
  );
}
