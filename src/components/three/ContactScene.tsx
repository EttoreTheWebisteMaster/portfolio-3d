"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { beamPulse } from "@/lib/contact";

import ContactAir from "./ContactAir";
import ContactBeam from "./ContactBeam";
import ContactCrowd from "./ContactCrowd";
import { stage } from "./contactRobots";
import { AIM, flash, lampRise, LAMP, onContact, ORIGIN } from "./contactShot";
import { warm } from "./Warmup";

const KEY = 240;
const FILL = 60;
const COLD = "#eef2f3";
const DARK = "#0a0d0e";

/** A one-pixel-wide gradient: the floor is solid near the camera and melts into the dark far away. */
function fade() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 64);
    // The canvas runs top to bottom, the plane's far edge is its top.
    g.addColorStop(0, "#000");
    g.addColorStop(0.3, "#000");
    g.addColorStop(0.6, "#fff");
    g.addColorStop(1, "#fff");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1, 64);
  }
  return new THREE.CanvasTexture(canvas);
}

/** The far half of the pool, drawn by the canvas behind the copy: lent the pool just before that canvas draws, and given it back after. */
function Far({ set }: Readonly<{ set: React.RefObject<THREE.Group | null> }>) {
  const { gl, scene, camera } = useThree();
  const built = useRef(false);
  useEffect(() => {
    stage.far = set.current;
    return () => {
      stage.far = null;
    };
  }, [set]);
  useFrame(() => {
    const crowd = stage.crowd;
    if (!crowd || !stage.far) return;
    if (!built.current) {
      built.current = true;
      crowd.compileFar(() => gl.compile(scene, camera));
    }
    if (onContact()) crowd.lend(stage.far, false);
  }, 0.9);
  useFrame(() => stage.crowd?.restore(), 2);
  return null;
}

/**
 * The Contact set, drawn by two canvases: behind the copy, the dark hazy floor, the beam and the dust;
 * in front of it (`front`), the lamp's light, the robots and their shadows, so they walk over the headline and keys.
 */
export default function ContactScene({
  url,
  front = false,
}: Readonly<{ url: string | null; front?: boolean }>) {
  const group = useRef<THREE.Group>(null);
  const key = useRef<THREE.SpotLight>(null);
  const fill = useRef<THREE.PointLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const alpha = useMemo(() => fade(), []);
  useEffect(() => {
    target.position.copy(AIM);
    if (key.current) key.current.target = target;
    return () => alpha.dispose();
  }, [target, alpha]);

  useFrame(({ clock }) => {
    const on = onContact();
    const t = clock.elapsedTime;
    const rise = lampRise();
    // The lamp breathes a hair, like a bulb on a long cable.
    const breath = 1 + 0.025 * Math.sin(t * 1.3) + 0.012 * Math.sin(t * 5.7);
    if (group.current) group.current.visible = on || warm.on;
    // The lights stay in the scene (a changing light count would recompile every material at the cut); only their strength follows the page. A copy brightens the beam for a beat.
    if (key.current)
      key.current.intensity = on
        ? KEY * rise * breath * (1 + 0.8 * beamPulse() + 0.7 * flash.v)
        : 0;
    if (fill.current) fill.current.intensity = on ? FILL * rise : 0;
  });

  return (
    <group ref={group} visible={false}>
      <primitive object={target} />
      <spotLight
        ref={key}
        position={LAMP}
        color={COLD}
        intensity={0}
        angle={0.5}
        penumbra={1}
        distance={40}
        decay={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      />
      <pointLight
        ref={fill}
        position={[ORIGIN.x, 3, 8]}
        color="#9fb4b8"
        intensity={0}
        distance={80}
        decay={2}
      />
      {/* Over the bright copy, a robot outside the lamp's pool would read as a black cut-out: a little cold bounce keeps it a robot. */}
      {front && <ambientLight color="#9fb4b8" intensity={0.9} />}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[ORIGIN.x, 0, -10]}
        receiveShadow
      >
        <planeGeometry args={[80, 40]} />
        {front ? (
          <shadowMaterial opacity={0.55} />
        ) : (
          <meshStandardMaterial
            color="#1b1c1c"
            roughness={0.7}
            transparent
            alphaMap={alpha}
          />
        )}
      </mesh>
      {front ? (
        url && <ContactCrowd url={url} />
      ) : (
        <>
          <mesh position={[ORIGIN.x, 0, -32]}>
            <planeGeometry args={[160, 80]} />
            <meshBasicMaterial color={DARK} />
          </mesh>
          <ContactBeam lamp={LAMP} aim={AIM} />
          <ContactAir lamp={LAMP} aim={AIM} />
          <Far set={group} />
        </>
      )}
    </group>
  );
}
