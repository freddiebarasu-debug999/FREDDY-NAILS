export function normalizeReferralCode(code) {
  return String(code || "").trim().replace(/\s+/g, "").toUpperCase();
}

export function generateReferralCode(displayName = "") {
  const base =
    String(displayName || "FN")
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 5)
      .toUpperCase() || "FN";
  const tail = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}-${tail}`;
}

export const REFERRAL_TIERS = [
  { min: 1, label: "Bronze" },
  { min: 3, label: "Silver" },
  { min: 5, label: "Gold" },
];

export function tierForCount(count) {
  let tier = REFERRAL_TIERS[0];
  for (const t of REFERRAL_TIERS) {
    if (count >= t.min) tier = t;
  }
  return tier;
}

export async function findReferrerByCode(supabase, code) {
  const normalized = normalizeReferralCode(code);
  if (!normalized) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, referral_code, referral_count")
    .ilike("referral_code", normalized)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function recordSuccessfulReferral(
  supabase,
  { referrerProfileId, friendProfileId, appointmentId, referralCode }
) {
  if (!referrerProfileId || !appointmentId) return { ok: false };
  if (friendProfileId && friendProfileId === referrerProfileId) {
    return { ok: false, error: "self" };
  }

  const { error: insertError } = await supabase.from("referral_redemptions").insert({
    referrer_profile_id: referrerProfileId,
    friend_profile_id: friendProfileId || null,
    appointment_id: appointmentId,
    referral_code: normalizeReferralCode(referralCode),
  });

  if (insertError) {
    console.error("referral insert:", insertError.message || insertError);
    return { ok: false, error: insertError.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_count")
    .eq("id", referrerProfileId)
    .maybeSingle();

  const next = (profile?.referral_count || 0) + 1;
  await supabase
    .from("profiles")
    .update({ referral_count: next })
    .eq("id", referrerProfileId);

  return { ok: true, referralCount: next, tier: tierForCount(next) };
}
