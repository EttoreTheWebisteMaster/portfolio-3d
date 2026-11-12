"use client";

import { useRef } from "react";

import { addEntrance } from "@/lib/fx";
import { scrollScenes } from "@/lib/caseScroll";
import { gsap, type SplitText as Split, useGSAP } from "@/lib/gsap";
import { HOLD, SOFTEN } from "@/lib/caseStudy";
import { view } from "@/lib/projects";

/** The trailer is blurry for this long before its still takes over, in seconds after the landing. */
const SWAP_AT = 2;
const SWAP_FOR = 2.6;

/** Plays the landing on the case study: the white softens into the room, then the hero copy; later the trailer hands over to its still. */
export default function CaseStudyMotion({
  index,
}: Readonly<{ index: number }>) {
  const mark = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    // Going back, Projects opens on this one.
    view.index = index;
    const scroller = mark.current?.closest<HTMLElement>("[data-case-scroll]");
    // Only this overlay's own marks: the pages behind carry `data-fx` too, and are not ours to touch.
    const within = <T extends Element>(selector: string) =>
      Array.from(scroller?.querySelectorAll<T>(selector) ?? []);
    const items = within<HTMLElement>("[data-fx]");
    const video = within<HTMLVideoElement>("[data-trailer] video")[0];
    const poster = within<HTMLElement>("[data-poster]")[0];
    const backdrop = within<HTMLElement>("[data-trailer]");
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const splits: Split[] = [];
      // The trailer settles out of a slow push-in while the white lifts; the copy follows as the room comes up.
      gsap.fromTo(
        backdrop,
        { scale: 1.14, opacity: 0.4 },
        { scale: 1, opacity: 1, duration: 2.2, ease: "power2.out" }
      );
      // Once the copy is in, the trailer slowly goes soft so it stays a mood, not the subject.
      const begin = HOLD + SOFTEN * 0.45;
      gsap.fromTo(
        backdrop,
        { "--trailer-blur": "0px" },
        { "--trailer-blur": "9px", duration: 4.5, delay: begin, ease: "none" }
      );
      // Soft enough that nobody can tell frame from photo, the project's still fades in over the footage and the footage stops.
      if (poster && video)
        gsap.to(poster, {
          opacity: 1,
          delay: begin + SWAP_AT,
          duration: SWAP_FOR,
          ease: "none",
          onComplete: () => {
            video.dataset.parked = "";
            video.pause();
          },
        });
      const enter = gsap.timeline({ delay: begin });
      items.forEach((el, i) => {
        const split = addEntrance(enter, el, i * 0.12);
        if (split) splits.push(split);
      });
      gsap.set(items, { visibility: "visible" });
      const scenes = scroller ? scrollScenes(scroller) : () => {};
      return () => {
        scenes();
        splits.forEach(split => split.revert());
      };
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(backdrop, { "--trailer-blur": "9px" });
      gsap.set(items, { visibility: "visible" });
      // No autoplaying loop for visitors who asked for less motion: the still stays, "Play trailer" starts the footage.
      if (poster) gsap.set(poster, { opacity: 1 });
      within<HTMLVideoElement>(
        "[data-trailer] video, .case-media video"
      ).forEach(el => {
        el.dataset.parked = "";
        el.pause();
      });
    });

    return () => mm.revert();
  });

  return <span ref={mark} hidden />;
}
