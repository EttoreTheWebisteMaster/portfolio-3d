import { useCallback, useEffect, useRef, useState } from "react";

import { PICKS, QUESTIONS } from "@/lib/interview";

/** How long a retiring suggestion takes to fade out before its slot gets a new one, in ms. */
const LEAVE_MS = 220;

/**
 * The suggestions, one slot each. Asking a question retires only the suggestion it came from: it fades out and a question not yet asked
 * takes the same slot (once every one has been asked, the pool starts over).
 */
export function usePicks() {
  const [slots, setSlots] = useState(() =>
    QUESTIONS.slice(0, PICKS).map(q => q.id)
  );
  const [leaving, setLeaving] = useState<number[]>([]);
  const asked = useRef(new Set<string>());
  /** One timer per slot, so a second pick inside the fade does not cancel the first slot's refill. */
  const timers = useRef(new Set<number>());
  useEffect(() => {
    const all = timers.current;
    return () => all.forEach(t => window.clearTimeout(t));
  }, []);

  const retire = useCallback(
    (id: string) => {
      asked.current.add(id);
      const slot = slots.indexOf(id);
      if (slot < 0) return;
      setLeaving(now => [...now, slot]);
      const t = window.setTimeout(() => {
        timers.current.delete(t);
        setSlots(now => {
          const shown = new Set(now);
          const next =
            QUESTIONS.find(q => !shown.has(q.id) && !asked.current.has(q.id)) ??
            QUESTIONS.find(q => !shown.has(q.id));
          return next ? now.map((s, i) => (i === slot ? next.id : s)) : now;
        });
        // Once every question has been asked the pool starts over.
        if (QUESTIONS.every(q => asked.current.has(q.id)))
          asked.current.clear();
        setLeaving(now => now.filter(n => n !== slot));
      }, LEAVE_MS);
      timers.current.add(t);
    },
    [slots]
  );

  return {
    picks: slots.flatMap(id => QUESTIONS.find(q => q.id === id) ?? []),
    leaving,
    retire,
  };
}
