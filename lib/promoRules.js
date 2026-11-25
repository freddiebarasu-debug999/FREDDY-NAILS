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
