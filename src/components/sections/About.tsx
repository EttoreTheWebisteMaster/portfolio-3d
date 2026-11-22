import AboutAsk from "@/components/sections/AboutAsk";

/** About: the cream room and ROB-092 are in the 3D set behind; this layer is the interview column and the caption. */
export default function About() {
  return (
    <section id="about" data-page data-theme="paper" className="page about">
      <h2 className="sr-only">About Ettore Serra</h2>

      <div className="about-layout">
        <div className="about-copy">
          <p data-fx="display" className="fx about-headline" aria-hidden>
            Ask me <mark>Anything</mark> <br />
            about Ettore.
          </p>
          <div className="about-ask">
            <AboutAsk />
          </div>
        </div>
      </div>

      <p data-fx="stack" data-early className="fx about-caption max-md:hidden">
        <strong>ROB-092</strong>
        <span>Public relations unit</span>
      </p>
    </section>
  );
}
