"use client";

import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import Crowd, { stage } from "./contactRobots";
import { onContact } from "./contactShot";

/** The falling robots. The pool and its physics live in contactRobots.ts; this only steps it while the camera is on Contact. */
export default function ContactCrowd({ url }: Readonly<{ url: string }>) {
  const gltf = useLoader(GLTFLoader, url);
  const crowd = useMemo(() => new Crowd(gltf), [gltf]);
  const reduced = useRef(false);
  const { gl, scene, camera } = useThree();
  // Draw the pool once, shown, so its shaders are compiled before the first fall instead of at it.
  useEffect(() => {
    stage.crowd = crowd;
    stage.near = crowd.group.parent;
    return () => {
      stage.crowd = null;
      stage.near = null;
    };
  }, [crowd]);
  useEffect(() => {
    void crowd.prime(() => gl.compileAsync(scene, camera));
  }, [crowd, gl, scene, camera]);
  useEffect(() => {
    reduced.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }, []);
  useFrame(({ clock, size }, dt) => {
    if (!onContact()) {
      crowd.leave();
      return;
    }
    crowd.step(
      Math.min(dt, 0.05),
      clock.elapsedTime,
      size.width,
      size.height,
      reduced.current
    );
  });
  return <primitive object={crowd.group} />;
}
