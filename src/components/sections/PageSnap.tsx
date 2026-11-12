"use client";

import { useRef } from "react";

import { diveState, surface, takeReturn, DIVE_SECONDS } from "@/lib/caseStudy";
import { gsap, Observer, useGSAP } from "@/lib/gsap";
import { getLoading } from "@/lib/loading";
import { cruise, journey, setJourney, travelSeconds } from "@/lib/journey";
import { PAGES } from "@/lib/pages";
import { view } from "@/lib/projects";

const KEYS_NEXT = new Set(["ArrowDown", "PageDown", " "]);
const KEYS_PREV = new Set(["ArrowUp", "PageUp"]);
/** Snap scroll: every page is one gesture. Wheel, swipe, keys, links and the scrollbar all land on a page. */
export default function PageSnap() {
  const veil = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const pages = gsap.utils.toArray<HTMLElement>("[data-page]");
    if (pages.length === 0) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const top = (i: number) => pages[i].offsetTop;
    const nearest = () =>
      pages.reduce(
        (best, _, i) =>
          Math.abs(top(i) - window.scrollY) <
          Math.abs(top(best) - window.scrollY)
            ? i
            : best,
        0
      );

    // The URL says which page to land on: /about opens on About, Back from a case study opens on Projects.
    const pathIndex = (path: string) =>
      PAGES.findIndex(
        page =>
          page.path === path.replace(/\/$/, "") ||
          (page.path === "/" && path === "/")
      );
    const landed = pathIndex(window.location.pathname);
    let index = landed >= 0 ? landed : nearest();
    let busy = false;

    // Keeps the address bar on the page the visitor is on. Link clicks add a history entry, scrolling only replaces one.
    const setUrl = (i: number, push: boolean) => {
      const path = PAGES[i].path;
      if (window.location.pathname === path) return;
      window.history[push ? "pushState" : "replaceState"](null, "", path);
    };

    // Float page index: 1.5 is halfway between pages 1 and 2.
    const publishScroll = () => {
      const y = window.scrollY;
      let i = pages.length - 1;
      while (i > 0 && top(i) > y) i--;
      const end = i + 1 < pages.length ? top(i + 1) : top(i) + 1;
      setJourney(i + Math.min((y - top(i)) / (end - top(i)), 1));
    };

    // Swallow trackpad momentum before listening again.
    const release = () =>
      gsap.delayedCall(0.4, () => {
        busy = false;
      });

    // Skipping pages: no travel through the pages in between. The veil comes up, the cut happens under it, the new page lifts out.
    const cut = (next: number) => {
      const target = pages[next];
      const land = () => {
        window.scrollTo(0, top(next));
        publishScroll();
      };
      if (reduced.matches || !veil.current) {
        land();
        busy = false;
        return;
      }
      gsap
        .timeline({ onComplete: release })
        .to(veil.current, { opacity: 0.94, duration: 0.3, ease: "power2.in" })
        .call(land)
        .fromTo(
          target,
          { opacity: 0, scale: 1.04 },
          { opacity: 1, scale: 1, duration: 0.7, ease: "power3.out" },
          ">"
        )
        .to(
          veil.current,
          { opacity: 0, duration: 0.6, ease: "power2.out" },
          "<"
        )
        .set(target, { clearProps: "opacity,scale" });
    };

    const go = (to: number, push = false) => {
      const next = gsap.utils.clamp(0, pages.length - 1, to);
      if (busy || view.held || next === index || !getLoading().entered) return;
      const from = index;
      busy = true;
      index = next;
      setUrl(next, push);
      if (Math.abs(next - from) > 1) {
        cut(next);
        return;
      }
      gsap.to(window, {
        scrollTo: { y: top(next), autoKill: false },
        duration: reduced.matches ? 0 : travelSeconds(from, next),
        ease: cruise,
        onComplete: release,
      });
    };

    // Drags of the scrollbar and anything else that leaves between pages settle on the nearest one.
    const settle = () => {
      if (busy || view.held) return;
      index = nearest();
      if (Math.abs(top(index) - window.scrollY) > 1)
        gsap.to(window, {
          scrollTo: { y: top(index), autoKill: false },
          duration: 0.8,
          ease: "power2.out",
        });
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target !== document.body) return;
      const dir = KEYS_NEXT.has(e.key) ? 1 : KEYS_PREV.has(e.key) ? -1 : 0;
      if (dir === 0) return;
      e.preventDefault();
      go(index + dir);
    };

    const onLink = (e: MouseEvent) => {
      const link = e.target instanceof Element ? e.target.closest("a") : null;
      if (!link || link.target || e.defaultPrevented) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const to = pathIndex(url.pathname);
      if (to < 0) return;
      e.preventDefault();
      go(to, true);
    };

    // Back and forward between journey pages play the same move as a link.
    const onPop = () => {
      const to = pathIndex(window.location.pathname);
      if (to < 0) return;
      busy = false;
      go(to);
    };

    // Resizing keeps the journey where it is: the position is re-applied to the new page heights.
    const onResize = () => {
      const j = journey.current;
      const at = Math.floor(j);
      if (j > at && at + 1 < pages.length) {
        window.scrollTo(0, top(at) + (j - at) * (top(at + 1) - top(at)));
        return;
      }
      index = nearest();
      window.scrollTo(0, top(index));
    };

    window.history.scrollRestoration = "manual";
    window.scrollTo(0, top(index));
    publishScroll();

    // Back from a case study: the dive played in reverse. It starts inside the white-out and pulls out to Projects.
    diveState.v = 0;
    if (takeReturn() && index === 1 && !reduced.matches) {
      busy = true;
      diveState.v = 1;
      gsap.to(diveState, {
        v: 0,
        duration: DIVE_SECONDS,
        delay: 0.6,
        ease: surface,
        onComplete: release,
      });
    }

    const observer = Observer.create({
      type: "wheel,touch",
      wheelSpeed: -1,
      tolerance: 12,
      ignore: ".projects-index, .about-ask",
      preventDefault: true,
      // Delta is negative towards the next page, for the wheel and for a swipe.
      onChange: self => {
        const d = -self.deltaY;
        if (d > 12) go(index + 1);
        else if (d < -12) go(index - 1);
      },
    });

    window.addEventListener("scroll", publishScroll, { passive: true });
    window.addEventListener("scrollend", settle);
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onLink, true);
    window.addEventListener("resize", onResize);
    window.addEventListener("popstate", onPop);
    return () => {
      observer.kill();
      window.removeEventListener("scroll", publishScroll);
      window.removeEventListener("scrollend", settle);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onLink, true);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("popstate", onPop);
    };
  });

  return <div ref={veil} aria-hidden="true" className="veil" />;
}
