// Personal, single-use "free set" codes.
// A free-set code gives one person a free set: no deposit, and the slot is
// confirmed straight away. Codes live in the Supabase table free_set_codes.

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

// Returns { row } when the code exists in the free_set_codes table,
// otherwise { row: null }. Any database problem (for example the table not
// created yet) is treated as "not a free-set code" so normal promos keep working.
export async function findFreeSetCode(supabase, code) {
  const normalized = normalizeFreeCode(code);
  if (!normalized) return { row: null };

  try {
    const { data, error } = await supabase
      .from("free_set_codes")
      .select("id, code, client_name, active, reusable, expires_at, used_at")
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
  if (row.used_at && !row.reusable) {
    return { valid: false, error: "That code has already been used." };
  }
  if (row.expires_at) {
    const expires = new Date(row.expires_at);
    if (Number.isFinite(expires.getTime()) && new Date() >= expires) {
      return { valid: false, error: "That code has expired." };
    }
  }
  return { valid: true };
}

// Marks the code as used. Only one request can win this, so a code can never
// be used twice, even if two people tap at the same moment.
export async function claimFreeSetCode(supabase, row) {
  // A reusable code is never "used up".
  if (row.reusable) return true;

  const id = row.id;
  const { data, error } = await supabase
    .from("free_set_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("id", id)
    .is("used_at", null)
    .select("id");

  if (error) {
    console.error("Free-set code claim error:", error.message || error);
    return false;
  }
  return Array.isArray(data) && data.length === 1;
}

export async function releaseFreeSetCodeById(supabase, id) {
  await supabase
    .from("free_set_codes")
    .update({ used_at: null, used_appointment_id: null })
    .eq("id", id);
}

export async function releaseFreeSetCodeByAppointment(supabase, appointmentId) {
  await supabase
    .from("free_set_codes")
    .update({ used_at: null, used_appointment_id: null })
    .eq("used_appointment_id", appointmentId);
}
