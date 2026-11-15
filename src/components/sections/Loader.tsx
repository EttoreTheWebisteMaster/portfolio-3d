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
/** The countdown, 3 → 0, takes at least this long, at one constant speed. */
const COUNT_MS = 1500;
/** The first visit is longer, so there is time to read the two buttons and choose. */
const FIRST_COUNT_MS = 3000;
/** The countdown waits for this many smooth frames in a row (each under STEADY_MS) before it starts, and gives up waiting after SETTLE_MAX_MS. */
const STEADY_FRAMES = 6;
const STEADY_MS = 24;
const SETTLE_MAX_MS = 1200;
/** If the fonts never report in, it starts anyway after this long. */
const FONT_MAX_MS = 2000;
/** The bars close in over this long, once everything has loaded. */
const BARS_MS = 300;
/** Held on 0 before the climax: a breath of suspense. */
const HOLD_MS = 130;

/** The bars' close-in is this far along when the hero's opening shot starts. */
const HERO_AT = 0.45;

/** The countdown is planned a little longer than the quicker of the last two loads, so it ends just after them. */
const LOAD_MARGIN = 1.15;
/** However slow a past load was, the countdown is never planned longer than this. */
const MAX_PLAN_MS = 8000;
const LOAD_KEY = "load-ms";

/** The length of the countdown: constant speed from start to end, never under `floor`. `spent` is how long the load has already run when it starts. */
function planMs(floor: number, spent: number) {
  try {
    const past = (window.localStorage.getItem(LOAD_KEY) ?? "")
      .split(",")
      .map(Number)
      .filter(ms => ms > 0);
    if (past.length === 0) return floor;
    return Math.min(
      Math.max(floor, Math.min(...past) * LOAD_MARGIN - spent),
      MAX_PLAN_MS
    );
  } catch {
    return floor;
  }
}

function saveLoadMs(ms: number) {
  try {
    const past = (window.localStorage.getItem(LOAD_KEY) ?? "")
      .split(",")
      .map(Number)
      .filter(n => n > 0);
    window.localStorage.setItem(
      LOAD_KEY,
      [Math.round(ms), ...past].slice(0, 2).join(",")
    );
  } catch {
    // Storage can be blocked: the next visit plans with the default length.
  }
}

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
  // How fast the countdown runs (1 = its own length), and when it started.
  const pace = useRef({ rate: 1, at: 0 });
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

  // The countdown starts once the numeral's font is in and the page is drawing steadily (a few smooth frames in a row), so it never begins on a stalled frame. Its CSS animations are paused; the ticker scrubs them.
  useEffect(() => {
    if (skip || getLoading().entered) return;
    let live = true;
    const mounted = performance.now();
    const start = () => {
      const el = root.current;
      if (!live || !el || counted.current) return;
      el.style.setProperty("--count", `${count}ms`);
      el.dataset.count = "";
      // The digits and the sweep are CSS animations that run by themselves on the compositor, at one constant rate (a long frame cannot stutter them). The ticker only pauses them and reads the time.
      const now = performance.now();
      const rate = count / planMs(count, now - mounted);
      pace.current = { rate, at: now };
      counted.current = (
        leader.current?.getAnimations({ subtree: true }) ?? []
      ).map(a => {
        a.pause();
        a.currentTime = 0;
        a.playbackRate = rate;
        a.play();
        return a;
      });
    };
    // Steady = STEADY_FRAMES frames in a row, each quicker than STEADY_MS; it never waits longer than SETTLE_MAX_MS.
    let raf = 0;
    const settle = () => {
      const began = performance.now();
      let before = began;
      let steady = 0;
      const frame = (now: number) => {
        steady = now - before < STEADY_MS ? steady + 1 : 0;
        before = now;
        if (steady >= STEADY_FRAMES || now - began > SETTLE_MAX_MS) start();
        else raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };
    const wait = window.setTimeout(start, FONT_MAX_MS);
    void document.fonts.ready.then(() => {
      window.clearTimeout(wait);
      settle();
    });
    return () => {
      live = false;
      window.clearTimeout(wait);
      cancelAnimationFrame(raf);
    };
  }, [skip, count]);

  // The countdown (digits, sweep, the key's fill) runs on its own linear clock; the progress line shows the real load. Once the countdown has landed and the scene is ready, the bars close in.
  useEffect(() => {
    if (skip || getLoading().entered) return;
    let loaded = 0;
    let closing = 0;
    let held = -1;
    let percent = -1;
    let heroOn = false;
    let shown = -1;
    // The countdown: constant speed, 3 → 0, never under its own length (1.5s, 3s on a first visit), planned from the past loads. It does not follow the load; it ends only once everything is in.
    let countT = -1;
    let last = 0;
    let stopped = false;
    let frozen: Animation[] = [];
    let saved = false;
    const t0 = performance.now();
    const bars = document.querySelectorAll<HTMLElement>(".bar");
    const tick = (_: number, ms: number) => {
      const { progress, started } = getLoading();
      const dt = Math.min(ms, 50);
      const el = root.current;
      if (!el) return;
      const now = performance.now();
      // Once a choice is made the keys fade away, and a pointer left on them must not hold the countdown.
      const paused =
        !hasSoundChoice() && (over.current.pointer || over.current.focus);
      const anims = counted.current;
      if (anims) {
        if (countT < 0) {
          // First frame with the countdown running: read it back from the moment it started.
          countT = Math.min((now - pace.current.at) * pace.current.rate, count);
          last = now;
        }
        if (paused !== stopped) {
          stopped = paused;
          // Only the ones still running: playing a finished animation would start it over.
          if (paused) {
            frozen = anims.filter(a => a.playState === "running");
            frozen.forEach(a => a.pause());
          } else frozen.forEach(a => a.play());
        }
        // Real time (not the ticker's, which smooths long frames).
        if (!paused)
          countT = Math.min(countT + (now - last) * pace.current.rate, count);
        last = now;
      }
      if (progress >= 1 && !saved) {
        saved = true;
        saveLoadMs(now - t0);
      }
      // The progress line is the real load, eased so chunky downloads still read as a smooth line. It is not tied to the countdown.
      loaded += (progress - loaded) * (1 - Math.exp(-dt / 140));
      if (progress === 1 && loaded > 0.97) loaded = 1;
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
      const counted0 = countT >= count;
      // It lands on 0 only when everything is in.
      const landed = counted0 && progress >= 1;
      // Reduced motion has no animated digits: the numeral is stepped by the same clock.
      const step = counted0
        ? 3
        : Math.min(2, Math.floor((Math.max(countT, 0) / count) * 3));
      if (step !== shown && leader.current) {
        shown = step;
        leader.current.dataset.step = String(step);
      }
      // The silence key fills with the countdown (the hover shutter, scrubbed), and presses itself when it ends.
      choice.current?.style.setProperty(
        "--p",
        String(Math.min(Math.max(countT, 0) / count, 1))
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
