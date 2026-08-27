"use client";

import { useState } from "react";

const MENU_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/offers", label: "Specials & Promos" },
  { href: "/shape-guide", label: "Shape Guide" },
  { href: "/about", label: "About Freddy Nails" },
  { href: "/faq", label: "FAQs" },
];

const HOME_LINKS = [
  { href: "/#gallery", label: "Gallery" },
  { href: "/#reviews", label: "Reviews" },
  { href: "/#contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenus() {
    setOpen(false);
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#d6b36a]/20 bg-[#11100f]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-4">
        {/* Logo */}
        <a
          href="/"
          onClick={closeMenus}
          className="flex items-center gap-2 font-serif text-xl tracking-tight text-[#f4eee6]"
        >
          <img
            src="/freddy-nails-logo.png"
            alt="Freddy Nails"
            className="h-9 w-9 object-contain"
          />

          <span>
            Freddy <span className="text-[#d6b36a]">Nails</span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
          {HOME_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="nav-link text-[#f4eee6]/85 transition-colors hover:text-[#d6b36a]"
            >
              {link.label}
            </a>
          ))}

          {/* Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="flex items-center gap-1.5 text-[#f4eee6]/85 transition-colors hover:text-[#d6b36a]"
              aria-expanded={menuOpen}
            >
              Menu
              <span
                className={`text-[0.65rem] transition-transform duration-300 ${
                  menuOpen ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+18px)] w-56 overflow-hidden border border-[#d6b36a]/20 bg-[#151311] shadow-2xl">
                {MENU_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block border-b border-white/[0.06] px-5 py-3.5 text-[0.8rem] font-semibold text-[#f4eee6] transition-colors last:border-b-0 hover:bg-[#211e1a] hover:text-[#d6b36a]"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <a
            href="/account"
            className="px-3 py-[10px] text-xs font-bold uppercase tracking-wide text-[#f4eee6]/90 transition-colors hover:text-[#d6b36a]"
          >
            My Account
          </a>

          <a
            href="/account/signup"
            className="rounded-sm bg-[#d6b36a] px-5 py-[11px] text-xs font-bold uppercase tracking-wide text-[#11100f] transition-colors hover:bg-[#ad8a4e]"
          >
            Book now
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen((value) => !value)}
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
          className="border-t border-[#d6b36a]/20 bg-[#151311] px-5 pb-6 pt-4"
        >
          <div className="flex flex-col">
            <a
              href="/#gallery"
              onClick={closeMenus}
              className="border-b border-white/[0.06] py-3.5 text-[0.95rem] font-semibold text-[#f4eee6] hover:text-[#d6b36a]"
            >
              Gallery
            </a>

            <a
              href="/#reviews"
              onClick={closeMenus}
              className="border-b border-white/[0.06] py-3.5 text-[0.95rem] font-semibold text-[#f4eee6] hover:text-[#d6b36a]"
            >
              Reviews
            </a>

            <a
              href="/#contact"
              onClick={closeMenus}
              className="border-b border-white/[0.06] py-3.5 text-[0.95rem] font-semibold text-[#f4eee6] hover:text-[#d6b36a]"
            >
              Contact
            </a>

            <p className="pb-2 pt-5 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#d6b36a]">
              Explore
            </p>

            {MENU_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMenus}
                className="border-b border-white/[0.06] py-3.5 text-[0.95rem] font-semibold text-[#f4eee6] hover:text-[#d6b36a]"
              >
                {link.label}
              </a>
            ))}

            <a
              href="/account"
              onClick={closeMenus}
              className="mt-4 py-3.5 text-[0.95rem] font-semibold text-[#d6b36a] hover:text-[#f4eee6]"
            >
              My Account
            </a>

            <a
              href="/account/signup"
              onClick={closeMenus}
              className="mt-2 inline-flex w-fit items-center justify-center rounded-sm bg-[#d6b36a] px-5 py-[11px] text-xs font-bold uppercase tracking-wide text-[#11100f] transition-colors hover:bg-[#ad8a4e]"
            >
              Book now
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
