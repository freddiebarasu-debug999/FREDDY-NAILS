"use client";

import { useEffect, useRef, useState } from "react";

export default function Reveal({
  children,
  delay = 0,
  direction = "up",
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Toggle both ways, so the animation replays every time
          // the section scrolls into or out of view — not just once.
          setVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const offset =
    direction === "up"
      ? "translate-y-8"
      : direction === "left"
      ? "-translate-x-8"
      : direction === "right"
      ? "translate-x-8"
      : "translate-y-0";

  return (
    <div
      ref={ref}
      className={`transition-all ease-out duration-700 ${
        visible ? "opacity-100 translate-x-0 translate-y-0" : `opacity-0 ${offset}`
      }`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
