"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { onContact } from "./contactShot";
import { PointLayer } from "./pointLayer";

const MOTES = 140;
const BEAM_RADIUS = 3.2;
const MOTE_TINT = new THREE.Color("#cfe3e6").multiplyScalar(0.5);

/** The air under the lamp: dust drifting inside the beam. */
class Air {
  motes = new PointLayer(MOTES, 0.05);
  // Per mote: how far along the beam, where in its cross-section (radius, angle), and how fast it drifts. Seeded on the first frame.
  private seed: { t: number; r: number; a: number; speed: number }[] = [];
  private from = new THREE.Vector3();
  private along = new THREE.Vector3();

  step(dt: number, time: number, lamp: THREE.Vector3, aim: THREE.Vector3) {
    const { motes, from, along } = this;
    if (this.seed.length === 0)
      this.seed = Array.from({ length: MOTES }, () => ({
        t: Math.random(),
        r: Math.sqrt(Math.random()),
        a: Math.random() * Math.PI * 2,
        speed: 0.01 + Math.random() * 0.02,
      }));
    along.copy(aim).sub(lamp);
    this.seed.forEach((m, i) => {
      m.t = (m.t + m.speed * dt) % 1;
      const radius = m.r * BEAM_RADIUS * m.t;
      const angle = m.a + time * 0.15;
      from.copy(lamp).addScaledVector(along, m.t);
      motes.pos[i * 3] = from.x + Math.cos(angle) * radius;
      motes.pos[i * 3 + 1] = from.y + Math.sin(angle) * radius * 0.6;
      motes.pos[i * 3 + 2] = from.z + Math.sin(angle * 1.3) * radius;
      // Faint at the lamp and the floor, brightest mid-beam.
      const fade = Math.sin(Math.PI * m.t) * 0.5;
      motes.col[i * 3] = MOTE_TINT.r * fade;
      motes.col[i * 3 + 1] = MOTE_TINT.g * fade;
      motes.col[i * 3 + 2] = MOTE_TINT.b * fade;
    });
    motes.upload();
  }

  dispose() {
    this.motes.dispose();
  }
}

/**
 * Dust drifting in the beam. `lamp` and `aim` are the beam's two ends in world space.
 */
export default function ContactAir({
  lamp,
  aim,
}: Readonly<{ lamp: THREE.Vector3; aim: THREE.Vector3 }>) {
  const air = useMemo(() => new Air(), []);
  useEffect(() => () => air.dispose(), [air]);
  useFrame(({ clock }, dt) => {
    if (onContact()) air.step(Math.min(dt, 0.05), clock.elapsedTime, lamp, aim);
  });

  return (
    <points
      geometry={air.motes.geometry}
      material={air.motes.material}
      frustumCulled={false}
    />
  );
}
