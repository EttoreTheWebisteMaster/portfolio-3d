/** Shared by the Copy button (DOM) and the lamp (3D): when the address was last copied. */
export const copy = { at: -100 };

export const EMAIL = "serra.ettore.es@gmail.com";
export const LINKEDIN = "https://www.linkedin.com/in/ettore-serra-developer";
export const GITHUB = "https://github.com/EttoreTheWebisteMaster";

const PULSE_SECONDS = 1.2;

/** 0 → 1 → 0 over a beat after a copy: the beam brightens, then settles. Sinusoidal and symmetrical. */
export function beamPulse() {
  const since = performance.now() / 1000 - copy.at;
  return since >= 0 && since < PULSE_SECONDS
    ? Math.sin((Math.PI * since) / PULSE_SECONDS)
    : 0;
}
