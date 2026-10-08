"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

async function authFetch(body, method = "POST") {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Please log in again.");
  const res = await fetch("/api/account/notifications", {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export default function ReminderSettings() {
  const [loading, setLoading] = useState(true);
  const [supported, setSupported] = useState(true);
  const [needsInstall, setNeedsInstall] = useState(false);
  const [serverReady, setServerReady] = useState(true);
  const [publicKey, setPublicKey] = useState("");
  const [pushOn, setPushOn] = useState(false);
  const [permission, setPermission] = useState("default");
  const [prefs, setPrefs] = useState({ appointment_email: true, rebook_email: false });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const ua = navigator.userAgent || "";
      const ios =
        /iPad|iPhone|iPod/.test(ua) ||
        (ua.includes("Mac") && "ontouchend" in document);
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;

      const hasPush =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!hasPush) {
        if (!cancelled) {
          setSupported(false);
          setNeedsInstall(ios && !standalone);
        }
      } else if (!cancelled) {
        setPermission(Notification.permission);
      }

      try {
        const data = await authFetch(null, "GET");
        if (cancelled) return;
        setServerReady(Boolean(data.pushAvailable));
        setPublicKey(data.publicKey || "");
        setPrefs(data.prefs);

        if (hasPush) {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (!cancelled) {
            setPushOn(Boolean(sub && data.endpoints.includes(sub.endpoint)));
          }
        }
      } catch {
        // Not critical: leave defaults.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function turnOn() {
    setBusy(true);
    setMessage("");
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        setMessage(
          "Notifications are blocked. Allow them for Freddy Nails in your phone or browser settings, then try again."
        );
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }
      await authFetch({ action: "subscribe", subscription: sub.toJSON() });
      setPushOn(true);
      setMessage("Notifications are on for this device.");
    } catch (err) {
      setMessage(err?.message || "Could not turn on notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setMessage("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await authFetch({ action: "unsubscribe", endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setPushOn(false);
      setMessage("Notifications are off for this device.");
    } catch (err) {
      setMessage(err?.message || "Could not turn off notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setMessage("");
    try {
      const data = await authFetch({ action: "test" });
      setMessage(
        data.delivered > 0
          ? "Test sent. Check your notifications."
          : "Nothing was delivered. Try turning notifications off and on again."
      );
    } catch (err) {
      setMessage(err?.message || "Could not send the test.");
    } finally {
      setBusy(false);
    }
  }

  async function savePrefs(next) {
    const previous = prefs;
    setPrefs(next);
    try {
      await authFetch({ action: "prefs", ...next });
    } catch (err) {
      setPrefs(previous);
      setMessage(err?.message || "Could not save your choice.");
    }
  }

  const pushUsable = supported && serverReady && Boolean(publicKey);

  return (
    <section
      aria-labelledby="reminders-title"
      className="mt-7 rounded-[20px] border border-[#d6b36a]/20 bg-white/[0.03] p-5 md:p-6"
    >
      <p className="text-[0.72rem] font-bold tracking-[0.22em] uppercase text-[#d6b36a]">
        Reminders
      </p>
      <h2 id="reminders-title" className="mt-2 font-serif text-xl text-[#f4eee6]">
        Never miss your nails
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-[#c9c0b6]">
        Get a reminder the day before your appointment, and a nudge when it&apos;s
        time to book your next set.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-[#9f978f]">Loading…</p>
      ) : (
        <div className="mt-5 space-y-5">
          {/* Phone notifications */}
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-sm font-semibold text-[#f4eee6]">Phone notifications</p>

            {pushUsable ? (
              <>
                <p className="mt-1 text-xs text-[#9f978f]">
                  {pushOn
                    ? "On for this device."
                    : "Get alerts straight to this device."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {pushOn ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={sendTest}
                        className="rounded-full border border-[#d6b36a]/60 px-4 py-2 text-xs font-semibold text-[#d6b36a] disabled:opacity-50"
                      >
                        Send a test
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={turnOff}
                        className="rounded-full px-4 py-2 text-xs text-[#c9c0b6] underline disabled:opacity-50"
                      >
                        Turn off
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={busy || permission === "denied"}
                      onClick={turnOn}
                      className="rounded-full bg-[#ad8a4e] px-5 py-2 text-xs font-semibold text-[#0c0b0a] disabled:opacity-50"
                    >
                      Turn on notifications
                    </button>
                  )}
                </div>
                {permission === "denied" && !pushOn && (
                  <p className="mt-2 text-xs text-[#e6b8a8]">
                    Notifications are blocked for this site. Allow them in your
                    phone or browser settings, then come back.
                  </p>
                )}
              </>
            ) : needsInstall ? (
              <p className="mt-1 text-xs leading-relaxed text-[#9f978f]">
                On iPhone, notifications work once Freddy Nails is on your Home
                Screen. In Safari tap <strong>Share</strong>, then{" "}
                <strong>Add to Home Screen</strong>, open the app from there and
                come back to this page.
              </p>
            ) : !supported ? (
              <p className="mt-1 text-xs text-[#9f978f]">
                This browser doesn&apos;t support notifications. Email reminders
                below still work.
              </p>
            ) : (
              <p className="mt-1 text-xs text-[#9f978f]">
                Phone notifications aren&apos;t available right now.
              </p>
            )}
          </div>

          {/* Email */}
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-sm font-semibold text-[#f4eee6]">Email reminders</p>

            <label className="mt-3 flex items-start gap-3 text-sm text-[#c9c0b6]">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[#d6b36a]"
                checked={prefs.appointment_email}
                onChange={(e) =>
                  savePrefs({ ...prefs, appointment_email: e.target.checked })
                }
              />
              <span>Remind me the day before my appointment</span>
            </label>

            <label className="mt-3 flex items-start gap-3 text-sm text-[#c9c0b6]">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[#d6b36a]"
                checked={prefs.rebook_email}
                onChange={(e) =>
                  savePrefs({ ...prefs, rebook_email: e.target.checked })
                }
              />
              <span>Let me know when it&apos;s time to rebook</span>
            </label>
          </div>

          {message && (
            <p role="status" className="text-xs text-[#d6b36a]">
              {message}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
