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

function todaySA() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" });
}

function money(n) {
  return `R${Number(n || 0).toLocaleString("en-ZA")}`;
}

// Menu price of everything on the booking (all clients).
function bookingTotal(b) {
  return (b.clients || []).reduce((sum, c) => sum + servicesPrice(c.services), 0);
}

function isCancelled(b) {
  return ["cancelled", "canceled"].includes(String(b.booking_status).toLowerCase());
}

function isPaid(b) {
  return String(b.payment_status || "").toLowerCase() === "paid";
}

// South African numbers: 082 123 4567 -> 27821234567
function waLink(phone, text) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = "27" + digits.slice(1);
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function firstName(b) {
  return String(b.customer_name || "").trim().split(" ")[0] || "there";
}

function seeYouText(b) {
  const c = b.clients?.[0];
  const when = c ? `${niceDate(c.date)} at ${c.start}` : "soon";
  return `Hi ${firstName(b)}, see you ${when} at Freddy Nails! Let me know if anything changes.`;
}

function lateText(b) {
  return `Hi ${firstName(b)}, I'm running about 10 minutes late, sorry! See you very soon.`;
}

function thanksText(b) {
  return `Hi ${firstName(b)}, thank you so much for coming in today! I hope you love your nails. Send me a pic!`;
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
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="relative">
        <input
          className={`${input} pr-11`}
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a79a87] transition-colors hover:text-[#d6b36a]"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="text-sm text-[#e39a96]">{error}</p>}
      <button className={goldBtn} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}

/* ---------- payment breakdown ---------- */

