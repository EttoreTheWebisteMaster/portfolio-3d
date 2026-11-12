import { radialDisc } from "./aboutRoom";
import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

import { play } from "@/lib/sound";

import { limpStep, makeLimp, restFeet, type Limp } from "./crowdLimp";
import {
  AIM,
  depthAt,
  flash,
  halfView,
  landings,
  LOOK_Y,
  ORIGIN,
  POOL,
  shake,
} from "./contactShot";
import { PALETTE } from "./HeroRobot";
import { warm } from "./Warmup";

/** Gravity at the robots' scale: 0.43 units is a body about 1.7 m tall, so real gravity would be ~2.5; a little more keeps the fall brisk. */
const GRAVITY = 4;
/** A hero drop falls in slow motion: this share of gravity and spin. */
const SLOW = 0.45;
/** Height of a standing robot's centre above the floor. */
const STAND = 0.215;
/** Share of the closing speed an impact gives back (coefficient of restitution): metal on a hard floor hops, then hops less. */
const RESTITUTION = 0.25;
/** Below this closing speed an impact gives nothing back, so the hops die out instead of jittering forever. */
const REST_SPEED = 0.7;
/** Coulomb friction: an impact strips at most this times its normal impulse from the sideways speed; sliding then decelerates at FLOOR_DRAG. */
const FRICTION = 0.1;
const FLOOR_DRAG = 1.6;
/** Air resistance on the sideways speed (per second), and how fast spin dies after the feet touch. */
const AIR = 0.15;
const SPIN_DAMP = 4;
/** How hard the feet-down body rights itself after the first impact (per second). */
const RIGHT = 9;
/** Sideways speed at release, tilt and tumble speed while falling: the momentum the fall carries. */
const DRIFT = [0.3, 1] as const;
const TILT = 0.3;
const TUMBLE = 0.7;
/** Walking pace (units/s), how fast it turns (rad/s), where it counts as arrived, and the ring a huddle stands on. */
const PACE = 0.75;
const TURN = 4;
const ARRIVE = 0.05;
/** The time in the Idle clip its pose is frozen at: the falling pose, and the standing one. */
const STILL = 1.2;
/** Seconds a robot that got up stays on its feet before it fades. */
const ACTIVE = [16, 24] as const;
/** Depth (world z) that splits the floor: robots nearer than this walk over the copy, the far ones stay behind it. A little slack keeps one crossing it from flickering between the two. */
const FRONT_Z = -3.5;
/** Seconds on its feet before the visitor can pick a robot up, how high the head sits above the body's centre, and the fastest a throw can leave the hand (units/s). */
const GRAB_AFTER = 0.5;
const HEAD = 0.2;
const THROW_MAX = 6;
/** How wide the floor is at a depth, for a 16:10 screen: nothing is thrown past it. */
const WALL_ASPECT = 1.6;
const SLACK = 0.3;
/** How dark the soft shadow under a robot is, and how wide it is for a standing and a lying body. */
const BLOB = 0.6;
const FOOT = { stand: 0.36, lie: 0.55 } as const;
const LEG = /^(Hips|UpperLeg|LowerLeg|Leg|Foot)/;
/** Only the arms, head and chest of a clip: the legs belong to the walking clip alone. */
function upperBody(clip: THREE.AnimationClip) {
  const out = clip.clone();
  out.tracks = out.tracks.filter(track => !LEG.test(track.name));
  return out;
}
const ARMS = [
  "ShoulderL",
  "ShoulderR",
  "UpperArmL",
  "UpperArmR",
  "LowerArmL",
  "LowerArmR",
];
/** A copy of a clip that also holds every arm bone it leaves alone at its place on the model. A bone no clip drives keeps whatever the limp physics last left it in, so a robot that was thrown around would stand and talk with its arms flung back. */
function holdArms(clip: THREE.AnimationClip, scene: THREE.Object3D) {
  const out = clip.clone();
  for (const name of ARMS) {
    const bone = scene.getObjectByName(name);
    if (bone && !out.tracks.some(t => t.name === `${name}.quaternion`))
      out.tracks.push(
        new THREE.QuaternionKeyframeTrack(
          `${name}.quaternion`,
          [0],
          bone.quaternion.toArray()
        )
      );
  }
  return out;
}
/** Only the hips, legs and feet of a clip. */
function legsOnly(clip: THREE.AnimationClip) {
  const out = clip.clone();
  out.tracks = out.tracks.filter(track => LEG.test(track.name));
  return out;
}

