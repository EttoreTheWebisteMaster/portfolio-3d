import * as THREE from "three";

import { diveState } from "@/lib/caseStudy";
import { ease, journey, seg } from "@/lib/journey";
import { pointer } from "@/lib/pointer";

import { blackout } from "./contactShot";
import { flare } from "./diveShot";
import { FLOOR_Y } from "./HeroLight";
import {
  DIM,
  eye,
  MARK_X,
  SHOT,
  walk,
  ZOOM,
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
export function aboutFrame(width: number, height: number) {
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
const aim = new THREE.Vector3();
const from = new THREE.Vector3();
const goal = new THREE.Vector3();
const settled = new THREE.Vector3();
const pose: Pose = { x: 0, yaw: 0, stand: 0, phase: 0, moving: 0 };

/** Where the Projects camera ends: the same spot the hero move lands on. */
const START = {
  pos: new THREE.Vector3(0, 6, 7),
  fov: 32,
  aim: new THREE.Vector3(0, 6, -13),
};

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
  const drop = ease(seg(w, [0, 0.2]));
  const hand = ease(seg(w, SHOT.handoff));
  // Chasing: a little behind him, always looking at him, so he stays the centre of the shot.
  const rx = pose.x;
  const dist = narrow ? 20 : 14;
  chase.set(
    rx - 2.4,
    THREE.MathUtils.lerp(START.pos.y, 0.4, drop),
    THREE.MathUtils.lerp(START.pos.z, dist, drop)
  );
  aim.set(
    rx,
    THREE.MathUtils.lerp(START.aim.y, -0.4, drop),
    THREE.MathUtils.lerp(START.aim.z, 0, drop)
  );
  from.copy(chase).lerp(START.pos, 0);
  goal.set(frame.x, frame.y, frame.z);
  camera.position.copy(from).lerp(goal, hand);
  const look = aim.lerp(settled.set(frame.x, frame.y, 0), hand);
  const fov = THREE.MathUtils.lerp(START.fov, 30, drop);
  camera.fov = THREE.MathUtils.lerp(fov, frame.fov, hand);
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
  // Phone: the frame is shifted up by the lens (no tilt), so he stands in the top of the screen.
  const shift = a.shift * hand * (1 - zoom);
  if (shift > 0.5) camera.setViewOffset(width, height, 0, shift, width, height);
  else if (camera.view?.enabled) camera.clearViewOffset();
  camera.updateProjectionMatrix();
}

/** Exposure of the lens: the dive's white-out, a swell as the daylight comes up that settles like an eye adapting, and the dim into Contact. */
export function exposure(base: number) {
  const w = walk();
  const bloom = Math.sin(Math.PI * seg(w, SHOT.daylight) ** 0.8) * 0.25;
  const dim = ease(seg(journey.current, DIM));
  return (base + 2.4 * flare() + bloom) * (1 - 0.8 * dim) * (1 - blackout());
}

let measured = "";

/**
 * Publishes what the DOM needs to stay on the 3D: his head and feet lines in screen pixels (the text column locks to them),
 * the dive's flash and lens blur, and the flags (paper theme, About settled).
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
  const f = flare();
  style.setProperty("--flare", f.toFixed(3));
  style.setProperty("--flare-r", (6 + 140 * f).toFixed(1));
  const blur = 22 * ease(seg(diveState.v, [0.5, 0.95]));
  style.setProperty("--blur", blur.toFixed(1));
  if (blur > 0) root.dataset.blur = "";
  else delete root.dataset.blur;
  const pos = journey.current;
  // The theme turns to paper once the frame is mostly cream, and back as About dims into Contact.
  if (pos >= 1.68 && pos < DIM[0]) root.dataset.paper = "";
  else delete root.dataset.paper;
  if (pos >= 1.97 && pos < ZOOM[0]) root.dataset.aboutReady = "";
  else delete root.dataset.aboutReady;
}
