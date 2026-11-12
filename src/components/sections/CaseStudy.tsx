import CaseStudyMotion from "@/components/sections/CaseStudyMotion";
import NextProject from "@/components/sections/NextProject";
import PlayTrailer from "@/components/sections/PlayTrailer";
import TrailerVideo from "@/components/sections/TrailerVideo";
import Button from "@/components/ui/Button";
import CaseEpisodes from "@/components/sections/CaseEpisodes";
import CaseMore from "@/components/sections/CaseMore";
import CaseResult from "@/components/sections/CaseResult";
import CaseStory from "@/components/sections/CaseStory";
import CaseSystem from "@/components/sections/CaseSystem";
import { CASE_STUDIES } from "@/lib/caseStudies";
import { pad } from "@/lib/pages";
import { PROJECTS, slugOf, TRAILER_SRC } from "@/lib/projects";

type Project = (typeof PROJECTS)[number];

/** A project's case study. The screen from Projects grows to fill the viewport and settles as the hero; the room keeps Projects' grade. */
export default function CaseStudy({
  project,
  index,
  next,
}: Readonly<{ project: Project; index: number; next: Project }>) {
  // "platform · stack · year": the last part is the year, the rest the details.
  const content = CASE_STUDIES[slugOf(project.title)];
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
          <TrailerVideo
            src={TRAILER_SRC}
            poster={project.image}
            label={`${project.title} trailer`}
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
          {content && (
            <div data-fx="item" className="fx case-rating">
              <span className="case-rating-letter">
                {content.rating.letter}
              </span>
              <p>
                <strong>{content.rating.title}</strong>
                <span>{content.rating.note}</span>
              </p>
            </div>
          )}
          <div data-fx="item" className="fx case-actions">
            <PlayTrailer />
            <Button href="/projects" variant="secondary">
              ← Back to projects
            </Button>
          </div>
        </div>
      </header>

      {content && <CaseStory content={content} />}
      {content && <CaseEpisodes content={content} />}
      {content && <CaseSystem content={content} />}
      {content && <CaseResult content={content} image={project.image} />}
      <CaseMore current={index} />
      <NextProject
        href={`/projects/${slugOf(next.title)}`}
        title={next.title}
      />
      <CaseStudyMotion index={index} />
    </article>
  );
}
