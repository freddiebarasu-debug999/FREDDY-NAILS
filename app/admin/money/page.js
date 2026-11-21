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

                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Bookings" value={data.bookings} sub="Paid, not cancelled" />
                  <Stat label="Estimated takings" value={money(data.takings)} sub={data.toCome > 0 ? `${money(data.soFar)} so far · ${money(data.toCome)} still to come` : "After promo codes (estimate)"} />
                  <Stat label="Deposits received" value={money(data.deposits)} />
                  <Stat label="Balance due on the day" value={money(data.balanceDue)} sub="Takings minus deposits" />
                  <Stat label="Expenses" value={money(data.expenseTotal)} />
                  <Stat label="Profit (estimate)" value={money(data.profit)} tone={data.profit >= 0 ? "good" : "bad"} sub="Takings minus expenses" />
                </div>

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
                    Takings use your menu prices minus an estimate of promo discounts. Tips, extras added on the day and what clients actually paid are not tracked yet, so treat these as a guide.
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
