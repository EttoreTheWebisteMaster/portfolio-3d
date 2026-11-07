---
name: audit
description: Design + accessibility audit of a route at 375 and 1440, max 10 findings.
disable-model-invocation: true
argument-hint: "[route]"
---

1. `npm run shot -- $ARGUMENTS` and read both screenshots.
2. Check: contrast, focus-visible, keyboard order, heading order, spacing rhythm, type scale, component states, overflow, reduced motion, token consistency. Use `web-design-guidelines` if installed.
3. Output one table only: `sev | where | issue | fix (≤8 words)`. Max 10 rows. No prose.
