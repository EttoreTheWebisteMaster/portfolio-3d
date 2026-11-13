"use client";

import { useEffect, useRef, type PointerEvent } from "react";

import { caseState } from "@/lib/caseMotion";
import { scrub } from "@/lib/journey";
import { pad } from "@/lib/pages";

const FPS = 24;
const LENGTH = 90; // seconds of "film" the full page scroll maps to
/** Pointer travel, in px, for a drag across the whole site: long, so a page takes a real drag to reach. */
const DRAG_RANGE = 440;

/** Scroll-driven timecode (TC HH:MM:SS:FF); the track tick shows scroll position. Dragging the track scrubs the whole site by hand, and on release it settles on the nearest page. A pointer handle only: the keyboard has the page keys, the nav and the bottom bar. */
export default function Timecode() {
  const root = useRef<HTMLSpanElement>(null);
  const hms = useRef<HTMLSpanElement>(null);
  const ff = useRef<HTMLSpanElement>(null);
  const track = useRef<HTMLSpanElement>(null);
  const drag = useRef<{ x: number; progress: number } | null>(null);

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const progress = max > 0 ? Math.min(scrollY / max, 1) : 0;
      const frames = Math.round(progress * LENGTH * FPS);
      const s = Math.floor(frames / FPS);
      if (hms.current && ff.current) {
        hms.current.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
        ff.current.textContent = `:${pad(frames % FPS)}`;
      }
      root.current?.style.setProperty("--scroll", String(progress));
    };
    update();
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    return () => {
      removeEventListener("scroll", update);
      removeEventListener("resize", update);
    };
  }, []);

  // Gone mid-drag: the closed hand must not be left on the screen.
  useEffect(
    () => () => {
      document.documentElement.removeAttribute("data-scrub");
    },
    []
  );

  const max = () => document.documentElement.scrollHeight - innerHeight;
  const down = (e: PointerEvent<HTMLSpanElement>) => {
    if (e.button !== 0) return;
    // A case study open: the grab closes it, and the drag carries on over the way out.
    if (caseState.open && !caseState.closing) caseState.close();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, progress: scrollY / (max() || 1) };
    scrub.start();
    document.documentElement.toggleAttribute("data-scrub", true);
  };
  const move = (e: PointerEvent<HTMLSpanElement>) => {
    const start = drag.current;
    if (!start) return;
    const progress = Math.min(
      Math.max(start.progress + (e.clientX - start.x) / DRAG_RANGE, 0),
      1
    );
    scrollTo(0, progress * max());
  };
  const up = () => {
    if (!drag.current) return;
    drag.current = null;
    document.documentElement.toggleAttribute("data-scrub", false);
    scrub.end();
  };

  return (
    <span ref={root} className="timecode" aria-hidden="true">
      <span className="tc">TC</span>
      <span>
        <span ref={hms}>00:00:00</span>
        <span ref={ff} className="ff">
          :00
        </span>
      </span>
      <span
        ref={track}
        className="track"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      />
    </span>
  );
}
