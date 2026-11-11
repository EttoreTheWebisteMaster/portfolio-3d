import * as THREE from "three";

import { dustTexture } from "./HeroLight";

/** A pool of additive soft points: owns its buffers, its geometry and its material. */
export class PointLayer {
  geometry = new THREE.BufferGeometry();
  pos: Float32Array;
  col: Float32Array;
  material: THREE.PointsMaterial;

  constructor(count: number, size: number) {
    this.pos = new Float32Array(count * 3);
    this.col = new Float32Array(count * 3);
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.pos, 3)
    );
    this.geometry.setAttribute("color", new THREE.BufferAttribute(this.col, 3));
    this.material = new THREE.PointsMaterial({
      map: dustTexture(),
      size,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }

  upload() {
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  dispose() {
    this.material.map?.dispose();
    this.material.dispose();
    this.geometry.dispose();
  }
}
