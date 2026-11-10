import * as THREE from "three";

import { play } from "@/lib/sound";

import type { Limp } from "./crowdLimp";
import type { Walker } from "./crowdWalk";

/** seat: standing where it belongs. held: in the visitor's hand. fall: dropped, landing. back: walking to its seat. */
export type Mode = "seat" | "held" | "fall" | "back";

/** A burst of dust at the floor; CrowdDust drains these. */
export type Puff = { x: number; z: number; n: number; power: number };
export const puffs: Puff[] = [];
export const emitDust = (x: number, z: number, n: number, power: number) => {
  puffs.push({ x, z, n, power });
};

/** How hard gravity pulls (units/s²), and the room a thrown robot bounces around in (x either side, z near and far). */
export const GRAVITY = 18;
export const ROOM = { x: 26, near: 4, far: -12, ceiling: 11 };

/** Everything a robot needs to be touched: grabbed, startled, cheering, fidgeting. */
export type Hands = {
  mode: Mode;
  /** Its pool of shadow on the floor beneath it, and its shadow on the screen when it stands in the beam. */
  shadow: THREE.Object3D;
  cast: THREE.Object3D;
  /** Its own paints, which take the screen's rim light: how much of it. */
  skin: THREE.MeshPhysicalMaterial[];
  lit: number;
  /** The "no, no, put me down" clip played while it is held, and how much of it shows. */
  protest?: THREE.AnimationAction;
  protestW: number;
  /** Arms and legs that can hang dead, and how much of the pose they take (1 while held or flying). */
  limp: Limp | null;
  limpW: number;
  /** Its own scale, so squashing never loses it. */
  base: number;
  /** Held by the head: where the hand wants the head (hold aim), where it is (hold), how fast it moves, and the gap to the point under the cursor. */
  hold: THREE.Vector3;
  holdAim: THREE.Vector3;
  holdV: THREE.Vector3;
  grabOff: THREE.Vector3;
  /** How fast the hand is moving (smoothed): what a throw takes with it. */
  aimV: THREE.Vector3;
  aimPrev: THREE.Vector3;
  /** Thrown clear of the screen already, and a wave waiting to start (s). */
  out: boolean;
  waveIn: number;
  /** Distance from its feet to its head, unscaled: the length it hangs by. */
  headH: number;
  /** How far the body is swung out of upright (towards +x, towards +z), and how fast. Hanging or tumbling. */
  sw: THREE.Vector2;
  swV: THREE.Vector2;
  /** Ground speed in flight after a throw, and height above the floor. */
  vel: THREE.Vector2;
  lift: number;
  vy: number;
  wait: number;
  hop: boolean;
  squash: number;
  /** A one-shot clip that crossfades over the loops. */
  wave?: THREE.AnimationAction;
  shotW: number;
  shotLeft: number;
  /** Face meshes carrying the brow expressions, the current blend, and whether it needs writing. */
  faces: THREE.Mesh[];
  mood: [number, number];
  moodOn: boolean;
  /** Seconds of startled brows left, and the delay before they start. */
  gasp: number;
  gaspIn: number;
  cheer: number;
  /** Someone nearby is being picked up. */
  alarm: boolean;
  /** A point in the world (another robot) the head turns to, how much, how long, and the head turn it asks for. */
  watch: THREE.Vector3 | null;
  watchW: number;
  watchLeft: number;
  watchYaw: number;
  watchPitch: number;
  /** Idle life: time to the next fidget, and a yawn in progress. */
  quirkIn: number;
  yawn: number;
  stepT: number;
};

export function hands(
  parts: Pick<
    Hands,
    "base" | "faces" | "wave" | "protest" | "shadow" | "cast" | "skin" | "limp"
  >,
  rand: () => number
): Hands {
  return {
    ...parts,
    mode: "seat",
    lit: 0,
    protestW: 0,
    limpW: 0,
    hold: new THREE.Vector3(),
    holdAim: new THREE.Vector3(),
    holdV: new THREE.Vector3(),
    aimV: new THREE.Vector3(),
    aimPrev: new THREE.Vector3(),
    out: false,
    waveIn: 0,
    grabOff: new THREE.Vector3(),
    headH: 2.8,
    sw: new THREE.Vector2(),
    swV: new THREE.Vector2(),
    vel: new THREE.Vector2(),
    lift: 0,
    vy: 0,
    wait: 0,
    hop: false,
    squash: 0,
    shotW: 0,
    shotLeft: 0,
    mood: [0, 0],
    moodOn: false,
    gasp: 0,
    gaspIn: 0,
    cheer: 0,
    alarm: false,
    watch: null,
    watchW: 0,
    watchLeft: 0,
    watchYaw: 0,
    watchPitch: 0,
    quirkIn: 4 + rand() * 14,
    yawn: 0,
    stepT: 0,
  };
}

/** Plays the wave clip over the loops (idle, walk, run) once; ignored while one is already running. */
export function startShot(w: Walker) {
  if (!w.wave || w.shotLeft > 0) return;
  w.wave.reset().play();
  w.shotLeft = Math.min(w.wave.getClip().duration, 2.2);
}