const GESTURES = ["Wave", "Yes", "No", "ThumbsUp"] as const;
/** Seconds a landed robot lies before it fades, and how long the fade takes. */
const LIE = 11;
const FADE = 2.5;
const IDENTITY = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);
/** Length of the Death clip, in seconds. */
const DEATH_END = 0.96;
const TAN = Math.tan(THREE.MathUtils.degToRad(14));

let blobMap: THREE.CanvasTexture | null = null;
/** A soft black disc that fades to nothing at its edge. */
function softDisc() {
  if (blobMap) return blobMap;
  blobMap = radialDisc([
    [0, "rgba(0,0,0,1)"],
    [0.45, "rgba(0,0,0,0.6)"],
    [1, "rgba(0,0,0,0)"],
  ]);
  return blobMap;
}
const blobGeometry = new THREE.PlaneGeometry(1, 1);
const foot = new THREE.Vector3();
const hold = new THREE.Vector3();

export const rand = (a: number, b: number) => a + Math.random() * (b - a);

export type Mode = "idle" | "fall" | "rest" | "rise" | "walk" | "chat" | "held";

/** A knot of robots standing in a ring, talking. */
export type Huddle = { x: number; z: number; phase: number; members: Bot[] };

const turnTo = (from: number, to: number, max: number) =>
  from +
  THREE.MathUtils.clamp(
    Math.atan2(Math.sin(to - from), Math.cos(to - from)),
    -max,
    max
  );

/** One robot: falls with momentum, bounces until the hops die out, lies dead; then it either fades or (half the time) gets up, walks, and joins a huddle. */
export class Bot {
  root = new THREE.Group();
  mode: Mode = "idle";
  pos = new THREE.Vector3();
  vel = new THREE.Vector3();
  /** Tumble rates about x and z while falling. */
  spin = new THREE.Vector3();
  /** Heading, and the tilt of the body away from upright. */
  private yaw = new THREE.Quaternion();
  private tilt = new THREE.Quaternion();
  /** The soft shadow on the floor under it: it is what makes a body read as touching the ground. */
  blob: THREE.Mesh;
  private blobMat: THREE.MeshBasicMaterial;
  private alpha = 1;
  /** True while it is on the near half of the floor, drawn over the copy. */
  front = true;
  private bounces = 0;
  private heading = 0;
  private lying = 0;
  private mixer: THREE.AnimationMixer | null = null;
  private idle: THREE.AnimationAction | null = null;
  private death: THREE.AnimationAction | null = null;
  /** The arms and chest of the walk, and of standing: the legs never come from these. */
  private walk: THREE.AnimationAction | null = null;
  private stand: THREE.AnimationAction | null = null;
  /** The legs: the walking clip striding, or the standing pose held still. Both move the feet too, so a foot always follows its leg. */
  private stride: THREE.AnimationAction | null = null;
  private pose: THREE.AnimationAction | null = null;
  /** How much of the legs the walking clip owns (0 while falling or lying), and how much of that is striding rather than standing. */
  private legsOn = 0;
  private striding = 0;
  /** Ground speed this frame (units/s): the legs stride only while it moves, not while it turns on the spot. */
  private speed = 0;

