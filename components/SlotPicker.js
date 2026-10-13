"use client";

import { useEffect, useState } from "react";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MAX_MONTHS_AHEAD = 6;

function pad(n) {
  return String(n).padStart(2, "0");
}

function addMonths(ym, delta) {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7)) - 1 + delta;
  const d = new Date(y, m, 1);
  return d.getFullYear() + "-" + pad(d.getMonth() + 1);
}

function prettyTime(t) {
  const parts = String(t).split(":");
  const hour = Number(parts[0]);
  const suffix = hour >= 12 ? "pm" : "am";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return h12 + ":" + (parts[1] || "00") + " " + suffix;
}

function prettyDate(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SlotPicker({
  date,
  time,
  times,
  loading,
  duration,
  minDate,
  onDate,
  onTime,
}) {
  const startMonth = (date || minDate).slice(0, 7);
  const [view, setView] = useState(startMonth);
  const [days, setDays] = useState(null); // { "2026-10-14": 12, ... }
  const [monthLoading, setMonthLoading] = useState(false);

  const minMonth = minDate.slice(0, 7);
  const maxMonth = addMonths(minMonth, MAX_MONTHS_AHEAD);

  // Load which days are free or fully booked for the month on screen.
  useEffect(() => {
    if (!duration) {
      setDays(null);
      return;
    }
    let cancelled = false;
    setMonthLoading(true);

    fetch(
      "/api/availability/month?month=" +
        encodeURIComponent(view) +
        "&duration=" +
        encodeURIComponent(duration),
      { cache: "no-store" }
    )
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (cancelled) return;
        setDays(result.ok && result.data && result.data.days ? result.data.days : null);
      })
      .catch(function () {
        if (!cancelled) setDays(null);
      })
      .finally(function () {
        if (!cancelled) setMonthLoading(false);
      });

    return function () {
      cancelled = true;
    };
  }, [view, duration]);

  // If a date is picked from elsewhere, show its month.
  useEffect(() => {
    if (date) setView(date.slice(0, 7));
  }, [date]);

  const year = Number(view.slice(0, 4));
  const monthIndex = Number(view.slice(5, 7)) - 1;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7; // Monday first

  const cells = [];
  for (let i = 0; i < offset; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  const morning = (times || []).filter(function (t) {
    return t < "12:00";
  });
  const afternoon = (times || []).filter(function (t) {
    return t >= "12:00";
  });

  function slotButton(t) {
    const selected = time === t;
    return (
      <button
        key={t}
        type="button"
        aria-pressed={selected}
        onClick={function () {
          onTime(t);
        }}
        className={
          "rounded-md border px-2 py-2.5 text-xs font-semibold transition-all duration-150 active:scale-95 " +
          (selected
            ? "border-[#d6b36a] bg-[#d6b36a] text-[#11100f]"
            : "border-white/[0.12] bg-[#181614] text-[#f4eee6] hover:border-[#d6b36a]/60")
        }
      >
        {prettyTime(t)}
      </button>
    );
  }

  return (
    <div className="mt-7 rounded-xl border border-white/[0.08] bg-[#141210] p-4 sm:p-5">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <p className="font-serif text-lg text-[#f4eee6]">
          {MONTH_NAMES[monthIndex]} {year}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Previous month"
            disabled={view <= minMonth}
            onClick={function () {
              setView(addMonths(view, -1));
            }}
            className="grid h-9 w-9 place-items-center rounded-full text-xl text-[#c9c0b6] hover:bg-white/[0.06] disabled:opacity-30"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next month"
            disabled={view >= maxMonth}
            onClick={function () {
              setView(addMonths(view, 1));
            }}
            className="grid h-9 w-9 place-items-center rounded-full text-xl text-[#c9c0b6] hover:bg-white/[0.06] disabled:opacity-30"
          >
            ›
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="mt-3 grid grid-cols-7 text-center text-[0.68rem] font-bold uppercase text-[#8f877e]">
        {WEEKDAYS.map(function (w, i) {
          return <span key={i}>{w}</span>;
        })}
      </div>

      {/* Days */}
      <div className="mt-1 grid grid-cols-7 gap-y-1">
        {cells.map(function (day, i) {
          if (day === null) return <span key={"b" + i} />;

          const ds = view + "-" + pad(day);
          const isPast = ds < minDate;
          const isSunday = new Date(ds + "T12:00:00").getDay() === 0;
          const free = days && days[ds] !== undefined ? days[ds] : null;
          const booked = free === 0;
          const unavailable = isPast || isSunday || booked;
          const selected = date === ds;
          const isToday = ds === minDate;

          let bar = "transparent";
          if (!isPast && !isSunday && free !== null) {
            bar = free > 0 ? "#3fae5f" : "#d9534f";
          }

          return (
            <button
              key={ds}
              type="button"
              disabled={unavailable}
              aria-pressed={selected}
              aria-label={
                prettyDate(ds) +
                (isSunday ? ", closed" : booked ? ", fully booked" : free ? ", available" : "")
              }
              onClick={function () {
                onDate(ds);
              }}
              className={
                "relative mx-auto flex h-11 w-11 flex-col items-center justify-center rounded-full text-sm transition-all duration-150 " +
                (selected
                  ? "border-2 border-[#d6b36a] bg-[#d6b36a]/15 font-bold text-[#f4eee6]"
                  : unavailable
                  ? "cursor-not-allowed text-[#5f5951]"
                  : "text-[#f4eee6] hover:bg-white/[0.07] active:scale-90") +
                (isToday && !selected ? " ring-1 ring-[#d6b36a]/40" : "")
              }
            >
              {day}
              <span
                aria-hidden="true"
                className="mt-0.5 block h-[3px] w-4 rounded-full"
                style={{ background: bar }}
              />
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.68rem] text-[#9f978f]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-[3px] w-4 rounded-full bg-[#3fae5f]" /> Available
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-[3px] w-4 rounded-full bg-[#d9534f]" /> Fully booked
        </span>
        {monthLoading && <span className="italic">Checking the calendar…</span>}
        {!duration && (
          <span className="italic">Choose your service to see which days are free.</span>
        )}
      </div>

      {/* Times */}
      <div className="mt-5 border-t border-white/[0.08] pt-4">
        {!date ? (
          <p className="text-sm text-[#9f978f]">Choose a day to see the available times.</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-[#f4eee6]">
              Available on {prettyDate(date)}{" "}
              <span className="text-xs font-normal text-[#8f877e]">(SAST)</span>
            </p>

            {loading ? (
              <p className="mt-3 text-sm italic text-[#9f978f]">Checking availability…</p>
            ) : (times || []).length === 0 ? (
              <p className="mt-3 text-sm italic text-[#9f978f]">
                All booked on this day. Please choose another date.
              </p>
            ) : (
              <div className="mt-3 space-y-4">
                {morning.length > 0 && (
                  <div>
                    <p className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#d6b36a]">
                      Morning
                    </p>
                    <div className="grid grid-cols-3 gap-2">{morning.map(slotButton)}</div>
                  </div>
                )}
                {afternoon.length > 0 && (
                  <div>
                    <p className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#d6b36a]">
                      Afternoon
                    </p>
                    <div className="grid grid-cols-3 gap-2">{afternoon.map(slotButton)}</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
