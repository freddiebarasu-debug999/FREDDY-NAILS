"use client";

import { useMemo, useState } from "react";
import { GEL_COLOURS, GEL_BRAND_NOTE } from "@/lib/gelColours";

// An almond-shaped petal pointing up from the origin (0,0), about 150 long.
const PETAL =
  "M-27 -40 C-30 -86 -14 -128 0 -152 C14 -128 30 -86 27 -40 Q0 -18 -27 -40 Z";

function Petal({ colour, angle, active, onPick, index }) {
  return (
    <g
      transform={"rotate(" + angle + ")"}
      style={{ cursor: "pointer" }}
      onClick={onPick}
      role="button"
      tabIndex={0}
      aria-label={colour.name}
      aria-pressed={active}
      onKeyDown={function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPick();
        }
      }}
    >
      <g
        style={{
          transformOrigin: "0px 0px",
          transform: active ? "scale(1.14)" : "scale(1)",
          transition: "transform 250ms ease",
        }}
      >
        <path
          d={PETAL}
          fill={colour.hex}
          stroke={active ? "#f0d58f" : "rgba(0,0,0,0.35)"}
          strokeWidth={active ? 3 : 1.2}
          strokeLinejoin="round"
        />
        <path
          d="M-10 -52 C-12 -88 -6 -112 0 -128"
          fill="none"
          stroke="#ffffff"
          strokeOpacity={colour.finish === "Shimmer" ? 0.55 : 0.4}
          strokeWidth="5"
          strokeLinecap="round"
        />
        {colour.finish === "Shimmer" && (
          <g fill="#ffffff" fillOpacity="0.7">
            <circle cx="4" cy="-60" r="1.6" />
            <circle cx="-5" cy="-90" r="1.3" />
            <circle cx="6" cy="-105" r="1.1" />
          </g>
        )}
      </g>
      <title>{colour.name}</title>
    </g>
  );
}

export default function ColourPalette() {
  const families = useMemo(function () {
    const seen = ["All"];
    GEL_COLOURS.forEach(function (c) {
      if (seen.indexOf(c.family) === -1) seen.push(c.family);
    });
    return seen;
  }, []);

  const [family, setFamily] = useState("All");
  const [picked, setPicked] = useState(GEL_COLOURS[0].name);

  const shown = GEL_COLOURS.filter(function (c) {
    return family === "All" || c.family === family;
  });

  const current =
    GEL_COLOURS.find(function (c) {
      return c.name === picked;
    }) || GEL_COLOURS[0];

  function chooseFamily(f) {
    setFamily(f);
    const first = GEL_COLOURS.find(function (c) {
      return f === "All" || c.family === f;
    });
    if (first) setPicked(first.name);
  }

  const step = 360 / shown.length;

  return (
    <div>
      {/* Family chips */}
      <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Colour families">
        {families.map(function (f) {
          const on = f === family;
          return (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={function () {
                chooseFamily(f);
              }}
              className={
                "rounded-full border px-4 py-2 text-xs font-semibold transition-colors " +
                (on
                  ? "border-[#d6b36a] bg-[#d6b36a] text-[#11100f]"
                  : "border-[#d6b36a]/40 text-[#d6b36a] hover:bg-[#d6b36a]/10")
              }
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Colour wheel */}
      <div className="mx-auto mt-8 w-full max-w-[420px]">
        <svg viewBox="-200 -200 400 400" className="block w-full" role="group" aria-label="Gel colour wheel">
          <circle r="185" fill="rgba(214,179,106,0.05)" stroke="rgba(214,179,106,0.25)" strokeDasharray="2 6" />
          {shown.map(function (c, i) {
            return (
              <Petal
                key={c.name}
                index={i}
                colour={c}
                angle={i * step}
                active={c.name === current.name}
                onPick={function () {
                  setPicked(c.name);
                }}
              />
            );
          })}
          <circle r="58" fill="#141210" stroke="#d6b36a" strokeOpacity="0.6" strokeWidth="1.5" />
          <circle r="22" cy="-20" fill={current.hex} stroke="rgba(0,0,0,0.4)" />
          <text y="22" textAnchor="middle" fill="#f4eee6" fontSize="13" fontFamily="Georgia, serif">
            {current.name.length > 14 ? current.name.slice(0, 13) + "…" : current.name}
          </text>
          <text y="40" textAnchor="middle" fill="#d6b36a" fontSize="9.5" letterSpacing="1.5">
            {current.finish.toUpperCase()}
          </text>
        </svg>

        <p className="mt-2 text-center text-xs text-[#9f978f]">
          Tap a petal to see the colour. Browsing only, nothing is chosen.
        </p>
      </div>

      {/* Palette board */}
      <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
        {shown.map(function (c) {
          const on = c.name === current.name;
          return (
            <li key={c.name} className="text-center">
              <button
                type="button"
                onClick={function () {
                  setPicked(c.name);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                aria-label={"Show " + c.name}
                className="group mx-auto block"
              >
                <svg
                  viewBox="0 0 60 100"
                  className={
                    "mx-auto h-28 w-auto transition-transform duration-300 group-hover:-translate-y-1 " +
                    (on ? "scale-105" : "")
                  }
                  aria-hidden="true"
                >
                  <path
                    d="M8 92 V52 C8 30 20 12 28 4 Q30 1 32 4 C40 12 52 30 52 52 V92 Q30 100 8 92 Z"
                    fill={c.hex}
                    stroke={on ? "#f0d58f" : "rgba(0,0,0,0.35)"}
                    strokeWidth={on ? 2.4 : 1.2}
                    strokeLinejoin="round"
                  />
                  <path d="M18 86 V52" stroke="#fff" strokeOpacity="0.4" strokeWidth="4" strokeLinecap="round" />
                </svg>
                <span className="mt-2 block text-sm font-semibold text-[#f4eee6]">{c.name}</span>
                <span className="block text-[0.68rem] uppercase tracking-[0.14em] text-[#d6b36a]">
                  {c.finish}
                </span>
                {c.brand && <span className="block text-[0.68rem] text-[#8f877e]">{c.brand}</span>}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-10 text-center text-xs leading-relaxed text-[#8f877e]">{GEL_BRAND_NOTE}</p>
    </div>
  );
}
