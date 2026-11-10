"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { type Puff, puffs } from "./crowdHands";
import { dustTexture, FLOOR_Y } from "./HeroLight";

/** Particles in the pool; the oldest is reused when a burst needs more. */
const COUNT = 96;
const LIFE = 0.9;
/** Warm dust, kept dim so it reads as a puff in the room's light, never a glow. */
const TINT = new THREE.Color("#8a7358").multiplyScalar(0.45);

/** The particle pool: owns its buffers and moves them each frame. */
class DustPool {
  geometry = new THREE.BufferGeometry();
  material: THREE.PointsMaterial;
  private pos = new Float32Array(COUNT * 3);
  private col = new Float32Array(COUNT * 3);
  private vel = new Float32Array(COUNT * 3);
  private life = new Float32Array(COUNT);
  private next = 0;

  constructor() {
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.pos, 3)
    );
    this.geometry.setAttribute("color", new THREE.BufferAttribute(this.col, 3));
    this.material = new THREE.PointsMaterial({
      map: dustTexture(),
      size: 0.7,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }

  private spawn(puff: Puff) {
    const { pos, vel, life } = this;
    for (let k = 0; k < puff.n; k++) {
      const i = this.next;
      this.next = (this.next + 1) % COUNT;
      const a = Math.random() * Math.PI * 2;
      const speed = (0.4 + Math.random() * 0.8) * puff.power;
      pos[i * 3] = puff.x + Math.cos(a) * 0.3;
      pos[i * 3 + 1] = FLOOR_Y + 0.12;
      pos[i * 3 + 2] = puff.z + Math.sin(a) * 0.3;
      vel[i * 3] = Math.cos(a) * speed;
      vel[i * 3 + 1] = 0.25 + Math.random() * 0.45 * puff.power;
      vel[i * 3 + 2] = Math.sin(a) * speed;
      life[i] = LIFE * (0.7 + Math.random() * 0.3);
    }
  }

  step(dt: number) {
    const { pos, col, vel, life } = this;
    for (const puff of puffs.splice(0)) this.spawn(puff);
    const drag = Math.exp(-2.5 * dt);
    for (let i = 0; i < COUNT; i++) {
      life[i] = Math.max(0, life[i] - dt);
      // Fades by darkening: the particles add light, so black is invisible.
      const fade = (life[i] / LIFE) ** 1.5;
      col[i * 3] = TINT.r * fade;
      col[i * 3 + 1] = TINT.g * fade;
      col[i * 3 + 2] = TINT.b * fade;
      if (life[i] === 0) continue;
      for (let c = 0; c < 3; c++) {
        pos[i * 3 + c] += vel[i * 3 + c] * dt;
        vel[i * 3 + c] *= drag;
      }
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  dispose() {
    this.material.map?.dispose();
    this.material.dispose();
    this.geometry.dispose();
  }
}

/** Dust kicked up where a robot lands or walks home. Bursts come from `puffs` (crowdWalk.ts). */
export default function CrowdDust() {
  const dust = useMemo(() => new DustPool(), []);
  useEffect(() => () => dust.dispose(), [dust]);
  useFrame((_, dt) => dust.step(dt));

  return (
    <points
      geometry={dust.geometry}
      material={dust.material}
      frustumCulled={false}
    />
  );
}
