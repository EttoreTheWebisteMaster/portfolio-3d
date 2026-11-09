"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

import {
  BEAT,
  CAM_END,
  ease,
  HEAD,
  journey,
  type Progress,
  publish,
  syncRig,
  seg,
} from "@/lib/journey";

import HeroEffects from "./HeroEffects";
import HeroEnvironment from "./HeroEnvironment";
import HeroLight, { FLOOR_Y } from "./HeroLight";
import HeroRobot from "./HeroRobot";
import ProjectsRoom from "./ProjectsRoom";

const PATH = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0, 1.6, 7.4),
    new THREE.Vector3(2.4, 1.3, 5.6),
    new THREE.Vector3(2.6, 2.8, 5.4),
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
  useFrame(() => {
    syncRig(smooth);
    publish(journey.current);
  }, -1);
  return null;
}

/** Opening dolly zoom, then the scroll move: arc round his shoulder, crane over his head, land level on the screen. */
function Rig({
  reduced,
  progress,
}: Readonly<{ reduced: boolean; progress: Progress }>) {
  const start = useRef<number | null>(null);
  useFrame(({ camera, clock, size }) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    start.current ??= clock.elapsedTime;
    const time = clock.elapsedTime;
    const t = reduced ? 1 : Math.min((time - start.current) / 5, 1);
    const e = 1 - (1 - t) ** 3;
    const narrow = size.width / size.height < 1 ? 2.2 : 1;
    const t01 = seg(progress.current, BEAT.crane);
    // Mostly linear: the move keeps one speed from the first frame to the last.
    const m = THREE.MathUtils.lerp(t01, ease(t01), 0.25);
    // The first scroll pushes him closer; the push is absorbed as the crane takes over.
    const push = 1 - (1 - seg(progress.current, [0, 0.3])) ** 2;
    const sway = reduced ? 0 : 1;

    intro.set(
      0,
      THREE.MathUtils.lerp(2.4, 1.6, e),
      THREE.MathUtils.lerp(24, 7.4, e) * narrow
    );
    PATH.getPoint(m, pos);
    // Carry the opening move's offset out of the path as it takes over.
    pos.addScaledVector(intro.sub(PATH.points[0]), 1 - m);
    pos.z -= 1.4 * push * (1 - m);
    // Handheld drift, always alive.
    pos.x += Math.sin(time * 0.35) * 0.05 * sway;
    pos.y += Math.sin(time * 0.27) * 0.03 * sway;
    camera.position.copy(pos);

    // A touch of vertigo mid-move, then it settles on the screen's fov.
    camera.fov =
      THREE.MathUtils.lerp(22, 34, e) + 4 * Math.sin(Math.PI * m) * sway;
    look
      .copy(head)
      .setY(THREE.MathUtils.lerp(1.2, narrow > 1 ? 0.9 : 1.8, e))
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
  const reduced = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  return (
    <div className="hero-stage" aria-hidden>
      <Canvas
        dpr={[1, 1.75]}
        shadows
        frameloop="always"
        camera={{ fov: 22, position: [0, 2.4, 24], near: 0.1, far: 80 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.1;
        }}
      >
        <HeroEnvironment progress={smooth} />
        <Suspense fallback={null}>
          <Driver smooth={smooth} />
          <HeroRobot progress={smooth} />
          <ProjectsRoom progress={smooth} reduced={reduced} />
          <Rig reduced={reduced} progress={smooth} />
        </Suspense>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, FLOOR_Y, 0]}
          receiveShadow
        >
          <planeGeometry args={[60, 60]} />
          <shadowMaterial opacity={0.65} />
        </mesh>
        <HeroLight reduced={reduced} progress={smooth} />
        <HeroEffects progress={smooth} />
      </Canvas>
    </div>
  );
}
