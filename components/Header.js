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
    <header className="sticky top-0 z-50 bg-nude/90 backdrop-blur-md border-b border-line">
      <div className="max-w-[1180px] mx-auto px-5 py-4 flex items-center justify-between">
        <div className="font-serif text-xl tracking-tight">
          Freddy <span className="text-gold">Nails</span>
        </div>

        <nav className="hidden md:flex gap-7 text-sm font-semibold">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="nav-link opacity-85 hover:opacity-100">
              {l.label}
            </a>
          ))}
        </nav>

        <a
          href="#booking"
          className="hidden md:inline-block bg-ink text-nude px-5 py-[11px] rounded-sm text-xs font-bold uppercase tracking-wide hover:bg-gold hover:text-ink transition-colors"
        >
          Book now
        </a>

        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="md:hidden flex flex-col gap-[5px] p-2"
        >
          <span className="w-[22px] h-[1.5px] bg-ink block" />
          <span className="w-[22px] h-[1.5px] bg-ink block" />
          <span className="w-[22px] h-[1.5px] bg-ink block" />
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="flex flex-col gap-3 px-5 pb-6 border-t border-line">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="font-semibold text-[0.95rem] py-1.5"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#booking"
            onClick={() => setOpen(false)}
            className="inline-block w-fit bg-ink text-nude px-5 py-[11px] rounded-sm text-xs font-bold uppercase tracking-wide"
          >
            Book now
          </a>
        </div>
      )}
    </header>
  );
}
