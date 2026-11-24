// Owner-defined time ranges that clients cannot book.
// Full-day blocks stay in closed_dates; this file is for partial days.

function toMinutes(time) {
  const [h, m] = String(time || "0:0").slice(0, 5).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function hhmm(t) {
  return String(t || "").slice(0, 5);
}

/**
 * Returns blocked ranges for one date as [{ start, end }] in minutes.
 * start is inclusive, end is exclusive for slot checks.
 */
export async function getBlockedRangesForDate(supabase, date) {
  try {
    const { data, error } = await supabase
      .from("blocked_times")
      .select("start_time, end_time")
      .eq("block_date", date);
    if (error) {
      // Table may not exist yet — treat as no blocks.
      if (error.code === "42P01" || /blocked_times/.test(error.message || "")) return [];
      console.error("blocked_times lookup:", error.message);
      return [];
    }
    return (data || []).map((r) => ({
      start: toMinutes(r.start_time),
      end: toMinutes(r.end_time),
    }));
  } catch {
    return [];
  }
}

/**
 * Does a proposed slot (start/end in minutes) overlap any blocked range?
 */
export function overlapsBlockedRange(start, end, ranges) {
  return (ranges || []).some((r) => start < r.end && end > r.start);
}

/**
 * Fetch all blocked ranges in a date range (for month view / admin list).
 * Returns Map<"YYYY-MM-DD", [{ start, end, reason? }]> with times in minutes.
 */
export async function getBlockedByDate(supabase, from, to) {
  try {
    const { data, error } = await supabase
      .from("blocked_times")
      .select("id, block_date, start_time, end_time, reason")
      .gte("block_date", from)
      .lte("block_date", to)
      .order("block_date", { ascending: true })
      .order("start_time", { ascending: true });
    if (error) {
      if (error.code === "42P01" || /blocked_times/.test(error.message || "")) return new Map();
      console.error("blocked_times range:", error.message);
      return new Map();
    }
    const map = new Map();
    for (const r of data || []) {
      const key = String(r.block_date).slice(0, 10);
      const list = map.get(key) || [];
      list.push({
        id: r.id,
        start: toMinutes(r.start_time),
        end: toMinutes(r.end_time),
        startStr: hhmm(r.start_time),
        endStr: hhmm(r.end_time),
        reason: r.reason || "",
      });
      map.set(key, list);
    }
    return map;
  } catch {
    return new Map();
  }
}
