import Link from "next/link";

import { PROJECTS, slugOf } from "@/lib/projects";

/** "More like this": four other projects, as cards into their own case studies. */
export default function CaseMore({ current }: Readonly<{ current: number }>) {
  const others = PROJECTS.map((project, i) => ({ project, i }))
    .filter(({ i }) => i !== current)
    .slice(0, 4);
  return (
    <section className="case-scene case-more" aria-label="More like this">
      <h2 data-reveal="up" className="case-heading">
        More like this
      </h2>
      <ul data-reveal="stagger" className="more-cards">
        {others.map(({ project, i }) => (
          <li key={project.title}>
            <Link
              href={`/projects/${slugOf(project.title)}`}
              className="more-card"
            >
              <span className="more-card-still" data-tone={i % 4} aria-hidden />
              <span className="more-card-title">{project.title}</span>
              <span className="more-card-meta">{project.discipline}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