  private gestures: THREE.AnimationAction[] = [];
  private cur: THREE.AnimationAction | null = null;
  /** Whether this one gets up after it lands, and how long after the Death clip ends. */
  private rises = false;
  private riseAt = 0;
  private rising = 0;
  /** Standing life: where it is walking to (world), the huddle it belongs to and its place in the ring, seconds left, pauses. */
  goal: THREE.Vector2 | null = null;
  group: Huddle | null = null;
  slot = 0;
  private life = 0;
  private pause = 0;
  private gait = 0;
  private chatT = 0;
  /** Seconds since the Death clip started. */
  private dying = 0;
  private mats: THREE.MeshStandardMaterial[] = [];
  /** The ankle bones, and where the lowest of them sits under the root when standing: the reference every walking frame is pinned to the floor with. */
  private feet: THREE.Object3D[] = [];
  private sole = 0;
  private soleWalk = 0;
  private lift = 0;
  private turn = new THREE.Quaternion();
  /** What the limp physics reads: the robot, and how loose its limbs are (0 = the pose, 1 = fully limp). */
  robot: THREE.Object3D = this.root;
  limp: Limp | null = null;
  limpW = 0;
  /** A hero drop: slow motion through the beam, a big landing. */
  private hero = false;
  /** A twitch on the floor, 1 → 0: the robot is dead metal that still remembers a current. */
  jolt = 0;
  /** Seconds on its feet since it got up. */
  private stood = 0;
  /** Thrown by the visitor: it always gets up again. */
  private thrown = false;
  /** In the hand: where the cursor wants the head, where the head is, and how fast it moves (what a throw takes). */
  readonly hand = {
    aim: new THREE.Vector3(),
    at: new THREE.Vector3(),
    v: new THREE.Vector3(),
  };
  private euler = new THREE.Euler();

