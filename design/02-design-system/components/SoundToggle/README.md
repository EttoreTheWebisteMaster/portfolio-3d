# SoundToggle

The site's global mute, drawn as a waveform: no label, no circle.

- **Provide:** `<button class="es-sound" aria-pressed="true" aria-label="Sound">` holding one 34×14 SVG with a `polyline.wave` (two cycles of a sine under an envelope) and a `line.flat`.
- **On:** the yellow wave with a soft glow, breathing at ~8fps (the grain's rhythm). **Off:** a dashed flat line in `ash`. Hover brightens either; nothing moves or scales.
- 44×44 hit area, last item of the top row, after a 1px `es-bar-divider`. `aria-pressed` carries the state; the label never changes.
- The loading page's "Enter with sound" / "Enter in silence" sets it first; remember the state across visits.
- `prefers-reduced-motion`: the wave stays still.
