"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

import { report } from "@/lib/loading";

/** A stuck compile or a hidden tab must never hold the loader: each step gives up after this long. */
const STEP_TIMEOUT_MS = 4000;

const within = <T,>(work: Promise<T>) =>
  Promise.race([
    work,
    new Promise<void>(done => setTimeout(done, STEP_TIMEOUT_MS)),
  ]);

/** True while the warm-up draws the cinema, so its lights and meshes are in the scene and get compiled and uploaded too. */
export const warm = { on: false };

/**
 * Compiles every shader off the main thread, then draws two frames, before the loader may finish.
 * It does it twice: as Home is (the cinema's lights are off) and with the cinema in, because switching
 * between the two changes every lit material's program. Both are then cached, and the move to Projects
 * starts with a plain draw, not a stall.
 */
export default function Warmup() {
  const { gl, scene, camera, invalidate } = useThree();
  useEffect(() => {
    let live = true;
    const frames = (n: number) =>
      new Promise<void>(done => {
        // A hidden tab pauses rAF: the timer lets the warm-up finish anyway.
        const fallback = setTimeout(done, 250);
        requestAnimationFrame(() => {
          clearTimeout(fallback);
          // The canvas idles while the loader is up: draw these by hand, so uploads happen while the sweep is held.
          invalidate();
          if (n > 1) void frames(n - 1).then(done);
          else done();
        });
      });
    void (async () => {
      try {
        await within(gl.compileAsync(scene, camera));
        report("warm", 0.4);
        if (!live) return;
        warm.on = true;
        await frames(2);
        report("warm", 0.6);
        await within(gl.compileAsync(scene, camera));
        report("warm", 0.9);
        await frames(2);
      } catch {
        // A failed warm-up only costs the stall it was there to prevent.
      } finally {
        warm.on = false;
      }
      if (!live) return;
      report("warm", 1);
      await frames(2);
      if (live) report("frame", 1);
    })();
    return () => {
      live = false;
      warm.on = false;
    };
  }, [gl, scene, camera, invalidate]);
  return null;
}
