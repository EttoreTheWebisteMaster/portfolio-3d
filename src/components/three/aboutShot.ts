import * as THREE from "three";

import { ease, journey, seg } from "@/lib/journey";
import { pointer } from "@/lib/pointer";
import { view } from "@/lib/projects";

import { CONTACT_AT } from "./contactShot";

/** The About set is parked far to the side of the others, so their lights never reach it. */
export const ORIGIN = new THREE.Vector3(200, 0, 0);
/** The cut in the wall: apex up. */
export const CUT = { apex: 5.4, base: 0.6, half: 2.6 };
export const DEPTH = 10;
/** Where the camera backs out from: so close the cut is bigger than the frame, then it shrinks to its real size. */
const START = { distance: 15, fov: 24 };
const CAMERA = { y: (CUT.apex + CUT.base) / 2, distance: 17.4, fov: 24 };
/** Journey position where Projects hands over to About: a quick white flash, then the wall is there. */
const CUT_AT = 1.4;
const PAPER_AT = 1.52;
/** About → Contact: he ducks behind the wall, then the camera pushes in through the cut and down the tunnel into its black. */
export const DUCK_AT = 2.1;
const PUSH = [2.2, CONTACT_AT] as const;
const PUSH_END_Z = -DEPTH + 1.5;

/** Is the camera on About? Read by the rig and the grade. */
export const onAbout = () =>
  journey.current >= CUT_AT && journey.current < CONTACT_AT;

/** 0 → 1 as About lands: the camera pulls back, the cut opens, the key light slams on. */
export const landing = () => seg(journey.current, [CUT_AT, 2]);

/** 0 → 1 over the run-up to the cut: the camera flies into the screen at one speed. */
export const approach = () => seg(journey.current, [1, CUT_AT]);

/** The flash: the screen's light swells over the last moments of the push, peaks at the cut, and is gone a beat later. */
export function flare() {
  const pos = journey.current;
  if (pos < CUT_AT) return ease(seg(pos, [CUT_AT - 0.12, CUT_AT]));
  // The white holds a beat, then softens into the cream of the wall.
  return 1 - ease(seg(pos, [CUT_AT + 0.04, CUT_AT + 0.22]));
}

/** 0 → 1: the cut grows out of the bare wall from nothing to its real size. */
export const grow = () => {
  const t = seg(journey.current, [CUT_AT + 0.1, 1.85]);
  return THREE.MathUtils.lerp(t, ease(t), 0.4);
};

/** Where the 12-column grid puts the centre of columns 1–7 (the stage column, as on Projects), as a fraction of the viewport width. */
function stageCentre(width: number) {
  const margin = width >= 1280 ? 64 : width >= 768 ? 40 : 20;
  const gutter = 24;
  const col = (width - 2 * margin - 11 * gutter) / 12;
  return (margin + (7 * col + 6 * gutter) / 2) / width;
}

const tan = (fov: number) => Math.tan(THREE.MathUtils.degToRad(fov / 2));

/**
 * Puts the camera on the About frame. It starts close, the cut almost filling the frame, and backs out straight away (the About → Contact push, played in reverse) and settles on a long lens, the cut in the stage column.
 */
export const aboutCamera = (
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number
) => placeAbout(camera, width, height, landing());

