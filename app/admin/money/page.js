"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

async function api(path, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || ""}`,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Something went wrong.");
    error.status = response.status;
    throw error;
  }
  return data;
}

const card = "rounded-xl border border-[#d6b36a]/20 bg-[#181614] p-4";
const input =
  "w-full rounded-lg border border-white/15 bg-[#11100f] px-3 py-2 text-sm text-[#f4eee6] outline-none focus:border-[#d6b36a]";
const goldBtn =
  "rounded-lg bg-[#d6b36a] px-4 py-2 text-sm font-bold text-[#11100f] disabled:opacity-50";

const PERIODS = [
  ["today", "Today"],
  ["week", "This week"],
  ["month", "This month"],
  ["lastmonth", "Last month"],
];

function money(n) {
  const v = Number(n || 0);
  const sign = v < 0 ? "-" : "";
  return `${sign}R${Math.abs(v).toLocaleString("en-ZA", { maximumFractionDigits: 2 })}`;
}

function niceDate(date) {
  if (!date) return "";
  return new Date(date + "T00:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function Stat({ label, value, sub, tone }) {
  const color = tone === "good" ? "text-[#6fcf8a]" : tone === "bad" ? "text-[#e39a96]" : "text-[#f4eee6]";
  return (
    <div className={card}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9f978f]">{label}</p>
      <p className={`mt-1 font-serif text-2xl ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-[#9f978f]">{sub}</p>}
    </div>
  );
}