const headAt = new THREE.Vector3();
const feet = new THREE.Vector3();
const top = new THREE.Vector3();

/** Is the cursor (x, y in -1..1, y up) on this robot? A capsule from its feet to its head, so it holds however the robot is tilted. */
export function overRobot(
  x: number,
  y: number,
  camera: THREE.Camera,
  aspect: number,
  w: Walker
) {
  feet.copy(w.robot.position).project(camera);
  top
    .set(0, 3.1 * w.base, 0)
    .applyQuaternion(w.robot.quaternion)
    .add(w.robot.position)
    .project(camera);
  if (feet.z > 1 || top.z > 1) return false;
  const ax = feet.x * aspect;
  const bx = top.x * aspect;
  const dx = bx - ax;
  const dy = top.y - feet.y;
  const len2 = dx * dx + dy * dy || 1e-6;
  const px = x * aspect - ax;
  const py = y - feet.y;
  const t = THREE.MathUtils.clamp((px * dx + py * dy) / len2, 0, 1);
  const r = 0.24 * Math.sqrt(len2) + 0.02;
  return Math.hypot(px - dx * t, py - dy * t) < r;
}

/** Picks a robot up by the head: the hand takes the head where it is, so nothing jumps, and the body hangs below. */
export function pickUp(w: Walker, planeHit: THREE.Vector3 | null) {
  if (w.head) w.head.getWorldPosition(headAt);
  else headAt.set(0, w.headH * w.base, 0).add(w.robot.position);
  w.hold.copy(headAt);
  w.holdAim.copy(headAt);
  w.headH = Math.max(headAt.distanceTo(w.robot.position) / w.base, 1);
  if (planeHit) w.grabOff.copy(headAt).sub(planeHit);
  else w.grabOff.set(0, 0, 0);
  w.holdV.set(w.vel.x, w.vy, w.vel.y);
  w.aimPrev.copy(headAt);
  w.aimV.copy(w.holdV);
  w.out = false;
  w.mode = "held";
  w.hop = false;
  w.gasp = 0;
  w.shotLeft = 0;
  play("pop");
}

/** Cap on how fast a robot can be thrown (units/s). */
const THROW_MAX = 30;

/** Lets go: it keeps the speed of the hand and flies, then lands and walks home. Whoever stood close claps. */
export function letGo(
  w: Walker,
  all: readonly Walker[],
  near: number,
  reduced: boolean
) {
  for (const o of all) {
    o.alarm = false;
    if (o === w) continue;
    if (o.watch === w.robot.position) o.watch = null;
  }
  if (reduced) {
    w.mode = "seat";
    reset(w);
    return;
  }
  // It leaves the hand at the hand's own speed, not at the lagging head's.
  const speed = w.aimV.length();
  w.holdV.copy(w.aimV);
  if (speed > THROW_MAX) w.holdV.multiplyScalar(THROW_MAX / speed);
  w.vel.set(w.holdV.x, w.holdV.z);
  w.vy = w.holdV.y;
  // The swing it had in the hand fades; it does not turn into a spin.
  w.swV.multiplyScalar(0.3);
  w.mode = "fall";
  w.wait = 0.5;
}

/** Has it left the picture (sideways, or over the top)? */
export function offScreen(w: Walker, camera: THREE.Camera) {
  feet.copy(w.robot.position).project(camera);
  return Math.abs(feet.x) > 1.08 || feet.y > 1.1;
}

/** A robot was thrown clear out of the screen: part of the crowd waves it off, each a moment apart. */
export function sendOff(gone: Walker, all: readonly Walker[]) {
  gone.out = true;
  for (const o of all) {
    if (o === gone || o.mode !== "seat" || o.last < 1 || o.cheer > 0) continue;
    if (!o.robot.visible || Math.random() > 0.5) continue;
    o.cheer = 1.8;
    o.waveIn = Math.random() * 1.1;
  }
}

/** Back to a plain standing robot: no height, no speed, no swing. */
export function reset(w: Walker) {
  w.lift = w.vy = 0;
  w.vel.set(0, 0);
  w.holdV.set(0, 0, 0);
  w.sw.set(0, 0);
  w.swV.set(0, 0);
}

/** While `held` is lifted, robots within `near` of it watch it in alarm; the rest relax. */
export function alarmNear(held: Walker, all: readonly Walker[], near: number) {
  for (const o of all) {
    if (o === held) continue;
    const close = o.mode === "seat" && o.at.distanceTo(held.at) < near;
    if (close && !o.alarm) {
      o.alarm = true;
      o.watch = held.robot.position;
    } else if (!close && o.alarm) {
      o.alarm = false;
      o.watch = null;
    }
  }
}

/** Part of the room goes "ooh": startled brows after a short random delay, and some hop. */
export function startle(all: readonly Walker[], reduced: boolean) {
  for (const w of all) {
    if (w.mode !== "seat" || w.last < 1 || Math.random() > 0.15) continue;
    w.gaspIn = Math.random() * 1.4;
    w.hop = !reduced && Math.random() < 0.2;
  }
}
