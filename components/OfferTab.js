"use client";

import { OPEN_EVENT } from "./WelcomePopup";

export default function OfferTab() {
  function openPopup() {
    window.dispatchEvent(new Event(OPEN_EVENT));
  }

  return (
    <button
      type="button"
      onClick={openPopup}
      aria-label="View welcome offer and announcements"
      className="fixed bottom-5 left-5 z-40 flex items-center gap-2 bg-gold text-ink pl-3.5 pr-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg hover:bg-gold-bright transition-colors"
    >
      <span className="text-sm">🎁</span>
      Offer
    </button>
  );
}
