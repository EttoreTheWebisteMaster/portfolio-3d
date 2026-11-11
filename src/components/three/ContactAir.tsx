"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { beamPulse } from "@/lib/contact";

import { landings, onContact } from "./contactShot";
import { PointLayer } from "./pointLayer";

const SPARKS = 96;
const SPARK_LIFE = 0.3;
const SPARK_GRAVITY = 9;
const MOTES = 140;
const BEAM_RADIUS = 3.2;
const PUFFS = 64;
const PUFF_LIFE = 1.4;
const PUFF_TINT = new THREE.Color("#8fa0a5").multiplyScalar(0.3);
const SPARK_TINT = new THREE.Color("#ffb347");
const MOTE_TINT = new THREE.Color("#cfe3e6").multiplyScalar(0.5);

/** The air under the lamp: dust drifting inside the beam, and the sparks of a robot landing in it. */
class Air {
  motes = new PointLayer(MOTES, 0.05);
  sparks = new PointLayer(SPARKS, 0.08);
  puffs = new PointLayer(PUFFS, 0.4);
  private puffVel = new Float32Array(PUFFS * 3);
  private puffLife = new Float32Array(PUFFS);
  private puffNext = 0;
  // Per mote: how far along the beam, where in its cross-section (radius, angle), and how fast it drifts. Seeded on the first frame.
  private seed: { t: number; r: number; a: number; speed: number }[] = [];
  private vel = new Float32Array(SPARKS * 3);
  private life = new Float32Array(SPARKS);
  private next = 0;
  private from = new THREE.Vector3();
  private along = new THREE.Vector3();

  step(dt: number, time: number, lamp: THREE.Vector3, aim: THREE.Vector3) {
    const { motes, sparks, puffs, vel, life, from, along } = this;
    if (this.seed.length === 0)
      this.seed = Array.from({ length: MOTES }, () => ({
        t: Math.random(),
        r: Math.sqrt(Math.random()),
        a: Math.random() * Math.PI * 2,
        speed: 0.01 + Math.random() * 0.02,
      }));
    along.copy(aim).sub(lamp);
    const glow = 0.5 + 0.5 * beamPulse();
    this.seed.forEach((m, i) => {
      m.t = (m.t + m.speed * dt) % 1;
      const radius = m.r * BEAM_RADIUS * m.t;
      const angle = m.a + time * 0.15;
      from.copy(lamp).addScaledVector(along, m.t);
      motes.pos[i * 3] = from.x + Math.cos(angle) * radius;
      motes.pos[i * 3 + 1] = from.y + Math.sin(angle) * radius * 0.6;
      motes.pos[i * 3 + 2] = from.z + Math.sin(angle * 1.3) * radius;
      // Faint at the lamp and the floor, brightest mid-beam.
      const fade = Math.sin(Math.PI * m.t) * glow;
      motes.col[i * 3] = MOTE_TINT.r * fade;
      motes.col[i * 3 + 1] = MOTE_TINT.g * fade;
      motes.col[i * 3 + 2] = MOTE_TINT.b * fade;
    });
    motes.upload();

    for (const hit of landings.splice(0)) {
      for (let k = 0; k < 8; k++) {
        const i = this.puffNext;
        this.puffNext = (this.puffNext + 1) % PUFFS;
        const a = Math.random() * Math.PI * 2;
        const out = 0.3 + Math.random() * 0.9;
        puffs.pos[i * 3] = hit.x + Math.cos(a) * 0.25;
        puffs.pos[i * 3 + 1] = 0.12;
        puffs.pos[i * 3 + 2] = hit.z + Math.sin(a) * 0.25;
        this.puffVel[i * 3] = Math.cos(a) * out;
        this.puffVel[i * 3 + 1] = 0.15 + Math.random() * 0.4;
        this.puffVel[i * 3 + 2] = Math.sin(a) * out;
        this.puffLife[i] = PUFF_LIFE * (0.7 + Math.random() * 0.3);
      }
      if (!hit.lit) continue;
      for (let k = 0; k < 14 * hit.power; k++) {
        const i = this.next;
        this.next = (this.next + 1) % SPARKS;
        const a = Math.random() * Math.PI * 2;
        const out = (0.6 + Math.random() * 1.6) * (0.6 + 0.4 * hit.power);
        sparks.pos[i * 3] = hit.x;
        sparks.pos[i * 3 + 1] = hit.y;
        sparks.pos[i * 3 + 2] = hit.z;
        vel[i * 3] = Math.cos(a) * out;
        vel[i * 3 + 1] = 1.2 + Math.random() * 2.2;
        vel[i * 3 + 2] = Math.sin(a) * out;
        life[i] = SPARK_LIFE * (0.6 + Math.random() * 0.4);
      }
    }
    for (let i = 0; i < SPARKS; i++) {
      life[i] = Math.max(0, life[i] - dt);
      // Fades by darkening: the points add light, so black is invisible.
      const fade = life[i] / SPARK_LIFE;
      sparks.col[i * 3] = SPARK_TINT.r * fade;
      sparks.col[i * 3 + 1] = SPARK_TINT.g * fade;
      sparks.col[i * 3 + 2] = SPARK_TINT.b * fade;
      if (life[i] === 0) continue;
      vel[i * 3 + 1] -= SPARK_GRAVITY * dt;
      for (let c = 0; c < 3; c++) sparks.pos[i * 3 + c] += vel[i * 3 + c] * dt;
    }
    sparks.upload();

    const drag = Math.exp(-2 * dt);
    for (let i = 0; i < PUFFS; i++) {
      this.puffLife[i] = Math.max(0, this.puffLife[i] - dt);
      // Fades by darkening, like the sparks.
      const fade = (this.puffLife[i] / PUFF_LIFE) ** 1.5;
      puffs.col[i * 3] = PUFF_TINT.r * fade;
      puffs.col[i * 3 + 1] = PUFF_TINT.g * fade;
      puffs.col[i * 3 + 2] = PUFF_TINT.b * fade;
      if (this.puffLife[i] === 0) continue;
      for (let c = 0; c < 3; c++) {
        puffs.pos[i * 3 + c] += this.puffVel[i * 3 + c] * dt;
        this.puffVel[i * 3 + c] *= drag;
      }
    }
    puffs.upload();
  }

  dispose() {
    this.motes.dispose();
    this.sparks.dispose();
    this.puffs.dispose();
  }
}

/**
 * Dust drifting in the beam, and the sparks of a robot landing in it (the only warm colour on the page).
 * `lamp` and `aim` are the beam's two ends in world space; landings come from `landings` (contactShot.ts).
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
    <>
      <points
        geometry={air.motes.geometry}
        material={air.motes.material}
        frustumCulled={false}
      />
      <points
        geometry={air.puffs.geometry}
        material={air.puffs.material}
        frustumCulled={false}
      />
      <points
        geometry={air.sparks.geometry}
        material={air.sparks.material}
        frustumCulled={false}
      />
    </>
  );
}
