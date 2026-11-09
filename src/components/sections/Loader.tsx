"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { playImpact } from "@/lib/audio";
import { gsap } from "@/lib/gsap";
import { enter, fetchModel, getLoading, hasVisited } from "@/lib/loading";
import { readSound, setSound } from "@/lib/sound";

const C = 160;
const R = 150;
const RETURN_MS = 600;
const EXIT_MS = 320;

/** Pie wedge from 12 o'clock, clockwise, `p` of a full turn. */
function wedge(p: number) {
  const a = Math.min(p, 0.9999) * Math.PI * 2;
  const x = C + R * Math.sin(a);
  const y = C - R * Math.cos(a);
  return `M${C} ${C}L${C} ${C - R}A${R} ${R} 0 ${a > Math.PI ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}Z`;
}

const never = () => () => {};

/** The page is the visitor's again. Called the moment they enter, not when the loader finishes fading. */
function release() {
  delete document.documentElement.dataset.loading;
  document.querySelector("main")?.removeAttribute("inert");
}

/**
 * Loading page: a film countdown whose sweep and numeral are the real load progress (5 → 1 over 0–100%).
 * The bars slide in from 80%. First visit holds on 1 until the visitor chooses sound; a return visit cuts straight in.
 */
export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const sweep = useRef<SVGPathElement>(null);
  const numeral = useRef<HTMLElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<"on" | "out" | "gone">("on");
  const returning = useSyncExternalStore(never, hasVisited, () => false);

  // Start the download, and keep the page out of reach until the visitor is in.
  useEffect(() => {
    void fetchModel();
    document.documentElement.dataset.loading = "";
    document.querySelector("main")?.setAttribute("inert", "");
    return release;
  }, []);

  // Ease what is drawn toward the real progress, so chunky downloads still read as a smooth sweep.
  useEffect(() => {
    let shown = 0;
    const tick = (_: number, dt: number) => {
      const target = getLoading().progress;
      // Time-based, so a slow device catches up in the same wall-clock time.
      shown += (target - shown) * (1 - Math.exp(-dt / 180));
      if (target >= 1 && shown > 0.995) shown = 1;
      const el = root.current;
      if (!el) return;
      const t = Math.min(Math.max((shown - 0.8) / 0.2, 0), 1);
      el.style.setProperty("--bars", String(1 - (1 - t) ** 3));
      el.style.setProperty("--load", shown.toFixed(4));
      sweep.current?.setAttribute("d", wedge(shown));
      if (numeral.current)
        numeral.current.textContent = String(
          Math.max(1, 5 - Math.floor(shown * 5))
        );
      if (label.current)
        label.current.textContent = `Loading · ${Math.floor(shown * 100)}%`;
      if (shown === 1) {
        gsap.ticker.remove(tick);
        setReady(true);
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  const leave = () => {
    // The hit is timed to the light slam; the click is the gesture the browser needs to let it play.
    if (readSound()) playImpact();
    enter();
    setPhase("out");
  };

  // Return visit: one short frame on 1, then the cut.
  useEffect(() => {
    if (!ready || !returning) return;
    const id = window.setTimeout(leave, RETURN_MS);
    return () => window.clearTimeout(id);
  }, [ready, returning]);

  useEffect(() => {
    if (phase !== "out") return;
    const id = window.setTimeout(() => setPhase("gone"), EXIT_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  if (phase === "gone") return null;

  const choose = (sound: boolean) => {
    setSound(sound);
    leave();
  };

  return (
    <div
      ref={root}
      className="loader"
      data-phase={phase}
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
    >
      <div className="loader-bar loader-bar-top" />
      <div className="loader-leak loader-leak-a" />
      <div className="loader-leak loader-leak-b" />

      <p className="loader-corner loader-corner-a load-label">
        Portfolio · 2026
      </p>
      <p className="loader-corner loader-corner-b load-label">Turin, Italy</p>

      <div className="leader" aria-hidden="true">
        <svg viewBox="0 0 320 320">
          <path ref={sweep} className="sweep" d={wedge(0)} />
          <circle className="ring" cx={C} cy={C} r={R} />
          <circle className="ring" cx={C} cy={C} r={R - 30} />
          <line className="cross" x1="0" y1={C} x2="320" y2={C} />
          <line className="cross" x1={C} y1="0" x2={C} y2="320" />
        </svg>
        <b ref={numeral}>5</b>
      </div>

      <div className="loader-info">
        <p className="load-label" aria-live="off">
          <span ref={label}>Loading · 0%</span>
        </p>
        <span className="loader-line" />
        <p className="loader-name">Ettore Serra</p>
        <p className="load-label">Designer &amp; engineer · Turin, or remote</p>
      </div>

      <div className="loader-choice" data-ready={ready}>
        {returning ? (
          <p className="load-label">
            Welcome back · sound {readSound() ? "on" : "off"}, as you left it
          </p>
        ) : (
          <>
            <span className="note" aria-hidden="true">
              best with sound on
              <svg viewBox="0 0 72 48">
                <path d="M4 6C24 2 52 8 62 38M62 38l-12-6M62 38l4-13" />
              </svg>
            </span>
            <div className="loader-buttons">
              <button
                type="button"
                className="btn-primary"
                disabled={!ready}
                onClick={() => choose(true)}
                autoFocus
              >
                <svg viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                  <path d="M1 5h3l4-3.5v11L4 9H1z" />
                  <path
                    d="M10 4.5a3.5 3.5 0 0 1 0 5"
                    fill="none"
                    stroke="currentColor"
                  />
                </svg>
                Enter with sound
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={!ready}
                onClick={() => choose(false)}
              >
                Enter in silence
              </button>
            </div>
          </>
        )}
      </div>
      <div className="loader-bar loader-bar-bottom" />
    </div>
  );
}
