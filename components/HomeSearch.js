"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [focused, setFocused] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    // Search bar slides in after hero content
    const t = setTimeout(() => setEntered(true), 550);
    return () => clearTimeout(t);
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

  const open = focused && query.trim().length > 0;

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-3 z-30 px-4 sm:top-5 sm:px-5 md:top-6 transition-all duration-700 ease-out ${
        entered
          ? "translate-y-0 opacity-100"
          : "translate-y-5 opacity-0"
      }`}
      aria-label="Search Freddy Nails"
    >
      <div className="pointer-events-auto relative mx-auto w-full max-w-[584px]">
        <div
          className={`flex items-center gap-3 bg-[#303134] px-4 transition-shadow ${
            open
              ? "rounded-t-[24px] rounded-b-none shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
              : "rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.35)] hover:bg-[#3c4043] hover:shadow-[0_3px_12px_rgba(0,0,0,0.45)]"
          } ${focused && !open ? "bg-[#3c4043]" : ""}`}
          style={{ minHeight: 46 }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-[18px] w-[18px] shrink-0 text-[#9aa0a6]"
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
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) {
                window.location.href = results[0].href;
              }
              if (e.key === "Escape") setQuery("");
            }}
            placeholder="What are you looking for?"
            aria-label="Search Freddy Nails services"
            className="min-w-0 flex-1 bg-transparent py-3 text-[15px] text-[#e8eaed] outline-none placeholder:text-[#9aa0a6]"
            style={{ border: "none", boxShadow: "none" }}
          />

          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#9aa0a6] transition hover:bg-white/10 hover:text-[#e8eaed]"
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

        {open ? (
          <div className="absolute left-0 right-0 top-full z-40 overflow-hidden rounded-b-[24px] bg-[#303134] pb-2 shadow-[0_8px_16px_rgba(0,0,0,0.55)]">
            <div className="mx-4 border-t border-[#5f6368]/50" />
            {results.length ? (
              results.map((item) => (
                <a
                  key={item.title}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-[#3c4043]"
                >
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    className="h-4 w-4 shrink-0 text-[#9aa0a6]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="10.5" cy="10.5" r="6.5" />
                    <path d="m16 16 4.5 4.5" strokeLinecap="round" />
                  </svg>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] text-[#e8eaed]">
                      {item.title}
                    </span>
                    <span className="block truncate text-[12px] text-[#9aa0a6]">
                      {item.description}
                    </span>
                  </span>
                </a>
              ))
            ) : (
              <p className="px-4 py-3 text-[14px] text-[#9aa0a6]">
                No results — try acrylic, gel, pedicure, lashes or foot spa
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
