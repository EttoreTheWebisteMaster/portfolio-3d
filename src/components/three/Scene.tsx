"use client";

import dynamic from "next/dynamic";

/** Load R3F canvases through this wrapper so three.js never runs on the server. */
const Scene = dynamic(() => import("./SceneCanvas"), {
  ssr: false,
  loading: () => <div className="aspect-video w-full" aria-hidden />,
});

export default Scene;
