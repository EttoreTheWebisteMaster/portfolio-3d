import * as THREE from "three";

import { diveState } from "@/lib/caseMotion";
import { ease, journey, seg } from "@/lib/journey";
import { pointer } from "@/lib/pointer";

import { blackout } from "./contactShot";
import { FLOOR_Y } from "./HeroLight";
import {
  DIM,
  eye,
  MARK_X,
  SHOT,
  walk,
  ZOOM,
  closeUp,
  newPose,
  walkPose,
  type Pose,
} from "./walkPose";

const tan = (fov: number) => Math.tan(THREE.MathUtils.degToRad(fov / 2));

/** Where the 12-column grid puts the centre of columns 1–7, as a fraction of the viewport width. */
function stageCentre(width: number) {
  const margin = width >= 1280 ? 64 : width >= 768 ? 40 : 20;
  const gutter = 24;
  const col = (width - 2 * margin - 11 * gutter) / 12;
  return (margin + (7 * col + 6 * gutter) / 2) / width;
}

const ROBOT_TOP = 4.5;
/** How far in front of his eye the lens ends, in world units. */
const EYE_DISTANCE = 2;

/** The settled About frame for a viewport: a long lens, level, him on the left columns with his feet on a fixed line (mobile: him on top). */
function aboutFrame(width: number, height: number) {
  const aspect = width / height;
  const narrow = aspect < 1;
  const fov = 24;
  const distance = narrow ? 30 : 18;
  const span = 2 * distance * tan(fov);
  const feet = narrow ? 0.46 : 0.86;
  // Level, above the floor. Where the feet fall in the frame is then set with a lens shift (`shift`, in px), never by tilting.
  const natural = 0.5 + 3 / span;
  const lookY = narrow ? FLOOR_Y + 3 : FLOOR_Y + (feet - 0.5) * span;
  const shift = narrow ? (natural - feet) * height : 0;
  const x = MARK_X + (narrow ? 0 : (0.5 - stageCentre(width)) * span * aspect);
  const top = feet * height - (ROBOT_TOP / span) * height;
  return {
    x,
    y: lookY,
    z: distance,
    fov,
    lookY,
    shift,
    feetPx: feet * height,
    topPx: top,
  };
}

const frame = { x: 0, y: 0, z: 0, fov: 0 };
const chase = new THREE.Vector3();
const face = new THREE.Vector3();
const aim = new THREE.Vector3();
const goal = new THREE.Vector3();
const pose: Pose = newPose();

/** Where the Projects camera ends: the same spot the hero move lands on. */
const START = {
  pos: new THREE.Vector3(0, 6, 7),
  fov: 32,
  aim: new THREE.Vector3(0, 6, -13),
};

/** Shot progress where the lens settles into following him. */
const LOCK = 0.8;

let rigKey = "";
let rigged: { path: THREE.CatmullRomCurve3; gaze: THREE.CatmullRomCurve3 };

/**
 * The camera's flight and where it looks, as two smooth curves through the shot's key frames: the cinema, a medium shot off his shoulder
 * while he gets up, the tracking frame beside him on the move, and the About frame. Sampled by arc length, so the speed is constant.
 */
function rig(f: typeof frame, narrow: boolean) {
  const key = `${f.x}|${f.y}|${f.z}|${narrow}`;
  if (key === rigKey) return rigged;
  rigKey = key;
  // Where he is part way through the walk, when the lens is tracking him.
  const x = MARK_X * seg(LOCK, SHOT.walk);
  rigged = {
    path: new THREE.CatmullRomCurve3(
      [
        START.pos.clone(),
        new THREE.Vector3(3, 0.9, 9),
        new THREE.Vector3(x + f.x - MARK_X, f.y, f.z),
      ],
      false,
      "centripetal"
    ),
    gaze: new THREE.CatmullRomCurve3(
      [
        START.aim.clone(),
        new THREE.Vector3(0.6, 1, 0),
        new THREE.Vector3(x + f.x - MARK_X, f.y, 0),
      ],
      false,
      "centripetal"
    ),
  };
  return rigged;
}

/**
 * The shot's camera. It drops from the cinema frame to eye level beside him, then follows him with him dead centre while he walks,
 * and settles, locked off, on the About frame as he reaches his mark.
 */
