import type { CaseStudyContent } from "@/lib/caseStudies";

/** Scene three: the design system. The palette rises swatch by swatch, the typeface is set huge, the break names run underneath. */
export default function CaseSystem({
  content,
}: Readonly<{ content: CaseStudyContent }>) {
  return (
    <section
      id="system"
      className="case-scene case-system"
      aria-label="Design system"
    >
      <p data-reveal="up" className="eyebrow">
        Palette &amp; type
      </p>
      <ul data-reveal="swatches" className="case-swatches">
        {content.swatches.map(({ name, tone }) => (
          <li key={tone} className="swatch" data-tone={tone}>
            <span className="swatch-name">{name}</span>
          </li>
        ))}
      </ul>
      <div data-reveal="up" className="case-type">
        <p className="case-specimen" aria-label={`Aa ${content.typeface}`}>
          <span aria-hidden="true">Aa</span>
        </p>
        <p className="case-type-note">
          <strong>{content.typeface}</strong>
          <span>{content.typeNote}</span>
        </p>
      </div>
    </section>
  );
}
