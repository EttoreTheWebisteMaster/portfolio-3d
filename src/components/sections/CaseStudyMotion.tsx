"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { addEntrance } from "@/lib/fx";
import { gsap, SplitText, type SplitText as Split, useGSAP } from "@/lib/gsap";
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
import { view } from "@/lib/projects";

/** Plays the About landing on the case study: white-out → cream wall, the frame backing out and levelling, then the copy. */
export default function CaseStudyMotion({
  index,
}: Readonly<{ index: number }>) {
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
    // Going back, Projects opens on this one.
    view.index = index;
    // The journey left its scroll behind: the case study starts at its own top.
    window.scrollTo(0, 0);
    const frame = document.querySelector<HTMLElement>("[data-pull]");
    const items = gsap.utils.toArray<HTMLElement>("[data-fx]");
    // No loader here: the bars' lettering plays in with the page.
    root.dataset.in = "";
    delete root.dataset.blur;
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const splits: Split[] = [];
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
      const scenes = scrollScenes();
      return () => {
        scenes();
        splits.forEach(split => split.revert());
      };
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

/** The scenes below the hero move with the scroll: reveals as they arrive, parallax and the wheels while they are on screen. Returns its own cleanup. */
function scrollScenes() {
  const at = (el: Element, start = "top 82%") => ({
    trigger: el,
    start,
    toggleActions: "play none none reverse",
  });
  const splits: SplitText[] = [];
  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach(el => {
    const kind = el.dataset.reveal;
    if (kind === "up")
      gsap.fromTo(
        el,
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, duration: 1, scrollTrigger: at(el) }
      );
    else if (kind === "words") {
      // The sentence is read out as it scrolls in: each word lights up in turn.
      const split = SplitText.create(el, { type: "words", aria: "none" });
      splits.push(split);
      gsap.fromTo(
        split.words,
        { opacity: 0.14 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.1,
          scrollTrigger: {
            trigger: el,
            start: "top 78%",
            end: "bottom 42%",
            scrub: true,
          },
        }
      );
    } else if (kind === "stagger")
      gsap.fromTo(
        el.children,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.14,
          scrollTrigger: at(el, "top 90%"),
        }
      );
    else if (kind === "swatches")
      // Each colour rises off the floor in turn, like a card dealt onto a table.
      gsap.fromTo(
        el.children,
        { opacity: 0, y: 90, scaleY: 0.78 },
        {
          opacity: 1,
          y: 0,
          scaleY: 1,
          duration: 1.1,
          ease: "power4.out",
          stagger: 0.07,
          scrollTrigger: at(el, "top 88%"),
        }
      );
    else if (kind === "panel")
      gsap.fromTo(
        el,
        { opacity: 0, y: 70, scale: 0.94 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: at(el, "top 90%"),
        }
      );
  });
  // Slow drift at different speeds: the layers separate as you scroll.
  document.querySelectorAll<HTMLElement>("[data-parallax]").forEach(el => {
    const d = Number(el.dataset.parallax);
    gsap.fromTo(
      el,
      { yPercent: d * 100 },
      {
        yPercent: -d * 100,
        ease: "none",
        scrollTrigger: {
          trigger: el.parentElement ?? el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      }
    );
  });
  // The wheels turn with the scroll, one way or the other.
  document.querySelectorAll<HTMLElement>("[data-spin]").forEach(el => {
    gsap.fromTo(
      el,
      { rotation: 0 },
      {
        rotation: Number(el.dataset.spin) * 360,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      }
    );
  });
  return () => splits.forEach(split => split.revert());
}
