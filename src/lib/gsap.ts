"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Observer } from "gsap/Observer";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { SplitText } from "gsap/SplitText";

// Register once. Import gsap/plugins only from here.
gsap.registerPlugin(
  useGSAP,
  Observer,
  ScrollToPlugin,
  SplitText,
  ScrambleTextPlugin
);
gsap.defaults({ duration: 0.8, ease: "power3.out" });

export { gsap, Observer, SplitText, useGSAP };
