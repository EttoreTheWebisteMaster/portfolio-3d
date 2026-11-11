"use client";

import dynamic from "next/dynamic";

/** Client-only, like the main canvas. */
const ContactFront = dynamic(() => import("@/components/three/ContactFront"), {
  ssr: false,
});

/** Mounted after the Contact page so it draws over it. */
export default function ContactStage() {
  return <ContactFront />;
}
