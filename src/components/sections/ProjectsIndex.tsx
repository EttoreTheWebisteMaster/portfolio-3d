"use client";

import { useEffect, useRef, useState } from "react";

import { presence } from "@/lib/caseMotion";
import { gsap } from "@/lib/gsap";
import { journey } from "@/lib/journey";
import { pad } from "@/lib/pages";
import { PROJECTS, view } from "@/lib/projects";

type Props = {
  active: number;
  onPick: (i: number) => void;
};

const N = PROJECTS.length;
/** The drum shows this many rows either side of the middle; the rest wait out of sight. */
const REACH = 2.4;
/** Scroll distance (px) and swipe distance that count as one step, and the pause between two steps. */
const WHEEL_STEP = 40;
const SWIPE_STEP = 36;
const STEP_GAP = 200;
/** A pause this long between wheel events is a new gesture: the partial scroll is forgotten. */
const IDLE = 120;

/** The offset of a row from the middle, the short way round the loop. */
const wrap = (d: number) => ((((d + N / 2) % N) + N) % N) - N / 2;

const rowAt = (x: number, y: number) => {
  const row = document
    .elementFromPoint(x, y)
    ?.closest<HTMLElement>("[data-row]");
  return row ? Number(row.dataset.row) : null;
};

/** The programme: a drum that loops. The selected project always sits in the middle; scroll, swipe, the arrow keys or a click turn it. */
export default function ProjectsIndex({ active, onPick }: Readonly<Props>) {
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  // Where the drum is, as a (fractional, unbounded) row number; it eases towards `active`.
  const pos = useRef({ v: active });
  const now = useRef(active);
  const pick = useRef(onPick);
  // The window listeners below read the latest selection and handler from here.
  useEffect(() => {
    now.current = active;
    pick.current = onPick;
  });

  /** Lays the rows out round the middle for the current position. */
  const render = () => {
    const el = list.current;
    if (!el) return;
    const side = window.matchMedia("(max-aspect-ratio: 1/1)").matches;
    el.querySelectorAll<HTMLElement>("li").forEach((li, i) => {
      const d = wrap(i - pos.current.v);
      const far = Math.abs(d);
      const slot = side ? li.offsetWidth : li.offsetHeight;
      gsap.set(li, {
        x: side ? d * slot : 0,
        y: side ? 0 : d * slot,
        autoAlpha: far > REACH ? 0 : 1 - far * 0.3,
        "--near": Math.max(0, 1 - far),
      });
    });
  };

  // The drum eases to the new selection the short way round.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const to = pos.current.v + wrap(active - pos.current.v);
    gsap.to(pos.current, {
      v: to,
      duration: reduced.matches ? 0 : 0.42,
      ease: "power3.out",
      overwrite: true,
      onUpdate: render,
      onComplete: render,
    });
    if (reduced.matches) render();
  }, [active]);

  // Re-lay on resize and orientation change; free the tween on unmount.
  useEffect(() => {
    const redo = () => render();
    redo();
    window.addEventListener("resize", redo);
    const p = pos.current;
    return () => {
      window.removeEventListener("resize", redo);
      gsap.killTweensOf(p);
    };
  }, []);

  // Only reachable once Projects is the page: from Home it must neither take hovers nor swallow the wheel.
  useEffect(() => {
    let on: boolean | null = null;
    const tick = () => {
      // The card never outlives the programme: once it starts to leave, the card goes with it.
      const live = journey.current > 0.95 && presence.v > 0.98;
      if (live === on) return;
      on = live;
      box.current?.toggleAttribute("inert", !live);
      if (!live) setHover(null);
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  // Landing on a new row is news for the room: the crowd reacts.
  useEffect(() => {
    if (hover !== null) view.pulse += 1;
  }, [hover]);

  // Wheel and swipe turn the drum, one project per step. Heard on the window, in the capture phase, because the page snapper stops these events before they reach the list.
  useEffect(() => {
    const over = (e: Event) =>
      e.target instanceof Element && e.target.closest(".projects-list");
    const side = () => window.matchMedia("(max-aspect-ratio: 1/1)").matches;
    let acc = 0;
    let last = 0;
    let seen = 0;
    const step = (dir: number) => {
      const t = performance.now();
      if (t - last < STEP_GAP) return;
      last = t;
      acc = 0;
      // The rows move under a still cursor: forget the row it was on until it moves again.
      setHover(null);
      pick.current((now.current + dir + N) % N);
    };
    const wheel = (e: WheelEvent) => {
      if (!over(e)) return;
      e.preventDefault();
      if (e.timeStamp - seen > IDLE) acc = 0;
      seen = e.timeStamp;
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 120 : 1;
      const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      acc += d * unit;
      if (Math.abs(acc) >= WHEEL_STEP) step(Math.sign(acc));
    };
    let from = { x: 0, y: 0 };
    const start = (e: TouchEvent) => {
      if (over(e)) from = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const move = (e: TouchEvent) => {
      if (!over(e)) return;
      const t = e.touches[0];
      const d = side() ? from.x - t.clientX : from.y - t.clientY;
      if (Math.abs(d) < SWIPE_STEP) return;
      from = { x: t.clientX, y: t.clientY };
      step(Math.sign(d));
    };
    window.addEventListener("wheel", wheel, { capture: true, passive: false });
    window.addEventListener("touchstart", start, {
      capture: true,
      passive: true,
    });
    window.addEventListener("touchmove", move, {
      capture: true,
      passive: true,
    });
    return () => {
      window.removeEventListener("wheel", wheel, { capture: true });
      window.removeEventListener("touchstart", start, { capture: true });
      window.removeEventListener("touchmove", move, { capture: true });
    };
  }, []);

  return (
    <div
      ref={box}
      className="projects-list"
      onPointerMove={e => {
        if (e.pointerType === "touch") return;
        setHover(rowAt(e.clientX, e.clientY));
      }}
      onPointerLeave={() => setHover(null)}
    >
      <div className="projects-pick" aria-hidden="true" />
      <ul
        ref={list}
        className="projects-index"
        aria-label="All projects"
        onKeyDown={e => {
          const dir =
            e.key === "ArrowDown" || e.key === "ArrowRight"
              ? 1
              : e.key === "ArrowUp" || e.key === "ArrowLeft"
                ? -1
                : 0;
          if (!dir) return;
          e.preventDefault();
          onPick((active + dir + N) % N);
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
    </div>
  );
}
