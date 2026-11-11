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
/** Wheel / swipe pixels one full Projects → About shot takes, and seconds a key press takes to play it. */
const SHOT_PX = { wide: 3400, narrow: 1800 };
const SHOT_SECONDS = { wide: 9, narrow: 6 };
/** Projects and About are the two ends of the shot. */
const SHOT = [1, 2] as const;
const isShot = (a: number, b: number) =>
  Math.min(a, b) === SHOT[0] && Math.max(a, b) === SHOT[1];
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

    const go = (to: number, push = false, hard = false) => {
      const next = gsap.utils.clamp(0, pages.length - 1, to);
      if (busy || view.held || next === index || !getLoading().entered) return;
      const from = index;
      busy = true;
      index = next;
      setUrl(next, push);
      // Links, deep links and reduced motion cut between Projects and About; only scrolling plays the walk.
      if (
        Math.abs(next - from) > 1 ||
        (isShot(from, next) && (hard || reduced.matches))
      ) {
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
      if (busy || view.held || inShot()) return;
      index = nearest();
      if (Math.abs(top(index) - window.scrollY) > 1)
        gsap.to(window, {
          scrollTo: { y: top(index), autoKill: false },
          duration: 0.8,
          ease: "power2.out",
        });
    };

    // The walk-out: wheel, swipe and keys move the scroll between Projects and About a little at a time, so it plays at the hand's speed, forwards and back.
    const narrow = () => window.matchMedia("(max-width: 767px)").matches;
    const span = () => top(SHOT[1]) - top(SHOT[0]);
    const progress = () => (window.scrollY - top(SHOT[0])) / span();
    const inShot = () => {
      const p = progress();
      return p > 0.0005 && p < 0.9995;
    };
    // A gesture belongs to the shot when it is inside it, or starts at one end and heads in.
    const shotGesture = (d: number) => {
      if (reduced.matches || busy || view.held || !getLoading().entered)
        return false;
      const p = progress();
      return (
        inShot() ||
        (Math.abs(p) <= 0.0005 && d > 0 && index === SHOT[0]) ||
        (Math.abs(p - 1) <= 0.0005 && d < 0 && index === SHOT[1])
      );
    };
    let snap: gsap.core.Tween | null = null;
    const toEnd = (
      end: 0 | 1,
      seconds: number,
      ease: gsap.EaseString | gsap.EaseFunction = cruise
    ) => {
      snap?.kill();
      index = SHOT[end];
      setUrl(index, false);
      snap = gsap.to(window, {
        scrollTo: { y: top(SHOT[0]) + end * span(), autoKill: false },
        duration: seconds,
        ease,
      });
    };
    // Never stop mid-shot: let go and it eases to the nearer end.
    let restTimer = 0;
    const rest = () => {
      window.clearTimeout(restTimer);
      restTimer = window.setTimeout(() => {
        if (!inShot()) return;
        const end = progress() >= 0.5 ? 1 : 0;
        toEnd(end, 0.9 * Math.abs(end - progress()) + 0.25);
      }, 160);
    };
    // Reaching an end of the shot ends that gesture: the same flick must not carry on into the next page.
    let spent = false;
    let lastEvent = 0;
    const scrub = (d: number) => {
      snap?.kill();
      const y = gsap.utils.clamp(
        top(SHOT[0]),
        top(SHOT[1]),
        window.scrollY + (d * span()) / SHOT_PX[narrow() ? "narrow" : "wide"]
      );
      window.scrollTo(0, y);
      index = progress() >= 0.5 ? SHOT[1] : SHOT[0];
      setUrl(index, false);
      rest();
      if ((d > 0 && progress() >= 0.9995) || (d < 0 && progress() <= 0.0005)) {
        spent = true;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target !== document.body) return;
      const dir = KEYS_NEXT.has(e.key) ? 1 : KEYS_PREV.has(e.key) ? -1 : 0;
      if (dir === 0) return;
      e.preventDefault();
      // The keys play the shot at its own constant speed; another key press turns it round.
      if (shotGesture(dir) && !reduced.matches) {
        const end = dir > 0 ? 1 : 0;
        toEnd(
          end,
          SHOT_SECONDS[narrow() ? "narrow" : "wide"] *
            Math.abs(end - progress()),
          "none"
        );
      } else go(index + dir);
    };

    const onLink = (e: MouseEvent) => {
      const link = e.target instanceof Element ? e.target.closest("a") : null;
      if (!link || link.target || e.defaultPrevented) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const to = pathIndex(url.pathname);
      if (to < 0) return;
      e.preventDefault();
      go(to, true, true);
    };

    // Back and forward between journey pages play the same move as a link.
    const onPop = () => {
      const to = pathIndex(window.location.pathname);
      if (to < 0) return;
      busy = false;
      go(to, false, true);
    };

    // Resizing keeps the shot where it is: the journey position is re-applied to the new page heights.
    const onResize = () => {
      const j = journey.current;
      const at = Math.floor(j);
      if (j > SHOT[0] && j < SHOT[1]) {
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
        const now = performance.now();
        // A flick that reached an end is spent: it ends only after a quiet moment.
        if (spent && now - lastEvent > 250) spent = false;
        lastEvent = now;
        if (spent) return;
        if (shotGesture(d)) scrub(d);
        else if (d > 12) go(index + 1);
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
      window.clearTimeout(restTimer);
      snap?.kill();
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
