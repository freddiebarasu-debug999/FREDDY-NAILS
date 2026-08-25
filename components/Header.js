"use client";
import { useState } from "react";
const LINKS = [
  { href: "#gallery", label: "Gallery" },
  { href: "#services", label: "Services" },
  { href: "#offers", label: "Offers" },
  { href: "#reviews", label: "Reviews" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];
export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-[#d6b36a]/20 bg-[#11100f]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-4">
        {/* Logo */}
        <div className="font-serif text-xl tracking-tight text-[#f4eee6]">
          Freddy <span className="text-[#d6b36a]">Nails</span>
        </div>
        {/* Desktop Navigation */}
        <nav className="hidden gap-7 text-sm font-semibold md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="nav-link text-[#f4eee6]/85 transition-colors hover:text-[#d6b36a] hover:opacity-100"
            >
              {l.label}
            </a>
          ))}
        </nav>
        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <a
            href="/account"
            className="px-3 py-[10px] text-xs font-bold uppercase tracking-wide text-[#f4eee6]/90 transition-colors hover:text-[#d6b36a]"
          >
            My Account
          </a>
          {/* Book Now → Ready to book your next set? */}
          <a
            href="#booking"
            className="rounded-sm bg-[#d6b36a] px-5 py-[11px] text-xs font-bold uppercase tracking-wide text-[#11100f] transition-colors hover:bg-[#ad8a4e]"
          >
            Book now
          </a>
        </div>
        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="flex flex-col gap-[5px] p-2 md:hidden"
        >
          <span className="block h-[1.5px] w-[22px] bg-[#f4eee6]" />
          <span className="block h-[1.5px] w-[22px] bg-[#f4eee6]" />
          <span className="block h-[1.5px] w-[22px] bg-[#f4eee6]" />
        </button>
      </div>
      {/* Mobile Menu */}
      {open && (
        <div
          id="mobile-menu"
          className="flex flex-col gap-3 border-t border-[#d6b36a]/20 bg-[#151311] px-5 pb-6 pt-4"
        >
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-1.5 text-[0.95rem] font-semibold text-[#f4eee6] transition-colors hover:text-[#d6b36a]"
            >
              {l.label}
            </a>
          ))}
          {/* Mobile Account */}
          <a
            href="/account"
            onClick={() => setOpen(false)}
            className="py-1.5 text-[0.95rem] font-semibold text-[#d6b36a] transition-colors hover:text-[#f4eee6]"
          >
            My Account
          </a>
          {/* Mobile Book Button */}
          <a
            href="#booking"
            onClick={() => setOpen(false)}
            className="inline-block w-fit rounded-sm bg-[#d6b36a] px-5 py-[11px] text-xs font-bold uppercase tracking-wide text-[#11100f] transition-colors hover:bg-[#ad8a4e]"
          >
            Book now
          </a>
        </div>
      )}
    </header>
  );
} "use client";
import { useState } from "react";
const LINKS = [
  { href: "#gallery", label: "Gallery" },
  { href: "#services", label: "Services" },
  { href: "#offers", label: "Offers" },
  { href: "#reviews", label: "Reviews" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];
export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-[#d6b36a]/20 bg-[#11100f]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-4">
        {/* Logo */}
        <div className="font-serif text-xl tracking-tight text-[#f4eee6]">
          Freddy <span className="text-[#d6b36a]">Nails</span>
        </div>
        {/* Desktop Navigation */}
        <nav className="hidden gap-7 text-sm font-semibold md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="nav-link text-[#f4eee6]/85 transition-colors hover:text-[#d6b36a] hover:opacity-100"
            >
              {l.label}
            </a>
          ))}
        </nav>
        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <a
            href="/account"
            className="px-3 py-[10px] text-xs font-bold uppercase tracking-wide text-[#f4eee6]/90 transition-colors hover:text-[#d6b36a]"
          >
            My Account
          </a>
          {/* Book Now → Ready to book your next set? */}
          <a
            href="#booking"
            className="rounded-sm bg-[#d6b36a] px-5 py-[11px] text-xs font-bold uppercase tracking-wide text-[#11100f] transition-colors hover:bg-[#ad8a4e]"
          >
            Book now
          </a>
        </div>
        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="flex flex-col gap-[5px] p-2 md:hidden"
        >
          <span className="block h-[1.5px] w-[22px] bg-[#f4eee6]" />
          <span className="block h-[1.5px] w-[22px] bg-[#f4eee6]" />
          <span className="block h-[1.5px] w-[22px] bg-[#f4eee6]" />
        </button>
      </div>
      {/* Mobile Menu */}
      {open && (
        <div
          id="mobile-menu"
          className="flex flex-col gap-3 border-t border-[#d6b36a]/20 bg-[#151311] px-5 pb-6 pt-4"
        >
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-1.5 text-[0.95rem] font-semibold text-[#f4eee6] transition-colors hover:text-[#d6b36a]"
            >
              {l.label}
            </a>
          ))}
          {/* Mobile Account */}
          <a
            href="/account"
            onClick={() => setOpen(false)}
            className="py-1.5 text-[0.95rem] font-semibold text-[#d6b36a] transition-colors hover:text-[#f4eee6]"
          >
            My Account
          </a>
          {/* Mobile Book Button */}
          <a
            href="#booking"
            onClick={() => setOpen(false)}
            className="inline-block w-fit rounded-sm bg-[#d6b36a] px-5 py-[11px] text-xs font-bold uppercase tracking-wide text-[#11100f] transition-colors hover:bg-[#ad8a4e]"
          >
            Book now
          </a>
        </div>
      )}
    </header>
  );
}
