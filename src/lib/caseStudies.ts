import type { PROJECTS } from "@/lib/projects";
import { slugOf } from "@/lib/projects";

type Project = (typeof PROJECTS)[number];

/** What a case study shows, in as few words as possible: the design does the talking. Keyed by project slug. */
export type CaseStudyContent = {
  /** One sentence: the idea. */
  statement: string;
  role: string;
  stack: string;
  platform: string;
  status: string;
  /** The chapters, as a short list. */
  episodes: readonly {
    id: string;
    title: string;
    line: string;
  }[];
  /** Footage and stills shown in the final result. */
  gallery: readonly {
    kind: "video" | "image";
    src: string;
    alt: string;
  }[];
  /** Palette, in the order they are shown. `tone` picks the colour in the stylesheet; `hex` is the same colour, written out. */
  swatches: readonly {
    name: string;
    tone: string;
    hex: string;
  }[];
  typeface: string;
  typeNote: string;
  weights: readonly { name: string; value: number }[];
  weightSample: string;
  /** Every character of the face, set as one drifting line. */
  glyphs: string;
  /** The type scale: `step` picks the size and weight in the stylesheet. */
  scale: readonly {
    step: string;
    role: string;
    size: string;
    sample: string;
  }[];
  /** The shape language, each drawn in the stylesheet by `kind`. */
  shape: readonly { kind: string; label: string; value: string }[];
};

/** A scene's heading is the name of its button in the hero. */
export const episodeTitle = (content: CaseStudyContent, id: string) =>
  content.episodes.find(episode => episode.id === id)?.title ?? "";

const pausa: CaseStudyContent = {
  statement:
    "Breaks fail when they feel like orders. Pausa lets a wheel choose, so there is nothing to decide. WHO guidelines (2020) advise limiting sedentary time, and any activity that replaces sitting helps.",
  role: "Solo: product, design & code",
  stack: "SwiftUI",
  platform: "macOS 14+",
  status: "Live · free",
  episodes: [
    {
      id: "idea",
      title: "The idea",
      line: "A small 2012 study (Dunstan et al.) found 2-minute walking breaks lowered the glucose response after a drink.",
    },
    {
      id: "system",
      title: "Design system",
      line: "One blue accent, two signals and a soft colour for every break.",
    },
    {
      id: "result",
      title: "Final result",
      line: "Free, 4.2 MB, no account. English, Italian, French and Chinese.",
    },
  ],
  gallery: [
    {
      kind: "video",
      src: "/projects/pausa/trailer.mp4",
      alt: "Pausa trailer",
    },
    {
      kind: "image",
      src: "/projects/pausa/thumbnail.webp",
      alt: "Pausa, free for Mac",
    },
    {
      kind: "video",
      src: "/projects/pausa/case-study/video-2.mp4",
      alt: "The wheel picking one of eight kinds of break",
    },
    {
      kind: "video",
      src: "/projects/pausa/case-study/video-1.mp4",
      alt: "Translating Pausa into Traditional Chinese",
    },
    {
      kind: "image",
      src: "/projects/pausa/case-study/photo-4.webp",
      alt: "Pausa screens: settings, activities, quiz and break timer",
    },
    {
      kind: "video",
      src: "/projects/pausa/case-study/video-3.mp4",
      alt: "Break reminders arriving as notifications",
    },
    {
      kind: "image",
      src: "/projects/pausa/case-study/photo-2.webp",
      alt: "Every break lasts 15 seconds",
    },
  ],
  swatches: [
    { name: "Primary", tone: "brand", hex: "#0058BC" },
    { name: "Secondary", tone: "gold", hex: "#C9A200" },
    { name: "Tertiary", tone: "ring", hex: "#CC2200" },
    { name: "Background", tone: "bg", hex: "#FDFCFF" },
    { name: "Typography", tone: "ink", hex: "#1A1A33" },
  ],
  typeface: "SF Pro",
  typeNote:
    "The system font of the Mac in three cuts: Rounded for headings, Text for reading, Mono for the timer.",
  weights: [
    { name: "Regular", value: 400 },
    { name: "Medium", value: 500 },
    { name: "Semibold", value: 600 },
    { name: "Bold", value: 700 },
  ],
  weightSample: "Rest makes you better",
  glyphs:
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 &?!@#%→",
  scale: [
    { step: "record", role: "Display", size: "52", sample: "New record" },
    { step: "title", role: "Title", size: "20", sample: "Well done" },
    { step: "body", role: "Body", size: "13", sample: "Activity description" },
    {
      step: "caption",
      role: "Caption",
      size: "11",
      sample: "Next pause in 18 min",
    },
  ],
  shape: [
    {
      kind: "radius",
      label: "Radius",
      value: "7 to 12 px",
    },
    { kind: "grid", label: "Spacing", value: "4 px base" },
    {
      kind: "shadow",
      label: "Elevation",
      value: "Soft blue glow",
    },
    { kind: "window", label: "Window", value: "320 × 450" },
  ],
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
      },
      {
        id: "system",
        title: "Design system",
        line: "Colour, type and shape.",
      },
      {
        id: "result",
        title: "Final result",
        line: "The finished project, in use.",
      },
    ],
    gallery: [
      {
        kind: "video",
        src: project.trailer,
        alt: `${project.title} in use`,
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
    scale: pausa.scale,
    shape: pausa.shape,
  };
}

/** What a project's case study shows: its own content if it has any, the standard one otherwise. */
export const caseStudyOf = (project: Project) =>
  bySlug[slugOf(project.title)] ?? template(project);
