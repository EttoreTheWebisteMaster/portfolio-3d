"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

import { presence } from "@/lib/caseMotion";
import { gsap } from "@/lib/gsap";
import { journey } from "@/lib/journey";
import { pad } from "@/lib/pages";
import { PROJECTS, view } from "@/lib/projects";

type Props = {
  active: number;
  /** True while the last change was automatic: the list then scrolls to the playing row. */
  auto: RefObject<boolean>;
  onPick: (i: number) => void;
};

const rowAt = (x: number, y: number) => {
  const row = document
    .elementFromPoint(x, y)
    ?.closest<HTMLElement>("[data-row]");
  return row ? Number(row.dataset.row) : null;
};

/** The programme: a scrolling index. Only a click changes the trailer; hovering a row makes the room react. */
export default function ProjectsIndex({
  active,
  auto,
  onPick,
}: Readonly<Props>) {
  const wrap = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const [hover, setHover] = useState<number | null>(null);
  // Scroll track: thumb size and position follow the list.
  const sync = () => {
    const el = list.current;
    if (!el || !track.current) return;
    track.current.style.setProperty(
      "--len",
      String(el.clientHeight / el.scrollHeight)
    );
    track.current.style.setProperty(
      "--top",
      String(el.scrollTop / el.scrollHeight)
    );
  };
  useEffect(sync, []);

  // Only reachable once Projects is the page: from Home it must neither take hovers nor swallow the wheel.
  useEffect(() => {
    let on: boolean | null = null;
    const tick = () => {
      // The card never outlives the programme: once it starts to leave, the card goes with it.
      const live = journey.current > 0.95 && presence.v > 0.98;
      if (live === on) return;
      on = live;
      wrap.current?.toggleAttribute("inert", !live);
      if (!live) setHover(null);
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  // Landing on a new row is news for the room: the crowd reacts.
  useEffect(() => {
    if (hover !== null) view.pulse += 1;
  }, [hover]);

  // The index follows the playing trailer.
  useEffect(() => {
    const el = list.current;
    const row = el?.querySelector<HTMLElement>("[aria-current]")?.parentElement;
    if (!el || !row || !auto.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    el.scrollTo({
      top: Math.max(0, row.offsetTop - 52),
      left: Math.max(0, row.offsetLeft),
      behavior: reduced.matches ? "auto" : "smooth",
    });
  }, [active, auto]);

  return (
    <div
      ref={wrap}
      className="projects-list"
      onPointerMove={e => {
        if (e.pointerType === "touch") return;
        pointer.current = { x: e.clientX, y: e.clientY };
        setHover(rowAt(e.clientX, e.clientY));
      }}
      onPointerLeave={() => setHover(null)}
    >
      <ul
        ref={list}
        className="projects-index"
        aria-label="All projects"
        onScroll={() => {
          sync();
          if (hover !== null)
            setHover(rowAt(pointer.current.x, pointer.current.y));
        }}
      >
        {PROJECTS.map((p, i) => (
          <li key={p.title}>
            <button
              type="button"
              data-row={i}
              className="prog-row"
              aria-current={i === active ? "true" : undefined}
              onClick={() => onPick(i)}
            >
              <span className="no">{pad(i + 1)}</span>
              <span className="ti">{p.title}</span>
              <span className="yr">{p.discipline}</span>
            </button>
          </li>
        ))}
      </ul>
      <div ref={track} className="projects-track" aria-hidden="true" />
    </div>
  );
}
