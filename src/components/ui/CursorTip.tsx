"use client";

import { useRef } from "react";

import { gsap, useGSAP } from "@/lib/gsap";

/** A small label that trails the cursor. Visibility is driven by CSS (`html[data-rob-hover]`), so it costs no re-renders. */
export default function CursorTip({ label }: Readonly<{ label: string }>) {
  const el = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const node = el.current;
      if (!node) return;
      const x = gsap.quickTo(node, "x", { duration: 0.25, ease: "power3.out" });
      const y = gsap.quickTo(node, "y", { duration: 0.25, ease: "power3.out" });
      const move = (e: PointerEvent) => {
        x(e.clientX + 16);
        y(e.clientY + 18);
      };
      window.addEventListener("pointermove", move, { passive: true });
      return () => window.removeEventListener("pointermove", move);
    },
    { scope: el }
  );

  return (
    <div ref={el} className="cursor-tip" aria-hidden>
      {label}
    </div>
  );
}
