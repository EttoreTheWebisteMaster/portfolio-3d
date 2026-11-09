"use client";

import { useEffect, useRef, useState } from "react";

import { playImpact } from "@/lib/audio";
import { gsap } from "@/lib/gsap";
import { INTRO } from "@/lib/journey";
import { playCountdownOut, playLoaderExit } from "@/lib/loaderExit";
import { enter, fetchModel, getLoading } from "@/lib/loading";
import { readSound } from "@/lib/sound";

const C = 160;
const R = 150;
/** The countdown never plays faster than this, however quick the download. */
const MIN_MS = 1700;
const COUNT = 3;
/** The bars close in over this long, once everything has loaded. */
const BARS_MS = 600;
/** Held on 0 before the climax: a breath of suspense. */
const HOLD_MS = 350;

/** The page is the visitor's again. Called the moment they enter, not when the loader finishes fading. */
function release() {
  delete document.documentElement.dataset.loading;
  document.querySelector("main")?.removeAttribute("inert");
}

/**
 * Loading page: a film countdown whose sweep and numeral are the real load progress (3 → 1, never faster than 1.7s).
 * The page bars (navbar and bottom bar) close in once loading has finished, and stay. The hero follows at once; sound is off unless the visitor turned it on.
 */
export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const sweep = useRef<SVGCircleElement>(null);
  const numeral = useRef<HTMLElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const line = useRef<HTMLSpanElement>(null);
  const leader = useRef<HTMLDivElement>(null);
  const exit = useRef<() => void>(() => {});
  const [phase, setPhase] = useState<"on" | "out" | "gone">("on");

  // Start the download, and keep the page out of reach until the visitor is in.
  useEffect(() => {
    void fetchModel();
    document.documentElement.dataset.loading = "";
    document.querySelector("main")?.setAttribute("inert", "");
    return release;
  }, []);

  // Ease what is drawn toward the real progress (held back to the minimum show time), so chunky downloads still read as a smooth sweep.
  useEffect(() => {
    let shown = 0;
    let elapsed = 0;
    let closing = 0;
    let held = 0;
    const bars = document.querySelectorAll<HTMLElement>(".bar");
    let digit = COUNT;
    let percent = -1;
    const tick = (_: number, dt: number) => {
      // Held at 90% until the canvas has drawn its first frame, so its heavy setup stalls a still sweep, never a moving one.
      const { progress, started } = getLoading();
      elapsed += dt;
      const target = Math.min(progress, elapsed / MIN_MS, started ? 1 : 0.9);
      // Time-based, so a slow device catches up in the same wall-clock time.
      shown += (target - shown) * (1 - Math.exp(-dt / 140));
      if (target >= 1 && shown > 0.995) shown = 1;
      const el = root.current;
      if (!el) return;
      // Only the progress line is touched, so no style recalc ripples through the whole loader.
      if (line.current)
        line.current.style.transform = `scaleX(${shown.toFixed(4)})`;
      // Only once loading has finished do the black bars close in, slowly, eased out.
      if (shown === 1) {
        if (held === 0 && leader.current) playCountdownOut(leader.current);
        held += dt;
        if (held > HOLD_MS) closing = Math.min(closing + dt / BARS_MS, 1);
      } else if (leader.current) {
        // Tension: the lens creeps in as the countdown builds.
        leader.current.style.transform = `scale(${(1 + 0.08 * shown).toFixed(4)})`;
      }
      const away = (1 - closing) ** 3 * 100;
      bars.forEach(bar => {
        bar.style.transform = `translate3d(0, ${bar.tagName === "HEADER" ? -away : away}%, 0)`;
      });
      // Every numeral gets its own full turn of the sweep: three circles in all.
      const step = Math.min(Math.floor(shown * COUNT), COUNT - 1);
      // On 0 the sweep is empty again.
      if (sweep.current)
        sweep.current.style.strokeDashoffset =
          shown === 1 ? "1" : (1 - (shown * COUNT - step)).toFixed(4);
      // Once the third turn is done the countdown lands on 0, with no sweep of its own.
      const next = shown === 1 ? 0 : COUNT - step;
      if (next !== digit && numeral.current) {
        digit = next;
        numeral.current.textContent = String(next);
        gsap.fromTo(
          numeral.current,
          { scale: 1.2, opacity: 0.3 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.3,
            ease: "power3.out",
            overwrite: true,
          }
        );
      }
      const pct = Math.floor(shown * 100);
      if (pct !== percent && label.current) {
        percent = pct;
        label.current.textContent = `Loading · ${pct}%`;
      }
      if (closing === 1) {
        gsap.ticker.remove(tick);
        exit.current();
      }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      bars.forEach(bar => bar.style.removeProperty("transform"));
    };
  }, []);

  // Everything is loaded and the bars are in: the ticker cuts straight to the hero.
  const leave = () => {
    if (readSound()) playImpact();
    enter();
    release();
    // The bars' lettering waits for the hero copy, so all the type arrives together.
    document.documentElement.style.setProperty(
      "--intro-text",
      `${INTRO.text}s`
    );
    document.documentElement.dataset.in = "";
    document.querySelectorAll<HTMLElement>(".bar").forEach(bar => {
      bar.style.removeProperty("transform");
    });
    setPhase("out");
    if (root.current) playLoaderExit(root.current, () => setPhase("gone"));
    else setPhase("gone");
  };

  useEffect(() => {
    exit.current = leave;
  });

  if (phase === "gone") return null;

  return (
    <div
      ref={root}
      className="loader"
      data-phase={phase}
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
    >
      <div className="loader-leak loader-leak-a" />
      <div className="loader-leak loader-leak-b" />

      <p className="loader-corner loader-corner-a load-label">
        Portfolio · 2026
      </p>
      <p className="loader-corner loader-corner-b load-label">Turin, Italy</p>

      <div ref={leader} className="leader" aria-hidden="true">
        <svg viewBox="0 0 320 320">
          <circle
            ref={sweep}
            className="sweep"
            cx={C}
            cy={C}
            r={R / 2}
            pathLength={1}
            transform={`rotate(-90 ${C} ${C})`}
          />
          <circle className="ring" cx={C} cy={C} r={R} />
          <circle className="ring" cx={C} cy={C} r={R - 30} />
          <line className="cross" x1="0" y1={C} x2="320" y2={C} />
          <line className="cross" x1={C} y1="0" x2={C} y2="320" />
        </svg>
        <b ref={numeral}>{COUNT}</b>
      </div>

      <div className="loader-info">
        <p className="load-label" aria-live="off">
          <span ref={label}>Loading · 0%</span>
        </p>
        <span className="loader-line">
          <span ref={line} />
        </span>
        <p className="loader-name">Ettore Serra</p>
        <p className="load-label">Designer &amp; engineer · Turin, or remote</p>
      </div>
    </div>
  );
}
