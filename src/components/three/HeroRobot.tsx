"use client";

import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { pointer, target as cursor } from "@/lib/pointer";
import { BEAT, ease, intro, type Progress, seg } from "@/lib/journey";

import { FLOOR_Y } from "./HeroLight";
import {
  type Bounds,
  type Mood,
  REST,
  cursorOnRobot,
  robotBounds,
  setBrows,
  stepMood,
  turnHead,
} from "./robotLook";

/** ROB-092: matte paint with a lacquer sheen (design system palette). */
export const PALETTE: Record<
  string,
  { color: string; metalness: number; roughness: number; clearcoat: number }
> = {
  Main: { color: "#F29A26", metalness: 0.22, roughness: 0.4, clearcoat: 0.5 },
  Grey: { color: "#BDB9AE", metalness: 0.35, roughness: 0.36, clearcoat: 0.3 },
  Black: { color: "#3D3D3D", metalness: 0.15, roughness: 0.28, clearcoat: 0.6 },
};

/** His metals, for the hero only (the crowd keeps the paint palette). */
const STEEL: Record<
  string,
  { color: string; metalness: number; roughness: number }
> = {
  Main: { color: "#F2B03A", metalness: 0.75, roughness: 0.45 },
  Grey: { color: "#C9CED3", metalness: 0.7, roughness: 0.52 },
  Black: { color: "#4a4d54", metalness: 0.85, roughness: 0.4 },
};

/** His polished metal: gold for the yellow parts, steel for the grey, gunmetal for the dark. The studio around him gives it something to reflect. */
export function steel(name: string, flatShading: boolean) {
  const p = PALETTE[name];
  return new THREE.MeshPhysicalMaterial({
    name,
    color: STEEL[name]?.color ?? p.color,
    metalness: STEEL[name]?.metalness ?? p.metalness,
    roughness: STEEL[name]?.roughness ?? p.roughness,
    clearcoat: 0.15,
    clearcoatRoughness: 0.3,
    flatShading,
    envMapIntensity: 0.9,
  });
}

