type Project = {
  title: string;
  /** Facts line, e.g. platform · stack · year. */
  facts: string;
  discipline: string;
  /** The trailer in /public: it plays on the Projects screen and as the case study backdrop. */
  trailer: string;
  /** Hover thumbnail in /public, also the case study backdrop once its trailer has softened away. */
  image: string;
  /** The live site, shown as a link in the case study hero. */
  url?: string;
  /** Two lines at most. */
  lead: string;
  /** The longer description on the case study hero; falls back to `lead`. */
  summary?: string;
};

/** Projects, in screening order. */
export const PROJECTS: readonly Project[] = [
  {
    title: "Pausa",
    facts: "macOS menu-bar app · SwiftUI · 2026",
    discipline: "Product",
    trailer: "/projects/pausa/trailer.mp4",
    image: "/projects/pausa/thumbnail.webp",
    url: "https://pausa.ettoreserra.it",
    lead: "A free macOS menu-bar app that picks your next 15-second break. No account.",
    summary:
      "Pausa lives in the macOS menu bar. When it is time to stop, a wheel picks one of eight kinds of break: move, breathe, snack, water, step outside. Each lasts 15 seconds. Breaks of 10 minutes or less raise vigor and lower fatigue (Albulescu et al., 2022, meta-analysis). I designed and built it alone, from product to visual system to SwiftUI.",
  },
];

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
