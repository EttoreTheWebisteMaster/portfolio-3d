"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  abandonDive,
  caseState,
  diveState,
  hush,
  land,
  LAND_SCALE,
  retreatFromCase,
  whenLanded,
} from "@/lib/caseStudy";
import { gsap } from "@/lib/gsap";
import { ease, seg } from "@/lib/journey";

let shells = 0;

/** What leaves first when the case study closes: all its text and its X. */
const LEAVING =
  ".case-scene, .case-copy, .case-chapters, .case-next, .case-close";

/** Seconds the case study takes to blur and zoom into the screen on its way out. */
const LEAVE = 0.25;

/**
 * The case study as a layer over Projects. It owns the landing, the way out (Esc, the corner X, any link to another page)
 * and the hand-off with the page behind: the bottom bar hides, the journey stops, and closing plays the dive backwards.
 */
export default function CaseShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const scroll = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    shells++;
    caseState.open = true;
    caseState.shown = true;
    // A reopened case study starts at the top.
    if (scroll.current) scroll.current.scrollTop = 0;
    scroll.current?.focus({ preventScroll: true });

    // Next keeps a closed case study alive, hidden: a reopened one starts again, whole.
    gsap.set(root.current, { clearProps: "visibility,opacity" });
    gsap.set(root.current?.querySelectorAll(LEAVING) ?? [], {
      clearProps: "opacity",
    });
    gsap.set(scroll.current, { clearProps: "scale" });

    // Opened from the programme, the overlay mounts while the dive is still flying and stays unseen under it: it dissolves in
    // over the last of the dive, which has by then framed the screen exactly as the footage lands, and then it is the picture.
    if (caseState.diving) gsap.set(root.current, { opacity: 0 });
    const fade = () => {
      gsap.set(root.current, { opacity: seg(diveState.v, [0.88, 1]) });
      if (diveState.v >= 1) land();
    };
    if (caseState.diving) gsap.ticker.add(fade);
    // The top bar comes back with the landing; the programme behind stays away until the case study has closed.
    const stopWait = whenLanded(() => {
      gsap.ticker.remove(fade);
      gsap.set(root.current, { clearProps: "opacity" });
      delete html.dataset.hushBar;
    });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const leave = (after?: () => void) => {
      // Mid-dive the overlay is not on the screen yet: nothing to close.
      if (caseState.closing || caseState.diving) return;
      caseState.closing = true;
      caseState.after = after ?? null;
      const finish = () => {
        // The overlay is gone; the camera backs out of the screen, which is waiting under it.
        gsap.set(root.current, { visibility: "hidden" });
        retreatFromCase(() => router.push("/projects", { scroll: false }));
      };
      if (reduced.matches) {
        gsap.set(root.current, { visibility: "hidden" });
        diveState.v = 0;
        caseState.held = false;
        hush(false);
        router.push("/projects", { scroll: false });
        return;
      }
      // The case study's text and bars go first; the zoom into the screen keeps its own timing.
      // The programme behind stays away from the first frame of the way out, however the case study was opened.
      hush(true);
      gsap
        .timeline({ onComplete: finish })
        .to(root.current?.querySelectorAll(LEAVING) ?? [], {
          opacity: 0,
          duration: 0.35,
          ease: "none",
        })
        // The footage goes soft and bright as the page zooms and dissolves into the blurred screen behind it.
        .to(
          root.current?.querySelectorAll("[data-trailer]") ?? [],
          {
            "--trailer-blur": "22px",
            "--trailer-light": 1,
            scale: LAND_SCALE,
            duration: LEAVE,
            ease,
          },
          "<0.1"
        )
        .to(root.current, { opacity: 0, duration: LEAVE, ease }, ">-0.1");
    };
    caseState.close = leave;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      leave();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      gsap.ticker.remove(fade);
      stopWait();
      shells--;
      // Another case study mounts in the same commit when one links to the next: only a real exit resets the page behind.
      window.setTimeout(() => {
        if (shells > 0) return;
        const { closing, after } = caseState;
        caseState.open = false;
        caseState.shown = false;
        abandonDive();
        caseState.closing = false;
        caseState.after = null;
        caseState.close = () => {};
        // Left by the browser's Back rather than the X: the camera still backs out of the screen.
        if (!closing) retreatFromCase();
        else after?.();
      }, 0);
    };
  }, [router]);

  return (
    <div
      ref={root}
      className="case-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Case study"
    >
      <div ref={scroll} className="case-scroll" data-case-scroll tabIndex={-1}>
        {children}
      </div>
      <button
        type="button"
        className="case-close"
        aria-label="Close case study"
        onClick={() => caseState.close()}
      >
        <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M2 2l10 10M12 2 2 12"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      </button>
    </div>
  );
}
