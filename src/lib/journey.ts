/** One position for the whole site, shared by the DOM layer and the 3D rig. */
export type Progress = { current: number };

/** Page position as a float page index: 0 on Home, 1 on Projects, 0.5 halfway between. Written by the page snapper. */
export const journey: Progress = { current: 0 };

export function setJourney(p: number) {
  journey.current = p;
}

/** Mirrors the journey into `target`, clamped to the Home → Projects range the 3D rig uses. */
export function syncRig(target: Progress) {
  target.current = clamp01(journey.current);
}

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

/** Position of p inside a [from, to] beat, 0–1. */
export const seg = (p: number, [from, to]: readonly [number, number]) =>
  clamp01((p - from) / (to - from));

/** Smootherstep: zero velocity and acceleration at both ends. Used for fades, never for travel. */
export const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** Seconds the Home → Projects hop takes. */
export const TRANSITION_SECONDS = 3.2;

/** Seconds each hop between neighbouring pages takes: Home → Projects, Projects → About, About → Contact. */
const HOP_SECONDS = [TRANSITION_SECONDS, 1.8, 1.6] as const;

/** Seconds a change from page `from` to page `to` takes: the hops it crosses, added up. */
export function travelSeconds(from: number, to: number) {
  let seconds = 0;
  for (let i = Math.min(from, to); i < Math.max(from, to); i++)
    seconds += HOP_SECONDS[i] ?? HOP_SECONDS[0];
  return seconds;
}

/**
 * Travel curve of a page change: a short ramp up, a long stretch at one constant speed, a short ramp down.
 * No slow start, no rushed finish.
 */
export function cruise(t: number, ramp = 0.1) {
  const v = 1 / (1 - ramp);
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  if (t < ramp) return (v * t * t) / (2 * ramp);
  if (t > 1 - ramp) return 1 - (v * (1 - t) * (1 - t)) / (2 * ramp);
  return v * (t - ramp / 2);
}

/**
 * Home → Projects as beats of one 0–1 travel. They overlap on purpose so something is always moving
 * and one light is always rising while another falls.
 */
export const BEAT = {
  /** The camera pushes in, arcs round his shoulder, then cranes up and back over his head. */
  crane: [0, 1],
  /** He winds up, then turns to face the screen. */
  turn: [0.03, 0.5],
  /** Eyes leave the robot and settle on the screen. */
  look: [0.3, 1],
  /** Focus racks from the robot to the screen. */
  rack: [0.35, 1],
  /** The hero key, beam and dust hand over to the cinema. */
  key: [0.1, 0.8],
  /** The cinema's own light (fill and screen) comes up while the key goes down. */
  cinema: [0.05, 0.7],
  /** The room surfaces out of the dark: the floor stays masked in backdrop black until the hero key has handed over. */
  floor: [0.25, 0.7],
  reveal: [0.04, 0.5],
  /** The screen draws as a line, then opens into the picture. */
  line: [0.4, 0.52],
  picture: [0.48, 0.85],
  /** The crowd comes in from the sides and settles. */
  walk: [0.22, 0.95],
} as const;

/** Hero key light: 1 at the top of Home, 0 once the cinema has taken over. */
export const heroLight = (p: number) => 1 - ease(seg(p, BEAT.key));

/** Cinema light: 0 on Home, 1 on Projects. */
export const cinemaLight = (p: number) => ease(seg(p, BEAT.cinema));

/** Where the camera ends, level, in the middle rows. */
export const CAM_END = [0, 6, 7] as const;
export const SCREEN_DIST = 22;
/** Lens the camera settles on at the screen, in degrees. The screen frame is sized with it. */
export const SCREEN_FOV = 32;
/** His head, the first thing in focus. */
export const HEAD = [0, 1.8, 0] as const;

/** Opening shot after Enter, in seconds: the camera drops from high above onto the hero close-up while the key light rises. */
export const INTRO = {
  total: 3,
  /** The key light starts to rise. */
  slam: 0.65,
  fly: 3,
  /** The title starts decoding as he comes into the light. */
  text: 0.6,
} as const;

/** 0 before Enter, 1 once the opening shot has played. Tweened once by the canvas. */
export const intro: Progress = { current: 0 };

const introTime = () => intro.current * INTRO.total;
const soft = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

/** Camera travel of the opening shot, 0–1: a short ramp up, constant speed, then a long, gentle slow-motion landing on the close-up. */
export function introFly() {
  const t = clamp01(introTime() / INTRO.fly);
  const up = 0.08;
  const down = 0.4;
  const v = 1 / (1 - up / 2 - down / 2);
  if (t < up) return (v * t * t) / (2 * up);
  if (t > 1 - down) return 1 - (v * (1 - t) * (1 - t)) / (2 * down);
  return v * (t - up / 2);
}

/** 0 → 1 across the shot: the aim comes up from the whole robot to the hero framing. */
export const introSettle = () =>
  soft((introTime() - 0.1) / (INTRO.total - 0.1));

/** 0 → 1 as the key light rises, `delay` seconds after it starts. */
export const introKey = (delay = 0) =>
  soft((introTime() - INTRO.slam - delay) / 1.2);

/** 0 → 1 as the cold rim traces the silhouette out of the dark. */
export const introRim = () => soft(introTime() / 0.9);

/** A gentle swell of glow as the key peaks, never a flash. Feeds the key and the bloom. */
export function introFlash() {
  return 0.25 * Math.sin(Math.PI * clamp01((introTime() - INTRO.slam) / 1.8));
}

/** Publishes the position to CSS (`--pos` raw, `--p` Home→Projects 0–1) so the DOM layer moves with the 3D one. */
export function publish(pos: number) {
  const style = document.documentElement.style;
  style.setProperty("--pos", pos.toFixed(4));
  style.setProperty("--p", clamp01(pos).toFixed(4));
}
