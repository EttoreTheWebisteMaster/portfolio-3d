import * as THREE from "three";

const aim = new THREE.Vector2();
const ray = new THREE.Raycaster();
const local = new THREE.Ray();
const inverse = new THREE.Matrix4();

export type Bounds = THREE.Box3;

/** Adds a yaw/pitch offset to the head bone, on top of whatever the mixer just posed. */
export function turnHead(bone: THREE.Object3D, yaw: number, pitch: number) {
  bone.rotation.y += yaw;
  bone.rotation.x += pitch;
}

/** Sets the "Surprised" (brows up) and "Sad" (inner ends up: a soft, kind look) expressions on every face mesh. */
export function setBrows(faces: THREE.Mesh[], surprised: number, kind: number) {
  for (const face of faces) {
    const dict = face.morphTargetDictionary;
    const infl = face.morphTargetInfluences;
    if (!dict || !infl) continue;
    if (dict.Surprised !== undefined) infl[dict.Surprised] = surprised;
    if (dict.Sad !== undefined) infl[dict.Sad] = kind;
    if (dict.Angry !== undefined) infl[dict.Angry] = 0;
  }
}

/** The robot's box in the space of `group` (narrowed, so outstretched arms do not count as "on him"). */
export function robotBounds(
  scene: THREE.Object3D,
  group: THREE.Object3D
): Bounds {
  const box = new THREE.Box3().setFromObject(scene);
  box.min.sub(group.position);
  box.max.sub(group.position);
  const c = box.getCenter(new THREE.Vector3());
  box.min.x = c.x + (box.min.x - c.x) * 0.55;
  box.max.x = c.x + (box.max.x - c.x) * 0.55;
  return box;
}

/** Is the cursor (-1..1, y down) on the robot? */
export function cursorOnRobot(
  x: number,
  y: number,
  camera: THREE.Camera,
  group: THREE.Object3D,
  box: Bounds
) {
  aim.set(x, -y);
  ray.setFromCamera(aim, camera);
  group.updateWorldMatrix(true, false);
  local.copy(ray.ray).applyMatrix4(inverse.copy(group.matrixWorld).invert());
  return local.intersectsBox(box);
}

export type Mood = [surprised: number, kind: number];

/** His faces as [surprised, kind] blends. They sit close together so every change reads as a feeling, not a jump. */
export const REST: Mood = [0.2, 0.2];
const SMILE: Mood = [0.3, 0.1];
const SURPRISE: Mood = [0.85, 0];

/** Eases `mood` toward the face he should wear now; surprise lands fast, the rest settles slowly. */
export function stepMood(
  mood: Mood,
  hovering: boolean,
  waving: boolean,
  time: number,
  dt: number
) {
  const [s, k] = hovering ? SURPRISE : waving ? SMILE : REST;
  const rate = hovering ? 14 : 3.5;
  // A slow breath in the brows keeps the rest from feeling frozen.
  const alive = hovering || waving ? 0 : 0.04 * Math.sin(time * 0.8);
  mood[0] = THREE.MathUtils.damp(mood[0], s + alive, rate, dt);
  mood[1] = THREE.MathUtils.damp(mood[1], k, rate, dt);
}
