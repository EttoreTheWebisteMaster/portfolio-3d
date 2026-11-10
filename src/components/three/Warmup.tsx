"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

import { report } from "@/lib/loading";

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
      new Promise<void>(done =>
        requestAnimationFrame(() => {
          // The canvas idles while the loader is up: draw these by hand, so uploads happen while the sweep is held.
          invalidate();
          if (n > 1) void frames(n - 1).then(done);
          else done();
        })
      );
    void (async () => {
      try {
        await gl.compileAsync(scene, camera);
        if (!live) return;
        warm.on = true;
        await frames(2);
        await gl.compileAsync(scene, camera);
        await frames(2);
      } catch {
        // A failed warm-up only costs the stall it was there to prevent.
      } finally {
        warm.on = false;
      }
      if (!live) return;
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
