import Button from "@/components/ui/Button";

const stack = [
  "Next.js · React · TypeScript · Agentic coding",
  "Three.js · GSAP · Tailwind",
];

/** Home page: the copy layer over the fixed 3D set (name, ROB-092, light, dust live in `Stage`). */
export default function Hero() {
  return (
    <section id="home" data-page className="hero page">
      <div className="hero-copy" data-depth="0.45">
        <h2 data-fx="title" className="fx hero-tagline">
          Designer &amp; engineer.
          <br />
          One person.
        </h2>
        <p data-fx="text" className="fx hero-body">
          <strong>Six years</strong> forging <strong>interactive worlds</strong>
          , from the first sketch to the <strong>final frame</strong>. Based in
          Turin, <strong>open to the world</strong>.
        </p>
        <div data-fx="item" className="fx hero-actions">
          <Button href="/projects" arrow>
            See the projects
          </Button>
        </div>
      </div>

      <div className="hero-aside" data-depth="0.3">
        <p data-fx="item" className="fx hero-billing">
          <span>Design &amp; development</span> <strong>Ettore Serra</strong>{" "}
          <span>with</span> <em>ROB-092</em>
          {stack.map(line => (
            <span key={line} className="hero-billing-line">
              {line}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
