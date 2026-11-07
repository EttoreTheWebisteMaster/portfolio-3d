"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { FLOOR_Y } from "./HeroLight";

type Vec3 = [number, number, number];

/** A tiny studio of emissive panels, baked into a reflection map. */
function buildStudio() {
  const studio = new THREE.Scene();
  const panel = (
    color: string,
    gain: number,
    w: number,
    h: number,
    at: Vec3
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(gain),
        side: THREE.DoubleSide,
      })
    );
    mesh.position.set(...at);
    mesh.lookAt(0, 0, 0);
    studio.add(mesh);
  };
  panel("#ffe2a8", 16, 6, 4, [-6, 6, 4]); // warm key softbox
  panel("#6fc3d4", 6, 2.5, 9, [7, 2, -4]); // cold rim strip
  panel("#f29a26", 2, 10, 2, [0, -5, 3]); // floor bounce
  return studio;
}

function glowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,200,120,1)");
    g.addColorStop(1, "rgba(255,200,120,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  return new THREE.CanvasTexture(canvas);
}

/** Reflections, teal rim, warm bounce and the pool of light on the floor. */
export default function HeroEnvironment() {
  const gl = useThree(s => s.gl);
  const glow = useMemo(() => glowTexture(), []);
  const env = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const rt = pmrem.fromScene(buildStudio(), 0.04);
    pmrem.dispose();
    return rt;
  }, [gl]);

  useEffect(() => () => env.dispose(), [env]);

  return (
    <>
      <primitive object={env.texture} attach="environment" />
      <spotLight
        position={[7, 4, -6]}
        color="#6fc3d4"
        intensity={240}
        angle={0.5}
        penumbra={1}
        distance={40}
      />
      <pointLight
        position={[2, -1.2, 6]}
        color="#f29a26"
        intensity={16}
        distance={16}
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-1.2, FLOOR_Y + 0.01, 0]}
      >
        <planeGeometry args={[14, 14]} />
        <meshBasicMaterial
          map={glow}
          transparent
          opacity={0.14}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}
