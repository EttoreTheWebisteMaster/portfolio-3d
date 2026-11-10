import * as THREE from "three";

import { play } from "@/lib/sound";

import { emitDust, GRAVITY, ROOM } from "./crowdHands";
import type { Walker } from "./crowdWalk";

/** The hand pulls the head with a spring (stiffness, damping): quick to follow, never a snap. */
const SPRING = 1100;
const SPRING_DAMP = 2 * Math.sqrt(SPRING);
/** Pendulum: the body's centre of mass hangs this share of the way down, and the swing loses this much per second. */
const CENTRE = 0.6;
const SWING_DAMP = 2;
const MAX_SWING = 0.9;
/** Landing: how much of the fall speed bounces back, and the speed under which it stays down. */
const BOUNCE = 0.18;
const REST_SPEED = 0.5;
/** On the floor the body is stood upright by a stiff spring; in the air it tumbles free. */
const UPRIGHT = 45;
/** In the air it only leans into its flight, head first, as gently as a body does; it never spins. */
const GLIDE = 10;
const LEAN = 0.03;
const MAX_LEAN = 0.35;

const acc = new THREE.Vector3();
const before = new THREE.Vector3();

/** One axis of the body swinging from the head: gravity pulls it back, and the head's acceleration drags it behind. */
export function pendulum(
  angle: number,
  rate: number,
  pivotAcc: number,
  lift: number,
  length: number,
  dt: number,
  damping = SWING_DAMP,
  limit = MAX_SWING
) {
  const alpha =
    -((GRAVITY + lift) / length) * Math.sin(angle) -
    (pivotAcc / length) * Math.cos(angle) -
    damping * rate;
  let v = rate + alpha * dt;
  let a = angle + v * dt;
  if (Math.abs(a) > limit) {
    a = Math.sign(a) * limit;
    v = 0;
  }
  return [a, v] as const;
}

/**
 * In the hand: the head follows the cursor on a spring, and the body hangs from it like a pendulum,
 * swinging out when the hand moves and swaying back. The hand's velocity is kept for the throw.
 */
export function holdStep(w: Walker, dt: number) {
  // How fast the hand itself is moving, smoothed over about a twentieth of a second: a throw leaves with this.
  if (dt > 0) {
    acc.copy(w.holdAim).sub(w.aimPrev).divideScalar(dt);
    if (acc.length() > 60) acc.setLength(60);
    w.aimV.lerp(acc, 1 - Math.exp(-18 * dt));
  }
  w.aimPrev.copy(w.holdAim);
  const steps = Math.max(1, Math.ceil(dt * 120));
  const h = Math.min(dt, 1 / 20) / steps;
  const length = Math.max(w.headH * w.base * CENTRE, 0.5);
  for (let i = 0; i < steps; i++) {
    before.copy(w.holdV);
    acc
      .copy(w.holdAim)
      .sub(w.hold)
      .multiplyScalar(SPRING)
      .addScaledVector(w.holdV, -SPRING_DAMP);
    w.holdV.addScaledVector(acc, h);
    w.hold.addScaledVector(w.holdV, h);
    // The pivot's acceleration is what the body feels.
    acc.copy(w.holdV).sub(before).divideScalar(h);
    [w.sw.x, w.swV.x] = pendulum(w.sw.x, w.swV.x, acc.x, acc.y, length, h);
    [w.sw.y, w.swV.y] = pendulum(w.sw.y, w.swV.y, acc.z, acc.y, length, h);
  }
}

/**
 * Thrown: flies under gravity with the speed of the hand, bounces off the floor and the room's walls,
 * slides to a stop, gets back on its feet, and after a beat starts walking home. Moves `here` (its ground point).
 */
export function flight(w: Walker, here: THREE.Vector2, dt: number) {
  w.vy -= GRAVITY * dt;
  w.lift += w.vy * dt;
  here.addScaledVector(w.vel, dt);

  if (w.lift <= 0) {
    const hit = -w.vy;
    w.lift = 0;
    if (hit > 2.5) {
      w.vy = hit * BOUNCE;
      w.vel.multiplyScalar(0.85);
      emitDust(here.x, here.y, Math.min(8, Math.round(hit * 0.5)), hit * 0.08);
      if (hit > 4) play("thud");
    } else w.vy = 0;
  }
  const onFloor = w.lift === 0 && w.vy === 0;

  // The walls of the room: bounce, losing some speed.
  const wall = (v: number, lo: number, hi: number, axis: "x" | "y") => {
    if (v >= lo && v <= hi) return v;
    w.vel[axis] *= -0.3;
    return THREE.MathUtils.clamp(v, lo, hi);
  };
  here.x = wall(here.x, -ROOM.x, ROOM.x, "x");
  here.y = wall(here.y, ROOM.far, ROOM.near, "y");
  if (w.lift > ROOM.ceiling) {
    w.lift = ROOM.ceiling;
    w.vy = Math.min(w.vy, 0);
  }

  // Friction on the floor drags it to a stop; the air barely does.
  w.vel.multiplyScalar(Math.exp(-(onFloor ? 5 : 0.15) * dt));
  const speed = w.vel.length();
  if (onFloor && speed > 2) {
    w.stepT -= dt;
    if (w.stepT <= 0) {
      w.stepT = 0.1;
      emitDust(here.x, here.y, 2, 0.5);
    }
  }

  // Upright on the floor; in the air, leaning into the flight. Both are critically damped springs: no overshoot, no circles.
  const grounded = w.lift < 0.15;
  const k = grounded ? UPRIGHT : GLIDE;
  for (const axis of ["x", "y"] as const) {
    const lean = grounded
      ? 0
      : THREE.MathUtils.clamp(-w.vel[axis] * LEAN, -MAX_LEAN, MAX_LEAN);
    w.swV[axis] +=
      (k * (lean - w.sw[axis]) - 2 * Math.sqrt(k) * w.swV[axis]) * dt;
    w.sw[axis] += w.swV[axis] * dt;
  }

  const settled =
    onFloor && speed < REST_SPEED && Math.abs(w.sw.x) + Math.abs(w.sw.y) < 0.12;
  if (settled) {
    w.vel.set(0, 0);
    w.wait -= dt;
    if (w.wait <= 0) w.mode = "back";
  } else w.wait = Math.max(w.wait, 0.4);
}
