import * as THREE from "three";

import { pendulum } from "./crowdPhysics";
import type { Walker } from "./crowdWalk";

/**
 * Each limb: its bones from the root down (the last name is only the point the final bone reaches for), which side of the body,
 * whether the middle joint is an elbow (folds forward) or a knee (folds back), and for legs the foot that hangs from the ankle.
 */
const LIMBS = [
  { names: ["UpperArmL", "LowerArmL", "Palm2L"], side: 1, joint: -1 },
  { names: ["UpperArmR", "LowerArmR", "Palm2R"], side: -1, joint: -1 },
  {
    names: ["UpperLegL", "LowerLegL", "LowerLegL_end"],
    side: 1,
    joint: 1,
    foot: "FootL",
  },
  {
    names: ["UpperLegR", "LowerLegR", "LowerLegR_end"],
    side: -1,
    joint: 1,
    foot: "FootR",
  },
] as const;
/** Smooth, slightly damped swing; the upper bone (shoulder, hip) may go this far from straight down. */
const DAMPING = 1.6;
const REACH = { arm: 1.9, leg: 0.95 };
/** A hand's width of ease: limbs hang a little away from the body, never ruler-straight. */
const SPLAY = { arm: 0.1, leg: 0.05 };
/** How far the elbow or knee may fold, and how far it rests folded: [rest, max] in radians. */
const FOLD = { arm: [0.3, 2.3], leg: [0.14, 2.0] } as const;
/** The toes droop by this much when the leg hangs. */
const TOE_DROOP = 0.45;
/** How fast each bone's acceleration is smoothed (per second), and the most it can be (units/s²). */
const SMOOTH = 22;
const MAX_ACC = 100;

type Bone = {
  bone: THREE.Object3D;
  /** Where the bone points, in its own space: toward the next bone. */
  axis: THREE.Vector3;
  /** Pendulum length, and how far it swings out of straight down (towards +x, towards +z) and how fast. */
  length: number;
  a: THREE.Vector2;
  v: THREE.Vector2;
  /** Where its joint was last frame, its velocity, and its smoothed acceleration: what the bone feels. */
  prev: THREE.Vector3;
  vel: THREE.Vector3;
  acc: THREE.Vector3;
};
type Foot = {
  bone: THREE.Object3D;
  ankle: THREE.Object3D;
  /** Its bind position in the parent: the clips animate the foot's rotation only, so this must be put back by hand. */
  rest: THREE.Vector3;
  /** The foot in the shin's own frame, as the animation poses it. */
  offset: THREE.Vector3;
  rel: THREE.Quaternion;
};
type Limb = {
  bones: Bone[];
  foot: Foot | null;
  side: number;
  arm: boolean;
  joint: number;
  primed: boolean;
};
export type Limp = Limb[];

const here = new THREE.Vector3();
const next = new THREE.Vector3();
const dir = new THREE.Vector3();
const axisW = new THREE.Vector3();
const lateral = new THREE.Vector3();
const flat = new THREE.Vector3();
const upper = new THREE.Vector3();
const cross = new THREE.Vector3();
const accNow = new THREE.Vector3();
const world = new THREE.Quaternion();
const goal = new THREE.Quaternion();
const parentQ = new THREE.Quaternion();
const shin = new THREE.Quaternion();
const spin = new THREE.Quaternion();

/** Finds a robot's limbs, so they can be let go limp. Null if the model lacks the bones. */
export function makeLimp(robot: THREE.Object3D): Limp | null {
  robot.updateMatrixWorld(true);
  const limbs: Limb[] = [];
  for (const spec of LIMBS) {
    const nodes = spec.names.map(n => robot.getObjectByName(n));
    const foot = "foot" in spec ? robot.getObjectByName(spec.foot) : null;
    if (nodes.some(n => !n) || ("foot" in spec && !foot)) return null;
    const bones = nodes.slice(0, -1).map((node, i): Bone => {
      const bone = node as THREE.Object3D;
      const to = nodes[i + 1] as THREE.Object3D;
      return {
        bone,
        axis: to.position.clone().normalize(),
        length: Math.max(
          bone.getWorldPosition(here).distanceTo(to.getWorldPosition(next)),
          0.4
        ),
        a: new THREE.Vector2(),
        v: new THREE.Vector2(),
        prev: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        acc: new THREE.Vector3(),
      };
    });
    limbs.push({
      bones,
      foot: foot
        ? {
            bone: foot,
            ankle: nodes[nodes.length - 1] as THREE.Object3D,
            rest: foot.position.clone(),
            offset: new THREE.Vector3(),
            rel: new THREE.Quaternion(),
          }
        : null,
      side: spec.side,
      arm: !("foot" in spec),
      joint: spec.joint,
      primed: false,
    });
  }
  return limbs;
}

/** Starts a limb from the pose the animation just gave it, so going limp never snaps. */
function prime(limb: Limb) {
  for (const b of limb.bones) {
    b.bone.getWorldQuaternion(world);
    axisW.copy(b.axis).applyQuaternion(world);
    b.a.set(Math.atan2(axisW.x, -axisW.y), Math.atan2(axisW.z, -axisW.y));
    b.v.set(0, 0);
    b.vel.set(0, 0, 0);
    b.acc.set(0, 0, 0);
    b.bone.getWorldPosition(b.prev);
  }
  limb.primed = true;
}

