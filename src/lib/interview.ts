/** The interview: suggested questions with pre-written answers, and a keyword matcher for anything typed. No network. */
type Answer = { id: string; question: string; answer: string };

export const QUESTIONS: readonly Answer[] = [
  {
    id: "work",
    question: "What does he build?",
    answer:
      "Interfaces people remember. Full stack, with a designer's eye: React, Next.js and Three.js, from first sketch to shipped product.",
  },
  {
    id: "stack",
    question: "What is his stack?",
    answer:
      "React, Next.js, Three.js, GSAP and TypeScript on the web. Swift for macOS, Python for tooling, Figma for the drawing board, generative AI where it earns its place.",
  },
  {
    id: "start",
    question: "When can he start?",
    answer:
      "Now. Ettore is available for frontend and full-stack roles, Turin or remote, employee or freelance.",
  },
  {
    id: "team",
    question: "Where did he work last?",
    answer:
      "At INFN, the Italian national institute for nuclear physics, building interfaces for people who read data for a living.",
  },
  {
    id: "years",
    question: "How long has he worked?",
    answer:
      "Six years turning ideas into interfaces, as a designer and as an engineer. He does both, in one person.",
  },
  {
    id: "based",
    question: "Where is he based?",
    answer:
      "Turin, Italy. He works from there or remotely, wherever the team is.",
  },
  {
    id: "site",
    question: "How is this site made?",
    answer:
      "Next.js, React Three Fiber and GSAP. One 3D set behind every page, and me in it. The robot model is by Quaternius, CC0.",
  },
  {
    id: "reach",
    question: "How do I reach him?",
    answer:
      "The Contact page is one scroll down: copy the email, or find him on LinkedIn and GitHub.",
  },
];

const KEYWORDS: readonly { id: string; words: readonly string[] }[] = [
  {
    id: "stack",
    words: ["stack", "tech", "react", "three", "language", "tool"],
  },
  {
    id: "start",
    words: ["start", "available", "hire", "freelance", "when", "remote"],
  },
  {
    id: "team",
    words: ["infn", "last", "team", "company", "experience", "where"],
  },
  { id: "years", words: ["years", "long", "senior", "junior"] },
  {
    id: "based",
    words: ["based", "live", "turin", "italy", "city", "location"],
  },
  { id: "site", words: ["site", "portfolio", "made", "gsap", "next"] },
  {
    id: "reach",
    words: ["reach", "contact", "email", "mail", "linkedin", "github"],
  },
  { id: "work", words: ["work", "build", "project", "do", "design"] },
];

const FALLBACK =
  "I only know what is on his CV. For anything else, ask Ettore directly: the email is one page down.";

/** The suggestion a typed question is about, if any: the first topic whose keyword appears in it. */
export function match(text: string) {
  const lower = text.toLowerCase();
  const hit = KEYWORDS.find(k => k.words.some(w => lower.includes(w)));
  return QUESTIONS.find(q => q.id === hit?.id) ?? null;
}

/** What the robot says to a typed question. */
export const answerFor = (text: string) => match(text)?.answer ?? FALLBACK;

/** How many suggestions show at once. */
export const PICKS = 3;

/** The next suggestions: the first ones not asked yet, topping up from the start once the pool runs low. */
export function nextPicks(asked: ReadonlySet<string>) {
  const fresh = QUESTIONS.filter(q => !asked.has(q.id));
  const pool = fresh.length >= PICKS ? fresh : QUESTIONS;
  return pool.slice(0, PICKS);
}

/** Shared with the 3D robot: when the last question was sent and whether he is answering (nod, head turns to you). Mutated, never React state. */
export const asking = { sentAt: -100, speaking: false };

/** Stamps the moment a question was sent. */
export function markAsked() {
  asking.sentAt = performance.now() / 1000;
}

/** What ROB-092 says first, as he rises into the cut. */
export const GREETING =
  "Hi, I'm ROB-092, his AI publicist. Ask about his work, his stack or when he can start.";

const listeners = new Set<() => void>();
let greeted = false;

/** The chat listens here for the moment he starts to wave. */
export function onGreet(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** He waves and says hello: once per visit, the chat types the greeting. */
export function greet() {
  if (greeted) return;
  greeted = true;
  listeners.forEach(listener => listener());
}
