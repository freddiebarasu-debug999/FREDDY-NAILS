"use client";
import { useEffect, useState } from "react";
export default function CalendarAdminPage() {
  const [status, setStatus] = useState("checking");
  const [email, setEmail] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "1") {
      setStatus("connected");
      window.history.replaceState({}, "", "/admin/calendar");
      return;
    }
    if (params.get("error")) {
      setStatus("error");
      window.history.replaceState({}, "", "/admin/calendar");
      return;
    }
    checkConnection();
  }, []);
  async function checkConnection() {
    try {
      const response = await fetch(
        "/api/google-calendar/status",
        {
          cache: "no-store",
        }
      );
      const data = await response.json();
      if (data.connected) {
        setStatus("connected");
        setEmail(data.email || "");
      } else {
        setStatus("disconnected");
      }
    } catch (error) {
      console.error("Calendar status check failed:", error);
      setStatus("error");
    }
  }
  function connectCalendar() {
    window.location.href = "/api/google-calendar/connect";
  }
  return (
    <main className="min-h-screen bg-[#11100f] text-[#f4eee6]">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <a
          href="/"
          className="inline-block mb-10 text-sm font-semibold text-[#d6b36a] hover:text-[#f4eee6] transition-colors"
        >
          ← Back to Freddy Nails
        </a>
        <div className="border-b border-[#d6b36a]/20 pb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#d6b36a]">
            Freddy Nails
          </p>
          <h1 className="font-serif text-4xl md:text-5xl">
            Google Calendar
          </h1>
          <p className="mt-4 max-w-2xl text-[#c9c0b6]">
            Connect your Google Calendar so confirmed Freddy Nails
            appointments can be managed automatically.
          </p>
        </div>
        <section className="mt-10 rounded-xl border border-[#d6b36a]/20 bg-[#181614] p-6 md:p-8">
          {status === "checking" && (
            <p className="text-[#c9c0b6]">
              Checking calendar connection…
            </p>
          )}
          {status === "disconnected" && (
            <>
              <h2 className="font-serif text-2xl">
                Calendar not connected
              </h2>
              <p className="mt-3 text-[#c9c0b6]">
                Connect the Google Calendar used by Freddy Nails. Once
                connected, the website will be able to create and manage
                appointment events automatically.
              </p>
              <button
                type="button"
                onClick={connectCalendar}
                className="mt-7 bg-[#d6b36a] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#11100f] transition-colors hover:bg-[#ad8a4e]"
              >
                Connect Google Calendar
              </button>
            </>
          )}
          {status === "connected" && (
            <>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d6b36a] text-[#11100f]">
                  ✓
                </span>
                <h2 className="font-serif text-2xl">
                  Google Calendar connected
                </h2>
              </div>
              <p className="mt-4 text-[#c9c0b6]">
                Freddy Nails is connected to your Google Calendar.
              </p>
              {email && (
                <p className="mt-3 text-sm text-[#d6b36a]">
                  Connected calendar: {email}
                </p>
              )}
              <div className="mt-7 border-t border-white/[0.08] pt-6">
                <p className="text-sm leading-6 text-[#c9c0b6]">
                  Once the booking integration is connected, confirmed
                  appointments will automatically appear on your calendar.
                  Cancellations and appointment changes can also be handled
                  automatically.
                </p>
              </div>
            </>
          )}
          {status === "error" && (
            <>
              <h2 className="font-serif text-2xl">
                Something went wrong
              </h2>
              <p className="mt-3 text-[#c9c0b6]">
                We couldn't verify the Google Calendar connection.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatus("checking");
                  checkConnection();
                }}
                className="mt-7 border border-[#d6b36a]/40 px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#d6b36a] transition-colors hover:border-[#d6b36a] hover:text-[#f4eee6]"
              >
                Try again
              </button>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
