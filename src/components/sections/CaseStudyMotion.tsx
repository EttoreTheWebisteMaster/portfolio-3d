"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { addEntrance } from "@/lib/fx";
import { gsap, type SplitText, useGSAP } from "@/lib/gsap";
import { ease } from "@/lib/journey";
import {
  PULL,
  cover,
  HOLD,
  SOFTEN,
  pullEase,
  markReturn,
  leaveCaseStudy,
  setFlare,
} from "@/lib/caseStudy";
import { PAGES } from "@/lib/pages";

/** Plays the About landing on the case study: white-out → cream wall, the frame backing out and levelling, then the copy. */
export default function CaseStudyMotion() {
  const router = useRouter();

  // Leaving for a journey page by a link or a button plays the landing in reverse first; the browser's Back cannot wait, so the journey page plays its half alone.
  useEffect(() => {
    const isJourney = (path: string) => PAGES.some(page => page.path === path);
    const onClick = (e: MouseEvent) => {
      const link = e.target instanceof Element ? e.target.closest("a") : null;
      if (!link || link.target || e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || !isJourney(url.pathname))
        return;
      e.preventDefault();
      leaveCaseStudy(() => router.push(url.pathname));
    };
    const onPop = () => {
      if (isJourney(window.location.pathname)) markReturn();
    };
    window.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
    };
  }, [router]);

  useGSAP(() => {
    const root = document.documentElement;
    // The journey left its scroll behind: the case study starts at its own top.
    window.scrollTo(0, 0);
    const frame = document.querySelector<HTMLElement>("[data-pull]");
    const items = gsap.utils.toArray<HTMLElement>("[data-fx]");
    // No loader here: the bars' lettering plays in with the page.
    root.dataset.in = "";
    delete root.dataset.blur;
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const splits: SplitText[] = [];
      const white = { f: 1 };
      setFlare(1);
      gsap.to(white, {
        f: 0,
        delay: HOLD,
        duration: SOFTEN,
        ease,
        onUpdate: () => setFlare(white.f),
      });
      // The screen starts out filling the viewport, under the white-out, and settles into its frame.
      if (frame) {
        gsap.set(frame, { clearProps: "transform" });
        gsap.fromTo(frame, cover(frame), {
          x: 0,
          y: 0,
          scale: 1,
          rotate: 0,
          duration: PULL,
          ease: pullEase,
        });
      }
      const enter = gsap.timeline({ delay: HOLD + SOFTEN + 0.3 });
      items.forEach((el, i) => {
        const split = addEntrance(enter, el, i * 0.12);
        if (split) splits.push(split);
      });
      gsap.set(items, { visibility: "visible" });
      return () => splits.forEach(split => split.revert());
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      setFlare(0);
      gsap.set(items, { visibility: "visible" });
      // No autoplaying loop for visitors who asked for less motion: the poster stays, "Play trailer" starts it.
      document.querySelector<HTMLVideoElement>("[data-pull] video")?.pause();
    });

    return () => {
      mm.revert();
      setFlare(0);
    };
  });

  return null;
}
