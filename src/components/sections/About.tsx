import AboutAsk from "@/components/sections/AboutAsk";

const facts = [
  ["Experience", "6 years"],
  ["Last team", "INFN"],
  ["Based", "Turin / remote"],
  ["Status", "Available"],
] as const;

/** About: the cream wall and ROB-092 are in the 3D set behind; this layer is the interview column and the caption. */
export default function About() {
  return (
    <section id="about" data-page data-theme="paper" className="page about">
      <h2 className="sr-only">About Ettore Serra</h2>

      <div className="about-layout">
        <div className="about-copy">
          <p data-fx="text" className="fx about-headline" aria-hidden>
            Ask me
            <br />
            <mark>Anything</mark>
            <br />
            about Ettore.
          </p>
          <div data-fx="item" className="fx about-ask">
            <AboutAsk />
          </div>
          <dl data-fx="item" className="fx about-facts">
            {facts.map(([term, value]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <p data-fx="item" className="fx about-caption">
        <strong>ROB-092</strong>
        <span>Public relations unit</span>
      </p>
    </section>
  );
}
