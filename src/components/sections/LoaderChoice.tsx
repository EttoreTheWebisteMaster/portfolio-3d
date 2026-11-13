"use client";

import { useState, useSyncExternalStore, type Ref } from "react";

import Button from "@/components/ui/Button";
import { chooseSound, hasSoundChoice, subscribeMuted } from "@/lib/sound";

type Props = Readonly<{
  ref: Ref<HTMLDivElement>;
  /** A pointer or the keyboard focus is on (true) or has left (false) one of the keys. */
  onPause: (source: "pointer" | "focus", on: boolean) => void;
}>;

/** The loading page's first-visit question: two keys, sound or silence. The server never renders it (it cannot know), so a returning visitor never sees it flash. */
export default function LoaderChoice({ ref, onPause }: Props) {
  const asking = useSyncExternalStore(
    subscribeMuted,
    () => !hasSoundChoice(),
    () => false
  );
  const [asked, setAsked] = useState(false);
  if (asking && !asked) setAsked(true);
  if (!asked) return null;
  return (
    <div
      ref={ref}
      className="loader-choice"
      data-auto=""
      data-chosen={asking ? undefined : ""}
      onPointerEnter={() => onPause("pointer", true)}
      onPointerLeave={() => onPause("pointer", false)}
      onFocus={() => onPause("focus", true)}
      onBlur={() => onPause("focus", false)}
      onKeyDown={e => {
        // The page behind is inert: Tab goes round the two keys.
        if (e.key !== "Tab") return;
        const keys = [...e.currentTarget.querySelectorAll("button")];
        const at = keys.indexOf(document.activeElement as HTMLButtonElement);
        const next =
          keys[(at + (e.shiftKey ? -1 : 1) + keys.length) % keys.length];
        e.preventDefault();
        next?.focus();
      }}
    >
      <p className="loader-note load-label">Best with sound on</p>
      <Button onClick={() => chooseSound(true)}>Enter with sound</Button>
      <Button variant="secondary" onClick={() => chooseSound(false)}>
        Enter in silence
      </Button>
    </div>
  );
}
