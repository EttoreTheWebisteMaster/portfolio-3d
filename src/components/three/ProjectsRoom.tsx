"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import {
  BEAT,
  CAM_END,
  cinemaLight,
  ease,
  type Progress,
  SCREEN_DIST,
  seg,
} from "@/lib/journey";

import { dustTexture, FLOOR_Y, mulberry32 } from "./HeroLight";
import ProjectsCrowd from "./ProjectsCrowd";
import ProjectsScreen from "./ProjectsScreen";

/** Projector light: cold white, close to neutral. The dust warms it slightly. */
const BEAM = "#cfe6ee";
const DUST = "#e6f0f2";
/** Reference screen centre at 1440×900; the beam only needs to be near. */
const SCREEN_AT = new THREE.Vector3(
  CAM_END[0] - 4.7,
  CAM_END[1] + 2.2,
  CAM_END[2] - SCREEN_DIST
);
const PROJECTOR = new THREE.Vector3(0, 10, 18);

/** Nested soft cones, brightest at the lens and falling off toward the screen, so the beam has no hard edge. */
const CONES = [
  { radius: 3.4, alpha: 0.03 },
  { radius: 5, alpha: 0.022 },
  { radius: 7, alpha: 0.014 },
];

function cone(radius: number, length: number, alpha: number) {
  const geo = new THREE.ConeGeometry(radius, length, 48, 1, true);
  const pos = geo.getAttribute("position");
  const colors = new Float32Array(pos.count * 4);
  for (let i = 0; i < pos.count; i++) {
    const fade = 0.15 + 0.85 * (pos.getY(i) / length + 0.5);
    colors.set([1, 1, 1, alpha * fade], i * 4);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 4));
  return geo;
}

/** Soft projector beam with dust, swelling as the picture opens. */
function Beam({ progress }: Readonly<{ progress: Progress }>) {
  const group = useRef<THREE.Group>(null);
  const dustMat = useRef<THREE.PointsMaterial>(null);
  const { cones, position, quaternion, dust, texture } = useMemo(() => {
    const axis = PROJECTOR.clone().sub(SCREEN_AT);
    const length = axis.length();
    const dir = axis.clone().normalize();
    const rand = mulberry32(3);
    const pts = new Float32Array(220 * 3);
    for (let i = 0; i < 220; i++) {
      const t = rand();
      const spread = (1 - t) * 8;
      pts[i * 3] = SCREEN_AT.x + dir.x * t * length + (rand() - 0.5) * spread;
      pts[i * 3 + 1] =
        SCREEN_AT.y + dir.y * t * length + (rand() - 0.5) * spread;
      pts[i * 3 + 2] =
        SCREEN_AT.z + dir.z * t * length + (rand() - 0.5) * spread * 0.4;
    }
    return {
      cones: CONES.map(c => cone(c.radius, length, c.alpha)),
      position: SCREEN_AT.clone().add(PROJECTOR).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir
      ),
      dust: pts,
      texture: dustTexture(),
    };
  }, []);

  useFrame(() => {
    const on = ease(seg(progress.current, BEAT.picture));
    group.current?.traverse(obj => {
      if (!(obj instanceof THREE.Mesh)) return;
      const mat = obj.material;
      if (!(mat instanceof THREE.Material)) return;
      mat.opacity = on;
    });
    if (dustMat.current) dustMat.current.opacity = 0.5 * on;
  });

  return (
    <>
      <group ref={group} position={position} quaternion={quaternion}>
        {cones.map((geometry, i) => (
          <mesh key={CONES[i].radius} geometry={geometry}>
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
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={dustMat}
          map={texture}
          color={DUST}
          size={0.1}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}

/** The cinema behind the hero: floor, screen, projector beam and crowd. It surfaces out of the dark as he turns. */
export default function ProjectsRoom({
  progress,
  reduced,
}: Readonly<{ progress: Progress; reduced: boolean }>) {
  const group = useRef<THREE.Group>(null);
  const floor = useRef<THREE.MeshStandardMaterial>(null);
  const top = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.HemisphereLight>(null);

  useFrame(() => {
    const show = ease(seg(progress.current, BEAT.reveal));
    const cinema = cinemaLight(progress.current);
    // The crowd is always in the room (waiting off-screen); only the floor surfaces.
    if (group.current) group.current.visible = progress.current > 0;
    if (floor.current)
      floor.current.opacity = ease(seg(progress.current, BEAT.floor));
    // Cool ambient bounce so the room never goes black while the hero key hands over.
    if (fill.current) fill.current.intensity = 0.5 * cinema;
    // The warm accent: a low house light grazing the crowd's crowns against the cold screen.
    if (top.current) top.current.intensity = 1.8 * show;
  });

  return (
    <group ref={group} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y - 0.01, -6]}>
        <planeGeometry args={[60, 60]} />
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
      <ProjectsScreen progress={progress} reduced={reduced} />
      <Beam progress={progress} />
      <ProjectsCrowd progress={progress} />
    </group>
  );
}
