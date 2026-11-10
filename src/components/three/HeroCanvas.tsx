"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { gsap } from "@/lib/gsap";
import {
  BEAT,
  CAM_END,
  ease,
  HEAD,
  INTRO,
  intro as introClock,
  introFly,
  introSettle,
  journey,
  type Progress,
  publish,
  SCREEN_FOV,
  syncRig,
  seg,
} from "@/lib/journey";
import { onEnter, report, useLoading } from "@/lib/loading";
import { pointer, stepPointer, trackPointer } from "@/lib/pointer";

import CursorTip from "@/components/ui/CursorTip";

import HeroEffects from "./HeroEffects";
import HeroEnvironment from "./HeroEnvironment";
import HeroLight, { FLOOR_Y } from "./HeroLight";
import HeroRobot from "./HeroRobot";
import ProjectsRoom from "./ProjectsRoom";
import Warmup from "./Warmup";

// The canvas chunk is in: that part of the load is done.
report("scene", 1);

const PATH = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0, 1.6, 7.4),
    new THREE.Vector3(1.2, 1.6, 7.8),
    // The turn lands here (halfway): close behind his head, centred, as in the Hero-Turn frame.
    new THREE.Vector3(0, 2, 7.4),
    new THREE.Vector3(0, 3.4, 7.6),
    new THREE.Vector3(...CAM_END),
  ],
  false,
  "centripetal"
);
const pos = new THREE.Vector3();
const intro = new THREE.Vector3();
const look = new THREE.Vector3();
const head = new THREE.Vector3(...HEAD);
const aim = new THREE.Vector3(CAM_END[0], CAM_END[1], CAM_END[2] - 20);

/** Hands the 3D rig the journey as it is: the snapper already moves it at one constant speed, so no extra smoothing. */
function Driver({ smooth }: Readonly<{ smooth: Progress }>) {
  useFrame((_, dt) => {
    stepPointer(dt);
    syncRig(smooth);
    publish(journey.current);
  }, -1);
  return null;
}

/** Drops the pixel ratio when frames run long, so weak GPUs trade sharpness for smoothness, never the other way round. */
function AdaptiveDpr() {
  const setDpr = useThree(state => state.setDpr);
  const slow = useRef(0);
  const dpr = useRef(1.5);
  useFrame((_, dt) => {
    if (dt > 0.1) return; // a tab switch or a hitch is not a trend
    slow.current = THREE.MathUtils.lerp(slow.current, dt > 0.028 ? 1 : 0, 0.02);
    if (slow.current > 0.6 && dpr.current > 1) {
      dpr.current = Math.max(1, dpr.current - 0.25);
      slow.current = 0;
      setDpr(dpr.current);
    }
  });
  return null;
}

