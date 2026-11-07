"use client";

import { useEffect, useRef } from "react";

const FPS = 24;
const LENGTH = 90; // seconds of "film" the full page scroll maps to
const pad = (n: number) => String(n).padStart(2, "0");

/** Scroll-driven timecode (TC HH:MM:SS:FF); the track tick shows scroll position. */
export default function Timecode() {
  const root = useRef<HTMLSpanElement>(null);
  const hms = useRef<HTMLSpanElement>(null);
  const ff = useRef<HTMLSpanElement>(null);

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

  return (
    <span ref={root} className="timecode" aria-hidden="true">
      <span className="tc">TC</span>
      <span>
        <span ref={hms}>00:00:00</span>
        <span ref={ff} className="ff">
          :00
        </span>
      </span>
      <span className="track" />
    </span>
  );
}
