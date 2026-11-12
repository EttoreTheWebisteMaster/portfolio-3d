type Project = {
  title: string;
  /** Facts line, e.g. platform · stack · year. */
  facts: string;
  discipline: string;
  /** Hover thumbnail in /public. Rows without one show the felt card. */
  image?: string;
  /** The case study backdrop once its trailer has softened away: a still of the trailer. Falls back to nothing (the footage keeps playing). */
  poster?: string;
  /** Two lines at most. */
  lead: string;
  /** The longer description on the case study hero; falls back to `lead`. */
  summary?: string;
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
    poster: "/projects/pausa-poster.jpg",
    lead: "Rest makes you better. A menu-bar app that turns the break into a small event.",
    summary:
      "Work sessions don't end; they just get interrupted. Pausa lives in the macOS menu bar and, when it's time to stop, spins a wheel across eight kinds of break: move, breathe, snack, step outside and more. I designed the product, the visual system and the SwiftUI app, so the pause stops being a chore and becomes a small event.",
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
    summary:
      "The site you are on. A single persistent 3D set built with React Three Fiber, where every page is a different camera and light on the same room. GSAP drives the scroll and transitions, and the whole thing stays accessible, responsive and respectful of reduced motion.",
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
