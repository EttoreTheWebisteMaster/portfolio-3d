"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { beamPulse } from "@/lib/contact";

import { lampRise, onContact } from "./contactShot";

const COLOR = "#dfe9ec";
const LENGTH = 10;
/** Half-angle of the lamp's cone, the same as the spot's. */
const ANGLE = 0.5;
const CONE = 0.14;

const vertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vAlong;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    vAlong = clamp(-position.y / ${LENGTH.toFixed(1)}, 0.0, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;

// Soft at the silhouette (the edge of the cone melts into the dark) and strongest at the lamp, gone by the time it reaches the floor, so it never draws a line where it meets it: air lit by a lamp, never a slab.
const fragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vAlong;
  void main() {
    float facing = abs(dot(normalize(vNormal), normalize(vView)));
    float edge = pow(facing, 2.4);
    float along = pow(1.0 - clamp(vAlong / 0.88, 0.0, 1.0), 0.9) * smoothstep(0.0, 0.05, vAlong);
    gl_FragColor = vec4(uColor, edge * along * uStrength);
  }
`;

/** The lamp's visible beam: a soft cone of lit air from the lamp to the floor, . */
export default function ContactBeam({
  lamp,
  aim,
}: Readonly<{ lamp: THREE.Vector3; aim: THREE.Vector3 }>) {
  const cone = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => {
    const geo = new THREE.ConeGeometry(
      Math.tan(ANGLE) * LENGTH,
      LENGTH,
      64,
      1,
      true
    );
    geo.translate(0, -LENGTH / 2, 0);
    return geo;
  }, []);
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(COLOR) },
      uStrength: { value: 0 },
    }),
    []
  );
  const lean = useMemo(
    () =>
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, -1, 0),
        aim.clone().sub(lamp).normalize()
      ),
    [lamp, aim]
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    // It comes up with the lamp, and a copy lifts it for a beat.
    const k = onContact() ? lampRise() * (1 + 0.9 * beamPulse()) : 0;
    if (cone.current) cone.current.uniforms.uStrength.value = CONE * k;
  });

  return (
    <group position={lamp} quaternion={lean}>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={cone}
          uniforms={uniforms}
          vertexShader={vertex}
          fragmentShader={fragment}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
