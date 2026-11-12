import { gsap } from "@/lib/gsap";
import { cruise } from "@/lib/journey";

/** The case study's landing, in seconds: the white holds, then softens slowly into the room. */
export const HOLD = 0;
export const SOFTEN = 0.3;

/**
 * The case study is an overlay on Projects, so the page behind (3D set, navbar, programme) never reloads.
 * `open` from the first frame of the dive until the overlay is gone; `closing` while it plays out.
 * `close` is set by the overlay: links to other pages call it, then carry on once it has left (`after`).
 */
export const caseState = {
  open: false,
  closing: false,
  close: (_after?: () => void) => {},
  after: null as (() => void) | null,
};

/** How far the camera has flown into the Projects screen, 0 (the cinema) → 1 (the white-out). Read by the 3D rig. */
export const diveState = { v: 0 };

const RUN = 0.4;
/** The dive from Projects to the white-out: one speed all the way. */
const dive = (t: number) => cruise(t * RUN) / cruise(RUN);
/** Seconds the dive takes. */
const DIVE_SECONDS = 1.8 * RUN;

/** The page's text and bars away (`true`) or back (`false`): they fade, and stay away for the whole transition. `bar` is the top bar alone. */
export function hush(on: boolean, bar = on) {
  const html = document.documentElement;
  if (on) html.dataset.hush = "";
  else delete html.dataset.hush;
  if (bar) html.dataset.hushBar = "";
  else delete html.dataset.hushBar;
}

let opening = false;

/**
 * Projects → case study: the Projects → About run-up, played to its white-out. The camera flies into the screen at the
 * transition's own speed, and `go` fires once the flash has filled the frame; the overlay lands out of it.
 */
export function openCaseStudy(go: () => void) {
  if (opening || caseState.open) return;
  opening = true;
  caseState.open = true;
  hush(true);
  const done = () => {
    opening = false;
    go();
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    done();
    return;
  }
  // The dive starts on the click; the interface fades out under it.
  gsap.to(diveState, {
    v: 1,
    duration: DIVE_SECONDS,
    ease: dive,
    onComplete: done,
  });
}

/** Case study → Projects: the dive played backwards. The camera backs out of the screen, the white-out clearing as it goes. */
export function retreatFromCase(done?: () => void) {
  gsap.to(diveState, {
    v: 0,
    duration: DIVE_SECONDS,
    ease: dive,
    overwrite: true,
    onComplete: () => {
      // Only now do the text and bars come back.
      hush(false);
      done?.();
    },
  });
}
