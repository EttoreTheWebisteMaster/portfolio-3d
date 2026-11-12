import Image from "next/image";

import CaseStudyMotion from "@/components/sections/CaseStudyMotion";
import NextProject from "@/components/sections/NextProject";
import TrailerVideo from "@/components/sections/TrailerVideo";
import CaseEpisodes from "@/components/sections/CaseEpisodes";
import CaseMore from "@/components/sections/CaseMore";
import CaseResult from "@/components/sections/CaseResult";
import CaseStory from "@/components/sections/CaseStory";
import CaseSystem from "@/components/sections/CaseSystem";
import { caseStudyOf } from "@/lib/caseStudies";
import { pad } from "@/lib/pages";
import { PROJECTS, slugOf, TRAILER_SRC } from "@/lib/projects";

type Project = (typeof PROJECTS)[number];

/** A project's case study. The trailer plays as the hero's backdrop, with the title, facts and a longer description laid over it. */
export default function CaseStudy({
  project,
  index,
  next,
}: Readonly<{ project: Project; index: number; next: Project }>) {
  // "platform · stack · year": the last part is the year, the rest the details.
  const content = caseStudyOf(project);
  const parts = project.facts.split(" · ");
  const facts = [
    ["Discipline", project.discipline],
    ["Details", parts.slice(0, -1).join(" · ") || project.facts],
    ["Year", parts.length > 1 ? parts[parts.length - 1] : "—"],
  ] as const;
  return (
    <article className="case">
      <header className="case-hero">
        <div className="case-backdrop" data-trailer>
          <TrailerVideo
            src={TRAILER_SRC}
            poster={project.poster}
            label={`${project.title} trailer`}
          />
          {project.poster && (
            <Image
              src={project.poster}
              alt=""
              fill
              sizes="100vw"
              className="case-still"
              data-poster
            />
          )}
        </div>
        <div className="case-copy">
          <p data-fx="item" className="fx eyebrow">
            Case study · {pad(index + 1)} / {pad(PROJECTS.length)}
          </p>
          <h1 data-fx="title" className="fx case-title">
            {project.title}
          </h1>
          <dl data-fx="item" className="fx case-facts">
            {facts.map(([label, value]) => (
              <div key={label} className="fact">
                <dt className="fact-label">{label}</dt>
                <dd className="fact-value">{value}</dd>
              </div>
            ))}
          </dl>
          <p data-fx="text" className="fx case-lead">
            {project.summary ?? project.lead}
          </p>
        </div>
        <CaseEpisodes content={content} />
      </header>

      <CaseStory content={content} />
      <CaseSystem content={content} />
      <CaseResult content={content} image={project.image} />
      <CaseMore current={index} />
      <NextProject
        href={`/projects/${slugOf(next.title)}`}
        title={next.title}
      />
      <CaseStudyMotion index={index} />
    </article>
  );
}
