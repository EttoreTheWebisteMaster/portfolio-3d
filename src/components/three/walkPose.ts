import * as THREE from "three";

import { ease, journey, seg } from "@/lib/journey";

import { CONTACT_AT } from "./contactShot";

/**
 * Projects → About, "the walk": one shot along +X, played by the journey. Journey 1 → 2 is the shot, 0 → 1 of it.
 * One room: he gets up from the cinema and walks on while its dark gives way to the cream of About. No doors, no walls.
 */
/** Where he stops (world x). */
export const MARK_X = 16;

/** Beats of the shot (progress 0 → 1). Each is a beat on the one scrub, so everything plays backwards too. */
export const SHOT = {
  rack: [0, 0.1],
  stand: [0.04, 0.2],
  /** He sets off; he is at the mark at `arrive`. One constant speed. */
  walk: [0.2, 0.92],
  daylight: [0.3, 0.8],
  /** The camera has followed him all along; it settles into the About frame as he reaches the mark. */
  handoff: [0.68, 1],
  turn: [0.92, 1],
} as const;
/**
 * Journey positions of About → Contact. He stays on his mark and looks down the lens: the copy goes, the camera pushes
 * in on his eye, the room's light dies down to that one glint, and the picture falls to black just before the cut.
 */
export const ZOOM = [2, 2.44] as const;
/** The copy is out of the way before the lens is close enough to touch it. */
export const COPY_GONE = 2.14;
export const DIM = [2.1, 2.44] as const;

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

/** His eye in world space and the way it faces, published by the robot every frame for the zoom to ride. */
export const eye = {
  pos: new THREE.Vector3(),
  facing: new THREE.Vector3(0, 0, 1),
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
  const run = seg(w, SHOT.walk);
  const dist = run * MARK_X;
  out.x = dist;
  out.stand = ease(seg(w, SHOT.stand));
  out.phase = (dist / STRIDE) % 1;
  const set = ease(seg(w, [0.17, 0.22]));
  const stop = 1 - ease(seg(w, [0.89, 0.93]));
  out.moving = set * stop;
  // Facing the screen when seated, then right along the row, then us at the mark.
  const yaw = THREE.MathUtils.lerp(
    Math.PI,
    Math.PI / 2,
    ease(seg(w, [0.08, 0.2]))
  );
  out.yaw = THREE.MathUtils.lerp(yaw, 0.12, ease(seg(w, SHOT.turn)));
  return out;
}
