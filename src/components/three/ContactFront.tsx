"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { type RefObject, useRef } from "react";
import * as THREE from "three";

import { useLoading } from "@/lib/loading";

import ContactScene from "./ContactScene";
import { stage } from "./contactRobots";
import { contactCamera, onContact } from "./contactShot";

/** Follows the main canvas's Contact camera, then draws only while the camera is on Contact. */
function Follow({
  shown,
}: Readonly<{ shown: RefObject<HTMLDivElement | null> }>) {
  useFrame(({ camera }, dt) => {
    if (onContact() && camera instanceof THREE.PerspectiveCamera)
      contactCamera(camera, performance.now() / 1000, dt, false);
  });
  // A render at priority 1 replaces the automatic one.
  useFrame(({ gl, scene, camera }) => {
    const on = onContact();
    shown.current?.setAttribute("data-on", String(on));
    if (!on) return;
    // This canvas draws the near half of the pool.
    if (stage.near) stage.crowd?.lend(stage.near, true);
    gl.render(scene, camera);
    stage.crowd?.restore();
  }, 1);
  return null;
}

/** The Contact robots, on a transparent canvas above the page copy: same camera and lamp as the set behind, nothing else. */
export default function ContactFront() {
  const { modelUrl } = useLoading();
  const shown = useRef<HTMLDivElement>(null);
  return (
    <div ref={shown} aria-hidden data-on="false" className="contact-front">
      <Canvas
        dpr={[1, 1.5]}
        shadows="percentage"
        camera={{ fov: 28, position: [-200, 0.7, 7.4], near: 0.1, far: 80 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.1;
        }}
      >
        <Follow shown={shown} />
        <ContactScene url={modelUrl} front />
      </Canvas>
    </div>
  );
}
