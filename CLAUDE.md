@AGENTS.md

# Project

Next.js 16 App Router · TS strict · Tailwind v4 · Headless UI v2 · GSAP · React Three Fiber · npm

## Commands

dev `npm run dev` · all gates `npm run check` · autofix `npm run fix` · build `npm run build` · shots `npm run shot -- /path`
While editing, prefer the next-devtools MCP `get_compilation_issues` over `npm run build`.

## Map

`src/app` routes · `src/app/globals.css` **all styling** · `src/components/ui` primitives (Headless UI wrappers) · `src/components/sections` page blocks · `src/components/three` R3F · `src/lib` helpers

## Design (source of truth)

`design/` = the full design package. Start: `design/README.md` → `PAGES.md` → `OPEN-ISSUES.md`.

- Tokens: `design/02-design-system/tokens.json` → mirrored in `globals.css` `@theme`. Never import `tokens.css`/`bundle.css`; port rules into `@utility`.
- Components: `design/02-design-system/components/<Name>/README.md`
- Page specs: `design/03-page-specs/` · frames: `design/04-canvas/frames/` · screenshots: `design/05-screenshots/`
- Read only the files the current page needs. Never read `04-canvas/source/`.
- Conflicts: follow the priority in `design/README.md`. Design beats any skill's taste.

## Rules (hooks + CI enforce 1–4)

1. Styling lives only in `globals.css`. JSX `className` = layout utilities + semantic classes defined there. No `style={}`, no other CSS files, no arbitrary values `[...]`.
2. Before creating a component, search `src/components`. Extend with a `variant`/`size` prop; never duplicate.
3. Prettier + ESLint run after every edit. Fix what they report.
4. Never read `.env*`, `package-lock.json`, `.next/`.
5. New dependency → ask first.
6. Server Components by default; `"use client"` only on leaves.
7. Smallest diff that works. No drive-by refactors. Delete dead code you create.
8. Done = `npm run check` passes (+ `npm run shot` for visual changes).

## Workflow

Non-trivial → plan mode first. One task at a time. `/handoff` then `/clear` between unrelated tasks.
Commits: Conventional Commits (`feat:`, `fix:`, `chore:`…). Ship with `/ship`.

## Gotchas

- R3F `<Canvas>` only inside a client component loaded with `next/dynamic` + `ssr: false`.
- GSAP: `useGSAP(fn, { scope })`; plugins registered once in `src/lib/gsap.ts`; `gsap.matchMedia()` for reduced motion; animate transform/opacity only.
- Headless UI v2: style states with `data-open:`, `data-focus:`, `data-disabled:` inside `@utility` in `globals.css`.
- Tailwind v4: tokens in `@theme`, components via `@utility`. No `tailwind.config`.

## Compact instructions

Keep: files changed, failing checks, decisions, next step. Drop: tool output, file contents.
