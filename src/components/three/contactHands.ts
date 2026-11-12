import * as THREE from "three";

import { target } from "@/lib/pointer";

import {
  faceCamera,
  feet,
  listenHands,
  overCapsule,
  setCrowdFlag,
  top,
} from "./crowdHands";
import type { Bot } from "./contactBot";
import { stage } from "./contactRobots";
import {
  arrival,
  blackout,
  depthAt,
  halfView,
  onContact,
  ORIGIN,
} from "./contactShot";

/** Anything in here is the page's own UI: the cursor is theirs, not the robots'. */
const UI = "a, button, input, textarea, select, label";
/** How low and how high the hand can take a head above the floor. */
const HEAD_LOW = 0.45;
const HEAD_HIGH = 3;
const WALL_ASPECT = 1.6;

const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const plane = new THREE.Plane();
const hit = new THREE.Vector3();
const below = new THREE.Vector3(0, 0.215, 0);

const state = {
  hover: null as Bot | null,
  held: null as Bot | null,
  over: false,
};

/** Is the cursor on this robot, from its feet to its head? */
function over(
  x: number,
  y: number,
  camera: THREE.Camera,
  aspect: number,
  bot: Bot
) {
  feet.copy(bot.root.position).sub(below);
  bot.headAt(top);
  return overCapsule(x, y, camera, aspect, 0.3);
}

function release() {
  const bot = state.held;
  if (!bot) return;
  state.held = null;
  bot.letGo();
}

/** Per frame, after the camera is placed: who is under the cursor, and where the hand takes the one in it. */
export function stepHands(camera: THREE.Camera, aspect: number) {
  if (state.held && !onContact()) release();
  const live =
    onContact() &&
    arrival() >= 0.97 &&
    blackout() < 0.01 &&
    target.live &&
    !state.over;
  let hover: Bot | null = null;
  if (live && !state.held && stage.crowd) {
    let best = Infinity;
    for (const bot of stage.crowd.grabbable) {
      if (!over(target.x, -target.y, camera, aspect, bot)) continue;
      const d = camera.position.distanceToSquared(bot.root.position);
      if (d < best) {
        best = d;
        hover = bot;
      }
    }
  }
  state.hover = hover;
  setCrowdFlag(state.held ? "held" : hover ? "hover" : null);
  const bot = state.held;
  if (!bot) return;
  ray.setFromCamera(ndc.set(target.x, -target.y), camera);
  if (!ray.ray.intersectPlane(plane, hit)) return;
  const half = halfView(depthAt(hit.z), WALL_ASPECT) * 0.9;
  bot.hand.aim.copy(hit);
  bot.hand.aim.x = THREE.MathUtils.clamp(
    hit.x,
    ORIGIN.x - half,
    ORIGIN.x + half
  );
  bot.hand.aim.y = THREE.MathUtils.clamp(hit.y, HEAD_LOW, HEAD_HIGH);
}

/** Starts listening for the grab and the drop. Returns the cleanup. */
export function trackHands(camera: THREE.Camera) {
  const grab = () => {
    const bot = state.hover;
    if (!bot) return false;
    state.held = bot;
    bot.pickUp();
    faceCamera(plane, camera, bot.hand.at);
    return true;
  };
  return listenHands(grab, release, UI, on => {
    state.over = on;
  });
}