/** Opening drop from high above onto the hero close-up, then the scroll move: arc round his shoulder, crane over his head, land level on the screen. */
function Rig({
  reduced,
  progress,
}: Readonly<{ reduced: boolean; progress: Progress }>) {
  useFrame(({ camera, clock, size }) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const time = clock.elapsedTime;
    // The opening shot is on the master intro clock, which starts when the visitor gets in.
    const e = reduced ? 1 : introFly();
    const aspect = size.width / size.height;
    const narrow = aspect < 1 ? 2.2 : 1;
    // Squarer than 16:10 (landscape tablets) the name grows against his height: he sits lower so his head clears it.
    const squat = THREE.MathUtils.clamp((1.6 - aspect) / 0.6, 0, 1);
    const t01 = seg(progress.current, BEAT.crane);
    // Mostly linear: the move keeps one speed from the first frame to the last.
    const m = THREE.MathUtils.lerp(t01, ease(t01), 0.25);
    // The first scroll pushes him closer; the push is absorbed as the crane takes over.
    const push = 1 - (1 - seg(progress.current, [0, 0.3])) ** 2;
    const sway = reduced ? 0 : 1;

    // The drop: high above him, the whole robot in view, sweeping down and in to the hero frame.
    const swing = (1 - e) * 0.9;
    // Home is a wide shot that shows him full length; it dollies in over the first scroll and the original move takes over.
    const home = 1 - ease(seg(progress.current, [0, 0.3]));
    const radius = THREE.MathUtils.lerp(9, 7.2 + 0.9 * home, e) * narrow;
    intro.set(
      -Math.sin(swing) * radius,
      THREE.MathUtils.lerp(15, 1.5 + 0.3 * home, e),
      Math.cos(swing) * radius
    );
    PATH.getPoint(m, pos);
    // Carry the opening move's offset out of the path as it takes over.
    pos.addScaledVector(intro.sub(PATH.points[0]), 1 - m);
    pos.z -= 1.4 * push * (1 - m);
    // Handheld drift, always alive, and the pointer leans the camera a little. Both fade as the crane starts.
    const lean = sway * (1 - m);
    pos.x += Math.sin(time * 0.35) * 0.05 * sway + pointer.x * 0.7 * lean;
    pos.y += Math.sin(time * 0.27) * 0.03 * sway - pointer.y * 0.35 * lean;
    camera.position.copy(pos);

    // A touch of vertigo mid-move, then it settles on the screen's fov. The opening starts wide and tightens.
    camera.fov =
      THREE.MathUtils.lerp(44, SCREEN_FOV, e) +
      4 * Math.sin(Math.PI * m) * sway;
    // Home: aimed a touch lower so he sits full length under the name. The offset is gone as soon as the scroll starts,
    // so the move after that is the original one.
    const drop =
      -0.15 * (1 - ease(seg(progress.current, [0, 0.3]))) +
      // Through the turn his head rides low in the frame, under the name.
      0.5 * Math.sin(Math.PI * seg(progress.current, [0.15, 0.85]));
    look
      .copy(head)
      .setY(
        THREE.MathUtils.lerp(
          0.8,
          narrow > 1 ? 0.9 : 1.9 + 0.9 * squat,
          reduced ? 1 : introSettle()
        ) + drop
      )
      .lerp(aim, ease(seg(progress.current, BEAT.look)));
    camera.lookAt(look);
    // Slight Dutch tilt through the crane, level again on arrival.
    camera.rotateZ(
      (0.03 * Math.sin(Math.PI * m) + Math.sin(time * 0.2) * 0.002) * sway
    );
    camera.updateProjectionMatrix();
  });
  return null;
}

export default function HeroCanvas() {
  const smooth = useRef(0);
  const { modelUrl, entered } = useLoading();
  const reduced = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );
  // Weak or small screens get the same shot with the costly passes off.
  const low = useMemo(
    () =>
      window.matchMedia("(max-width: 767px)").matches ||
      (navigator.hardwareConcurrency ?? 8) <= 4,
    []
  );

  // The opening shot is one clock, started the moment the visitor gets past the loader.
  useEffect(() => {
    const stopPointer = trackPointer();
    if (reduced) {
      introClock.current = 1;
      return stopPointer;
    }
    const stopEnter = onEnter(() => {
      gsap.to(introClock, {
        current: 1,
        duration: INTRO.total,
        ease: "none",
        overwrite: true,
      });
    });
    return () => {
      stopPointer();
      stopEnter();
    };
  }, [reduced]);

  return (
    <div className="hero-stage" aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        shadows="percentage"
        // Idle behind the loader, so the countdown has the main thread and the GPU to itself.
        frameloop={entered ? "always" : "demand"}
        camera={{ fov: 22, position: [0, 2.4, 24], near: 0.1, far: 80 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.1;
        }}
      >
        <HeroEnvironment progress={smooth} />
        <Suspense fallback={null}>
          <Driver smooth={smooth} />
          {modelUrl && <HeroRobot progress={smooth} url={modelUrl} />}
          <ProjectsRoom progress={smooth} reduced={reduced} />
          <Rig reduced={reduced} progress={smooth} />
          {modelUrl && <Warmup />}
        </Suspense>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, FLOOR_Y, 0]}
          receiveShadow
        >
          <planeGeometry args={[60, 60]} />
          <shadowMaterial opacity={0.45} />
        </mesh>
        <HeroLight reduced={reduced} low={low} progress={smooth} />
        <HeroEffects low={low} progress={smooth} />
        <AdaptiveDpr />
      </Canvas>
      <CursorTip label="Make Rob dance" />
      <CursorTip label="Grab" variant="grab" />
      <CursorTip label="Drop" variant="drop" />
    </div>
  );
}