export default function HeroRobot({
  progress,
  url,
}: Readonly<{ progress: Progress; url: string }>) {
  const gltf = useLoader(GLTFLoader, url);
  const turn = useRef<THREE.Group>(null);
  const mixer = useMemo(() => new THREE.AnimationMixer(gltf.scene), [gltf]);

  useEffect(() => {
    const made = new Map<string, THREE.MeshPhysicalMaterial>();
    gltf.scene.traverse(obj => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = true;
      // He casts his shadow on the floor but never on himself: self-shadowing turns his flat faces to black on some GPUs.
      obj.receiveShadow = false;
      const old = obj.material;
      if (!(old instanceof THREE.MeshStandardMaterial) || !PALETTE[old.name])
        return;
      let mat = made.get(old.name);
      if (!mat) {
        mat = steel(old.name, old.flatShading);
        made.set(old.name, mat);
      }
      obj.material = mat;
    });
    const idle = THREE.AnimationClip.findByName(gltf.animations, "Idle");
    if (idle) mixer.clipAction(idle).play();
    mixer.update(0);
    reduced.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    return () => {
      mixer.stopAllAction();
    };
  }, [gltf, mixer]);

  const head = useMemo(() => gltf.scene.getObjectByName("Head"), [gltf]);
  // The face meshes that carry his expressions (Angry / Surprised / Sad).
  const faces = useMemo(() => {
    const out: THREE.Mesh[] = [];
    gltf.scene.traverse(obj => {
      if (
        obj instanceof THREE.Mesh &&
        obj.morphTargetDictionary?.Surprised !== undefined
      )
        out.push(obj);
    });
    return out;
  }, [gltf]);
  const reduced = useRef(false);
  const look = useRef(0);
  const offset = useRef({ x: 0, y: 0 });
  const waved = useRef(false);
  const oneShot = useRef<THREE.AnimationAction | null>(null);
  const hover = useRef(false);
  const wantDance = useRef(false);
  const mood = useRef<Mood>([...REST]);
  const bounds = useRef<Bounds | null>(null);

  // Click on him (not on a link or button over him) and he dances.
  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (!hover.current) return;
      if (e.target instanceof Element && e.target.closest("a, button")) return;
      wantDance.current = true;
    };
    window.addEventListener("click", click);
    return () => {
      window.removeEventListener("click", click);
      delete document.documentElement.dataset.robHover;
    };
  }, []);

  /** Plays a clip once, cross-faded in from whatever is running. The return to idle is queued in the frame loop. */
  const playOnce = (name: string, fade: number) => {
    const clip = THREE.AnimationClip.findByName(gltf.animations, name);
    const idle = THREE.AnimationClip.findByName(gltf.animations, "Idle");
    if (!clip || !idle) return;
    const action = mixer.clipAction(clip).reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.play().crossFadeFrom(mixer.clipAction(idle), fade, false);
    oneShot.current = action;
  };

  useFrame(({ camera, clock }, dt) => {
    const home = intro.current >= 1 && progress.current < 0.05;
    // The shot has landed and he is still on the Home frame: he waves at the visitor, once.
    if (!waved.current && home) {
      waved.current = true;
      playOnce("Wave", 0.35);
    }
    if (wantDance.current) {
      wantDance.current = false;
      if (!oneShot.current && home) playOnce("Dance", 0.5);
    }
    // Cross-fade back to idle while the clip is still playing, so there is never a frame
    // with no pose driving the rig (that gap was the hitch).
    const shot = oneShot.current;
    const settle = 0.6;
    if (shot && shot.time >= shot.getClip().duration - settle) {
      oneShot.current = null;
      const idle = THREE.AnimationClip.findByName(gltf.animations, "Idle");
      if (idle)
        mixer
          .clipAction(idle)
          .reset()
          .play()
          .crossFadeFrom(shot, settle, false);
    }

    // Is the cursor on him, and how close is it? Hit-tested against his box in his own space.
    let over = false;
    if (home && turn.current && cursor.live) {
      bounds.current ??= robotBounds(gltf.scene, turn.current);
      over = cursorOnRobot(
        cursor.x,
        cursor.y,
        camera,
        turn.current,
        bounds.current
      );
    }
    const hovering = over && !oneShot.current;
    if (hovering !== hover.current) {
      hover.current = hovering;
      if (hovering) document.documentElement.dataset.robHover = "";
      else delete document.documentElement.dataset.robHover;
    }
    // Brows lift in surprise while the cursor is on him, and into a warm smile while he waves; otherwise a kind, alive rest.
    const waving = oneShot.current?.getClip().name === "Wave";
    stepMood(mood.current, hovering, waving, clock.elapsedTime, dt);

    // Take last frame's head offset back out first: a bone the clip does not key would otherwise keep adding it up and spin.
    if (head) turnHead(head, -offset.current.y, -offset.current.x);
    mixer.update(dt);
    // After the mixer: the clips key the face morphs too (Wave flashes its own expression), so our eased mood must have the last word.
    setBrows(faces, mood.current[0], mood.current[1]);
    if (head) {
      // His head follows the cursor on top of the animated pose (applied after the mixer, which rewrites the bones each frame).
      // It lets go while he waves or dances and as he turns away.
      const goal =
        reduced.current || oneShot.current
          ? 0
          : 1 - seg(progress.current, BEAT.turn);
      look.current = THREE.MathUtils.damp(look.current, goal, 4, dt);
      offset.current.y = pointer.x * 0.5 * look.current;
      offset.current.x = pointer.y * 0.3 * look.current;
      turnHead(head, offset.current.y, offset.current.x);
    }
    if (turn.current) {
      // A small wind-up against the turn, then round to face the screen.
      const t = seg(progress.current, BEAT.turn);
      turn.current.rotation.y =
        Math.PI * ease(t) -
        0.12 * Math.sin(Math.PI * seg(t, [0, 0.25])) +
        // He turns a touch toward the pointer, so the scene answers the hand.
        pointer.x * 0.18 * (1 - t);
    }
  });

  return (
    <group ref={turn} position={[0, FLOOR_Y, 0]}>
      <primitive object={gltf.scene} />
    </group>
  );
}
