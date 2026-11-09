"use client";

import dynamic from "next/dynamic";

/** Hero 3D set (ROB-092, spot, beam, dust). Client-only, never rendered on the server. */
const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

/** Mounts straight away: its heavy setup (shaders, shadows, reflections) lands while the loader holds at 0%, and the countdown only plays once the first frame is drawn, so it never stutters. */
export default function HeroScene() {
  return <HeroCanvas />;
}
