import CaseStudyMotion from "@/components/sections/CaseStudyMotion";
import NextProject from "@/components/sections/NextProject";
import PlayTrailer from "@/components/sections/PlayTrailer";
import Button from "@/components/ui/Button";
import { pad } from "@/lib/pages";
import { PROJECTS, slugOf, TRAILER_SRC } from "@/lib/projects";

type Project = (typeof PROJECTS)[number];

/** TODO(content): the real story, decisions, stills and engineering notes per project. The design package has not written them yet. */
const chapters = [
  ["story", "The story", "Why it exists and who it is for."],
  [
    "decisions",
    "Design decisions",
    "The choices that shaped it, and what was cut.",
  ],
  ["system", "Design system", "Palette, type and the components behind it."],
  ["result", "Final result", "The finished interface, in use."],
  [
    "engineering",
    "Engineering",
    "Performance, accessibility and architecture, next to the spectacle.",
  ],
] as const;

/** A project's case study. The screen from Projects grows to fill the viewport and settles as the hero; the room keeps Projects' grade. */
export default function CaseStudy({
  project,
  index,
  next,
}: Readonly<{ project: Project; index: number; next: Project }>) {
  // "platform · stack · year": the last part is the year, the rest the details.
  const parts = project.facts.split(" · ");
  const facts = [
    ["Discipline", project.discipline],
    ["Details", parts.slice(0, -1).join(" · ") || project.facts],
    ["Year", parts.length > 1 ? parts[parts.length - 1] : "—"],
  ] as const;
  return (
    <article className="case">
      <header className="case-hero">
        <div className="case-frame" data-pull>
          <video
            src={TRAILER_SRC}
            poster={project.image}
            autoPlay
            muted
            loop
            playsInline
            aria-label={`${project.title} trailer`}
          />
        </div>
        <div className="case-copy">
          <p data-fx="item" className="fx eyebrow">
            Case study · {pad(index + 1)} / {pad(PROJECTS.length)}
          </p>
          <h1 data-fx="title" className="fx case-title">
            {project.title}
          </h1>
          <p data-fx="text" className="fx case-lead">
            {project.lead}
          </p>
          <dl data-fx="item" className="fx case-facts">
            {facts.map(([label, value]) => (
              <div key={label} className="fact">
                <dt className="fact-label">{label}</dt>
                <dd className="fact-value">{value}</dd>
              </div>
            ))}
          </dl>
          <div data-fx="item" className="fx case-actions">
            <PlayTrailer />
            <Button href="/projects" variant="secondary">
              ← Back to projects
            </Button>
          </div>
        </div>
      </header>

      <div className="case-body">
        <nav aria-label="Chapters" className="case-episodes">
          {chapters.map(([id, title, text], i) => (
            <a key={id} href={`#${id}`} className="episode">
              <span className="episode-no">{pad(i + 1)}</span>
              <span aria-hidden className="episode-still" />
              <div>
                <div className="episode-head">
                  <span className="episode-title">{title}</span>
                </div>
                <p className="episode-text">{text}</p>
              </div>
            </a>
          ))}
        </nav>
        <div className="case-chapters">
          {chapters.map(([id, title, text], i) => (
            <section key={id} id={id} className="case-chapter">
              <span className="case-chapter-no">{pad(i + 1)}</span>
              <h2>{title}</h2>
              <p>{text}</p>
            </section>
          ))}
        </div>
        <NextProject
          href={`/projects/${slugOf(next.title)}`}
          title={next.title}
        />
      </div>
      <CaseStudyMotion />
    </article>
  );
}
