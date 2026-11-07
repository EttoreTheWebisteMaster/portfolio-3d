"use client";

import dynamic from "next/dynamic";

/** Hero 3D set (ROB-092, spot, beam, dust). Client-only, never rendered on the server. */
const HeroScene = dynamic(() => import("./HeroCanvas"), { ssr: false });

export default HeroScene;