export function walkCamera(
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number
) {
  const w = walk();
  const a = aboutFrame(width, height);
  Object.assign(frame, { x: a.x, y: a.y, z: a.z, fov: a.fov });
  walkPose(pose);
  const narrow = width < height;
  const hand = seg(w, SHOT.handoff);
  // One free, flowing path from the cinema frame to the About frame, flown at a single constant speed (by arc length): no segment starts or stops.
  const { path, gaze } = rig(frame, narrow);
  const u = Math.min(w / LOCK, 1);
  path.getPointAt(u, chase);
  gaze.getPointAt(u, aim);
  // Then the page follows him: the lens keeps the exact framing About ends on, travelling with him, so he stays in his final place in the frame the whole walk.
  const lock = ease(seg(w, [LOCK - 0.3, LOCK]));
  const along = MARK_X * seg(w, SHOT.walk) + frame.x - MARK_X;
  chase.lerp(goal.set(along, frame.y, frame.z), lock);
  aim.lerp(face.set(along, frame.y, 0), lock);
  camera.position.copy(chase);
  const look = aim;
  camera.fov = THREE.MathUtils.lerp(START.fov, frame.fov, seg(w, [0, LOCK]));
  // A touch of parallax once the frame is locked.
  const live = seg(w, [0.95, 1]) * (1 - seg(journey.current, ZOOM));
  camera.position.x += pointer.x * 0.12 * live;
  camera.position.y -= pointer.y * 0.06 * live;
  // The push-in: straight down the lens at his eye, the lens tightening as it goes.
  // It starts slow and keeps accelerating: the closer the eye, the faster it pulls you in.
  const zoom = seg(journey.current, ZOOM) ** 1.8;
  if (zoom > 0) {
    goal.copy(eye.pos).addScaledVector(eye.facing, EYE_DISTANCE);
    camera.position.lerp(goal, zoom);
    look.lerp(eye.pos, zoom);
    camera.fov = THREE.MathUtils.lerp(camera.fov, 20, zoom);
    // A heartbeat in the lens, faster and harder as it closes in.
    const t = performance.now() / 1000;
    const beat = Math.max(0, Math.sin(t * (6 + 5 * zoom))) ** 8;
    camera.fov *= 1 - 0.05 * zoom * beat;
  }
  camera.lookAt(look);
  // A breath of roll through the move, level again once it is locked.
  camera.rotateZ(0.015 * Math.sin(Math.PI * w));
  // Phone: the frame is shifted up by the lens (no tilt), so he stands in the top of the screen.
  const shift = a.shift * hand * (1 - zoom);
  if (shift > 0.5) camera.setViewOffset(width, height, 0, shift, width, height);
  else if (camera.view?.enabled) camera.clearViewOffset();
  camera.updateProjectionMatrix();
}

/** Exposure of the lens: a swell as the daylight comes up that settles like an eye adapting, and the dim into Contact. */
export function exposure(base: number) {
  const w = walk();
  const bloom = Math.sin(Math.PI * seg(w, SHOT.daylight) ** 0.8) * 0.25;
  const dim = ease(seg(journey.current, DIM));
  return (
    (base + bloom) * (1 - 0.8 * dim) * (1 - 0.3 * closeUp()) * (1 - blackout())
  );
}

let measured = "";
let blurred = "";

/** Sets or clears a data flag only when it changes, so a steady frame writes nothing to the document. */
function toggle(el: HTMLElement, flag: string, on: boolean) {
  if (on === flag in el.dataset) return;
  if (on) el.dataset[flag] = "";
  else delete el.dataset[flag];
}

/**
 * Publishes what the DOM needs to stay on the 3D: his head and feet lines in screen pixels (the text column locks to them),
 * the dive's lens blur, and the flags (paper theme, About settled).
 */
export function publishAbout(width: number, height: number) {
  const root = document.documentElement;
  const style = root.style;
  const key = `${width}x${height}`;
  if (key !== measured) {
    measured = key;
    const f = aboutFrame(width, height);
    style.setProperty("--about-top", `${f.topPx.toFixed(1)}px`);
    style.setProperty("--about-feet", `${f.feetPx.toFixed(1)}px`);
  }
  const blur = (22 * ease(seg(diveState.v, [0.5, 0.95]))).toFixed(1);
  if (blur !== blurred) {
    blurred = blur;
    style.setProperty("--blur", blur);
    toggle(root, "blur", Number(blur) > 0);
  }
  const pos = journey.current;
  // The theme turns to paper once the frame is mostly cream, and back as About dims into Contact.
  toggle(root, "paper", pos >= 1.6 && pos < DIM[0]);
  toggle(root, "aboutReady", pos >= 1.97 && pos < ZOOM[0]);
}
