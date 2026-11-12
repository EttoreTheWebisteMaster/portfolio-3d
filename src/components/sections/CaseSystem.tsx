import { type CaseStudyContent, episodeTitle } from "@/lib/caseStudies";

/** Scene three: the design system in one spread. Colour deals out like cards, the typeface is set at every weight and size, the shape language closes it. */
export default function CaseSystem({
  content,
}: Readonly<{ content: CaseStudyContent }>) {
  const { typeface, weights, glyphs, scale, shape } = content;
  return (
    <section
      id="system"
      className="case-scene case-system"
      aria-label="Design system"
    >
      <h2 data-reveal="title" className="case-heading">
        {episodeTitle(content, "system")}
      </h2>

      <div className="system-block">
        <p data-reveal="up" className="system-label">
          <span>01</span> Colour
        </p>
        <ul data-reveal="swatches" className="case-swatches">
          {content.swatches.map(({ name, tone, hex }) => (
            <li key={tone} className="swatch" data-tone={tone}>
              <span className="swatch-name">{name}</span>
              <span className="swatch-hex">{hex}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="system-block">
        <p data-reveal="up" className="system-label">
          <span>02</span> Typeface
        </p>
        <div className="case-type">
          <p
            data-reveal="specimen"
            className="case-specimen"
            aria-label={`Aa ${typeface}`}
          >
            <span aria-hidden="true">A</span>
            <span aria-hidden="true">a</span>
          </p>
          <div data-reveal="block" className="case-type-note">
            <strong>{typeface}</strong>
            <span>{content.typeNote}</span>
          </div>
          <ul data-reveal="rows" className="case-weights">
            {weights.map(({ name, value }) => (
              <li key={value} className="weight" data-weight={value}>
                <span className="weight-name">
                  {name} <b>{value}</b>
                </span>
                <span className="weight-sample">{content.weightSample}</span>
              </li>
            ))}
          </ul>
        </div>
        <p data-drift="36" className="system-glyphs" aria-hidden="true">
          {glyphs}
        </p>
      </div>

      <div className="system-block">
        <p data-reveal="up" className="system-label">
          <span>03</span> Scale
        </p>
        <ul data-reveal="rows" className="case-scale">
          {scale.map(({ step, role, size, sample }) => (
            <li key={step} className="scale-row">
              <span className="scale-role">
                {role} <b>{size}</b>
              </span>
              <span className="scale-sample" data-step={step}>
                {sample}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="system-block">
        <p data-reveal="up" className="system-label">
          <span>04</span> Shape
        </p>
        <ul data-reveal="stagger" className="case-shape">
          {shape.map(({ kind, label, value }) => (
            <li key={kind} className="shape-card">
              <span
                className="shape-demo"
                data-kind={kind}
                aria-hidden="true"
              />
              <span className="shape-label">{label}</span>
              <span className="shape-value">{value}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
