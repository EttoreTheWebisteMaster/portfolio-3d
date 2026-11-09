"use client";

import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

import {
  BEAT,
  ease,
  type Progress,
  seg,
  TRANSITION_SECONDS,
} from "@/lib/journey";

import { FLOOR_Y, mulberry32 } from "./HeroLight";
import { PALETTE } from "./HeroRobot";

const COUNT = 72;
/** Seats scatter over this patch of floor (x, z). */
const AREA = { x: 23, near: 1.5, far: -16 };
const MIN_GAP = 2.4;
/** Seats sit in this patch of floor; the camera sees about this much sideways per unit of depth. */
const VIEW_SLOPE = 0.75;
const VIEW_MARGIN = 3;
/** Depth of the camera on Home, for working out where the frame ends. */
const CAM_Z = 7.4;
/** World speed (units/s) one cycle of each clip covers; the clip is sped up or slowed to match the ground. */
const WALK_SPEED = 2;
const RUN_SPEED = 5;
const RUN_ABOVE = 3.2;

type Walker = {
  robot: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  idle: THREE.AnimationAction;
  gait: THREE.AnimationAction;
  from: THREE.Vector2;
  to: THREE.Vector2;
  start: number;
  end: number;
  heading: number;
  facing: number;
  rate: number;
  weight: number;
  last: number;
};

/** Soft dark pool under a robot, so it stands on the floor instead of hovering over it. */
function blobTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(0,0,0,0.85)");
    g.addColorStop(0.5, "rgba(0,0,0,0.4)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(canvas);
}

function angleLerp(a: number, b: number, t: number) {
  const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + d * t;
}

/** Random seats with a minimum gap, keeping the lead robot's lane clear. */
function scatter(rand: () => number) {
  const seats: THREE.Vector2[] = [];
  for (let tries = 0; seats.length < COUNT && tries < 4000; tries++) {
    const x = (rand() * 2 - 1) * AREA.x;
    const z = AREA.far + rand() * (AREA.near - AREA.far);
    if (Math.abs(x) < 3.4 && z > -8) continue;
    const p = new THREE.Vector2(x, z);
    if (seats.every(s => s.distanceTo(p) > MIN_GAP)) seats.push(p);
  }
  return seats;
}

/**
 * One robot: it waits beyond the edge of the frame at its depth, walks in at constant speed, and stops at its seat.
 * It is never faded in: it simply isn't on screen until it walks into view.
 */
function plan(seat: THREE.Vector2, rand: () => number) {
  const side = seat.x < 0 ? -1 : 1;
  const edge = VIEW_SLOPE * Math.max(CAM_Z - seat.y, 1) + VIEW_MARGIN;
  const from = new THREE.Vector2(
    side * (Math.max(Math.abs(seat.x), edge) + 1 + rand() * 4),
    seat.y + (rand() - 0.5) * 3
  );
  const start = BEAT.walk[0] + rand() * 0.2;
  const end = Math.min(BEAT.walk[1], start + 0.6 + rand() * 0.25);
  const speed = from.distanceTo(seat) / ((end - start) * TRANSITION_SECONDS);
  return { from, start, end, speed };
}

/** Moves one robot along the journey, blends gait and idle, and turns it to face the screen on arrival. */
function advance(w: Walker, p: number, dt: number) {
  const t = seg(p, [w.start, w.end]);
  // Linear, with a soft stop: speed eases off over the last stretch.
  const u = THREE.MathUtils.lerp(t, 1 - (1 - t) ** 2, 0.45);
  w.robot.position.set(
    THREE.MathUtils.lerp(w.from.x, w.to.x, u),
    FLOOR_Y,
    THREE.MathUtils.lerp(w.from.y, w.to.y, u)
  );
  w.robot.rotation.y = angleLerp(w.heading, w.facing, ease(seg(t, [0.82, 1])));

  // Walk while the journey is carrying it (backwards when it reverses); idle otherwise.
  const step = u - w.last;
  w.last = u;
  const moving = dt > 0 && Math.abs(step) / dt > 0.02 ? 1 : 0;
  w.weight += (moving - w.weight) * (1 - Math.exp(-9 * dt));
  w.gait.setEffectiveWeight(w.weight);
  w.idle.setEffectiveWeight(1 - w.weight);
  w.gait.timeScale = step < 0 ? -w.rate : w.rate;
  w.mixer.update(dt);
}

