"use client";

import { useEffect, useState } from "react";

const HOME_LINKS = [
  {
    href: "/#gallery",
    label: "Gallery",
    blurb: "Browse real client sets — acrylics, gels, art and finishes from the studio.",
  },
  {
    href: "/#reviews",
    label: "Reviews",
    blurb: "See what clients say about their visits and results at Freddy Nails.",
  },
  {
    href: "/#contact",
    label: "Contact",
    blurb: "Find our Quigney address, WhatsApp number and how to get in touch.",
  },
];

const MENU_LINKS = [
  {
    href: "/services",
    label: "Services",
    blurb: "Full menu of acrylics, gels, pedicures, nail art and lash extensions with pricing guidance.",
  },
  {
    href: "/offers",
    label: "Specials & Promos",
    blurb: "Current promo codes and ways to save — first visit, birthday, friend and more.",
  },
  {
    href: "/shape-guide",
    label: "Shape Guide",
    blurb: "Compare nail shapes so you can choose the look that suits your hands.",
  },
  {
    href: "/about",
    label: "About",
    blurb: "Meet the studio — our story, location in Quigney, and what makes Freddy Nails different.",
  },
  {
    href: "/faq",
    label: "FAQs",
    blurb: "Booking, deposits, aftercare and common questions answered clearly.",
  },
];

