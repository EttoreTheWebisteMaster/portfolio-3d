import * as THREE from "three";

import type { Pose } from "./walkPose";
import { PALETTE } from "./HeroRobot";

/** The clips the walk-out scrubs by hand: their time is the shot's progress or distance, never the clock. */
export type Moves = {
  sit: THREE.AnimationAction | null;
  walk: THREE.AnimationAction | null;
  idle: THREE.AnimationAction | null;
};

export function makeMoves(
  mixer: THREE.AnimationMixer,
  clips: THREE.AnimationClip[]
): Moves {
  const held = (name: string) => {
    const clip = THREE.AnimationClip.findByName(clips, name);
    if (!clip) return null;
    const action = mixer.clipAction(clip);
    action.timeScale = 0;
    action.setEffectiveWeight(0);
    action.play();
    return action;
  };
  const idle = THREE.AnimationClip.findByName(clips, "Idle");
  return {
    sit: held("Sitting"),
    walk: held("Walking"),
    idle: idle ? mixer.clipAction(idle) : null,
  };
}

/** Blends seated / walking / idle for a pose. `seat` is how much he is in his seat (0 on Home, 1 in the audience). */
export function driveMoves(moves: Moves, pose: Pose, seat: number) {
  const { sit, walk, idle } = moves;
  sit?.setEffectiveWeight(seat * (1 - pose.moving));
  if (sit) sit.time = sit.getClip().duration * (1 - pose.stand);
  walk?.setEffectiveWeight(pose.moving);
  if (walk) walk.time = pose.phase * walk.getClip().duration;
  idle?.setEffectiveWeight((1 - pose.moving) * (1 - seat));
}

export function resetMoves(moves: Moves) {
  moves.sit?.setEffectiveWeight(0);
  moves.walk?.setEffectiveWeight(0);
  moves.idle?.setEffectiveWeight(1);
}

type Coat = {
  m: THREE.MeshPhysicalMaterial;
  steel: { color: THREE.Color; metalness: number; roughness: number };
  paint: { color: THREE.Color; metalness: number; roughness: number };
};

export function makeCoats(made: Map<string, THREE.MeshPhysicalMaterial>) {
  return [...made.entries()].map(([name, m]): Coat => ({
    m,
    steel: {
      color: m.color.clone(),
      metalness: m.metalness,
      roughness: m.roughness,
    },
    paint: {
      color: new THREE.Color(PALETTE[name].color),
      metalness: PALETTE[name].metalness,
      roughness: PALETTE[name].roughness,
    },
  }));
}

/** His paint from the hero's polished metal (0) to the matte palette (1). */
export function paintCoats(coats: Coat[], k: number) {
  for (const { m, steel, paint } of coats) {
    m.color.lerpColors(steel.color, paint.color, k);
    m.metalness = THREE.MathUtils.lerp(steel.metalness, paint.metalness, k);
    m.roughness = THREE.MathUtils.lerp(steel.roughness, paint.roughness, k);
  }
}
