"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { gsap } from "@/lib/gsap";
import { journey } from "@/lib/journey";

/** Client-only, like the main canvas. */
const ContactFront = dynamic(() => import("@/components/three/ContactFront"), {
  ssr: false,
});

/** The visitor has left Projects for About: Contact is next, so its canvas is built now, not while the site loads. */
const FROM = 1.5;

/** Mounted after the Contact page so it draws over it, once the journey is near enough to need it. */
export default function ContactStage() {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const tick = () => {
      if (journey.current < FROM) return;
      gsap.ticker.remove(tick);
      setNear(true);
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);
  return near ? <ContactFront /> : null;
}
