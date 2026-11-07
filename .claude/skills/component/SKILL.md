---
name: component
description: Create or extend a reusable UI component (Headless UI primitive or page section) with its styles in globals.css. Use for any new UI element, variant, or restyle.
---

1. Glob `src/components/**` and grep `globals.css` for an existing match. Extend it (new `variant`) if ≥70% similar.
2. Pick the layer: `ui/` primitive or `sections/` block.
3. Styles first: add `@utility <name>` (+ variants) to `globals.css` using tokens; new token → `@theme`.
4. Component: layout utilities + those classes only; variants via a `{ key: "full-class" }` map.
5. States: hover, focus-visible, active, disabled, plus loading/empty/error when data-driven.
6. `npm run styles` → fix; for visual work `npm run shot -- /route`.
   Report one line: `✓ <Component> (<files>)`.