  constructor(gltf: GLTF, scale: number, centre: THREE.Vector3) {
    const scene = clone(gltf.scene);
    const made = new Map<string, THREE.MeshStandardMaterial>();
    scene.traverse(obj => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = true;
      const p = PALETTE[obj.material.name];
      if (!p) return;
      let m = made.get(obj.material.name);
      if (!m) {
        // Standard, not physical: eight of them are on screen twice over, and the lacquer sheen is not worth a second shader.
        m = new THREE.MeshStandardMaterial({
          color: p.color,
          metalness: p.metalness,
          roughness: p.roughness,
          flatShading: obj.material.flatShading,
          transparent: true,
        });
        made.set(obj.material.name, m);
        this.mats.push(m);
      }
      obj.material = m;
    });
    // The Idle clip, frozen at 1.2s, stands in for a limp, falling body; the Death clip plays the moment the feet touch the floor.
    const idle = THREE.AnimationClip.findByName(gltf.animations, "Idle");
    const death = THREE.AnimationClip.findByName(gltf.animations, "Death");
    if (idle && death) {
      this.mixer = new THREE.AnimationMixer(scene);
      this.idle = this.mixer.clipAction(holdArms(idle, scene));
      this.idle.play();
      this.idle.time = STILL;
      this.idle.paused = true;
      this.death = this.mixer.clipAction(holdArms(death, scene));
      this.death.setLoop(THREE.LoopOnce, 1);
      this.death.clampWhenFinished = true;
      for (const name of GESTURES) {
        const clip = THREE.AnimationClip.findByName(gltf.animations, name);
        if (clip) this.gestures.push(this.mixer.clipAction(upperBody(clip)));
      }
      const walk = THREE.AnimationClip.findByName(gltf.animations, "Walking");
      if (walk) {
        this.walk = this.mixer.clipAction(upperBody(holdArms(walk, scene)));
        this.stand = this.mixer.clipAction(upperBody(holdArms(idle, scene)));
        this.stride = this.mixer.clipAction(legsOnly(walk));
        // The standing pose: the idle legs, held still, with each foot where it sits in the model. The idle clip never moves the feet (the walk does), so they are pinned here, and a foot blends from stride to stance with its leg.
        const stance = legsOnly(idle);
        for (const name of ["FootL", "FootR"]) {
          const bone = scene.getObjectByName(name);
          if (bone)
            stance.tracks.push(
              new THREE.VectorKeyframeTrack(
                `${name}.position`,
                [0],
                bone.position.toArray()
              )
            );
        }
        this.pose = this.mixer.clipAction(stance);
      }
      this.mixer.update(0);
    }
    const body = new THREE.Group();
    body.scale.setScalar(scale);
    body.position.copy(centre).multiplyScalar(-scale);
    body.add(scene);
    this.root.add(body);
    this.blobMat = new THREE.MeshBasicMaterial({
      map: softDisc(),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    this.blob = new THREE.Mesh(blobGeometry, this.blobMat);
    this.blob.rotation.x = -Math.PI / 2;
    this.blob.visible = false;
    this.root.visible = false;
    this.root.position.copy(ORIGIN);
    this.root.updateMatrixWorld(true);
    this.limp = makeLimp(this.root);
    this.feet = ["FootL_end", "FootR_end"].flatMap(name => {
      const bone = scene.getObjectByName(name);
      return bone ? [bone] : [];
    });
    this.calibrate();
  }

  /** Where the lowest ankle sits on the standing pose and over the whole stride: the heights every frame is pinned to the floor with. */
  private calibrate() {
    const { stride, pose, mixer } = this;
    // Each clip remembers the pose of the bones it moves the first time it plays, and blends back to it when it fades. The arm clips must meet the model in its own pose: left to their first real play, a robot that has been thrown around would teach them its flung arms.
    if (mixer)
      for (const action of [
        this.walk,
        this.stand,
        this.death,
        ...this.gestures,
      ]) {
        action?.reset().play();
        mixer.update(0);
      }
    mixer?.stopAllAction();
    if (!stride || !pose || !mixer || this.feet.length === 0) {
      this.sole = this.lowestFoot();
      this.soleWalk = this.sole;
      return;
    }
    const measure = (action: THREE.AnimationAction, at: number[]) => {
      mixer.stopAllAction();
      action.reset().play();
      action.paused = true;
      let low = Infinity;
      for (const time of at) {
        action.time = time;
        mixer.update(0);
        low = Math.min(low, this.lowestFoot());
      }
      return low;
    };
    const length = stride.getClip().duration;
    this.sole = measure(pose, [STILL]);
    this.soleWalk = measure(
      stride,
      Array.from({ length: 16 }, (_, i) => (length * i) / 16)
    );
    this.reset();
  }

  /** Height of its lowest ankle above the root's origin (the root must be upright). */
  private lowestFoot() {
    this.root.updateMatrixWorld(true);
    let low = Infinity;
    for (const bone of this.feet) {
      bone.getWorldPosition(foot);
      low = Math.min(low, foot.y);
    }
    return low - this.root.position.y;
  }

  /** Keeps the standing body's lowest foot on the floor: the walk and the idle bob the hips, and without this the sole drifts above the shadow. */
  private ground(dt: number) {
    if (this.feet.length === 0) return;
    // Standing flat and striding sit differently on the floor: follow the walk's share of the blend.
    const sole = this.sole + (this.soleWalk - this.sole) * this.striding;
    const target = sole - this.lowestFoot();
    this.lift += (target - this.lift) * (1 - Math.exp(-30 * dt));
  }

  /** Back to the frozen Idle pose, ready to fall. */
  private reset() {
    this.mixer?.stopAllAction();
    if (this.idle) {
      this.idle.timeScale = 1;
      this.idle.play();
      this.idle.time = STILL;
      this.idle.paused = true;
    }
    this.cur = null;
    // The walk and the fall move the feet and the idle never does: back to where they sit on the model.
    if (this.limp) restFeet(this.limp);
    this.mixer?.update(0);
    this.dying = 0;
  }

  /** Crossfades to a clip. */
  private to(next: THREE.AnimationAction | null, fade = 0.3, once = false) {
    if (!next || next === this.cur) return;
    next.reset();
    next.timeScale = 1;
    next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
    next.clampWhenFinished = once;
    next.play();
    if (this.cur) next.crossFadeFrom(this.cur, fade, false);
    this.cur = next;
  }

  /** The body's orientation: heading, then tilt. */
  private face() {
    this.yaw.setFromAxisAngle(UP, this.heading);
    return this.root.quaternion.multiplyQuaternions(this.yaw, this.tilt);
  }

  /** Starts a fall from above the frame at (x, z). */
  drop(x: number, z: number, hero = false) {
    this.hero = hero;
    this.mode = "fall";
    // Limbs start from the pose, then let go.
    for (const limb of this.limp ?? []) limb.primed = false;
    this.limpW = 1;
    this.bounces = 0;
    this.lying = 0;
    this.rises = false;
    this.thrown = false;
    this.goal = null;
    this.group = null;
    this.reset();
    this.setOpacity(1);
    this.pos.set(ORIGIN.x + x, LOOK_Y + depthAt(z) * TAN + 2, z);
    const drift = rand(...DRIFT) * (hero ? SLOW : 1);
    const way = rand(0, Math.PI * 2);
    this.vel.set(Math.sin(way) * drift, 0, Math.cos(way) * drift * 0.5);
    const k = hero ? SLOW : 1;
    this.spin.set(rand(-TUMBLE, TUMBLE) * k, 0, rand(-TUMBLE, TUMBLE) * k);
    this.heading = rand(0, Math.PI * 2);
    this.tilt.setFromEuler(
      this.euler.set(rand(-TILT, TILT), 0, rand(-TILT, TILT))
    );
  }

  /** Already lying where it would have landed (reduced motion). */
  place(x: number, z: number) {
    this.mode = "rest";
    this.lying = 0;
    this.limpW = 0;
    this.setOpacity(1);
    this.pos.set(ORIGIN.x + x, STAND, z);
    this.heading = rand(0, Math.PI * 2);
    this.rises = false;
    this.tilt.identity();
    this.reset();
    this.startDeath();
    this.mixer?.update(DEATH_END);
    this.dying = DEATH_END;
  }

  /** The Death clip, from the instant of contact. */
  private startDeath() {
    if (!this.death || !this.idle) return;
    this.death.reset();
    this.death.timeScale = 1;
    this.death.play();
    this.death.crossFadeFrom(this.idle, 0.08, false);
    this.cur = this.death;
  }

  private setOpacity(o: number) {
    this.alpha = o;
    for (const m of this.mats) m.opacity = o;
  }

  private land(sound: { at: number }, time: number, strength: number) {
    const near = Math.hypot(this.pos.x - AIM.x, this.pos.z - AIM.z) < POOL;
    landings.push({
      x: this.pos.x,
      y: 0.05,
      z: this.pos.z,
      lit: near || this.hero,
      power: (this.hero ? 3 : 1) * strength,
    });
    // The frame feels the close ones; a hero landing is the big beat: the frame jumps and the lamp flares.
    const close = THREE.MathUtils.clamp((this.pos.z + 6) / 8, 0.15, 1);
    shake.v = Math.max(shake.v, (this.hero ? 0.5 : close * 0.2) * strength);
    if (this.hero && strength === 1) flash.v = 1;
    // A clang when it hits the light, a thud when it lands close; the far ones stay silent, and never more than a few a second.
    if (
      strength === 1 &&
      time - sound.at > 0.3 &&
      (near || this.hero || this.pos.z > -4)
    ) {
      sound.at = time;
      play(near || this.hero ? "clang" : "thud");
    }
  }

  /** The feet meet the floor: bounce by restitution, friction takes sideways speed, spin bleeds off; below REST_SPEED it stays down. */
  private impact(sound: { at: number }, time: number) {
    const closing = -this.vel.y;
    const give = closing > REST_SPEED ? RESTITUTION : 0;
    const side = Math.hypot(this.vel.x, this.vel.z);
    if (side > 1e-4) {
      const keep = Math.max(0, 1 - (FRICTION * (1 + give) * closing) / side);
      this.vel.x *= keep;
      this.vel.z *= keep;
    }
    this.pos.y = STAND;
    this.vel.y = closing * give;
    this.spin.multiplyScalar(0.5);
    const first = this.bounces === 0;
    this.bounces += 1;
    if (first) {
      this.limpW = 0.5;
      this.startDeath();
      this.rises = this.thrown || Math.random() < 0.5;
      this.riseAt = rand(1, 2.5);
    }
    this.land(sound, time, first ? 1 : 0.3);
    if (give === 0) {
      this.vel.y = 0;
      this.mode = "rest";
      this.lying = 0;
    }
  }

  /** Sliding on the floor: constant deceleration, never reversing. */
  private skid(dt: number) {
    const speed = Math.hypot(this.vel.x, this.vel.z);
    if (speed < 1e-4) return this.vel.set(0, 0, 0);
    const k = Math.max(0, speed - FLOOR_DRAG * dt) / speed;
    this.vel.x *= k;
    this.vel.z *= k;
  }

  /** The Death clip, backwards: it gets up. */
  private rise() {
    const death = this.death;
    if (!death) return;
    this.mode = "rise";
    this.rising = 0;
    this.vel.set(0, 0, 0);
    death.reset();
    death.timeScale = -1;
    death.time = death.getClip().duration;
    death.play();
    this.cur = death;
  }

  /** Left alone in a huddle: back on its feet, wandering. */
  disband() {
    this.group = null;
    this.goal = null;
    this.pause = 0;
    if (this.mode === "chat") this.mode = "walk";
    this.to(this.walk);
  }

  /** Walk to a spot on the floor (relative to the set). */
  goTo(x: number, z: number) {
    this.goal ??= new THREE.Vector2();
    this.goal.set(ORIGIN.x + x, z);
    // A new walk starts the arms and the legs from the same step, from the standing pose, so the two never fall out of phase.
    if (this.striding < 0.05 && this.stride) this.stride.time = 0;
    this.to(this.walk);
  }

  /** On its feet, free to be given somewhere to go. */
  get ready() {
    return this.mode === "walk" && !this.goal && !this.group && this.pause <= 0;
  }

  /** On the near half of the floor, on its feet for half a second, and not fading: the ones the visitor can pick up. */
  get grabbable() {
    return (
      (this.mode === "walk" || this.mode === "chat") &&
      this.front &&
      this.life > 0 &&
      this.stood >= GRAB_AFTER
    );
  }

  /** Where the head is, for aiming the hand. */
  headAt(out: THREE.Vector3) {
    return out.copy(this.pos).addScaledVector(UP, HEAD);
  }

  /** Taken by the head: it goes limp and hangs from the hand. */
  pickUp() {
    this.mode = "held";
    this.goal = null;
    this.group = null;
    for (const limb of this.limp ?? []) limb.primed = false;
    this.reset();
    this.setOpacity(1);
    this.headAt(this.hand.at);
    this.hand.aim.copy(this.hand.at);
    this.hand.v.set(0, 0, 0);
    play("pop");
  }

  /** Let go: it leaves the hand at the hand's speed, falls, lands, and gets up again. */
  letGo() {
    if (this.mode !== "held") return;
    this.vel.copy(this.hand.v).clampLength(0, THROW_MAX);
    this.spin.set(rand(-0.3, 0.3), 0, rand(-0.3, 0.3));
    this.mode = "fall";
    this.bounces = 0;
    this.hero = false;
    this.thrown = true;
  }

  /** Keeps a thrown or sliding body on the floor the camera sees. */
  private walls() {
    const z = THREE.MathUtils.clamp(this.pos.z, -9, 1.5);
    const half = halfView(depthAt(z), WALL_ASPECT) * 0.9;
    const x = THREE.MathUtils.clamp(
      this.pos.x,
      ORIGIN.x - half,
      ORIGIN.x + half
    );
    if (x !== this.pos.x) this.vel.x *= -0.3;
    if (z !== this.pos.z) this.vel.z *= -0.3;
    this.pos.x = x;
    this.pos.z = z;
  }

  /** Walking or chatting and not yet fading: the ones a huddle can count on. */
  get active() {
    return (this.mode === "walk" || this.mode === "chat") && this.life > 0;
  }

  private walking(dt: number) {
    this.gait += (1 - this.gait) * (1 - Math.exp(-3 * dt));
    const goal = this.goal;
    if (!goal) {
      this.speed = 0;
      this.pause -= dt;
      return;
    }
    const dx = goal.x - this.pos.x;
    const dz = goal.y - this.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < ARRIVE) {
      this.goal = null;
      this.to(this.stand);
      if (this.group) {
        this.mode = "chat";
        this.chatT = rand(0.3, 1.5);
      } else this.pause = rand(0.8, 2.2);
      return;
    }
    const want = Math.atan2(dx, dz);
    this.heading = turnTo(this.heading, want, TURN * dt);
    const ahead = Math.max(0, Math.cos(want - this.heading));
    const speed =
      PACE * this.gait * ahead * THREE.MathUtils.clamp(dist / 0.25, 0.3, 1);
    this.speed = speed;
    this.pos.x += Math.sin(this.heading) * speed * dt;
    this.pos.z += Math.cos(this.heading) * speed * dt;
    const pace = 0.3 + (speed / PACE) * 1.1;
    if (this.walk) this.walk.timeScale = pace;
    if (this.stride) this.stride.timeScale = pace;
  }

