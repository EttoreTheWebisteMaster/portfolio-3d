import * as THREE from "three";

import { ease, journey, seg } from "@/lib/journey";
import { pointer } from "@/lib/pointer";

/** The Contact set is parked far to the other side from About, so no light reaches it. */
export const ORIGIN = new THREE.Vector3(-200, 0, 0);
/** Journey position where About cuts to Contact, in the gap between their copy. */
export const CONTACT_AT = 2.5;

/** Is the camera on Contact? Read by the rig and the grade. */
export const onContact = () => journey.current >= CONTACT_AT;

export const LOOK_Y = 1.1;
const CAMERA = { y: 0.7, distance: 7.4, fov: 28 };

/** World half-width the lens sees at `depth` in front of the camera, for this viewport. */
export const halfView = (depth: number, aspect: number) =>
  depth * Math.tan(THREE.MathUtils.degToRad(CAMERA.fov / 2)) * aspect;

/** Distance from the camera to a point at world z. */
export const depthAt = (z: number) => CAMERA.distance - z;

/** 0 → 1 as Contact arrives: the lamp comes up out of the tunnel's black while the camera drifts down and in. */
export const arrival = () => seg(journey.current, [CONTACT_AT, 2.9]);

/** The lamp's strength: it comes up out of the black like a big old fixture catching: a few stutters, then it holds. Driven by the journey, so it plays the same backwards. */
export function lampRise() {
  const pos = journey.current;
  const stutter = Math.sin(pos * 520) > -0.25 ? 1 : 0.2;
  const hold = seg(pos, [CONTACT_AT + 0.1, CONTACT_AT + 0.22]);
  // It never starts from nothing: the dimmed lamp is already there when the camera comes out of the tunnel.
  return (
    THREE.MathUtils.lerp(0.2, 1, ease(seg(pos, [CONTACT_AT, 2.75]))) *
    THREE.MathUtils.lerp(stutter, 1, hold)
  );
}

/** A landing's kick, decaying: close landings shake the frame and punch the lens in. */
export const shake = { v: 0 };
/** The lamp flaring as a big robot hits the beam, decaying. */
export const flash = { v: 0 };

/** The Contact frame: a low camera across a dark floor. It arrives from higher and further back at one steady speed, then rests; the cursor leans it a touch. */
export function contactCamera(
  camera: THREE.PerspectiveCamera,
  time: number,
  dt: number,
  decay = true
) {
  const a = arrival();
  // Two canvases share this frame; only one lets the kicks die away.
  if (decay) {
    shake.v *= Math.exp(-7 * dt);
    flash.v *= Math.exp(-3.5 * dt);
  }
  // The lens punches in on an impact, and settles.
  camera.fov = CAMERA.fov - shake.v * 0.8;
  const kick = Math.sin(time * 37) * shake.v * 0.03;
  // Handheld: a slow, wide sway and a breath of roll, so the frame is never dead.
  const sway = a;
  camera.position.set(
    ORIGIN.x + pointer.x * 0.15 + Math.sin(time * 0.21) * 0.12 * sway,
    THREE.MathUtils.lerp(2.3, CAMERA.y, a) -
      pointer.y * 0.06 +
      kick +
      Math.sin(time * 0.17) * 0.05 * sway,
    THREE.MathUtils.lerp(CAMERA.distance + 3.2, CAMERA.distance, a) +
      Math.sin(time * 0.13) * 0.18 * sway
  );
  camera.lookAt(ORIGIN.x, THREE.MathUtils.lerp(0.7, LOOK_Y, a), 0);
  camera.rotateZ(Math.sin(time * 0.15) * 0.008 * sway + kick * 0.2);
  camera.updateProjectionMatrix();
}

/** Where robots have landed this frame; the air layer turns each into a puff of dust, and into sparks when it landed in the beam (`lit`). */
export const landings: {
  x: number;
  y: number;
  z: number;
  lit: boolean;
  power: number;
}[] = [];

/** The lamp, hanging just above the top-left corner out of frame, and where its beam lands on the floor. */
export const LAMP = new THREE.Vector3(ORIGIN.x - 3.8, 5.6, 1.6);
export const AIM = new THREE.Vector3(ORIGIN.x + 0.6, 0, -0.4);
/** Radius of the pool of light on the floor, in world units. */
export const POOL = 2.4;
