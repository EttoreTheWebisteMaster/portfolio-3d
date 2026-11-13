"use client";

import { useRef } from "react";

import { caseState, diveState } from "@/lib/caseMotion";
import { gsap, Observer, useGSAP } from "@/lib/gsap";
import { getLoading } from "@/lib/loading";
import {
  cruise,
  journey,
  scrub,
  setJourney,
  travelSeconds,
} from "@/lib/journey";
import { PAGES } from "@/lib/pages";
import { view } from "@/lib/projects";

const KEYS_NEXT = new Set(["ArrowDown", "PageDown", " "]);
const KEYS_PREV = new Set(["ArrowUp", "PageUp"]);
/** Home keeps the site's own title; the other pages follow the `Page · Ettore Serra` pattern their routes use. */
const HOME_TITLE = "Ettore Serra · Designer & engineer";
/** A pause this long between wheel events means a new gesture, not the tail of the last one's momentum. */
const GESTURE_GAP_MS = 150;
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
    // A case study is a layer over Projects: opened from a link, it lands on that page.
    const landed = window.location.pathname.startsWith("/projects/")
      ? 1
      : pathIndex(window.location.pathname);
    let index = landed >= 0 ? landed : nearest();
    let busy = false;

    const retitle = (i: number) => {
      document.title =
        i === 0 ? HOME_TITLE : `${PAGES[i].label} · Ettore Serra`;
    };

    // Keeps the address bar on the page the visitor is on. Link clicks add a history entry, scrolling only replaces one.
    const setUrl = (i: number, push: boolean) => {
      const path = PAGES[i].path;
      retitle(i);
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

    // A move in flight: a new one replaces it, so two never fight over the scroll.
    let hold: gsap.core.Tween | null = null;
    let cutTl: gsap.core.Timeline | null = null;
    const stop = () => {
      hold?.kill();
      hold = null;
      cutTl?.kill();
      cutTl = null;
      gsap.killTweensOf(window);
      if (veil.current) gsap.set(veil.current, { opacity: 0 });
    };

    // Swallow trackpad momentum before listening again, and give the keyboard back a place to be.
    const release = () => {
      hold?.kill();
      hold = gsap.delayedCall(0.4, () => {
        busy = false;
        delete document.documentElement.dataset.to;
        if (document.activeElement === document.body) {
          const page = pages[index];
          page.tabIndex = -1;
          page.focus({ preventScroll: true });
        }
      });
    };

    // Skipping pages: no travel through the pages in between. The veil comes up, the cut happens under it, the new page lifts out.
    const cut = (next: number) => {
      const target = pages[next];
      const land = () => {
        window.scrollTo(0, top(next));
        publishScroll();
      };
      if (reduced.matches || !veil.current) {
        land();
        release();
        return;
      }
      cutTl = gsap
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

    const go = (to: number, push = false, instant = false) => {
      const next = gsap.utils.clamp(0, pages.length - 1, to);
      if (
        busy ||
        scrub.on ||
        view.held ||
        caseState.open ||
        next === index ||
        !getLoading().entered
      )
        return;
      const from = index;
      busy = true;
      index = next;
      // The nav link of the page being travelled to lights up at once and stays lit, even if the pointer has already left it.
      document.documentElement.dataset.to = PAGES[next].label.toLowerCase();
      setUrl(next, push);
      if (instant || Math.abs(next - from) > 1) {
        cut(next);
        return;
      }
      gsap.killTweensOf(window);
      gsap.to(window, {
        scrollTo: { y: top(next), autoKill: false },
        duration: reduced.matches ? 0 : travelSeconds(from, next),
        ease: cruise,
        onComplete: release,
      });
    };

    // Drags of the scrollbar and anything else that leaves between pages settle on the nearest one.
    const settle = () => {
      if (busy || scrub.on || view.held || caseState.open) return;
      index = nearest();
      if (Math.abs(top(index) - window.scrollY) > 1)
        gsap.to(window, {
          scrollTo: { y: top(index), autoKill: false },
          duration: 0.8,
          ease: "power2.out",
        });
    };

    const onKey = (e: KeyboardEvent) => {
      if (caseState.open || scrub.on) return;
      // Typing and the controls that own the arrows keep them; everywhere else the keys turn the page.
      if (
        e.target instanceof HTMLElement &&
        e.target !== document.body &&
        (e.key === " " ||
          e.target.isContentEditable ||
          e.target.closest(
            "input, textarea, select, [role=listbox], .menu-overlay"
          ))
      )
        return;
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
      // From a case study every journey link first closes it, then goes where it was pointing.
      if (caseState.open) {
        if (!caseState.closing)
          caseState.close(to === index ? undefined : () => go(to, true));
        return;
      }
      // The page already shown, or the one a move in flight is heading for: nothing to do, the move finishes on its own.
      if (to === index) return;
      // Mid-move, a link takes over at once: the move in flight is dropped and the page cuts straight to the new one.
      const moving = gsap.isTweening(window) || !!cutTl?.isActive();
      if (busy) {
        stop();
        busy = false;
      }
      go(to, true, moving);
    };

    // Back and forward between journey pages play the same move as a link.
    const onPop = () => {
      // A case study closing under a drag of the timecode: the visitor chooses where to land.
      if (scrub.on) return;
      const to = pathIndex(window.location.pathname);
      if (to < 0) return;
      retitle(to);
      stop();
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

    diveState.v = 0;

    // Wheel and touch over a scrolling box belong to the box: they never reach the page snapper, so the list scrolls freely.
    // (The observer's own `ignore` resolves its elements once, so a list that mounts later was left out.)
    const OWN = ".projects-index, .about-ask, .menu-overlay";
    const box = (e: Event) =>
      e.target instanceof Element ? e.target.closest<HTMLElement>(OWN) : null;
    const keep = (e: Event) => {
      if (box(e)) e.stopPropagation();
    };
    // The wheel scrolls the box itself, so it moves whatever else is listening on the page.
    const spin = (e: WheelEvent) => {
      const el = box(e);
      if (!el) return;
      e.stopPropagation();
      if (el.scrollHeight <= el.clientHeight) return;
      const unit =
        e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1;
      el.scrollTop += e.deltaY * unit;
      e.preventDefault();
    };
    const GESTURES = ["touchstart", "touchmove", "touchend"] as const;
    GESTURES.forEach(type =>
      window.addEventListener(type, keep, { capture: true, passive: true })
    );
    window.addEventListener("wheel", spin, { capture: true, passive: false });

    let lastWheel = 0;
    let momentum = false;
    const observer = Observer.create({
      type: "wheel,touch",
      wheelSpeed: -1,
      tolerance: 12,
      ignore: OWN,
      preventDefault: true,
      // Delta is negative towards the next page, for the wheel and for a swipe.
      onChange: self => {
        const now = performance.now();
        // Events that arrive while a move is running, or keep streaming after it, are the trackpad's momentum: they never turn another page.
        if (busy) momentum = true;
        else if (now - lastWheel > GESTURE_GAP_MS) momentum = false;
        lastWheel = now;
        if (momentum) return;
        const d = -self.deltaY;
        if (d > 12) go(index + 1);
        else if (d < -12) go(index - 1);
      },
    });

    // `ignore` resolves its elements once, when the observer is made, and the case study opens later: while it is open the observer simply steps aside, so the wheel and swipes scroll the case study.
    const stepAside = () => {
      const aside = caseState.open || scrub.on;
      if (aside === observer.isEnabled) {
        if (aside) observer.disable();
        else observer.enable();
      }
    };
    gsap.ticker.add(stepAside);

    // The timecode scrubber: a drag takes the moves over; on release the site settles on the nearest page.
    scrub.start = () => {
      stop();
      busy = false;
      scrub.on = true;
    };
    scrub.end = () => {
      scrub.on = false;
      index = nearest();
      setUrl(index, false);
      gsap.to(window, {
        scrollTo: { y: top(index), autoKill: false },
        duration: reduced.matches ? 0 : 0.8,
        ease: "power2.out",
        onComplete: release,
      });
    };

    window.addEventListener("scroll", publishScroll, { passive: true });
    window.addEventListener("scrollend", settle);
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onLink, true);
    window.addEventListener("resize", onResize);
    window.addEventListener("popstate", onPop);
    return () => {
      scrub.on = false;
      scrub.start = () => {};
      scrub.end = () => {};
      delete document.documentElement.dataset.to;
      gsap.ticker.remove(stepAside);
      hold?.kill();
      observer.kill();
      GESTURES.forEach(type =>
        window.removeEventListener(type, keep, { capture: true })
      );
      window.removeEventListener("wheel", spin, { capture: true });
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
