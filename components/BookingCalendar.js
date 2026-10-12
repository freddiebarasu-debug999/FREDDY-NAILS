"use client";

import { useMemo, useState } from "react";

/**
 * Visual month calendar for Freddy Nails booking.
 * Mirrors Fresha / HeyGoldie style: green = bookable, red = closed/past.
 * Sundays are closed. Past dates are disabled.
 */
function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function isSunday(dateString) {
  const d = new Date(`${dateString}T12:00:00`);
  return !Number.isNaN(d.getTime()) && d.getDay() === 0;
}

function isPast(dateString, todayString) {
  return dateString < todayString;
}

function isBookable(dateString, todayString) {
  if (!dateString) return false;
  if (isPast(dateString, todayString)) return false;
  if (isSunday(dateString)) return false;
  return true;
}

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export default function BookingCalendar({
  value = "",
  onChange,
  todayString,
  minDate,
}) {
  const today = todayString || toDateString(new Date());
  const floor = minDate || today;

  const initialMonth = value
    ? startOfMonth(new Date(`${value}T12:00:00`))
    : startOfMonth(new Date(`${today}T12:00:00`));

  const [viewMonth, setViewMonth] = useState(initialMonth);

  const cells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const first = new Date(year, month, 1);
    // Monday-first calendar
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const list = [];
    for (let i = 0; i < startOffset; i += 1) {
      list.push({ type: "empty", key: `e-${i}` });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateString = toDateString(new Date(year, month, day));
      list.push({
        type: "day",
        key: dateString,
        day,
        dateString,
        bookable: isBookable(dateString, floor),
        sunday: isSunday(dateString),
        past: isPast(dateString, floor),
        selected: value === dateString,
        isToday: dateString === today,
      });
    }
    return list;
  }, [viewMonth, value, floor, today]);

  const monthLabel = viewMonth.toLocaleDateString("en-ZA", {
    month: "long",
    year: "numeric",
  });

  function pick(day) {
    if (!day.bookable) return;
    onChange?.(day.dateString);
  }

  return (
    <div className="rounded-xl border border-[#d6b36a]/25 bg-[#181614] p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, -1))}
          className="h-9 w-9 rounded-full border border-white/10 text-[#c9c0b6] hover:border-[#d6b36a]/50 hover:text-[#f4eee6] transition-colors"
          aria-label="Previous month"
        >
          ‹
        </button>
        <p className="font-serif text-lg text-[#f4eee6]">{monthLabel}</p>
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="h-9 w-9 rounded-full border border-white/10 text-[#c9c0b6] hover:border-[#d6b36a]/50 hover:text-[#f4eee6] transition-colors"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((w, i) => (
          <div
            key={`${w}-${i}`}
            className="text-center text-[0.65rem] font-bold tracking-wider uppercase text-[#8f877e] py-1"
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          if (cell.type === "empty") {
            return <div key={cell.key} className="aspect-square" />;
          }

          let tone =
            "text-[#5c564f] cursor-not-allowed border-transparent";
          if (cell.selected) {
            tone =
              "bg-[#d6b36a] text-[#11100f] border-[#d6b36a] font-bold";
          } else if (cell.bookable) {
            tone =
              "text-[#f4eee6] border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 cursor-pointer";
          } else if (cell.sunday || cell.past) {
            tone =
              "text-[#5c564f] border-red-500/20 bg-red-500/[0.06] cursor-not-allowed line-through decoration-red-400/40";
          }

          return (
            <button
              key={cell.key}
              type="button"
              disabled={!cell.bookable}
              onClick={() => pick(cell)}
              className={`aspect-square rounded-lg border text-sm transition-all ${tone} ${
                cell.isToday && !cell.selected
                  ? "ring-1 ring-[#d6b36a]/50"
                  : ""
              }`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-[0.68rem] text-[#9f978f]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/40 border border-emerald-500/50" />
          Available
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#d6b36a]" />
          Selected
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-500/20 border border-red-500/30" />
          Unavailable
        </span>
      </div>

      {value && (
        <p className="mt-3 text-sm text-[#c9c0b6]">
          Selected:{" "}
          <span className="text-[#d6b36a] font-semibold">
            {new Date(`${value}T12:00:00`).toLocaleDateString("en-ZA", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </p>
      )}
    </div>
  );
}
