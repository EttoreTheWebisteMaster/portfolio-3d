import { useSyncExternalStore } from "react";

import { MODEL_URL } from "@/lib/assets";

/** What the site waits for, and how much of the bar each part is worth. */
const WEIGHTS = { model: 0.5, scene: 0.15, warm: 0.25, frame: 0.1 } as const;
type LoadPart = keyof typeof WEIGHTS;

type Snapshot = {
  progress: number;
  entered: boolean;
  started: boolean;
  modelUrl: string | null;
};

const parts: Record<LoadPart, number> = {
  model: 0,
  scene: 0,
  warm: 0,
  frame: 0,
};
const listeners = new Set<() => void>();
const enterCallbacks = new Set<() => void>();
let snapshot: Snapshot = {
  progress: 0,
  entered: false,
  started: false,
  modelUrl: null,
};

const emit = (next: Partial<Snapshot>) => {
  snapshot = { ...snapshot, ...next };
  listeners.forEach(cb => cb());
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => void listeners.delete(cb);
};

/** Real load progress, 0–1. */
export function useLoading() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => snapshot
  );
}

export const getLoading = () => snapshot;

/** A part of the load reports how far it is, 0–1. */
export function report(part: LoadPart, value: number) {
  parts[part] = Math.min(Math.max(value, parts[part]), 1);
  // Rounded so the weights add up to exactly 1 (the weights are not exact in floats).
  const progress =
    Math.round(
      (Object.keys(WEIGHTS) as LoadPart[]).reduce(
        (sum, key) => sum + parts[key] * WEIGHTS[key],
        0
      ) * 1000
    ) / 1000;
  if (progress !== snapshot.progress) emit({ progress });
  if (part === "frame" && !snapshot.started) emit({ started: true });
}

const FETCH_TIMEOUT_MS = 15000;

let fetching = false;
/** Streams the robot once, counting bytes, and hands the three.js loader a blob so nothing downloads twice. */
export async function fetchModel() {
  if (fetching) return;
  fetching = true;
  try {
    const res = await fetch(MODEL_URL, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`model ${res.status}`);
    const total = Number(res.headers.get("content-length")) || 0;
    const reader = res.body?.getReader();
    if (!reader) throw new Error("no body");
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value as Uint8Array<ArrayBuffer>);
      got += value.length;
      if (total) report("model", (got / total) * 0.98);
    }
    const url = URL.createObjectURL(new Blob(chunks));
    report("model", 1);
    emit({ modelUrl: url });
  } catch {
    // Offline, slow or blocked: let three.js try the plain URL itself, so the loader never hangs.
    report("model", 1);
    emit({ modelUrl: MODEL_URL });
  }
}

/** The visitor is in: the opening shot and the page's entrance start now. */
export function enter() {
  if (snapshot.entered) return;
  emit({ entered: true });
  enterCallbacks.forEach(cb => cb());
  enterCallbacks.clear();
}

/** Runs `cb` once the visitor has entered (immediately if they already have). */
export function onEnter(cb: () => void) {
  if (snapshot.entered) {
    cb();
    return () => {};
  }
  enterCallbacks.add(cb);
  return () => void enterCallbacks.delete(cb);
}
