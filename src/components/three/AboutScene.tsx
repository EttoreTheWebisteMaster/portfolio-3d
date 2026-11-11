"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { cinemaLight, ease, journey, seg } from "@/lib/journey";
import { roomTone } from "@/lib/sound";

import { daylight, MARK_X, walkPose } from "./walkPose";
import AboutDoor from "./AboutDoor";
import { blobTexture, sweepGeometry } from "./aboutRoom";
import { FLOOR_Y } from "./HeroLight";
import { warm } from "./Warmup";

const KEY = 560;
const FILL = 200;
/** Neutral daylight bouncing in the room: lifts the sweep to cream without a second key. */
const SKY = 2.4;
const TRAILER = 150;

const pose = { x: 0, yaw: 0, stand: 0, phase: 0, moving: 0 };

/** The About set: the exit door and passage, and a cream sweep under neutral daylight with one soft key from the top left. */
export default function AboutScene() {
  const key = useRef<THREE.SpotLight>(null);
  const fill = useRef<THREE.PointLight>(null);
  const trailer = useRef<THREE.PointLight>(null);
  const sky = useRef<THREE.HemisphereLight>(null);
  const room = useRef<THREE.Group>(null);
  const blob = useRef<THREE.Mesh>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const sweep = useMemo(() => sweepGeometry(), []);
  const shadow = useMemo(() => blobTexture(), []);
  useEffect(() => {
    target.position.set(MARK_X, FLOOR_Y, 0);
    if (key.current) key.current.target = target;
  }, [target]);
  useFrame(() => {
    const d = daylight();
    // Cinema hum while the walk plays, daylight air once he is through; nothing on the other pages.
    roomTone(journey.current > 1.02 && journey.current < 2.4 ? d : -1);
    // The lights stay in the scene (a changing light count would recompile every material); only their strength follows the shot.
    if (key.current) key.current.intensity = KEY * d;
    if (fill.current) fill.current.intensity = FILL * d;
    if (sky.current) sky.current.intensity = SKY * d;
    // The trailer's light on his head and shoulders: cold, from the screen's side. It stays put and he walks out of it.
    if (trailer.current) {
      walkPose(pose);
      trailer.current.intensity =
        TRAILER *
        cinemaLight(Math.min(journey.current, 1)) *
        (1 - ease(seg(pose.x, [0, 12]))) *
        (1 - d);
    }
    if (room.current) room.current.visible = journey.current > 1.4 || warm.on;
    if (blob.current) {
      walkPose(pose);
      blob.current.position.x = pose.x;
      (blob.current.material as THREE.MeshBasicMaterial).opacity = 0.55 * d;
    }
  });
  return (
    <group>
      <AboutDoor />
      <primitive object={target} />
      <spotLight
        ref={key}
        position={[MARK_X - 7, 11, 12]}
        color="#fffaf0"
        intensity={0}
        angle={0.5}
        penumbra={1}
        distance={60}
        decay={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-radius={6}
        shadow-bias={-0.0004}
      />
      <hemisphereLight ref={sky} args={["#fff8ee", "#d8cfba", 0]} />
      <pointLight
        ref={trailer}
        position={[0.5, 4, 2.5]}
        color="#cfe6ee"
        intensity={0}
        distance={30}
        decay={2}
      />
      <pointLight
        ref={fill}
        position={[MARK_X + 2, 3, 14]}
        color="#fff6e6"
        intensity={0}
        distance={80}
        decay={2}
      />
      <group ref={room} visible={false}>
        <mesh geometry={sweep} receiveShadow>
          <meshStandardMaterial
            color="#ece4d0"
            roughness={1}
            side={THREE.DoubleSide}
            envMapIntensity={0}
          />
        </mesh>
        <mesh
          ref={blob}
          position={[MARK_X, FLOOR_Y + 0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[3.6, 3.6]} />
          <meshBasicMaterial
            map={shadow}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}
