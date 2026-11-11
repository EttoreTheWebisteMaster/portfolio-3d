# How to build each page

One place for every page: what it is, how it's built, which frames to copy and which docs hold the detail. Where sources disagreed, this file follows the newest one (frames and page specs over the brief) and flags it in `OPEN-ISSUES.md`.

---

## Shared by every page

**Frame (Letterbox component).** Top row 72px (56px mobile) on the 64px margins:
- Logo: ETTORE (Alumni Sans 800, cream) + SERRA (600, `#8C8576`, brightens to cream on hover, 260ms), 16px, tracked +24%. No mark.
- Nav centred: Projects⁰⁹ · About · Contact, Alumni 600 18px +10%, `#8C8576`. Current page: cream + 5px lit yellow dot to its left. No underline.
- Right: `TC 00:00:05:00` (TC fog · HH:MM:SS cream · :FF ash), 44px scroll track with a yellow tick, 1px divider, waveform SoundToggle (34×14, yellow breathing sine on / dashed ash line off, 44px hit area, `aria-pressed`).
- Bottom row: `0X · Page` left (label-s, tertiary) · one yellow cue `Next ↓` centred · `0X / 04` + one tick per section (current lit yellow) right.
- Mobile top row: logo 14px · waveform · divider · Menu (two lines, the short one yellow). No timecode.
- **Bars** (black `#000` behind the rows) are per page: Loading slides them in, Home and About keep them, Projects and Contact have none.

**Scene constants on dark pages:** animated grain (0.09, ~8fps), vignette (0.55), teal/orange grade, dust in beams. One motivated light; type lit by it. Only gradients are light.

**Type roles:** Tac One = the name, marquee titles (uppercase only) · Alumni Sans = headlines, labels, buttons, timecodes (uppercase, never < 13px) · Instrument Sans = everything you read · Caveat = one note per screen, ≤ 6 words.

**Buttons:** one primary per screen (yellow, ink text, `glow-yellow` → `glow-yellow-hot` on hover, 1px sink on press, 40% disabled). Square corners. Focus 2px yellow ring, 3px offset. Copy says what happens.

**3D:** one persistent R3F canvas behind the DOM; ROB-092 is the same RobotExpressive model throughout, matte with a light sheen (body `#F29A26` m0.22 r0.4 cc0.12 · grey `#BDB9AE` m0.35 r0.36 · black `#3D3D3D` m0.15 r0.28 · env 0.6 · ACES). The scene light is sampled each frame into CSS variables so DOM glows match.

**Motion:** cuts are 2-frame black flashes (white into About) + gate jitter + projector clack. Scrubbed moves are linear to scroll. UI easing `cubic-bezier(0.2, 0.7, 0, 1)` 160ms hover / 320ms reveal. Reduced motion: every camera move becomes a cut, grain static.

**Grid:** 12 cols / 64px margins / 24px gutters at 1440 · 8 / 40px at 1024 · 4 / 20px at 402. 4px spacing scale. Mobile is recomposed, not shrunk.

Details: `02-design-system/README.md`, `components/Letterbox`, `Logo`, `SoundToggle`, `Scene`, `Button`.

---

## Loading (not counted) — loved, done

**Frames:** `Main` (first visit, 64%) · `Leader-Ready` (loaded, holding on 1) · `Leader-Return` (return visit) · `M-Loading`.

- Film countdown: big yellow Tac One numeral with glow, two thin cream rings, crosshair, a cream sweep (~20%) driven by **real** load progress. 5 → 1 maps onto 0–100% (`num = max(1, 5 − floor(p/20))`).
- Orange light-leak burns in two corners, scratches.
- Bottom-left from the first frame: "Loading · 64%" + thin progress line, ETTORE SERRA, "Designer & engineer · Turin, or remote". Bottom corners: "Portfolio · 2026" / "Turin, Italy".
- Bottom-right: **Enter with sound** (primary, speaker glyph) / **Enter in silence** (secondary), with the page's one Caveat note "best with sound on" + hand-drawn arrow. The click unlocks audio; the choice is remembered.
- No bars at first: from 80% → 100% load they slide in, eased out (`t=(p−80)/20`, `1−(1−t)³` × 72px; 56px mobile).
- Return visit: one 0.6s light-leak frame on "1", "Welcome back · sound on, as you left it", then the cut to Home.
- Component: `LeaderCountdown`, `Annotation`.

## 01 · Home (hero) — loved, done

**Frames:** `Hero-Open` (wide, 0s) · `Hero` (close-up after push-in, 5s — poster frame, og:image, Awwwards thumbnail) · `Hero-Turn` (scroll) · `M-Hero-Open` · `M-Hero`.

