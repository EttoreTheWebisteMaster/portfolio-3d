type Project = {
  title: string;
  /** Facts line, e.g. platform · stack · year. */
  facts: string;
  discipline: string;
  /** Two lines at most. */
  lead: string;
};

/**
 * Projects, in screening order.
 * TODO(content): only Pausa's facts come from the design package. Every other facts / discipline / lead line
 * is a placeholder to replace with the real project before launch.
 */
export const PROJECTS: readonly Project[] = [
  {
    title: "Pausa",
    facts: "macOS menu-bar app · SwiftUI · 2026",
    discipline: "Product",
    lead: "A small menu-bar app for taking breaks. Placeholder copy: replace with the real story.",
  },
  {
    title: "Antonino",
    facts: "Project facts · Stack · Year",
    discipline: "Web",
    lead: "Placeholder copy: one sentence on what it is and why it matters.",
  },
  {
    title: "Chef AI",
    facts: "Project facts · Stack · Year",
    discipline: "AI",
    lead: "Placeholder copy: one sentence on what it is and why it matters.",
  },
  {
    title: "The Morning Ledger",
    facts: "Project facts · Stack · Year",
    discipline: "Editorial",
    lead: "Placeholder copy: one sentence on what it is and why it matters.",
  },
  {
    title: "This portfolio",
    facts: "Next.js · Three.js · GSAP · 2026",
    discipline: "Web",
    lead: "The site you are on: one persistent 3D set, scrolled like a film.",
  },
  {
    title: "Photo Curator",
    facts: "Project facts · Stack · Year",
    discipline: "Tool",
    lead: "Placeholder copy: one sentence on what it is and why it matters.",
  },
  {
    title: "INFN",
    facts: "Project facts · Stack · Year",
    discipline: "Research",
    lead: "Placeholder copy: one sentence on what it is and why it matters.",
  },
  {
    title: "Mr Fruitman",
    facts: "Project facts · Stack · Year",
    discipline: "Brand",
    lead: "Placeholder copy: one sentence on what it is and why it matters.",
  },
  {
    title: "Local Agents",
    facts: "Project facts · Stack · Year",
    discipline: "AI",
    lead: "Placeholder copy: one sentence on what it is and why it matters.",
  },
];

/** Which project the screen is playing. Written by the panel, read by the 3D screen every frame. */
export const view = { index: 0 };

/** Seconds a project plays before the next one starts. */
export const TRAILER_SECONDS = 10;
