"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Thin gold bar across the top of the public site. The owner types the
// message in the dashboard (Banner & days off).
export default function AnnouncementBanner() {
  const pathname = usePathname();
  const [message, setMessage] = useState("");
  const [hidden, setHidden] = useState(false);
  const isAdmin = !!pathname && pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return undefined;
    let cancelled = false;
    fetch("/api/announcement", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.message) {
          if (!cancelled) setMessage("");
          return;
        }
        let dismissed = false;
        try {
          dismissed = window.sessionStorage.getItem("fn-banner-dismissed") === data.message;
        } catch {
          dismissed = false;
        }
        setHidden(dismissed);
        setMessage(data.message);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAdmin, pathname]);

  if (isAdmin || !message || hidden) return null;

  function dismiss() {
    try {
      window.sessionStorage.setItem("fn-banner-dismissed", message);
    } catch {
      // ignore
    }
    setHidden(true);
  }

  return (
    <div role="status" className="relative z-[60] bg-[#d6b36a] px-10 py-2 text-center text-xs font-semibold text-[#11100f] sm:text-sm">
      {message}
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 px-1 text-base leading-none text-[#11100f]/70"
      >
        ×
      </button>
    </div>
  );
}
