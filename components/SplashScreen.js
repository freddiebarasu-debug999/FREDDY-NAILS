"use client";

import { useEffect } from "react";

/*
 * Animated welcome screen shown while the site loads.
 *
 * - It is part of the server-rendered page, so it appears immediately
 *   (no white flash) and the animation starts before the rest of the
 *   site has finished loading.
 * - It shows once per visit/session. Moving between pages does not show it again.
 * - It fades away smoothly as soon as the page has loaded (minimum
 *   display time keeps it from flashing on fast connections).
 * - If JavaScript ever fails, a CSS failsafe hides it after a few seconds.
 */

const MIN_VISIBLE_MS = 2400;

const css = `
#app-splash {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.6rem;
  background:
    radial-gradient(ellipse 60% 45% at 50% 42%, rgba(214,179,106,0.14), transparent 70%),
    #0c0b0a;
  opacity: 1;
  visibility: visible;
  transition: opacity 0.7s ease, visibility 0.7s ease;
  animation: splash-failsafe 0.6s ease 5s forwards;
}
#app-splash.is-leaving {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}
html[data-splash="off"] #app-splash {
  display: none;
}
#app-splash .splash-logo-wrap {
  position: relative;
  width: 116px;
  height: 116px;
  animation: splash-pop 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
#app-splash .splash-logo {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 9999px;
  box-shadow: 0 0 40px rgba(214,179,106,0.25);
}
#app-splash .splash-ring {
  position: absolute;
  inset: -10px;
  border-radius: 9999px;
  border: 1.5px solid rgba(214,179,106,0.55);
  animation: splash-pulse 2s ease-out 0.6s infinite;
}
#app-splash .splash-ring.second {
  animation-delay: 1.5s;
}
#app-splash .splash-name {
  font-family: var(--font-fraunces), Georgia, serif;
  font-size: 0.8rem;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: #d6b36a;
  opacity: 0;
  animation: splash-fade 0.9s ease 0.4s forwards;
}
#app-splash .splash-slogan {
  margin-top: -0.9rem;
  font-family: var(--font-fraunces), Georgia, serif;
  font-style: italic;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  color: #f4eee6;
  opacity: 0;
  transform: translateY(14px);
  animation: splash-slide-up 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) 1s forwards;
}
#app-splash .splash-bar {
  width: 96px;
  height: 2px;
  border-radius: 2px;
  overflow: hidden;
  background: rgba(255,255,255,0.08);
  opacity: 0;
  animation: splash-fade 0.6s ease 1.3s forwards;
}
#app-splash .splash-bar::after {
  content: "";
  display: block;
  width: 45%;
  height: 100%;
  background: linear-gradient(90deg, transparent, #d6b36a, transparent);
  animation: splash-slide 1.3s ease-in-out infinite;
}
@keyframes splash-pop {
  0% { opacity: 0; transform: scale(0.82); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes splash-pulse {
  0% { opacity: 0.7; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.5); }
}
@keyframes splash-fade {
  to { opacity: 1; }
}
@keyframes splash-slide-up {
  to { opacity: 0.85; transform: translateY(0); }
}
@keyframes splash-slide {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(260%); }
}
@keyframes splash-failsafe {
  to { opacity: 0; visibility: hidden; pointer-events: none; }
}
@media (prefers-reduced-motion: reduce) {
  #app-splash .splash-ring,
  #app-splash .splash-bar::after {
    animation: none;
  }
}
`;

export default function SplashScreen() {
  useEffect(() => {
    const el = document.getElementById("app-splash");

    if (!el) return;

    const shownAt = Date.now();
    let removeTimer;
    let leaveTimer;

    function leave() {
      const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt));

      leaveTimer = setTimeout(() => {
        el.classList.add("is-leaving");
        removeTimer = setTimeout(() => el.remove(), 800);
      }, wait);
    }

    if (document.readyState === "complete") {
      leave();
    } else {
      window.addEventListener("load", leave, { once: true });
    }

    return () => {
      window.removeEventListener("load", leave);
      clearTimeout(leaveTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <div id="app-splash" aria-hidden="true">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="splash-logo-wrap">
        <span className="splash-ring" />
        <span className="splash-ring second" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="splash-logo"
          src="/icon-192.png"
          alt=""
          width="116"
          height="116"
        />
      </div>

      <span className="splash-name">Freddy Nails</span>

      <span className="splash-slogan">Crafted to Perfection</span>

      <span className="splash-bar" />
    </div>
  );
}
