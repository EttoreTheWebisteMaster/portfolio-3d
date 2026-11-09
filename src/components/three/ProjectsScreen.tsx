"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

import {
  BEAT,
  CAM_END,
  ease,
  type Progress,
  SCREEN_DIST,
  seg,
} from "@/lib/journey";

import { dustTexture } from "./HeroLight";

/** Cold-white, slightly cyan: a projected picture, not a neon sign. */
const SCREEN_LIGHT = "#b4dbe6";

/** Screen frame on the page grid: columns 1–6, 680px wide, 16:9, top 112px. */
const FRAME = { x: 64, y: 112, w: 680 };
const HALF_FOV = THREE.MathUtils.degToRad(34) / 2;

/** Placeholder picture: a colour wheel on warm dark, so the screen lights the room with colour. */
function pictureTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 288;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const bg = ctx.createRadialGradient(150, 60, 0, 150, 60, 420);
    bg.addColorStop(0, "#4a3a2c");
    bg.addColorStop(1, "#0f0b08");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 288);
    const hues = [
      "#f4ecdc",
      "#d83a32",
      "#f29a26",
      "#f4c542",
      "#e88e75",
      "#f4ecdc",
    ];
    hues.forEach((hue, i) => {
      ctx.beginPath();
      ctx.moveTo(256, 300);
      ctx.arc(
        256,
        300,
        270,
        Math.PI + (i * Math.PI) / hues.length,
        Math.PI + ((i + 1) * Math.PI) / hues.length
      );
      ctx.fillStyle = hue;
      ctx.fill();
    });
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Flat front-on screen, pinned to its grid frame when the camera lands.
 * Off, then a hot line drawn across, then it opens into the picture.
 * Lit like a cinema: a large soft area light the size of the screen (soft shadows, long floor sheen),
 * plus an anamorphic streak across the lens. No flat glow sprites.
 */
export default function ProjectsScreen({
  progress,
  reduced,
}: Readonly<{ progress: Progress; reduced: boolean }>) {
  const mesh = useRef<THREE.Mesh>(null);
  const streak = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const streakMat = useRef<THREE.MeshBasicMaterial>(null);
  const light = useRef<THREE.RectAreaLight>(null);
  const picture = useMemo(() => pictureTexture(), []);
  const glow = useMemo(() => dustTexture(), []);
  useMemo(() => RectAreaLightUniformsLib.init(), []);

  useFrame(({ size, clock }) => {
    const draw = ease(seg(progress.current, BEAT.line));
    const open = ease(seg(progress.current, BEAT.picture));
    const halfH = Math.tan(HALF_FOV) * SCREEN_DIST;
    const halfW = (halfH * size.width) / size.height;
    const w = (FRAME.w / size.width) * 2 * halfW;
    const h = (w * 9) / 16;
    const x =
      CAM_END[0] + (((FRAME.x + FRAME.w / 2) / size.width) * 2 - 1) * halfW;
    const cy = FRAME.y + (FRAME.w * 9) / 32;
    const y = CAM_END[1] + (1 - (cy / size.height) * 2) * halfH;
    const z = CAM_END[2] - SCREEN_DIST;
    // The projector's slight unsteadiness, once the picture is up.
    const t = clock.elapsedTime;
    const flicker = reduced
      ? 1
      : 1 + open * (0.03 * Math.sin(t * 41) + 0.02 * Math.sin(t * 17.3));

    if (mesh.current) {
      mesh.current.position.set(x, y, z);
      mesh.current.scale.set(w * draw, Math.max(0.006 * w, h * open), 1);
      mesh.current.visible = draw > 0;
    }
    // Hot enough to bloom as a line, then settles to the picture's own light.
    if (mat.current)
      mat.current.color.setScalar(
        THREE.MathUtils.lerp(2, 0.85, open) * flicker
      );
    // Horizontal lens streak: hottest while the line draws, a faint kiss once the picture is up.
    if (streak.current) {
      streak.current.position.set(x, y, z + 0.05);
      streak.current.scale.set(w * (1.2 + 1.6 * draw), h * 0.07, 1);
    }
    if (streakMat.current)
      streakMat.current.opacity =
        (0.03 + 0.3 * draw * (1 - open)) * (draw > 0 ? 1 : 0) * flicker;
    // The key of the cinema: a screen-sized panel facing the audience.
    if (light.current) {
      light.current.position.set(x, y, z + 0.3);
      light.current.width = w * 1.05;
      light.current.height = h * 1.05;
      light.current.lookAt(x, y - 2, z + 14);
      light.current.intensity = (2 * draw * (1 - open) + 9 * open) * flicker;
    }
  });

  return (
    <>
      <mesh ref={mesh} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial ref={mat} map={picture} toneMapped={false} />
      </mesh>
      <mesh ref={streak}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={streakMat}
          map={glow}
          color={SCREEN_LIGHT}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <rectAreaLight ref={light} color={SCREEN_LIGHT} intensity={0} />
    </>
  );
}
