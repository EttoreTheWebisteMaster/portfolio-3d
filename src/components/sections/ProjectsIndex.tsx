"use client";

import {
  type RefObject,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import ProjectThumb from "@/components/sections/ProjectThumb";
import { presence } from "@/lib/caseStudy";
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

const noop = () => () => {};

const rowAt = (x: number, y: number) => {
  const row = document
    .elementFromPoint(x, y)
    ?.closest<HTMLElement>("[data-row]");
  return row ? Number(row.dataset.row) : null;
};

/** The programme: a scrolling index. Hovering a row floats its thumbnail beside the cursor; only a click changes the trailer. */
export default function ProjectsIndex({
  active,
  auto,
  onPick,
}: Readonly<Props>) {
  const wrap = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const [hover, setHover] = useState<number | null>(null);
  // The panel is transformed by the page transition, which would turn the thumbnail's `fixed` into panel-relative: it lives on <body>.
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false
  );

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
      behavior: reduced.matches ? "auto" : "smooth",
    });
  }, [active, auto]);

  // Thumbnail: follows the cursor for as long as it is over the list; it lands in place, never flies in.
  const follow = (x: number, y: number) => {
    const to = { x: Math.max(8, x - 224 - 28), y: y - 70 };
    if (thumb.current) {
      if (hover === null) gsap.set(thumb.current, to);
      else
        gsap.to(thumb.current, {
          ...to,
          duration: 0.35,
          ease: "power3.out",
          overwrite: true,
        });
    }
    setHover(rowAt(x, y));
  };

  const shown = PROJECTS[hover ?? active];
  return (
    <>
      <div
        ref={wrap}
        className="projects-list"
        onPointerMove={e => {
          if (e.pointerType === "touch") return;
          pointer.current = { x: e.clientX, y: e.clientY };
          follow(e.clientX, e.clientY);
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
      {mounted &&
        createPortal(
          <ProjectThumb
            ref={thumb}
            title={shown.title}
            discipline={shown.discipline}
            image={shown.image}
            on={hover !== null}
          />,
          document.body
        )}
    </>
  );
}
