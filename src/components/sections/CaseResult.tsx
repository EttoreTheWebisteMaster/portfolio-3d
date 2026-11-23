import Image from "next/image";

import LoopVideo from "@/components/ui/LoopVideo";
import { type CaseStudyContent, episodeTitle } from "@/lib/caseStudies";

/** Scene four: the final result, only footage and stills, hung like a poster: every piece its own size, place and soft shape. */
export default function CaseResult({
  content,
}: Readonly<{ content: CaseStudyContent }>) {
  return (
    <section
      id="result"
      className="case-scene case-result"
      aria-label="Final result"
    >
      <h2 data-reveal="title" className="case-heading">
        {episodeTitle(content, "result")}
      </h2>
      <div data-reveal="media" className="case-poster">
        {content.gallery.map(({ kind, src, alt }) => (
          <figure key={src} className="case-media">
            {kind === "video" ? (
              <LoopVideo src={src} label={alt} />
            ) : (
              <Image
                src={src}
                alt={alt}
                fill
                sizes="(max-width: 1023px) 100vw, 40vw"
              />
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}
