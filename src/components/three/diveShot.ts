import * as THREE from "three";

import { diveState } from "@/lib/caseStudy";
import { ease, seg } from "@/lib/journey";
import { view } from "@/lib/projects";

/** Projects → case study: the camera dives into the screen. How far the camera has flown into the Projects screen (the case-study dive), 0 → 1. */
export const approach = () => diveState.v;

/** The flash: the screen's light swells over the last of the dive and fills the frame. */
export const flare = () => ease(seg(diveState.v, [0.7, 1]));

const tan = (fov: number) => Math.tan(THREE.MathUtils.degToRad(fov / 2));

const _target = new THREE.Vector3();
const _aim = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);

/** The case-study dive: the camera swings onto the lit screen and flies into it until it fills the frame, then it is all white. */
export function pushThrough(
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number
) {
  const a = approach();
  if (a === 0) return;
  const { x, y, z, w } = view.screen;
  _target.set(x, y, z);
  const k = a;
  const stop = (w * 0.08) / (tan(camera.fov) * (width / height));
  const gap = camera.position.distanceTo(_target);
  camera.position.lerp(
    _target.clone().lerp(camera.position, stop / Math.max(gap, stop)),
    k
  );
  _aim.lookAt(camera.position, _target, _up);
  _quat.setFromRotationMatrix(_aim);
  camera.quaternion.slerp(_quat, Math.min(1, k * 1.8));
  camera.fov += 14 * a;
  camera.rotateZ(0.05 * a ** 2);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  const at = _target.clone().project(camera);
  const style = document.documentElement.style;
  style.setProperty(
    "--flare-x",
    `${((at.x * 0.5 + 0.5) * width).toFixed(1)}px`
  );
  style.setProperty(
    "--flare-y",
    `${((0.5 - at.y * 0.5) * height).toFixed(1)}px`
  );
}
