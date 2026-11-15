"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  BrightnessContrastEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from "postprocessing";
import { type RefObject, useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { caseState } from "@/lib/caseMotion";
import { BEAT, journey } from "@/lib/journey";

import { studioMap } from "./HeroEnvironment";
import { FRONT_LAYER, front } from "./frontShare";

/** From the moment the lens is sharp on the screen until the walk-out starts to blur the room again. */
const LIVE = [BEAT.picture[1], 1.03] as const;
const live = () =>
  journey.current >= LIVE[0] && journey.current < LIVE[1] && !caseState.open;

const camera = new THREE.PerspectiveCamera();
camera.layers.set(FRONT_LAYER);

/** Lights count for this canvas only if they are on its layer too. */
const lights = (scene: THREE.Scene) =>
  scene.traverse(o => {
    if (o instanceof THREE.Light) o.layers.enable(FRONT_LAYER);
  });

/** Draws the crowd of the main scene (and only it) with the main camera, graded like the main canvas, over the programme. */
function Draw({
  shown,
}: Readonly<{ shown: RefObject<HTMLDivElement | null> }>) {
  const { gl, size } = useThree();
  const fx = useRef<{
    pass: RenderPass;
    composer: EffectComposer;
    vignette: VignetteEffect;
    env: THREE.WebGLRenderTarget;
  } | null>(null);
  const on = useRef(false);
  const lost = useRef(false);
  /** Bumped when a lost context comes back: its reflections and render targets are gone, so both are built again. */
  const [epoch, setEpoch] = useState(0);

  // The grade and the reflections are built here, never while the crowd is on screen; the scene is swapped in per frame. They live and die together, so a remount or a restore never reuses a disposed one.
  useEffect(() => {
    const env = studioMap(gl);
    // The warm-up calls this with the room's lights in: this canvas's programs are built then, off the main thread, so showing the crowd never stalls.
    front.compile = () => {
      const { scene, root } = front;
      if (!scene || !root) return;
      lights(scene);
      const was = scene.environment;
      scene.environment = env.texture;
      gl.compileAsync(scene, camera, root).catch(() => {});
      scene.environment = was;
    };
    const pass = new RenderPass(new THREE.Scene(), camera);
    const composer = new EffectComposer(gl, {
      alpha: true,
      multisampling: 2,
      frameBufferType: THREE.HalfFloatType,
    });
    composer.addPass(pass);
    const vignette = new VignetteEffect({ offset: 0.2, darkness: 0.65 });
    composer.addPass(
      new EffectPass(
        camera,
        new BrightnessContrastEffect({ brightness: 0.02, contrast: 0.15 }),
        new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC }),
        vignette
      )
    );
    composer.setSize(size.width, size.height, false);
    fx.current = { pass, composer, vignette, env };
    return () => {
      front.compile = () => {};
      front.carry(false);
      composer.dispose();
      fx.current = null;
      env.dispose();
    };
    // `size` is read once; the effect below keeps it current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, epoch]);

  // A lost context takes the crowd back to the main canvas; a restored one resumes drawing.
  useEffect(() => {
    const el = gl.domElement;
    const lose = (e: Event) => {
      e.preventDefault();
      lost.current = true;
    };
    const back = () => {
      lost.current = false;
      setEpoch(n => n + 1);
    };
    el.addEventListener("webglcontextlost", lose);
    el.addEventListener("webglcontextrestored", back);
    return () => {
      el.removeEventListener("webglcontextlost", lose);
      el.removeEventListener("webglcontextrestored", back);
    };
  }, [gl]);

  useEffect(() => {
    fx.current?.composer.setSize(size.width, size.height, false);
  }, [size]);

  useFrame((_, dt) => {
    const scene = front.scene;
    const main = front.camera;
    const want =
      !lost.current &&
      !!scene &&
      main instanceof THREE.PerspectiveCamera &&
      live();
    if (want !== on.current) {
      on.current = want;
      front.carry(want);
      if (scene && want) lights(scene);
      if (!want) gl.clear();
      shown.current?.setAttribute("data-on", String(want));
    }
    const rig = fx.current;
    if (!want || !rig || !scene || !(main instanceof THREE.PerspectiveCamera))
      return;
    main.matrixWorld.decompose(
      camera.position,
      camera.quaternion,
      camera.scale
    );
    camera.fov = main.fov;
    camera.near = main.near;
    camera.far = main.far;
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    rig.pass.mainScene = scene;
    rig.vignette.offset = front.vignette.offset;
    rig.vignette.darkness = front.vignette.darkness;
    // The reflections the main canvas baked belong to its own context: this one lends its own for the draw.
    const was = scene.environment;
    scene.environment = rig.env.texture;
    rig.composer.render(dt);
    scene.environment = was;
  }, 1);
  return null;
}

/** The crowd of the Projects room on a transparent canvas above the programme, so a robot you hold passes over the text instead of under it. Clicks pass through. */
export default function ProjectsFront() {
  const shown = useRef<HTMLDivElement>(null);
  return (
    <div ref={shown} aria-hidden data-on="false" className="projects-front">
      <Canvas
        flat
        dpr={[1, 1.25]}
        camera={{ fov: 32, position: [0, 6, 7], near: 0.1, far: 80 }}
        gl={{ antialias: false, alpha: true }}
      >
        <Draw shown={shown} />
      </Canvas>
    </div>
  );
}
