"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register once. Import gsap/plugins only from here.
gsap.registerPlugin(useGSAP, ScrollTrigger);
gsap.defaults({ duration: 0.8, ease: "power3.out" });

// Export ScrollTrigger here too once a component needs ScrollTrigger.refresh() etc.
export { gsap, useGSAP };
