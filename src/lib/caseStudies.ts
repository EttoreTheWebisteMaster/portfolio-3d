import type { PROJECTS } from "@/lib/projects";
import { slugOf, TRAILER_SRC } from "@/lib/projects";

type Project = (typeof PROJECTS)[number];

/** What a case study shows, in as few words as possible: the design does the talking. Keyed by project slug. */
export type CaseStudyContent = {
  /** One sentence: the idea. */
  statement: string;
  role: string;
  stack: string;
  platform: string;
  status: string;
  /** The chapters, as a short list: `still` picks the thumbnail drawn in the stylesheet. */
  episodes: readonly {
    id: string;
    title: string;
    line: string;
    still: string;
  }[];
  /** Footage and stills shown in the final result; `wide` tiles take two thirds of the row. */
  gallery: readonly {
    kind: "video" | "image";
    src: string;
    alt: string;
    wide?: boolean;
  }[];
  /** Palette, in the order they are shown. `tone` picks the colour in the stylesheet; `hex` is the same colour, written out. */
  swatches: readonly { name: string; tone: string; hex: string }[];
  typeface: string;
  typeNote: string;
  /** One line set in every weight, top to bottom. */
  weights: readonly { name: string; value: number }[];
  weightSample: string;
  /** Every character of the face, set as one drifting line. */
  glyphs: string;
  /** The type scale: `step` picks the size in the stylesheet. */
  scale: readonly {
    step: string;
    role: string;
    size: string;
    sample: string;
  }[];
  /** The shape language, each drawn in the stylesheet by `kind`. */
  shape: readonly { kind: string; label: string; value: string }[];
  /** Drawn interface stills, for projects that have an app to show. */
  popover?: {
    label: string;
    value: string;
    primary: string;
    secondary: string;
  };
  notification?: { app: string; text: string };
};

/** A scene's heading is the name of its button in the hero. */
export const episodeTitle = (content: CaseStudyContent, id: string) =>
  content.episodes.find(episode => episode.id === id)?.title ?? "";

const pausa: CaseStudyContent = {
  statement:
    "Breaks fail when they feel like orders. Pausa turns the pause into a small event: a wheel in the menu bar picks what you do next, and rest stops being a chore and becomes something you look forward to.",
  role: "Product, design & code",
  stack: "SwiftUI",
  platform: "macOS 14+",
  status: "In production",
  episodes: [
    {
      id: "idea",
      title: "The idea",
      line: "Make the pause something you are curious about, not something you are told.",
      still: "wheel",
    },
    {
      id: "system",
      title: "Design system",
      line: "One colour per break, on a warm paper base.",
      still: "swatches",
    },
    {
      id: "result",
      title: "Final result",
      line: "The finished app, in use.",
      still: "popover",
    },
  ],
  gallery: [
    { kind: "video", src: "/video/pausa.mp4", alt: "Pausa in use", wide: true },
    { kind: "image", src: "/projects/pausa.jpg", alt: "Pausa on a desk" },
    {
      kind: "image",
      src: "/projects/morning-ledger.jpg",
      alt: "Interface study",
    },
    {
      kind: "video",
      src: "/video/test-1280.mp4",
      alt: "Interaction study",
      wide: true,
    },
  ],
  swatches: [
    { name: "Move", tone: "move", hex: "#B02624" },
    { name: "Breathe", tone: "breathe", hex: "#E8A43C" },
    { name: "Snack", tone: "snack", hex: "#FFD957" },
    { name: "Outside", tone: "outside", hex: "#8FBC85" },
    { name: "Water", tone: "water", hex: "#5F9DC8" },
    { name: "Eyes off", tone: "eyes", hex: "#1F1B19" },
    { name: "Talk", tone: "talk", hex: "#E58E72" },
    { name: "Tidy", tone: "tidy", hex: "#F6F0E3" },
    { name: "Paper", tone: "paper", hex: "#EFE6D3" },
    { name: "Panel", tone: "panel", hex: "#FAF7F0" },
  ],
  typeface: "SF Pro",
  typeNote:
    "The system face of the Mac. Native to the menu bar, so Pausa never looks like a guest.",
  weights: [
    { name: "Light", value: 300 },
    { name: "Regular", value: 400 },
    { name: "Medium", value: 500 },
    { name: "Semibold", value: 600 },
    { name: "Bold", value: 700 },
    { name: "Heavy", value: 800 },
  ],
  weightSample: "Rest makes you better",
  glyphs:
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 &?!@#%→",
  scale: [
    { step: "display", role: "Display", size: "72 / 76", sample: "Pause well" },
    { step: "title", role: "Title", size: "34 / 40", sample: "Time to move" },
    {
      step: "body",
      role: "Body",
      size: "15 / 22",
      sample: "Stand up, stretch your arms and look out of the window.",
    },
    {
      step: "caption",
      role: "Caption",
      size: "11 / 14",
      sample: "Next pause in 18 min",
    },
  ],
  shape: [
    { kind: "radius", label: "Radius", value: "8 · 16 · pill" },
    { kind: "grid", label: "Spacing", value: "4 px grid" },
    { kind: "shadow", label: "Elevation", value: "Soft, warm, one level" },
  ],
  popover: {
    label: "Next pause in",
    value: "18 min",
    primary: "Spin now",
    secondary: "Snooze",
  },
  notification: {
    app: "Pausa · now",
    text: "The wheel picked “Move”. Stand up and stretch for 3 minutes.",
  },
};

const bySlug: Readonly<Record<string, CaseStudyContent>> = { pausa };

const TBA = "To be added";

/** The standard case study: every project gets it, filled from its own data. A project with its own content in `bySlug` replaces it. */
function template(project: Project): CaseStudyContent {
  const parts = project.facts.split(" · ");
  return {
    statement: project.summary ?? project.lead,
    role: TBA,
    stack: parts.length > 2 ? parts.slice(0, -1).join(" · ") : TBA,
    platform: TBA,
    status: TBA,
    episodes: [
      {
        id: "idea",
        title: "The idea",
        line: "What it is, and why it is worth making.",
        still: "wheel",
      },
      {
        id: "system",
        title: "Design system",
        line: "Colour, type and shape.",
        still: "swatches",
      },
      {
        id: "result",
        title: "Final result",
        line: "The finished project, in use.",
        still: "popover",
      },
    ],
    gallery: [
      {
        kind: "video",
        src: TRAILER_SRC,
        alt: `${project.title} in use`,
        wide: true,
      },
      ...(project.image
        ? [{ kind: "image" as const, src: project.image, alt: project.title }]
        : []),
    ],
    swatches: [
      { name: "Primary", tone: "move", hex: "#B02624" },
      { name: "Secondary", tone: "water", hex: "#5F9DC8" },
      { name: "Accent", tone: "breathe", hex: "#E8A43C" },
      { name: "Surface", tone: "tidy", hex: "#F6F0E3" },
      { name: "Paper", tone: "paper", hex: "#EFE6D3" },
      { name: "Ink", tone: "eyes", hex: "#1F1B19" },
    ],
    typeface: TBA,
    typeNote: "The typeface and why it was chosen.",
    weights: pausa.weights,
    weightSample: project.title,
    glyphs: pausa.glyphs,
    scale: pausa.scale.map(row =>
      row.step === "display" ? { ...row, sample: project.title } : row
    ),
    shape: pausa.shape,
  };
}

/** What a project's case study shows: its own content if it has any, the standard one otherwise. */
export const caseStudyOf = (project: Project) =>
  bySlug[slugOf(project.title)] ?? template(project);
