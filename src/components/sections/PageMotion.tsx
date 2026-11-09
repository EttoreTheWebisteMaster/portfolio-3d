"use client";

import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { INTRO, journey, seg } from "@/lib/journey";
import { onEnter } from "@/lib/loading";
import { pointer } from "@/lib/pointer";

/** How much of the journey (in pages) a page takes to arrive and to leave. */
const SPAN = 0.3;
/** Home's copy decodes over the back half of the opening shot. */
const INTRO_SECONDS = 2;
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

type Kind = "title" | "text" | "item";

/**
 * Text motion for every page, driven by the journey position, so it plays forwards, backwards and at the
 * transition's own speed. Mark copy with `data-fx="title" | "text" | "item"` inside a `[data-page]` section.
 *  - title: lines rise out of a mask while the letters decode.
 *  - text: lines rise out of a mask, staggered.
 *  - item: block lifts and fades (buttons, billing).
 * Each page is pinned to the viewport while the document scrolls, so only this motion moves it.
 */
export default function PageMotion() {
  useGSAP(() => {
    const pages = gsap.utils.toArray<HTMLElement>("[data-page]");
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const splits: SplitText[] = [];
      type Rig = {
        page: HTMLElement;
        tl: gsap.core.Timeline | null;
        intro: gsap.core.Tween | null;
      };
      const rigs: Rig[] = pages.map(page => {
        const items = gsap.utils.toArray<HTMLElement>("[data-fx]", page);
        // Pages without marked copy (Projects) have nothing to pose.
        if (items.length === 0) return { page, tl: null, intro: null };
        const enter = gsap.timeline();
        const leave = gsap.timeline();

        items.forEach((el, i) => {
          const kind = el.dataset.fx as Kind;
          const at = i * 0.12;
          if (kind === "item") {
            enter.fromTo(
              el,
              { opacity: 0, y: 28, scale: 0.97 },
              { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "power3.out" },
              at
            );
            leave.to(
              el,
              {
                opacity: 0,
                y: -28,
                scale: 0.98,
                duration: 0.5,
                ease: "power2.in",
              },
              at * 0.6
            );
            return;
          }
          const split = SplitText.create(el, { type: "lines", mask: "lines" });
          splits.push(split);
          const rise = kind === "title" ? 110 : 105;
          enter.fromTo(
            split.lines,
            { yPercent: rise, skewY: kind === "title" ? 8 : 0, opacity: 0 },
            {
              yPercent: 0,
              skewY: 0,
              opacity: 1,
              duration: 0.9,
              ease: "power4.out",
              stagger: 0.1,
            },
            at
          );
          leave.to(
            split.lines,
            {
              yPercent: -rise,
              opacity: 0,
              skewY: kind === "title" ? -6 : 0,
              duration: 0.6,
              ease: "power3.in",
              stagger: 0.06,
            },
            at * 0.6
          );
          if (kind === "title")
            split.lines.forEach((line, n) => {
              const text = line.textContent ?? "";
              enter.fromTo(
                line,
                { scrambleText: { text: "", chars: CHARS } },
                {
                  scrambleText: {
                    text,
                    chars: CHARS,
                    speed: 0.7,
                    revealDelay: 0.25,
                  },
                  duration: 0.9,
                  ease: "none",
                },
                at + n * 0.1
              );
            });
        });

        // One scrubbed timeline per page: 0→1 arriving, 1→2 leaving.
        const tl = gsap.timeline({ paused: true });
        tl.add(enter.duration(1), 0).add(leave.duration(1), 1);
        tl.time(0);
        gsap.set(items, { visibility: "visible" });
        return { page, tl, intro: null };
      });

      // Home plays its entrance once, in real time, when the visitor gets past the loader:
      // the copy waits for the light slam, then the name lands first and the rest decodes under it.
      const first = rigs[0];
      const name = document.querySelector<HTMLElement>("[data-name]");
      let started = false;
      if (name) gsap.set(name, { opacity: 0 });
      const stopEnter = onEnter(() => {
        started = true;
        if (name)
          gsap.fromTo(
            name,
            { opacity: 0, scale: 1.14, y: 24 },
            {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 1.8,
              delay: INTRO.slam + 0.1,
              ease: "expo.out",
            }
          );
        if (first?.tl)
          first.intro = first.tl.tweenTo(1, {
            duration: INTRO_SECONDS,
            delay: INTRO.text,
            ease: "none",
          });
      });
      if (first?.tl) first.intro = null;

      // Depth layers: each moves against the camera and the pointer by its own amount, so the type sits in the scene.
      const layers = gsap.utils
        .toArray<HTMLElement>("[data-depth]")
        .map(el => ({
          depth: Number(el.dataset.depth),
          x: gsap.quickTo(el, "x", { duration: 1.1, ease: "power3.out" }),
          y: gsap.quickTo(el, "y", { duration: 1.1, ease: "power3.out" }),
        }));

      const tick = () => {
        const pos = journey.current;
        const y = window.scrollY;
        // The parallax rests as the journey leaves Home.
        const live = Math.max(1 - pos * 3, 0);
        const time = gsap.ticker.time;
        layers.forEach(layer => {
          layer.x(
            (-pointer.x * 22 + Math.sin(time * 0.35) * 4) * layer.depth * live
          );
          layer.y(
            (-pointer.y * 14 + Math.sin(time * 0.27) * 3) * layer.depth * live
          );
        });
        rigs.forEach((rig, i) => {
          // Pin the page to the viewport; the scroll only drives the journey.
          gsap.set(rig.page, { y: y - rig.page.offsetTop });
          if (!rig.tl) return;
          if (i === 0 && !started) return;
          if (rig.intro) {
            if (pos < 0.001) return;
            rig.intro.kill();
            rig.intro = null;
          }
          const time =
            pos < i ? seg(pos, [i - SPAN, i]) : 1 + seg(pos, [i, i + SPAN]);
          rig.tl.time(time);
          rig.page.style.pointerEvents = Math.abs(pos - i) < 0.5 ? "" : "none";
        });
      };
      gsap.ticker.add(tick);

      return () => {
        gsap.ticker.remove(tick);
        stopEnter();
        gsap.killTweensOf("[data-name],[data-depth]");
        gsap.set("[data-name],[data-depth]", { clearProps: "all" });
        rigs.forEach(rig => {
          rig.tl?.kill();
          gsap.set(rig.page, { clearProps: "y" });
        });
        splits.forEach(split => split.revert());
      };
    });

    // Reduced motion: no travel, pages simply cross-fade.
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(gsap.utils.toArray("[data-fx]"), { visibility: "visible" });
      const tick = () => {
        const pos = journey.current;
        const y = window.scrollY;
        pages.forEach((page, i) => {
          gsap.set(page, {
            y: y - page.offsetTop,
            opacity: 1 - Math.min(Math.abs(pos - i) * 2, 1),
          });
        });
      };
      gsap.ticker.add(tick);
      return () => {
        gsap.ticker.remove(tick);
        gsap.set(pages, { clearProps: "y,opacity" });
      };
    });
  });

  return null;
}
