import * as THREE from "three";

import { ease, journey, seg } from "@/lib/journey";
import { pointer } from "@/lib/pointer";

/** The Contact set is parked far to the other side from About, so no light reaches it. */
export const ORIGIN = new THREE.Vector3(-200, 0, 0);
/** Journey position where About cuts to Contact, in the gap between their copy. */
export const CONTACT_AT = 2.5;

/** Is the camera on Contact? Read by the rig and the grade. */
export const onContact = () => journey.current >= CONTACT_AT;

const LOOK_Y = 1.1;
const CAMERA = { y: 0.7, distance: 7.4, fov: 28 };

/** The lens's focus on Contact: sharp at the middle of the room, going soft with distance both ways (the blur reaches its full size `range` units away from the focus), so the centre of the frame is where the eye goes. */
export const FOCUS = { distance: CAMERA.distance, range: 7, bokeh: 2.4 };

/** World half-width the lens sees at `depth` in front of the camera, for this viewport. */
export const halfView = (depth: number, aspect: number) =>
  depth * Math.tan(THREE.MathUtils.degToRad(CAMERA.fov / 2)) * aspect;

/** Distance from the camera to a point at world z. */
export const depthAt = (z: number) => CAMERA.distance - z;

/** 0 → 1 as Contact arrives: the lamp comes up out of the tunnel's black while the camera drifts down and in. */
const arrival = () => seg(journey.current, [CONTACT_AT, 3]);

/** 1 → 0 as the camera leaves Contact: the robots fade with the lamp, so the next visit starts with an empty floor. */
export const presence = () =>
  seg(journey.current, [CONTACT_AT + 0.02, CONTACT_AT + 0.22]);

/** Has the camera come to rest on Contact? */
export const settled = () => arrival() >= 1;

/** The lamp's strength: it comes up out of the black like a big old fixture catching: a few stutters, then it holds. Driven by the journey, so it plays the same backwards. */
export function lampRise() {
  const pos = journey.current;
  const stutter = Math.sin(pos * 520) > -0.25 ? 1 : 0.2;
  const hold = seg(pos, [CONTACT_AT + 0.2, CONTACT_AT + 0.4]);
  // It never starts from nothing: a dim filament is already there when the lens comes out of the black, and the lamp catches slowly.
  return (
    THREE.MathUtils.lerp(0.06, 1, ease(seg(pos, [CONTACT_AT + 0.05, 2.9]))) *
    THREE.MathUtils.lerp(stutter, 1, hold)
  );
}

/** The lens closing and opening: 0 → 1 as the eye goes dark, held in the black for a beat at the cut, then back to 0 slowly as the lamp catches. Multiplies the exposure of both canvases. */
export function blackout() {
  const pos = journey.current;
  return (
    ease(seg(pos, [CONTACT_AT - 0.16, CONTACT_AT - 0.03])) *
    (1 - ease(seg(pos, [CONTACT_AT + 0.07, CONTACT_AT + 0.36])))
  );
}

/** The Contact frame: a low camera across a dark floor. It arrives from higher and further back at one steady speed, then rests; the cursor leans it a touch. */
export function contactCamera(camera: THREE.PerspectiveCamera, time: number) {
  const a = arrival();
  camera.fov = CAMERA.fov;
  // Handheld: a slow, wide sway and a breath of roll, so the frame is never dead.
  const sway = a;
  camera.position.set(
    ORIGIN.x + pointer.x * 0.15 + Math.sin(time * 0.21) * 0.12 * sway,
    THREE.MathUtils.lerp(2.3, CAMERA.y, a) -
      pointer.y * 0.06 +
      Math.sin(time * 0.17) * 0.05 * sway,
    THREE.MathUtils.lerp(CAMERA.distance + 3.2, CAMERA.distance, a) +
      Math.sin(time * 0.13) * 0.18 * sway
  );
  camera.lookAt(ORIGIN.x, THREE.MathUtils.lerp(0.7, LOOK_Y, a), 0);
  camera.rotateZ(Math.sin(time * 0.15) * 0.008 * sway);
  camera.updateProjectionMatrix();
}

/** The lamp, hanging just above the top-left corner out of frame, and where its beam lands on the floor. */
export const LAMP = new THREE.Vector3(ORIGIN.x - 3.8, 5.6, 1.6);
export const AIM = new THREE.Vector3(ORIGIN.x + 0.6, 0, -0.4);
