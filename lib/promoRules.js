// Freddy Nails — special promo rules (Black Friday 2026).
// Shared by the booking form, the promo validator, the checkout API and
// the client-portal offers API so they can never disagree.
//
// To change which services count as a "nail set", edit isNailSetService().
// To add another nail-set-only or account-only code, add it to the lists.

import { primaryGroupOf } from "@/lib/serviceRules";

// Codes whose discount applies to NAIL SETS only (Acrylic + Gel).
// Soak offs, pedicures, lashes, foot spa and extras stay full price.
export const NAIL_SET_ONLY_CODES = ["BLACKFRIDAY40", "BLACKFRIDAY30"];

// Codes that only logged-in Freddy Nails account holders may use.
export const ACCOUNT_ONLY_CODES = ["BLACKFRIDAY40"];

// Codes that work but are NOT listed as a card in the client portal.
export const PORTAL_HIDDEN_CODES = ["BLACKFRIDAY30"];

function normalise(code) {
  return String(code || "").trim().replace(/\s+/g, "").toUpperCase();
}

export function isNailSetOnlyCode(code) {
  return NAIL_SET_ONLY_CODES.includes(normalise(code));
}

export function isAccountOnlyCode(code) {
  return ACCOUNT_ONLY_CODES.includes(normalise(code));
}

export function isPortalHiddenCode(code) {
  return PORTAL_HIDDEN_CODES.includes(normalise(code));
}

// A "nail set" = an Acrylic or Gel set (including Gel Overlay).
// Soak offs and every Extra are NOT nail sets.
export function isNailSetService(serviceName) {
  return primaryGroupOf(serviceName) === "manicure";
}

export const NAIL_SETS_ONLY_MESSAGE =
  "Applies to nail sets only (Acrylic & Gel) — not soak offs or other services.";

// Safety net for the client portal. The portal normally lists offers read
// from the database. For logged-in clients we also make sure the Black Friday
// 40% card is there during its dates, even if the list could not be loaded.
// It still has to pass the server check (login, dates, nail sets only) when
// the client taps Apply or pays.
const FALLBACK_PORTAL_OFFERS = [
  {
    id: "fallback-blackfriday40",
    code: "BLACKFRIDAY40",
    discountType: "percent",
    discountValue: 40,
    description:
      "Black Friday Glow Deal: 40% off your nail set, exclusive to account holders.",
    nailSetsOnly: true,
    accountOnly: true,
    startsAt: "2026-11-24T00:00:00+02:00",
    expiresAt: "2026-12-01T00:00:00+02:00",
  },
];

export function withBlackFridayFallback(offers) {
  const list = Array.isArray(offers) ? [...offers] : [];
  const now = Date.now();
  for (const fallback of FALLBACK_PORTAL_OFFERS) {
    const startsOk = now >= new Date(fallback.startsAt).getTime();
    const endsOk = now < new Date(fallback.expiresAt).getTime();
    const already = list.some(
      (offer) =>
        String(offer?.code || "").toUpperCase() === fallback.code
    );
    if (startsOk && endsOk && !already) {
      list.unshift(fallback);
    }
  }
  return list;
}
