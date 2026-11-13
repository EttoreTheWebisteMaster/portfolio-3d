"use client";

import { useRef } from "react";

import { addEntrance } from "@/lib/fx";
import { scrollScenes } from "@/lib/caseScroll";
import { gsap, type SplitText as Split, useGSAP } from "@/lib/gsap";
import { LAND, LAND_SCALE, whenLanded } from "@/lib/caseMotion";
import { view } from "@/lib/projects";

/** The trailer is blurry for this long before it cuts to its still, in seconds after the landing. */
const SWAP_AT = 3;
/** The footage melts into its still over this many seconds. */
const SWAP_FADE = 1.2;

/** Plays the landing on the case study: the footage, blurred from the dive, clears to a soft mood while the hero copy comes out; later the trailer hands over to its still. */
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
      // The dive ended inside the screen: the footage comes out of that blur and bright light, slowing to rest while the copy comes out.
      const begin = LAND;
      // Everything is posed now, under the dive, and plays the moment the case study lands.
      const scale = gsap.fromTo(
        backdrop,
        { scale: LAND_SCALE },
        { scale: 1, duration: 2.6, ease: "power3.out", paused: true }
      );
      const soften = gsap.fromTo(
        backdrop,
        { "--trailer-blur": "22px", "--trailer-light": 1 },
        {
          "--trailer-blur": "9px",
          "--trailer-light": 0.5,
          duration: 2.4,
          ease: "power2.out",
          paused: true,
        }
      );
      const enter = gsap.timeline({ delay: begin, paused: true });
      items.forEach((el, i) => {
        const split = addEntrance(enter, el, i * 0.12);
        if (split) splits.push(split);
      });
      gsap.set(items, { visibility: "visible" });
      // Opened or loaded: the footage plays on from the Projects frame, soft enough that nobody can tell frame from photo, the footage melts into the project's still and stops.
      let cut: gsap.core.Tween | null = null;
      // Every opening is the same: the footage first, the still only after its time.
      if (poster) gsap.set(poster, { opacity: 0 });
      if (video) delete video.dataset.parked;
      const stopWait = whenLanded(() => {
        scale.play();
        soften.play();
        enter.play();
        if (poster && video)
          cut = gsap.to(poster, {
            opacity: 1,
            duration: SWAP_FADE,
            ease: "sine.inOut",
            delay: begin + SWAP_AT,
            onComplete: () => {
              video.dataset.parked = "";
              video.pause();
            },
          });
      });
      const scenes = scroller ? scrollScenes(scroller) : () => {};
      return () => {
        stopWait();
        cut?.kill();
        scenes();
        splits.forEach(split => split.revert());
      };
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(backdrop, { "--trailer-blur": "9px", "--trailer-light": 0.5 });
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
