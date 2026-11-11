"use client";

import { useEffect, useRef, useState } from "react";

import { playImpact } from "@/lib/audio";
import { gsap } from "@/lib/gsap";
import { INTRO } from "@/lib/journey";
import { playCountdownOut, playLoaderExit } from "@/lib/loaderExit";
import { enter, fetchModel, getLoading } from "@/lib/loading";
import { isMuted } from "@/lib/sound";

const C = 160;
const R = 150;
/** The countdown, 3 → 0, always takes exactly this long, and starts the moment the numeral's font is in. */
const COUNT_MS = 1500;
/** The bars close in over this long, once everything has loaded. */
const BARS_MS = 300;
/** Held on 0 before the climax: a breath of suspense. */
const HOLD_MS = 130;

/** The bars' close-in is this far along when the hero's opening shot starts. */
const HERO_AT = 0.45;

/** The hero's opening shot: the impact, the scene's intro, and the bars' lettering that arrives with the hero copy. */
function startHero() {
  if (!isMuted()) playImpact();
  enter();
  document.documentElement.style.setProperty("--intro-text", `${INTRO.text}s`);
  document.documentElement.dataset.in = "";
}

/** The page is the visitor's again. Called the moment they enter, not when the loader finishes fading. */
function release() {
  delete document.documentElement.dataset.loading;
  document.querySelector("main")?.removeAttribute("inert");
}

/**
 * Loading page: a film countdown (3 → 0) that starts at once and runs in CSS, on the compositor, so the heavy scene setup behind it can never stall it.
 * The progress line shows the real load. If the scene is not ready when the countdown lands, it waits on 0. Then the bars close in and the dark parts down the middle onto the hero.
 */
export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const line = useRef<HTMLSpanElement>(null);
  const leader = useRef<HTMLDivElement>(null);
  const exit = useRef<() => void>(() => {});
  const startedAt = useRef(0);
  // Coming back from a case study the visitor has already entered: no loading page, the page is theirs at once.
  const [skip] = useState(() => getLoading().entered);
  const [phase, setPhase] = useState<"on" | "out" | "gone">(
    skip ? "gone" : "on"
  );

  // Start the download, and keep the page out of reach until the visitor is in.
  useEffect(() => {
    if (skip) return;
    void fetchModel();
    document.documentElement.dataset.loading = "";
    document.querySelector("main")?.setAttribute("inert", "");
    return release;
  }, [skip]);

  // The countdown starts as soon as the numeral's font is in (or after 0.4s at most). It is a CSS animation: nothing here drives it.
  useEffect(() => {
    if (skip) return;
    let live = true;
    const start = () => {
      const el = root.current;
      if (!live || !el || startedAt.current) return;
      startedAt.current = performance.now();
      el.style.setProperty("--count", `${COUNT_MS}ms`);
      el.dataset.count = "";
    };
    const wait = window.setTimeout(start, 400);
    void document.fonts.ready.then(start);
    return () => {
      live = false;
      window.clearTimeout(wait);
    };
  }, [skip]);

  // The progress line follows the real load; once the countdown has landed and the scene is ready, the bars close in.
  useEffect(() => {
    if (skip) return;
    let loaded = 0;
    let closing = 0;
    let held = -1;
    let percent = -1;
    let heroOn = false;
    const bars = document.querySelectorAll<HTMLElement>(".bar");
    const tick = (_: number, ms: number) => {
      const { progress, started } = getLoading();
      const dt = Math.min(ms, 50);
      // Real progress, eased so chunky downloads still read as a smooth line.
      loaded += (progress - loaded) * (1 - Math.exp(-dt / 140));
      if (progress === 1 && loaded > 0.995) loaded = 1;
      const el = root.current;
      if (!el) return;
      if (line.current)
        line.current.style.transform = `scaleX(${loaded.toFixed(4)})`;
      const pct = Math.floor(loaded * 100);
      if (pct !== percent && label.current) {
        percent = pct;
        label.current.textContent = `Loading · ${pct}%`;
      }
      const landed =
        startedAt.current > 0 &&
        performance.now() - startedAt.current >= COUNT_MS;
      if (landed && started) {
        if (held < 0 && leader.current) {
          held = 0;
          playCountdownOut(el, leader.current);
        }
        held += dt;
        if (held > HOLD_MS) closing = Math.min(closing + dt / BARS_MS, 1);
      }
      // The hero's opening shot starts a little before the bars land, so the cut feels already in motion.
      if (closing > HERO_AT && !heroOn) {
        heroOn = true;
        startHero();
      }
      const away = (1 - closing) ** 3 * 100;
      bars.forEach(bar => {
        bar.style.transform = `translate3d(0, ${bar.tagName === "HEADER" ? -away : away}%, 0)`;
      });
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
  }, [skip]);

  // Everything is loaded and the bars are in: the ticker cuts straight to the hero.
  const leave = () => {
    release();
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
      <div className="loader-pane loader-pane-top" />
      <div className="loader-pane loader-pane-bottom" />
      <div className="loader-seam" />
      <div className="loader-leak loader-leak-a" />
      <div className="loader-leak loader-leak-b" />

      <p className="loader-corner loader-corner-a load-label">
        Portfolio · 2026
      </p>
      <p className="loader-corner loader-corner-b load-label">Turin, Italy</p>

      <div ref={leader} className="leader" aria-hidden="true">
        <div className="sweep">
          <span className="sweep-half sweep-half-r">
            <i />
          </span>
          <span className="sweep-half sweep-half-l">
            <i />
          </span>
        </div>
        <svg viewBox="0 0 320 320">
          <circle className="ring" cx={C} cy={C} r={R} />
          <circle className="ring" cx={C} cy={C} r={R - 30} />
          <line className="cross" x1="0" y1={C} x2="320" y2={C} />
          <line className="cross" x1={C} y1="0" x2={C} y2="320" />
        </svg>
        <b>
          <span>3</span>
          <span>2</span>
          <span>1</span>
          <span>0</span>
        </b>
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
