"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { BEAT, cinemaLight, ease, type Progress, seg } from "@/lib/journey";
import { view } from "@/lib/projects";

import { FLOOR_Y } from "./HeroLight";
import CrowdDust from "./CrowdDust";
import { PROJECTOR } from "./crowdLight";
import ProjectsCrowd from "./ProjectsCrowd";
import ProjectsScreen from "./ProjectsScreen";
import { cinemaFade, crowdFade, daylight } from "./walkPose";
import { warm } from "./Warmup";

/** Projector light: cold white, close to neutral. */
const BEAM = "#cfe6ee";
const UP = new THREE.Vector3(0, 1, 0);

/** Nested soft cones, brightest at the lens and falling off toward the screen, so the beam has no hard edge. `reach` is the base radius in screen half-diagonals. */
const CONES = [
  { reach: 0.6, alpha: 0.002 },
  { reach: 0.88, alpha: 0.0012 },
  { reach: 1.23, alpha: 0.0007 },
] as const;

/** A unit cone (apex up, radius 1, length 1) whose vertex alpha fades from the lens down to the picture. */
function cone(alpha: number) {
  const geo = new THREE.ConeGeometry(1, 1, 48, 1, true);
  const pos = geo.getAttribute("position");
  const colors = new Float32Array(pos.count * 4);
  for (let i = 0; i < pos.count; i++) {
    const fade = 0.1 + 0.9 * (pos.getY(i) + 0.5);
    colors.set([1, 1, 1, alpha * fade], i * 4);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 4));
  return geo;
}

const dir = new THREE.Vector3();
const mid = new THREE.Vector3();
const at = new THREE.Vector3();

/** Soft projector beam, swelling as the picture opens. Re-aimed every frame at the real screen, so it always lands on it. */
function Beam({ progress }: Readonly<{ progress: Progress }>) {
  const group = useRef<THREE.Group>(null);
  const cones = useMemo(() => CONES.map(c => cone(c.alpha)), []);

  useFrame(() => {
    const on = ease(seg(progress.current, BEAT.picture)) * cinemaFade();
    const { x, y, z, w, h } = view.screen;
    at.set(x, y, z);
    dir.copy(PROJECTOR).sub(at);
    const length = dir.length();
    dir.normalize();
    mid.copy(at).add(PROJECTOR).multiplyScalar(0.5);
    const g = group.current;
    if (!g) return;
    g.position.copy(mid);
    g.quaternion.setFromUnitVectors(UP, dir);
    g.children.forEach((obj, i) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const r = CONES[i].reach * Math.hypot(w, h) * 0.5;
      obj.scale.set(r, length, r);
      const mat = obj.material;
      if (mat instanceof THREE.Material) mat.opacity = on;
    });
  });

  return (
    <group ref={group}>
      {cones.map((geometry, i) => (
        <mesh key={CONES[i].reach} geometry={geometry} frustumCulled={false}>
          <meshBasicMaterial
            color={BEAM}
            vertexColors
            transparent
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

const MASK = new THREE.Color("#0b0a09");
const FLOOR = new THREE.Color("#0d0c0b");

/** The cinema behind the hero: floor, screen, projector beam and crowd. It surfaces out of the dark as he turns. */
export default function ProjectsRoom({
  progress,
  reduced,
}: Readonly<{ progress: Progress; reduced: boolean }>) {
  const group = useRef<THREE.Group>(null);
  const floor = useRef<THREE.MeshStandardMaterial>(null);
  const top = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.HemisphereLight>(null);
  const set = useRef<THREE.Group>(null);

  useFrame(() => {
    const show = ease(seg(progress.current, BEAT.reveal));
    const cinema = cinemaLight(progress.current);
    // The crowd is always in the room (waiting off-screen); only the floor surfaces.
    if (group.current) group.current.visible = progress.current > 0 || warm.on;
    if (floor.current) {
      const f = ease(seg(progress.current, BEAT.floor));
      floor.current.opacity = f;
      // Masked in the backdrop colour, it takes its own colour only as it surfaces.
      floor.current.color.lerpColors(MASK, FLOOR, f);
    }
    // Cool ambient bounce so the room never goes black while the hero key hands over.
    const day = daylight();
    if (fill.current) fill.current.intensity = 0.2 * cinema * (1 - 0.7 * day);
    // Once the camera has settled in the cream room the cinema is far behind it: it stops being drawn (nothing of it is in frame by then). Its lights stay (a changing light count would recompile everything).
    if (set.current) set.current.visible = crowdFade() > 0 || warm.on;
    // The warm accent: a low house light grazing the crowd's crowns against the cold screen.
    if (top.current) top.current.intensity = 0.3 * show * (1 - day);
  });

  return (
    <group ref={group} visible={false}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-7.5, FLOOR_Y - 0.01, -6]}
      >
        <planeGeometry args={[45, 60]} />
        <meshStandardMaterial
          ref={floor}
          color="#0d0c0b"
          roughness={0.42}
          metalness={0.1}
          transparent
        />
      </mesh>
      <hemisphereLight ref={fill} args={["#3d7384", "#0b0907", 0]} />
      <directionalLight ref={top} position={[2, 12, 3]} color="#f29a26" />
      <group ref={set}>
        <ProjectsScreen progress={progress} reduced={reduced} />
        <Beam progress={progress} />
        <ProjectsCrowd progress={progress} reduced={reduced} />
        <CrowdDust />
      </group>
    </group>
  );
}
