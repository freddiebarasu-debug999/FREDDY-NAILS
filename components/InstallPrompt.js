"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "fn-install-dismissed";
const DISMISS_DAYS = 14;

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function recentlyDismissed() {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return t && Date.now() - t < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const ua = window.navigator.userAgent || "";
    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (ua.includes("Mac") && "ontouchend" in document);
    setIsIOS(ios);

    let timer;
    const reveal = () => {
      timer = setTimeout(() => setVisible(true), 4000);
    };

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferred(e);
      reveal();
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // iPhone/iPad never fire beforeinstallprompt, so show our own help.
    if (ios) reveal();

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    setShowIOSHelp(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  };

  const install = async () => {
    if (deferred) {
      deferred.prompt();
      try {
        await deferred.userChoice;
      } catch {}
      setDeferred(null);
      setVisible(false);
    } else if (isIOS) {
      setShowIOSHelp(true);
    }
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install the Freddy Nails app"
      className="fixed bottom-3 left-3 right-20 z-40 rounded-2xl border border-gold/40 bg-ink/95 p-4 text-nude shadow-2xl backdrop-blur sm:right-auto sm:max-w-sm"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Close"
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-nude/70 hover:text-nude"
      >
        ×
      </button>

      <div className="flex items-center gap-3 pr-6">
        <img
          src="/icon-192.png"
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 rounded-xl"
        />
        <div>
          <p className="font-serif text-base leading-tight text-gold-bright">
            Get the Freddy Nails app
          </p>
          <p className="text-xs text-nude/80">
            Book faster, right from your home screen.
          </p>
        </div>
      </div>

      {showIOSHelp ? (
        <p className="mt-3 text-xs leading-relaxed text-nude/90">
          Tap the <strong>Share</strong> button in Safari (the square with an
          arrow), then choose <strong>Add to Home Screen</strong>.
        </p>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={install}
            className="rounded-full bg-gold px-4 py-2 text-xs font-semibold text-ink hover:bg-gold-bright"
          >
            Install app
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="px-2 py-2 text-xs text-nude/70 hover:text-nude"
          >
            Not now
          </button>
        </div>
      )}
    </div>
  );
}
