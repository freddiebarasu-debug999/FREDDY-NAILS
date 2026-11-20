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
const ghostBtn =
  "rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-[#f4eee6] disabled:opacity-50";

const EMPTY = {
  isNew: true,
  code: "",
  discount_type: "fixed",
  discount_value: "",
  description: "",
  expires: "",
  max_uses: "",
  minimum_spend: "",
  new_clients_only: false,
  one_use_per_client: false,
  active: true,
};

function saDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" });
}

function niceDay(value) {
  const iso = saDate(value);
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function offText(p) {
  const v = Number(p.discount_value || 0);
  return String(p.discount_type).toLowerCase().startsWith("percent") ? `${v}% off` : `R${v} off`;
}

function isExpired(p) {
  return !!p.expires_at && new Date(p.expires_at).getTime() < Date.now();
}

export default function PromosPage() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [promos, setPromos] = useState([]);
  const [builtIn, setBuiltIn] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      setReady(true);
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/admin/promos");
      setPromos(data.promos || []);
      setBuiltIn(data.builtIn || []);
    } catch (e) {
      setError(e.message);
      if (e.status === 401) setSignedIn(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (signedIn) load();
  }, [signedIn, load]);

  function edit(p) {
    setNotice("");
    setError("");
    setForm({
      isNew: false,
      code: p.code,
      discount_type: String(p.discount_type).toLowerCase().startsWith("percent") ? "percent" : "fixed",
      discount_value: String(p.discount_value ?? ""),
      description: p.description || "",
      expires: saDate(p.expires_at),
      max_uses: p.max_uses ? String(p.max_uses) : "",
      minimum_spend: p.minimum_spend ? String(p.minimum_spend) : "",
      new_clients_only: p.new_clients_only === true,
      one_use_per_client: p.one_use_per_client === true,
      active: p.active !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function set(patch) {
    setForm((f) => ({ ...f, ...patch }));
    setError("");
    setNotice("");
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api("/api/admin/promos", { method: "POST", body: JSON.stringify({ action: "save", ...form }) });
      setNotice(`${form.code.toUpperCase()} saved.`);
      setForm(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(p) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api("/api/admin/promos", {
        method: "POST",
        body: JSON.stringify({ action: "toggle", code: p.code, active: p.active === false }),
      });
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
          <h1 className="font-serif text-3xl">Promo codes</h1>
        </div>

        {!ready && <p className="text-[#c9c0b6]">Loading…</p>}
        {ready && !signedIn && (
          <p className={card}>
            Please <Link href="/admin" className="font-semibold text-[#d6b36a] underline">sign in on the Bookings page</Link> first, then come back.
          </p>
        )}

        {ready && signedIn && (
          <div className="space-y-4">
            {error && <p className="rounded-lg bg-[#3a1d1d] p-3 text-sm text-[#e39a96]">{error}</p>}
            {notice && <p className="rounded-lg bg-[#1d2e22] p-3 text-sm text-[#9fd4ad]">{notice}</p>}

            {!form && (
              <button className={goldBtn} onClick={() => { setForm({ ...EMPTY }); setNotice(""); setError(""); }}>
                + New promo code
              </button>
            )}

            {form && (
              <form onSubmit={save} className={`${card} space-y-3`}>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d6b36a]">
                  {form.isNew ? "New code" : `Edit ${form.code}`}
                </p>

                <label className="block text-xs text-[#9f978f]">Code
                  <input className={`${input} mt-1 uppercase`} value={form.code} disabled={!form.isNew} placeholder="e.g. SUMMER20" onChange={(e) => set({ code: e.target.value.toUpperCase().replace(/\s/g, "") })} />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs text-[#9f978f]">Type
                    <select className={`${input} mt-1`} value={form.discount_type} onChange={(e) => set({ discount_type: e.target.value })}>
                      <option value="fixed">Rand off (R)</option>
                      <option value="percent">Percent off (%)</option>
                    </select>
                  </label>
                  <label className="text-xs text-[#9f978f]">Amount
                    <input className={`${input} mt-1`} type="number" min="1" inputMode="decimal" value={form.discount_value} onChange={(e) => set({ discount_value: e.target.value })} />
                  </label>
                </div>

                <label className="block text-xs text-[#9f978f]">Description (clients see this)
                  <input className={`${input} mt-1`} value={form.description} maxLength={200} onChange={(e) => set({ description: e.target.value })} />
                </label>

                <div className="grid grid-cols-3 gap-3">
                  <label className="text-xs text-[#9f978f]">Expires
                    <input className={`${input} mt-1`} type="date" value={form.expires} onChange={(e) => set({ expires: e.target.value })} />
                  </label>
                  <label className="text-xs text-[#9f978f]">Max uses
                    <input className={`${input} mt-1`} type="number" min="1" placeholder="No limit" value={form.max_uses} onChange={(e) => set({ max_uses: e.target.value })} />
                  </label>
                  <label className="text-xs text-[#9f978f]">Min spend (R)
                    <input className={`${input} mt-1`} type="number" min="0" placeholder="None" value={form.minimum_spend} onChange={(e) => set({ minimum_spend: e.target.value })} />
                  </label>
                </div>

                <div className="space-y-2 text-sm text-[#c9c0b6]">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.new_clients_only} onChange={(e) => set({ new_clients_only: e.target.checked })} /> New clients only</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.one_use_per_client} onChange={(e) => set({ one_use_per_client: e.target.checked })} /> One use per client</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} /> Active</label>
                </div>

                <div className="flex gap-2">
                  <button className={goldBtn} disabled={busy}>{busy ? "Saving…" : "Save code"}</button>
                  <button type="button" className={ghostBtn} disabled={busy} onClick={() => setForm(null)}>Cancel</button>
                </div>
              </form>
            )}

            {loading && <p className="text-sm text-[#c9c0b6]">Loading codes…</p>}
            {!loading && !error && promos.length === 0 && <p className="text-sm text-[#c9c0b6]">No database codes yet.</p>}

            {promos.map((p) => {
              const expired = isExpired(p);
              const off = p.active === false;
              const status = off ? "Off" : expired ? "Expired" : "Active";
              const statusClass = off || expired ? "border-white/20 text-[#9f978f]" : "border-[#6fcf8a]/50 text-[#6fcf8a]";
              return (
                <div key={p.code} className={card}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{p.code} <span className="font-normal text-[#c9c0b6]">· {offText(p)}</span></p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusClass}`}>{status}</span>
                  </div>
                  {p.description && <p className="mt-1 text-sm text-[#c9c0b6]">{p.description}</p>}
                  <p className="mt-2 text-xs text-[#9f978f]">
                    Used {p.used}{p.max_uses ? ` of ${p.max_uses}` : ""} time{p.used === 1 ? "" : "s"}
                    {p.expires_at ? ` · expires ${niceDay(p.expires_at)}` : ""}
                    {p.minimum_spend ? ` · min R${p.minimum_spend}` : ""}
                    {p.new_clients_only ? " · new clients" : ""}
                    {p.one_use_per_client ? " · once each" : ""}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button className={ghostBtn} disabled={busy} onClick={() => edit(p)}>Edit</button>
                    <button className={ghostBtn} disabled={busy} onClick={() => toggle(p)}>{off ? "Switch on" : "Switch off"}</button>
                  </div>
                </div>
              );
            })}

            {builtIn.length > 0 && (
              <div className="pt-2">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#9f978f]">Built into the website (read only)</p>
                {builtIn.map((p) => (
                  <div key={p.code} className={`${card} mb-3`}>
                    <p className="font-semibold">{p.code} <span className="font-normal text-[#c9c0b6]">· {offText(p)}</span></p>
                    <p className="mt-1 text-xs text-[#9f978f]">{p.description} · used {p.used} time{p.used === 1 ? "" : "s"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