/** Remembers where the animation put the foot, in the shin's frame, as the shin is let go. */
function noteFoot(foot: Foot, shinBone: THREE.Object3D) {
  shinBone.getWorldQuaternion(shin).invert();
  foot.ankle.getWorldPosition(next);
  foot.bone.getWorldPosition(foot.offset).sub(next).applyQuaternion(shin);
  foot.bone.getWorldQuaternion(foot.rel);
  foot.rel.premultiply(shin);
}

/** The foot goes where the ankle went, keeping its pose against the shin, toes drooping. */
function carryFoot(foot: Foot, shinBone: THREE.Object3D, weight: number) {
  shinBone.getWorldQuaternion(shin);
  foot.ankle.getWorldPosition(here);
  here.add(next.copy(foot.offset).applyQuaternion(shin));
  world.copy(shin).multiply(foot.rel);
  world.premultiply(spin.setFromAxisAngle(lateral, TOE_DROOP * weight));
  const parent = foot.bone.parent;
  if (!parent) return;
  parent.getWorldQuaternion(parentQ);
  foot.bone.position
    .copy(foot.rest)
    .lerp(parent.worldToLocal(here), Math.min(1, weight));
  foot.bone.quaternion.copy(parentQ.invert().multiply(world));
  foot.bone.updateMatrixWorld(true);
}

/** Smoothed acceleration of a bone's joint, from where it has been: what makes it trail, lag and swing. */
function feel(b: Bone, dt: number) {
  b.bone.getWorldPosition(here);
  accNow.copy(here).sub(b.prev).divideScalar(dt);
  accNow.sub(b.vel).divideScalar(dt);
  if (accNow.length() > MAX_ACC) accNow.setLength(MAX_ACC);
  b.vel.copy(here).sub(b.prev).divideScalar(dt);
  b.acc.lerp(accNow, 1 - Math.exp(-SMOOTH * dt));
  b.prev.copy(here);
}

/**
 * Held or flying, arms and legs hang loose. The shoulder or hip is a pendulum under its own real acceleration, so it trails
 * behind the body, swings and settles. The elbow or knee is a hinge: it folds only the way a joint can, rests a little bent, and never
 * past its stop. Feet stay on the ankles and droop. Runs after the animation, blended in by `w.limpW`.
 */
export function limpStep(
  w: Pick<Walker, "limp" | "limpW" | "robot">,
  dt: number
) {
  const limp = w.limp;
  if (!limp) return;
  if (w.limpW < 0.01) {
    for (const limb of limp) {
      // Limp is over: the clip never moves the foot, so without this it stays where the leg last carried it, off the ankle.
      if (limb.primed && limb.foot)
        limb.foot.bone.position.copy(limb.foot.rest);
      limb.primed = false;
    }
    return;
  }
  w.robot.updateMatrixWorld(true);
  lateral.set(1, 0, 0).applyQuaternion(w.robot.quaternion);
  const step = Math.max(dt, 1 / 120);
  const substeps = Math.max(1, Math.ceil(step * 120));
  const h = Math.min(step, 1 / 20) / substeps;

  for (const limb of limp) {
    if (!limb.primed) {
      prime(limb);
      // Once, from the animation's pose: the foot is not animated while the leg is limp, so it must not be read again.
      if (limb.foot) noteFoot(limb.foot, limb.bones[1].bone);
    }
    const kind = limb.arm ? "arm" : "leg";

    let above: THREE.Vector3 | null = null;
    for (const b of limb.bones) {
      feel(b, step);
      for (let i = 0; i < substeps; i++) {
        [b.a.x, b.v.x] = pendulum(
          b.a.x,
          b.v.x,
          b.acc.x,
          b.acc.y,
          b.length,
          h,
          DAMPING,
          REACH[kind]
        );
        [b.a.y, b.v.y] = pendulum(
          b.a.y,
          b.v.y,
          b.acc.z,
          b.acc.y,
          b.length,
          h,
          DAMPING,
          REACH[kind]
        );
      }
      dir
        .set(
          Math.sin(b.a.x),
          -Math.cos(b.a.x) * Math.cos(b.a.y),
          Math.sin(b.a.y)
        )
        .normalize();

      if (above) {
        // The hinge: how far the free swing has folded the joint about the body's side-to-side axis, held to what the joint allows.
        upper
          .copy(above)
          .addScaledVector(lateral, -above.dot(lateral))
          .normalize();
        flat.copy(dir).addScaledVector(lateral, -dir.dot(lateral));
        const fold =
          flat.lengthSq() > 1e-6
            ? Math.atan2(
                lateral.dot(cross.crossVectors(upper, flat)),
                upper.dot(flat)
              )
            : 0;
        const [rest, max] = FOLD[kind];
        const angle =
          limb.joint * THREE.MathUtils.clamp(fold * limb.joint, rest, max);
        dir.copy(above).applyAxisAngle(lateral, angle);
      } else {
        // A touch of splay keeps the limb off the body.
        dir.addScaledVector(lateral, limb.side * SPLAY[kind]).normalize();
      }

      b.bone.getWorldQuaternion(world);
      axisW.copy(b.axis).applyQuaternion(world);
      goal.setFromUnitVectors(axisW, dir).multiply(world);
      world.slerp(goal, w.limpW);
      b.bone.parent?.getWorldQuaternion(parentQ);
      b.bone.quaternion.copy(parentQ.invert().multiply(world));
      b.bone.updateMatrixWorld(true);
      above = (above ?? new THREE.Vector3()).copy(dir);
    }
    if (limb.foot) carryFoot(limb.foot, limb.bones[1].bone, w.limpW);
  }
}