export default function MoneyPage() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ date: "", item: "", category: "Acrylic", amount: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: session }) => {
      setSignedIn(!!session.session);
      setReady(true);
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api(`/api/admin/money?period=${period}`);
      setData(result);
      setForm((f) => ({ ...f, date: f.date || result.today }));
    } catch (e) {
      setError(e.message);
      if (e.status === 401) setSignedIn(false);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (signedIn) load();
  }, [signedIn, load]);

  async function addExpense(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/money", { method: "POST", body: JSON.stringify({ action: "add_expense", ...form }) });
      setForm((f) => ({ ...f, item: "", amount: "" }));
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeExpense(expense) {
    if (!window.confirm(`Delete "${expense.item}" (${money(expense.amount)})?`)) return;
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/money", { method: "POST", body: JSON.stringify({ action: "delete_expense", id: expense.id }) });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#11100f] text-[#f4eee6]">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d6b36a]">Freddy Nails</p>
          <h1 className="font-serif text-3xl">Money</h1>
        </div>

        {!ready && <p className="text-[#c9c0b6]">Loading…</p>}
        {ready && !signedIn && (
          <p className={card}>
            Please <Link href="/admin" className="font-semibold text-[#d6b36a] underline">sign in on the Bookings page</Link> first, then come back.
          </p>
        )}

        {ready && signedIn && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {PERIODS.map(([key, label]) => (
                <button key={key} onClick={() => setPeriod(key)} className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${period === key ? "bg-[#d6b36a] text-[#11100f]" : "border border-white/20 text-[#c9c0b6]"}`}>{label}</button>
              ))}
            </div>

            {error && <p className="rounded-lg bg-[#3a1d1d] p-3 text-sm text-[#e39a96]">{error}</p>}
            {loading && <p className="text-sm text-[#c9c0b6]">Loading…</p>}

            {data && !loading && (
              <>
                <p className="text-xs text-[#9f978f]">{data.label}: {niceDate(data.from)} – {niceDate(data.to)}</p>

                {/* Hero profit + growth */}
                <div className="rounded-2xl border border-[#d6b36a]/25 bg-gradient-to-br from-[#d6b36a]/10 to-transparent p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9f978f]">Profit (estimate)</p>
                  <p className={`mt-1 font-serif text-4xl ${data.profit >= 0 ? "text-[#6fcf8a]" : "text-[#e39a96]"}`}>
                    {money(data.profit)}
                  </p>
                  <p className="mt-1 text-xs text-[#9f978f]">Estimated takings minus expenses</p>
                  {/* Progress bar: received vs takings */}
                  {(() => {
                    const received = Number(data.deposits || 0) + Number(data.collected || 0);
                    const target = Math.max(Number(data.takings || 0), received, 1);
                    const pct = Math.min(100, Math.round((received / target) * 100));
                    const collectPct = Math.min(100, Math.round((Number(data.balanceDue || 0) / target) * 100));
                    return (
                      <div className="mt-5 space-y-3">
                        <div>
                          <div className="mb-1 flex justify-between text-[0.7rem]">
                            <span className="text-[#c9c0b6]">Collected progress</span>
                            <span className="font-bold text-[#d6b36a]">{pct}%</span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#d6b36a] to-[#6fcf8a] transition-all duration-700"
                              style={{ width: pct + "%" }}
                            />
                          </div>
                          <p className="mt-1 text-[0.65rem] text-[#9f978f]">
                            {money(received)} of {money(data.takings)} estimated takings
                          </p>
                        </div>
                        {data.balanceDue > 0 && (
                          <div>
                            <div className="mb-1 flex justify-between text-[0.7rem]">
                              <span className="text-[#c9c0b6]">Still to collect</span>
                              <span className="font-bold text-[#e39a96]">{money(data.balanceDue)}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-[#e39a96]/70"
                                style={{ width: Math.max(8, collectPct) + "%" }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Bar chart style metrics */}
                <div className="rounded-2xl border border-white/10 bg-[#181614] p-5">
                  <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d6b36a]">Breakdown</p>
                  {(() => {
                    const items = [
                      { label: "Takings", value: Number(data.takings || 0), color: "#d6b36a" },
                      { label: "Received", value: Number(data.deposits || 0) + Number(data.collected || 0), color: "#6fcf8a" },
                      { label: "Tips", value: Number(data.tips || 0), color: "#8fdfa8" },
                      { label: "Expenses", value: Number(data.expenseTotal || 0), color: "#e39a96" },
                      { label: "Balance due", value: Number(data.balanceDue || 0), color: "#c9a06a" },
                    ];
                    const maxV = Math.max(...items.map((i) => i.value), 1);
                    return (
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div key={item.label}>
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-[#c9c0b6]">{item.label}</span>
                              <span className="font-semibold text-[#f4eee6]">{money(item.value)}</span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: Math.max(item.value > 0 ? 4 : 0, (item.value / maxV) * 100) + "%",
                                  background: item.color,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Bookings" value={data.bookings} sub="Paid, not cancelled" />
                  <Stat label="Estimated takings" value={money(data.takings)} sub={data.toCome > 0 ? `${money(data.soFar)} so far · ${money(data.toCome)} still to come` : "After promo codes (estimate)"} />
                  <Stat label="Money received" value={money(data.deposits + data.collected)} sub={`Deposits ${money(data.deposits)} + balances ${money(data.collected)}`} tone="good" />
                  <Stat label="Still to collect" value={money(data.balanceDue)} sub="Past appointments with no balance recorded" tone={data.balanceDue > 0 ? "bad" : undefined} />
                </div>

                {data.paymentsReady === false && (
                  <p className="rounded-lg bg-[#2a2314] p-3 text-xs text-[#e8c36a]">Balance payments and tips need the one-time Supabase SQL setup before they show here.</p>
                )}
                {(data.byMethod.cash > 0 || data.byMethod.transfer > 0 || data.byMethod.card > 0) && (
                  <p className="text-xs text-[#c9c0b6]">
                    Balances received: Cash {money(data.byMethod.cash)} · Transfer {money(data.byMethod.transfer)} · Card {money(data.byMethod.card)}
                  </p>
                )}

                <div className={card}>
                  <p className="text-xs text-[#c9c0b6]">
                    {data.topService ? `Busiest service: ${data.topService.name} (${data.topService.count})` : "No services booked in this period."}
                  </p>
                  {data.cancelledCount > 0 && (
                    <p className="mt-2 text-xs text-[#e39a96]">
                      Cancellations: {data.cancelledCount} paid booking{data.cancelledCount === 1 ? "" : "s"} cancelled, about {money(data.cancelledValue)} of work lost.
                    </p>
                  )}
                  <p className="mt-2 text-xs text-[#9f978f]">
                    Takings use your menu prices minus an estimate of promo discounts. Record each client's balance on the booking (Mark balance paid) to keep Money received and Still to collect accurate.
                  </p>
                </div>

                <div className={`${card} space-y-3`}>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d6b36a]">Add an expense</p>
                  {!data.expensesReady && (
                    <p className="rounded-lg bg-[#2a2314] p-3 text-xs text-[#e8c36a]">Expenses need the one-time Supabase SQL setup before they can be saved.</p>
                  )}
                  <form onSubmit={addExpense} className="space-y-3">
                    <input className={input} placeholder="What did you buy? (e.g. acrylic powder)" maxLength={80} value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} />
                    <div className="grid grid-cols-3 gap-3">
                      <select className={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                        {data.categories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input className={input} type="number" min="0" step="0.01" inputMode="decimal" placeholder="R amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                      <input className={input} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                    </div>
                    <button className={goldBtn} disabled={busy || !data.expensesReady}>{busy ? "Saving…" : "Add expense"}</button>
                  </form>
                </div>

                {data.expenses.length > 0 && (
                  <div className={card}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#d6b36a]">Expenses this period</p>
                    <ul className="space-y-2">
                      {data.expenses.map((e) => (
                        <li key={e.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-[#c9c0b6]">{niceDate(e.expense_date)} · {e.item} <span className="text-xs text-[#9f978f]">({e.category})</span></span>
                          <span className="flex items-center gap-3">
                            <span className="font-semibold">{money(e.amount)}</span>
                            <button className="text-xs font-bold uppercase text-[#e39a96]" disabled={busy} onClick={() => removeExpense(e)}>Delete</button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
