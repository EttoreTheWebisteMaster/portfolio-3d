"use client";

import { useEffect } from "react";

import { play } from "@/lib/sound";

const SELECTOR =
  ".btn-primary, .btn-secondary, .btn-ink, .btn-timer, .projects-next";

/** One delegated listener for every button: feeds the cursor into CSS (--mx/--my light) and ticks on click. */
export default function ButtonFx() {
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const el = (e.target as Element | null)?.closest<HTMLElement>(SELECTOR);
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };

    const click = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest(SELECTOR)) play("pop");
    };

    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("click", click);
    return () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("click", click);
    };
  }, []);

  return null;
}
