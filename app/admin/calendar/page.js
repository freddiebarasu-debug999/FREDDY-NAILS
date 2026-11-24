"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function pad(n) {
  return String(n).padStart(2, "0");
}

function prettyTime(t) {
  const [h, m] = String(t).split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m || 0)} ${suffix}`;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function api(path) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const response = await fetch(path, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${session?.access_token || ""}`,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

export default function CalendarAdminPage() {
  const [date, setDate] = useState(todayStr);
  const [duration, setDuration] = useState("60");
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gStatus, setGStatus] = useState("checking");
  const [gEmail, setGEmail] = useState("");

  const loadDay = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const avail = await fetch(
        `/api/availability?date=${encodeURIComponent(date)}&duration=${encodeURIComponent(duration)}`,
        { cache: "no-store" }
      ).then((r) => r.json());

      setSlots(
        avail.allSlots ||
          (avail.availableTimes || []).map((t) => ({ time: t, available: true }))
      );

      try {
        const data = await api(`/api/admin/bookings?date=${encodeURIComponent(date)}`);
        const list = data.bookings || data.appointments || data || [];
        setBookings(Array.isArray(list) ? list : []);
      } catch {
        setBookings([]);
      }
    } catch (e) {
      setError(e.message || "Could not load day");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [date, duration]);

  useEffect(() => {
    loadDay();
  }, [loadDay]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "1") {
      setGStatus("connected");
      window.history.replaceState({}, "", "/admin/calendar");
      return;
    }
    if (params.get("error")) {
      setGStatus("error");
      window.history.replaceState({}, "", "/admin/calendar");
      return;
    }
    fetch("/api/google-calendar/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.connected) {
          setGStatus("connected");
          setGEmail(data.email || "");
        } else {
          setGStatus("disconnected");
        }
      })
      .catch(() => setGStatus("error"));
  }, []);

  const bookedCount = slots.filter((s) => !s.available).length;
  const freeCount = slots.filter((s) => s.available).length;

  return (
    <div className="space-y-6 text-[#f4eee6]">
      <div>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#d6b36a]">
          Owner
        </p>
        <h1 className="mt-1 font-serif text-3xl">Calendar</h1>
        <p className="mt-2 text-sm text-[#a79a87]">
          See available slots and what is already booked for any day.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#c9c0b6]">
            Date
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-[#d6b36a]/30 bg-[#181614] px-3 py-2 text-sm text-[#f4eee6] outline-none focus:border-[#d6b36a]"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#c9c0b6]">
            Appointment duration
          </span>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="rounded-lg border border-[#d6b36a]/30 bg-[#181614] px-3 py-2 text-sm text-[#f4eee6] outline-none focus:border-[#d6b36a]"
          >
            {Array.from({ length: 59 }, (_, index) => 10 + index * 5).map((minutes) => (
              <option key={minutes} value={String(minutes)}>{minutes} minutes</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setDate(todayStr())}
          className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#c9c0b6] hover:border-[#d6b36a]/50 hover:text-[#d6b36a]"
        >
          Today
        </button>
        <button
          type="button"
          onClick={loadDay}
          className="rounded-lg bg-[#d6b36a] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#11100f]"
        >
          Refresh
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-xl">Day slots</h2>
          <div className="text-right">
            <p className="text-xs text-[#9f978f]">
              {loading ? "Loading…" : `${freeCount} free · ${bookedCount} booked / blocked`}
            </p>
            <p className="mt-1 text-[0.68rem] text-[#8f877e]">Availability for a {duration}-minute appointment</p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-[#a79a87]">Loading slots…</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-[#a79a87]">No slots for this day (closed or unavailable).</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {slots.map((s) => (
              <div
                key={s.time}
                className={
                  "rounded-lg border px-2 py-3 text-center text-xs font-semibold " +
                  (s.available
                    ? "border-[#3fae5f]/40 bg-[#3fae5f]/10 text-[#8fdfa8]"
                    : "border-white/[0.06] bg-[#12110f] text-[#5c5650] line-through opacity-70")
                }
                title={s.available ? "Available" : "Booked / blocked"}
              >
                {prettyTime(s.time)}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-4 text-[0.7rem] text-[#9f978f]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#3fae5f]/80" /> Available
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#3a3835]" /> Booked / blocked (greyed)
          </span>
        </div>
      </section>

      {bookings.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-3 font-serif text-xl">Bookings this day</h2>
          <ul className="space-y-2">
            {bookings.map((b) => (
              <li
                key={b.id || `${b.start_time}-${b.customer_name}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#181614] px-3 py-2.5 text-sm"
              >
                <span className="font-medium text-[#f4eee6]">
                  {b.customer_name || "Client"}
                </span>
                <span className="text-[#d6b36a]">
                  {prettyTime(b.start_time)}
                  {b.end_time ? ` – ${prettyTime(b.end_time)}` : ""}
                </span>
                <span className="text-xs text-[#a79a87]">
                  {(b.clients && b.clients[0] && b.clients.map((c) => (c.services || []).join(" + ")).filter(Boolean).join(" | ")) || b.service_name || ""}
                  {b.booking_status ? ` · ${b.booking_status}` : ""}
                </span>
                {b.slotRecordMissing && (
                  <span className="w-full text-xs text-[#e8c36a]">
                    ⚠ This booking had no time-slot record. The site now blocks its time anyway.
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-[#141210] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg">Google Calendar sync</h2>
            <p className="mt-1 text-xs text-[#9f978f]">
              Optional — auto-create events when bookings are confirmed.
            </p>
          </div>
          {gStatus === "checking" && (
            <span className="text-xs text-[#a79a87]">Checking…</span>
          )}
          {gStatus === "connected" && (
            <span className="rounded-full bg-[#3fae5f]/15 px-3 py-1 text-xs font-semibold text-[#8fdfa8]">
              Connected{gEmail ? ` · ${gEmail}` : ""}
            </span>
          )}
          {gStatus === "disconnected" && (
            <button
              type="button"
              onClick={() => {
                window.location.href = "/api/google-calendar/connect";
              }}
              className="rounded-lg border border-[#d6b36a]/40 px-3 py-1.5 text-xs font-bold text-[#d6b36a] hover:bg-[#d6b36a]/10"
            >
              Connect Google Calendar
            </button>
          )}
          {gStatus === "error" && (
            <span className="text-xs text-[#e39a96]">Could not check status</span>
          )}
        </div>
        <p className="mt-3 text-xs text-[#6e675f]">
          <Link href="/" className="text-[#d6b36a] hover:underline">
            ← Back to site
          </Link>
        </p>
      </section>
    </div>
  );
}
