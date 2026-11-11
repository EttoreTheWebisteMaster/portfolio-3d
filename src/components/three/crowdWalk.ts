import * as THREE from "three";

import { BEAT, ease, seg, TRANSITION_SECONDS } from "@/lib/journey";
import { pointer } from "@/lib/pointer";
import { view } from "@/lib/projects";

import { FLOOR_Y } from "./HeroLight";
import { setBrows } from "./robotLook";

/** Seats sit in this patch of floor; the camera sees about this much sideways per unit of depth. */
const VIEW_SLOPE = 0.75;
const VIEW_MARGIN = 3;
/** Depth of the camera on Home, for working out where the frame ends. */
const CAM_Z = 7.4;
/** World speed (units/s) one cycle of each clip covers; the clip is sped up or slowed to match the ground. */
const WALK_SPEED = 2;
const RUN_SPEED = 5;
/** Ground speed (units/s) where the gait starts to hand over from walk to run, and where it is all run. */
const RUN_FROM = 3.2;
const RUN_FULL = 5;
/** Anyone with no more than this far to go from the edge of the frame strolls in; the rest run in. */
const STROLL_BELOW = 9.5;

import { emitDust, GRAVITY, type Hands, reset, startShot } from "./crowdHands";
import { lightFrom } from "./crowdLight";
import { limpStep } from "./crowdLimp";
import { flight, holdStep } from "./crowdPhysics";

export type Walker = Hands & {
  robot: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  idle: THREE.AnimationAction;
  walk: THREE.AnimationAction;
  run: THREE.AnimationAction;
  from: THREE.Vector2;
  bend: THREE.Vector2;
  to: THREE.Vector2;
  start: number;
  end: number;
  /** 0 = steady pace all the way; higher = a sprint in that settles into a walk. */
  burst: number;
  facing: number;
  yaw: number;
  at: THREE.Vector2;
  speed: number;
  sign: 1 | -1;
  last: number;
  /** The head bone and its pose looking straight ahead. */
  head?: THREE.Object3D;
  gaze: THREE.Quaternion;
  /** 0 = head free to follow the animation, 1 = settled on the screen. Eased, so it never snaps. */
  look: number;
};

function angleLerp(a: number, b: number, t: number) {
  const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + d * t;
}

/**
 * One robot: it waits beyond the edge of the frame at its depth, then crosses to its seat on a curved line.
 * Far to go means a sprint that settles into a walk; near means a stroll. It is never faded in.
 */
export function plan(seat: THREE.Vector2, rand: () => number) {
  const side = seat.x < 0 ? -1 : 1;
  const edge = VIEW_SLOPE * Math.max(CAM_Z - seat.y, 1) + VIEW_MARGIN;
  const from = new THREE.Vector2(
    side * (Math.max(Math.abs(seat.x), edge) + 1 + rand() * 2),
    seat.y + (rand() - 0.5) * 3
  );
  const dist = from.distanceTo(seat);
  // A real crowd is mixed: near the edge they stroll in at their own pace; further out they run, then ease into a walk.
  const stroll = dist <= STROLL_BELOW;
  const pace = stroll ? 2.6 + rand() * 0.9 : 4.5 + rand() * 2;
  const burst = stroll
    ? rand() * 0.15
    : THREE.MathUtils.clamp((dist - 6) / 14, 0.2, 0.5);
  const span = THREE.MathUtils.clamp(
    dist / pace / TRANSITION_SECONDS,
    0.25,
    BEAT.walk[1] - BEAT.walk[0]
  );
  const latest = BEAT.walk[1] - span;
  const start = BEAT.walk[0] + rand() * Math.max(latest - BEAT.walk[0], 0);
  // Bow the line sideways so nobody marches in dead straight.
  const mid = from.clone().lerp(seat, 0.5);
  const dir = seat.clone().sub(from).normalize();
  const bend = mid.add(
    new THREE.Vector2(-dir.y, dir.x).multiplyScalar((rand() - 0.5) * 5)
  );
  return { from, bend, start, end: start + span, burst };
}

const smooth = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** How much of the true upward angle to the screen the head takes. */
const LIFT = 0.15;
/** A seated head turns only part of the way to the screen (the body already faces it), and never past this. */
const SHARE = 0.55;
const MAX_TURN = THREE.MathUtils.degToRad(40);
/** How fast the head settles onto the screen, per second: about a second to turn. */
const SETTLE = 4;
const eye = new THREE.Vector3();
const dir = new THREE.Vector3();
const axis = new THREE.Vector3();
const ahead = new THREE.Vector3();
const turn = new THREE.Quaternion();
const parentQ = new THREE.Quaternion();
const gazeQ = new THREE.Quaternion();