/** The About camera at `t` of the landing (0 = close, just after the flash; 1 = the settled frame). */
function placeAbout(
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
  t: number
) {
  // Mostly one speed, ending gently.
  const m = THREE.MathUtils.lerp(t, ease(t), 0.35);
  const distance = THREE.MathUtils.lerp(START.distance, CAMERA.distance, m);
  // The lens stretch of the push carries on into the pull-back and relaxes, so the move never restarts at the cut.
  camera.fov =
    THREE.MathUtils.lerp(START.fov, CAMERA.fov, m) + 14 * (1 - m) ** 2;
  const aspect = width / height;
  // The cut stays in the middle of the stage column however far the camera is.
  const x =
    ORIGIN.x +
    (0.5 - stageCentre(width)) * 2 * distance * tan(camera.fov) * aspect;
  // The exit: the camera slides onto the cut's axis, then runs down the tunnel at one speed, the lens opening as it goes.
  const push = seg(journey.current, PUSH);
  const aim = ORIGIN.x + (x - ORIGIN.x) * (1 - seg(push, [0, 0.5]));
  const z = THREE.MathUtils.lerp(distance, PUSH_END_Z, push);
  camera.fov += 14 * push;
  camera.position.set(aim, CAMERA.y, z);
  // A touch of parallax: the hole shifts against the wall as the cursor moves. It starts after the landing, so the frame ends exactly where the layout was measured.
  const live = seg(journey.current, [2 - 0.15, 2]);
  camera.position.x += pointer.x * 0.12 * live * (1 - push);
  camera.position.y -= pointer.y * 0.06 * live * (1 - push);
  camera.lookAt(aim, CAMERA.y, z - distance);
  // A slow roll out of the push-through, level on arrival.
  camera.rotateZ(0.05 * (1 - m));
  camera.updateProjectionMatrix();
}

const _target = new THREE.Vector3();
const _aim = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);

/** The run-up to the cut: the camera swings onto the lit screen and flies into it until it fills the frame, then it is all white. */
export function pushThrough(
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number
) {
  const a = approach();
  if (a === 0) return;
  const { x, y, z, w } = view.screen;
  _target.set(x, y, z);
  // One speed all the way in.
  const k = a;
  // It ends well inside the glass, so the screen overfills the lens just as the white takes over.
  const stop = (w * 0.08) / (tan(camera.fov) * (width / height));
  const gap = camera.position.distanceTo(_target);
  camera.position.lerp(
    _target.clone().lerp(camera.position, stop / Math.max(gap, stop)),
    k
  );
  // The lens turns onto the screen as it closes in.
  _aim.lookAt(camera.position, _target, _up);
  _quat.setFromRotationMatrix(_aim);
  camera.quaternion.slerp(_quat, Math.min(1, k * 1.8));
  camera.fov += 14 * a;
  camera.rotateZ(0.05 * a ** 2);
  camera.updateProjectionMatrix();
  // The white-out blooms from the screen itself.
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

/** Exposure of the lens: blown open at the climax, then closing down as the eye adjusts to the cream wall. */
export const exposure = (base: number) => base + 2.4 * flare();

let measured = "";

/**
 * Publishes what the DOM needs to stay on the 3D: the cut's top and bottom in screen pixels (the text column locks to them),
 * the flash and the lens blur, and two flags (the paper bars, and About being settled).
 */
export function publishAbout(width: number, height: number) {
  const root = document.documentElement;
  const style = root.style;
  const key = `${width}x${height}`;
  if (key !== measured) {
    measured = key;
    const unit = (CAMERA.distance * tan(CAMERA.fov)) / (height / 2);
    const py = (y: number) => height / 2 - (y - CAMERA.y) / unit;
    style.setProperty("--cut-top", `${py(CUT.apex).toFixed(1)}px`);
    style.setProperty("--cut-bottom", `${py(CUT.base).toFixed(1)}px`);
  }
  const f = flare();
  style.setProperty("--flare", f.toFixed(3));
  style.setProperty("--flare-r", (6 + 140 * f).toFixed(1));
  const pos = journey.current;
  // The lens loses focus as the screen burns out; it is sharp again the moment About takes over.
  const blur = pos < CUT_AT ? 22 * ease(seg(pos, [1.2, CUT_AT - 0.02])) : 0;
  style.setProperty("--blur", blur.toFixed(1));
  if (blur > 0) root.dataset.blur = "";
  else delete root.dataset.blur;
  // The bars turn to ink once the cream wall is closing in.
  if (pos >= PAPER_AT && pos < PUSH[0]) root.dataset.paper = "";
  else delete root.dataset.paper;
  if (pos >= 1.92 && pos < DUCK_AT) root.dataset.aboutReady = "";
  else delete root.dataset.aboutReady;
}