  /** In the hand: the head follows the cursor, the body hangs below it and trails the move. */
  private holding(dt: number) {
    const { aim, at, v } = this.hand;
    const was = hold.copy(at);
    at.lerp(aim, 1 - Math.exp(-22 * dt));
    if (dt > 0)
      v.lerp(was.sub(at).multiplyScalar(-1 / dt), 1 - Math.exp(-18 * dt));
    this.pos.copy(at).addScaledVector(UP, -HEAD);
    const lean = (a: number) => THREE.MathUtils.clamp(a, -0.4, 0.4);
    this.turn.setFromEuler(
      this.euler.set(lean(v.z * 0.05), 0, lean(-v.x * 0.05))
    );
    this.tilt.slerp(this.turn, 1 - Math.exp(-10 * dt));
  }

  /** The legs on their feet are the walking clip's and nobody else's: striding while it walks, held on the standing frame otherwise, faded in as the robot gets up. */
  private legs(dt: number) {
    const { stride, pose } = this;
    if (!stride || !pose) return;
    if (this.mode !== "walk" && this.mode !== "chat") {
      this.legsOn = 0;
      this.striding = 0;
      stride.stop();
      pose.stop();
      return;
    }
    if (!stride.isRunning()) {
      stride.reset().play();
      pose.reset().play();
      pose.time = STILL;
      pose.paused = true;
    }
    const k = (rate: number) => 1 - Math.exp(-rate * dt);
    this.legsOn += (1 - this.legsOn) * k(12);
    const going = this.mode === "walk" && this.goal && this.speed > 0.1 ? 1 : 0;
    this.striding += (going - this.striding) * k(9);
    stride.setEffectiveWeight(this.legsOn * this.striding);
    pose.setEffectiveWeight(this.legsOn * (1 - this.striding));
  }