/** Audience: scattered, in ROB-092's paint, lit by the screen. They walk in from beyond the frame, then stand idle. */
export default function ProjectsCrowd({
  progress,
}: Readonly<{ progress: Progress }>) {
  const gltf = useLoader(GLTFLoader, "/models/RobotExpressive.glb");
  const { walkers, disposables } = useMemo(() => {
    const rand = mulberry32(92);
    const idleClip = THREE.AnimationClip.findByName(gltf.animations, "Idle");
    const walkClip = THREE.AnimationClip.findByName(gltf.animations, "Walking");
    const runClip = THREE.AnimationClip.findByName(gltf.animations, "Running");
    if (!idleClip || !walkClip || !runClip)
      return { walkers: [], disposables: [] };

    // ROB-092's own paint, shared by every robot in the crowd.
    const paint = Object.fromEntries(
      Object.entries(PALETTE).map(([name, p]) => [
        name,
        new THREE.MeshPhysicalMaterial({
          color: p.color,
          metalness: p.metalness,
          roughness: p.roughness,
          clearcoat: p.clearcoat,
          clearcoatRoughness: 0.35,
          envMapIntensity: 0.5,
        }),
      ])
    );

    const blob = {
      geometry: new THREE.PlaneGeometry(2.6, 2.6).rotateX(-Math.PI / 2),
      material: new THREE.MeshBasicMaterial({
        map: blobTexture(),
        transparent: true,
        depthWrite: false,
      }),
    };

    const list: Walker[] = scatter(rand).map(seat => {
      const robot = clone(gltf.scene);
      robot.traverse(obj => {
        if (!(obj instanceof THREE.Mesh)) return;
        obj.material = paint[obj.material.name] ?? paint.Main;
      });
      robot.scale.setScalar(0.92 + rand() * 0.18);
      const shadow = new THREE.Mesh(blob.geometry, blob.material);
      shadow.position.y = 0.03;
      robot.add(shadow);

      const { from, start, end, speed } = plan(seat, rand);
      const running = speed > RUN_ABOVE;
      const mixer = new THREE.AnimationMixer(robot);
      const idle = mixer.clipAction(idleClip);
      const gait = mixer.clipAction(running ? runClip : walkClip);
      idle.time = rand() * idleClip.duration;
      idle.timeScale = 0.85 + rand() * 0.3;
      idle.play();
      gait.play();
      gait.setEffectiveWeight(0);
      mixer.update(0);

      const heading = Math.atan2(seat.x - from.x, seat.y - from.y);
      return {
        robot,
        mixer,
        idle,
        gait,
        from,
        to: seat,
        start,
        end,
        heading,
        facing: Math.PI + (rand() - 0.5) * 0.5,
        rate: THREE.MathUtils.clamp(
          speed / (running ? RUN_SPEED : WALK_SPEED),
          0.7,
          1.6
        ),
        weight: 0,
        last: 0,
      };
    });
    return {
      walkers: list,
      disposables: [...Object.values(paint), blob.material, blob.geometry],
    };
  }, [gltf]);

  useEffect(
    () => () => {
      walkers.forEach(w => w.mixer.stopAllAction());
      disposables.forEach(m => m.dispose());
    },
    [walkers, disposables]
  );

  useFrame((_, dt) => {
    for (const w of walkers) advance(w, progress.current, dt);
  });

  return (
    <>
      {walkers.map(w => (
        <primitive key={w.robot.uuid} object={w.robot} />
      ))}
    </>
  );
}
