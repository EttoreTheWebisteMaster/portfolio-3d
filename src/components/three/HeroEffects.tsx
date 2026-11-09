"use client";

import { useFrame } from "@react-three/fiber";
import {
  Bloom,
  BrightnessContrast,
  DepthOfField,
  EffectComposer,
  HueSaturation,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { type DepthOfFieldEffect, ToneMappingMode } from "postprocessing";
import { useRef } from "react";
import * as THREE from "three";

import {
  BEAT,
  CAM_END,
  ease,
  HEAD,
  type Progress,
  SCREEN_DIST,
  seg,
} from "@/lib/journey";

const forward = new THREE.Vector3();
const head = new THREE.Vector3(...HEAD);
const screen = new THREE.Vector3(
  CAM_END[0] - 4.7,
  CAM_END[1] + 2.2,
  CAM_END[2] - SCREEN_DIST
);

/** Dark Knight grade: crushed blacks, cold desaturated mids, hard highlights that bloom, heavy vignette. Focus racks from him to the screen. */
export default function HeroEffects({
  progress,
}: Readonly<{ progress: Progress }>) {
  const dof = useRef<DepthOfFieldEffect>(null);

  useFrame(({ camera }) => {
    const fx = dof.current;
    if (!fx) return;
    const p = progress.current;
    const rack = ease(seg(p, BEAT.rack));
    camera.getWorldDirection(forward);
    // Focus is a depth along the lens axis, not a radial distance.
    const depth = (at: THREE.Vector3) =>
      at.clone().sub(camera.position).dot(forward);
    fx.cocMaterial.focusDistance = THREE.MathUtils.lerp(
      depth(head),
      depth(screen),
      rack
    );
    // A shallow plane of focus on the screen: the crowd in front of it melts.
    fx.cocMaterial.focusRange = THREE.MathUtils.lerp(4, 3, rack);
    // The hero stays as shot; the room goes soft as the move begins.
    fx.bokehScale = 9 * ease(seg(p, [0.02, 0.6]));
  });

  return (
    <EffectComposer multisampling={4}>
      <DepthOfField ref={dof} bokehScale={0} />
      <Bloom
        mipmapBlur
        luminanceThreshold={0.8}
        luminanceSmoothing={0.2}
        intensity={0.5}
        radius={0.7}
      />
      <HueSaturation saturation={-0.08} />
      <BrightnessContrast brightness={0.02} contrast={0.25} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.2} darkness={0.75} />
    </EffectComposer>
  );
}