- Light: hard spotlight top-left, visible beam with dust, warm floor glow.
- ETTORE SERRA in Tac One gold (`gold-hi → gold → gold-lo`, brightest top-left), **part of the 3D set** (lit, shadowed, covered by ROB-092) + a visually hidden `<h1>`.
- Opening shot ~5s, once per visit, eased out: a **dolly zoom** from full-body wide to medium close-up where his head covers the base of the name. Only the 3D layer moves; copy never moves.
- Bottom-left copy: "Designer & engineer. / One person." (Alumni poster) · body "Six years turning ideas into interfaces people remember. Full stack, with a designer's eye: React, Next.js and Three.js, from Turin to anywhere." · **See the projects** (primary) · **Ask the robot** (secondary → About).
- Bottom-right billing block: Design & development **Ettore Serra** with **ROB-092** · React · Next.js · Three.js · GSAP · TypeScript · Swift · Python · Figma · Generative AI.
- Mouse moves the light slightly so his shadow on the name follows. ROB-092 silent, no Caveat note. Build note: nudge him ~20px right so his hand clears the body text.
- **Home → Projects** (scrubbed, ~two screens): copy fades out with a GSAP stagger · ROB-092 turns 180° (we end on his back) · camera pushes past him, he settles into the blurred crowd · the screen switches on.
- Mobile: name stacked on two lines above the robot, full-width buttons.

## 02 · Projects — almost done, desktop only

**Frames:** `Projects-Ignite` · `Projects` (playing Pausa, hovering Chef AI) · `Projects-Long` (The Morning Ledger). Spec: `scenes.md` §02, brief §6. Component: `ProgrammeList`, `GenreTag`, `Button` (Next pair).

- A real rendered 3D cinema, camera in the middle rows, **no bars** (rows float over the room on soft dark gradients).
- The screen is the only light: its picture's colour lights the floor and audience heads. Faint projector beam with dust. Audience robots blurred, darkened, ≤ 22% (`crowd`).
- **Screen:** flat front-on rectangle, columns 1–6, 680×382, top 112px. Picture only — no UI, no effects.
- **Right column** (cols 8–12, top aligned with the screen), fixed heights that never move:
  1. 28px row: `01 / 09` + facts (e.g. "macOS menu-bar app · SwiftUI · 2026")
  2. +40px · title one line, Tac One **cream** 56px (44px if > 12 chars, never wraps)
  3. +16px · lead 17px, two lines clamped (52px box)
  4. +32px · 48px CTA pair: **View the case study** (primary) · **Next · Antonino · 07s** (yellow underline = the 10s trailer timer, pauses on hover/focus)
  5. +48px · index: four 44px rows visible, scrolling, fading at the bottom, 2px track right. Row = Nº · title (poster-s) · discipline · hairlines.
- **Hover a row:** title cream, number yellow, → appears; a 224×140 thumbnail floats beside the cursor at −3°, overlapping the screen edge; the screen cuts to that trailer. No borders, no layout shift.
- Trailers: the first plays on arrival (with sound if on); each one ending starts the next and the list follows.
- Sequence in: spotlight dies · 3 black frames · screen ignites as a line, then the picture.
- Opening a project grows the screen to fill the viewport → case-study hero.
- Projects (sample): Pausa · Antonino · Chef AI · The Morning Ledger · This portfolio · Photo Curator · INFN · Mr Fruitman · Local Agents.
- **To do:** mobile frames.

## 03 · About — v24 (no triangle; the walk-out)

> **v24 supersedes the v23 notes below** (triangle, tunnel, "leans out of the cut", cut-aligned facts). See `03-page-specs/About-scene.md`: ROB-092 walks into a cream room at the end of the Projects → About shot and stops on his mark; facts align to his feet line.

**Frames:** `About` (v23) · `M-About` · `M-About-Interview` · `About-Iris` (**outdated** — redo to v23). Spec: `03-page-specs/About-scene.md`.

