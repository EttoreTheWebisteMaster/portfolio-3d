"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

import {
  DEFAULT_VOLUME,
  getVolume,
  MIN_VOLUME,
  saveVolume,
  setVolume,
  subscribeMuted,
  toggleMuted,
} from "@/lib/sound";

/** Pointer travel, in px, from silence to full volume. */
const DRAG_RANGE = 40;
/** One arrow key press, as a share of the full volume. */
const KEY_STEP = 0.05;
/** How fast the drawn wave follows the volume: the share of the gap it closes each frame. */
const FOLLOW = 0.28;

// A pure sine, 1.5 cycles across the 34-unit box: it starts and ends on the
// midline and mirrors around the centre. Drawn one period beyond each edge so
// the CSS translate by one period (68/3) loops seamlessly.
const PERIOD = 68 / 3;
const MID = 14;
const POINTS = Array.from({ length: 160 }, (_, i) => {
  const x = -PERIOD + i * 0.5;
  const y = MID - 8 * Math.sin((2 * Math.PI * x) / PERIOD);
  return `${x.toFixed(2)},${y.toFixed(2)}`;
}).join(" ");

/**
 * The volume, as a waveform and a word. The wave is a handle: grab it and drag up or down (the wave grows and shrinks with every percent, and the word
 * becomes the percentage). Below the minimum it is the same as muted. The word is the key: Mute / Unmute, back to the last level chosen.
 * The wave also answers the arrow keys, so nothing needs a pointer. Level and mute persist across visits.
 */
export default function SoundToggle() {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; from: number } | null>(null);
  // What the wave draws, 0–1, and what it is heading for: the drawn one follows frame by frame.
  const drawn = useRef(-1);
  const goal = useRef(0);
  const frame = useRef(0);
  const [held, setHeld] = useState<number | null>(null);
  const volume = useSyncExternalStore(
    subscribeMuted,
    getVolume,
    () => DEFAULT_VOLUME
  );
  const on = volume > 0;
  // Below the minimum the pointer only mutes: the wave stops at the minimum's size, and the word says so.
  const silent = held === null ? !on : held < MIN_VOLUME;
  const shown = held === null ? volume : Math.max(held, MIN_VOLUME);
  const percent = Math.round(shown * 100);

  useEffect(() => {
    goal.current = shown;
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const step = () => {
      const gap = goal.current - drawn.current;
      drawn.current =
        reduced.matches || Math.abs(gap) < 0.0005
          ? goal.current
          : drawn.current + gap * FOLLOW;
      el.style.setProperty("--vol", drawn.current.toFixed(4));
      frame.current =
        drawn.current === goal.current ? 0 : requestAnimationFrame(step);
    };
    if (drawn.current < 0) drawn.current = goal.current;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(step);
  }, [shown]);

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      // Gone mid-drag: the closed hand must not be left on the screen.
      document.documentElement.removeAttribute("data-volume");
    },
    []
  );

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    // From silence a drag starts at the minimum: the first step up is audible.
    const from = on ? getVolume() : MIN_VOLUME - 1 / DRAG_RANGE;
    drag.current = { y: e.clientY, from };
    setHeld(from);
    document.documentElement.toggleAttribute("data-volume", true);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const next = Math.min(
      Math.max(d.from + (d.y - e.clientY) / DRAG_RANGE, 0),
      1
    );
    setHeld(next);
    setVolume(next, false);
  };
  const up = () => {
    if (!drag.current) return;
    drag.current = null;
    document.documentElement.toggleAttribute("data-volume", false);
    setHeld(null);
    saveVolume();
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const dir =
      e.key === "ArrowUp" || e.key === "ArrowRight"
        ? 1
        : e.key === "ArrowDown" || e.key === "ArrowLeft"
          ? -1
          : 0;
    if (dir === 0) return;
    e.preventDefault();
    // The arrows belong to the volume here, not to the page snapper.
    e.stopPropagation();
    // From silence the first step up is the last level chosen, not a level too quiet to hear.
    if (dir > 0 && getVolume() === 0) toggleMuted();
    else setVolume(Math.round((getVolume() + dir * KEY_STEP) * 100) / 100);
  };

  return (
    <div
      ref={root}
      className="sound-toggle"
      data-on={on}
      data-dragging={held !== null || undefined}
    >
      <div
        role="slider"
        tabIndex={0}
        className="sound-wave"
        aria-label="Trim volume"
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(volume * 100)}
        aria-valuetext={on ? `${Math.round(volume * 100)}%` : "Muted"}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key}
      >
        <svg viewBox="0 0 34 28" aria-hidden="true">
          <defs>
            <linearGradient id={`${id}-g`}>
              <stop offset="0" stopColor="black" />
              <stop offset="0.18" stopColor="white" />
              <stop offset="0.82" stopColor="white" />
              <stop offset="1" stopColor="black" />
            </linearGradient>
            <mask
              id={`${id}-m`}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="34"
              height="28"
            >
              <rect width="34" height="28" fill={`url(#${id}-g)`} />
            </mask>
          </defs>
          <g mask={`url(#${id}-m)`}>
            <g className="travel">
              <polyline className="wave" points={POINTS} />
            </g>
          </g>
        </svg>
        <span className="sound-tip" aria-hidden="true">
          Trim volume
        </span>
      </div>
      <button
        type="button"
        className="sound-key"
        aria-label={on ? "Mute sound" : "Unmute sound"}
        onClick={toggleMuted}
      >
        {/* All three words share one place: the change is a cross-fade, nothing moves. */}
        <span data-word="mute" data-show={(on && held === null) || undefined}>
          Mute
        </span>
        <span
          data-word="unmute"
          data-show={(!on && held === null) || undefined}
        >
          Unmute
        </span>
        <span data-word="percent" data-show={held !== null || undefined}>
          {silent ? (
            "Muted"
          ) : (
            <>
              {percent}
              <i>%</i>
            </>
          )}
        </span>
      </button>
    </div>
  );
}