function PaymentBreakdown({ booking, clients }) {
  const [payments, setPayments] = useState([]);
  const [ready, setReady] = useState(true);
  const [method, setMethod] = useState("cash");
  const [amount, setAmount] = useState("");
  const [tip, setTip] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadPayments = useCallback(async () => {
    try {
      const data = await api(`/api/admin/payments?appointment_id=${encodeURIComponent(booking.id)}`);
      setPayments(data.payments || []);
      setReady(data.ready !== false);
    } catch (e) {
      setError(e.message);
    }
  }, [booking.id]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Uses the services currently picked on screen, so adding an extra
  // updates the total straight away (before you even press Save).
  const total = clients.length
    ? clients.reduce((sum, c) => sum + servicesPrice(c.services), 0)
    : bookingTotal(booking);
  const deposit = Number(booking.deposit_amount || 0);
  const paid = isPaid(booking);
  const cancelled = isCancelled(booking);
  const collected = payments.filter((p) => !p.is_tip).reduce((s, p) => s + Number(p.amount), 0);
  const tips = payments.filter((p) => p.is_tip).reduce((s, p) => s + Number(p.amount), 0);
  const balance = Math.max(total - (paid ? deposit : 0) - collected, 0);

  async function add(isTip) {
    const value = isTip ? tip : amount || String(balance);
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/payments", {
        method: "POST",
        body: JSON.stringify({ action: "add", appointment_id: booking.id, amount: value, method, is_tip: isTip }),
      });
      if (isTip) setTip("");
      else setAmount("");
      await loadPayments();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(p) {
    if (!window.confirm(`Remove this ${p.is_tip ? "tip" : "payment"} of ${money(p.amount)}?`)) return;
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/payments", { method: "POST", body: JSON.stringify({ action: "delete", id: p.id }) });
      await loadPayments();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const row = "flex items-center justify-between text-sm";
  return (
    <div className={card}>
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#d6b36a]">Payment</p>
      <div className="space-y-2">
        <div className={row}>
          <span className="text-[#c9c0b6]">Total (menu prices)</span>
          <span className="font-semibold">{money(total)}</span>
        </div>
        <div className={row}>
          <span className="flex items-center gap-2 text-[#c9c0b6]">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${paid ? "bg-[#6fcf8a]" : "bg-[#e8a53a]"}`} />
            Deposit {paid ? "paid" : "pending"}
          </span>
          <span className="font-semibold">{money(deposit)}</span>
        </div>
        {collected > 0 && (
          <div className={row}>
            <span className="text-[#c9c0b6]">Balance paid</span>
            <span className="font-semibold text-[#6fcf8a]">{money(collected)}</span>
          </div>
        )}
        <div className={`${row} border-t border-white/10 pt-2`}>
          <span className="font-semibold">{balance === 0 && collected > 0 ? "Fully paid" : "Balance due"}</span>
          <span className="text-lg font-bold text-[#d6b36a]">{money(balance)}</span>
        </div>
        {tips > 0 && (
          <div className={row}>
            <span className="text-[#c9c0b6]">Tips (not in totals)</span>
            <span className="font-semibold">{money(tips)}</span>
          </div>
        )}
      </div>

      {!cancelled && ready && (
        <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <select className={input} value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="transfer">Transfer / EFT</option>
              <option value="card">Card</option>
            </select>
            <input
              className={input}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder={balance > 0 ? `R${balance}` : "R amount"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <button className={goldBtn} disabled={busy || (balance <= 0 && !amount)} onClick={() => add(false)}>
            {busy ? "Saving…" : "Mark balance paid"}
          </button>
          <div className="flex gap-2">
            <input
              className={input}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="Tip (R)"
              value={tip}
              onChange={(e) => setTip(e.target.value)}
            />
            <button className={ghostBtn} disabled={busy || !tip} onClick={() => add(true)}>Add tip</button>
          </div>
        </div>
      )}

      {!ready && (
        <p className="mt-3 rounded-lg bg-[#2a2314] p-3 text-xs text-[#e8c36a]">
          Recording balance payments and tips needs the one-time Supabase SQL setup.
        </p>
      )}
      {error && <p className="mt-3 rounded-lg bg-[#3a1d1d] p-3 text-sm text-[#e39a96]">{error}</p>}

      {payments.length > 0 && (
        <ul className="mt-4 space-y-1 border-t border-white/10 pt-3 text-xs text-[#c9c0b6]">
          {payments.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2">
              <span>{p.is_tip ? "Tip" : "Balance"} · {p.method} · {money(p.amount)}</span>
              <button className="font-bold uppercase text-[#e39a96]" disabled={busy} onClick={() => remove(p)}>Remove</button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-[#9f978f]">
        Menu prices only. Promo codes are not deducted, and the deposit is not changed by edits.
      </p>
    </div>
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
          {booking.google_event_id ? "In Google Calendar" : "Not in Google Calendar"}
        </p>
        {booking.notes && <p className="mt-2 text-sm text-[#c9c0b6]">Notes: {booking.notes}</p>}
        {booking.flags.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-[#e8c36a]">
            {booking.flags.map((f) => <li key={f}>⚠ {f}</li>)}
          </ul>
        )}
      </div>

      <PaymentBreakdown booking={booking} clients={clients} />

      {booking.customer_phone && (
        <div className={card}>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#d6b36a]">WhatsApp {firstName(booking)}</p>
          <div className="flex flex-wrap gap-2">
            <a className={ghostBtn} href={waLink(booking.customer_phone, seeYouText(booking))} target="_blank" rel="noopener noreferrer">See you at…</a>
            <a className={ghostBtn} href={waLink(booking.customer_phone, lateText(booking))} target="_blank" rel="noopener noreferrer">Running 10 min late</a>
            <a className={ghostBtn} href={waLink(booking.customer_phone, thanksText(booking))} target="_blank" rel="noopener noreferrer">Thank you</a>
          </div>
        </div>
      )}

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

/* ---------- booking card (list) ---------- */

function BookingCard({ b, onOpen, ready, onToggleReady, onOutcome, showReady }) {
  const paid = isPaid(b);
  const phone = b.customer_phone;
  return (
    <div className={card}>
      <button onClick={() => onOpen(b)} className="block w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <p className="flex items-center gap-2 font-semibold">
            <span
              title={paid ? "Deposit paid" : "Deposit pending"}
              className={`inline-block h-2.5 w-2.5 rounded-full ${paid ? "bg-[#6fcf8a]" : "bg-[#e8a53a]"}`}
            />
            {b.customer_name}
          </p>
          <p className="text-xs text-[#9f978f]">{b.ref}</p>
        </div>
        <p className="mt-1 text-sm text-[#c9c0b6]">
          {niceDate(b.booking_date)} · {b.clients.length > 1 ? `${b.clients.length} clients` : `${b.clients[0]?.start || ""}–${b.clients[0]?.end || ""}`} · {money(bookingTotal(b))}
        </p>
        {b.clients.map((c) => (
          <p key={c.client_number} className="mt-1 text-xs text-[#9f978f]">
            {b.clients.length > 1 ? `Client ${c.client_number}: ` : ""}{c.services.join(" + ")}{b.clients.length > 1 ? ` · ${niceDate(c.date)} ${c.start}–${c.end}` : ""}
          </p>
        ))}
        {b.notes && <p className="mt-2 text-xs italic text-[#c9c0b6]">“{b.notes}”</p>}
        {b.flags.length > 0 && <p className="mt-2 text-xs font-semibold text-[#e8c36a]">⚠ {b.flags.join(" · ")}</p>}
      </button>

      {(phone || showReady) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
          {phone && (
            <a
              className="rounded-lg border border-[#6fcf8a]/50 px-3 py-1.5 text-xs font-bold text-[#6fcf8a]"
              href={waLink(phone, seeYouText(b))}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          )}
          {showReady && (
            <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-[#c9c0b6]">
              <input type="checkbox" checked={b.booking_status === "ready" || !!ready} onChange={() => onToggleReady(b.id)} />
              Ready
            </label>
          )}
          {!isCancelled(b) && !(["completed", "not_completed"].includes(String(b.booking_status || "").toLowerCase())) && (
            <div className="flex gap-2">
              <button type="button" onClick={() => onOutcome(b.id, "completed")} className="rounded-lg border border-[#6fcf8a]/40 px-3 py-1.5 text-xs font-bold text-[#6fcf8a]">Completed</button>
              <button type="button" onClick={() => onOutcome(b.id, "not_completed")} className="rounded-lg border border-[#e39a96]/40 px-3 py-1.5 text-xs font-bold text-[#e39a96]">Not completed</button>
            </div>
          )}
          {b.booking_status === "completed" && <span className="text-xs font-bold text-[#6fcf8a]">✓ Completed</span>}
          {b.booking_status === "not_completed" && <span className="text-xs font-bold text-[#e39a96]">Not completed</span>}
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
  const [checked, setChecked] = useState({});

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

  async function updateBookingAction(id, action) {
    try {
      const result = await api("/api/admin/bookings", { method: "POST", body: JSON.stringify({ id, action }) });
      if (result.booking) setBookings((current) => current.map((b) => b.id === id ? result.booking : b));
      setChecked((current) => ({ ...current, [id]: action === "ready" }));
    } catch (e) { setError(e.message || "Could not update booking status."); }
  }

  function toggleReady(id) {
    const currentlyReady = checked[id] || bookings.find((b) => b.id === id)?.booking_status === "ready";
    updateBookingAction(id, currentlyReady ? "confirmed" : "ready");
  }

  function markOutcome(id, action) { updateBookingAction(id, action); }

  const today = todaySA();
  const showToday = scope === "upcoming" && !q;
  const todays = showToday
    ? bookings.filter((b) => !isCancelled(b) && (b.clients.some((c) => c.date === today) || b.booking_date === today))
    : [];
  const todayIds = new Set(todays.map((b) => b.id));
  const rest = showToday ? bookings.filter((b) => !todayIds.has(b.id)) : bookings;
  const todayTotal = todays.reduce((sum, b) => sum + bookingTotal(b), 0);

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

            {showToday && !loading && !error && (
              <div className="rounded-xl border border-[#d6b36a]/50 bg-[#1d1a14] p-3">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d6b36a]">Today</p>
                <p className="mt-1 font-serif text-xl">
                  {todays.length === 0
                    ? "No bookings today"
                    : `${todays.length} booking${todays.length > 1 ? "s" : ""}, ${money(todayTotal)} expected`}
                </p>
                {todays.length > 0 && (
                  <p className="mt-1 text-xs text-[#9f978f]">
                    {Object.values(checked).filter(Boolean).length > 0
                      ? `${todays.filter((b) => checked[b.id]).length} of ${todays.length} ready`
                      : "Tick “Ready” as you set up for each client."}
                  </p>
                )}
                <div className="mt-3 space-y-3">
                  {todays.map((b) => (
                    <BookingCard key={b.id} b={b} onOpen={setSelected} showReady ready={checked[b.id]} onToggleReady={toggleReady} onOutcome={markOutcome} />
                  ))}
                </div>
              </div>
            )}

            {showToday && rest.length > 0 && (
              <p className="pt-1 text-xs font-bold uppercase tracking-[0.2em] text-[#9f978f]">Coming up</p>
            )}

            {rest.map((b) => (
              <BookingCard key={b.id} b={b} onOpen={setSelected} onOutcome={markOutcome} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