const GUIDE_ITEMS = [
  {
    href: "/",
    label: "Home",
    blurb: "Welcome page with studio intro, gallery, reviews and contact.",
  },
  ...HOME_LINKS,
  ...MENU_LINKS,
  {
    href: "/account",
    label: "My Account",
    blurb: "Log in to manage bookings, pay deposits, view offers and loyalty status.",
  },
  {
    href: "/account/book",
    label: "Book now",
    blurb: "Reserve your appointment online — choose service, date and time.",
  },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  // Light check for an existing login (no library loaded): Supabase keeps the
  // session in localStorage under a key like "sb-xxxx-auth-token".
  useEffect(() => {
    try {
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i) || "";
        if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
          setSignedIn(true);
          return;
        }
      }
    } catch {
      // localStorage unavailable: keep the logged-out label.
    }
  }, []);

  const accountHref = signedIn ? "/account" : "/account/login";
  const accountLabel = signedIn ? "My Account" : "Sign up / Log in";
  const [menuOpen, setMenuOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);

  function closeMenus() {
    setOpen(false);
    setMenuOpen(false);
  }

  function openGuide(e) {
    e?.preventDefault?.();
    closeMenus();
    setGuideOpen(true);
    requestAnimationFrame(() => setGuideVisible(true));
  }

  function closeGuide() {
    setGuideVisible(false);
    setTimeout(() => setGuideOpen(false), 280);
  }

  useEffect(() => {
    if (!guideOpen) return;
    function onKey(e) {
      if (e.key === "Escape") closeGuide();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guideOpen]);

  // Lock body scroll while mobile menu or guide is open
  useEffect(() => {
    const lock = open || guideOpen;
    document.body.style.overflow = lock ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, guideOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#d6b36a]/20 bg-[#11100f]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-3.5">
          {/* Logo — circular mark opens Site Guide; wordmark goes home */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openGuide}
              aria-label="Open site guide — what each page is for"
              className="group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#d6b36a] overflow-hidden shadow-[0_0_0_1px_rgba(214,179,106,0.15)] transition-transform hover:scale-[1.04] active:scale-95"
            >
              <img
                src="/freddy-nails-logo-sm.webp"
                alt=""
                width={144}
                height={144}
                decoding="async"
                className="h-full w-full object-cover"
              />
              <span className="pointer-events-none absolute inset-0 rounded-full ring-0 transition-all duration-300 group-hover:ring-2 group-hover:ring-[#d6b36a]/40" />
            </button>
            <a
              href="/"
              onClick={closeMenus}
              className="font-serif text-xl tracking-tight text-[#f4eee6] transition-colors hover:text-[#d6b36a]"
            >
              Freddy <span className="text-[#d6b36a]">Nails</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-5 text-sm font-semibold md:flex">
            <a
              href="/"
              className="nav-link text-[#f4eee6]/85 transition-colors hover:text-[#d6b36a]"
            >
              Home
            </a>
            {HOME_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="nav-link text-[#f4eee6]/85 transition-colors hover:text-[#d6b36a]"
              >
                {link.label}
              </a>
            ))}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
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
                <div className="absolute right-0 top-[calc(100%+14px)] w-52 overflow-hidden rounded-sm border border-[#d6b36a]/20 bg-[#151311] shadow-2xl">
                  {MENU_LINKS.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="block border-b border-white/[0.06] px-4 py-3 text-[0.8rem] font-semibold text-[#f4eee6] transition-colors last:border-b-0 hover:bg-[#211e1a] hover:text-[#d6b36a]"
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
              href={accountHref}
              className="px-3 py-[9px] text-xs font-bold uppercase tracking-wide text-[#f4eee6]/90 transition-colors hover:text-[#d6b36a]"
            >
              {accountLabel}
            </a>
            <a
              href="/account/book"
              className="rounded-sm bg-[#d6b36a] px-5 py-[10px] text-xs font-bold uppercase tracking-wide text-[#11100f] transition-colors hover:bg-[#ad8a4e]"
            >
              Book now
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="relative flex h-10 w-10 items-center justify-center md:hidden"
          >
            <span
              className={`absolute block h-[1.5px] w-5 bg-[#f4eee6] transition-all duration-300 ${
                open ? "rotate-45" : "-translate-y-[5px]"
              }`}
            />
            <span
              className={`absolute block h-[1.5px] w-5 bg-[#f4eee6] transition-all duration-300 ${
                open ? "opacity-0 scale-x-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute block h-[1.5px] w-5 bg-[#f4eee6] transition-all duration-300 ${
                open ? "-rotate-45" : "translate-y-[5px]"
              }`}
            />
          </button>
        </div>

        {/* Mobile Menu — compact */}
        <div
          id="mobile-menu"
          className={`md:hidden overflow-hidden border-t border-[#d6b36a]/15 bg-[#151311] transition-all duration-300 ease-out ${
            open ? "max-h-[85vh] opacity-100" : "max-h-0 opacity-0 border-t-0"
          }`}
        >
          <div className="px-5 pb-5 pt-3">
            {/* Quick actions */}
            <div className="mb-3 grid grid-cols-2 gap-2">
              <a
                href="/account/book"
                onClick={closeMenus}
                className="rounded-sm bg-[#d6b36a] py-2.5 text-center text-[0.7rem] font-bold uppercase tracking-wide text-[#11100f]"
              >
                Book now
              </a>
              <a
                href={accountHref}
                onClick={closeMenus}
                className="rounded-sm border border-[#d6b36a]/35 py-2.5 text-center text-[0.7rem] font-bold uppercase tracking-wide text-[#d6b36a]"
              >
                {accountLabel}
              </a>
            </div>

            {/* Compact link list */}
            <nav className="flex flex-col">
              <a
                href="/"
                onClick={closeMenus}
                className="border-b border-white/[0.05] py-2.5 text-[0.9rem] font-semibold text-[#f4eee6] hover:text-[#d6b36a]"
              >
                Home
              </a>
              {HOME_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMenus}
                  className="border-b border-white/[0.05] py-2.5 text-[0.9rem] font-semibold text-[#f4eee6] hover:text-[#d6b36a]"
                >
                  {link.label}
                </a>
              ))}

              <p className="pb-1 pt-3.5 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-[#d6b36a]/80">
                Explore
              </p>
              {MENU_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMenus}
                  className="border-b border-white/[0.05] py-2.5 text-[0.9rem] font-semibold text-[#f4eee6] hover:text-[#d6b36a]"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <button
              type="button"
              onClick={openGuide}
              className="mt-4 w-full rounded-sm border border-[#d6b36a]/25 py-2.5 text-center text-[0.75rem] font-semibold text-[#d6b36a] transition-colors hover:bg-[#d6b36a]/10"
            >
              Site guide — what each page is for
            </button>
          </div>
        </div>
      </header>

      {/* ── Animated Site Guide popup ── */}
      {guideOpen && (
        <div
          className={`fixed inset-0 z-[90] flex items-end justify-center sm:items-center px-0 sm:px-4 transition-opacity duration-300 ${
            guideVisible ? "opacity-100" : "opacity-0"
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="site-guide-title"
          onClick={closeGuide}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-[480px] max-h-[88vh] overflow-hidden rounded-t-2xl sm:rounded-2xl border border-[#d6b36a]/25 bg-[#141210] shadow-2xl transition-all duration-300 ease-out ${
              guideVisible
                ? "translate-y-0 scale-100"
                : "translate-y-8 sm:translate-y-4 scale-[0.97]"
            }`}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[#d6b36a]/15 bg-[#141210]/95 px-5 py-4 backdrop-blur-md">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#d6b36a]/50">
                  <img
                    src="/freddy-nails-logo-sm.webp"
                    alt=""
                    width={144}
                    height={144}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-[#d6b36a]">
                    Freddy Nails
                  </p>
                  <h2
                    id="site-guide-title"
                    className="font-serif text-xl text-[#f4eee6] leading-tight"
                  >
                    Site guide
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={closeGuide}
                aria-label="Close guide"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-[#c9c0b6] text-xl leading-none transition-colors hover:border-[#d6b36a]/40 hover:text-[#d6b36a]"
              >
                ×
              </button>
            </div>

            <p className="px-5 pt-3 pb-1 text-[0.8rem] leading-relaxed text-[#9a9088]">
              Tap any item to go there. Here&apos;s what each part of the site
              is for.
            </p>

            {/* Scrollable list with staggered feel via CSS delays on children */}
            <div className="overflow-y-auto max-h-[min(60vh,480px)] px-3 pb-5 pt-2">
              <ul className="flex flex-col gap-1.5">
                {GUIDE_ITEMS.map((item, index) => (
                  <li
                    key={item.href + item.label}
                    className="guide-item"
                    style={{
                      animationDelay: `${40 + index * 35}ms`,
                    }}
                  >
                    <a
                      href={item.href}
                      onClick={closeGuide}
                      className="group flex gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-[#d6b36a]/20 hover:bg-white/[0.03]"
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#d6b36a]/25 bg-[#d6b36a]/10 text-[0.65rem] font-bold text-[#d6b36a]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.9rem] font-semibold text-[#f4eee6] group-hover:text-[#d6b36a] transition-colors">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block text-[0.75rem] leading-snug text-[#8a8178]">
                          {item.blurb}
                        </span>
                      </span>
                      <span className="mt-1 shrink-0 text-[#d6b36a]/50 transition-transform group-hover:translate-x-0.5 group-hover:text-[#d6b36a]">
                        →
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-[#d6b36a]/12 px-5 py-3">
              <button
                type="button"
                onClick={closeGuide}
                className="w-full rounded-sm border border-[#d6b36a]/3 py-2.5 text-[0.75rem] font-semibold text-[#d6b36a] transition-colors hover:bg-[#d6b36a]/10"
              >
                Close guide
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .guide-item {
          opacity: 0;
          transform: translateY(8px);
          animation: guideIn 0.35s ease forwards;
        }

        @keyframes guideIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
