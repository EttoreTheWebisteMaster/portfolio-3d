import type * as THREE from "three";

/** The layer the front canvas draws: the crowd's bodies sit on it (and off layer 0) while it is the one drawing them. */
export const FRONT_LAYER = 1;

/** What the main canvas shares with the one over the Projects page, so the crowd can walk in front of the programme. */
export const front = {
  scene: null as THREE.Scene | null,
  camera: null as THREE.Camera | null,
  /** The crowd's bodies and the floor pools, as one branch: all the front canvas needs compiled. */
  root: null as THREE.Scene | null,
  /** Builds the front canvas's shaders for the crowd. Called while the loader's warm-up has the room's lights in, since a light count is part of every lit program. */
  compile: () => {},
  /** Moves the crowd between the main canvas (`false`) and the front one (`true`). */
  carry: (_on: boolean) => {},
  /** The grade's vignette as the main canvas has it this frame, so the robots in front fall into the dark the same way. */
  vignette: { offset: 0.2, darkness: 0.65 },
};
