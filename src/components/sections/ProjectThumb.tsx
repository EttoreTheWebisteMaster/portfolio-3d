import Image from "next/image";
import type { Ref } from "react";

type Props = {
  ref: Ref<HTMLElement>;
  title: string;
  discipline: string;
  image?: string;
  on: boolean;
};

/** The card that floats beside the cursor over the programme index. Positioned by the panel. */
export default function ProjectThumb({
  ref,
  title,
  discipline,
  image,
  on,
}: Readonly<Props>) {
  return (
    <figure
      ref={ref}
      className="projects-thumb"
      data-on={on ? "" : undefined}
      aria-hidden="true"
    >
      {image ? (
        <Image src={image} alt="" fill sizes="224px" className="img" />
      ) : (
        <span className="t">{title}</span>
      )}
      <figcaption className="d">{discipline}</figcaption>
    </figure>
  );
}
