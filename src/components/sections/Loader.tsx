"use client";

import { useEffect, useRef, useState } from "react";

import { gsap } from "@/lib/gsap";
import { playCountdownOut, playLoaderExit } from "@/lib/loaderExit";
import { focusPage, release, startHero } from "@/lib/loaderEnter";
import { fetchModel, getLoading } from "@/lib/loading";
import { enterSilently, hasSoundChoice } from "@/lib/sound";

import LoaderChoice from "./LoaderChoice";

const C = 160;
const R = 150;
/** The countdown, 3 → 0, takes at least this long, and is paced by the real load: it never gets ahead of the progress line. */
const COUNT_MS = 1500;
/** The first visit is longer, so there is time to read the two buttons and choose. */
const FIRST_COUNT_MS = 3000;
/** The bars close in over this long, once everything has loaded. */
const BARS_MS = 300;
/** Held on 0 before the climax: a breath of suspense. */
const HOLD_MS = 130;

/** The bars' close-in is this far along when the hero's opening shot starts. */
const HERO_AT = 0.45;

/**
 * Loading page: a film countdown (3 → 0) that starts at once and runs in CSS, on the compositor, so the heavy scene setup behind it can never stall it.
 * The progress line shows the real load. If the scene is not ready when the countdown lands, it waits on 0. Then the bars close in and the dark parts down the middle onto the hero.
 */
export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const line = useRef<HTMLSpanElement>(null);
  const leader = useRef<HTMLDivElement>(null);
  const choice = useRef<HTMLDivElement>(null);
  const exit = useRef<() => void>(() => {});
  const counted = useRef<Animation[] | null>(null);
  // Coming back from a case study the visitor has already entered: no loading page, the page is theirs at once.
  const [skip] = useState(() => getLoading().entered);
  const [phase, setPhase] = useState<"on" | "out" | "gone">(
    skip ? "gone" : "on"
  );
  const [count] = useState(() =>
    hasSoundChoice() ? COUNT_MS : FIRST_COUNT_MS
  );
  // The countdown stands still while the visitor has a pointer or the keyboard focus on a button, and picks silence once they have left.
  const over = useRef({ pointer: false, focus: false });
  const pause = (key: "pointer" | "focus", on: boolean) => {
    over.current[key] = on;
  };

  // Next keeps this layout alive, hidden, while a case study is open, and runs these effects again on Back: once the visitor has entered they must do nothing,
  // or the page is locked again with no loader on screen to unlock it.
  // Start the download, and keep the page out of reach until the visitor is in.
  useEffect(() => {
    if (skip || getLoading().entered) return;
    void fetchModel();
    document.documentElement.dataset.loading = "";
    document.querySelector("main")?.setAttribute("inert", "");
    return release;
  }, [skip]);

  // The countdown starts as soon as the numeral's font is in (or after 0.4s at most). Its CSS animations are paused; the ticker scrubs them.
  useEffect(() => {
    if (skip || getLoading().entered) return;
    let live = true;
    const start = () => {
      const el = root.current;
      if (!live || !el || counted.current) return;
      el.style.setProperty("--count", `${count}ms`);
      el.dataset.count = "";
      // The CSS animations are paused and scrubbed by the ticker, so the digits follow the real load.
      counted.current = (
        leader.current?.getAnimations({ subtree: true }) ?? []
      ).map(a => {
        a.pause();
        a.currentTime = 0;
        return a;
      });
    };
    const wait = window.setTimeout(start, 400);
    void document.fonts.ready.then(start);
    return () => {
      live = false;
      window.clearTimeout(wait);
    };
  }, [skip, count]);

  // The progress line follows the real load; once the countdown has landed and the scene is ready, the bars close in.
  useEffect(() => {
    if (skip || getLoading().entered) return;
    let loaded = 0;
    let closing = 0;
    let held = -1;
    let percent = -1;
    let heroOn = false;
    let countT = 0;
    let shown = -1;
    const bars = document.querySelectorAll<HTMLElement>(".bar");
    const tick = (_: number, ms: number) => {
      const { progress, started } = getLoading();
      const dt = Math.min(ms, 50);
      // Real progress, eased so chunky downloads still read as a smooth line.
      loaded += (progress - loaded) * (1 - Math.exp(-dt / 140));
      if (progress === 1 && loaded > 0.97) loaded = 1;
      const el = root.current;
      if (!el) return;
      if (line.current)
        line.current.style.transform = `scaleX(${loaded.toFixed(4)})`;
      const pct = Math.floor(loaded * 100);
      if (pct !== percent && label.current) {
        percent = pct;
        label.current.textContent = `Loading · ${pct}`;
        bar.current?.setAttribute("aria-valuenow", String(pct));
        if (pct === 100 && status.current && !hasSoundChoice())
          status.current.textContent = "Loaded. Choose sound or silence.";
      }
      // Once a choice is made the keys fade away, and a pointer left on them must not hold the countdown.
      const paused =
        !hasSoundChoice() && (over.current.pointer || over.current.focus);
      const anims = counted.current;
      if (anims) {
        // Real time at most, and never past the load: slow loads stretch the countdown, fast ones keep the 1.5s floor.
        const step = paused ? 0 : dt;
        countT =
          countT < count
            ? Math.min(countT + step, Math.max(countT, loaded * count))
            : countT + step;
        anims.forEach(a => {
          a.currentTime = countT;
        });
      }
      const landed = countT >= count;
      // Reduced motion has no animated digits: the numeral is stepped by the same clock.
      const step = landed ? 3 : Math.min(2, Math.floor((countT / count) * 3));
      if (step !== shown && leader.current) {
        shown = step;
        leader.current.dataset.step = String(step);
      }
      // The silence key fills with the countdown (the hover shutter, scrubbed), and presses itself when it ends.
      choice.current?.style.setProperty(
        "--p",
        String(Math.min(countT / count, 1))
      );
      if (landed && !paused && !hasSoundChoice()) {
        if (status.current) status.current.textContent = "Entering in silence.";
        enterSilently();
      }
      // Loaded and counted down, it holds on 0 until the visitor has chosen sound or silence.
      if (landed && started && hasSoundChoice()) {
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
  }, [skip, count]);

  // Everything is loaded and the bars are in: the ticker cuts straight to the hero.
  const leave = () => {
    release();
    focusPage();
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

      <p ref={status} className="sr-only" role="status" />

      <div className="loader-foot">
        <div className="loader-info">
          <p className="load-label" aria-hidden="true">
            <span ref={label} className="loader-pct">
              Loading · 0
            </span>
          </p>
          <span
            ref={bar}
            className="loader-line"
            role="progressbar"
            aria-label="Loading"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
          >
            <span ref={line} />
          </span>
          <p className="loader-name">Ettore Serra</p>
          <p className="load-label">
            Designer &amp; engineer · Turin, or remote
          </p>
        </div>
        <LoaderChoice ref={choice} onPause={pause} />
      </div>
    </div>
  );
}
