import Button from "@/components/ui/Button";

const stack = [
  "React · Next.js · Three.js · GSAP · TypeScript",
  "Swift · Python · Figma · Generative AI",
];

/** Home page: the copy layer over the fixed 3D set (name, ROB-092, light, dust live in `Stage`). */
export default function Hero() {
  return (
    <section id="home" data-page className="hero page">
      <h1 className="sr-only">Ettore Serra, designer and engineer</h1>

      <div className="hero-copy" data-depth="0.45">
        <h2 data-fx="title" className="fx hero-tagline">
          Designer &amp; engineer.
          <br />
          One person.
        </h2>
        <p data-fx="text" className="fx hero-body">
          Six years turning ideas into interfaces people remember. Full stack,
          with a designer&apos;s eye: React, Next.js and Three.js, from Turin to
          anywhere.
        </p>
        <div data-fx="item" className="fx hero-actions">
          <Button href="/projects" arrow>
            See the projects
          </Button>
        </div>
      </div>

      <p data-fx="item" className="fx hero-billing">
        <span>Design &amp; development</span> <strong>Ettore Serra</strong>{" "}
        <span>with</span> <em>ROB-092</em>
        {stack.map(line => (
          <span key={line} className="hero-billing-line">
            {line}
          </span>
        ))}
      </p>
    </section>
  );
}
