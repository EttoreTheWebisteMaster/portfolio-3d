"use client";

import { hushed } from "@/lib/caseStudy";
import { gsap, useGSAP } from "@/lib/gsap";

const TRAVEL = 16;

/**
 * The top and bottom bars leave and return with the programme: they ease out (and a few pixels away from the screen's edge)
 * when a case study opens or closes, and come back the same way, reversed. Nothing is ever left over the TV.
 * The top bar has its own flag: it stays for the case study's landing. The footer follows the page.
 */
export default function BarsMotion() {
  useGSAP(() => {
    const top = document.querySelector<HTMLElement>("header.bar");
    const foot = document.querySelector<HTMLElement>("footer.bar");
    const html = document.documentElement;
    const mm = gsap.matchMedia();

    mm.add(
      {
        full: "(prefers-reduced-motion: no-preference)",
        reduced: "(prefers-reduced-motion: reduce)",
      },
      context => {
        const move = Boolean(context.conditions?.full);
        const bars = [
          {
            el: top,
            dy: -TRAVEL,
            away: () => html.hasAttribute("data-hush-bar"),
          },
          { el: foot, dy: TRAVEL, away: hushed },
        ].map(bar => ({ ...bar, was: false }));

        const tick = () => {
          bars.forEach(bar => {
            const now = bar.away();
            if (now === bar.was || !bar.el) return;
            bar.was = now;
            gsap.to(bar.el, {
              autoAlpha: now ? 0 : 1,
              y: now && move ? bar.dy : 0,
              duration: now ? 0.08 : move ? 0.45 : 0.2,
              ease: now ? "power2.in" : "power2.out",
              overwrite: true,
              // Back to rest: nothing is left on the bar, so its own fades and the menu's anchoring are untouched.
              onComplete: () => {
                if (!now && bar.el)
                  gsap.set(bar.el, {
                    clearProps: "opacity,visibility,transform",
                  });
              },
            });
          });
        };
        gsap.ticker.add(tick);
        return () => {
          gsap.ticker.remove(tick);
          bars.forEach(bar => {
            if (bar.el)
              gsap.set(bar.el, { clearProps: "opacity,visibility,transform" });
          });
        };
      }
    );
  });

  return null;
}
