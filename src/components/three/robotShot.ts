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

type Look = { color: THREE.Color; metalness: number; roughness: number };
type Coat = {
  m: THREE.MeshPhysicalMaterial;
  steel: Look;
  /** The audience's own paint: the palette, dimmed, with no clearcoat and little reflection. */
  crowd: Look;
  paint: Look;
};

/** The crowd's paint keeps this much of ROB-092's colour; he wears the same while he sits among them. */
export const CROWD_DIM = 0.34;

export function makeCoats(made: Map<string, THREE.MeshPhysicalMaterial>) {
  return [...made.entries()].map(([name, m]): Coat => {
    const paint: Look = {
      color: new THREE.Color(PALETTE[name].color),
      metalness: PALETTE[name].metalness,
      roughness: PALETTE[name].roughness,
    };
    return {
      m,
      steel: {
        color: m.color.clone(),
        metalness: m.metalness,
        roughness: m.roughness,
      },
      crowd: { ...paint, color: paint.color.clone().multiplyScalar(CROWD_DIM) },
      paint,
    };
  });
}

const base = new THREE.Color();

/** His paint: the hero's polished metal (both 0), the audience's dim paint (`crowd` 1), then the matte palette in daylight (`day` 1). */
export function paintCoats(coats: Coat[], crowd: number, day: number) {
  for (const { m, steel, crowd: dim, paint } of coats) {
    base.lerpColors(steel.color, dim.color, crowd);
    m.color.lerpColors(base, paint.color, day);
    const metal = THREE.MathUtils.lerp(steel.metalness, dim.metalness, crowd);
    m.metalness = THREE.MathUtils.lerp(metal, paint.metalness, day);
    const rough = THREE.MathUtils.lerp(steel.roughness, dim.roughness, crowd);
    m.roughness = THREE.MathUtils.lerp(rough, paint.roughness, day);
    m.envMapIntensity = THREE.MathUtils.lerp(0.9, 0.2, crowd * (1 - day));
  }
}

/** The projector's rim light on his edges, as on the rest of the audience (0 = none). */
export function rimCoats(coats: Coat[], amount: number) {
  for (const { m } of coats) {
    const rim = m.userData.rim as { value: number } | undefined;
    if (rim) rim.value = amount;
  }
}
