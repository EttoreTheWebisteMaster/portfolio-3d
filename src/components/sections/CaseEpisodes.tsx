import type { CaseStudyContent } from "@/lib/caseStudies";
import { ButtonArrow } from "@/components/ui/Button";
import { pad } from "@/lib/pages";

/** The chapters as three quiet columns under the hero copy: a hairline, the number, the title and one line. Each jumps to its scene. */
export default function CaseEpisodes({
  content,
}: Readonly<{ content: CaseStudyContent }>) {
  return (
    <nav className="case-chapters" aria-label="Process">
      <p data-fx="item" className="case-chapters-label fx eyebrow">
        Process
      </p>
      {content.episodes.map(({ id, title, line }, i) => (
        <a key={id} href={`#${id}`} data-fx="item" className="fx episode">
          <span className="episode-title">
            <span className="episode-no">{pad(i + 1)}</span>
            {title}
          </span>
          <ButtonArrow />
          <span className="episode-text">{line}</span>
        </a>
      ))}
    </nav>
  );
}
