"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

import {
  BEAT,
  CAM_END,
  ease,
  journey,
  type Progress,
  SCREEN_DIST,
  SCREEN_FOV,
  seg,
} from "@/lib/journey";

import { caseState } from "@/lib/caseStudy";
import { onEnter } from "@/lib/loading";
import { TRAILER_SRC, view } from "@/lib/projects";
import { isMuted, subscribeMuted } from "@/lib/sound";

import { dustTexture } from "./HeroLight";
import { warm } from "./Warmup";
import { cinemaFade } from "./walkPose";

/** Cold-white, slightly cyan: a projected picture, not a neon sign. */
const SCREEN_LIGHT = "#b4dbe6";

const HALF_FOV = THREE.MathUtils.degToRad(SCREEN_FOV) / 2;

/** The trailer: one muted, inline video shared with the panel, which reads its clock for the Next timer. */
function trailer() {
  const video = document.createElement("video");
  video.src = TRAILER_SRC;
  video.muted = true;
  video.playsInline = true;
  // Held back until the visitor is in, so the 9 MB film never competes with the robot the loader waits for.
  video.preload = "none";
  video.loop = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tex = new THREE.VideoTexture(video);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { video, tex };
}

/** The trailer's sound follows the page's mute switch. Returns the unsubscribe. */
function followMute(video: HTMLVideoElement) {
  const sync = () => {
    video.muted = isMuted();
  };
  sync();
  const off = subscribeMuted(sync);
  // Sound is blocked until the visitor does something: the trailer may have started silent, so the first gesture hands the page's setting back.
  window.addEventListener("pointerdown", sync, { once: true });
  window.addEventListener("keydown", sync, { once: true });
  return () => {
    off();
    window.removeEventListener("pointerdown", sync);
    window.removeEventListener("keydown", sync);
  };
}

/** Corner radius as a share of the screen's height: soft, Apple-display proportions. */
const CORNER = 0.04;
/** How far the middle recedes behind the edges, as a share of the width: a gentle curved monitor. */
const SAG = 0.04;

/**
 * A unit plane bent into a shallow horizontal arc. The edges stay on the frame's plane (so the picture
 * still lands on its grid box) and the middle recedes. Vertices only move; the video is sampled as before, so it stays sharp.
 */
