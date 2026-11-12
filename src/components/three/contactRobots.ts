import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

import { Bot, type Huddle, rand } from "./contactBot";
import { depthAt, halfView, onContact } from "./contactShot";
import { warm } from "./Warmup";

/** Where the Contact set's two halves live: the near one is in the canvas over the copy, the far one in the canvas behind it. The pool is drawn in both, each showing its own half. */
export const stage = {
  crowd: null as Crowd | null,
  near: null as THREE.Object3D | null,
  far: null as THREE.Object3D | null,
};

const BOTS = 8;
/** Robots stand this tall, in world units; perspective does the rest. */
const HEIGHT = 0.43;
const MAX_IN_FRAME = 7;
/** Every this many drops, one is a slow-motion hero drop through the beam. */
const HERO_EVERY = 5;
/** Seconds between twitches of a robot lying on the floor. */
const TWITCH = [2.5, 6] as const;
/** Half the width the three keys take on screen, in pixels, plus a margin: nothing tumbles behind them. */
const CLEAR_PX = 340;
/** Share of drops that fall through the middle, behind the headline and keys. */
const CENTRE_SHARE = 0.3;
/** Most robots in one huddle, and the radius of the ring they stand on. */
const HUDDLE_MAX = 4;
/** Huddles the room holds at once, spread around the floor. */
const GROUPS = 3;
const RING = 0.4;

/** The pool of falling robots: one every second or two, never more than a few in frame, the oldest fading as new ones land. */
export default class Crowd {
  group = new THREE.Group();
  private bots: Bot[];
  private next = 0;
  private sound = { at: -1 };
  private twitch = 3;
  private drops = 0;
  private primed = false;
  private huddles: Huddle[] = [];
  private view = { width: 1280, height: 720 };

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

  /** A spot outside the clear zone behind the keys, at a random depth. */
  private lane(width: number, height: number) {
    const z = rand(-9, 1.5);
    const half = halfView(depthAt(z), width / height);
    const zone = Math.min((CLEAR_PX / (width / 2)) * half + 0.9, half * 0.7);
    // Some fall through the middle, behind the copy.
    if (Math.random() < CENTRE_SHARE) return { x: rand(-zone, zone), z };
    const x = (Math.random() < 0.5 ? -1 : 1) * rand(zone, half * 0.95);
    return { x, z };
  }

  /** A spot in the middle of the floor where the room can see it, as far as it can get from the other huddles. */
  private middle(width: number, height: number) {
    let best = { x: 0, z: 0 };
    let room = -1;
    for (let i = 0; i < 10; i++) {
      const z = rand(-4, 1);
      const half = halfView(depthAt(z), width / height);
      const spot = { x: rand(-0.6, 0.6) * half, z };
      const gap = Math.min(
        ...this.huddles.map(h => Math.hypot(h.x - spot.x, h.z - spot.z)),
        99
      );
      if (gap > room) {
        room = gap;
        best = spot;
      }
    }
    return best;
  }

  /** Puts a robot in a huddle's first free place in the ring. */
  private join(bot: Bot, huddle: Huddle) {
    const taken = huddle.members.map(m => m.slot);
    bot.slot = [0, 1, 2, 3].find(i => !taken.includes(i)) ?? 0;
    bot.group = huddle;
    huddle.members.push(bot);
    const angle = huddle.phase + (bot.slot * Math.PI) / 2;
    bot.goTo(
      huddle.x + Math.sin(angle) * RING,
      huddle.z + Math.cos(angle) * RING
    );
  }

  /** Two walkers start a new huddle somewhere the others aren't. */
  private form(a: Bot, b: Bot) {
    const { x, z } = this.middle(this.view.width, this.view.height);
    const huddle = { x, z, phase: rand(0, Math.PI * 2), members: [] };
    this.huddles.push(huddle);
    this.join(a, huddle);
    this.join(b, huddle);
  }

  /** A robot that just got up, or finished a pause: start a new huddle with another walker while the room has fewer than GROUPS, else join the smallest open one, else wander. */
  private direct(bot: Bot) {
    const other = this.bots.find(
      b => b !== bot && b.mode === "walk" && b.active && !b.group
    );
    if (other && this.huddles.length < GROUPS) {
      return this.form(bot, other);
    }
    const open = this.huddles
      .filter(h => h.members.length < HUDDLE_MAX)
      .sort((a, b) => a.members.length - b.members.length)[0];
    if (open) return this.join(bot, open);
    if (other) {
      return this.form(bot, other);
    }
    const { x, z } = this.lane(this.view.width, this.view.height);
    bot.goTo(x, z);
  }

  /** Drops the faded, and a huddle left with one robot dissolves: it goes wandering. */
  private tidy() {
    for (const huddle of this.huddles) {
      for (const bot of huddle.members) if (!bot.active) bot.group = null;
      huddle.members = huddle.members.filter(bot => bot.group === huddle);
      if (huddle.members.length === 1) {
        const [lone] = huddle.members;
        lone.disband();
        huddle.members = [];
      }
    }
    this.huddles = this.huddles.filter(h => h.members.length > 0);
  }

  step(
    dt: number,
    time: number,
    width: number,
    height: number,
    reduced: boolean
  ) {
    if (!this.primed) {
      this.primed = true;
      this.next = 0.8;
      this.drops = 0;
      if (reduced)
        // A still frame: two robots already on the floor at the edges.
        for (const bot of this.bots.slice(0, 2)) {
          const { x, z } = this.lane(width, height);
          bot.place(x, z);
        }
    }
    const idle = this.bots.find(bot => bot.mode === "idle");
    const live = this.bots.filter(bot => bot.mode === "fall").length;
    this.next -= dt;
    if (!reduced && this.next <= 0 && idle && live < MAX_IN_FRAME) {
      // The first drop after the lamp is up, and every few after, is a hero drop: slow, in the beam, a landing you feel.
      const hero = this.drops % HERO_EVERY === 0;
      this.drops += 1;
      if (hero) {
        const side = Math.random() < 0.5 ? -1 : 1;
        idle.drop(side * rand(1.9, 2.7) + 0.6, rand(-0.5, 1), true);
      } else {
        const { x, z } = this.lane(width, height);
        idle.drop(x, z);
      }
      this.next = hero ? rand(2.5, 3.5) : rand(0.7, 1.6);
    }
    this.twitch -= dt;
    if (this.twitch <= 0) {
      const lying = this.bots.filter(bot => bot.resting);
      if (lying.length)
        lying[Math.floor(Math.random() * lying.length)].jolt = 1;
      this.twitch = rand(...TWITCH);
    }
    this.view = { width, height };
    this.tidy();
    for (const bot of this.bots) if (bot.ready && bot.active) this.direct(bot);
    for (const bot of this.bots) bot.step(dt, this.sound, time);
  }

  /** The robots the visitor can pick up right now. */
  get grabbable() {
    return this.bots.filter(bot => bot.grabbable);
  }

  private seen: boolean[] = [];

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

  /** Shows the pool and its set for the length of `compile`, so every shader is built before the first fall. */
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

  /** Called while the camera is elsewhere, so the next visit starts its timing afresh. */
  leave() {
    this.primed = false;
    // The warm-up draws them once so their shaders are compiled before the first fall.
    for (const bot of this.bots)
      bot.root.visible = bot.blob.visible = bot.mode !== "idle" || warm.on;
  }
}
