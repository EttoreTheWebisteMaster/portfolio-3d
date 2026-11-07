"use client";

import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

/** Dark Knight grade: crushed blacks, cold desaturated mids, hard highlights that bloom, heavy vignette. */
export default function HeroEffects() {
  return (
    <EffectComposer multisampling={4}>
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
