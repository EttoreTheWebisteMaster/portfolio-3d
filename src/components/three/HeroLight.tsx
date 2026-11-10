"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import {
  ease,
  heroLight,
  seg,
  introFlash,
  introKey,
  type Progress,
} from "@/lib/journey";
import { pointer } from "@/lib/pointer";

import { Beam, type Cone, litByCone } from "./HeroBeam";

export const LIGHT_POS = new THREE.Vector3(-2.5, 4, 10);
export const FLOOR_Y = -2;

const LIGHT_COLOR = "#ffd9a0";

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

/** Dust motes hanging in the room. They drift on their own; the light passing through them is what shows them. */
function Dust({
  reduced,
  cone,
  count,
  size,
  opacity,
  seed,
}: Readonly<{
  reduced: boolean;
  cone: Cone;
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
        onBeforeCompile={litByCone(cone)}
      />
    </points>
  );
}

const SPOT_INTENSITY = 80;
const AIM = new THREE.Vector3(0, 0.8, 0);
const DOWN = new THREE.Vector3(0, -1, 0);

/** Spot, beam and dust. The lamp hangs fixed in front of him, just above the lens and is aimed by the pointer, like a real follow-spot; the dust stays put. It dies as the scroll reaches the cinema. */
export default function HeroLight({
  reduced,
  low,
  progress,
}: Readonly<{ reduced: boolean; low: boolean; progress: Progress }>) {
  const root = useRef<THREE.Group>(null);
  const beams = useRef<THREE.Group>(null);
  const spot = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const aim = useRef(AIM.clone());
  const cone = useMemo<Cone>(
    () => ({
      pos: { value: LIGHT_POS.clone() },
      dir: { value: new THREE.Vector3(0, -1, 0) },
    }),
    []
  );
  const dir = useMemo(() => new THREE.Vector3(), []);
  // Beams and dust, found once instead of walking the group every frame.
  const fades = useRef<
    { obj: THREE.Mesh | THREE.Points; mat: THREE.Material; base: number }[]
  >([]);

  useEffect(() => {
    if (spot.current) spot.current.target = target;
  }, [target]);

  useFrame(({ clock }, dt) => {
    if (fades.current.length === 0)
      root.current?.traverse(obj => {
        if (!(obj instanceof THREE.Mesh || obj instanceof THREE.Points)) return;
        const mat = obj.material;
        if (mat instanceof THREE.Material)
          fades.current.push({ obj, mat, base: mat.opacity });
      });
    const fade = heroLight(progress.current);
    // Dark until the slam, then a flash that settles on the real key. A faint breath keeps the lamp alive.
    const breath = reduced ? 1 : 1 + 0.015 * Math.sin(clock.elapsedTime * 2.1);
    const key = fade * (introKey() + introFlash());
    if (spot.current) spot.current.intensity = SPOT_INTENSITY * key * breath;
    // Motes vanish almost at once so they never hang over the floor, going or coming.
    const motes = 1 - ease(seg(progress.current, [0, 0.05]));
    for (const { obj, mat, base } of fades.current) {
      const k = obj instanceof THREE.Points ? Math.min(key, motes) : key;
      mat.opacity = base * Math.min(k, 1);
      obj.visible = k > 0.001;
    }
    // The hand aims the lamp; the lamp has weight, so it trails the pointer and settles.
    const goalX = reduced ? 0 : pointer.x * 1.1 * fade;
    const goalY = reduced ? AIM.y : AIM.y - pointer.y * 0.5 * fade;
    const k = 1 - Math.exp(-dt * 3);
    aim.current.x += (goalX - aim.current.x) * k;
    aim.current.y += (goalY - aim.current.y) * k;
    target.position.copy(aim.current);
    dir.copy(aim.current).sub(LIGHT_POS).normalize();
    beams.current?.quaternion.setFromUnitVectors(DOWN, dir);
    cone.dir.value.copy(dir);
  });

  return (
    <group ref={root}>
      <primitive object={target} />
      <spotLight
        ref={spot}
        position={LIGHT_POS}
        color={LIGHT_COLOR}
        intensity={0}
        angle={0.62}
        penumbra={0.85}
        distance={40}
        castShadow
        shadow-mapSize={low ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.001}
        shadow-normalBias={0.1}
        shadow-radius={8}
      />
      <group ref={beams} position={LIGHT_POS}>
        <Beam radius={4.2} alpha={0.008} />
        <Beam radius={6} alpha={0.007} />
        <Beam radius={8} alpha={0.005} />
      </group>
      <Dust
        reduced={reduced}
        cone={cone}
        count={200}
        size={0.05}
        opacity={0.9}
        seed={92}
      />
      <Dust
        reduced={reduced}
        cone={cone}
        count={36}
        size={0.2}
        opacity={0.2}
        seed={7}
      />
    </group>
  );
}
