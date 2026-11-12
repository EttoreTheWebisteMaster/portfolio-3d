import * as THREE from "three";

import { ease, heading, journey, seg } from "@/lib/journey";

import { CONTACT_AT } from "./contactShot";

/**
 * Projects → About, "the walk": one shot along +X, played by the journey. Journey 1 → 2 is the shot, 0 → 1 of it.
 * He gets up from his place in the crowd, turns right and walks on while the cinema's dark
 * gives way to the cream of About. No doors, no walls.
 */
/** Where he stops (world x). */
export const MARK_X = 10;

/** Beats of the shot (progress 0 → 1). Each is a beat on the one scrub, so everything plays backwards too. */
export const SHOT = {
  /** Focus racks from the screen onto his face. */
  rack: [0, 0.4],
  /** He gets up while the lens is on him, close. */
  stand: [0.05, 0.24],
  /** He stands straight a moment, then turns right, towards the way out. */
  turn: [0.26, 0.4],
  /** He sets off; he is at the mark at `arrive`. One constant speed. */
  walk: [0.36, 0.93],
  /** The cinema dims into the dark and daylight spills in from the right while he is on the move. */
  daylight: [0.3, 0.88],
  /** The camera has followed him all along; it settles into the About frame as he reaches the mark. */
  handoff: [0.62, 1],
  arrive: [0.92, 1],
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

/** World x where the daylight's front is: it comes in from the right of the frame and sweeps left over the dark, softly, one gradient wider than the shot. */
export const SPILL = { from: MARK_X + 32, to: -14, soft: 20 };
export const spillFront = () =>
  THREE.MathUtils.lerp(
    SPILL.from,
    SPILL.to,
    ease(seg(walk(), SHOT.daylight)) * (1 - ease(seg(journey.current, DIM)))
  );

/** 1 on Projects, 0 once the cinema has gone into the dark behind him: the crowd, the screen and the beam all follow it down together. */
export const cinemaFade = () => 1 - ease(seg(walk(), [0.05, 0.48]));

/** The audience while he walks out: it sinks to a dim presence behind him (he never walks in the pitch dark) and is gone before the first glimpse of daylight. */
export const crowdFade = () =>
  THREE.MathUtils.lerp(1, 0.3, ease(seg(walk(), [0.05, 0.26]))) *
  (1 - ease(seg(walk(), [0.26, 0.4])));

/** 0 → 1 → 0: the lens is on his face, close, while he gets up and turns. Everything softens and darkens around him. */
export const closeUp = () =>
  ease(seg(walk(), [0, 0.2])) * (1 - ease(seg(walk(), [0.3, 0.5])));

/** His eye in world space and the way it faces, published by the robot every frame for the zoom to ride. */
export const eye = {
  pos: new THREE.Vector3(),
  facing: new THREE.Vector3(0, 0, 1),
};

export type Pose = {
  /** World x of his root; he walks along the row, so z stays 0. */
  x: number;
  z: number;
  /** The way he faces, in radians; it already accounts for which way the journey is going, so he always walks forwards. */
  yaw: number;
  /** 0 → 1: how much of his facing is the walk's (Home's own turn rules before it). */
  lean: number;
  /** 0 seated → 1 upright (the Sitting clip, scrubbed). */
  stand: number;
  /** Walk-cycle phase, 0–1, from the distance travelled. */
  phase: number;
  /** 1 while he is walking, 0 while he stands. */
  moving: number;
};

/** A pose to be filled by `walkPose`. */
export const newPose = (): Pose => ({
  x: 0,
  z: 0,
  yaw: 0,
  lean: 0,
  stand: 0,
  phase: 0,
  moving: 0,
});

const turn = (a: number, b: number, t: number) =>
  THREE.MathUtils.lerp(a, b, ease(t));

/** Where he is and what he is doing at this journey position. All of it is a function of the scroll and of which way it is going. */
export function walkPose(out: Pose, pos = journey.current): Pose {
  const w = THREE.MathUtils.clamp(pos - 1, 0, 1);
  const run = seg(w, SHOT.walk);
  out.x = run * MARK_X;
  out.z = 0;
  out.stand = ease(seg(w, SHOT.stand));
  // The stride plays forwards whichever way he goes: walking back, the cycle runs on as the distance shrinks.
  const stride = (run * MARK_X) / STRIDE;
  out.phase = heading.dir >= 0 ? stride % 1 : (1 - (stride % 1)) % 1;
  out.moving = ease(seg(w, [0.33, 0.38])) * (1 - ease(seg(w, [0.9, 0.94])));
  // Home's own turn rules until the walk starts.
  out.lean = pos > 1 ? 1 : 0;
  // Facing the screen in his seat, then right along the row, then us at the mark. Walking back he faces the way he goes: left.
  if (heading.dir >= 0) {
    const y = turn(Math.PI, Math.PI / 2, seg(w, SHOT.turn));
    out.yaw = turn(y, 0.12, seg(w, SHOT.arrive));
  } else {
    const y = turn(0.12, -Math.PI / 2, 1 - seg(w, SHOT.arrive));
    out.yaw = turn(y, -Math.PI, 1 - seg(w, SHOT.turn));
  }
  return out;
}
