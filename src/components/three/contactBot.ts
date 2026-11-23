import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

import { radialDisc } from "./aboutRoom";
import { ORIGIN } from "./contactShot";
import { PALETTE } from "./HeroRobot";
import { warm } from "./Warmup";

/** Walking pace (units/s), picked at random for each walk; where it counts as arrived; and the root's height above the floor when the feet stand on it. */
const PACE = [0.8, 1] as const;
const ARRIVE = 0.05;
const ROOT_Y = 0.05;
/** Depth (world z) that splits the floor: a robot nearer than this is drawn by the canvas over the copy, a farther one by the canvas behind it. */
const FRONT_Z = -3.5;
/** Depths between which a robot fades into the dark: fully there at the first, gone at the second. So one walking away melts into the black instead of vanishing. */
const FADE_FROM = -7;
const FADE_TO = -10;
/** The walk clip's speed for each unit of pace, so the legs keep up with the ground. */
const CADENCE = 1.8;
/** Share of the walks in which the robot waves once, and the seconds into the walk it does. */
const WAVE_SHARE = 0.35;
const WAVE_AT = [1, 5] as const;
/** Seconds the wave takes to blend in and out of the walking arms. */
const WAVE_BLEND = 0.3;
const LEG = /^(Hips|UpperLeg|LowerLeg|Leg|Foot)/;
const smooth = (t: number) => {
  const k = THREE.MathUtils.clamp(t, 0, 1);
  return k * k * (3 - 2 * k);
};

/** Only the hips, legs and feet of a clip, or (`legs` false) only the rest: the arms, head and chest. They are blended apart so an arm can wave while the legs keep walking. */
function part(clip: THREE.AnimationClip, legs: boolean) {
  const out = clip.clone();
  out.tracks = out.tracks.filter(track => LEG.test(track.name) === legs);
  return out;
}
/** How dark the soft shadow under a robot is, and how wide. */
const BLOB = 0.6;
const FOOT = 0.36;
const UP = new THREE.Vector3(0, 1, 0);

export const rand = (a: number, b: number) => a + Math.random() * (b - a);

let blobMap: THREE.CanvasTexture | null = null;
/** A soft black disc that fades to nothing at its edge. */
function softDisc() {
  blobMap ??= radialDisc([
    [0, "rgba(0,0,0,1)"],
    [0.45, "rgba(0,0,0,0.6)"],
    [1, "rgba(0,0,0,0)"],
  ]);
  return blobMap;
}
const blobGeometry = new THREE.PlaneGeometry(1, 1);

/** One robot: walks a straight line from one point to another, and is gone on arrival. */
export class Bot {
  root = new THREE.Group();
  /** The soft shadow on the floor under it: it is what makes a body read as touching the ground. */
  blob: THREE.Mesh;
  active = false;
  /** True while it is on the near half of the floor, drawn over the copy. */
  front = true;
  private pos = new THREE.Vector3();
  private goal = new THREE.Vector2();
  private heading = 0;
  private mixer: THREE.AnimationMixer | null = null;
  private legs: THREE.AnimationAction | null = null;
  private arms: THREE.AnimationAction | null = null;
  private wave: THREE.AnimationAction | null = null;
  private pace = 0;
  private waveIn = Infinity;
  private waveT = 0;
  private waving = false;
  private mats: THREE.MeshStandardMaterial[] = [];
  private blobMat: THREE.MeshBasicMaterial;
  private opacity = 1;
  private presence = 1;

