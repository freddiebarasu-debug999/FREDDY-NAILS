/**
 * Client-facing service labels must never include prices.
 */

export function stripServicePrice(name) {
  return String(name || "")
    .replace(/\s*\(R\s*[\d.,]+(?:\s*[–—-]\s*R?\s*[\d.,]+)?\)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatServiceList(services) {
  if (!Array.isArray(services)) return stripServicePrice(services);
  return services.map(stripServicePrice).filter(Boolean).join(" + ");
}

export const SOAK_OFF_OWN = "Extra — Soak Off (own work)";
export const SOAK_OFF_OTHER = "Extra — Soak Off (other salon)";

export const FIXED_EXTRA_PRICES = {
  [SOAK_OFF_OWN]: 50,
  [SOAK_OFF_OTHER]: 70,
  "Extra — Soak Off": 50,
};

export function isSoakOffOnly(services) {
  if (!Array.isArray(services) || services.length === 0) return false;
  return services.every((s) => {
    const n = stripServicePrice(s).toLowerCase();
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
      const key = stripServicePrice(s);
      return sum + (FIXED_EXTRA_PRICES[key] ?? FIXED_EXTRA_PRICES[s] ?? 50);
    }, 0);
  }
  return standardDeposit;
}
