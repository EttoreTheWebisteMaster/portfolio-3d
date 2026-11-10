/** Tiny synthesized sound effects (WebAudio): no files, no dependency. Silent until the visitor's first gesture. */
const KEY = "sound-muted";
type Kind = "pop" | "thud" | "ooh";

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
  const open = () => {
    ctx ??= new AudioContext();
    void ctx.resume();
  };
  window.addEventListener("pointerdown", open, { once: true });
  window.addEventListener("keydown", open, { once: true });
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

export function toggleMuted() {
  muted = !isMuted();
  try {
    window.localStorage.setItem(KEY, muted ? "1" : "0");
  } catch {
    // Storage can be blocked: the choice then lasts for this visit only.
  }
  listeners.forEach(l => l());
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
  } else {
    tone("sine", 330, 420, 0.5, 0.04);
    tone("sine", 495, 630, 0.5, 0.02);
  }
}