/**
 * The head's pose when looking at the screen's centre: the straight-ahead pose, turned by the angle
 * between where the robot faces and where the screen is. Reads last frame's matrices, which is plenty for a head.
 */
function gazeAtScreen(w: Walker) {
  const head = w.head;
  if (!head?.parent) return w.gaze;
  head.getWorldPosition(eye);
  dir.set(view.screen.x, view.screen.y, view.screen.z).sub(eye);
  // The screen sits high, but a head only tips up a little: keep the turn, soften the lift.
  dir.y *= LIFT;
  dir.normalize();
  ahead.set(0, 0, 1).applyQuaternion(w.robot.quaternion);
  turn.setFromUnitVectors(ahead, dir);
  const angle = 2 * Math.acos(Math.min(Math.abs(turn.w), 1));
  if (angle > 1e-4)
    turn.setFromAxisAngle(
      axis.crossVectors(ahead, dir).normalize(),
      Math.min(angle * SHARE, MAX_TURN)
    );
  head.parent.getWorldQuaternion(parentQ);
  // local = parent⁻¹ · turn · parent · straight-ahead
  return gazeQ
    .copy(parentQ)
    .invert()
    .multiply(turn)
    .multiply(parentQ)
    .multiply(w.gaze);
}

const here = new THREE.Vector2();
const slope = new THREE.Vector2();
const rest = new THREE.Vector2();
const toSeat = new THREE.Vector2();
const euler = new THREE.Euler();
const offQ = new THREE.Quaternion();
const robotQ = new THREE.Quaternion();
const YAWN = 1.4;
const UP = new THREE.Vector3(0, 1, 0);
const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Z = new THREE.Vector3(0, 0, 1);
const swingQ = new THREE.Quaternion();
const swingY = new THREE.Quaternion();

/** Turns an idle robot's head to a random neighbour for a moment. */
function glance(w: Walker, all: readonly Walker[]) {
  const near = all.filter(
    o =>
      o !== w &&
      o.mode === "seat" &&
      o.robot.visible &&
      o.at.distanceTo(w.at) < 7
  );
  if (near.length === 0) return;
  w.watch = near[Math.floor(Math.random() * near.length)].robot.position;
  w.watchLeft = 1.4 + Math.random() * 1.6;
}

/** The head's turn (yaw, pitch) on top of its pose: a little toward the cursor, or toward whoever it is watching. */
function headOffset(w: Walker, head: THREE.Object3D) {
  let yaw = -pointer.x * 0.25;
  let pitch = pointer.y * 0.15;
  if (w.watch) {
    head.getWorldPosition(eye);
    dir.set(w.watch.x, w.watch.y + 2.2, w.watch.z).sub(eye);
    dir.applyQuaternion(robotQ.copy(w.robot.quaternion).invert());
    w.watchYaw = THREE.MathUtils.clamp(Math.atan2(dir.x, dir.z), -0.9, 0.9);
    w.watchPitch = THREE.MathUtils.clamp(
      Math.atan2(-dir.y, Math.hypot(dir.x, dir.z)),
      -0.4,
      0.5
    );
  }
  yaw = THREE.MathUtils.lerp(yaw, w.watchYaw, w.watchW);
  pitch = THREE.MathUtils.lerp(pitch, w.watchPitch, w.watchW);
  // A yawn tips the head back and returns, one smooth swing.
  if (w.yawn > 0) pitch -= 0.4 * Math.sin(Math.PI * (1 - w.yawn / YAWN));
  return { yaw, pitch };
}

/**
 * Moves one robot along the journey. Gait follows its real ground speed: idle, walk, run, and back,
 * with the clips timed to the floor so feet don't slide. It always faces where it is heading, so a
 * reversed journey sends it walking out, not moonwalking. On arrival it turns to the screen.
 * Once seated it can be picked up (held), dropped (fall) and walk home (back); those use the same gait.
 */
