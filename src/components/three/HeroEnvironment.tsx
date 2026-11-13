"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import {
  ease,
  heroLight,
  introKey,
  introRim,
  type Progress,
  seg,
} from "@/lib/journey";

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
  panel("#ffbe70", 6, 8, 5, [-3, 6, 6]); // warm key softbox
  panel("#9fc4d0", 4, 2.5, 9, [7, 2, -4]); // cool rim strip
  panel("#9fc4d0", 3, 2.5, 9, [-7, 2, -4]); // cool rim strip, other side
  // A dim warm room all round, so no direction reflects a black void.
  const room = new THREE.Mesh(
    new THREE.SphereGeometry(20, 24, 16),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color("#8a7a68").multiplyScalar(0.7),
      side: THREE.BackSide,
    })
  );
  studio.add(room);
  panel("#f29a26", 2, 10, 2, [0, -5, 3]); // floor bounce
  panel("#ffe3bc", 1.5, 14, 8, [3, 2, 9]); // soft gold front, so the dark paint still reads
  return studio;
}

function glowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,170,90,1)");
    g.addColorStop(1, "rgba(255,170,90,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  return new THREE.CanvasTexture(canvas);
}

/** Reflections, teal rim, warm bounce and the pool of light on the floor. */
export default function HeroEnvironment({
  progress,
}: Readonly<{ progress: Progress }>) {
  const rim = useRef<THREE.SpotLight>(null);
  const bounce = useRef<THREE.PointLight>(null);
  const rimB = useRef<THREE.SpotLight>(null);
  const under = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const sky = useRef<THREE.HemisphereLight>(null);
  const pool = useRef<THREE.MeshBasicMaterial>(null);
  const shade = useRef<THREE.ShadowMaterial>(null);
  const gl = useThree(s => s.gl);
  const glow = useMemo(() => glowTexture(), []);
  const env = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const rt = pmrem.fromScene(buildStudio(), 0.04);
    pmrem.dispose();
    return rt;
  }, [gl]);

  useEffect(() => () => env.dispose(), [env]);

  // No hero light survives on the Projects side: reflections, rim, bounce, sky and the floor pool all go to zero.
  useFrame(({ scene }) => {
    const k = heroLight(progress.current);
    // The key slams first; reflections and the pool follow, then the cold rim lands last.
    const key = k * introKey(0.2);
    // The rim starts as a thin edge light on the silhouette and grows as the key comes up.
    const kRim = k * introRim() * (0.3 + 0.7 * introKey());
    // The silhouette already shines a little: reflections never go fully off once the rim is on.
    scene.environmentIntensity = Math.max(key, k * introRim() * 0.1);
    if (rim.current) rim.current.intensity = 170 * kRim;
    if (rimB.current) rimB.current.intensity = 130 * kRim;
    if (bounce.current) bounce.current.intensity = 16 * key;
    if (sky.current) sky.current.intensity = 0.4 * key;
    if (fill.current) fill.current.intensity = 0.4 * key;
    if (under.current) under.current.intensity = 0.2 * key;
    if (pool.current) pool.current.opacity = 0.14 * key;
    // His shadow on the floor is the hero's: it is gone before the camera cranes up, where it would stretch across the backdrop.
    if (shade.current) {
      const fade = 1 - ease(seg(progress.current, [0, 0.2]));
      shade.current.opacity = 0.45 * fade;
      shade.current.visible = fade > 0;
    }
  });

  return (
    <>
      <hemisphereLight ref={sky} args={["#c9d6dc", "#6a4a2a", 0.5]} />
      <primitive object={env.texture} attach="environment" />
      <directionalLight
        ref={under}
        position={[2, -2, 8]}
        color="#ffb870"
        intensity={0.5}
      />
      <directionalLight
        ref={fill}
        position={[3, 1.5, 9]}
        color="#ffd9a8"
        intensity={1.1}
      />
      <spotLight
        ref={rim}
        position={[7, 4, -6]}
        color="#7fb8c8"
        intensity={170}
        angle={0.5}
        penumbra={1}
        distance={40}
      />
      <spotLight
        ref={rimB}
        position={[-7, 4, -6]}
        color="#7fb8c8"
        intensity={130}
        angle={0.5}
        penumbra={1}
        distance={40}
      />
      <pointLight
        ref={bounce}
        position={[2, -1.2, 6]}
        color="#f29a26"
        intensity={16}
        distance={16}
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, FLOOR_Y, 0]}
        receiveShadow
      >
        <planeGeometry args={[60, 60]} />
        <shadowMaterial ref={shade} opacity={0.45} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + 0.01, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshBasicMaterial
          ref={pool}
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
