"use client";

import { gsap, Observer, useGSAP } from "@/lib/gsap";
import { getLoading } from "@/lib/loading";
import { cruise, setJourney, TRANSITION_SECONDS } from "@/lib/journey";
import { view } from "@/lib/projects";

const KEYS_NEXT = new Set(["ArrowDown", "PageDown", " "]);
const KEYS_PREV = new Set(["ArrowUp", "PageUp"]);
/** Snap scroll: every page is one gesture. Wheel, swipe, keys, links and the scrollbar all land on a page. */
export default function PageSnap() {
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

    let index = nearest();
    let busy = false;

    // Float page index: 1.5 is halfway between pages 1 and 2.
    const publishScroll = () => {
      const y = window.scrollY;
      let i = pages.length - 1;
      while (i > 0 && top(i) > y) i--;
      const end = i + 1 < pages.length ? top(i + 1) : top(i) + 1;
      setJourney(i + Math.min((y - top(i)) / (end - top(i)), 1));
    };

    const go = (to: number) => {
      const next = gsap.utils.clamp(0, pages.length - 1, to);
      if (busy || view.held || next === index || !getLoading().entered) return;
      const hops = Math.abs(next - index);
      busy = true;
      index = next;
      gsap.to(window, {
        scrollTo: { y: top(next), autoKill: false },
        duration: reduced.matches ? 0 : TRANSITION_SECONDS * hops,
        ease: cruise,
        onComplete: () => {
          // Swallow trackpad momentum before listening again.
          gsap.delayedCall(0.4, () => {
            busy = false;
          });
        },
      });
    };

    // Drags of the scrollbar and anything else that leaves between pages settle on the nearest one.
    const settle = () => {
      if (busy) return;
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
      if (KEYS_NEXT.has(e.key)) go(index + 1);
      else if (KEYS_PREV.has(e.key)) go(index - 1);
      else return;
      e.preventDefault();
    };

    const onLink = (e: MouseEvent) => {
      const link = e.target instanceof Element ? e.target.closest("a") : null;
      if (!link || link.target || e.defaultPrevented) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== "/") return;
      const id = url.hash.slice(1) || pages[0].id;
      const to = pages.findIndex(page => page.id === id);
      if (to < 0) return;
      e.preventDefault();
      go(to);
    };

    const onResize = () => {
      index = nearest();
      window.scrollTo(0, top(index));
    };

    window.history.scrollRestoration = "manual";
    window.scrollTo(0, top(index));
    publishScroll();

    const observer = Observer.create({
      type: "wheel,touch",
      wheelSpeed: -1,
      tolerance: 12,
      ignore: ".projects-index",
      preventDefault: true,
      onUp: () => go(index + 1),
      onDown: () => go(index - 1),
    });

    window.addEventListener("scroll", publishScroll, { passive: true });
    window.addEventListener("scrollend", settle);
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onLink, true);
    window.addEventListener("resize", onResize);
    return () => {
      observer.kill();
      window.removeEventListener("scroll", publishScroll);
      window.removeEventListener("scrollend", settle);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onLink, true);
      window.removeEventListener("resize", onResize);
    };
  });

  return null;
}
