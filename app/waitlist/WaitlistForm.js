"use client";

import { useState } from "react";

const input =
  "w-full rounded-lg border border-white/15 bg-[#181614] px-3 py-3 text-sm text-[#f4eee6] outline-none focus:border-[#d6b36a]";

export default function WaitlistForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    service: "",
    wanted_date: "",
    flexible: "",
    notes: "",
    website: "", // hidden spam trap
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function set(patch) {
    setForm((f) => ({ ...f, ...patch }));
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mt-8 rounded-xl border border-[#d6b36a]/30 bg-[#181614] p-6">
        <p className="font-serif text-2xl">You&apos;re on the list ✨</p>
        <p className="mt-2 text-[#c9c0b6]">
          We&apos;ll email you the moment a slot opens. Slots go to whoever books first, so keep an eye on your inbox.
        </p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" });

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <label className="block text-sm text-[#c9c0b6]">Your name
        <input className={`${input} mt-1`} value={form.name} maxLength={60} required onChange={(e) => set({ name: e.target.value })} />
      </label>
      <label className="block text-sm text-[#c9c0b6]">WhatsApp number
        <input className={`${input} mt-1`} type="tel" inputMode="tel" placeholder="e.g. 082 123 4567" value={form.phone} maxLength={25} required onChange={(e) => set({ phone: e.target.value })} />
      </label>
      <label className="block text-sm text-[#c9c0b6]">Email address (we&apos;ll email you the moment a slot opens)
        <input className={`${input} mt-1`} type="email" inputMode="email" placeholder="you@example.com" value={form.email} maxLength={120} required onChange={(e) => set({ email: e.target.value })} />
      </label>
      <label className="block text-sm text-[#c9c0b6]">What are you after? (optional)
        <input className={`${input} mt-1`} placeholder="e.g. Acrylic short, French tips" value={form.service} maxLength={120} onChange={(e) => set({ service: e.target.value })} />
      </label>
      <label className="block text-sm text-[#c9c0b6]">Day you wanted (optional)
        <input className={`${input} mt-1`} type="date" min={today} value={form.wanted_date} onChange={(e) => set({ wanted_date: e.target.value })} />
      </label>
      <label className="block text-sm text-[#c9c0b6]">Other days or times that work (optional)
        <input className={`${input} mt-1`} placeholder="e.g. Saturday mornings, any weekday after 3" value={form.flexible} maxLength={200} onChange={(e) => set({ flexible: e.target.value })} />
      </label>

      {/* Hidden spam trap: leave empty */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
        <label>Website
          <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set({ website: e.target.value })} />
        </label>
      </div>

      {error && <p className="rounded-lg bg-[#3a1d1d] p-3 text-sm text-[#e39a96]">{error}</p>}

      <button disabled={busy} className="w-full rounded-lg bg-[#d6b36a] px-4 py-3 text-sm font-bold text-[#11100f] disabled:opacity-50">
        {busy ? "Joining…" : "Join the waitlist"}
      </button>
      <p className="text-xs text-[#9f978f]">We only use your details to message you about a slot opening.</p>
    </form>
  );
}
