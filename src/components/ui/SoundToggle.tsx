"use client";

import { useId, useSyncExternalStore } from "react";

import { isMuted, subscribeMuted, toggleMuted } from "@/lib/sound";

// A pure sine, 1.5 cycles across the 34-unit box: it starts and ends on the
// midline and mirrors around the centre. Drawn one period beyond each edge so
// the CSS translate by one period (68/3) loops seamlessly.
const PERIOD = 68 / 3;
const POINTS = Array.from({ length: 160 }, (_, i) => {
  const x = -PERIOD + i * 0.5;
  const y = 7 - 4 * Math.sin((2 * Math.PI * x) / PERIOD);
  return `${x.toFixed(2)},${y.toFixed(2)}`;
}).join(" ");
/** Global mute as a waveform; state persists across visits. */
export default function SoundToggle() {
  const fade = useId();
  const muted = useSyncExternalStore(subscribeMuted, isMuted, () => false);
  const on = !muted;

  return (
    <button
      type="button"
      className="sound-toggle"
      data-on={on}
      aria-label={on ? "Mute sound" : "Unmute sound"}
      onClick={toggleMuted}
    >
      <svg viewBox="0 0 34 14" aria-hidden="true">
        <defs>
          <linearGradient id={`${fade}-g`}>
            <stop offset="0" stopColor="black" />
            <stop offset="0.18" stopColor="white" />
            <stop offset="0.82" stopColor="white" />
            <stop offset="1" stopColor="black" />
          </linearGradient>
          <mask
            id={`${fade}-m`}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="34"
            height="14"
          >
            <rect width="34" height="14" fill={`url(#${fade}-g)`} />
          </mask>
        </defs>
        <g mask={`url(#${fade}-m)`}>
          <g className="travel">
            <polyline className="wave" points={POINTS} />
          </g>
        </g>
      </svg>
      <span className="sound-tip" aria-hidden="true">
        {on ? "Mute" : "Unmute"}
      </span>
    </button>
  );
}
