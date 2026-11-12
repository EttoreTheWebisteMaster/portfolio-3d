"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  caseState,
  diveState,
  HOLD,
  hush,
  retreatFromCase,
  SOFTEN,
} from "@/lib/caseStudy";
import { gsap } from "@/lib/gsap";
import { ease } from "@/lib/journey";

let shells = 0;

/** What leaves first when the case study closes: all its text and its X. */
const LEAVING =
  ".case-scene, .case-copy, .case-chapters, .case-next, .case-close";

/** Seconds the case study takes to zoom into the white on its way out. */
const LEAVE = 0.25;

/**
 * The case study as a layer over Projects. It owns the white landing flash, the way out (Esc, the corner X, any link to another page)
 * and the hand-off with the page behind: the bottom bar hides, the journey stops, and closing plays the dive backwards.
 */
export default function CaseShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    shells++;
    caseState.open = true;
    scroll.current?.focus({ preventScroll: true });

    // Next keeps a closed case study alive, hidden: a reopened one starts from the white again, whole.
    gsap.set(root.current, { clearProps: "visibility" });
    gsap.set(root.current?.querySelectorAll(LEAVING) ?? [], {
      clearProps: "opacity",
    });
    // The top bar comes back with the landing; the programme behind stays away until the case study has closed.
    delete html.dataset.hushBar;
    gsap.set(scroll.current, { clearProps: "scale" });
    gsap.set(flash.current, { opacity: 1 });
    const landing = gsap.matchMedia();
    landing.add("(prefers-reduced-motion: no-preference)", () => {
      // Each case study lands out of the white; the flash is the overlay's own so it never fights the 3D rig's.
      gsap.to(flash.current, {
        opacity: 0,
        delay: HOLD,
        duration: SOFTEN,
        ease,
      });
    });
    landing.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(flash.current, { opacity: 0 });
    });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const leave = (after?: () => void) => {
      if (caseState.closing) return;
      caseState.closing = true;
      caseState.after = after ?? null;
      const finish = () => {
        // Under the white the overlay goes; the camera backs out of the screen as the white clears.
        gsap.set(root.current, { visibility: "hidden" });
        retreatFromCase(() => router.push("/projects", { scroll: false }));
      };
      if (reduced.matches) {
        gsap.set(root.current, { visibility: "hidden" });
        diveState.v = 0;
        hush(false);
        router.push("/projects", { scroll: false });
        return;
      }
      // The case study's text and bars go first; the zoom into the white keeps its own timing.
      html.dataset.hushBar = "";
      gsap
        .timeline({ onComplete: finish })
        .to(root.current?.querySelectorAll(LEAVING) ?? [], {
          opacity: 0,
          duration: 0.35,
          ease: "none",
        })
        .to(flash.current, { opacity: 1, duration: LEAVE, ease })
        .to(
          scroll.current,
          { scale: 1.12, duration: LEAVE + SOFTEN * 0.2, ease },
          "<"
        );
    };
    caseState.close = leave;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      leave();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      landing.revert();
      shells--;
      // Another case study mounts in the same commit when one links to the next: only a real exit resets the page behind.
      window.setTimeout(() => {
        if (shells > 0) return;
        const { closing, after } = caseState;
        caseState.open = false;
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
      <div ref={flash} aria-hidden="true" className="case-flash" />
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