export function advance(
  w: Walker,
  p: number,
  dt: number,
  all: readonly Walker[]
) {
  const t = seg(p, [w.start, w.end]);
  if (Math.abs(t - w.last) > 1e-5) w.sign = t > w.last ? 1 : -1;
  w.last = t;
  // Scrolled back out while being handled: it simply rejoins the walk.
  if (t < 1 && w.mode !== "seat") {
    w.mode = "seat";
    reset(w);
    w.alarm = false;
  }

  let target: number;
  if (w.mode === "seat") {
    // Front-loaded speed: quick off the mark, easing into a walk, a soft stop.
    const u = THREE.MathUtils.lerp(t, 1 - (1 - t) ** 2, w.burst);
    const v = 1 - u;
    here
      .copy(w.from)
      .multiplyScalar(v * v)
      .addScaledVector(w.bend, 2 * v * u)
      .addScaledVector(w.to, u * u);
    slope
      .copy(w.bend)
      .sub(w.from)
      .multiplyScalar(2 * v)
      .addScaledVector(rest.copy(w.to).sub(w.bend), 2 * u);

    // Still waiting beyond the frame: nothing to draw or animate until its turn comes.
    if (t <= 0) {
      w.robot.visible = false;
      w.shadow.visible = false;
      w.speed = 0;
      w.at.copy(here);
      return;
    }
    const travel = Math.atan2(slope.x, slope.y) + (w.sign < 0 ? Math.PI : 0);
    target = angleLerp(travel, w.facing, ease(seg(t, [0.82, 1])));
  } else {
    here.copy(w.at);
    target = w.facing;
    if (w.mode === "held") holdStep(w, dt);
    else if (w.mode === "fall") flight(w, here, dt);
    else if (w.mode === "back") {
      toSeat.copy(w.to).sub(here);
      const dist = toSeat.length();
      if (dist < 0.03) {
        here.copy(w.to);
        w.mode = "seat";
      } else {
        const pace = THREE.MathUtils.clamp(2 + dist * 0.8, 2, 5.5);
        here.addScaledVector(toSeat, Math.min(dist, pace * dt) / dist);
        target = angleLerp(
          Math.atan2(toSeat.x, toSeat.y),
          w.facing,
          smooth(1.5, 0.2, dist)
        );
        w.stepT -= dt;
        if (w.stepT <= 0) {
          w.stepT = 0.2;
          emitDust(here.x, here.y, 2, 0.4);
        }
      }
    }
    // Back on its feet: whatever swing is left dies away.
    if (w.mode !== "held" && w.mode !== "fall") {
      w.sw.multiplyScalar(Math.exp(-10 * dt));
      w.swV.set(0, 0);
    }
  }
  w.robot.visible = true;

  const vx = dt > 0 ? (here.x - w.at.x) / dt : 0;
  const vz = dt > 0 ? (here.y - w.at.y) / dt : 0;
  if (dt > 0) {
    const ground = Math.hypot(vx, vz);
    w.speed += (ground - w.speed) * (1 - Math.exp(-12 * dt));
  }
  w.at.copy(here);

  // A hop in the seat.
  if (w.mode === "seat" && (w.lift > 0 || w.vy !== 0)) {
    w.vy -= GRAVITY * dt;
    w.lift += w.vy * dt;
    if (w.lift <= 0) {
      w.lift = w.vy = 0;
      w.squash = 0.08;
      emitDust(here.x, here.y, 3, 0.4);
    }
  }

  w.yaw = angleLerp(w.yaw, target, 1 - Math.exp(-10 * Math.max(dt, 0)));
  // Facing, then swung out of upright (hanging, tumbling) about the world axes.
  w.robot.quaternion.setFromAxisAngle(UP, w.yaw);
  w.robot.quaternion.premultiply(
    swingQ
      .setFromAxisAngle(AXIS_Z, w.sw.x)
      .multiply(swingY.setFromAxisAngle(AXIS_X, -w.sw.y))
  );
  if (w.mode === "held") {
    // Hung by the head: the feet are wherever the body swings to, never under the floor.
    offQ.copy(w.robot.quaternion);
    w.robot.position
      .copy(w.hold)
      .sub(eye.set(0, w.headH * w.base, 0).applyQuaternion(offQ));
    w.robot.position.y = Math.max(w.robot.position.y, FLOOR_Y);
    here.set(w.robot.position.x, w.robot.position.z);
    w.lift = w.robot.position.y - FLOOR_Y;
    w.at.copy(here);
  } else w.robot.position.set(here.x, FLOOR_Y + w.lift, here.y);
  w.shadow.visible = w.robot.visible;
  w.shadow.position.set(w.at.x, FLOOR_Y + 0.03, w.at.y);
  w.shadow.scale.setScalar(w.base / (1 + w.lift * 0.3));
  w.squash *= Math.exp(-9 * dt);
  w.robot.scale.set(
    w.base * (1 + w.squash * 0.5),
    w.base * (1 - w.squash),
    w.base * (1 + w.squash * 0.5)
  );

  const airborne = w.lift > 0.02 || w.mode === "held";
  const still = airborne ? 1 : 1 - smooth(0.25, 1, w.speed);
  const sprint = airborne ? 0 : smooth(RUN_FROM, RUN_FULL, w.speed);
  // A one-shot clip fades in over the loops, holds, and fades out before it ends.
  w.shotLeft = Math.max(0, w.shotLeft - dt);
  w.shotW += ((w.shotLeft > 0.3 ? 1 : 0) - w.shotW) * (1 - Math.exp(-10 * dt));
  // Held, it protests: "no, no, put me down".
  w.protestW +=
    ((w.mode === "held" ? 1 : 0) - w.protestW) * (1 - Math.exp(-9 * dt));
  w.limpW +=
    ((w.mode === "held" || w.mode === "fall" ? 1 : 0) - w.limpW) *
    (1 - Math.exp(-8 * dt));
  const loops = (1 - w.shotW) * (1 - w.protestW);
  if (w.protest) {
    if (w.protestW > 0.01) w.protest.setEffectiveWeight(w.protestW);
    else w.protest.setEffectiveWeight(0);
  }
  w.idle.setEffectiveWeight(still * loops);
  w.walk.setEffectiveWeight((1 - still) * (1 - sprint) * loops);
  w.run.setEffectiveWeight((1 - still) * sprint * loops);
  if (w.wave) {
    if (w.shotW > 0.01) w.wave.setEffectiveWeight(w.shotW);
    else if (w.wave.isRunning()) w.wave.stop();
  }
  w.walk.timeScale = THREE.MathUtils.clamp(w.speed / WALK_SPEED, 0.5, 1.8);
  w.run.timeScale = THREE.MathUtils.clamp(w.speed / RUN_SPEED, 0.8, 2.2);
  w.mixer.update(dt);
  lightFrom(w, p, dt);

  // Small moments of life: startled brows, a hop, a glance at a neighbour, a yawn.
  w.gasp = Math.max(0, w.gasp - dt);
  w.cheer = Math.max(0, w.cheer - dt);
  w.yawn = Math.max(0, w.yawn - dt);
  if (w.waveIn > 0) {
    w.waveIn -= dt;
    if (w.waveIn <= 0) startShot(w);
  }
  if (w.gaspIn > 0) {
    w.gaspIn -= dt;
    if (w.gaspIn <= 0) {
      w.gasp = 0.9;
      if (w.hop && w.mode === "seat" && w.lift === 0) w.vy = 3.4;
      w.hop = false;
    }
  }
  const settled = w.mode === "seat" && t >= 1 && still > 0.85;
  if (settled && !w.alarm && w.cheer === 0) {
    w.quirkIn -= dt;
    if (w.quirkIn <= 0) {
      w.quirkIn = 7 + Math.random() * 13;
      if (Math.random() < 0.7) glance(w, all);
      else w.yawn = w.gasp = YAWN;
    }
  }
  if (w.watch && !w.alarm) {
    w.watchLeft -= dt;
    if (w.watchLeft <= 0) w.watch = null;
  }
  w.watchW += ((w.watch ? 1 : 0) - w.watchW) * (1 - Math.exp(-6 * dt));

  const startled = w.mode !== "seat" || w.alarm || w.gasp > 0;
  const [surprised, kind] = startled
    ? [0.85, 0]
    : w.cheer > 0
      ? [0.3, 0.1]
      : [0, 0];
  const rate = startled ? 14 : 4;
  w.mood[0] = THREE.MathUtils.damp(w.mood[0], surprised, rate, dt);
  w.mood[1] = THREE.MathUtils.damp(w.mood[1], kind, rate, dt);
  const on = w.mood[0] + w.mood[1] > 0.004;
  if (on || w.moodOn) setBrows(w.faces, w.mood[0], w.mood[1]);
  w.moodOn = on;

  // Standing still, the head keeps looking at the centre of the screen; the idle clip would swing it around.
  // Held by the head, the head is the handle: it keeps the animation's pose and nothing else turns it.
  // The head turns to the screen as the robot arrives, in step with the walk, not after it: no waiting, no snap.
  const watching = w.mode === "seat" ? smooth(0.55, 0.95, t) : 0;
  const settleRate = w.mode === "seat" ? SETTLE : SETTLE * 6;
  w.look += (watching - w.look) * (1 - Math.exp(-settleRate * dt));
  if (w.head && w.look > 0.001) {
    const f = ease(w.look);
    w.head.quaternion.slerp(gazeAtScreen(w), f);
    const { yaw, pitch } = headOffset(w, w.head);
    w.head.quaternion.multiply(
      offQ.setFromEuler(euler.set(pitch * f, yaw * f, 0))
    );
  }
  limpStep(w, dt);
}
