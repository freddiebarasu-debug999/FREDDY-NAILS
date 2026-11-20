// Freddy Nails — "one primary service per category" rules.
// Used by BOTH the booking form (components/Booking.js) and the server
// check (app/api/checkout/route.js) so they can never disagree.
//
// Each client (person) may have:
//   - ONE manicure        (Acrylic OR Gel — not both)
//   - ONE pedicure
//   - ONE lash service
//   - ONE foot spa
//   - ONE soak-off        (own work OR other salon)
//   - any number of other extras (nail art, rhinestones, 3D art, etc.)
// A client can still combine different categories, e.g. manicure + pedicure.

function clean(name) {
  return String(name || "")
    .trim()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

// Returns a group key for services that are limited to one per client,
// or null for services with no limit (normal extras).
export function primaryGroupOf(serviceName) {
  const n = clean(serviceName);
  if (!n) return null;
  if (n.includes("soak off") || n.includes("soak-off")) return "soakoff";
  if (/^(acrylic|gel)\b/.test(n)) return "manicure";
  if (/^pedicure\b/.test(n)) return "pedicure";
  if (/^(lashes|eyelash)/.test(n)) return "lashes";
  if (/^foot spa\b/.test(n)) return "footspa";
  return null;
}

export const GROUP_LABELS = {
  manicure: "manicure (Acrylic or Gel)",
  pedicure: "pedicure",
  lashes: "lash service",
  footspa: "foot spa",
  soakoff: "soak-off",
};

// Looks at ONE client's service list. Returns null if fine, otherwise
// { group, label } for the first category chosen more than once.
export function findPrimaryConflict(services) {
  if (!Array.isArray(services)) return null;
  const seen = new Set();
  for (const service of services) {
    const group = primaryGroupOf(service);
    if (!group) continue;
    if (seen.has(group)) return { group, label: GROUP_LABELS[group] };
    seen.add(group);
  }
  return null;
}

// For the form: would picking `candidate` for this row clash with the
// client's OTHER rows? (otherServices = the client's list without this row)
export function clashesWithOtherServices(candidate, otherServices) {
  const group = primaryGroupOf(candidate);
  if (!group) return false;
  return (otherServices || []).some((s) => primaryGroupOf(s) === group);
}
