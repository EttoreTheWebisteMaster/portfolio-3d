"use client";

import { caseState } from "@/lib/caseMotion";
import { gsap, type SplitText, useGSAP } from "@/lib/gsap";
import { addEntrance, RISE } from "@/lib/fx";
import { CUT_EVENT, heading, INTRO, journey, seg } from "@/lib/journey";
import { COPY_GONE } from "@/components/three/walkPose";
import { onEnter } from "@/lib/loading";
import { pointer } from "@/lib/pointer";

/** How much of the journey (in pages) a page takes to arrive and to leave. */
const SPAN = 0.25;
/** About and Contact: how much of the journey before the page their copy starts to arrive. */
const ARRIVE = [0.367, 0.4] as const;
/** How far into About's arrival (in entrance seconds) the copy waits after the caption: the caption (`data-early`) lands at TC 00:00:49:00 with only him on the set, and the rest follows. */
const CAPTION_LEAD = 0.5;
/** Contact's copy, scrolled back up: how much of the journey it takes to clear. */
const LEAVE_BACK = 0.04;
/** Home's copy decodes over the back half of the opening shot. */
const INTRO_SECONDS = 2;
/** A page opened by its URL arrives slower, and later, so the eye finds the scene first. */
const LAND_SECONDS = 2.2;
const LAND_DELAY = 0.6;
/** After a cut the copy waits for the new page to lift out of the veil. */
const CUT_DELAY = 0.3;

type Kind = "title" | "text" | "item" | "stack" | "display";

