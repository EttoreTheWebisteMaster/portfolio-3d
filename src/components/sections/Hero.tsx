"use client";

import Link from "next/link";
import { useRef } from "react";

import HeroScene from "@/components/three/HeroScene";
import { gsap, useGSAP } from "@/lib/gsap";

const stack = [
  "React · Next.js · Three.js · GSAP · TypeScript",
  "Swift · Python · Figma · Generative AI",
];

/** Home hero: gold name, 3D set (ROB-092, light, dust) and the copy on top. */
export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-reveal]", {
          y: 16,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.1,
          delay: 0.2,
        });
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="scene hero">
      <h1 className="sr-only">Ettore Serra, designer and engineer</h1>
      <p aria-hidden className="hero-name">
        Ettore Serra
      </p>

      <HeroScene />

      <div className="hero-copy">
        <h2 data-reveal className="hero-tagline">
          Designer &amp; engineer.
          <br />
          One person.
        </h2>
        <p data-reveal className="hero-body">
          Six years turning ideas into interfaces people remember. Full stack,
          with a designer&apos;s eye: React, Next.js and Three.js, from Turin to
          anywhere.
        </p>
        <div data-reveal className="hero-actions">
          <Link href="/projects" className="btn-primary">
            See the projects
          </Link>
          <Link href="/about" className="btn-secondary">
            Ask the robot
          </Link>
        </div>
      </div>

      <p data-reveal className="hero-billing">
        <span>Design &amp; development</span> <strong>Ettore Serra</strong>{" "}
        <span>with</span> <em>ROB-092</em>
        {stack.map(line => (
          <span key={line} className="hero-billing-line">
            {line}
          </span>
        ))}
      </p>
    </section>
  );
}
