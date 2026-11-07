"use client";

import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { FLOOR_Y } from "./HeroLight";

/** ROB-092: matte paint with a lacquer sheen (design system palette). */
const PALETTE: Record<
  string,
  { color: string; metalness: number; roughness: number; clearcoat: number }
> = {
  Main: { color: "#F29A26", metalness: 0.22, roughness: 0.4, clearcoat: 0.5 },
  Grey: { color: "#BDB9AE", metalness: 0.35, roughness: 0.36, clearcoat: 0.3 },
  Black: { color: "#3D3D3D", metalness: 0.15, roughness: 0.28, clearcoat: 0.6 },
};

export default function HeroRobot() {
  const gltf = useLoader(GLTFLoader, "/models/RobotExpressive.glb");
  const mixer = useMemo(() => new THREE.AnimationMixer(gltf.scene), [gltf]);

  useEffect(() => {
    const made = new Map<string, THREE.MeshPhysicalMaterial>();
    gltf.scene.traverse(obj => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      const old = obj.material;
      if (!(old instanceof THREE.MeshStandardMaterial) || !PALETTE[old.name])
        return;
      let mat = made.get(old.name);
      if (!mat) {
        const p = PALETTE[old.name];
        mat = new THREE.MeshPhysicalMaterial({
          name: old.name,
          color: p.color,
          metalness: p.metalness,
          roughness: p.roughness,
          clearcoat: p.clearcoat,
          clearcoatRoughness: 0.35,
          flatShading: old.flatShading,
          envMapIntensity: 0.5,
        });
        made.set(old.name, mat);
      }
      obj.material = mat;
    });
    const idle = THREE.AnimationClip.findByName(gltf.animations, "Idle");
    if (idle) mixer.clipAction(idle).play();
    mixer.update(0);
    return () => {
      mixer.stopAllAction();
    };
  }, [gltf, mixer]);

  useFrame((_, dt) => mixer.update(dt));

  return <primitive object={gltf.scene} position={[0, FLOOR_Y, 0]} />;
}
