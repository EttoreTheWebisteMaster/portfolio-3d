# Scene

The ground of every section: `bg-base`, one motivated light, animated grain and a vignette.

- **Provide:** a fullscreen container (100vh at desktop) and the light's position as `--light-x` / `--light-y` (percent) and strength `--light-strength` (8–24%). Add `es-scene--screen-light` when the source is a screen (uses `light-screen` instead of `light-warm`).
- Children sit above the light and below the grain automatically.
- Set `data-theme="paper"` on the scene for About; grain drops to 5% and multiplies.
- **Do** place the light where the visible source is (lamp, window, screen). **Don't** stack two lights or add decorative gradients.
- Grain steps at 8fps and stops under `prefers-reduced-motion`.
