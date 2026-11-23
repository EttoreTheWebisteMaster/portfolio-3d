/** Tiny synthesized sound effects (WebAudio): no files, no dependency. Silent until the visitor's first gesture. */
const KEY = "sound-muted";
const LEVEL_KEY = "sound-volume";
/** The level unmuted sound starts at, and the loudness 1 of the effects is tuned for. */
export const DEFAULT_VOLUME = 0.75;
/** The quietest audible level: dragging below it is the same as muting. */
export const MIN_VOLUME = 0.25;
type Kind = "pop" | "thud" | "ooh" | "step";

let ctx: AudioContext | null = null;
let armed = false;
let muted: boolean | null = null;
/** The last audible level (0–1): unmuting goes back to it. */
let level: number | null = null;
let master: GainNode | null = null;
const listeners = new Set<() => void>();

function stored() {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Browsers only allow audio after a gesture: opens the context on the first one. */
export function armSound() {
  if (armed || typeof window === "undefined") return;
  armed = true;
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

function unlock() {
  ctx ??= new AudioContext();
  void ctx.resume();
}

export function isMuted() {
  muted ??= stored();
  return muted;
}

function storedLevel() {
  try {
    const v = Number(window.localStorage.getItem(LEVEL_KEY));
    return v >= MIN_VOLUME && v <= 1 ? v : DEFAULT_VOLUME;
  } catch {
    return DEFAULT_VOLUME;
  }
}

/** What the speakers get, 0–1: 0 is muted. */
export function getVolume() {
  level ??= storedLevel();
  return isMuted() ? 0 : level;
}

/** Gain for sound made outside the shared output (1 at the default level). */
export const volumeGain = () => getVolume() / DEFAULT_VOLUME;

function applyVolume() {
  if (master && ctx)
    master.gain.setTargetAtTime(volumeGain(), ctx.currentTime, 0.03);
}

/** Every effect goes through one gain, so the volume key moves them all at once. */
function output(c: AudioContext) {
  if (!master) {
    master = c.createGain();
    master.gain.value = volumeGain();
    master.connect(c.destination);
  }
  return master;
}

export function subscribeMuted(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let choice: boolean | null = null;
let passed = false;

/** Whether the visitor has picked sound or silence before: the loading page asks only the first time. */
export function hasSoundChoice() {
  if (typeof window === "undefined" || passed) return true;
  try {
    choice ??= window.localStorage.getItem(KEY) !== null;
  } catch {
    choice ??= false;
  }
  return choice;
}

function save(next: boolean) {
  muted = next;
  choice = true;
  try {
    window.localStorage.setItem(KEY, muted ? "1" : "0");
    window.localStorage.setItem(LEVEL_KEY, String(level ?? DEFAULT_VOLUME));
  } catch {
    // Storage can be blocked: the choice then lasts for this visit only.
  }
  applyVolume();
  listeners.forEach(l => l());
}

/** A click: silence, or back to the level it had before. */
export function toggleMuted() {
  level ??= storedLevel();
  save(!isMuted());
}

/** The level being dragged to (0–1). Below the minimum it is silence, but the last audible level is kept for the next unmute. Pass `persist: false` while the drag goes on, and call `saveVolume` when it ends. */
export function setVolume(v: number, persist = true) {
  const next = Math.min(Math.max(v, 0), 1);
  level ??= storedLevel();
  if (next >= MIN_VOLUME) level = next;
  muted = next < MIN_VOLUME;
  choice = true;
  applyVolume();
  if (persist) saveVolume();
  else listeners.forEach(l => l());
}

/** Writes the current mute switch and level to storage, and tells everyone. */
export function saveVolume() {
  save(isMuted());
}

/** The visitor pressed nothing: this visit is silent, but nothing is saved, so the question comes back next time. */
export function enterSilently() {
  passed = true;
  muted = true;
  listeners.forEach(l => l());
}

/** The loading page's two buttons: a click is the gesture that lets the browser play audio. */
export function chooseSound(withSound: boolean) {
  unlock();
  save(!withSound);
}

function tone(
  type: OscillatorType,
  from: number,
  to: number,
  seconds: number,
  peak: number
) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + seconds);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  osc.connect(gain).connect(output(ctx));
  osc.start(t);
  osc.stop(t + seconds + 0.05);
}

export function play(kind: Kind) {
  if (!ctx || ctx.state !== "running" || isMuted()) return;
  if (kind === "pop") tone("sine", 620, 240, 0.09, 0.1);
  else if (kind === "thud") {
    tone("sine", 140, 40, 0.22, 0.25);
    tone("triangle", 90, 35, 0.12, 0.12);
  } else if (kind === "step") {
    // A soft metallic footfall: a short ring over a low tap.
    tone("triangle", 1100, 520, 0.05, 0.02);
    tone("sine", 150, 70, 0.08, 0.05);
  } else {
    tone("sine", 330, 420, 0.5, 0.04);
    tone("sine", 495, 630, 0.5, 0.02);
  }
}

let hum: GainNode | null = null;
let air: GainNode | null = null;

/** Room tone: the cinema's low hum (`mix` 0) gives way to a breath of daylight air (`mix` 1). Silent while muted. */
export function roomTone(mix: number) {
  if (!ctx || ctx.state !== "running") return;
  if (!hum || !air) {
    const c = ctx;
    hum = c.createGain();
    air = c.createGain();
    hum.gain.value = air.gain.value = 0;
    const low = c.createOscillator();
    low.type = "sine";
    low.frequency.value = 55;
    low.connect(hum).connect(output(c));
    low.start();
    const noise = c.createBufferSource();
    const buffer = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    noise.loop = true;
    const soft = c.createBiquadFilter();
    soft.type = "lowpass";
    soft.frequency.value = 700;
    noise.connect(soft).connect(air).connect(output(c));
    noise.start();
  }
  const on = isMuted() ? 0 : 1;
  const t = ctx.currentTime;
  // Only during the walk-out: the hum is there while it plays, then the air; both are gone on Home and Contact (mix < 0).
  const live = mix < 0 ? 0 : on;
  hum.gain.setTargetAtTime(0.02 * (1 - mix) * live, t, 0.2);
  air.gain.setTargetAtTime(0.012 * mix * live, t, 0.2);
}
