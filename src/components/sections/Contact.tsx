import ContactActions from "@/components/sections/ContactActions";

/** The end credits: label over value, in the billing-block language of the hero. */
const credits = [
  ["Design & development", "Ettore Serra"],
  ["Cast", "ROB-092 and the falling crew"],
  ["Shot in", "Turin, Italy · 2026"],
  ["Built with", "Next.js · Three.js · GSAP"],
] as const;

/** Contact: the dark floor, the lamp and the falling robots are in the 3D set behind; this layer is the headline, the three actions and the end credits. */
export default function Contact() {
  return (
    <section
      id="contact"
      data-page
      data-theme="screen"
      className="page contact"
    >
      <h2 className="sr-only">Contact Ettore Serra</h2>

      <div className="contact-layout">
        <p data-fx="text" className="fx contact-headline" aria-hidden>
          Let&apos;s work
          <br />
          <mark>together</mark>
        </p>
        <p data-fx="text" className="fx contact-pitch">
          Open to frontend and full-stack roles. Turin or remote, employee or
          freelance.
        </p>
        <div data-fx="item" className="fx">
          <ContactActions />
        </div>
      </div>

      <dl data-fx="item" className="fx contact-credits">
        {credits.map(([term, value]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="sr-only">Robot model by Quaternius, CC0.</p>
    </section>
  );
}
