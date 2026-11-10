"use client";

import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

import { type Progress } from "@/lib/journey";
import { useLoading } from "@/lib/loading";
import { target } from "@/lib/pointer";
import { view } from "@/lib/projects";
import { armSound, play } from "@/lib/sound";

import {
  alarmNear,
  hands,
  letGo,
  offScreen,
  overRobot,
  pickUp,
  ROOM,
  sendOff,
  startle,
} from "./crowdHands";
import { makeLimp } from "./crowdLimp";
import { fadeCast, fadePools, rimLit } from "./crowdLight";
import { makeStroller, stepStroller } from "./crowdStroller";
import { advance, plan, type Walker } from "./crowdWalk";
import { FLOOR_Y, mulberry32 } from "./HeroLight";
import { PALETTE } from "./HeroRobot";

/** Only seats the final camera can see get a robot: it looks level from (0, 6, 7), so the near rows sit below the frame. */
const COUNT = 30;
const CAM = { z: 7, slope: 0.51, margin: 3 };
/** Nearest depth where a robot's head still reaches into the frame (its top is ~3.2 tall on the floor). */
const NEAREST_Z = -5;
/** How much of ROB-092's paint the crowd keeps. */
const CROWD_DIM = 0.34;
/** Seats scatter over this patch of floor (x, z). */
const AREA = { x: 23, near: 1.5, far: -16 };
const MIN_GAP = 2.4;
/** Interaction only wakes once the room is the page, and a robot is "near" a grab within this many units. */
const LIVE_FROM = 0.97;
const NEAR = 4.5;
/** Anything in here is part of the page's own UI: the cursor is theirs, not the crowd's. */
const UI = "a, button, input, .projects-list";
/** The plane a held robot is dragged across: upright, facing the camera, through the point that was grabbed. So the robot goes where the cursor goes, up, down, left and right. */
const dragPlane = new THREE.Plane();
const facing = new THREE.Vector3();
const point = new THREE.Vector3();
/** How low the hand can take a robot's head above the floor. */
const HEAD_MIN = 0.6;
const ndc = new THREE.Vector2();
const ray = new THREE.Raycaster();
const hit = new THREE.Vector3();
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

/** Random seats with a minimum gap, keeping the lead robot's lane clear. */
function scatter(rand: () => number) {
  const seats: THREE.Vector2[] = [];
  for (let tries = 0; seats.length < COUNT && tries < 4000; tries++) {
    const x = (rand() * 2 - 1) * AREA.x;
    const z = AREA.far + rand() * (AREA.near - AREA.far);
    if (Math.abs(x) < 3.4 && z > -8) continue;
    if (z > NEAREST_Z || Math.abs(x) > (CAM.z - z) * CAM.slope + CAM.margin)
      continue;
    const p = new THREE.Vector2(x, z);
    if (seats.every(s => s.distanceTo(p) > MIN_GAP)) seats.push(p);
  }
  return seats;
}

/** Audience: scattered, in ROB-092's paint, lit by the screen. They walk in from beyond the frame, then stand idle. */
export default function ProjectsCrowd({
  progress,
  reduced,
}: Readonly<{ progress: Progress; reduced: boolean }>) {
  // Waits for the robot the loader already downloaded, so the file is never fetched twice.
  const { modelUrl } = useLoading();
  return modelUrl ? (
    <Crowd progress={progress} reduced={reduced} url={modelUrl} />
  ) : null;
}

