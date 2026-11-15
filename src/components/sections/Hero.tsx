import Button from "@/components/ui/Button";

const stack = [
  "React · Next.js · TypeScript · Three.js",
  "GSAP · Tailwind · Agentic coding",
];

/** Home page: the copy layer over the fixed 3D set (name, ROB-092, light, dust live in `Stage`). */
export default function Hero() {
  return (
    <section id="home" data-page className="hero page">
      <div className="hero-copy" data-depth="0.45">
        <h2 data-fx="title" className="fx hero-tagline">
          Designer &amp; engineer.
          <br />
          Pixel to production.
        </h2>
        <p data-fx="text" className="fx hero-body">
          <strong>Six years</strong> designing web interfaces and writing the
          code that ships them, real-time 3D and motion included. Based in
          Turin, open to the world.
        </p>
        <div data-fx="item" className="fx hero-actions">
          <Button href="/projects" arrow>
            View the projects
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
