import type { RefObject } from "react";

import { hushed, presence } from "@/lib/caseMotion";
import { gsap, useGSAP } from "@/lib/gsap";
import { journey, seg } from "@/lib/journey";

/** The Projects programme's entrance and exit. `scope` is its layout; `panel` the column that holds every piece. */
export default function useProgrammeMotion(
  scope: RefObject<HTMLElement | null>,
  panel: RefObject<HTMLElement | null>
) {
  // Every piece of the programme arrives one after another and leaves the same way backwards. One scrubbed timeline, driven by
  // how far the journey has come to Projects (it leaves to About and Home too) and by the case study: while one opens, is open or
  // closes, the gate is shut. Whatever is lower wins, so nothing is ever left standing over the TV.
  useGSAP(
    () => {
      const el = panel.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(
        {
          full: "(prefers-reduced-motion: no-preference)",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        context => {
          const move = Boolean(context.conditions?.full);
          const lift = move ? { y: 26 } : {};
          const tl = gsap.timeline({
            paused: true,
            defaults: { ease: "power3.out" },
          });
          gsap.utils
            .toArray<HTMLElement>("[data-in]", el)
            .forEach((part, i) => {
              tl.fromTo(
                part,
                { opacity: 0, ...lift },
                { opacity: 1, y: 0, duration: 0.4 },
                i * 0.07
              );
            });
          tl.fromTo(
            ".prog-row",
            { opacity: 0, ...(move ? { x: 24 } : {}) },
            { opacity: 1, x: 0, duration: 0.4, stagger: 0.04 },
            0.35
          );
          tl.fromTo(
            ".projects-track",
            { opacity: 0, ...(move ? { scaleY: 0 } : {}) },
            { opacity: 1, scaleY: 1, duration: 0.5, transformOrigin: "top" },
            0.6
          );

          const gate = { v: hushed() ? 0 : 1 };
          let goal = gate.v;
          let shown: boolean | null = null;
          let live: boolean | null = null;
          const tick = () => {
            const want = hushed() ? 0 : 1;
            if (want !== goal) {
              goal = want;
              gsap.to(gate, {
                v: want,
                // Out is instant, in is unhurried: the same animation, played at two speeds.
                duration: want === 0 ? 0.08 : move ? 0.7 : 0.2,
                ease: "none",
                overwrite: true,
              });
            }
            const pos = journey.current;
            const there = seg(pos, [0.75, 1]) * (1 - seg(pos, [1, 1.12]));
            const p = Math.min(there, gate.v);
            presence.v = p;
            tl.progress(p);
            const visible = p > 0.001;
            if (visible !== shown) {
              shown = visible;
              gsap.set(el, { visibility: visible ? "visible" : "hidden" });
            }
            // Mid-arrival or mid-exit nothing can be pressed.
            const idle = p > 0.98;
            if (idle !== live) {
              live = idle;
              el.inert = !idle;
            }
          };
          tick();
          gsap.ticker.add(tick);
          return () => {
            gsap.ticker.remove(tick);
            gsap.killTweensOf(gate);
            presence.v = 0;
            tl.kill();
            el.inert = false;
            gsap.set(el, { clearProps: "visibility" });
            gsap.set(
              el.querySelectorAll("[data-in], .prog-row, .projects-track"),
              {
                clearProps: "opacity,transform",
              }
            );
          };
        }
      );
    },
    { scope }
  );
}
