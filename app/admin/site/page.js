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
  return new Date(date + "T00:00:00").toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function prettyTime(t) {
  const [h, m] = String(t || "00:00")
    .slice(0, 5)
    .split(":")
    .map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")}${suffix}`;
}

export default function SitePage() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const [banner, setBanner] = useState({ message: "", active: false });
  const [bannerReady, setBannerReady] = useState(true);

  // Full-day blocks (existing)
  const [dates, setDates] = useState([]);
  const [datesReady, setDatesReady] = useState(true);
  const [form, setForm] = useState({ from: "", to: "", reason: "" });

  // Partial time-range blocks (new)
  const [blocks, setBlocks] = useState([]);
  const [blocksReady, setBlocksReady] = useState(true);
  const [timeForm, setTimeForm] = useState({
    date: "",
    start: "10:00",
    end: "18:30",
    reason: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      setReady(true);
    });
  }, []);

  const load = useCallback(async () => {
    setError("");
    try {
      const [b, d, t] = await Promise.all([
        api("/api/admin/announcement"),
        api("/api/admin/closed-dates"),
        api("/api/admin/blocked-times"),
      ]);
      setBanner({ message: b.message || "", active: !!b.active });
      setBannerReady(b.ready !== false);
      setDates(d.dates || []);
      setDatesReady(d.ready !== false);
      setBlocks(t.blocks || []);
      setBlocksReady(t.ready !== false);
    } catch (e) {
      setError(e.message);
      if (e.status === 401) setSignedIn(false);
    }
  }, []);

  useEffect(() => {
    if (signedIn) load();
  }, [signedIn, load]);

  async function saveBanner(active) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api("/api/admin/announcement", {
        method: "POST",
        body: JSON.stringify({ message: banner.message, active }),
      });
      setBanner((b) => ({ ...b, active }));
      setNotice(active ? "Banner is live on the website." : "Banner is switched off.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function addDays(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const data = await api("/api/admin/closed-dates", {
        method: "POST",
        body: JSON.stringify({ action: "add", ...form }),
      });
      setNotice(
        `${data.added} day${data.added > 1 ? "s" : ""} blocked.` +
          (data.affectedBookings
            ? ` ${data.affectedBookings} existing booking${data.affectedBookings > 1 ? "s are" : " is"} on those days, see below.`
            : "")
      );
      setForm({ from: "", to: "", reason: "" });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeDay(date) {
    if (!window.confirm(`Re-open ${niceDate(date)} for bookings?`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api("/api/admin/closed-dates", {
        method: "POST",
        body: JSON.stringify({ action: "remove", date }),
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function addTimeBlock(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const data = await api("/api/admin/blocked-times", {
        method: "POST",
        body: JSON.stringify({ action: "add", ...timeForm }),
      });
      setNotice(
        `Blocked ${prettyTime(timeForm.start)}–${prettyTime(timeForm.end)} on ${niceDate(timeForm.date)}.` +
          (data.affectedBookings
            ? ` ${data.affectedBookings} existing booking${data.affectedBookings > 1 ? "s overlap" : " overlaps"} that window — see below.`
            : "")
      );
      setTimeForm({ date: "", start: "10:00", end: "18:30", reason: "" });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeTimeBlock(id, label) {
    if (!window.confirm(`Remove block ${label}?`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api("/api/admin/blocked-times", {
        method: "POST",
        body: JSON.stringify({ action: "remove", id }),
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
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d6b36a]">
            Freddy Nails
          </p>
          <h1 className="font-serif text-3xl">Banner &amp; availability</h1>
          <p className="mt-1 text-sm text-[#9f978f]">
            Block full days or specific times so clients can&apos;t book when you&apos;re away.
          </p>
        </div>

        {!ready && <p className="text-[#c9c0b6]">Loading…</p>}
        {ready && !signedIn && (
          <p className={card}>
            Please{" "}
            <Link href="/admin" className="font-semibold text-[#d6b36a] underline">
              sign in on the Bookings page
            </Link>{" "}
            first, then come back.
          </p>
        )}

        {ready && signedIn && (
          <div className="space-y-4">
            {error && (
              <p className="rounded-lg bg-[#3a1d1d] p-3 text-sm text-[#e39a96]">{error}</p>
            )}
            {notice && (
              <p className="rounded-lg bg-[#1d2e22] p-3 text-sm text-[#9fd4ad]">{notice}</p>
            )}

            {/* Banner */}
            <div className={`${card} space-y-3`}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d6b36a]">
                Website banner
              </p>
              {!bannerReady && (
                <p className="rounded-lg bg-[#2a2314] p-3 text-xs text-[#e8c36a]">
                  The banner needs the one-time Supabase SQL setup first.
                </p>
              )}
              <input
                className={input}
                placeholder="e.g. December slots are open! Closed 25 Dec."
                maxLength={160}
                value={banner.message}
                onChange={(e) => setBanner({ ...banner, message: e.target.value })}
              />
              <p className="text-xs text-[#9f978f]">
                {banner.message.length}/160 ·{" "}
                {banner.active ? "Showing on the website" : "Not showing"}
              </p>
              {banner.message && (
                <div className="rounded bg-[#d6b36a] px-3 py-2 text-center text-xs font-semibold text-[#11100f]">
                  {banner.message}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  className={goldBtn}
                  disabled={busy || !bannerReady || !banner.message.trim()}
                  onClick={() => saveBanner(true)}
                >
                  {banner.active ? "Update banner" : "Show on website"}
                </button>
                {banner.active && (
                  <button className={ghostBtn} disabled={busy} onClick={() => saveBanner(false)}>
                    Switch off
                  </button>
                )}
              </div>
            </div>

            {/* Partial time blocks — NEW */}
            <div className={`${card} space-y-3`}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d6b36a]">
                Block specific times
              </p>
              <p className="text-xs text-[#9f978f]">
                Use this when you&apos;re only free for part of the day (e.g. available 7:30–10:00, then
                out for an event). Clients will see those times greyed out.
              </p>
              {!blocksReady && (
                <p className="rounded-lg bg-[#2a2314] p-3 text-xs text-[#e8c36a]">
                  Time blocks need the one-time Supabase SQL setup first (run{" "}
                  <code className="text-[#e8c36a]">supabase-blocked-times.sql</code>).
                </p>
              )}
              <form onSubmit={addTimeBlock} className="space-y-3">
                <label className="text-xs text-[#9f978f]">
                  Date
                  <input
                    className={`${input} mt-1`}
                    type="date"
                    value={timeForm.date}
                    onChange={(e) => setTimeForm({ ...timeForm, date: e.target.value })}
                    required
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs text-[#9f978f]">
                    From (blocked starts)
                    <input
                      className={`${input} mt-1`}
                      type="time"
                      step="1800"
                      value={timeForm.start}
                      onChange={(e) => setTimeForm({ ...timeForm, start: e.target.value })}
                      required
                    />
                  </label>
                  <label className="text-xs text-[#9f978f]">
                    Until (blocked ends)
                    <input
                      className={`${input} mt-1`}
                      type="time"
                      step="1800"
                      value={timeForm.end}
                      onChange={(e) => setTimeForm({ ...timeForm, end: e.target.value })}
                      required
                    />
                  </label>
                </div>
                <input
                  className={input}
                  placeholder="Reason (only you see this) — e.g. Berlin event East London"
                  maxLength={80}
                  value={timeForm.reason}
                  onChange={(e) => setTimeForm({ ...timeForm, reason: e.target.value })}
                />
                <button
                  className={goldBtn}
                  disabled={busy || !blocksReady || !timeForm.date}
                >
                  {busy ? "Saving…" : "Block these times"}
                </button>
              </form>
            </div>

            {/* Upcoming time blocks */}
            {blocks.length > 0 && (
              <div className={`${card} space-y-3`}>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d6b36a]">
                  Upcoming time blocks
                </p>
                {blocks.map((b) => (
                  <div
                    key={b.id}
                    className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {niceDate(b.date)} · {prettyTime(b.start)}–{prettyTime(b.end)}
                        {b.reason ? (
                          <span className="font-normal text-[#9f978f]"> · {b.reason}</span>
                        ) : null}
                      </p>
                      <button
                        className={ghostBtn}
                        disabled={busy}
                        onClick={() =>
                          removeTimeBlock(
                            b.id,
                            `${prettyTime(b.start)}–${prettyTime(b.end)} on ${niceDate(b.date)}`
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                    {b.bookings?.length > 0 && (
                      <p className="mt-2 rounded-lg bg-[#3a1d1d] p-2 text-xs text-[#e39a96]">
                        ⚠ Already booked in this window:{" "}
                        {b.bookings.map((x) => `${x.name} ${x.start}`).join(", ")}. Move or cancel
                        on the{" "}
                        <Link href="/admin" className="underline">
                          Bookings page
                        </Link>
                        .
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Full-day blocks (existing) */}
            <div className={`${card} space-y-3`}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d6b36a]">
                Block full days off
              </p>
              {!datesReady && (
                <p className="rounded-lg bg-[#2a2314] p-3 text-xs text-[#e8c36a]">
                  Days off need the one-time Supabase SQL setup first.
                </p>
              )}
              <form onSubmit={addDays} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs text-[#9f978f]">
                    First day
                    <input
                      className={`${input} mt-1`}
                      type="date"
                      value={form.from}
                      onChange={(e) => setForm({ ...form, from: e.target.value })}
                    />
                  </label>
                  <label className="text-xs text-[#9f978f]">
                    Last day (optional)
                    <input
                      className={`${input} mt-1`}
                      type="date"
                      min={form.from}
                      value={form.to}
                      onChange={(e) => setForm({ ...form, to: e.target.value })}
                    />
                  </label>
                </div>
                <input
                  className={input}
                  placeholder="Reason (only you see this)"
                  maxLength={80}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                />
                <button className={goldBtn} disabled={busy || !datesReady || !form.from}>
                  {busy ? "Saving…" : "Block these days"}
                </button>
              </form>
              <p className="text-xs text-[#9f978f]">
                Clients can&apos;t pick a blocked day. Bookings that already exist are not touched;
                they are listed below so you can move or cancel them.
              </p>
            </div>

            {dates.length > 0 && (
              <div className={`${card} space-y-3`}>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d6b36a]">
                  Upcoming days off
                </p>
                {dates.map((d) => (
                  <div
                    key={d.date}
                    className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {niceDate(d.date)}
                        {d.reason ? (
                          <span className="font-normal text-[#9f978f]"> · {d.reason}</span>
                        ) : null}
                      </p>
                      <button
                        className={ghostBtn}
                        disabled={busy}
                        onClick={() => removeDay(d.date)}
                      >
                        Re-open
                      </button>
                    </div>
                    {d.bookings.length > 0 && (
                      <p className="mt-2 rounded-lg bg-[#3a1d1d] p-2 text-xs text-[#e39a96]">
                        ⚠ Already booked:{" "}
                        {d.bookings.map((b) => `${b.name} ${b.start}`).join(", ")}. Move or cancel
                        these on the{" "}
                        <Link href="/admin" className="underline">
                          Bookings page
                        </Link>
                        .
                      </p>
                    )}
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
