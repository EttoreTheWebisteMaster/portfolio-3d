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
  type VignetteEffect,
} from "postprocessing";
import { useRef } from "react";
import * as THREE from "three";

import {
  BEAT,
  CAM_END,
  cinemaLight,
  ease,
  HEAD,
  introFlash,
  type Progress,
  SCREEN_DIST,
  journey,
  seg,
} from "@/lib/journey";

import { FLOOR_Y } from "./HeroLight";
import {
  closeUp,
  daylight,
  newPose,
  SHOT,
  walk,
  walkPose,
  ZOOM,
} from "./walkPose";
import { onContact } from "./contactShot";

const forward = new THREE.Vector3();
const scratch = new THREE.Vector3();
const head = new THREE.Vector3(...HEAD);
const mark = new THREE.Vector3();
const pose = newPose();
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
  const vignette = useRef<VignetteEffect>(null);

  useFrame(({ camera }) => {
    // The light slam blows the highlights out, then they settle back to the grade.
    const paper = daylight();
    if (bloom.current) {
      bloom.current.intensity =
        THREE.MathUtils.lerp(0.8 + 1.8 * introFlash(), 0.15, paper) *
        THREE.MathUtils.lerp(1, 0, ease(seg(progress.current, BEAT.picture)));
      // On the Projects screen only true highlights may glow, so the picture's lettering stays crisp.
      bloom.current.luminanceMaterial.threshold = THREE.MathUtils.lerp(
        0.95,
        1.3,
        ease(seg(progress.current, BEAT.picture))
      );
    }
    // In the cinema the edges fall further into the dark: the screen is the only light.
    // On the cream wall of About it is only a breath.
    if (vignette.current) {
      // The iris: as the lens goes into his eye the dark closes in from the edges, to a pinhole of light.
      const iris = onContact() ? 0 : ease(seg(journey.current, ZOOM)) ** 1.5;
      vignette.current.offset = THREE.MathUtils.lerp(0.2, 0.02, iris);
      vignette.current.darkness = onContact()
        ? 0.85
        : THREE.MathUtils.lerp(
            THREE.MathUtils.lerp(0.65, 0.92, cinemaLight(progress.current)),
            0.25,
            paper
          );
      if (!onContact()) {
        vignette.current.darkness = THREE.MathUtils.lerp(
          vignette.current.darkness,
          1,
          iris
        );
        // The close-up: the edges close in dark around his face.
        const cu = closeUp();
        vignette.current.offset = THREE.MathUtils.lerp(
          vignette.current.offset,
          0.12,
          cu
        );
        vignette.current.darkness = THREE.MathUtils.lerp(
          vignette.current.darkness,
          1,
          cu
        );
      }
    }
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
    // Once the picture is up the lens is fully sharp: the trailer must read clean.
    fx.bokehScale =
      9 * ease(seg(p, [0.02, 0.6])) * (1 - ease(seg(p, BEAT.picture)));
    // The walk-out: focus racks off the screen onto him and follows him; the screen goes soft, then the cream room keeps a gentle depth.
    const w = walk();
    if (w > 0) {
      const s = seg(w, SHOT.rack);
      walkPose(pose);
      mark.set(pose.x, FLOOR_Y + 2, pose.z);
      fx.cocMaterial.focusDistance = THREE.MathUtils.lerp(
        depth(screen),
        depth(mark),
        s
      );
      // In the close-up the plane of focus is a thin slice on his face: all the rest melts.
      const cu = closeUp();
      fx.cocMaterial.focusRange = THREE.MathUtils.lerp(
        THREE.MathUtils.lerp(3, 5, s),
        3,
        cu
      );
      fx.bokehScale =
        THREE.MathUtils.lerp(0, 7, s) * (1 - 0.65 * paper) + 6 * cu;
    }
    // Contact: focus on the near robots and let the blur grow slowly over the whole depth of the room, so far ones are only a little softer, never a sudden cut.
    if (onContact()) {
      fx.cocMaterial.focusDistance = 7;
      fx.cocMaterial.focusRange = 22;
      fx.bokehScale = 2.2;
    }
  });

  return (
    <EffectComposer multisampling={low ? 0 : 2}>
      <DepthOfField
        ref={dof}
        bokehScale={0}
        resolutionScale={low ? 0.5 : 0.75}
      />
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
      <Vignette ref={vignette} offset={0.2} darkness={0.65} />
    </EffectComposer>
  );
}
