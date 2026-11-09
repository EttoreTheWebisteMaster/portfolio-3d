"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { heroLight, type Progress } from "@/lib/journey";

export const LIGHT_POS = new THREE.Vector3(-6, 9, 5);
export const FLOOR_Y = -2;

const LIGHT_COLOR = "#ffe2a8";
const BEAM_LENGTH = 15;

/** Deterministic PRNG so the dust layout is pure and stable across renders. */
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Soft round mote sprite shared by the hero and cinema dust. */
export function dustTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
  }
  return new THREE.CanvasTexture(canvas);
}

/** Visible cone of light from the spot to the floor. */
function Beam({ radius, alpha }: Readonly<{ radius: number; alpha: number }>) {
  const { geometry, quaternion } = useMemo(() => {
    const dir = new THREE.Vector3(0, FLOOR_Y, 0).sub(LIGHT_POS).normalize();
    const geo = new THREE.ConeGeometry(radius, BEAM_LENGTH, 48, 1, true);
    geo.translate(0, -BEAM_LENGTH / 2, 0);
    const pos = geo.getAttribute("position");
    const colors = new Float32Array(pos.count * 4);
    for (let i = 0; i < pos.count; i++) {
      const fade = 1 - Math.abs(pos.getY(i)) / BEAM_LENGTH;
      colors.set([1, 1, 1, alpha * fade], i * 4);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 4));
    return {
      geometry: geo,
      quaternion: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, -1, 0),
        dir
      ),
    };
  }, [radius, alpha]);

  return (
    <mesh geometry={geometry} position={LIGHT_POS} quaternion={quaternion}>
      <meshBasicMaterial
        color={LIGHT_COLOR}
        vertexColors
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/** Dust motes drifting inside the beam. */
function Dust({
  reduced,
  count,
  size,
  opacity,
  seed,
}: Readonly<{
  reduced: boolean;
  count: number;
  size: number;
  opacity: number;
  seed: number;
}>) {
  const { positions, speeds, texture } = useMemo(() => {
    const rand = mulberry32(seed);
    const axis = new THREE.Vector3(0, FLOOR_Y, 0).sub(LIGHT_POS);
    const pts = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const t = 0.1 + rand() * 0.9;
      const spread = 0.3 + t * 3.6;
      pts[i * 3] = LIGHT_POS.x + axis.x * t + (rand() - 0.5) * spread * 2;
      pts[i * 3 + 1] = LIGHT_POS.y + axis.y * t + (rand() - 0.5) * spread * 2;
      pts[i * 3 + 2] = LIGHT_POS.z + axis.z * t + (rand() - 0.5) * spread * 2;
      spd[i] = 0.03 + rand() * 0.07;
    }
    return {
      positions: pts,
      speeds: spd,
      texture: dustTexture(),
    };
  }, [count, seed]);

  const geo = useRef<THREE.BufferGeometry>(null);

  useFrame(({ clock }, dt) => {
    const attr = geo.current?.getAttribute("position");
    if (!attr || reduced) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      let y = attr.getY(i) - speeds[i] * dt;
      if (y < FLOOR_Y) y = LIGHT_POS.y;
      attr.setXYZ(
        i,
        attr.getX(i) + Math.sin(t * 0.3 + i) * 0.002,
        y,
        attr.getZ(i) + Math.cos(t * 0.25 + i) * 0.002
      );
    }
    attr.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={geo}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        color={LIGHT_COLOR}
        size={size}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

const SPOT_INTENSITY = 560;

/** Spot, beam and dust. The light is fixed in the world; only the camera moves. It dies as the scroll reaches the cinema. */
export default function HeroLight({
  reduced,
  progress,
}: Readonly<{ reduced: boolean; progress: Progress }>) {
  const group = useRef<THREE.Group>(null);
  const spot = useRef<THREE.SpotLight>(null);

  useFrame(() => {
    const fade = heroLight(progress.current);
    if (spot.current) spot.current.intensity = SPOT_INTENSITY * fade;
    group.current?.traverse(obj => {
      if (!(obj instanceof THREE.Mesh || obj instanceof THREE.Points)) return;
      const mat = obj.material;
      if (!(mat instanceof THREE.Material)) return;
      mat.userData.base ??= mat.opacity;
      mat.opacity = mat.userData.base * fade;
      obj.visible = fade > 0.001;
    });
  });

  return (
    <group ref={group}>
      <spotLight
        ref={spot}
        position={LIGHT_POS}
        color={LIGHT_COLOR}
        intensity={SPOT_INTENSITY}
        angle={0.34}
        penumbra={0.55}
        distance={40}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={6}
      />
      <Beam radius={2.6} alpha={0.02} />
      <Beam radius={3.8} alpha={0.018} />
      <Beam radius={5.2} alpha={0.012} />
      <Dust reduced={reduced} count={200} size={0.05} opacity={0.8} seed={92} />
      <Dust reduced={reduced} count={36} size={0.2} opacity={0.16} seed={7} />
    </group>
  );
}
