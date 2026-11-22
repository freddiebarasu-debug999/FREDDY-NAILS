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
  "rounded-lg border border-white/20 px-3 py-1.5 text-xs font-bold text-[#f4eee6] disabled:opacity-50";

function niceDate(date) {
  if (!date) return "";
  return new Date(date + "T00:00:00").toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
}

function waLink(phone, text) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = "27" + digits.slice(1);
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

const FILTERS = [
  ["waiting", "Waiting"],
  ["offered", "Offered"],
  ["done", "Booked / removed"],
];

export default function WaitlistAdminPage() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [entries, setEntries] = useState([]);
  const [tableReady, setTableReady] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("waiting");
  const [slot, setSlot] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", service: "", wanted_date: "", flexible: "" });

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
      const data = await api("/api/admin/waitlist");
      setEntries(data.entries || []);
      setTableReady(data.ready !== false);
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

  async function setStatus(entry, status) {
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/waitlist", { method: "POST", body: JSON.stringify({ action: "status", id: entry.id, status }) });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function add(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/waitlist", { method: "POST", body: JSON.stringify({ action: "add", ...form }) });
      setForm({ name: "", phone: "", email: "", service: "", wanted_date: "", flexible: "" });
      setShowAdd(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const shown = entries.filter((e) =>
    filter === "done" ? ["booked", "removed"].includes(e.status) : e.status === filter
  );
  const waitingCount = entries.filter((e) => e.status === "waiting").length;

  function message(e) {
    const first = String(e.name || "").trim().split(" ")[0] || "there";
    const what = slot.trim() ? `A slot has opened up: ${slot.trim()}.` : "A slot has just opened up.";
    return `Hi ${first}, it's Freddy from Freddy Nails. ${what} Would you like it? Reply YES and I'll book you in.`;
  }

  return (
    <main className="min-h-screen bg-[#11100f] text-[#f4eee6]">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d6b36a]">Freddy Nails</p>
          <h1 className="font-serif text-3xl">Waitlist</h1>
          <p className="mt-1 text-sm text-[#9f978f]">Clients can join at freddynails.co.za/waitlist</p>
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
            {!tableReady && (
              <p className="rounded-lg bg-[#2a2314] p-3 text-xs text-[#e8c36a]">The waitlist needs the one-time Supabase SQL setup before it can be used.</p>
            )}

            <div className={card}>
              <label className="block text-xs text-[#9f978f]">Slot that opened (used in the WhatsApp message)
                <input className={`${input} mt-1`} placeholder="e.g. Fri 27 Nov at 15:50" maxLength={80} value={slot} onChange={(e) => setSlot(e.target.value)} />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {FILTERS.map(([key, label]) => (
                <button key={key} onClick={() => setFilter(key)} className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${filter === key ? "bg-[#d6b36a] text-[#11100f]" : "border border-white/20 text-[#c9c0b6]"}`}>
                  {label}{key === "waiting" ? ` (${waitingCount})` : ""}
                </button>
              ))}
              <button className="ml-auto text-xs font-bold uppercase text-[#d6b36a]" onClick={() => setShowAdd((s) => !s)}>
                {showAdd ? "Close" : "+ Add client"}
              </button>
            </div>

            {showAdd && (
              <form onSubmit={add} className={`${card} space-y-3`}>
                <input className={input} placeholder="Name" maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input className={input} type="tel" placeholder="WhatsApp number" maxLength={25} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input className={input} type="email" placeholder="Email (needed for automatic notifications)" maxLength={120} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <input className={input} placeholder="What she wants (optional)" maxLength={120} value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <input className={input} type="date" value={form.wanted_date} onChange={(e) => setForm({ ...form, wanted_date: e.target.value })} />
                  <input className={input} placeholder="Other times that work" maxLength={200} value={form.flexible} onChange={(e) => setForm({ ...form, flexible: e.target.value })} />
                </div>
                <button className={goldBtn} disabled={busy}>{busy ? "Saving…" : "Add to waitlist"}</button>
              </form>
            )}

            {loading && <p className="text-sm text-[#c9c0b6]">Loading…</p>}
            {!loading && tableReady && shown.length === 0 && <p className="text-sm text-[#c9c0b6]">Nobody here.</p>}

            {shown.map((e) => (
              <div key={e.id} className={card}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{e.name}</p>
                  <span className="text-[10px] font-bold uppercase text-[#9f978f]">{e.source === "owner" ? "Added by you" : "Website"}</span>
                </div>
                <p className="mt-1 text-sm text-[#c9c0b6]">{e.phone}{e.email ? ` · ${e.email}` : ""}</p>
                {!e.email && e.status === "waiting" && (
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-[#e8c36a]">No email, so not auto-notified. Use WhatsApp.</p>
                )}
                {e.status === "offered" && e.offered_at && (
                  <p className="mt-1 text-xs text-[#6fcf8a]">Auto-emailed {e.offered_slot ? `about ${e.offered_slot}` : "about a free slot"}</p>
                )}
                {e.service && <p className="mt-1 text-xs text-[#c9c0b6]">Wants: {e.service}</p>}
                {(e.wanted_date || e.flexible) && (
                  <p className="mt-1 text-xs text-[#9f978f]">
                    {e.wanted_date ? `Day: ${niceDate(e.wanted_date)}` : ""}{e.wanted_date && e.flexible ? " · " : ""}{e.flexible ? `Also: ${e.flexible}` : ""}
                  </p>
                )}
                <p className="mt-1 text-[10px] uppercase tracking-wide text-[#9f978f]">Status: {e.status}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {["waiting", "offered"].includes(e.status) && (
                    <a className="rounded-lg border border-[#6fcf8a]/50 px-3 py-1.5 text-xs font-bold text-[#6fcf8a]" href={waLink(e.phone, message(e))} target="_blank" rel="noopener noreferrer">
                      WhatsApp slot
                    </a>
                  )}
                  {e.status === "waiting" && <button className={ghostBtn} disabled={busy} onClick={() => setStatus(e, "offered")}>Mark offered</button>}
                  {["waiting", "offered"].includes(e.status) && (
                    <a className={ghostBtn} href={`/admin/cash?name=${encodeURIComponent(e.name)}&phone=${encodeURIComponent(e.phone)}&email=${encodeURIComponent(e.email || "")}&wl=${e.id}`}>Book (cash deposit)</a>
                  )}
                  {["waiting", "offered"].includes(e.status) && (
                    <>
                      <button className={ghostBtn} disabled={busy} onClick={() => setStatus(e, "booked")}>Booked</button>
                      <button className={ghostBtn} disabled={busy} onClick={() => setStatus(e, "removed")}>Remove</button>
                    </>
                  )}
                  {["booked", "removed"].includes(e.status) && (
                    <button className={ghostBtn} disabled={busy} onClick={() => setStatus(e, "waiting")}>Put back on list</button>
                  )}
                  {e.status === "offered" && <button className={ghostBtn} disabled={busy} onClick={() => setStatus(e, "waiting")}>Back to waiting</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
