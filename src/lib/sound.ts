/** Tiny synthesized sound effects (WebAudio): no files, no dependency. Silent until the visitor's first gesture. */
const KEY = "sound-muted";
type Kind = "pop" | "thud" | "clang" | "ooh" | "step";

let ctx: AudioContext | null = null;
let armed = false;
let muted: boolean | null = null;
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

export function subscribeMuted(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let choice: boolean | null = null;

/** Whether the visitor has picked sound or silence before: the loading page asks only the first time. */
export function hasSoundChoice() {
  if (typeof window === "undefined") return true;
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
  } catch {
    // Storage can be blocked: the choice then lasts for this visit only.
  }
  listeners.forEach(l => l());
}

export function toggleMuted() {
  save(!isMuted());
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
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + seconds + 0.05);
}

export function play(kind: Kind) {
  if (!ctx || ctx.state !== "running" || isMuted()) return;
  if (kind === "pop") tone("sine", 620, 240, 0.09, 0.1);
  else if (kind === "thud") {
    tone("sine", 140, 40, 0.22, 0.25);
    tone("triangle", 90, 35, 0.12, 0.12);
  } else if (kind === "clang") {
    tone("square", 1700, 650, 0.14, 0.05);
    tone("triangle", 520, 240, 0.3, 0.07);
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
    low.connect(hum).connect(c.destination);
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
    noise.connect(soft).connect(air).connect(c.destination);
    noise.start();
  }
  const on = isMuted() ? 0 : 1;
  const t = ctx.currentTime;
  // Only during the walk-out: the hum is there while it plays, then the air; both are gone on Home and Contact (mix < 0).
  const live = mix < 0 ? 0 : on;
  hum.gain.setTargetAtTime(0.02 * (1 - mix) * live, t, 0.2);
  air.gain.setTargetAtTime(0.012 * mix * live, t, 0.2);
}
