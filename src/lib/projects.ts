type Project = {
  title: string;
  /** Facts line, e.g. platform · stack · year. */
  facts: string;
  discipline: string;
  /** Hover thumbnail in /public. Rows without one show the felt card. */
  image?: string;
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
    image: "/projects/pausa.jpg",
    lead: "Rest makes you better. A menu-bar app that turns the break into a small event.",
  },
  {
    title: "Antonino",
    facts: "Project facts · Stack · Year",
    discipline: "Voice · AI",
    lead: "Placeholder copy: one sentence on what it is and why it matters.",
  },
  {
    title: "Chef AI",
    facts: "Project facts · Stack · Year",
    discipline: "React · AI",
    lead: "Placeholder copy: one sentence on what it is and why it matters.",
  },
  {
    title: "The Morning Ledger",
    facts: "Project facts · Stack · Year",
    discipline: "AI · Finance",
    image: "/projects/morning-ledger.jpg",
    lead: "Placeholder copy: one sentence on what it is and why it matters.",
  },
  {
    title: "This portfolio",
    facts: "Next.js · Three.js · GSAP · 2026",
    discipline: "Next.js · 3D",
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
    discipline: "AI · Tools",
    lead: "Placeholder copy: one sentence on what it is and why it matters.",
  },
];

/** Trailer file. Every project plays the same test clip until the real trailers exist. */
export const TRAILER_SRC = "/video/pausa.mp4";

/** Fallback length in seconds until the clip's metadata has loaded. */
export const TRAILER_SECONDS = 10;

/**
 * Shared between the panel (DOM) and the 3D screen, read every frame.
 * `frame` is the stage box in page px, measured from the DOM so the 3D screen can never drift from the grid.
 * `screen` is where the 3D screen ends up in the world, so the projector beam lands exactly on it.
 */
export const view = {
  index: 0,
  /** Counts up each time the cursor lands on a different project row: the crowd reacts. */
  pulse: 0,
  /** A robot is in the visitor's hand: the page must not scroll away. */
  held: false,
  video: null as HTMLVideoElement | null,
  frame: { x: 64, y: 144, w: 644 },
  screen: { x: 0, y: 0, z: 0, w: 1, h: 1 },
};

/** URL part of a project: "The Morning Ledger" → "the-morning-ledger". */
export const slugOf = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const findProject = (slug: string) =>
  PROJECTS.find(project => slugOf(project.title) === slug);
