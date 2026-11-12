import type { CaseStudyContent } from "@/lib/caseStudies";
import { pad } from "@/lib/pages";

/** The chapters as a short list of episodes: number, still, title, one line. Each jumps to its scene. */
export default function CaseEpisodes({
  content,
}: Readonly<{ content: CaseStudyContent }>) {
  return (
    <section className="case-episodes case-scene" aria-label="Chapters">
      <div data-reveal="up" className="case-head">
        <h2 className="case-heading">Episodes</h2>
        <p className="eyebrow">Season 1 · The making of</p>
      </div>
      <nav data-reveal="stagger" className="case-episode-list">
        {content.episodes.map(({ id, title, line, still }, i) => (
          <a key={id} href={`#${id}`} className="episode">
            <span className="episode-no">{i + 1}</span>
            <span aria-hidden className="episode-still" data-still={still} />
            <div>
              <div className="episode-head">
                <span className="episode-title">{title}</span>
                <span className="episode-length">1 min</span>
              </div>
              <p className="episode-text">{line}</p>
            </div>
            <span className="sr-only">Chapter {pad(i + 1)}</span>
          </a>
        ))}
      </nav>
    </section>
  );
}
