import { useSyncExternalStore } from "react";

const KEY = "sound";
const listeners = new Set<() => void>();

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => void listeners.delete(cb);
};

export const readSound = () => {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
};

/** Persists the sound choice and tells every toggle. */
export function setSound(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  listeners.forEach(cb => cb());
}

export const useSound = () =>
  useSyncExternalStore(subscribe, readSound, () => false);
