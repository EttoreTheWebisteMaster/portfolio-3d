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
import {
  type BloomEffect,
  type DepthOfFieldEffect,
  ToneMappingMode,
} from "postprocessing";
import { useRef } from "react";
import * as THREE from "three";

import {
  BEAT,
  CAM_END,
  ease,
  HEAD,
  introFlash,
  type Progress,
  SCREEN_DIST,
  seg,
} from "@/lib/journey";

const forward = new THREE.Vector3();
const scratch = new THREE.Vector3();
const head = new THREE.Vector3(...HEAD);
const screen = new THREE.Vector3(
  CAM_END[0] - 4.7,
  CAM_END[1] + 2.2,
  CAM_END[2] - SCREEN_DIST
);

/** Blockbuster grade: crushed blacks, teal shadows, orange highlights that bloom, saturated mids, vignette. Focus racks from him to the screen. */
export default function HeroEffects({
  low,
  progress,
}: Readonly<{ low: boolean; progress: Progress }>) {
  const dof = useRef<DepthOfFieldEffect>(null);
  const bloom = useRef<BloomEffect>(null);

  useFrame(({ camera }) => {
    // The light slam blows the highlights out, then they settle back to the grade.
    if (bloom.current) bloom.current.intensity = 0.8 + 1.8 * introFlash();
    const fx = dof.current;
    if (!fx) return;
    const p = progress.current;
    const rack = ease(seg(p, BEAT.rack));
    camera.getWorldDirection(forward);
    // Focus is a depth along the lens axis, not a radial distance.
    const depth = (at: THREE.Vector3) =>
      scratch.copy(at).sub(camera.position).dot(forward);
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
    <EffectComposer multisampling={low ? 0 : 4}>
      <DepthOfField ref={dof} bokehScale={0} />
      <Bloom
        ref={bloom}
        mipmapBlur
        luminanceThreshold={0.95}
        luminanceSmoothing={0.2}
        intensity={0.6}
        radius={0.7}
      />
      <HueSaturation saturation={0} />
      <BrightnessContrast brightness={0.02} contrast={0.15} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.2} darkness={0.65} />
    </EffectComposer>
  );
}
