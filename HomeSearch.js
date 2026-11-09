"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const SEARCH_ITEMS = [
  {
    title: "Acrylic Nails",
    description: "Acrylic sets, French tips and ombré",
    search: "acrylic",
  },
  {
    title: "Gel Nails",
    description: "Gel overlays, plain gel and French gel",
    search: "gel",
  },
  {
    title: "Pedicures",
    description: "Pedicure sets and foot treatments",
    search: "pedicure",
  },
  {
    title: "Nail Art & Extras",
    description: "Nail art, repairs, soak-off and add-ons",
    search: "nail art",
  },
  {
    title: "Eyelash Extensions",
    description: "Classic, cat-eye and cluster lashes",
    search: "eyelash",
  },
  {
    title: "Foot Spa",
    description: "Basic and luxury foot spa treatments",
    search: "foot spa",
  },
];

export default function HomeSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const wrapRef = useRef(null);
  const navigating = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 550);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    function onDoc(e) {
      if (navigating.current) return;
      if (!wrapRef.current?.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SEARCH_ITEMS.filter((item) =>
      `${item.title} ${item.description} ${item.search}`
        .toLowerCase()
        .includes(q)
    )
      .slice(0, 6)
      .map((item) => ({
        ...item,
        href: `/services?search=${encodeURIComponent(item.search)}`,
      }));
  }, [query]);

  const showList = open && query.trim().length > 0;

  function goTo(href) {
    navigating.current = true;
    setOpen(false);
    // assign works reliably on iOS Safari
    window.location.assign(href);
  }

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-3 z-30 px-4 sm:top-5 sm:px-5 md:top-6 transition-all duration-700 ease-out ${
        entered ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      }`}
      aria-label="Search Freddy Nails"
    >
      <div
        ref={wrapRef}
        className="pointer-events-auto relative mx-auto w-full max-w-[584px]"
      >
        <div
          className={`flex items-center gap-3 px-4 transition-all ${
            showList
              ? "rounded-t-[24px] rounded-b-none bg-[#181614] shadow-[0_8px_28px_rgba(0,0,0,0.55)]"
              : "rounded-full bg-[#181614]/92 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:bg-[#1f1c19]"
          }`}
          style={{ minHeight: 48 }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-[18px] w-[18px] shrink-0 text-[#d6b36a]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>

          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) {
                e.preventDefault();
                goTo(results[0].href);
              }
              if (e.key === "Escape") {
                setQuery("");
                setOpen(false);
              }
            }}
            placeholder="What are you looking for?"
            aria-label="Search Freddy Nails services"
            autoComplete="off"
            enterKeyHint="search"
            className="min-w-0 flex-1 bg-transparent py-3.5 text-[16px] text-[#f4eee6] outline-none placeholder:text-[#9a9186]"
            style={{ border: "none", boxShadow: "none", WebkitAppearance: "none" }}
          />

          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setOpen(true);
              }}
              aria-label="Clear search"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#9a9186] transition hover:bg-[#d6b36a]/15 hover:text-[#d6b36a]"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          ) : null}
        </div>

        {showList ? (
          <ul
            className="absolute left-0 right-0 top-full z-[60] m-0 list-none overflow-hidden rounded-b-[24px] bg-[#181614] p-0 pb-2 shadow-[0_12px_32px_rgba(0,0,0,0.6)]"
            role="listbox"
          >
            <li className="mx-4 list-none border-t border-[#d6b36a]/20" aria-hidden />
            {results.length ? (
              results.map((item) => (
                <li key={item.title} className="list-none">
                  <a
                    href={item.href}
                    role="option"
                    onClick={(e) => {
                      e.preventDefault();
                      goTo(item.href);
                    }}
                    onPointerDown={(e) => {
                      // Stop the document closer; keep the input from stealing the gesture
                      e.stopPropagation();
                    }}
                    className="flex min-h-[52px] cursor-pointer touch-manipulation items-center gap-3 px-4 py-3 transition active:bg-[#2a2620] hover:bg-[#211e1a]"
                    style={{ WebkitTapHighlightColor: "rgba(214,179,106,0.15)" }}
                  >
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      className="h-4 w-4 shrink-0 text-[#d6b36a]/80"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="10.5" cy="10.5" r="6.5" />
                      <path d="m16 16 4.5 4.5" strokeLinecap="round" />
                    </svg>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-[15px] text-[#f4eee6]">
                        {item.title}
                      </span>
                      <span className="block truncate text-[12px] text-[#9a9186]">
                        {item.description}
                      </span>
                    </span>
                    <span className="text-[#d6b36a]" aria-hidden>
                      ↗
                    </span>
                  </a>
                </li>
              ))
            ) : (
              <li className="list-none px-4 py-3 text-[14px] text-[#9a9186]">
                No results — try acrylic, gel, pedicure, lashes or foot spa
              </li>
            )}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
