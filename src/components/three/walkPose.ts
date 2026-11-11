import * as THREE from "three";

import { ease, journey, seg } from "@/lib/journey";

import { CONTACT_AT } from "./contactShot";

/**
 * Projects → About, "the walk-out": one shot along +X, scrubbed by the journey. Journey 1 → 2 is the shot, 0 → 1 of it.
 * World, left to right: the cinema (x 0), a door in its end wall, a short dark passage, the cream sweep of About.
 */
export const DOOR_X = 15;
/** The passage between the door and the cream room. */
export const PASSAGE_END = 26;
/** Where he stops in the cream room (world x). */
export const MARK_X = 36;
/** How far he walks on after About, out of frame to the right, on the way to Contact. */
export const EXIT_LENGTH = 16;

/** Beats of the shot (progress 0 → 1). Each is a beat on the one scrub, so everything plays backwards too. */
export const SHOT = {
  rack: [0, 0.12],
  stand: [0.12, 0.25],
  /** He sets off; he is at the mark at `arrive`. One constant speed. */
  walk: [0.25, 0.93],
  door: [0.46, 0.54],
  daylight: [0.5, 0.72],
  handoff: [0.56, 0.75],
  turn: [0.93, 1],
} as const;
/** Journey positions of About → Contact: he walks off right, then the daylight dims into Contact's dark. */
export const LEAVE = [2.02, 2.38] as const;
export const DIM = [2.2, CONTACT_AT] as const;

/** Distance travelled by his walk cycle's stride, in world units (measured from the Walking clip: 3.6 u/s × 0.958 s). */
export const STRIDE = 3.48;

/** Shot progress: 0 on Projects, 1 on About (and after). */
export const walk = () => THREE.MathUtils.clamp(journey.current - 1, 0, 1);

/** Is the camera in the walk-out / About frame? */
export const onAbout = () =>
  journey.current > 1 && journey.current < CONTACT_AT;

/** 0 → 1: the room's daylight takes over from the cinema's dark (grade, light, exposure). Gone again as About dims for Contact. */
export const daylight = () =>
  ease(seg(walk(), SHOT.daylight)) * (1 - ease(seg(journey.current, DIM)));

/** Door leaf: 0 closed, 1 open. He pushes it open on the way in and it swings shut behind him. */
export const doorOpen = () => {
  const w = walk();
  return (
    ease(seg(w, SHOT.door)) *
    (1 - ease(seg(w, [0.58, 0.66]))) *
    (journey.current < 2 ? 1 : 0)
  );
};

export type Pose = {
  /** World x of his root. */
  x: number;
  yaw: number;
  /** 0 seated → 1 upright (the Sitting clip, scrubbed). */
  stand: number;
  /** Walk-cycle phase, 0–1, from the distance travelled. */
  phase: number;
  /** 1 while he is walking, 0 while he stands. */
  moving: number;
};

/** Where he is and what he is doing at this journey position. All of it is a function of the scroll. */
export function walkPose(out: Pose, pos = journey.current): Pose {
  const w = THREE.MathUtils.clamp(pos - 1, 0, 1);
  const away = seg(pos, LEAVE);
  const run = seg(w, SHOT.walk);
  const dist = run * MARK_X + away * EXIT_LENGTH;
  out.x = dist;
  out.stand = ease(seg(w, SHOT.stand));
  out.phase = (dist / STRIDE) % 1;
  const set = ease(seg(w, [0.22, 0.27]));
  const stop = 1 - ease(seg(w, [0.9, 0.94]));
  out.moving = Math.max(
    set * stop,
    ease(seg(pos, [LEAVE[0], LEAVE[0] + 0.05]))
  );
  // Facing the screen when seated, then right along the row, then us at the mark, then right again on the way out.
  let yaw = THREE.MathUtils.lerp(
    Math.PI,
    Math.PI / 2,
    ease(seg(w, [0.15, 0.25]))
  );
  yaw = THREE.MathUtils.lerp(yaw, 0.12, ease(seg(w, SHOT.turn)));
  out.yaw = THREE.MathUtils.lerp(
    yaw,
    Math.PI / 2,
    ease(seg(pos, [LEAVE[0] - 0.02, LEAVE[0] + 0.06]))
  );
  return out;
}
