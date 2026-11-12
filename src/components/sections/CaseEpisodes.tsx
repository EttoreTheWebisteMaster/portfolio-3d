import type { CaseStudyContent } from "@/lib/caseStudies";
import { pad } from "@/lib/pages";

/** The chapters as a compact numbered row under the hero copy: still, number, title, one line. Each jumps to its scene. */
export default function CaseEpisodes({
  content,
}: Readonly<{ content: CaseStudyContent }>) {
  return (
    <nav className="case-chapters" aria-label="Process">
      <p data-fx="item" className="case-chapters-label fx eyebrow">
        Process
      </p>
      {content.episodes.map(({ id, title, line, still }, i) => (
        <a key={id} href={`#${id}`} data-fx="item" className="fx episode">
          <span aria-hidden className="episode-still" data-still={still} />
          <span className="episode-title">
            <span className="episode-no">{pad(i + 1)}</span>
            {title}
          </span>
          <span className="episode-text">{line}</span>
        </a>
      ))}
    </nav>
  );
}
