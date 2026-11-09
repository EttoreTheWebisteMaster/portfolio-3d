import { INTRO } from "@/lib/journey";

/** The sub-bass hit under the light slam, synthesized so no file is shipped. Call from the Enter click so the browser lets it play. */
export function playImpact() {
  try {
    const ctx = new AudioContext();
    const at = ctx.currentTime + INTRO.slam;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, at);
    out.gain.exponentialRampToValueAtTime(0.5, at + 0.015);
    out.gain.exponentialRampToValueAtTime(0.0001, at + 2.2);
    out.connect(ctx.destination);

    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(90, at);
    sub.frequency.exponentialRampToValueAtTime(34, at + 1.4);
    sub.connect(out);
    sub.start(at);
    sub.stop(at + 2.3);

    // A short breath of noise: the air the light displaces.
    const length = ctx.sampleRate * 1.6;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(2400, at);
    lowpass.frequency.exponentialRampToValueAtTime(180, at + 1.4);
    const hiss = ctx.createGain();
    hiss.gain.value = 0.35;
    noise.connect(lowpass).connect(hiss).connect(out);
    noise.start(at);

    sub.onended = () => void ctx.close();
  } catch {
    // No Web Audio: the shot plays in silence.
  }
}
