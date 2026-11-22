// Days the owner has marked as closed (Days off in the dashboard).
// If the closed_dates table does not exist yet, nothing is treated as closed,
// so a missing table can never stop clients from booking.

export async function isClosedDate(supabase, date) {
  try {
    const { data, error } = await supabase
      .from("closed_dates")
      .select("closed_date")
      .eq("closed_date", date)
      .maybeSingle();
    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}

export async function getClosedDatesInRange(supabase, from, to) {
  try {
    const { data, error } = await supabase
      .from("closed_dates")
      .select("closed_date")
      .gte("closed_date", from)
      .lte("closed_date", to);
    if (error) return new Set();
    return new Set((data || []).map((r) => String(r.closed_date).slice(0, 10)));
  } catch {
    return new Set();
  }
}
