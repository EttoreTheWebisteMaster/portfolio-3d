"use client";

import { useEffect, useRef, useState } from "react";

import { gsap } from "@/lib/gsap";
import { PROJECTS, TRAILER_SECONDS, view } from "@/lib/projects";
import { pad } from "@/lib/pages";

/** Right column of Projects: what is on the screen, the way into it, and the index. */
export default function ProjectsPanel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const next = (active + 1) % PROJECTS.length;
  const project = PROJECTS[active];
  const timer = useRef<HTMLButtonElement>(null);
  const seconds = useRef<HTMLSpanElement>(null);
  const elapsed = useRef(0);

  const show = (i: number) => {
    elapsed.current = 0;
    setActive(i);
  };

  useEffect(() => {
    view.index = active;
  }, [active]);

  // The trailer timer: the underline fills over the project's time, then the next one starts.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tick = (_: number, dt: number) => {
      if (paused || reduced.matches) return;
      elapsed.current += dt / 1000;
      if (elapsed.current >= TRAILER_SECONDS) {
        show(next);
        return;
      }
      timer.current?.style.setProperty(
        "--p",
        String(elapsed.current / TRAILER_SECONDS)
      );
      if (seconds.current)
        seconds.current.textContent = `${pad(Math.ceil(TRAILER_SECONDS - elapsed.current))}s`;
    };
    timer.current?.style.setProperty(
      "--p",
      String(elapsed.current / TRAILER_SECONDS)
    );
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [active, next, paused]);

  return (
    <div
      data-fx="item"
      className="fx projects-panel"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <p className="projects-facts">
        <span className="projects-count">
          {pad(active + 1)} / {pad(PROJECTS.length)}
        </span>
        {project.facts}
      </p>
      <h3
        className="projects-title"
        data-long={project.title.length > 12 ? "" : undefined}
      >
        {project.title}
      </h3>
      <p className="projects-lead">{project.lead}</p>
      <div className="projects-actions">
        <button type="button" className="btn-primary" disabled>
          Case study soon
        </button>
        <button
          ref={timer}
          type="button"
          className="btn-timer"
          onClick={() => show(next)}
        >
          Next · {PROJECTS[next].title} ·{" "}
          <span ref={seconds}>{pad(TRAILER_SECONDS)}s</span>
        </button>
      </div>
      <ul className="projects-index" aria-label="All projects">
        {PROJECTS.map((p, i) => (
          <li key={p.title}>
            <button
              type="button"
              className="prog-row"
              aria-current={i === active ? "true" : undefined}
              onPointerEnter={() => i !== active && show(i)}
              onFocus={() => i !== active && show(i)}
              onClick={() => show(i)}
            >
              <span className="no">{pad(i + 1)}</span>
              <span className="ti">{p.title}</span>
              <span className="yr">{p.discipline}</span>
              <span aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
