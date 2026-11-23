import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

import { Bot, rand } from "./contactBot";
import {
  depthAt,
  halfView,
  onContact,
  ORIGIN,
  presence,
  settled,
} from "./contactShot";
import { warm } from "./Warmup";

/** Where the Contact set's two halves live: the near one is in the canvas over the copy, the far one in the canvas behind it. The pool is drawn in both, each showing its own half. */
export const stage = {
  crowd: null as Crowd | null,
  near: null as THREE.Object3D | null,
  far: null as THREE.Object3D | null,
};

const BOTS = 48;
/** Robots stand this tall, in world units; perspective does the rest. */
const HEIGHT = 0.43;
/** The depths a robot crossing from side to side walks at: the near floor, over the copy, and the far floor, behind it; and the depths a robot walking away from or towards the camera starts and ends at (the near one is just past the bottom of the frame). */
const NEAR = [-2.5, 1] as const;
const FAR = [-7, -4.5] as const;
const DEEP = -11;
const CLOSE = 6;
/** How far past the frame's side edges a robot starts and ends; the seconds between two robots (three a second); and the wait after the camera comes to rest before the first one. */
const OFFSCREEN = 0.7;
const GAP = 1 / 3;
const START = 1;

/** The room's robots: three a second, each walking a straight line from one edge of the frame to the opposite one, gone when it leaves the screen. */
export default class Crowd {
  group = new THREE.Group();
  private bots: Bot[];
  private next = START;
  private view = { width: 1280, height: 720 };
  private seen: boolean[] = [];

  constructor(gltf: GLTF) {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    const scale = HEIGHT / size.y;
    this.bots = Array.from(
      { length: BOTS },
      () => new Bot(gltf, scale, centre)
    );
    for (const bot of this.bots) this.group.add(bot.root, bot.blob);
  }

  /** Half the width the floor shows at a depth. */
  private half(z: number) {
    return halfView(depthAt(z), this.view.width / this.view.height);
  }

  /** A free robot starts across the room, from one edge of the frame to the opposite one: side to side at a random depth, or towards or away from the camera at a random place across. */
  private send(bot: Bot) {
    const flip = Math.random() < 0.5 ? -1 : 1;
    if (Math.random() < 0.6) {
      const [from, to] = Math.random() < 0.7 ? NEAR : FAR;
      const z0 = rand(from, to);
      const z1 = rand(from, to);
      bot.start(
        ORIGIN.x + flip * (this.half(z0) + OFFSCREEN),
        z0,
        ORIGIN.x - flip * (this.half(z1) + OFFSCREEN),
        z1
      );
      return;
    }
    const [z0, z1] = flip < 0 ? [DEEP, CLOSE] : [CLOSE, DEEP];
    bot.start(
      ORIGIN.x + rand(-0.9, 0.9) * this.half(z0),
      z0,
      ORIGIN.x + rand(-0.9, 0.9) * this.half(z1),
      z1
    );
  }

  step(dt: number, width: number, height: number, reduced: boolean) {
    this.view = { width, height };
    // Reduced motion: an empty floor, nothing crossing it. Otherwise the first robot walks in a second after the camera settles.
    if (settled()) this.next -= Math.min(dt, 0.05);
    else this.next = START;
    const free = this.bots.find(bot => !bot.active);
    if (!reduced && free && this.next <= 0) {
      this.send(free);
      this.next += GAP;
    }
    const fade = presence();
    for (const bot of this.bots) {
      bot.dim(fade);
      bot.step(Math.min(dt, 0.05));
    }
  }

  /** Moves the pool into one canvas's set and shows only the half that canvas draws. Undone by `restore`. */
  lend(set: THREE.Object3D, near: boolean) {
    set.add(this.group);
    this.seen = this.bots.map(bot => bot.root.visible);
    this.bots.forEach((bot, i) => {
      const show = this.seen[i] && bot.front === near;
      bot.root.visible = show;
      bot.blob.visible = show;
    });
  }

  restore() {
    if (!this.seen.length) return;
    this.bots.forEach((bot, i) => {
      bot.root.visible = this.seen[i];
      bot.blob.visible = this.seen[i];
    });
    this.seen = [];
    stage.near?.add(this.group);
  }

  /** Builds the far canvas's shaders for the pool, once, while the loader still holds. */
  compileFar(compile: () => void) {
    const set = stage.far;
    if (!set) return;
    const was = set.visible;
    set.visible = true;
    set.add(this.group);
    for (const bot of this.bots) bot.root.visible = bot.blob.visible = true;
    compile();
    set.visible = was;
    stage.near?.add(this.group);
    this.leave();
  }

  /** Shows the pool and its set for the length of `compile`, so every shader is built before the first walker. */
  async prime(compile: () => Promise<unknown>) {
    const set = this.group.parent;
    if (!set) return;
    set.visible = true;
    for (const bot of this.bots) bot.root.visible = bot.blob.visible = true;
    try {
      await compile();
    } catch {
      // A failed compile only costs the stall it was there to prevent.
    }
    set.visible = onContact();
    this.leave();
  }

  /** Called while the camera is elsewhere: every robot gone, so the next visit starts with an empty floor. The warm-up draws them once so their shaders are built. */
  leave() {
    for (const bot of this.bots) {
      bot.vanish();
      bot.dim(1);
      bot.root.visible = bot.blob.visible = warm.on;
    }
  }
}
