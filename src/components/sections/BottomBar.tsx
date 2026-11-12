"use client";

import Link from "next/link";
import { useRef } from "react";

import { gsap, useGSAP } from "@/lib/gsap";
import { journey } from "@/lib/journey";
import { PAGES, pad } from "@/lib/pages";

/** The cue points at the next page that exists; on the last one it points back to the top. */
function cueFor(i: number) {
  const next = PAGES[i + 1];
  if (next && document.getElementById(next.id))
    // Projects → About is the one sideways move: the camera trucks right with him.
    return { href: next.path, text: `${next.label} ${i === 1 ? "→" : "↓"}` };
  return { href: PAGES[0].path, text: `${PAGES[0].label} ↑` };
}

/** Rolls a bar field out, swaps its text, and rolls the new text in. */
function swap(el: HTMLElement, text: string) {
  gsap
    .timeline({ overwrite: "auto" })
    .to(el, { yPercent: -70, opacity: 0, duration: 0.18, ease: "power2.in" })
    .call(() => {
      el.textContent = text;
    })
    .fromTo(
      el,
      { yPercent: 70 },
      { yPercent: 0, opacity: 1, duration: 0.45, ease: "power3.out" }
    );
}

/** Fixed footer. Its content follows the journey: label, cue, counter and ticks swap as the page changes. */
export default function BottomBar() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const bar = root.current;
      if (!bar) return;
      const field = (name: string) =>
        bar.querySelector<HTMLElement>(`[data-bar="${name}"]`);
      const cue = bar.querySelector<HTMLAnchorElement>("[data-bar-cue]");
      const ticks = bar.querySelectorAll("[data-tick]");
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
      let shown = 0;

      const show = (i: number, animate: boolean) => {
        const next = cueFor(i);
        const set = (name: string, text: string) => {
          const el = field(name);
          if (!el) return;
          if (animate && !reduced.matches) swap(el, text);
          else el.textContent = text;
        };
        set("index", pad(i + 1));
        set("label", PAGES[i].label);
        set("count", `${pad(i + 1)} / ${pad(PAGES.length)}`);
        if (cue) {
          cue.href = next.href;
          if (animate && !reduced.matches) swap(cue, next.text);
          else cue.textContent = next.text;
        }
        ticks.forEach((tick, n) => {
          if (n === i) tick.setAttribute("aria-current", "true");
          else tick.removeAttribute("aria-current");
        });
      };

      show(0, false);
      const tick = () => {
        const i = gsap.utils.clamp(
          0,
          PAGES.length - 1,
          Math.round(journey.current)
        );
        if (i === shown) return;
        shown = i;
        show(i, true);
      };
      gsap.ticker.add(tick);
      return () => gsap.ticker.remove(tick);
    },
    { scope: root }
  );

  return (
    <footer
      ref={root}
      className="bar-veil bar-foot fixed inset-x-0 bottom-0 z-10 bar"
    >
      <p className="bar-label whitespace-nowrap">
        <span className="bar-field" data-bar="index">
          {pad(1)}
        </span>
        {" · "}
        <span className="bar-field" data-bar="label">
          {PAGES[0].label}
        </span>
      </p>
      <Link href={PAGES[1].path} className="bar-cue bar-field" data-bar-cue>
        {PAGES[1].label} ↓
      </Link>
      <p className="bar-progress whitespace-nowrap">
        <span className="bar-field" data-bar="count">
          {pad(1)} / {pad(PAGES.length)}
        </span>
        <span className="hidden md:block">
          <span className="bar-ticks" aria-hidden="true">
            {PAGES.map((page, i) => (
              <i
                key={page.id}
                data-tick
                aria-current={i === 0 ? "true" : undefined}
              />
            ))}
          </span>
        </span>
      </p>
    </footer>
  );
}
