"use client";

import { useMemo, useState } from "react";

const SHADES = [
  { name: "Nude Beige", code: "NB01", hex: "#cda18d", family: "Nudes", finish: "Glossy" },
  { name: "Rose Nude", code: "RN02", hex: "#c77d83", family: "Pinks", finish: "Glossy" },
  { name: "Blush Pink", code: "BP03", hex: "#e8a6b0", family: "Pinks", finish: "Glossy" },
  { name: "Candy Pink", code: "CP04", hex: "#ef7d9e", family: "Pinks", finish: "Glossy" },
  { name: "Burgundy", code: "BG05", hex: "#7b1833", family: "Reds", finish: "Glossy" },
  { name: "Cherry Red", code: "CR06", hex: "#a9192b", family: "Reds", finish: "Glossy" },
  { name: "Deep Chocolate", code: "DC07", hex: "#4d2b25", family: "Browns", finish: "Glossy" },
  { name: "Lilac Dream", code: "LD08", hex: "#b9a2d2", family: "Purples", finish: "Shimmer" },
  { name: "Purple Haze", code: "PH09", hex: "#652b83", family: "Purples", finish: "Glossy" },
  { name: "Jet Black", code: "JB10", hex: "#171516", family: "Darks", finish: "Glossy" },
  { name: "Milky White", code: "MW11", hex: "#f2e8df", family: "Nudes", finish: "Glossy" },
  { name: "Gold Glaze", code: "GG12", hex: "#c9a45d", family: "Darks", finish: "Shimmer" },
];
const FAMILIES = ["All", "Nudes", "Pinks", "Reds", "Browns", "Purples", "Darks"];
const FINISHES = ["Glossy", "Matte", "Chrome", "Shimmer"];

export default function ColourLab() {
  const [family, setFamily] = useState("All");
  const [active, setActive] = useState(SHADES[0]);
  const [finish, setFinish] = useState("Glossy");
  const visible = useMemo(() => family === "All" ? SHADES : SHADES.filter((shade) => shade.family === family), [family]);

  return (
    <section id="colour-library" className="colour-lab-section">
      <div className="colour-lab-inner">
        <div className="colour-lab-heading">
          <p className="colour-eyebrow">Explore our collection</p>
          <h2>Find your <em>perfect shade.</em></h2>
          <p>Browse colour inspiration before your appointment. Final shades may vary slightly from screen to polish.</p>
        </div>

        <div className="colour-lab-layout">
          <div className="colour-library-panel">
            <div className="colour-filters" role="group" aria-label="Filter gel colours by family">
              {FAMILIES.map((item) => (
                <button key={item} type="button" onClick={() => setFamily(item)} className={family === item ? "colour-filter is-active" : "colour-filter"} aria-pressed={family === item}>{item}</button>
              ))}
            </div>
            <div className="colour-swatches">
              {visible.map((shade) => (
                <button key={shade.code} type="button" className={active.code === shade.code ? "shade-card is-selected" : "shade-card"} onClick={() => setActive(shade)} aria-pressed={active.code === shade.code}>
                  <span className={`shade-swatch ${finish === "Matte" ? "finish-matte" : ""} ${finish === "Chrome" ? "finish-chrome" : ""} ${finish === "Shimmer" ? "finish-shimmer" : ""}`} style={{ "--shade": shade.hex }} aria-hidden="true"><i /></span>
                  <span className="shade-name">{shade.name}</span>
                  <span className="shade-code">{shade.code}</span>
                </button>
              ))}
            </div>
            <div className="selected-shade-note" aria-live="polite">
              <span className="selected-shade-dot" style={{ backgroundColor: active.hex }} />
              <span><strong>{active.name}</strong><small>{active.code} · {active.family} · inspiration only</small></span>
            </div>
          </div>

          <aside className="colour-wheel-panel" aria-label="Colour wheel and finishes">
            <p className="colour-eyebrow">Explore by colour</p>
            <div className="colour-wheel" role="img" aria-label="Decorative colour wheel for exploring colour families">
              <div className="colour-wheel-center"><span>COLOUR</span><strong>STORIES</strong></div>
            </div>
            <p className="wheel-help">A little inspiration for your next set.</p>
            <p className="finish-label">Explore finishes</p>
            <div className="finish-options">
              {FINISHES.map((item) => <button type="button" key={item} className={finish === item ? "finish-option is-active" : "finish-option"} onClick={() => setFinish(item)} aria-pressed={finish === item}><span className={`finish-dot finish-dot--${item.toLowerCase()}`} />{item}</button>)}
            </div>
            <p className="finish-disclaimer">Finish previews are illustrative. Ask Freddy to confirm the available product and finish.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
