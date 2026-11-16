"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const MILESTONES = [
  { at: 1, label: "1 friend", reward: "Thank-you credit" },
  { at: 3, label: "3 friends", reward: "Bigger credit" },
  { at: 5, label: "5 friends", reward: "Free set eligible" },
];
const MAX = 5;

export default function ReferralDashboard({
  code,
  count = 0,
  profileId,
}) {
  const safeCount = Math.max(0, Number(count) || 0);
  const [animated, setAnimated] = useState(0);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const next = MILESTONES.find((m) => safeCount < m.at) || null;
  const progressPct = Math.min(100, (safeCount / MAX) * 100);
  const tierLabel =
    safeCount >= 5 ? "Gold" : safeCount >= 3 ? "Silver" : safeCount >= 1 ? "Bronze" : "Starter";

  const stats = useMemo(
    () => [
      { label: "Successful referrals", value: String(safeCount) },
      { label: "Your tier", value: tierLabel },
      {
        label: "To next reward",
        value: next ? String(next.at - safeCount) : "—",
      },
      {
        label: "Friend discount",
        value: "10%",
      },
    ],
    [safeCount, tierLabel, next]
  );

  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimated(progressPct));
    return () => cancelAnimationFrame(t);
  }, [progressPct]);

  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;
    (async () => {
      setLoadingHistory(true);
      try {
        const { data, error } = await supabase
          .from("referral_redemptions")
          .select("id, referral_code, created_at, appointment_id")
          .eq("referrer_profile_id", profileId)
          .order("created_at", { ascending: false })
          .limit(20);
        if (!cancelled && !error) setHistory(data || []);
      } catch (e) {
        console.error("Referral history:", e);
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId, safeCount]);

  async function handleCopy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section
      aria-labelledby="referral-dash-title"
      className="mt-7 rounded-[20px] border border-[#d6b36a]/20 bg-white/[0.03] p-5 md:p-6"
    >
      <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[#d6b36a]">
        Referral programme
      </p>
      <h2
        id="referral-dash-title"
        className="mt-2 font-serif text-xl text-[#f4eee6] md:text-2xl"
      >
        Invite friends. Earn rewards.
      </h2>
      <p className="mt-1 max-w-[52ch] text-sm leading-relaxed text-[#c9c0b6]">
        Share your code. Friends get <strong className="text-[#d6b36a]">10% off</strong> their
        service total. Every successful booking fills your bar.
      </p>

      {/* Code */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-xl border border-[#d6b36a]/30 bg-[#181614] px-4 py-2.5">
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#9a9186]">
            Your code
          </span>
          <span className="font-mono text-base font-semibold tracking-wide text-[#d6b36a]">
            {code || "Generating…"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!code}
          className="rounded-xl border border-[#d6b36a]/35 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#d6b36a] transition hover:bg-[#d6b36a]/10 disabled:opacity-40"
        >
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>

      {/* Analytics cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/[0.08] bg-[#141210]/80 px-3 py-3"
          >
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#9a9186]">
              {s.label}
            </p>
            <p className="mt-1 font-serif text-xl text-[#f4eee6]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold text-[#f4eee6]">
            Progress to free set
          </span>
          <span className="text-[#9a9186]">
            {safeCount} / {MAX}
          </span>
        </div>
        <div
          className="h-3 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={safeCount}
          aria-valuemin={0}
          aria-valuemax={MAX}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#ad8a4e] via-[#d6b36a] to-[#f0d58f] transition-[width] duration-[1200ms] ease-out"
            style={{ width: `${Math.max(safeCount > 0 ? 6 : 0, animated)}%` }}
          />
        </div>

        <ol className="relative mt-5 grid grid-cols-3 gap-2">
          {MILESTONES.map((m) => {
            const reached = safeCount >= m.at;
            return (
              <li key={m.at} className="flex flex-col items-center text-center">
                <span
                  className={
                    "grid h-8 w-8 place-items-center rounded-full border-2 text-xs font-bold " +
                    (reached
                      ? "border-[#d6b36a] bg-[#d6b36a] text-[#11100f]"
                      : "border-white/20 bg-[#141210] text-[#8f877e]")
                  }
                >
                  {reached ? "✓" : m.at}
                </span>
                <span
                  className={
                    "mt-2 text-[0.7rem] font-semibold " +
                    (reached ? "text-[#f4eee6]" : "text-[#8f877e]")
                  }
                >
                  {m.label}
                </span>
                <span className="mt-0.5 text-[0.65rem] text-[#9a9186]">
                  {m.reward}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Performance history */}
      <div className="mt-8 border-t border-white/[0.08] pt-5">
        <h3 className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#d6b36a]">
          Your performance
        </h3>
        {loadingHistory ? (
          <p className="mt-3 text-sm text-[#9a9186]">Loading…</p>
        ) : history.length === 0 ? (
          <p className="mt-3 text-sm text-[#9a9186]">
            No successful referrals yet. Share your code to get started.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {history.map((row, i) => (
              <li
                key={row.id}
                className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#141210]/60 px-3 py-2.5 text-sm"
              >
                <span className="text-[#f4eee6]">
                  Referral #{history.length - i}
                </span>
                <span className="text-[#9a9186]">
                  {row.created_at
                    ? new Date(row.created_at).toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