/**
 * Text motion for every page, driven by the journey position, so it plays forwards, backwards and at the
 * transition's own speed. Mark copy with `data-fx="title" | "text" | "item"` inside a `[data-page]` section.
 *  - title: lines rise out of a mask while the letters decode.
 *  - text: lines rise out of a mask, staggered.
 *  - item: block lifts and fades (buttons, billing).
 *  - stack: each child enters on its own, in turn.
 *  - display: every letter slides in on its own behind a mask (the About headline).
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
      const rigs: Rig[] = pages.map((page, index) => {
        const items = gsap.utils.toArray<HTMLElement>("[data-fx]", page);
        // Pages without marked copy (Projects) have nothing to pose.
        if (items.length === 0) return { page, tl: null, intro: null };
        const enter = gsap.timeline();
        const leave = gsap.timeline();

        items.forEach((el, i) => {
          const kind = el.dataset.fx as Kind;
          const base = i * 0.12;
          const early = el.hasAttribute("data-early");
          const at = early ? 0 : base + (index === 2 ? CAPTION_LEAD : 0);
          // About's copy and controls arrive from the left, following him in.
          const split = addEntrance(
            enter,
            el,
            at,
            undefined,
            index === 2 ? "left" : "below"
          );
          if (!split) {
            leave.to(
              el,
              {
                opacity: 0,
                y: -28,
                scale: 0.98,
                duration: 0.5,
                ease: "power2.in",
              },
              base * 0.6
            );
            return;
          }
          splits.push(split);
          leave.to(
            split.lines,
            {
              yPercent: -RISE,
              opacity: 0,
              skewY: kind === "title" ? -6 : 0,
              duration: 0.6,
              ease: "power3.in",
              stagger: 0.06,
            },
            base * 0.6
          );
        });

        // One scrubbed timeline per page: 0→1 arriving, 1→2 leaving.
        const tl = gsap.timeline({ paused: true });
        tl.add(enter.duration(1), 0).add(leave.duration(1), 1);
        tl.time(0);
        gsap.set(items, { visibility: "visible" });
        return { page, tl, intro: null };
      });

      // The landing page plays its entrance once, in real time, when the visitor gets past the loader (Home's is the full opening):
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
        // The page the URL opened on plays its copy in real time; on any page but Home there is no light slam to wait for.
        const at = Math.round(journey.current);
        const rig = rigs[at];
        if (rig?.tl)
          rig.intro = rig.tl.tweenTo(1, {
            duration: at === 0 ? INTRO_SECONDS : LAND_SECONDS,
            delay: at === 0 ? INTRO.text : LAND_DELAY,
            ease: "none",
          });
      });
      if (first?.tl) first.intro = null;

      // A skipped page is a cut under the veil: once it has landed, its copy plays its entrance in real time, like on the first visit.
      const onCut = (e: Event) => {
        const at = (e as CustomEvent<number>).detail;
        const rig = rigs[at];
        rig?.intro?.kill();
        if (at === 0 && name)
          gsap.fromTo(
            name,
            { opacity: 0, scale: 1.14, y: 24 },
            {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 1.8,
              delay: CUT_DELAY,
              ease: "expo.out",
              overwrite: true,
            }
          );
        if (!rig?.tl) return;
        rig.tl.time(0);
        rig.intro = rig.tl.tweenTo(1, {
          duration: INTRO_SECONDS,
          delay: CUT_DELAY,
          ease: "none",
        });
      };
      window.addEventListener(CUT_EVENT, onCut);

      // Depth layers. Home's keep their original motion (quickTo on x/y). Every other page's elements drift on their own, by their own amount and phase, through the `translate` property so they never fight the entrances' transform.
      const layers = gsap.utils
        .toArray<HTMLElement>("[data-depth]")
        .map((el, n) => ({
          el,
          n,
          depth: Number(el.dataset.depth),
          // The page the layer belongs to; the scene's own layers (the name) belong to Home.
          page: Math.max(
            pages.indexOf(el.closest<HTMLElement>("[data-page]")!),
            0
          ),
          x: 0,
          y: 0,
          sx: 0,
          sy: 0,
        }))
        .map(layer => ({
          ...layer,
          qx:
            layer.page === 0
              ? gsap.quickTo(layer.el, "x", {
                  duration: 1.1,
                  ease: "power3.out",
                })
              : null,
          qy:
            layer.page === 0
              ? gsap.quickTo(layer.el, "y", {
                  duration: 1.1,
                  ease: "power3.out",
                })
              : null,
        }));

      const tick = () => {
        const pos = journey.current;
        const y = window.scrollY;
        const time = gsap.ticker.time;
        const k = 1 - Math.exp((-gsap.ticker.deltaRatio() / 60) * 2.5);
        layers.forEach(layer => {
          // Each layer's parallax rests as the journey leaves its page.
          const live = Math.max(1 - Math.abs(pos - layer.page) * 3, 0);
          if (layer.qx && layer.qy) {
            layer.qx(
              (-pointer.x * 22 + Math.sin(time * 0.35) * 4) * layer.depth * live
            );
            layer.qy(
              (-pointer.y * 14 + Math.sin(time * 0.27) * 3) * layer.depth * live
            );
            return;
          }
          const phase = layer.n * 1.7;
          layer.x +=
            ((-pointer.x * 14 + Math.sin(time * 0.35 + phase) * 2.5) *
              layer.depth *
              live -
              layer.x) *
            k;
          layer.y +=
            ((-pointer.y * 9 + Math.sin(time * 0.27 + phase) * 2) *
              layer.depth *
              live -
              layer.y) *
            k;
          // Written only when it has moved a visible amount, so a still pointer costs nothing.
          if (
            Math.abs(layer.x - layer.sx) + Math.abs(layer.y - layer.sy) <
            0.05
          )
            return;
          layer.sx = layer.x;
          layer.sy = layer.y;
          layer.el.style.translate = `${layer.x.toFixed(1)}px ${layer.y.toFixed(1)}px`;
        });
        rigs.forEach((rig, i) => {
          // Pin the page to the viewport; the scroll only drives the journey.
          gsap.set(rig.page, { y: y - rig.page.offsetTop });
          // Projects' programme animates itself (ProjectsPanel); the trailer keeps playing behind as light.
          if (i === 1) rig.page.inert = pos < 0.9 || pos >= 1.12;
          // Inert, not just pointer-events none: a panel that opts back into pointer events must not catch clicks meant for the page in front. Set before any early return below: a copy entrance still playing must not leave the page it landed on unclickable.
          if (i !== 1)
            rig.page.inert = Math.abs(pos - i) >= 0.5 || caseState.open;
          if (!rig.tl) return;
          // The page the visitor lands on keeps its copy away until they are past the loader.
          if (!started && i === Math.round(pos)) {
            rig.tl.time(0);
            return;
          }
          if (rig.intro) {
            if (Math.abs(pos - i) < 0.001) return;
            rig.intro.kill();
            rig.intro = null;
          }
          // About's copy clears fast: the lens is already pushing in on his eye.
          const out = i === 2 ? COPY_GONE - i : SPAN;
          // About and Contact start their copy early, so it is already rising while the light comes up.
          const arrive = i >= 2 ? ARRIVE[i - 2] : SPAN;
          let time =
            pos < i ? seg(pos, [i - arrive, i]) : 1 + seg(pos, [i, i + out]);
          // Scrolling back up from Contact, its copy is gone the moment the scroll starts.
          if (i === 3 && heading.dir < 0 && pos < i)
            time = Math.min(time, seg(pos, [i - LEAVE_BACK, i]));
          rig.tl.time(time);
        });
      };
      gsap.ticker.add(tick);

      return () => {
        gsap.ticker.remove(tick);
        window.removeEventListener(CUT_EVENT, onCut);
        stopEnter();
        gsap.killTweensOf("[data-name],[data-depth]");
        gsap.set("[data-name],[data-depth]", { clearProps: "all" });
        layers.forEach(layer => layer.el.style.removeProperty("translate"));
        rigs.forEach(rig => {
          rig.tl?.kill();
          gsap.set(rig.page, { clearProps: "y,opacity" });
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
          // Faded-out pages must not be reachable with Tab.
          page.inert = Math.abs(pos - i) >= 0.5 || caseState.open;
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
        pages.forEach(page => {
          page.inert = false;
        });
      };
    });
  });

  return null;
}
