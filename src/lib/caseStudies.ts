/** What a case study shows, in as few words as possible: the design does the talking. Keyed by project slug. */
export type CaseStudyContent = {
  /** One sentence: the idea. */
  statement: string;
  role: string;
  stack: string;
  platform: string;
  status: string;
  /** The content rating card under the title. */
  rating: { letter: string; title: string; note: string };
  /** The chapters, as a short list: `still` picks the thumbnail drawn in the stylesheet. */
  episodes: readonly {
    id: string;
    title: string;
    line: string;
    still: string;
  }[];
  /** Palette, in the order they are shown. `tone` picks the colour in the stylesheet. */
  swatches: readonly { name: string; tone: string }[];
  typeface: string;
  typeNote: string;
  popover: { label: string; value: string; primary: string; secondary: string };
  notification: { app: string; text: string };
};

const pausa: CaseStudyContent = {
  statement:
    "Breaks fail when they are orders. Pausa makes them a small event.",
  role: "Product, design & code",
  stack: "SwiftUI",
  platform: "macOS 14+",
  status: "In production",
  rating: {
    letter: "D",
    title: "Rated D for developer",
    note: "Contains strong code and mild design violence",
  },
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
  swatches: [
    { name: "Move", tone: "move" },
    { name: "Breathe", tone: "breathe" },
    { name: "Snack", tone: "snack" },
    { name: "Outside", tone: "outside" },
    { name: "Water", tone: "water" },
    { name: "Eyes off", tone: "eyes" },
    { name: "Talk", tone: "talk" },
    { name: "Tidy", tone: "tidy" },
    { name: "Paper", tone: "paper" },
    { name: "Panel", tone: "panel" },
  ],
  typeface: "SF Pro",
  typeNote: "Native to the menu bar.",
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

export const CASE_STUDIES: Readonly<Record<string, CaseStudyContent>> = {
  pausa,
};
