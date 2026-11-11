"use client";

import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

import { asking, greet } from "@/lib/interview";
import { cruise, ease, journey, seg } from "@/lib/journey";
import { pointer } from "@/lib/pointer";

import { DEPTH, DUCK_AT, onAbout, ORIGIN } from "./aboutShot";
import { PALETTE, steel } from "./HeroRobot";
import { turnHead } from "./robotLook";
import { warm } from "./Warmup";

/** Journey position where the cut has opened and he starts down the tunnel towards it. */
const RISE_AT = 1.85;
/** Seconds he takes to walk out of the dark to the cut. */
const WALK_SECONDS = 2.6;
/** Where his feet stand: on the tunnel floor, set back from the wall plane so he is framed by the cut, upright, as in the hero. */
const FLOOR_Y = 0.6;
const STAND_Z = -1.6;
const START_Z = -DEPTH + 0.8;
const SCALE = 1;

type Tint = { m: THREE.MeshPhysicalMaterial; base: THREE.Color };

/** Scales every metal's colour and reflections by `lit` (0 = black, 1 = as the hero). */
function dim(tints: Tint[], lit: number) {
  for (const { m, base } of tints) {
    m.color.copy(base).multiplyScalar(lit);
    m.envMapIntensity = lit;
  }
}

/** ROB-092 walking out of the tunnel's black into the light at one steady pace, then a wave, then the hero's idle, his head following the cursor. */
export default function AboutRobot({ url }: Readonly<{ url: string }>) {
  const gltf = useLoader(GLTFLoader, url);
  const group = useRef<THREE.Group>(null);
  const reduced = useRef(false);
  const rig = useMemo(() => {
    const scene = clone(gltf.scene);
    const materials = new Map<string, THREE.MeshPhysicalMaterial>();
    scene.traverse(obj => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = true;
      obj.receiveShadow = false;
      if (!PALETTE[obj.material.name]) return;
      // The same polished metal as the hero, so he is one character on every page.
      let m = materials.get(obj.material.name);
      if (!m) {
        m = steel(obj.material.name, obj.material.flatShading);
        materials.set(obj.material.name, m);
      }
      obj.material = m;
    });
    const mixer = new THREE.AnimationMixer(scene);
    const walk = THREE.AnimationClip.findByName(gltf.animations, "Walking");
    const idle = THREE.AnimationClip.findByName(gltf.animations, "Idle");
    const start = walk ?? idle;
    if (start) mixer.clipAction(start).play();
    const tints = [...materials.values()].map(m => ({
      m,
      base: m.color.clone(),
    }));
    return { scene, mixer, tints, head: scene.getObjectByName("Head") };
  }, [gltf]);
  const look = useRef({ x: 0, y: 0, speak: 0 });
  const applied = useRef({ x: 0, y: 0 });
  const oneShot = useRef<THREE.AnimationAction | null>(null);
  // 0 while he waits in the tunnel's black, 1 once he has walked up to the cut.
  const rise = useRef(0);
  const waved = useRef(false);
  const studio = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    return () => {
      rig.mixer.stopAllAction();
    };
  }, [rig]);

  useFrame(({ scene }, delta) => {
    // A hitched frame must not skip the whole wave.
    const dt = Math.min(delta, 0.05);
    const g = group.current;
    if (!g) return;
    // His metal reflects the hero's studio. Only he gets it: the wall stays lit by the lamps alone.
    if (!studio.current && scene.environment) {
      studio.current = true;
      rig.scene.traverse(obj => {
        if (
          obj instanceof THREE.Mesh &&
          obj.material instanceof THREE.MeshPhysicalMaterial
        ) {
          obj.material.envMap = scene.environment;
          obj.material.needsUpdate = true;
        }
      });
    }
    g.visible = onAbout() || warm.on;
    if (!g.visible) return;
    const live = reduced.current ? 0 : 1;
    // He starts down the tunnel once the cut has opened, never while the wall is still arriving.
    const settled = journey.current >= RISE_AT && journey.current < DUCK_AT;
    rise.current = reduced.current
      ? Number(settled)
      : settled
        ? Math.min(1, rise.current + dt / WALK_SECONDS)
        : Math.max(0, rise.current - dt / 0.5);
    const w = cruise(rise.current, 0.15);
    g.position.z = THREE.MathUtils.lerp(START_Z, STAND_Z, w);
    g.visible = warm.on || rise.current > 0;
    // He comes out of the black: his metal catches light only as he nears it, so nothing pops in.
    const lit = ease(seg(w, [0, 0.6]));
    dim(rig.tints, lit);
    const walk = THREE.AnimationClip.findByName(gltf.animations, "Walking");
    const idle = THREE.AnimationClip.findByName(gltf.animations, "Idle");
    const wave = THREE.AnimationClip.findByName(gltf.animations, "Wave");
    if (rise.current === 0) waved.current = false;
    // He arrives, and waves and says hello at the same moment.
    if (rise.current >= 1 && !waved.current) {
      waved.current = true;
      greet();
      const from = walk ?? idle;
      if (wave && from && live) {
        const action = rig.mixer.clipAction(wave).reset();
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.play().crossFadeFrom(rig.mixer.clipAction(from), 0.35, false);
        oneShot.current = action;
      } else if (idle) rig.mixer.clipAction(idle).reset().play();
      if (walk && idle) rig.mixer.clipAction(walk).fadeOut(0.35);
    }
    // Walking again whenever he is out of position (scrolling back).
    if (rise.current < 1 && waved.current === false && walk && live)
      rig.mixer.clipAction(walk).play();
    // Back to idle a moment before the wave ends, so a pose is always driving the rig.
    const shot = oneShot.current;
    if (shot && idle && shot.time >= shot.getClip().duration - 0.6) {
      oneShot.current = null;
      rig.mixer.clipAction(idle).reset().play().crossFadeFrom(shot, 0.6, false);
    }
    // Take last frame's head offset back out first: the clip does not key every bone, so it would pile up.
    if (rig.head) turnHead(rig.head, -applied.current.y, -applied.current.x);
    rig.mixer.update(live ? dt : 0);
    if (rig.head) {
      const l = look.current;
      // His head follows the cursor on top of the animated pose and settles on us while he answers or waves.
      const quiet = asking.speaking || oneShot.current ? 0 : 1;
      l.speak = THREE.MathUtils.damp(l.speak, quiet, 4, dt);
      l.y = pointer.x * 0.5 * l.speak * live;
      l.x = pointer.y * 0.3 * l.speak * live;
      // A nod when a question is sent.
      const since = performance.now() / 1000 - asking.sentAt;
      const nod =
        since < 0.6 ? Math.sin((Math.PI * since) / 0.6) * 0.18 * live : 0;
      applied.current = { x: l.x + nod, y: l.y };
      turnHead(rig.head, applied.current.y, applied.current.x);
    }
  });

  return (
    <group
      ref={group}
      position={[ORIGIN.x, FLOOR_Y, START_Z]}
      rotation={[0, 0.12, 0]}
      scale={SCALE}
      visible={false}
    >
      <primitive object={rig.scene} />
    </group>
  );
}
