"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { ease, journey, seg } from "@/lib/journey";
import { roomTone } from "@/lib/sound";

import {
  closeUp,
  daylight,
  eye,
  MARK_X,
  newPose,
  SPILL,
  spillFront,
  walk,
  walkPose,
  ZOOM,
} from "./walkPose";
import { blobTexture, spillMaterial, sweepGeometry } from "./aboutRoom";
import { FLOOR_Y } from "./HeroLight";
import { warm } from "./Warmup";

const KEY = 520;
const FILL = 26;
const RIM = 120;
/** Neutral daylight bouncing in the room: lifts the sweep to cream without a second key. */
const SKY = 0.5;
/** The glint: one small cold light in front of his face that outlives the room while the lens pushes in. */
const GLINT = 14;
/** The close-up's light on his face. */
const CLOSE = 70;

const pose = newPose();

/** The About set: a cream sweep under soft studio light on him (wide key, cool rim, gentle fill), lit as the walk goes on. */
export default function AboutScene() {
  const key = useRef<THREE.SpotLight>(null);
  const fill = useRef<THREE.PointLight>(null);
  const rim = useRef<THREE.SpotLight>(null);
  const glint = useRef<THREE.PointLight>(null);
  const lens = useRef<THREE.PointLight>(null);
  const sky = useRef<THREE.HemisphereLight>(null);
  const room = useRef<THREE.Group>(null);
  const blob = useRef<THREE.Mesh>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const sweep = useMemo(() => sweepGeometry(), []);
  const { material, setFront } = useMemo(() => spillMaterial(SPILL.soft), []);
  const shadow = useMemo(() => blobTexture(), []);
  useEffect(() => {
    target.position.set(MARK_X, FLOOR_Y + 2.2, 0);
    if (key.current) key.current.target = target;
    if (rim.current) rim.current.target = target;
  }, [target]);
  useFrame(() => {
    const d = daylight();
    // Cinema hum while the walk plays, daylight air once he is through; nothing on the other pages.
    roomTone(journey.current > 1.02 && journey.current < 2.4 ? d : -1);
    // The lights stay in the scene (a changing light count would recompile every material); only their strength follows the shot.
    if (key.current) key.current.intensity = KEY * d;
    if (fill.current) fill.current.intensity = FILL * d;
    // A cold rim outlines him against the dark of the cinema as he sets off, then the room's light takes over.
    if (rim.current)
      rim.current.intensity =
        RIM * Math.max(d, 0.8 * ease(seg(walk(), [0, 0.12])) * (1 - d));
    if (sky.current) sky.current.intensity = SKY * d;
    // The soft light of the close-up: on his face while the lens is on him, gone as he walks off. It stays where it is; only its strength follows the shot.
    if (lens.current) lens.current.intensity = CLOSE * closeUp();
    if (glint.current) {
      const pos = journey.current;
      glint.current.position
        .copy(eye.pos)
        .addScaledVector(eye.facing, 1.4)
        .setY(eye.pos.y + 0.25);
      glint.current.intensity =
        GLINT *
        ease(seg(pos, [ZOOM[0] + 0.04, ZOOM[0] + 0.24])) *
        (1 - ease(seg(pos, [ZOOM[1] - 0.06, ZOOM[1] + 0.04])));
    }
    // Drawn from the first frame of the walk: it is transparent where the daylight has not reached yet, so nothing switches on.
    if (room.current) room.current.visible = journey.current > 1 || warm.on;
    setFront(spillFront());
    if (blob.current) {
      walkPose(pose);
      blob.current.position.set(pose.x, FLOOR_Y + 0.05, pose.z);
      (blob.current.material as THREE.MeshBasicMaterial).opacity = 0.55 * d;
    }
  });
  return (
    <group>
      <primitive object={target} />
      <spotLight
        ref={key}
        position={[MARK_X + 6, 2.8, 14]}
        color="#fff6e8"
        intensity={0}
        angle={0.4}
        penumbra={0.35}
        distance={70}
        decay={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-radius={3}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
      />
      <spotLight
        ref={rim}
        position={[MARK_X + 5, 7, -5]}
        color="#dfeaff"
        intensity={0}
        angle={0.6}
        penumbra={1}
        distance={40}
        decay={2}
      />
      <hemisphereLight ref={sky} args={["#fff8ee", "#d8cfba", 0]} />
      <pointLight
        ref={lens}
        position={[2.5, 1.8, 4.5]}
        color="#ffe2c0"
        intensity={0}
        distance={16}
        decay={2}
      />
      <pointLight
        ref={glint}
        color="#cfe6ee"
        intensity={0}
        distance={8}
        decay={2}
      />
      <pointLight
        ref={fill}
        position={[MARK_X + 6, 2.5, 14]}
        color="#fff6e6"
        intensity={0}
        distance={80}
        decay={2}
      />
      <group ref={room} visible={false}>
        <mesh geometry={sweep} receiveShadow renderOrder={1}>
          <primitive object={material} attach="material" />
        </mesh>
        <mesh
          ref={blob}
          renderOrder={2}
          position={[MARK_X, FLOOR_Y + 0.05, 0]}
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
