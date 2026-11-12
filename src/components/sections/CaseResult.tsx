import Image from "next/image";

import Wheel from "@/components/ui/Wheel";
import type { CaseStudyContent } from "@/lib/caseStudies";

/** Scene four: the finished interface as three stills that drift at different speeds: the popover, the wheel, the notification over the photo. */
export default function CaseResult({
  content,
  image,
}: Readonly<{ content: CaseStudyContent; image?: string }>) {
  const { popover, notification } = content;
  return (
    <section
      id="result"
      className="case-scene case-result"
      aria-label="Final result"
    >
      <p data-reveal="up" className="eyebrow">
        The result
      </p>
      <div className="case-panel case-panel-popover" data-reveal="panel">
        <div className="case-panel-in" data-parallax="0.12">
          <span className="case-menubar" aria-hidden="true">
            <i />
            <i />
            <i data-on />
          </span>
          <div className="popover">
            <p className="popover-label">{popover.label}</p>
            <p className="popover-value">{popover.value}</p>
            <span className="popover-bar" aria-hidden="true" />
            <div className="popover-actions">
              <span className="popover-button" data-primary>
                {popover.primary}
              </span>
              <span className="popover-button">{popover.secondary}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="case-panel case-panel-wheel" data-reveal="panel">
        <Wheel spin={-0.8} className="case-result-wheel" />
      </div>
      <div className="case-panel case-panel-notice" data-reveal="panel">
        {image && (
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 1023px) 100vw, 90vw"
            className="case-photo"
            data-parallax="0.05"
          />
        )}
        <div className="notice" data-parallax="-0.1">
          <span className="notice-icon" aria-hidden="true" />
          <div>
            <p className="notice-app">{notification.app}</p>
            <p className="notice-text">{notification.text}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
