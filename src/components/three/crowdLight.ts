import * as THREE from "three";

import { BEAT, ease, seg } from "@/lib/journey";
import { view } from "@/lib/projects";

import type { Walker } from "./crowdWalk";

/** The projector's lens, and the light of its beam: a cold white, close to neutral. */
export const PROJECTOR = new THREE.Vector3(0, 10, 18);
export const SCREEN_LIGHT = new THREE.Color("#b4dbe6");
/** How wide the beam is at the screen, in screen half-diagonals (the middle of the beam's soft cones). */
const REACH = 1.3;
/** How much of the screen's rim light everyone in front of it gets, and how fast the light follows. */
const AMBIENT = 0.3;
const FOLLOW = 4;
/** The rim light's colour strength, and how tightly it hugs the edges. */
const RIM = 0.3;
const EDGE = 2.2;

/**
 * Lights a robot the way a screen behind it would: a soft cool rim along the edges that face away from the camera's view
 * of it, strongest at the silhouette. `userData.rim.value` (0..1) is how much; it is per robot, the program is shared.
 */
export function rimLit(material: THREE.MeshPhysicalMaterial) {
  const rim = { value: 0 };
  material.userData.rim = rim;
  material.onBeforeCompile = shader => {
    shader.uniforms.uRim = rim;
    shader.uniforms.uRimColor = { value: SCREEN_LIGHT };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "void main() {",
        "uniform float uRim;\nuniform vec3 uRimColor;\nvoid main() {"
      )
      .replace(
        "#include <opaque_fragment>",
        `float rimEdge = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), ${EDGE.toFixed(1)});
        outgoingLight += uRimColor * rimEdge * uRim * ${RIM.toFixed(2)};
        #include <opaque_fragment>`
      );
  };
  material.customProgramCacheKey = () => "crowd-rim";
}
/** Just in front of the picture: where a robot's shadow is drawn. */
const LIFT = 0.05;

const body = new THREE.Vector3();
const axis = new THREE.Vector3();
const rel = new THREE.Vector3();

/**
 * A robot that gets in the projector's beam catches its light (a cold glow on the paint) and throws its shadow
 * on the picture, exactly where the beam would put it. On the floor, below the beam, nothing happens.
 */
export function lightFrom(w: Walker, p: number, dt: number) {
  const open = ease(seg(p, BEAT.picture));
  const { x, y, z, w: sw, h: sh } = view.screen;
  body
    .set(0, 1.6 * w.base, 0)
    .applyQuaternion(w.robot.quaternion)
    .add(w.robot.position);

  // Inside the cone from the lens to the picture, and how deep in it.
  axis.set(x, y, z).sub(PROJECTOR);
  const length = axis.length();
  axis.divideScalar(length);
  rel.copy(body).sub(PROJECTOR);
  const along = rel.dot(axis);
  const off = rel.addScaledVector(axis, -along).length();
  const radius =
    REACH * Math.hypot(sw, sh) * 0.5 * Math.max(along / length, 0.01);
  const inside = along > 0 && along < length ? 1 - off / radius : 0;
  const deep = THREE.MathUtils.smoothstep(inside, 0, 1);
  const target = open * (AMBIENT + (1 - AMBIENT) * deep);
  w.lit += (target - w.lit) * (1 - Math.exp(-FOLLOW * dt));
  for (const skin of w.skin) skin.userData.rim.value = w.lit;

  // Its shadow on the picture: the line from the lens through the robot, cut by the screen's plane.
  const t = (z + LIFT - PROJECTOR.z) / (body.z - PROJECTOR.z);
  const sx = PROJECTOR.x + t * (body.x - PROJECTOR.x);
  const sy = PROJECTOR.y + t * (body.y - PROJECTOR.y);
  const size = 3.2 * w.base * t;
  const over =
    body.z > z + 0.1 &&
    open > 0.05 &&
    Math.abs(sx - x) < sw / 2 + size * 0.3 &&
    Math.abs(sy - y) < sh / 2 + size * 0.5;
  w.cast.visible = over;
  if (over) {
    w.cast.position.set(sx, sy, z + LIFT);
    w.cast.scale.set(size * 0.5, size, 1);
    w.cast.rotation.z = -w.sw.x * 0.8;
  }
}

/** Shadows on the picture are as dark as the picture is open. */
export function fadeCast(material: THREE.Material, p: number) {
  material.opacity = 0.7 * ease(seg(p, BEAT.picture));
}

/** The pools under their feet belong to the floor: they surface and go with it, never hanging on the bare dark. */
export function fadePools(material: THREE.Material, p: number) {
  material.opacity = ease(seg(p, BEAT.floor));
}
