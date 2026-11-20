"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  SERVICE_CATEGORIES,
  findService,
  servicesDuration,
  servicesPrice,
} from "@/lib/serviceCatalogue";
import { findPrimaryConflict } from "@/lib/serviceRules";

/* ---------- small helpers ---------- */

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

function niceDate(date) {
  if (!date) return "";
  return new Date(date + "T00:00:00").toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function toMin(t) {
  const [h, m] = String(t || "0:0").split(":").map(Number);
  return h * 60 + (m || 0);
}
function fromMin(n) {
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
}

const card = "rounded-xl border border-[#d6b36a]/20 bg-[#181614] p-4";
const input =
  "w-full rounded-lg border border-white/15 bg-[#11100f] px-3 py-2 text-sm text-[#f4eee6] outline-none focus:border-[#d6b36a]";
const goldBtn =
  "rounded-lg bg-[#d6b36a] px-4 py-2 text-sm font-bold text-[#11100f] disabled:opacity-50";
const ghostBtn =
  "rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-[#f4eee6] disabled:opacity-50";

/* ---------- sign in ---------- */

function SignIn({ onDone }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={submit} className={`${card} mx-auto mt-10 max-w-sm space-y-3`}>
      <h2 className="font-serif text-2xl">Owner sign in</h2>
      <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      <input className={input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      {error && <p className="text-sm text-[#e39a96]">{error}</p>}
      <button className={goldBtn} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}

/* ---------- booking editor ---------- */

function Editor({ booking, onBack, onChanged }) {
  const [clients, setClients] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [warnings, setWarnings] = useState([]);

  const cancelled = ["cancelled", "canceled"].includes(String(booking.booking_status).toLowerCase());

  useEffect(() => {
    setClients(
      booking.clients.map((c) => ({
        client_number: c.client_number,
        services: [...c.services],
        date: c.date,
        start: c.start,
      }))
    );
    setWarnings([]);
  }, [booking]);

  function change(index, patch) {
    setClients((current) => current.map((c, i) => (i === index ? { ...c, ...patch } : c)));
    setWarnings([]);
    setError("");
    setNotice("");
  }

  function setService(ci, si, value) {
    const services = [...clients[ci].services];
    services[si] = value;
    change(ci, { services });
  }
  function addService(ci) {
    if (clients[ci].services.length >= 4) return;
    change(ci, { services: [...clients[ci].services, "Extra - Nail Art"] });
  }
  function removeService(ci, si) {
    if (clients[ci].services.length <= 1) return;
    change(ci, { services: clients[ci].services.filter((_, i) => i !== si) });
  }

  async function run(action, extra = {}) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const data = await api("/api/admin/bookings", {
        method: "POST",
        body: JSON.stringify({ action, id: booking.id, ...extra }),
      });

      if (data.needsConfirm) {
        setWarnings(data.warnings || []);
        return;
      }
      setWarnings([]);
      const parts = [];
      if (action === "save") parts.push("Saved.");
      if (action === "cancel") parts.push("Booking cancelled.");
      if (data.calendar?.message) parts.push(data.calendar.message);
      if (data.note) parts.push(data.note);
      setNotice(parts.join(" "));
      onChanged(data.booking || null, data.cancelled);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function save(force) {
    run("save", { clients, force: !!force });
  }

  function cancelBooking() {
    if (window.confirm(`Cancel ${booking.customer_name}'s booking? This removes it from Google Calendar. The deposit is not refunded automatically.`)) {
      run("cancel");
    }
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm font-semibold text-[#d6b36a]">← All bookings</button>

      <div className={card}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-serif text-2xl">{booking.customer_name}</p>
            <p className="text-sm text-[#c9c0b6]">{booking.ref} · {booking.customer_phone} · {booking.customer_email}</p>
          </div>
          <span className="rounded-full border border-[#d6b36a]/40 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#d6b36a]">
            {booking.booking_status} · {booking.payment_status}
          </span>
        </div>
        <p className="mt-2 text-sm text-[#c9c0b6]">
          Deposit R{booking.deposit_amount || 0} (not changed by edits) · {booking.google_event_id ? "In Google Calendar" : "Not in Google Calendar"}
        </p>
        {booking.notes && <p className="mt-2 text-sm text-[#c9c0b6]">Notes: {booking.notes}</p>}
        {booking.flags.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-[#e8c36a]">
            {booking.flags.map((f) => <li key={f}>⚠ {f}</li>)}
          </ul>
        )}
      </div>

      {clients.map((client, ci) => {
        const duration = servicesDuration(client.services);
        const end = fromMin(toMin(client.start) + duration);
        const conflict = findPrimaryConflict(client.services);
        const unknown = client.services.filter((s) => !findService(s));
        return (
          <div key={client.client_number} className={card}>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#d6b36a]">
              Client {client.client_number}
            </p>

            <div className="space-y-2">
              {client.services.map((service, si) => (
                <div key={si} className="flex items-center gap-2">
                  <select className={input} value={service} disabled={cancelled} onChange={(e) => setService(ci, si, e.target.value)}>
                    {!findService(service) && <option value={service}>{service} (not on menu)</option>}
                    {SERVICE_CATEGORIES.map((group) => (
                      <optgroup key={group.category} label={group.category}>
                        {group.items.map((item) => (
                          <option key={item.label} value={item.label}>{item.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {client.services.length > 1 && !cancelled && (
                    <button type="button" onClick={() => removeService(ci, si)} className="shrink-0 text-xs font-bold uppercase text-[#e39a96]">Remove</button>
                  )}
                </div>
              ))}
              {client.services.length < 4 && !cancelled && (
                <button type="button" onClick={() => addService(ci)} className="text-xs font-bold uppercase tracking-wide text-[#d6b36a]">+ Add service</button>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-xs text-[#9f978f]">Date
                <input type="date" className={`${input} mt-1`} value={client.date} disabled={cancelled} onChange={(e) => change(ci, { date: e.target.value })} />
              </label>
              <label className="text-xs text-[#9f978f]">Start time
                <input type="time" step="300" className={`${input} mt-1`} value={client.start} disabled={cancelled} onChange={(e) => change(ci, { start: e.target.value })} />
              </label>
            </div>

            <p className="mt-3 text-sm text-[#c9c0b6]">
              {client.start}–{end} · {duration} min · from R{servicesPrice(client.services)}
            </p>
            {conflict && <p className="mt-1 text-sm text-[#e8c36a]">⚠ Two {conflict.label} services selected.</p>}
            {unknown.length > 0 && <p className="mt-1 text-sm text-[#e8c36a]">⚠ Not on the menu: {unknown.join(", ")}. Pick a service from the list.</p>}
          </div>
        );
      })}

      {warnings.length > 0 && (
        <div className="rounded-xl border border-[#e8c36a]/50 bg-[#2a2314] p-4">
          <p className="font-semibold text-[#e8c36a]">Check these before saving:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#f4eee6]">
            {warnings.map((w) => <li key={w}>{w}</li>)}
          </ul>
          <div className="mt-3 flex gap-2">
            <button className={goldBtn} disabled={busy} onClick={() => save(true)}>Save anyway</button>
            <button className={ghostBtn} disabled={busy} onClick={() => setWarnings([])}>Go back</button>
          </div>
        </div>
      )}

      {error && <p className="rounded-lg bg-[#3a1d1d] p-3 text-sm text-[#e39a96]">{error}</p>}
      {notice && <p className="rounded-lg bg-[#1d2e22] p-3 text-sm text-[#9fd4ad]">{notice}</p>}

      {!cancelled && warnings.length === 0 && (
        <div className="flex flex-wrap gap-2">
          <button className={goldBtn} disabled={busy} onClick={() => save(false)}>{busy ? "Working…" : "Save changes"}</button>
          <button className={ghostBtn} disabled={busy} onClick={() => run("resync")}>Re-sync calendar</button>
          <button className="rounded-lg border border-[#e39a96]/50 px-4 py-2 text-sm font-semibold text-[#e39a96] disabled:opacity-50" disabled={busy} onClick={cancelBooking}>Cancel booking</button>
        </div>
      )}
    </div>
  );
}

/* ---------- main page ---------- */

const SCOPES = [
  ["upcoming", "Upcoming"],
  ["attention", "Needs attention"],
  ["all", "All"],
  ["cancelled", "Cancelled"],
];

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [scope, setScope] = useState("upcoming");
  const [q, setQ] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

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
      const params = new URLSearchParams({ scope });
      if (q.trim()) params.set("q", q.trim());
      const data = await api(`/api/admin/bookings?${params.toString()}`);
      setBookings(data.bookings || []);
    } catch (e) {
      setError(e.message);
      if (e.status === 401) setSignedIn(false);
    } finally {
      setLoading(false);
    }
  }, [scope, q]);

  useEffect(() => {
    if (!signedIn) return;
    const timer = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(timer);
  }, [signedIn, load, q]);

  async function signOut() {
    await supabase.auth.signOut();
    setSignedIn(false);
    setSelected(null);
  }

  function handleChanged(updated, cancelled) {
    if (updated) setSelected(updated);
    if (cancelled) setSelected(null);
    load();
  }

  return (
    <main className="min-h-screen bg-[#11100f] text-[#f4eee6]">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d6b36a]">Freddy Nails</p>
            <h1 className="font-serif text-3xl">Owner dashboard</h1>
          </div>
          {signedIn && <button onClick={signOut} className="text-sm font-semibold text-[#c9c0b6]">Sign out</button>}
        </div>

        {!ready && <p className="text-[#c9c0b6]">Loading…</p>}
        {ready && !signedIn && <SignIn onDone={() => setSignedIn(true)} />}

        {ready && signedIn && selected && (
          <Editor booking={selected} onBack={() => setSelected(null)} onChanged={handleChanged} />
        )}

        {ready && signedIn && !selected && (
          <div className="space-y-4">
            <input className={input} placeholder="Search name, phone, email or FN- reference" value={q} onChange={(e) => setQ(e.target.value)} />
            {!q && (
              <div className="flex flex-wrap gap-2">
                {SCOPES.map(([key, label]) => (
                  <button key={key} onClick={() => setScope(key)} className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${scope === key ? "bg-[#d6b36a] text-[#11100f]" : "border border-white/20 text-[#c9c0b6]"}`}>{label}</button>
                ))}
              </div>
            )}

            {error && <p className="rounded-lg bg-[#3a1d1d] p-3 text-sm text-[#e39a96]">{error}</p>}
            {loading && <p className="text-sm text-[#c9c0b6]">Loading bookings…</p>}
            {!loading && !error && bookings.length === 0 && <p className="text-sm text-[#c9c0b6]">Nothing here.</p>}

            {bookings.map((b) => (
              <button key={b.id} onClick={() => setSelected(b)} className={`${card} block w-full text-left`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{b.customer_name}</p>
                  <p className="text-xs text-[#9f978f]">{b.ref}</p>
                </div>
                <p className="mt-1 text-sm text-[#c9c0b6]">
                  {niceDate(b.booking_date)} · {b.clients.length > 1 ? `${b.clients.length} clients` : `${b.clients[0]?.start || ""}–${b.clients[0]?.end || ""}`}
                </p>
                {b.clients.map((c) => (
                  <p key={c.client_number} className="mt-1 text-xs text-[#9f978f]">
                    {b.clients.length > 1 ? `Client ${c.client_number}: ` : ""}{c.services.join(" + ")}{b.clients.length > 1 ? ` · ${niceDate(c.date)} ${c.start}–${c.end}` : ""}
                  </p>
                ))}
                {b.flags.length > 0 && <p className="mt-2 text-xs font-semibold text-[#e8c36a]">⚠ {b.flags.join(" · ")}</p>}
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
