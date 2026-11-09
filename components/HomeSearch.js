"use client";

import { useMemo, useState } from "react";

const SEARCH_ITEMS = [
  { title: "Acrylic Nails", description: "Acrylic sets, French tips and ombré", search: "acrylic" },
  { title: "Gel Nails", description: "Gel overlays, plain gel and French gel", search: "gel" },
  { title: "Pedicures", description: "Pedicure sets and foot treatments", search: "pedicure" },
  { title: "Nail Art & Extras", description: "Nail art, repairs, soak-off and add-ons", search: "nail art" },
  { title: "Eyelash Extensions", description: "Classic, cat-eye and cluster lashes", search: "eyelash" },
  { title: "Foot Spa", description: "Basic and luxury foot spa treatments", search: "foot spa" },
];

export default function HomeSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SEARCH_ITEMS.filter((item) =>
      `${item.title} ${item.description} ${item.search}`.toLowerCase().includes(q)
    ).slice(0, 6).map((item) => ({
      ...item,
      href: `/services?search=${encodeURIComponent(item.search)}`,
    }));
  }, [query]);

  return (
    <section className="relative z-20 mx-auto w-full max-w-3xl px-5 py-7 md:py-10" aria-label="Search Freddy Nails">
      <div className="rounded-2xl border border-[#d6b36a]/30 bg-[#171513]/95 p-2 shadow-[0_18px_55px_rgba(0,0,0,0.28)]">
        <label className="flex items-center gap-3 px-3">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[#d6b36a]" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 5 5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 140)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && results[0]) window.location.href = results[0].href;
              if (event.key === "Escape") setQuery("");
            }}
            placeholder="What are you looking for?"
            aria-label="Search Freddy Nails services"
            className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[#f4eee6] outline-none placeholder:text-[#9a9186]"
          />
          {query && <button type="button" onClick={() => setQuery("")} className="px-2 text-xs text-[#d6b36a]">Clear</button>}
        </label>
        {focused && query.trim() && (
          <div className="mt-2 border-t border-white/10 pt-2">
            {results.length ? results.map((item) => (
              <a key={item.title} href={item.href} className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 text-left transition hover:bg-white/[0.06]">
                <span><span className="block text-sm text-[#f4eee6]">{item.title}</span><span className="mt-1 block text-xs text-[#aaa096]">{item.description}</span></span>
                <span aria-hidden="true" className="text-[#d6b36a]">↗</span>
              </a>
            )) : <p className="px-4 py-3 text-sm text-[#aaa096]">No matching service found. Try “acrylic”, “gel”, “pedicure”, “lashes” or “foot spa”.</p>}
          </div>
        )}
      </div>
      <p className="mt-3 text-center text-[0.68rem] uppercase tracking-[0.18em] text-[#aaa096]">Search our nail and beauty services</p>
    </section>
  );
}
