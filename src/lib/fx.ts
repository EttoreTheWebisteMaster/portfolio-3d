import { type gsap, SplitText } from "@/lib/gsap";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Mask-split copy rise used by every page entrance. */
export const RISE = 110;

/**
 * Adds one marked element's entrance to `enter` at `at`: items lift and fade; titles and text rise out of a mask,
 * and titles also decode. Returns the split (null for items) so the caller can revert it and build a matching exit.
 */
export function addEntrance(
  enter: gsap.core.Timeline,
  el: HTMLElement,
  at: number
) {
  const kind = el.dataset.fx;
  if (kind === "item") {
    enter.fromTo(
      el,
      { opacity: 0, y: 28, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "power3.out" },
      at
    );
    return null;
  }
  const split = SplitText.create(el, { type: "lines", mask: "lines" });
  enter.fromTo(
    split.lines,
    { yPercent: RISE, skewY: kind === "title" ? 8 : 0, opacity: 0 },
    {
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
