"use client";

import { useEffect, useRef, useState } from "react";

import ProjectsIndex from "@/components/sections/ProjectsIndex";
import { ButtonArrow, ButtonLabel } from "@/components/ui/Button";
import { gsap, useGSAP } from "@/lib/gsap";
import { PROJECTS, TRAILER_SECONDS, view } from "@/lib/projects";
import { pad } from "@/lib/pages";

/** Right column of Projects: what is on the screen, the way into it, and the index. */
export default function ProjectsPanel() {
  const [active, setActive] = useState(0);
  const next = (active + 1) % PROJECTS.length;
  const project = PROJECTS[active];
  const timer = useRef<HTMLButtonElement>(null);
  const seconds = useRef<HTMLSpanElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  const first = useRef(true);
  // Auto changes (timer, Next) scroll the index to the new row; the visitor's own hovers never move it under the cursor.
  const auto = useRef(true);

  const show = (i: number, byVisitor = false) => {
    auto.current = !byVisitor;
    // Cut to the new trailer now, so the clock below never reads the old one's end.
    view.index = i;
    if (view.video) view.video.currentTime = 0;
    setActive(i);
  };

  // The screen is a DOM box the 3D screen is pinned to: measured, never copied, so they cannot drift apart.
  useEffect(() => {
    const measure = () => {
      const a = root.current?.getBoundingClientRect();
      const b = stage.current?.getBoundingClientRect();
      if (!a || !b) return;
      view.frame = { x: b.left - a.left, y: b.top - a.top, w: b.width };
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (root.current) ro.observe(root.current);
    if (stage.current) ro.observe(stage.current);
    return () => ro.disconnect();
  }, []);

  // The Next timer is the trailer's own clock: the underline fills as the video plays, and the next one starts when it ends.
  useEffect(() => {
    const tick = () => {
      const video = view.video;
      if (!video) return;
      const length =
        Number.isFinite(video.duration) && video.duration > 0
          ? video.duration
          : TRAILER_SECONDS;
      const t = Math.min(video.currentTime, length);
      if (video.ended && !video.loop) {
        show(next);
        return;
      }
      timer.current?.style.setProperty("--p", String(t / length));
      if (seconds.current)
        seconds.current.textContent = `${pad(Math.ceil(length - t))}s`;
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [active, next]);

  // A new project: facts, title and lead lift in, one after another.
  useGSAP(
    () => {
      if (first.current) {
        first.current = false;
        return;
      }
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-swap]",
          { y: 14, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: "power3.out",
            stagger: 0.06,
            overwrite: true,
          }
        );
      });
    },
    { scope: root, dependencies: [active] }
  );

  return (
    <div ref={root} className="projects-layout">
      <div ref={stage} className="projects-stage" aria-hidden="true" />
      <div data-fx="item" className="projects-panel fx">
        <p className="projects-facts">
          <span className="projects-count">
            <b>{pad(active + 1)}</b> / {pad(PROJECTS.length)}
          </span>
          <span data-swap>{project.facts}</span>
        </p>
        <h3
          data-swap
          aria-live="polite"
          className="projects-title"
          data-long={project.title.length > 12 ? "" : undefined}
        >
          {project.title}
        </h3>
        <p data-swap className="projects-lead">
          {project.lead}
        </p>
        <div className="projects-actions">
          {/* TODO(content): link to the case study once /projects/[slug] exists. */}
          <button type="button" className="btn-primary">
            <ButtonLabel>View the case study</ButtonLabel>
          </button>
          <button
            ref={timer}
            type="button"
            className="projects-next"
            onClick={() => show(next)}
          >
            <span>
              Next <span ref={seconds}>{pad(TRAILER_SECONDS)}s</span>
            </span>
            <b>{PROJECTS[next].title}</b>
            <ButtonArrow />
          </button>
        </div>
        <ProjectsIndex
          active={active}
          auto={auto}
          onPick={i => show(i, true)}
        />
      </div>
    </div>
  );
}
