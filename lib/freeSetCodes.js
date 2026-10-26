// Reusable free-set codes (deposit waived, booking confirmed with no Yoco).
// Codes live in the Supabase table free_set_codes.
// They stay usable until you turn them off (active = false) or they expire.

export function normalizeFreeCode(code) {
  return String(code || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

function escapeLike(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

export async function findFreeSetCode(supabase, code) {
  const normalized = normalizeFreeCode(code);
  if (!normalized) return { row: null };

  try {
    const { data, error } = await supabase
      .from("free_set_codes")
      .select("id, code, client_name, active, expires_at")
      .ilike("code", escapeLike(normalized))
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Free-set code lookup error:", error.message || error);
      return { row: null };
    }
    return { row: data || null };
  } catch (err) {
    console.error("Free-set code lookup failed:", err);
    return { row: null };
  }
}

export function checkFreeSetCode(row) {
  if (!row || row.active === false) {
    return { valid: false, error: "That code isn't active." };
  }
  if (row.expires_at) {
    const expires = new Date(row.expires_at);
    if (Number.isFinite(expires.getTime()) && new Date() >= expires) {
      return { valid: false, error: "That code has expired." };
    }
  }
  return { valid: true };
}
