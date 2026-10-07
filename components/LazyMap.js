"use client";

import { useEffect, useRef, useState } from "react";

// Google Maps iframe is only added to the page when it is near the screen.
export default function LazyMap({ src, title }) {
  const boxRef = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const node = boxRef.current;
    if (!node) return;

    if (!("IntersectionObserver" in window)) {
      setShow(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      className="aspect-[4/3] rounded-sm border border-line overflow-hidden bg-[#141210]"
    >
      {show && (
        <iframe
          src={src}
          width="600"
          height="450"
          style={{ border: 0, width: "100%", height: "100%" }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          title={title}
        />
      )}
    </div>
  );
}
