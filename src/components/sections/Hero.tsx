"use client";

import { useRef } from "react";

import Scene from "@/components/three/Scene";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import { gsap, useGSAP } from "@/lib/gsap";

const links = [
  { href: "#work", label: "Work" },
  { href: "#about", label: "About" },
];

/** Reference section: composes primitives, animates with GSAP, embeds an R3F scene. */
export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-reveal]", { y: 24, opacity: 0, stagger: 0.08 });
      });
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      className="mx-auto grid min-h-dvh max-w-6xl items-center gap-10 px-6 md:grid-cols-2"
    >
      <div className="flex flex-col gap-6">
        <p data-reveal className="eyebrow">
          Starter
        </p>
        <h1 data-reveal>Made by Ettore</h1>
        <div data-reveal className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="ghost" size="sm">
            Ghost
          </Button>
          <Dropdown label="Menu" items={links} />
        </div>
      </div>
      <div className="card">
        <Scene />
      </div>
    </section>
  );
}