function curvedPlane() {
  const geo = new THREE.PlaneGeometry(1, 1, 64, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) * 2;
    pos.setZ(i, -(1 - u * u) * SAG);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Rounded corners drawn in the fragment shader: a signed-distance edge, anti-aliased by its own screen-space slope. */
function roundCorners(shader: {
  uniforms: Record<string, THREE.IUniform>;
  fragmentShader: string;
}) {
  shader.uniforms.uSize = corners.size;
  shader.uniforms.uRadius = corners.radius;
  shader.fragmentShader = shader.fragmentShader
    .replace(
      "void main() {",
      "uniform vec2 uSize;\nuniform float uRadius;\nvoid main() {"
    )
    .replace(
      "#include <dithering_fragment>",
      `vec2 q = abs((vMapUv - 0.5) * uSize) - uSize * 0.5 + uRadius;
      float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
      gl_FragColor.a *= clamp(0.5 - d / max(fwidth(d), 1e-5), 0.0, 1.0);
      #include <dithering_fragment>`
    );
}
const corners = {
  size: { value: new THREE.Vector2(1, 1) },
  radius: { value: 0 },
};

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
  const gl = useThree(state => state.gl);
  const { video, tex: picture } = useMemo(() => trailer(), []);
  const arc = useMemo(() => curvedPlane(), []);
  const shown = useRef(0);
  const glow = useMemo(() => dustTexture(), []);
  useMemo(() => RectAreaLightUniformsLib.init(), []);

  // Strict Mode runs this twice on the same memoised video, so cleanup only lets go of it; it never unloads it.
  useEffect(() => {
    view.video = video;
    const unsub = followMute(video);
    const stop = onEnter(() => {
      video.preload = "auto";
      video.load();
    });
    // Put the first frame on the GPU early, so the trailer starting to roll is not the moment it is uploaded.
    const upload = () => gl.initTexture(picture);
    video.addEventListener("loadeddata", upload, { once: true });
    return () => {
      stop();
      unsub();
      video.removeEventListener("loadeddata", upload);
      video.pause();
      view.video = null;
    };
  }, [video, gl, picture]);

  useFrame(({ size, clock }) => {
    const video = view.video;
    // The panel picked another trailer: start it from the top.
    if (shown.current !== view.index) {
      shown.current = view.index;
      if (video) video.currentTime = 0;
    }
    const draw = ease(seg(progress.current, BEAT.line));
    const open = ease(seg(progress.current, BEAT.picture));
    // The trailer rolls once the picture is opening, and rewinds when we leave.
    if (video) {
      // Past Projects (About, Contact) the picture is gone, so the trailer stops and rewinds with it.
      const here = journey.current < 1.5;
      if (open > 0.05 && here) {
        // The dive has reached the screen (and until the camera is back out): the trailer holds its frame, then rolls on from it.
        if (caseState.held) {
          if (!video.paused) video.pause();
        } else if (video.paused && !video.ended)
          void video.play().catch(() => {
            // Sound needs a prior gesture: fall back to a silent start rather than no picture.
            video.muted = true;
            void video.play().catch(() => {});
          });
      } else if (!video.paused || video.currentTime > 0) {
        video.pause();
        video.currentTime = 0;
      }
    }
    const frame = view.frame;
    const halfH = Math.tan(HALF_FOV) * SCREEN_DIST;
    const halfW = (halfH * size.width) / size.height;
    const w = (frame.w / size.width) * 2 * halfW;
    const h = (w * 9) / 16;
    const x =
      CAM_END[0] + (((frame.x + frame.w / 2) / size.width) * 2 - 1) * halfW;
    const cy = frame.y + (frame.w * 9) / 32;
    const y = CAM_END[1] + (1 - (cy / size.height) * 2) * halfH;
    const z = CAM_END[2] - SCREEN_DIST;
    Object.assign(view.screen, { x, y, z, w, h });
    // The projector's slight unsteadiness, once the picture is up.
    const t = clock.elapsedTime;
    const flicker = reduced
      ? 1
      : 1 + open * (0.004 * Math.sin(t * 41) + 0.003 * Math.sin(t * 17.3));

    if (mesh.current) {
      mesh.current.position.set(x, y, z);
      const sh = Math.max(0.006 * w, h * open);
      // Depth scales with width so the arc keeps its proportion at any size.
      mesh.current.scale.set(w * draw, sh, w);
      corners.size.value.set(w * draw, sh);
      corners.radius.value = Math.min(CORNER * h, sh / 2, (w * draw) / 2);
      mesh.current.visible = draw > 0 || warm.on;
    }
    // Hot enough to bloom as a line, then settles to the picture's own light.
    if (mat.current)
      mat.current.color.setScalar(
        THREE.MathUtils.lerp(2, 1, open) * cinemaFade()
      );
    // Horizontal lens streak: hottest while the line draws, gone once the picture is up.
    if (streak.current) {
      streak.current.position.set(x, y, z + 0.05);
      streak.current.scale.set(w * (1.2 + 1.6 * draw), h * 0.07, 1);
    }
    if (streakMat.current)
      streakMat.current.opacity = 0.03 * draw * (1 - open) * cinemaFade();
    // The key of the cinema: a screen-sized panel facing the audience.
    if (light.current) {
      light.current.position.set(x, y, z + 0.3);
      light.current.width = w * 1.5;
      light.current.height = h * 1.5;
      light.current.lookAt(x, y - 2, z + 14);
      light.current.intensity =
        (0.4 * draw * (1 - open) + 0.85 * open) * flicker * cinemaFade();
    }
  });

  return (
    <>
      <mesh ref={mesh} visible={false} geometry={arc}>
        <meshBasicMaterial
          ref={mat}
          map={picture}
          toneMapped={false}
          transparent
          onBeforeCompile={roundCorners}
        />
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
