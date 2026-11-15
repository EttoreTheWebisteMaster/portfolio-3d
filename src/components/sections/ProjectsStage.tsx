"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

/** Client-only, like the main canvas. */
const load = () => import("@/components/three/ProjectsFront");
const ProjectsFront = dynamic(load, { ssr: false });

const DESKTOP = "(min-width: 1024px) and (hover: hover) and (pointer: fine)";
// Fetched with the page, not on first mount: the loader's warm-up compiles this canvas's shaders, so it must exist by then.
if (typeof window !== "undefined" && window.matchMedia(DESKTOP).matches) {
  load().catch(() => {});
}
const subscribe = (cb: () => void) => {
  const q = window.matchMedia(DESKTOP);
  q.addEventListener("change", cb);
  return () => q.removeEventListener("change", cb);
};

/** Desktop only: the crowd is drawn over the programme by a second canvas. Phones and tablets keep it behind. */
export default function ProjectsStage() {
  const desktop = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP).matches,
    () => false
  );
  return desktop ? <ProjectsFront /> : null;
}
