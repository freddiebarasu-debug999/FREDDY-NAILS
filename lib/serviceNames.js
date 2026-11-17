/**
 * Client-facing service labels must never include prices.
 */

// Normalize dashes + whitespace + case for comparison ONLY.
// Never use this for display.
export function normalizeServiceName(name) {
  return String(name || "")
    .trim()
    .replace(/[–—]/g, "-") // en-dash / em-dash -> hyphen
    .replace(/\s*\(R\s*[\d.,]+(?:\s*[–—-]\s*R?\s*[\d.,]+)?\)\s*$/i, "") // strip (R200) / (R20-R30)
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function stripServicePrice(name) {
  return String(name || "")
    .replace(/\s*\(R\s*[\d.,]+(?:\s*[–—-]\s*R?\s*[\d.,]+)?\)\s*$/i, "")
    .replace(/[–—]/g, "-") // keep display consistent: always hyphen
    .replace(/\s+/g, " ")
    .trim();
}

export function formatServiceList(services) {
  if (!Array.isArray(services)) return stripServicePrice(services);
  return services.map(stripServicePrice).filter(Boolean).join(" + ");
}

export const SOAK_OFF_OWN = "Extra - Soak Off (own work)";
export const SOAK_OFF_OTHER = "Extra - Soak Off (other salon)";

export const FIXED_EXTRA_PRICES = {
  [SOAK_OFF_OWN]: 50,
  [SOAK_OFF_OTHER]: 70,
  "Extra - Soak Off": 50,
};

// Canonical soak-off names the backend accepts
export const SOAK_OFF_ALIASES = {
  [normalizeServiceName(SOAK_OFF_OWN)]: "Extra — Soak Off (R50)",
  [normalizeServiceName(SOAK_OFF_OTHER)]: "Extra — Soak Off (R50)",
  [normalizeServiceName("Extra — Soak Off")]: "Extra — Soak Off (R50)",
  [normalizeServiceName("Extra — Soak Off (R50)")]: "Extra — Soak Off (R50)",
};

export function isSoakOffOnly(services) {
  if (!Array.isArray(services) || services.length === 0) return false;
  return services.every((s) => {
    const n = normalizeServiceName(s);
    return n.includes("soak off") || n.includes("soak-off");
  });
}

export function depositForClientServices(
  services,
  { standardDeposit = 90, waiveDeposit = false } = {}
) {
  if (waiveDeposit) return 0;
  if (isSoakOffOnly(services)) {
    return services.reduce((sum, s) => {
      const normalized = normalizeServiceName(s);
      const matchKey = Object.keys(FIXED_EXTRA_PRICES).find(
        (k) => normalizeServiceName(k) === normalized
      );
      if (matchKey) return sum + FIXED_EXTRA_PRICES[matchKey];
      if (s.includes("other salon")) return sum + 70;
      return sum + 50;
    }, 0);
  }
  return standardDeposit;
}
