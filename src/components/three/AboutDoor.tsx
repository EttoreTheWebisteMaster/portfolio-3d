"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type * as THREE from "three";
import { Object3D } from "three";

import { DARK, DOOR_H, OPENING, PASSAGE } from "./aboutRoom";
import { FLOOR_Y } from "./HeroLight";
import { play } from "@/lib/sound";

import { daylight, DOOR_X, doorOpen, PASSAGE_END } from "./walkPose";

/** The wall at the passage's end as flat pieces facing the cinema: [z, y, width, height]. Single-sided, so once the camera is in the room it is behind it. */
const mouth = [
  [-PASSAGE.half - 20, FLOOR_Y + 10, 40, 24],
  [PASSAGE.half + 25, FLOOR_Y + 10, 50, 24],
  [0, FLOOR_Y + PASSAGE.height + 9, 2 * PASSAGE.half, 18],
] as const;
const DOOR_LIGHT = 420;

/** The end of the row: a dark wall with a plain door, and the short dark passage behind it. */
export default function AboutDoor() {
  const leaf = useRef<THREE.Group>(null);
  const light = useRef<THREE.SpotLight>(null);
  const swinging = useRef(false);
  const target = useMemo(() => new Object3D(), []);
  useEffect(() => {
    target.position.set(DOOR_X - 7, FLOOR_Y, 0);
    if (light.current) light.current.target = target;
  }, [target]);
  useFrame(() => {
    const open = doorOpen();
    // The creak as it opens and as it closes behind him.
    const moving = open > 0.02 && open < 0.98;
    if (moving && !swinging.current) play("door");
    swinging.current = moving;
    if (leaf.current) leaf.current.rotation.y = open * 1.65;
    // The only light on the cinema side: daylight spilling through the opening onto the floor and onto him.
    if (light.current)
      light.current.intensity = DOOR_LIGHT * open * (1 - daylight() * 0.6);
  });
  const wall = (z: number, depth: number) => (
    <mesh position={[DOOR_X, FLOOR_Y + 4.5, z]}>
      <boxGeometry args={[0.5, 9, depth]} />
      <meshStandardMaterial color={DARK} roughness={1} />
    </mesh>
  );
  const side = 8 - OPENING / 2;
  // Only a short jamb on the camera side: the wall must never stand between the lens and him as he goes through.
  const near = 1.2;
  return (
    <group>
      <primitive object={target} />
      <spotLight
        ref={light}
        position={[DOOR_X + 0.8, FLOOR_Y + 2.2, 0]}
        color="#fff1dc"
        intensity={0}
        angle={0.95}
        penumbra={1}
        distance={40}
        decay={2}
      />
      {wall(-OPENING - side / 2, side)}
      {wall(OPENING + near / 2, near)}
      <mesh position={[DOOR_X, FLOOR_Y + (DOOR_H + 9) / 2, 0]}>
        <boxGeometry args={[0.5, 9 - DOOR_H, 2 * OPENING]} />
        <meshStandardMaterial color={DARK} roughness={1} />
      </mesh>
      <group ref={leaf} position={[DOOR_X, FLOOR_Y, -OPENING]}>
        <mesh position={[0, DOOR_H / 2, OPENING]}>
          <boxGeometry args={[0.16, DOOR_H, 2 * OPENING]} />
          <meshStandardMaterial color="#1a1613" roughness={0.8} />
        </mesh>
      </group>
      {/* The room's wall, with the passage's mouth cut in it: seen from the cinema side the cream room is only that opening of light. */}
      {mouth.map(([z, y, w, h]) => (
        <mesh
          key={`${z}-${y}`}
          position={[PASSAGE_END, y, z]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial color={DARK} />
        </mesh>
      ))}
      {/* The passage: floor, ceiling and back wall; its front stays open to the camera. */}
      <mesh
        position={[(DOOR_X + PASSAGE_END) / 2, FLOOR_Y + 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[PASSAGE_END - DOOR_X, 2 * PASSAGE.half]} />
        <meshStandardMaterial color={DARK} roughness={0.5} />
      </mesh>
      <mesh
        position={[(DOOR_X + PASSAGE_END) / 2, FLOOR_Y + PASSAGE.height, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[PASSAGE_END - DOOR_X, 2 * PASSAGE.half]} />
        <meshStandardMaterial color={DARK} roughness={1} />
      </mesh>
      <mesh
        position={[
          (DOOR_X + PASSAGE_END) / 2,
          FLOOR_Y + PASSAGE.height / 2,
          -PASSAGE.half,
        ]}
      >
        <planeGeometry args={[PASSAGE_END - DOOR_X, PASSAGE.height]} />
        <meshStandardMaterial color={DARK} roughness={1} />
      </mesh>
    </group>
  );
}