- The only cream (`[data-theme="paper"]`) scene, cut in on a 2-frame white flash. Grain 0.05 multiply.
- A thin crisp triangular cut in the cream wall (no bevel), opening onto a 10-unit tunnel that fades to black — nothing readable, no warm light. Neutral daylight from top-left.
- **ROB-092 leans out like someone at a window**, forearms folded on the bottom edge, looking at you; hips behind the wall (no clipping). Pose: Idle @1.2s, lean 0.5 rad, head −0.5, turn 0.12 rad; Shoulders −0.9 x; LowerArmL −1.5 / R +1.5 z; position (0, −1.72, −1.1), scale 1.55. Camera yc 2.8, D 17.4. Triangle apex y 133, base y 717. One soft shadow on the cream (`cast-paper`); no other shadows.
- Right column x 980, width 396: headline (Alumni 800, 84/0.84, ink) · +20px context (17/1.6, dust): "I'm ROB-092, his AI publicist. Ask about his work, his stack or when he can start." · +28px ask line: ink caret, "Type your question", yellow **ASK →** key with ink text · hairline at y 606 then a 2×2 Facts grid (Experience 6 years · Last team INFN · Based Turin / remote · Status Available), last row level with the cut's base.
- Caption bottom-left (x 64, y 736): **ROB-092** / Public relations unit.
- Bars: the Home rows on black; "03 · About" · "Contact ↓".
- **Interview (hybrid):** suggested questions play pre-written answers (no API call); only free-typed questions reach a guarded free-tier LLM that answers only about Ettore. Note: "An AI trained on Ettore's CV. May embellish. Nothing is stored." Answers type on at ~40 chars/s with gibberish audio. Never chat bubbles or a chat panel.
- Motion: idle breathing, head tracks the cursor and looks at you while speaking, nod on send, hole parallax. Reduced motion: static.
- Mobile: render on top between the bars (783×490 at −71, 30), caption at y 466, then headline, context, ask line. Asking opens `M-About-Interview`: full screen, no bars, smaller render, "You asked: …", the answer, ask line above the keyboard.
- Yellow on cream only as fills with ink on top (ASK key, highlight, active dot). Accent type on cream is red.

## 04 · Contact — v8 built (desktop)

**Frames:** `Contact-Hit` · `Contact` (poster frame) · `Contact-Copied`. Spec: `03-page-specs/Contact-scene.md` (supersedes the brief and `scenes.md`).

- A dark hazy warehouse floor. A hanging lamp just above the top-left corner throws one hard **cold** beam (`#EEF2F3`) diagonally onto the floor, passing behind the buttons. Cold, near-colourless grade, teal multiply 22%.
- **No bars, no ROB-092, no CONTACT title** (hidden `<h1>`), **no email on screen**, no 3D interactions.
- Centred: pitch line at top 322 (Instrument 20/1.5, `#CFC8B8`) "Open to frontend and full-stack roles. Turin or remote, employee or freelance." · 36px below, three 80px buttons, Alumni 700 26px +0.08em, 16px gap: **Copy email** (primary) · LinkedIn · GitHub (secondary, cream 12%) · status line under them (13px), empty at rest.
- Grey robots (`Main #3C3B38`, `Grey #302F2C`) fall randomly from above the frame behind the DOM: random x, depth, spin; one every ~1.5–3s, ≤ 6 in frame; they pile at the edges of the light, oldest fade out; a clear zone around the buttons. Landing in the light → sparks (~300ms, the only warm colour) + clang if sound is on.
- Copy email: label → "Copied" + check, hot glow, beam brightens for a beat, `role="status"`: "serra.ettore.es@gmail.com is on your clipboard". Fallback to `mailto:` without the Clipboard API.
- Reduced motion: static frame, two robots on the floor at the edges, beam still.
- **To do:** mobile (buttons stacked full width, fewer robots).

## Footer strip — v8 built

**Frame:** `Footer-Strip` (1440×272, directly below Contact; not a counted page).

- Black `#0B0A09`, hairline on top. Left: "© 2026 Ettore Serra" (Alumni 700 20px) + "Designed and built in Turin. Next.js, Three.js, GSAP." · centre: **Back to top ↑** (yellow) · right: Email · LinkedIn · GitHub (ash → cream on hover) + "Robot model by Tomás Laulhé / Quaternius, CC0."
- The earlier billing-block footer with the gold name and the post-credits line ("Is he hired yet?") is parked.

## Case study (sample: Pausa) — not built

Source: brief §6 and `scenes.md`. Components: `EpisodeRow`, `Fact`, `Button` (timer).

- Reached by the Projects screen growing to fill the viewport.
- Hero (loved in v5, keep): night interior; the monitor playing the trailer is the only light, moonlit window with blinds as fill; ROB-092 on the desk, rim-lit by the screen. Title `poster-xl` with a lit gradient, real meta only (year · platform · stack · read time), **Play trailer** · **View on GitHub** · "← Back to projects".
- Then: story + episode list (The story · Design decisions · Design system · Final result) · palette & type · final result (interface stills) · more projects + "Next project in 07s" (`es-btn--timer`, cancelled by any scroll or click).
- Every case study shows the engineering (performance, accessibility, architecture) next to the spectacle.
- Bars: undecided.

## Tablet 1024

Not designed. 8 columns, 40px margins; keep as close to desktop as possible.
