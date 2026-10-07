"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Nail Muse (the real chatbot) lives in ChatBotCore.js. It is large, so it is
// loaded only after the page is visible and the browser is idle. Every page
// keeps importing "./ChatBot" exactly as before.
const ChatBotCore = dynamic(() => import("./ChatBotCore"), { ssr: false });

export default function ChatBot() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let idleId;
    let timeoutId;

    const start = () => {
      if (cancelled) return;
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(() => !cancelled && setReady(true), {
          timeout: 3000,
        });
      } else {
        timeoutId = setTimeout(() => !cancelled && setReady(true), 1500);
      }
    };

    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", start);
      if (idleId && "cancelIdleCallback" in window) window.cancelIdleCallback(idleId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return ready ? <ChatBotCore /> : null;
}
