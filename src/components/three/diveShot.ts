import * as THREE from "three";

import { diveState, LAND_SCALE } from "@/lib/caseStudy";
import { view } from "@/lib/projects";

/** Projects → case study: the camera dives into the screen. How far the camera has flown into the Projects screen (the case-study dive), 0 → 1. */
const approach = () => diveState.v;

const tan = (fov: number) => Math.tan(THREE.MathUtils.degToRad(fov / 2));

const _target = new THREE.Vector3();
const _aim = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);
const _stop = new THREE.Vector3();

/** The footage's own scale in the case study (its CSS `scale`), and the push-in it lands from. The dive ends on exactly this framing. */
const FOOTAGE_SCALE = 1.06;

/**
 * The case-study dive: the camera flies straight onto the screen and stops square to it (no roll), at the distance where the
 * picture fills the frame the way the case study's footage does on landing, so the hand-off is the same picture, same zoom, same angle.
 */
export function pushThrough(
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number
) {
  const a = approach();
  if (a === 0) return;
  const { x, y, z, w, h } = view.screen;
  _target.set(x, y, z);
  const t = tan(camera.fov);
  // Distance at which the screen just covers the frame (object-fit: cover), then in by the case study's own push-in.
  const cover = Math.max(w / (2 * t * (width / height)), h / (2 * t));
  _stop.set(x, y, z + cover / (FOOTAGE_SCALE * LAND_SCALE));
  _aim.lookAt(_stop, _target, _up);
  _quat.setFromRotationMatrix(_aim);
  camera.position.lerp(_stop, a);
  camera.quaternion.slerp(_quat, a);
  camera.updateMatrixWorld();
}
