"use client";

import Link from "next/link";
import { useRef } from "react";

import { ButtonArrow } from "@/components/ui/Button";
import { gsap, useGSAP } from "@/lib/gsap";
import { journey } from "@/lib/journey";
import { PAGES, pad } from "@/lib/pages";

/** The cue points at the next page that exists; on the last one it points back to the top. */
function cueFor(i: number) {
  const next = PAGES[i + 1];
  if (next && document.getElementById(next.id))
    // Projects → About is the one sideways move: the camera trucks right with him.
    return {
      href: next.path,
      label: next.label,
      dir: i === 1 ? "right" : "down",
    };
  return { href: PAGES[0].path, label: PAGES[0].label, dir: "up" };
}

/** Writes the text of a bar field; a field with rolling copies (the cue's label) keeps its copies in step. */
function put(el: HTMLElement, text: string) {
  const copies = el.querySelectorAll("[data-copy]");
  if (copies.length === 0) el.textContent = text;
  else copies.forEach(copy => (copy.textContent = text));
}

/** Rolls a bar field out, swaps its text, and rolls the new text in. */
function swap(el: HTMLElement, text: string) {
  gsap
    .timeline({ overwrite: "auto" })
    .to(el, { yPercent: -70, opacity: 0, duration: 0.18, ease: "power2.in" })
    .call(() => put(el, text))
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
          else put(el, text);
        };
        set("index", pad(i + 1));
        set("label", PAGES[i].label);
        set("count", pad(i + 1));
        if (cue) {
          cue.href = next.href;
          cue.dataset.dir = next.dir;
          set("cue", next.label);
        }
        document.documentElement.dataset.now = PAGES[i].label.toLowerCase();
        document.querySelectorAll("[data-nav]").forEach(link => {
          if (link.getAttribute("data-nav") === PAGES[i].label.toLowerCase())
            link.setAttribute("aria-current", "page");
          else link.removeAttribute("aria-current");
        });
        ticks.forEach((tick, n) => {
          if (n === i) tick.setAttribute("aria-current", "page");
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
      return () => {
        gsap.ticker.remove(tick);
        delete document.documentElement.dataset.now;
      };
    },
    { scope: root }
  );

  return (
    <footer ref={root} className="bar-veil fixed inset-x-0 bottom-0 z-10 bar">
      <p className="bar-label whitespace-nowrap">
        <span className="bar-field" data-bar="index">
          {pad(1)}
        </span>
        {" · "}
        <span className="bar-field" data-bar="label">
          {PAGES[0].label}
        </span>
      </p>
      <Link
        href={PAGES[1].path}
        className="bar-cue"
        data-bar-cue
        data-dir="down"
      >
        <span className="bar-field" data-bar="cue">
          <span className="btn-label">
            <span data-copy>{PAGES[1].label}</span>
            <span data-copy aria-hidden="true">
              {PAGES[1].label}
            </span>
          </span>
        </span>
        <ButtonArrow />
      </Link>
      <div className="bar-progress whitespace-nowrap">
        <span>
          <span className="bar-field" data-bar="count">
            {pad(1)}
          </span>
          {` / ${pad(PAGES.length)}`}
        </span>
        <nav className="bar-ticks hidden md:flex" aria-label="Pages">
          {PAGES.map((page, i) => (
            <Link
              key={page.id}
              href={page.path}
              data-tick
              aria-label={page.label}
              aria-current={i === 0 ? "page" : undefined}
            >
              <i>
                <span>{page.label}</span>
              </i>
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
