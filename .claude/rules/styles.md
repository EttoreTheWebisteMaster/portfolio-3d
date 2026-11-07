---
paths: ["src/app/globals.css"]
---

- Order: `@import "tailwindcss"` → `@theme` tokens → `@layer base` → one commented `@utility` group per component.
- Raw colors/values only inside `@theme`. Name tokens by role (`--color-surface`), never by hue.
- A token in `@theme` generates its utility: `--radius-card` → `rounded-card`, `--shadow-card` → `shadow-card`. Use those, not `-[...]`/`-(--var)`.
- Component classes: `@utility <component>[-<variant>]`, base first (`btn`), variants `@apply` the base.
- Every interactive utility covers hover, focus-visible, active, disabled; Headless UI states via `data-open:`, `data-focus:`, `data-checked:`, `data-closed:`.
- Delete a utility when its last use goes. `npm run styles` reports unused/duplicate ones.
