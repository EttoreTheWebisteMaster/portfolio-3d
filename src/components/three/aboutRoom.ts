import * as THREE from "three";

import { FLOOR_Y } from "./HeroLight";

/** The cream sweep: a floor that curves up into the back wall with no line between. */
/** The sweep floats just above the cinema floor it overlaps, so the two never fight for the same pixels. */
const LIFT = 0.03;
export const SWEEP = {
  from: -8,
  to: 56,
  front: 70,
  back: -9,
  radius: 6,
  top: 18,
};
/** A profile (z, y) swept along x: the floor, a quarter-round cove, then the wall. */
export function sweepGeometry() {
  const { from, to, front, back, radius, top } = SWEEP;
  const profile: [number, number][] = [[front, FLOOR_Y + LIFT]];
  const arc = 24;
  for (let i = 0; i <= arc; i++) {
    const t = (i / arc) * (Math.PI / 2);
    profile.push([
      back - radius * Math.sin(t),
      FLOOR_Y + LIFT + radius * (1 - Math.cos(t)),
    ]);
  }
  profile.push([back - radius, FLOOR_Y + LIFT + top]);
  const positions: number[] = [];
  const index: number[] = [];
  profile.forEach(([z, y], i) => {
    positions.push(from, y, z, to, y, z);
    if (i > 0) {
      const a = (i - 1) * 2;
      index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}

/** A round texture that fades from its centre to nothing at the edge: one colour stop per [offset, rgba]. */
export function radialDisc(stops: readonly (readonly [number, string])[]) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    for (const [at, colour] of stops) g.addColorStop(at, colour);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(canvas);
}

/** A soft dark blob under his feet. */
export function blobTexture() {
  return radialDisc([
    [0, "rgba(40,30,20,0.75)"],
    [0.55, "rgba(40,30,20,0.28)"],
    [1, "rgba(40,30,20,0)"],
  ]);
}
