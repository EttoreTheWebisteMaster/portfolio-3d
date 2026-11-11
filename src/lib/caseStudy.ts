import { gsap } from "@/lib/gsap";
import { cruise, ease, travelSeconds } from "@/lib/journey";
import { view } from "@/lib/projects";

let opening = false;
let leaving = false;
let returning = false;

/** The Projects → About landing, in seconds: the white holds a beat, softens, and the camera backs out. */
export const HOLD = 0.07;
export const SOFTEN = 0.32;
export const PULL = 1.08;
/** The camera backing out: mostly one speed, ending gently. */
export const pullEase = (t: number) => t + (ease(t) - t) * 0.35;

/** The white-out at strength `f`, 0–1: the same two variables the journey's flare reads. */
export function setFlare(f: number) {
  const style = document.documentElement.style;
  style.setProperty("--flare", f.toFixed(3));
  style.setProperty("--flare-r", (6 + 140 * f).toFixed(1));
}

/** How far the camera has flown into the Projects screen, 0 (the cinema) → 1 (the white-out). Read by the 3D rig. */
export const diveState = { v: 0 };

const RUN = 0.4;
/** The dive from Projects to the white-out: one speed all the way. */
const dive = (t: number) => cruise(t * RUN) / cruise(RUN);
/** The dive played backwards in time: out of the white to Projects, 0 → 1. */
export const surface = (t: number) => 1 - dive(1 - t);
/** Seconds the dive takes (and its reverse). */
export const DIVE_SECONDS = travelSeconds(1, 2) * RUN;
/** Journey arrived from a case study: Projects plays the dive in reverse. Read once. */
export function takeReturn() {
  const was = returning;
  returning = false;
  return was;
}

export const markReturn = () => {
  returning = true;
};

/** Where the screen frame must sit to fill the viewport, from its resting place: the dive's end (and the landing's start). */
export function cover(frame: HTMLElement) {
  const r = frame.getBoundingClientRect();
  return {
    scale: Math.max(window.innerWidth / r.width, window.innerHeight / r.height),
    x: window.innerWidth / 2 - (r.left + r.width / 2),
    y: window.innerHeight / 2 - (r.top + r.height / 2),
    rotate: 2.9,
  };
}

/** Case study → Projects: the landing in reverse. The screen grows to fill the viewport, the white-out rises, then `go` navigates. */
export function leaveCaseStudy(go: () => void) {
  if (leaving) return;
  leaving = true;
  returning = true;
  const done = () => {
    leaving = false;
    go();
  };
  const frame = document.querySelector<HTMLElement>("[data-pull]");
  if (!frame || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    done();
    return;
  }
  const play = () => {
    const white = { f: 0 };
    gsap
      .timeline({ onComplete: done })
      .to("[data-fx]", { opacity: 0, duration: 0.3, ease: "power2.in" }, 0)
      .to(
        frame,
        {
          ...cover(frame),
          duration: PULL,
          ease: (t: number) => 1 - pullEase(1 - t),
        },
        0
      )
      .to(
        white,
        { f: 1, duration: SOFTEN, ease, onUpdate: () => setFlare(white.f) },
        PULL - HOLD - SOFTEN
      );
  };
  // The screen sits at the top of the page: bring the page there first.
  if (window.scrollY > 8)
    gsap.to(window, {
      scrollTo: { y: 0, autoKill: false },
      duration: 0.45,
      ease: "power2.out",
      onComplete: play,
    });
  else play();
}

/**
 * Projects → case study: the Projects → About run-up, played to its white-out. The camera flies into the screen at the
 * transition's own speed, and `go` fires once the flash has filled the frame; the new page lands out of it.
 */
export function openCaseStudy(go: () => void) {
  if (opening) return;
  opening = true;
  view.held = true;
  const done = () => {
    opening = false;
    go();
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    done();
    return;
  }
  gsap.to(diveState, {
    v: 1,
    duration: DIVE_SECONDS,
    ease: dive,
    onComplete: done,
  });
}
