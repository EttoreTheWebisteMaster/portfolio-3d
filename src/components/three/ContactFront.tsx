"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  DepthOfFieldEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
} from "postprocessing";
import { type RefObject, useEffect, useRef } from "react";
import * as THREE from "three";

import { useLoading } from "@/lib/loading";

import ContactScene from "./ContactScene";
import { stage } from "./contactRobots";
import { contactCamera, FOCUS, onContact } from "./contactShot";

/** Follows the main canvas's Contact camera, then draws only while the camera is on Contact: through the same lens as the set behind, so a robot goes soft with its distance from the focus. */
function Follow({
  shown,
}: Readonly<{ shown: RefObject<HTMLDivElement | null> }>) {
  const { gl, scene, camera, size } = useThree();
  const composer = useRef<EffectComposer | null>(null);
  useEffect(() => {
    const rig = new EffectComposer(gl, {
      alpha: true,
      multisampling: 0,
      frameBufferType: THREE.HalfFloatType,
    });
    rig.addPass(new RenderPass(scene, camera));
    const lens = new DepthOfFieldEffect(camera, {
      bokehScale: FOCUS.bokeh,
      resolutionScale: 0.75,
    });
    lens.cocMaterial.focusDistance = FOCUS.distance;
    lens.cocMaterial.focusRange = FOCUS.range;
    rig.addPass(
      new EffectPass(
        camera,
        lens,
        new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC })
      )
    );
    composer.current = rig;
    return () => {
      rig.dispose();
      composer.current = null;
    };
  }, [gl, scene, camera]);
  useEffect(() => {
    composer.current?.setSize(size.width, size.height, false);
  }, [size, gl, scene, camera]);
  useFrame(({ camera }) => {
    if (onContact() && camera instanceof THREE.PerspectiveCamera)
      contactCamera(camera, performance.now() / 1000);
  });
  // A render at priority 1 replaces the automatic one.
  useFrame((_, dt) => {
    const on = onContact();
    const el = shown.current;
    if (el && el.getAttribute("data-on") !== String(on))
      el.setAttribute("data-on", String(on));
    if (!on || !composer.current) return;
    // This canvas draws the near half of the pool.
    if (stage.near) stage.crowd?.lend(stage.near, true);
    composer.current.render(dt);
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
        flat
        dpr={[1, 1.25]}
        camera={{ fov: 28, position: [-200, 0.7, 7.4], near: 0.1, far: 80 }}
        gl={{ antialias: false, alpha: true }}
      >
        <Follow shown={shown} />
        <ContactScene url={modelUrl} front />
      </Canvas>
    </div>
  );
}