  constructor(gltf: GLTF, scale: number, centre: THREE.Vector3) {
    const scene = clone(gltf.scene);
    const made = new Map<string, THREE.MeshStandardMaterial>();
    scene.traverse(obj => {
      if (!(obj instanceof THREE.Mesh)) return;
      const p = PALETTE[obj.material.name];
      if (!p) return;
      let m = made.get(obj.material.name);
      if (!m) {
        // Standard, not physical: the lacquer sheen is not worth a second shader. Transparent so the page's presence can fade it.
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
    const find = (name: string) =>
      THREE.AnimationClip.findByName(gltf.animations, name);
    const walk = find("Walking");
    const wave = find("Wave");
    if (walk) {
      this.mixer = new THREE.AnimationMixer(scene);
      this.legs = this.mixer.clipAction(part(walk, true));
      this.arms = this.mixer.clipAction(part(walk, false));
      if (wave) {
        this.wave = this.mixer.clipAction(part(wave, false));
        this.wave.setLoop(THREE.LoopOnce, 1);
      }
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
    this.blob.scale.set(FOOT, FOOT, 1);
    this.blob.position.y = 0.006;
    this.root.visible = this.blob.visible = false;
    this.root.position.copy(ORIGIN);
  }

  /** Starts walking from (x, z) to (gx, gz), in world space. */
  start(x: number, z: number, gx: number, gz: number) {
    this.pos.set(x, ROOT_Y, z);
    this.goal.set(gx, gz);
    this.heading = Math.atan2(gx - x, gz - z);
    this.front = z > FRONT_Z;
    this.active = true;
    this.pace = rand(...PACE);
    this.waveIn = Math.random() < WAVE_SHARE ? rand(...WAVE_AT) : Infinity;
    this.waving = false;
    this.mixer?.stopAllAction();
    for (const action of [this.legs, this.arms]) {
      if (!action) continue;
      action.timeScale = CADENCE * this.pace;
      action.setEffectiveWeight(1);
      action.reset().play();
    }
  }

  /** A wave, once, over the walking arms: it blends in, plays, and blends back out. */
  private wavesAt(dt: number) {
    const { wave, arms } = this;
    if (!wave || !arms) return;
    this.waveIn -= dt;
    if (this.waveIn > 0) return;
    if (!this.waving) {
      this.waving = true;
      this.waveT = 0;
      wave.reset().play();
    }
    this.waveT += dt;
    const length = wave.getClip().duration;
    const k =
      smooth(this.waveT / WAVE_BLEND) *
      smooth((length - this.waveT) / WAVE_BLEND);
    wave.setEffectiveWeight(k);
    arms.setEffectiveWeight(1 - k);
    if (this.waveT < length) return;
    wave.stop();
    arms.setEffectiveWeight(1);
    this.waving = false;
    this.waveIn = Infinity;
  }

  /** The page's presence (0 to 1): how much of itself the room shows. */
  dim(v: number) {
    this.presence = v;
  }

  /** Sets the robot's opacity: the page's presence, times how far into the dark it has walked. */
  private fadeTo(depth: number) {
    const t = THREE.MathUtils.clamp(
      (depth - FADE_TO) / (FADE_FROM - FADE_TO),
      0,
      1
    );
    const o = this.presence * t * t * (3 - 2 * t);
    if (Math.abs(o - this.opacity) < 0.002) return;
    this.opacity = o;
    for (const m of this.mats) m.opacity = o;
    this.blobMat.opacity = BLOB * o;
  }

  /** Gone at once. The warm-up draws it once so its shaders are built. */
  vanish() {
    if (this.active) this.mixer?.stopAllAction();
    this.active = false;
    this.root.visible = this.blob.visible = warm.on;
  }

  step(dt: number) {
    this.root.visible = this.blob.visible = this.active || warm.on;
    if (!this.active) return;
    const dx = this.goal.x - this.pos.x;
    const dz = this.goal.y - this.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < ARRIVE) return this.vanish();
    const move = Math.min(dist, this.pace * dt);
    this.pos.x += (dx / dist) * move;
    this.pos.z += (dz / dist) * move;
    this.wavesAt(dt);
    this.mixer?.update(dt);
    this.front = this.pos.z > FRONT_Z;
    this.fadeTo(this.pos.z);
    this.root.quaternion.setFromAxisAngle(UP, this.heading);
    this.root.position.copy(this.pos);
    this.blob.position.set(this.pos.x, this.blob.position.y, this.pos.z);
  }
}
