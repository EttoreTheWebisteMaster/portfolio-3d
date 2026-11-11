"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import AboutRobot from "./AboutRobot";
import { ease, seg } from "@/lib/journey";

import { CUT, DEPTH, grow, landing, onAbout, ORIGIN } from "./aboutShot";
import { warm } from "./Warmup";

const CENTROID_Y = (CUT.apex + 2 * CUT.base) / 3;
/** Depths of the haze sheets inside the tunnel: the deeper he stands, the darker he is. */
const HAZE = [-0.08, -0.5, -1.1, -1.9, -3] as const;

/** A flat triangle the size of the cut, built around its own centre so it can scale from it. */
function cutShape() {
  const s = new THREE.Shape();
  s.moveTo(0, CUT.apex - CENTROID_Y);
  s.lineTo(-CUT.half, CUT.base - CENTROID_Y);
  s.lineTo(CUT.half, CUT.base - CENTROID_Y);
  s.closePath();
  return new THREE.ShapeGeometry(s);
}

/** The cut's three corners, scaled about its centre: `g` 0 = a point, 1 = the real cut. */
function corners(g: number) {
  const k = Math.max(g, 0.002);
  return (
    [
      [0, CUT.apex - CENTROID_Y],
      [-CUT.half, CUT.base - CENTROID_Y],
      [CUT.half, CUT.base - CENTROID_Y],
    ] as const
  ).map(([x, y]) => new THREE.Vector2(ORIGIN.x + k * x, CENTROID_Y + k * y));
}

function wallShape(g: number) {
  const outer = new THREE.Shape();
  outer.moveTo(ORIGIN.x - 60, -30);
  outer.lineTo(ORIGIN.x + 60, -30);
  outer.lineTo(ORIGIN.x + 60, 30);
  outer.lineTo(ORIGIN.x - 60, 30);
  outer.closePath();
  outer.holes.push(new THREE.Path(corners(g)));
  return outer;
}

/**
 * The cream wall with the triangular cut, and the tunnel behind it that fades to black.
 * The cut starts as a point in the bare wall and grows to its real size: the wall and tunnel are rebuilt while it grows.
 */
function Wall() {
  const wall = useRef<THREE.Mesh>(null);
  const tunnel = useRef<THREE.Mesh>(null);
  const hazes = useRef<THREE.Group>(null);
  const built = useRef(-1);
  const [wallGeo, tunnelGeo, triangle] = useMemo(
    () => [
      new THREE.ShapeGeometry(wallShape(1)),
      new THREE.ExtrudeGeometry(new THREE.Shape(corners(1)), {
        depth: DEPTH,
        bevelEnabled: false,
      }),
      cutShape(),
    ],
    []
  );
  useFrame(() => {
    const g = grow();
    if (g === built.current) return;
    built.current = g;
    if (wall.current) {
      wall.current.geometry.dispose();
      wall.current.geometry = new THREE.ShapeGeometry(wallShape(g));
    }
    if (tunnel.current) {
      tunnel.current.geometry.dispose();
      tunnel.current.geometry = new THREE.ExtrudeGeometry(
        new THREE.Shape(corners(g)),
        { depth: DEPTH, bevelEnabled: false }
      );
    }
    if (hazes.current) {
      hazes.current.scale.setScalar(Math.max(g, 0.002));
    }
  });
  return (
    <>
      <mesh ref={wall} geometry={wallGeo} receiveShadow>
        <meshStandardMaterial color="#e4dcc4" roughness={1} />
      </mesh>
      <mesh ref={tunnel} geometry={tunnelGeo} position={[0, 0, -DEPTH]}>
        <meshBasicMaterial color="#030303" side={THREE.BackSide} />
      </mesh>
      <group ref={hazes} position={[ORIGIN.x, CENTROID_Y, 0]}>
        {HAZE.map(z => (
          <mesh
            key={z}
            geometry={triangle}
            position={[0, 0, z]}
            renderOrder={1}
          >
            <meshBasicMaterial
              color="#000"
              transparent
              opacity={0.2}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}

const KEY = 560;
const FILL = 260;

/** The About set: cream wall, tunnel, neutral daylight from top-left, and ROB-092 at the window. */
export default function AboutScene({ url }: Readonly<{ url: string | null }>) {
  const light = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    target.position.set(ORIGIN.x, 2.5, 0);
    if (light.current) light.current.target = target;
  }, [target]);
  const group = useRef<THREE.Group>(null);
  const fill = useRef<THREE.PointLight>(null);
  useFrame(() => {
    const on = onAbout();
    if (group.current) group.current.visible = on || warm.on;
    // The lights stay in the scene (a changing light count would recompile every material at the cut); only their strength follows the page.
    // The key slams on while the white-out clears, with a stutter like a big lamp catching.
    // Lit from the first frame, so the wall matches the iris that just closed on it; the lamp then settles with a flicker.
    const a = seg(landing(), [0, 0.4]);
    const stutter = a < 1 ? 0.9 + 0.1 * Math.sin(a * 42) : 1;
    if (light.current)
      light.current.intensity = on ? KEY * (0.7 + 0.3 * ease(a)) * stutter : 0;
    if (fill.current) fill.current.intensity = on ? FILL : 0;
  });
  return (
    <group ref={group} visible={false}>
      <primitive object={target} />
      <spotLight
        ref={light}
        position={[ORIGIN.x - 7, 11, 13]}
        color="#fffaf0"
        intensity={0}
        angle={0.5}
        penumbra={1}
        distance={60}
        decay={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      />
      <pointLight
        ref={fill}
        position={[ORIGIN.x, 3, 14]}
        color="#fff6e6"
        intensity={0}
        distance={80}
        decay={2}
      />
      <Wall />
      {url && <AboutRobot url={url} />}
    </group>
  );
}
