"use client";

import { useMemo } from "react";
import * as THREE from "three";

const BEAM_LENGTH = 15;
const BEAM_COLOR = "#ffbe70";

/** Visible cone of light from the spot to the floor. */
export function Beam({
  radius,
  alpha,
}: Readonly<{ radius: number; alpha: number }>) {
  const geometry = useMemo(() => {
    const geo = new THREE.ConeGeometry(radius, BEAM_LENGTH, 48, 1, true);
    geo.translate(0, -BEAM_LENGTH / 2, 0);
    const pos = geo.getAttribute("position");
    const colors = new Float32Array(pos.count * 4);
    for (let i = 0; i < pos.count; i++) {
      const fade = 1 - Math.abs(pos.getY(i)) / BEAM_LENGTH;
      colors.set([1, 1, 1, alpha * fade], i * 4);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 4));
    return geo;
  }, [radius, alpha]);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        color={BEAM_COLOR}
        vertexColors
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/** Where the beam is, shared with every dust layer: motes glow only inside the cone. */
export type Cone = {
  pos: { value: THREE.Vector3 };
  dir: { value: THREE.Vector3 };
};

/** Makes a points material glow only where the beam passes: motes outside the cone fall to a faint trace. */
export const litByCone =
  (cone: Cone) => (shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uLightPos = cone.pos;
    shader.uniforms.uLightDir = cone.dir;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform vec3 uLightPos;\nuniform vec3 uLightDir;\nvarying float vLit;"
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
      float c = dot(normalize((modelMatrix * vec4(position, 1.0)).xyz - uLightPos), uLightDir);
      vLit = 0.1 + 0.9 * smoothstep(0.78, 0.96, c);`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vLit;")
      .replace(
        "#include <color_fragment>",
        "#include <color_fragment>\ndiffuseColor.a *= vLit;"
      );
  };
