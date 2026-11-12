import type { CaseStudyContent } from "@/lib/caseStudies";

/** Scene two: the idea in one sentence, and the facts beside it. */
export default function CaseStory({
  content,
}: Readonly<{ content: CaseStudyContent }>) {
  const facts = [
    ["Role", content.role],
    ["Stack", content.stack],
    ["Platform", content.platform],
    ["Status", content.status],
  ] as const;
  return (
    <section id="idea" className="case-scene case-story" aria-label="The idea">
      <p data-reveal="words" className="case-statement">
        {content.statement}
      </p>
      <dl data-reveal="stagger" className="case-meta">
        {facts.map(([label, value]) => (
          <div key={label} className="fact">
            <dt className="fact-label">{label}</dt>
            <dd className="fact-value">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
