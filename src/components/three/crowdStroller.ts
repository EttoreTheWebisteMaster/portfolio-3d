import * as THREE from "three";

import { FLOOR_Y } from "./HeroLight";

/** Ground speed (units/s) one cycle of the walk clip covers. */
const WALK_SPEED = 2;
const SPEED = 2.2;
/** He crosses at this depth range: far enough back that his head shows over the front rows. */
const LANE = { near: -6, far: -12 };
/** Seconds between crossings, after the first. */
const EVERY = { min: 18, spread: 22 };

/** One extra figure who now and then crosses the whole crowd, side to side, and leaves the frame. */
export type Stroller = {
  robot: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  active: boolean;
  wait: number;
  x: number;
  z: number;
  dir: 1 | -1;
  edge: number;
};

export function makeStroller(
  robot: THREE.Object3D,
  clip: THREE.AnimationClip
): Stroller {
  const mixer = new THREE.AnimationMixer(robot);
  const walk = mixer.clipAction(clip);
  walk.timeScale = SPEED / WALK_SPEED;
  walk.play();
  robot.visible = false;
  return {
    robot,
    mixer,
    active: false,
    wait: 5 + Math.random() * 5,
    x: 0,
    z: 0,
    dir: 1,
    edge: 0,
  };
}

/** The lane (depth) that keeps furthest from every seat, out of a few random tries, so he threads the crowd instead of through it. */
function openLane(seats: readonly THREE.Vector2[]) {
  let best = LANE.near;
  let room = -1;
  for (let i = 0; i < 10; i++) {
    const z = LANE.far + Math.random() * (LANE.near - LANE.far);
    const gap = Math.min(...seats.map(s => Math.abs(s.y - z)));
    if (gap > room) {
      room = gap;
      best = z;
    }
  }
  return best;
}

/** `live` = the room is the page. He only walks while it is, and is hidden the instant it is not. */
export function stepStroller(
  s: Stroller,
  dt: number,
  live: boolean,
  seats: readonly THREE.Vector2[]
) {
  // Any transition (in or out) cuts his walk: he is never on screen unless the room is the page.
  if (!live) {
    s.active = false;
    s.robot.visible = false;
    s.wait = Math.max(s.wait, EVERY.min);
    return;
  }
  if (!s.active) {
    s.robot.visible = false;
    s.wait -= dt;
    if (s.wait > 0) return;
    s.active = true;
    s.dir = Math.random() < 0.5 ? 1 : -1;
    s.z = openLane(seats);
    // Starts just beyond the edge of the frame at his depth, so he is never seen appearing.
    s.edge = 0.51 * (7 - s.z) + 5;
    s.x = -s.dir * s.edge;
    s.robot.rotation.y = s.dir * (Math.PI / 2);
  }
  s.x += s.dir * SPEED * dt;
  s.robot.position.set(s.x, FLOOR_Y, s.z);
  s.robot.visible = true;
  s.mixer.update(dt);
  if (Math.abs(s.x) > s.edge) {
    s.active = false;
    s.robot.visible = false;
    s.wait = EVERY.min + Math.random() * EVERY.spread;
  }
}
