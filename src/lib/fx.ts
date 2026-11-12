import { type gsap, SplitText } from "@/lib/gsap";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Mask-split copy rise used by every page entrance. */
export const RISE = 110;

/**
 * Adds one marked element's entrance to `enter` at `at`: items lift and fade; titles and text rise out of a mask,
 * and titles also decode. Returns the split (null for items) so the caller can revert it and build a matching exit.
 * `kind` defaults to the element's `data-fx`; a scene that is not an entrance can ask for one by name.
 */
export function addEntrance(
  enter: gsap.core.Timeline,
  el: HTMLElement,
  at: number,
  kind = el.dataset.fx,
  from: "below" | "left" = "below"
) {
  // From the left, the way he walks in: copy slides in from behind its mask, left to right.
  const left = from === "left";
  if (kind === "item") {
    enter.fromTo(
      el,
      { opacity: 0, ...(left ? { x: -64 } : { y: 28 }), scale: 0.97 },
      {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.7,
        ease: "power3.out",
      },
      at
    );
    return null;
  }
  const split = SplitText.create(el, {
    type: "lines",
    mask: "lines",
    // No aria-label on the block: a label on a plain paragraph is invalid, and the lines already read as the text.
    aria: "none",
  });
  enter.fromTo(
    split.lines,
    {
      ...(left ? { xPercent: -RISE } : { yPercent: RISE }),
      skewY: kind === "title" ? 8 : 0,
      opacity: 0,
    },
    {
      xPercent: 0,
      yPercent: 0,
      skewY: 0,
      opacity: 1,
      duration: 0.9,
      ease: "power4.out",
      stagger: 0.1,
    },
    at
  );
  if (kind === "title")
    split.lines.forEach((line, n) => {
      const text = line.textContent ?? "";
      enter.fromTo(
        line,
        { scrambleText: { text: "", chars: CHARS } },
        {
          scrambleText: { text, chars: CHARS, speed: 0.7, revealDelay: 0.25 },
          duration: 0.9,
          ease: "none",
        },
        at + n * 0.1
      );
    });
  return split;
}
