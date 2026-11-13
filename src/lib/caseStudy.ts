import { gsap } from "@/lib/gsap";
import { cruise } from "@/lib/journey";
import { onEnter } from "@/lib/loading";

/** The case study's landing: the footage is still blurred from the dive, and the copy starts this many seconds in. */
export const LAND = 0.25;
/** How far the footage is pushed in as the case study lands; it settles to 1. The dive ends on this framing. */
export const LAND_SCALE = 1.14;

/**
 * The case study is an overlay on Projects, so the page behind (3D set, navbar, programme) never reloads.
 * `open` from the first frame of the dive until the overlay is gone; `closing` while it plays out.
 * `close` is set by the overlay: links to other pages call it, then carry on once it has left (`after`).
 */
export const caseState = {
  open: false,
  closing: false,
  /** The overlay is on the screen. */
  shown: false,
  /** The programme's trailer is held on its last frame: the dive has nearly reached the screen, and it stays held until the camera is back out. */
  held: false,
  /** The dive is still flying: the overlay is mounted under it, unseen, and lands when it ends. */
  diving: false,
  /** It was opened from the programme, so the entry before it is Projects: closing steps back to it instead of piling up history. */
  programme: false,
  close: (_after?: () => void) => {},
  after: null as (() => void) | null,
};

/** How far the camera has flown into the Projects screen, 0 (the cinema) → 1 (the screen fills the frame). Read by the 3D rig. */
export const diveState = { v: 0 };

/** The trailer keeps rolling through the dive and stops here (how far the camera has flown), just before the overlay dissolves in. */
const HOLD_AT = 0.85;

const RUN = 0.4;
/** The dive from Projects to the screen: one speed all the way. */
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

/** True while the page's interface must be away: the dive in or out of a case study, and the case study itself. */
export const hushed = () =>
  document.documentElement.hasAttribute("data-hush") ||
  (caseState.open && !caseState.closing);

/** How much of the Projects programme is on show, 0–1. Written by the programme; read by whatever floats over the room. */
export const presence = { v: 0 };

const landed = new Set<() => void>();

/** Runs `cb` when the case study lands: when the dive ends, or, with no dive under it (opened from a link), once the visitor is in, so a cold load does not play its entrance behind the loader. */
export function whenLanded(cb: () => void) {
  if (!caseState.diving) return onEnter(cb);
  landed.add(cb);
  return () => landed.delete(cb);
}

/** The dive is over and the overlay is the picture now. */
export function land() {
  caseState.diving = false;
  delete document.documentElement.dataset.dive;
  landed.forEach(cb => cb());
  landed.clear();
}

/** The dive never ended in a case study (route failed, Back): nothing waits for it any more. */
export function abandonDive() {
  caseState.diving = false;
  delete document.documentElement.dataset.dive;
  landed.clear();
}

let opening = false;

/**
 * Projects → case study: the camera flies into the screen at one speed, blurring as it goes, and the trailer stops
 * where it was. `go` fires on the click, so the route loads and the overlay mounts (unseen) under the dive; the overlay
 * dissolves in over the last of it, lands out of that blur, and the trailer carries on.
 */
export function openCaseStudy(go: () => void) {
  if (opening || caseState.open) return;
  opening = true;
  caseState.open = true;
  caseState.programme = true;
  hush(true);
  // The route never came (offline, a failed navigation): the room is given back rather than left empty.
  const guard = () =>
    window.setTimeout(() => {
      if (caseState.shown || !caseState.open || caseState.closing) return;
      caseState.open = false;
      caseState.programme = false;
      abandonDive();
      retreatFromCase();
    }, 8000);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    opening = false;
    caseState.held = true;
    go();
    guard();
    return;
  }
  caseState.diving = true;
  document.documentElement.dataset.dive = "";
  go();
  guard();
  const done = () => {
    opening = false;
  };
  // The dive starts on the click; the interface fades out under it.
  gsap.to(diveState, {
    v: 1,
    duration: DIVE_SECONDS,
    ease: dive,
    // The footage plays on into the blur, then stops.
    onUpdate: () => {
      // Held only once the case study is there to take over: while the route is still loading, the footage keeps rolling.
      if (diveState.v >= HOLD_AT && caseState.shown) caseState.held = true;
    },
    onComplete: () => {
      done();
      // The route came after the dive: the hand-over is now, and the trailer stops with it.
      if (!caseState.shown) {
        const wait = () => {
          if (caseState.open && !caseState.shown) return;
          if (caseState.open) caseState.held = true;
          gsap.ticker.remove(wait);
        };
        gsap.ticker.add(wait);
      }
    },
  });
}

/** Case study → Projects: the dive played backwards. The camera backs out of the screen, the blur clearing as it goes. */
export function retreatFromCase(done?: () => void) {
  // Whatever way the case study was left (X, Esc, Back), the interface stays away until the camera is out.
  hush(true);
  abandonDive();
  gsap.to(diveState, {
    v: 0,
    duration: DIVE_SECONDS,
    ease: dive,
    overwrite: true,
    onComplete: () => {
      // Only now do the text and bars come back, and the trailer rolls on from where it stopped.
      caseState.held = false;
      hush(false);
      done?.();
    },
  });
}
