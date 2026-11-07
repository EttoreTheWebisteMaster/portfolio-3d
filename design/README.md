# Ettore Serra · Portfolio — design package

Everything needed to design or build the portfolio, in one folder. Exported 7 November 2026 from the claude.ai project **Portfolio**, the **Design system** artifact and the **Canvas** artifact.

> The site is a film. ROB-092, a small orange robot, is the one continuous actor. The cinema lives in light, composition, type and small silent details — never in drawn props, never in the copy. Goal: Awwwards SOTD/SOTY. "Cinema, but subtly perfect."

## Start here

1. **`PAGES.md`** — how to build each page, consolidated from every source, with the frames to look at.
2. **`OPEN-ISSUES.md`** — where the sources disagree and what's still undecided. Read before building anything.
3. Open **`05-screenshots/`** to see every designed frame at 2×.

## Folder map

| Folder | What's inside | Origin |
|---|---|---|
| `01-brief/Portfolio.md` | The v6 brief: concept, who/why, binding decisions, rejected ideas, every page, project list, motion/sound/3D | Project doc |
| `01-brief/Working-instructions.md` | How to work on the project: role, sources of truth, the default loop, Awwwards scorecard, flaw checklist, identity invariants, overrides, shortcuts | Project doc (= project instructions) |
| `02-design-system/README.md` | The brand book: content rules, the frame, light, colour, type, grid, components, motion, ROB-092, don'ts | Design system artifact |
| `02-design-system/scenes.md` | Scene-by-scene shot list (light, subject, composition, bars, theme) + per-section rules | Design system artifact |
| `02-design-system/tokens.json` | **Canonical tokens**: colour (screen + paper themes), type, spacing, radius, shadow, opacity | Design system artifact |
| `02-design-system/tokens.css` | The same tokens as CSS custom properties (generated from tokens.json for convenience) | Generated |
| `02-design-system/components/` | 18 components: `README.md` (rules) + `preview.html` each, and `bundle.css` (component styles, reads tokens.css) | Design system artifact |
| `03-page-specs/About-scene.md` | About v23 spec | Project doc |
| `03-page-specs/Contact-scene.md` | Contact v8 + footer strip spec | Project doc |
| `04-canvas/frames/*.html` | Every canvas frame as a **standalone HTML page** — open in a browser (fonts load from Google Fonts) | Canvas, converted |
| `04-canvas/source/` | The original `.dc.html` frames and `canvas.json` (board layout, titles, order), untouched, for re-importing into the canvas | Canvas artifact |
| `04-canvas/assets/` | The 13 robot / room renders the frames use (2880×1800, mobile 1206×2622) | Canvas assets |
| `05-screenshots/*.png` | Every frame rendered at 2× with the real fonts (Tac One, Alumni Sans, Instrument Sans, Caveat) | Rendered |

## Source priority (when things disagree)

1. Ettore's latest message
2. Design system (`02-design-system/`)
3. Canvas frames (`04-canvas/`)
4. Page specs (`03-page-specs/`) — newer than the brief for their page
5. `01-brief/Portfolio.md` (with `Working-instructions.md` §8 overriding it)

## Frames index

| Page | Desktop 1440×900 | Mobile 402×874 | State |
|---|---|---|---|
| Loading | `Main` (first visit, 64%) · `Leader-Ready` (loaded, waiting for a choice) · `Leader-Return` (return visit 0.6s) | `M-Loading` | Loved, done |
| 01 · Home | `Hero-Open` (wide, 0s) · `Hero` (close-up, poster frame / og:image) · `Hero-Turn` (scroll: copy fades, ROB-092 turns) | `M-Hero-Open` · `M-Hero` | Loved, done |
| 02 · Projects | `Projects-Ignite` (lights off, screen on) · `Projects` (playing Pausa, hovering Chef AI) · `Projects-Long` (long-content test: The Morning Ledger) | — not built | Almost done |
| 03 · About | `About-Iris` (**outdated**) · `About` (v23 poster frame) | `M-About` · `M-About-Interview` | In polish |
| 04 · Contact | `Contact-Hit` (robot lands, sparks) · `Contact` (poster frame) · `Contact-Copied` (Copy email pressed) | — not built | v8 built |
| Footer | `Footer-Strip` (1440×272, under Contact) | — not built | v8 built |
| Case study | — not built | — | Brief only |

## Key links

- Design system artifact: https://claude.ai/code/artifact/d2e821b8-d0d7-4024-9d42-087e7a9d9e4a
- Canvas artifact: https://claude.ai/code/artifact/757b0e6b-ff8d-4abd-b73b-bcb3066f1ae6
- Robot model: RobotExpressive.glb from the three.js examples (CC0, Tomás Laulhé / Quaternius)
- Fonts: `npm i @fontsource/tac-one @fontsource/alumni-sans @fontsource/instrument-sans @fontsource/caveat`

## Notes on the export

- `04-canvas/frames/` pages are the canvas frames with their default state baked in (e.g. Loading at 64%, Hero on the close-up). Props that change state (`progress`, `shot`, `moment`, `state`) are documented in the `<script type="text/x-dc">` block of each file in `04-canvas/source/`.
- `04-canvas/source/ds/ettore-serra/tokens.json` is the canvas's **old copy** of the tokens (still has "NOW CASTING", pill sound button, etc.). Use `02-design-system/tokens.json`.
- The canvas also holds ~70 older renders from earlier iterations; only the 13 images the current frames use are included.
- The design system's artifact-type runtime (`artifact-type/`, `index.html`, `SKILL.md`) is not included: it's the viewer, not the design.
