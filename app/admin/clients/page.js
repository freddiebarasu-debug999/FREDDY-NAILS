"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

function money(n) {
  return `R${Number(n || 0).toLocaleString("en-ZA")}`;
}

function niceDate(date) {
  if (!date) return "";
  return new Date(date + "T00:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function waLink(phone, text) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = "27" + digits.slice(1);
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

const TAG_STYLE = {
  VIP: "border-[#d6b36a] text-[#d6b36a]",
  Regular: "border-[#6fcf8a]/60 text-[#6fcf8a]",
  New: "border-white/20 text-[#9f978f]",
};

function ClientCard({ client, notesReady, onSaved }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(client.notes);
  const [flag, setFlag] = useState(client.allergyFlag);
  const [details, setDetails] = useState(client.allergyDetails);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function save() {
    setBusy(true);
    setMsg("");
    setErr("");
    try {
      await api("/api/admin/clients", {
        method: "POST",
        body: JSON.stringify({
          action: "save_note",
          key: client.key,
          notes,
          allergy_flag: flag,
          allergy_details: details,
        }),
      });
      setMsg("Saved.");
      onSaved(client.key, { notes, allergyFlag: flag, allergyDetails: details });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const first = String(client.name || "").trim().split(" ")[0] || "there";

  return (
    <div className={card}>
      {client.allergyFlag && (
        <p className="mb-3 rounded-lg bg-[#5a1d1d] px-3 py-2 text-sm font-bold text-[#ffb3ad]">
          ⚠ ALLERGY / REACTION{client.allergyDetails ? `: ${client.allergyDetails}` : ""}
        </p>
      )}

      <button className="block w-full text-left" onClick={() => setOpen((o) => !o)}>
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold">{client.name}</p>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${TAG_STYLE[client.tag]}`}>{client.tag}</span>
        </div>
        <p className="mt-1 text-xs text-[#9f978f]">
          {client.bookings} booking{client.bookings === 1 ? "" : "s"} · {money(client.spent)} menu value
          {client.cancelled ? ` · ${client.cancelled} cancelled` : ""}
        </p>
        {client.lastSet && (
          <p className="mt-1 text-xs text-[#c9c0b6]">Last time ({niceDate(client.lastDate)}): {client.lastSet}</p>
        )}
        {client.nextDate && <p className="mt-1 text-xs text-[#6fcf8a]">Next booking: {niceDate(client.nextDate)}</p>}
      </button>

      {open && (
        <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
          <p className="text-sm text-[#c9c0b6]">{client.phone} · {client.email}</p>

          {client.phone && (
            <a
              className="inline-block rounded-lg border border-[#6fcf8a]/50 px-3 py-1.5 text-xs font-bold text-[#6fcf8a]"
              href={waLink(client.phone, `Hi ${first}, it's Freddy from Freddy Nails. `)}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp {first}
            </a>
          )}

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#d6b36a]">History</p>
            <ul className="space-y-1 text-xs text-[#c9c0b6]">
              {client.history.map((h) => (
                <li key={h.id}>
                  {niceDate(h.date)} · {h.services} · <span className={h.status === "cancelled" ? "text-[#e39a96]" : h.status === "pending" ? "text-[#e8a53a]" : "text-[#6fcf8a]"}>{h.status}</span>
                </li>
              ))}
            </ul>
          </div>

          {notesReady ? (
            <div className="space-y-3">
              <label className="block text-xs text-[#9f978f]">Notes (favourite designs, shape, preferred times…)
                <textarea className={`${input} mt-1`} rows={3} maxLength={2000} value={notes} onChange={(e) => { setNotes(e.target.value); setMsg(""); }} />
              </label>
              <label className="flex items-center gap-2 text-sm text-[#c9c0b6]">
                <input type="checkbox" checked={flag} onChange={(e) => { setFlag(e.target.checked); setMsg(""); }} />
                Allergy / reaction history
              </label>
              {flag && (
                <input className={input} placeholder="What reacted? (e.g. acrylic liquid)" maxLength={500} value={details} onChange={(e) => { setDetails(e.target.value); setMsg(""); }} />
              )}
              {err && <p className="rounded-lg bg-[#3a1d1d] p-3 text-sm text-[#e39a96]">{err}</p>}
              {msg && <p className="text-sm text-[#9fd4ad]">{msg}</p>}
              <button className={goldBtn} disabled={busy} onClick={save}>{busy ? "Saving…" : "Save notes"}</button>
            </div>
          ) : (
            <p className="text-xs text-[#e8c36a]">Notes and allergy flags need the one-time Supabase setup (SQL) before they can be saved.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ClientsPage() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [clients, setClients] = useState([]);
  const [notesReady, setNotesReady] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

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
      const data = await api("/api/admin/clients");
      setClients(data.clients || []);
      setNotesReady(data.notesReady !== false);
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

  function handleSaved(key, patch) {
    setClients((list) => list.map((c) => (c.key === key ? { ...c, ...patch, notes: patch.notes } : c)));
  }

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    const digits = term.replace(/\D/g, "");
    return clients.filter((c) => {
      if (filter === "vip" && c.tag !== "VIP") return false;
      if (filter === "allergy" && !c.allergyFlag) return false;
      if (!term) return true;
      return (
        String(c.name || "").toLowerCase().includes(term) ||
        String(c.email || "").toLowerCase().includes(term) ||
        (digits.length >= 3 && String(c.phone || "").replace(/\D/g, "").includes(digits))
      );
    });
  }, [clients, q, filter]);

  const FILTERS = [
    ["all", "All"],
    ["vip", "VIP (5+)"],
    ["allergy", "Allergy flag"],
  ];

  return (
    <main className="min-h-screen bg-[#11100f] text-[#f4eee6]">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d6b36a]">Freddy Nails</p>
          <h1 className="font-serif text-3xl">Clients</h1>
        </div>

        {!ready && <p className="text-[#c9c0b6]">Loading…</p>}
        {ready && !signedIn && (
          <p className={card}>
            Please <Link href="/admin" className="font-semibold text-[#d6b36a] underline">sign in on the Bookings page</Link> first, then come back.
          </p>
        )}

        {ready && signedIn && (
          <div className="space-y-4">
            <input className={input} placeholder="Search name, phone or email" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(([key, label]) => (
                <button key={key} onClick={() => setFilter(key)} className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${filter === key ? "bg-[#d6b36a] text-[#11100f]" : "border border-white/20 text-[#c9c0b6]"}`}>{label}</button>
              ))}
            </div>

            {error && <p className="rounded-lg bg-[#3a1d1d] p-3 text-sm text-[#e39a96]">{error}</p>}
            {loading && <p className="text-sm text-[#c9c0b6]">Loading clients…</p>}
            {!loading && !error && shown.length === 0 && <p className="text-sm text-[#c9c0b6]">No clients found.</p>}
            {!loading && !notesReady && (
              <p className="rounded-lg bg-[#2a2314] p-3 text-xs text-[#e8c36a]">
                Client history works now. Notes and allergy flags need the one-time Supabase SQL setup.
              </p>
            )}

            {shown.map((c) => (
              <ClientCard key={c.key} client={c} notesReady={notesReady} onSaved={handleSaved} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