function Crowd({
  progress,
  reduced,
  url,
}: Readonly<{ progress: Progress; reduced: boolean; url: string }>) {
  const gltf = useLoader(GLTFLoader, url);
  const camera = useThree(state => state.camera);
  const size = useThree(state => state.size);
  const { walkers, stroller, disposables, castMat, poolMat } = useMemo(() => {
    const rand = mulberry32(92);
    const idleClip = THREE.AnimationClip.findByName(gltf.animations, "Idle");
    const walkClip = THREE.AnimationClip.findByName(gltf.animations, "Walking");
    const runClip = THREE.AnimationClip.findByName(gltf.animations, "Running");
    const waveClip = THREE.AnimationClip.findByName(gltf.animations, "Wave");
    const noClip = THREE.AnimationClip.findByName(gltf.animations, "No");
    if (!idleClip || !walkClip || !runClip)
      return {
        walkers: [],
        stroller: null,
        disposables: [],
        castMat: null,
        poolMat: null,
      };

    // ROB-092's own paint, which every robot copies, so each can catch the beam's light on its own.
    const paint = Object.fromEntries(
      Object.entries(PALETTE).map(([name, p]) => [
        name,
        new THREE.MeshPhysicalMaterial({
          color: p.color,
          metalness: p.metalness,
          roughness: p.roughness,
          clearcoat: 0,
          clearcoatRoughness: 0.35,
          envMapIntensity: 0.2,
        }),
      ])
    );

    // Audience, not cast: dimmed so the screen and the programme stay the brightest things in the room.
    Object.values(paint).forEach(m => m.color.multiplyScalar(CROWD_DIM));
    const skins: THREE.MeshPhysicalMaterial[] = [];

    const blob = {
      geometry: new THREE.PlaneGeometry(2.2, 2.2).rotateX(-Math.PI / 2),
      material: new THREE.MeshBasicMaterial({
        map: blobTexture(),
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    };
    // A robot's shadow on the screen when it stands in the beam.
    const cast = {
      geometry: new THREE.PlaneGeometry(1, 1),
      material: new THREE.MeshBasicMaterial({
        map: blobTexture(),
        transparent: true,
        depthWrite: false,
        opacity: 0.7,
      }),
    };
    const shade = () => {
      const m = new THREE.Mesh(cast.geometry, cast.material);
      m.visible = false;
      return m;
    };
    const pool = () => {
      const shadow = new THREE.Mesh(blob.geometry, blob.material);
      shadow.renderOrder = -1;
      shadow.visible = false;
      return shadow;
    };

    // A copy of the robot in the crowd's paint. Never culled: a skinned limb's bounds are those of its first pose, and it would vanish mid-stride.
    const dress = () => {
      const robot = clone(gltf.scene);
      const own = new Map<THREE.Material, THREE.MeshPhysicalMaterial>();
      robot.traverse(obj => {
        obj.frustumCulled = false;
        if (!(obj instanceof THREE.Mesh)) return;
        const base = paint[obj.material.name] ?? paint.Main;
        let mine = own.get(base);
        if (!mine) {
          mine = base.clone();
          rimLit(mine);
          own.set(base, mine);
          skins.push(mine);
        }
        obj.material = mine;
      });
      return { robot, skin: [...own.values()] };
    };

    const list: Walker[] = scatter(rand).map(seat => {
      const { robot, skin } = dress();
      const base = 0.92 + rand() * 0.18;
      robot.scale.setScalar(base);
      const faces: THREE.Mesh[] = [];
      robot.traverse(obj => {
        if (
          obj instanceof THREE.Mesh &&
          obj.morphTargetDictionary?.Surprised !== undefined
        )
          faces.push(obj);
      });
      const { from, bend, start, end, burst } = plan(seat, rand);
      const head = robot.getObjectByName("Head");
      const gaze = head ? head.quaternion.clone() : new THREE.Quaternion();
      const mixer = new THREE.AnimationMixer(robot);
      const idle = mixer.clipAction(idleClip);
      const walk = mixer.clipAction(walkClip);
      const run = mixer.clipAction(runClip);
      idle.time = rand() * idleClip.duration;
      idle.timeScale = 0.85 + rand() * 0.3;
      [idle, walk, run].forEach(a => a.play());
      walk.setEffectiveWeight(0);
      run.setEffectiveWeight(0);
      const wave = waveClip ? mixer.clipAction(waveClip) : undefined;
      wave?.setLoop(THREE.LoopOnce, 1);
      if (wave) wave.clampWhenFinished = true;
      const protest = noClip ? mixer.clipAction(noClip) : undefined;
      if (protest) {
        protest.play();
        protest.setEffectiveWeight(0);
      }
      mixer.update(0);

      const heading = Math.atan2(bend.x - from.x, bend.y - from.y);
      robot.position.set(from.x, FLOOR_Y, from.y);
      robot.rotation.y = heading;
      return {
        ...hands(
          {
            base,
            faces,
            wave,
            protest,
            shadow: pool(),
            cast: shade(),
            skin,
            limp: makeLimp(robot),
          },
          rand
        ),
        robot,
        mixer,
        idle,
        walk,
        run,
        from,
        bend,
        to: seat,
        start,
        end,
        burst,
        facing: Math.PI + (rand() - 0.5) * 0.5,
        yaw: heading,
        at: from.clone(),
        speed: 0,
        sign: 1 as const,
        last: 0,
        head,
        gaze,
        look: 0,
      };
    });
    const walker = dress().robot;
    const strollerPool = pool();
    walker.add(strollerPool);
    strollerPool.position.y = 0.03;
    strollerPool.visible = true;
    const stroller = makeStroller(walker, walkClip);
    return {
      walkers: list,
      stroller,
      castMat: cast.material,
      poolMat: blob.material,
      disposables: [
        ...Object.values(paint),
        ...skins,
        blob.material,
        blob.geometry,
        cast.material,
        cast.geometry,
      ],
    };
  }, [gltf]);

  const seats = useMemo(() => walkers.map(w => w.to), [walkers]);

  // Strict Mode runs this cleanup on the same memoised walkers, so it must not stop their actions.
  useEffect(
    () => () => {
      disposables.forEach(m => m.dispose());
    },
    [walkers, disposables]
  );

  const hot = useRef<{
    hover: Walker | null;
    held: Walker | null;
    over: boolean;
    pulse: number;
    calm: number;
  }>({ hover: null, held: null, over: false, pulse: view.pulse, calm: 0 });

  // Picking up and dropping. Hover and the floor point are worked out per frame below; these only change who is held.
  useEffect(() => {
    armSound();
    const root = document.documentElement;
    const state = hot.current;
    const release = () => {
      const w = state.held;
      if (!w) return;
      state.held = null;
      view.held = false;
      letGo(w, walkers, NEAR, reduced);
    };
    const grab = (e: PointerEvent) => {
      const w = state.hover;
      if (!w || e.button !== 0 || e.pointerType === "touch") return;
      // Stops the browser starting a text selection under the drag.
      e.preventDefault();
      window.getSelection()?.removeAllRanges();
      state.held = w;
      view.held = true;
      ray.setFromCamera(ndc.set(target.x, -target.y), camera);
      camera.getWorldDirection(facing);
      // The plane runs through the head, which is what the hand holds.
      if (w.head) w.head.getWorldPosition(point);
      else point.set(w.at.x, FLOOR_Y + 2.8 * w.base, w.at.y);
      dragPlane.setFromNormalAndCoplanarPoint(facing, point);
      pickUp(w, ray.ray.intersectPlane(dragPlane, hit));
    };
    const move = (e: PointerEvent) => {
      state.over = e.target instanceof Element && e.target.closest(UI) !== null;
    };
    window.addEventListener("pointerdown", grab);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("pointerdown", grab);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
      release();
      delete root.dataset.crowd;
    };
  }, [walkers, camera, reduced]);

  useFrame((_, dt) => {
    const state = hot.current;
    const p = progress.current;
    const aspect = size.width / size.height;
    const live = p >= LIVE_FROM && target.live && !state.over;
    const root = document.documentElement;

    // Leaving the room mid-grab lets go.
    if (state.held && p < LIVE_FROM) {
      letGo(state.held, walkers, 0, reduced);
      state.held = null;
      view.held = false;
    }

    // Who is under the cursor: the nearest seated robot it touches.
    let hovered: Walker | null = null;
    if (live && !state.held) {
      let best = Infinity;
      for (const w of walkers) {
        if (w.mode === "held" || w.last < 1 || !w.robot.visible) continue;
        if (!overRobot(target.x, -target.y, camera, aspect, w)) continue;
        const d = camera.position.distanceToSquared(w.robot.position);
        if (d < best) {
          best = d;
          hovered = w;
        }
      }
    }
    state.hover = hovered;
    const mode = state.held ? "held" : hovered ? "hover" : null;
    if (root.dataset.crowd !== (mode ?? undefined)) {
      if (mode) root.dataset.crowd = mode;
      else delete root.dataset.crowd;
    }

    // In hand: follow the floor under the cursor, and the neighbours take fright.
    const held = state.held;
    if (held) {
      ray.setFromCamera(ndc.set(target.x, -target.y), camera);
      if (ray.ray.intersectPlane(dragPlane, hit)) {
        held.holdAim.copy(hit).add(held.grabOff);
        held.holdAim.x = THREE.MathUtils.clamp(held.holdAim.x, -ROOM.x, ROOM.x);
        held.holdAim.z = THREE.MathUtils.clamp(
          held.holdAim.z,
          ROOM.far,
          ROOM.near
        );
        held.holdAim.y = THREE.MathUtils.clamp(
          held.holdAim.y,
          FLOOR_Y + HEAD_MIN,
          FLOOR_Y + ROOM.ceiling
        );
      }
      alarmNear(held, walkers, NEAR);
    }

    // Thrown clear out of the picture: the crowd waves it off.
    for (const w of walkers)
      if (w.mode === "fall" && !w.out && offScreen(w, camera))
        sendOff(w, walkers);

    // A new project under the cursor: some of the room goes "ooh".
    state.calm = Math.max(0, state.calm - dt);
    if (view.pulse !== state.pulse) {
      state.pulse = view.pulse;
      // Not every change turns heads: the room reacts now and then, never on cue.
      if (p >= LIVE_FROM && state.calm === 0 && Math.random() < 0.5) {
        state.calm = 2 + Math.random() * 4;
        startle(walkers, reduced);
        play("ooh");
      }
    }

    // Their shadows on the picture fade in with it.
    if (castMat) fadeCast(castMat, p);
    if (poolMat) fadePools(poolMat, p);
    for (const w of walkers) advance(w, p, dt, walkers);
    if (stroller) stepStroller(stroller, dt, p >= LIVE_FROM, seats);
  });

  return (
    <>
      {walkers.map(w => (
        <group key={w.robot.uuid}>
          <primitive object={w.robot} />
          <primitive object={w.shadow} />
          <primitive object={w.cast} />
        </group>
      ))}
      {stroller && <primitive object={stroller.robot} />}
    </>
  );
}
