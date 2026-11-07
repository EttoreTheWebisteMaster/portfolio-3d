"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

import HeroEffects from "./HeroEffects";
import HeroEnvironment from "./HeroEnvironment";
import HeroLight, { FLOOR_Y } from "./HeroLight";
import HeroRobot from "./HeroRobot";

/** Opening dolly zoom: full-body wide to medium close-up, once, eased out. */
function Rig({ reduced }: Readonly<{ reduced: boolean }>) {
  const start = useRef<number | null>(null);
  useFrame(({ camera, clock, size }) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    start.current ??= clock.elapsedTime;
    const t = reduced
      ? 1
      : Math.min((clock.elapsedTime - start.current) / 5, 1);
    const e = 1 - (1 - t) ** 3;
    const narrow = size.width / size.height < 1 ? 2.2 : 1;
    camera.fov = THREE.MathUtils.lerp(22, 34, e);
    // Handheld drift once the move settles.
    const sway = reduced ? 0 : e;
    camera.position.set(
      Math.sin(clock.elapsedTime * 0.35) * 0.06 * sway,
      THREE.MathUtils.lerp(2.4, 1.6, e) +
        Math.sin(clock.elapsedTime * 0.27) * 0.035 * sway,
      THREE.MathUtils.lerp(24, 7.4, e) * narrow
    );
    camera.lookAt(0, THREE.MathUtils.lerp(1.2, narrow > 1 ? 0.9 : 1.8, e), 0);
    camera.updateProjectionMatrix();
  });
  return null;
}

export default function HeroCanvas() {
  const reduced = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  return (
    <div className="hero-stage" aria-hidden>
      <Canvas
        dpr={[1, 1.75]}
        shadows
        frameloop={reduced ? "demand" : "always"}
        camera={{ fov: 22, position: [0, 2.4, 24], near: 0.1, far: 80 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.1;
        }}
      >
        <hemisphereLight args={["#8fa6ad", "#1a1410", 0.18]} />
        <HeroEnvironment />
        <Suspense fallback={null}>
          <HeroRobot />
          <Rig reduced={reduced} />
        </Suspense>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, FLOOR_Y, 0]}
          receiveShadow
        >
          <planeGeometry args={[60, 60]} />
          <shadowMaterial opacity={0.65} />
        </mesh>
        <HeroLight reduced={reduced} />
        <HeroEffects />
      </Canvas>
    </div>
  );
}
