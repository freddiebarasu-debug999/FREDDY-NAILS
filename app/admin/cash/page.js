"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { SERVICE_CATEGORIES, findService, servicesDuration, servicesPrice } from "@/lib/serviceCatalogue";
import { depositForClientServices } from "@/lib/serviceNames";
import { OPEN_MINUTES, CLOSE_MINUTES } from "@/lib/bookingRules";

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
  "rounded-lg bg-[#d6b36a] px-4 py-3 text-sm font-bold text-[#11100f] disabled:opacity-50";
const ghostBtn =
  "rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-[#f4eee6] disabled:opacity-50";

const TIMES = [];
for (let m = OPEN_MINUTES; m <= CLOSE_MINUTES - 15; m += 15) {
  TIMES.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
}

function endTime(start, minutes) {
  if (!start || !minutes) return "";
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const emptyClient = () => ({ services: [], date: "", start: "" });

function ServicePicker({ selected, onToggle }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="space-y-2">
      {SERVICE_CATEGORIES.map((group) => {
        const chosen = group.items.filter((i) => selected.includes(i.label)).length;
        return (
          <div key={group.category} className="rounded-lg border border-white/10">
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold"
              onClick={() => setOpen(open === group.category ? null : group.category)}
            >
              <span>{group.category}{chosen ? ` · ${chosen} selected` : ""}</span>
              <span className="text-[#d6b36a]">{open === group.category ? "−" : "+"}</span>
            </button>
            {open === group.category && (
              <div className="space-y-1 border-t border-white/10 px-3 py-2">
                {group.items.map((item) => (
                  <label key={item.label} className="flex items-start gap-2 text-sm text-[#c9c0b6]">
                    <input type="checkbox" className="mt-1" checked={selected.includes(item.label)} onChange={() => onToggle(item.label)} />
                    <span>{item.label} <span className="text-xs text-[#9f978f]">({item.duration} min · R{item.price})</span></span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CashBookingPage() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [details, setDetails] = useState({ name: "", phone: "", email: "", notes: "" });
  const [clients, setClients] = useState([emptyClient()]);
  const [waitlistId, setWaitlistId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState([]);
  const [result, setResult] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      setReady(true);
    });
    // Prefill when opened from the waitlist (?name=&phone=&email=&wl=)
    const params = new URLSearchParams(window.location.search);
    setDetails((d) => ({
      ...d,
      name: params.get("name") || "",
      phone: params.get("phone") || "",
      email: params.get("email") || "",
    }));
    setWaitlistId(params.get("wl") || "");
  }, []);

  function updateClient(index, patch) {
    setClients((list) => list.map((c, i) => (i === index ? { ...c, ...patch } : c)));
    setError("");
    setWarnings([]);
  }

  function toggleService(index, label) {
    setClients((list) =>
      list.map((c, i) => {
        if (i !== index) return c;
        const has = c.services.includes(label);
        if (!has && c.services.length >= 4) return c;
        return { ...c, services: has ? c.services.filter((s) => s !== label) : [...c.services, label] };
      })
    );
    setError("");
    setWarnings([]);
  }

  const totals = useMemo(() => {
    const deposit = clients.reduce(
      (sum, c) => sum + (c.services.length ? depositForClientServices(c.services, { standardDeposit: 90, waiveDeposit: false }) : 0),
      0
    );
    return { deposit };
  }, [clients]);

  async function submit(force = false) {
    setError("");
    if (!force) {
      const ok = window.confirm(`Have you received R${totals.deposit} CASH from ${details.name || "this client"}? This will confirm the booking and email her.`);
      if (!ok) return;
    }
    setBusy(true);
    try {
      const data = await api("/api/admin/cash-booking", {
        method: "POST",
        body: JSON.stringify({
          ...details,
          clients: clients.map((c) => ({ services: c.services, date: c.date, start: c.start })),
          waitlist_id: waitlistId || undefined,
          force,
        }),
      });
      if (data.needsConfirm) {
        setWarnings(data.warnings || []);
      } else {
        setResult(data);
        setWarnings([]);
      }
    } catch (e) {
      setError(e.message);
      if (e.status === 401) setSignedIn(false);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setDetails({ name: "", phone: "", email: "", notes: "" });
    setClients([emptyClient()]);
    setWaitlistId("");
    setResult(null);
    setWarnings([]);
    setError("");
    window.history.replaceState(null, "", "/admin/cash");
  }

  return (
    <main className="min-h-screen bg-[#11100f] text-[#f4eee6]">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d6b36a]">Freddy Nails</p>
          <h1 className="font-serif text-3xl">Cash deposit booking</h1>
          <p className="mt-1 text-sm text-[#9f978f]">Once you&apos;ve been paid the deposit in cash, fill this in and press the button. It goes straight on your schedule.</p>
        </div>

        {!ready && <p className="text-[#c9c0b6]">Loading…</p>}
        {ready && !signedIn && (
          <p className={card}>
            Please <Link href="/admin" className="font-semibold text-[#d6b36a] underline">sign in on the Bookings page</Link> first, then come back.
          </p>
        )}

        {ready && signedIn && result && (
          <div className={`${card} space-y-3`}>
            <p className="font-serif text-2xl">Booked ✨</p>
            <p className="text-sm text-[#c9c0b6]">Reference {result.ref} · cash deposit R{result.deposit}</p>
            <p className={`text-sm ${result.calendar.ok ? "text-[#9fd4ad]" : "text-[#e8c36a]"}`}>{result.calendar.message}</p>
            <p className={`text-sm ${result.email.ok ? "text-[#9fd4ad]" : "text-[#e8c36a]"}`}>{result.email.message}</p>
            <div className="flex gap-2">
              <button className={goldBtn} onClick={reset}>Add another</button>
              <Link href="/admin" className={ghostBtn}>Back to bookings</Link>
            </div>
          </div>
        )}

        {ready && signedIn && !result && (
          <div className="space-y-4">
            <div className={`${card} space-y-3`}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d6b36a]">Client details</p>
              <input className={input} placeholder="Name" maxLength={80} value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} />
              <input className={input} type="tel" placeholder="Phone / WhatsApp" maxLength={25} value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} />
              <input className={input} type="email" placeholder="Email (her confirmation is sent here)" maxLength={120} value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} />
              <input className={input} placeholder="Notes (optional)" maxLength={300} value={details.notes} onChange={(e) => setDetails({ ...details, notes: e.target.value })} />
            </div>

            {clients.map((c, index) => {
              const minutes = servicesDuration(c.services);
              const price = servicesPrice(c.services);
              return (
                <div key={index} className={`${card} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d6b36a]">{clients.length > 1 ? `Client ${index + 1}` : "Appointment"}</p>
                    {clients.length > 1 && (
                      <button className="text-xs font-bold uppercase text-[#e39a96]" onClick={() => setClients((l) => l.filter((_, i) => i !== index))}>Remove</button>
                    )}
                  </div>
                  <ServicePicker selected={c.services} onToggle={(label) => toggleService(index, label)} />
                  {c.services.length > 0 && (
                    <p className="text-xs text-[#c9c0b6]">
                      {c.services.map((s) => findService(s)?.label || s).join(" + ")} · {minutes} min · R{price}
                    </p>
                  )}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-[0.15em] text-[#9f978f]">Date</span>
                      <div className="relative">
                        <input className={`${input} min-h-[48px] w-full`} type="date" value={c.date} onChange={(e) => updateClient(index, { date: e.target.value })} />
                        {!c.date && (
                          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-[#9f978f]">Tap to choose a date</span>
                        )}
                      </div>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-[0.15em] text-[#9f978f]">Start time</span>
                      <select className={`${input} min-h-[48px] w-full`} value={c.start} onChange={(e) => updateClient(index, { start: e.target.value })}>
                        <option value="">Choose a time</option>
                        {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </label>
                  </div>
                  {c.start && minutes > 0 && <p className="text-xs text-[#9f978f]">Ends about {endTime(c.start, minutes)}</p>}
                </div>
              );
            })}

            {clients.length < 4 && (
              <button className={ghostBtn} onClick={() => setClients((l) => [...l, emptyClient()])}>+ Add another client (friend)</button>
            )}

            <div className={`${card} space-y-3`}>
              <p className="text-sm text-[#c9c0b6]">Cash deposit to collect: <span className="text-lg font-bold text-[#d6b36a]">R{totals.deposit}</span></p>

              {warnings.length > 0 && (
                <div className="rounded-lg bg-[#2a2314] p-3 text-sm text-[#e8c36a]">
                  <p className="mb-1 font-bold">Check this before booking:</p>
                  <ul className="list-disc space-y-1 pl-5">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
                </div>
              )}
              {error && <p className="rounded-lg bg-[#3a1d1d] p-3 text-sm text-[#e39a96]">{error}</p>}

              {warnings.length > 0 ? (
                <div className="flex gap-2">
                  <button className={goldBtn} disabled={busy} onClick={() => submit(true)}>{busy ? "Booking…" : "Book anyway"}</button>
                  <button className={ghostBtn} disabled={busy} onClick={() => setWarnings([])}>Change details</button>
                </div>
              ) : (
                <button className={`${goldBtn} w-full`} disabled={busy || !totals.deposit} onClick={() => submit(false)}>
                  {busy ? "Booking…" : "Cash received — book them in"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