  private chatting(dt: number) {
    const huddle = this.group;
    if (huddle)
      this.heading = turnTo(
        this.heading,
        Math.atan2(ORIGIN.x + huddle.x - this.pos.x, huddle.z - this.pos.z),
        3 * dt
      );
    this.chatT -= dt;
    if (this.chatT > 0) return;
    if (this.cur !== this.stand) {
      this.to(this.stand);
      this.chatT = rand(1, 3);
    } else {
      const say =
        this.gestures[Math.floor(Math.random() * this.gestures.length)];
      this.to(say, 0.25, true);
      this.chatT = say?.getClip().duration ?? 2;
    }
  }

  step(dt: number, sound: { at: number }, time: number) {
    this.root.visible = this.mode !== "idle" || warm.on;
    this.blob.visible = this.root.visible;
    if (this.mode === "held") this.front = true;
    else if (this.pos.z > FRONT_Z + SLACK) this.front = true;
    else if (this.pos.z < FRONT_Z - SLACK) this.front = false;
    if (this.mode === "fall") {
      this.vel.y -= GRAVITY * (this.hero ? SLOW : 1) * dt;
      const drag = Math.exp(-AIR * dt);
      this.vel.x *= drag;
      this.vel.z *= drag;
      this.pos.addScaledVector(this.vel, dt);
      // Angular momentum carries the tilt; once the feet have touched, it bleeds off and the body rights itself.
      this.turn.setFromEuler(
        this.euler.set(this.spin.x * dt, 0, this.spin.z * dt)
      );
      this.tilt.premultiply(this.turn);
      if (this.bounces > 0) {
        this.spin.multiplyScalar(Math.exp(-SPIN_DAMP * dt));
        this.tilt.slerp(IDENTITY, 1 - Math.exp(-RIGHT * dt));
      }
      this.walls();
      if (this.pos.y <= STAND && this.vel.y < 0) this.impact(sound, time);
    } else if (this.mode === "held") {
      this.holding(dt);
    } else if (this.mode === "rest") {
      this.lying += dt;
      this.jolt *= Math.exp(-5 * dt);
      this.skid(dt);
      this.pos.addScaledVector(this.vel, dt);
      this.walls();
      this.tilt.slerp(IDENTITY, 1 - Math.exp(-RIGHT * dt));
      const gone = (this.lying - LIE) / FADE;
      if (gone > 0) this.setOpacity(Math.max(0, 1 - gone));
      if (gone >= 1) this.mode = "idle";
      else if (this.rises && this.dying >= DEATH_END + this.riseAt) this.rise();
    } else if (this.mode === "rise") {
      this.rising += dt;
      const length = this.death?.getClip().duration ?? DEATH_END;
      if (this.rising >= length - 0.25) {
        this.mode = "walk";
        this.gait = 0.3;
        this.stood = 0;
        this.pause = 0;
        this.life = rand(...ACTIVE);
        this.to(this.walk, 0.3);
      }
    }
    if (this.mode === "walk" || this.mode === "chat") {
      this.life -= dt;
      this.stood += dt;
      if (this.mode === "walk") this.walking(dt);
      else this.chatting(dt);
      if (this.life < 0) {
        const gone = -this.life / FADE;
        this.setOpacity(Math.max(0, 1 - gone));
        if (gone >= 1) this.mode = "idle";
      }
    }
    this.legs(dt);
    if (this.mode !== "idle" && (this.mode !== "fall" || this.bounces > 0)) {
      this.mixer?.update(dt);
      this.dying += dt;
    }
    this.shade();
    this.face();
    // The clip pivots at the feet, so it lays the body on the floor by itself.
    this.root.position.copy(this.pos);
    // Standing on its feet: pinned to the floor. Anywhere else (falling, lying) the clip and the physics own the height.
    if (this.mode === "walk" || this.mode === "chat") this.ground(dt);
    else this.lift = 0;
    this.root.position.y += this.lift;
    if (this.jolt > 0.01) {
      this.root.quaternion.multiply(
        this.turn.setFromEuler(
          this.euler.set(0, 0, Math.sin(time * 48) * this.jolt * 0.1)
        )
      );
      this.root.position.y += Math.abs(Math.sin(time * 31)) * this.jolt * 0.015;
    }
    // Limbs hang loose and trail the body while it falls; once down, the clip poses them.
    this.limpW +=
      ((this.mode === "held" || (this.mode === "fall" && this.bounces === 0)
        ? 1
        : 0) -
        this.limpW) *
      (1 - Math.exp(-9 * dt));
    if (this.mode !== "idle") limpStep(this, dt);
  }

  /** Places the floor shadow: wide and dark at the floor, small and faint as the body leaves it. */
  private shade() {
    const up = Math.max(0, this.pos.y - STAND);
    const up01 = Math.max(0, 1 - up / 0.9);
    const stand =
      this.mode === "walk" || this.mode === "chat" || this.mode === "rise";
    const size = (stand ? FOOT.stand : FOOT.lie) * (1 + up * 0.8);
    this.blob.position.set(this.pos.x, 0.006, this.pos.z);
    this.blob.scale.set(size, size, 1);
    this.blobMat.opacity = BLOB * up01 * this.alpha;
  }

  get resting() {
    return this.mode === "rest" && this.dying >= DEATH_END;
  }
}
