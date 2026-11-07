---
paths: ["src/components/**/*.tsx", "src/app/**/*.tsx"]
---

- One component per file, PascalCase, default export, props typed `Readonly<Props>`.
- `ui/` = primitives (wrap Headless UI, own their a11y). `sections/` = page blocks composed from `ui/`. Pages compose sections only.
- Reuse first: Glob `src/components` before writing. Similar markup twice → extract a primitive. Visual variants → `variant` prop mapped to full class names (`{ primary: "btn-primary" }`), never `btn-${v}`.
- Accept `className` only for layout overrides; merge with `cn()` from `@/lib/cn`.
- Headless UI owns keyboard/ARIA. Don't re-implement menus, dialogs, tabs, listboxes.
- Media: `next/image` with `sizes`; fonts via `next/font` in `layout.tsx`.
- No `useEffect` data fetching; fetch in Server Components.
- Must hold at 375 / 768 / 1440 without overflow.
