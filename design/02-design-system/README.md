The website is a film. Every section is a scene, lit like a movie still; the cinema lives in **light, composition, type and small silent details** (timecodes, frame counters, letterbox bars, grain, subtitles) — never in drawn props, and never in the copy. A great design doesn't say what it is: nobody should read the word "film" to feel it. The lead is **ROB-092**, a small orange robot, Ettore's Public Relations Unit. The target reaction: *"How the hell did he do that?"* — cinema, but subtly perfect. Ettore is positioned as a **designer and engineer in one person**: full stack, focused on UX/UI and frontend. The site itself is the primary proof of skill.

## Content fundamentals

- **Voice:** clear, confident, a bit playful, never cheesy. **Copy says things as they are:** Projects, About, Contact, "See the projects", "Loading · 64%". No film vocabulary anywhere in the copy: no "now showing", "now casting", reels, scenes, programme, credits, ratings, "starring", "presents". The cinema stays in the atmosphere, and the atmosphere stays subtle.
  - Good: "Designer & engineer. One person." · "Six years turning ideas into interfaces people remember." · ROB-092: "Is he hired yet?"
  - Never: taglines that tell people what to feel ("an immersive portfolio"), begging for the scroll ("don't stop here ↓ continue scrolling"), exclamation stacks, invented metrics ("98% match", "sorted by what you're hiring for").
- **Functional copy is plain.** Buttons, nav and cues say what they do ("See the projects", not "See the films"); the cinema lives in light, composition and small atmospheric details, never in puns on actions.
- **Hero claim:** "Designer & engineer. One person." Every case study backs it up by showing the engineering (performance, accessibility, architecture) next to the spectacle.
- **Person:** the site talks *about* Ettore in the third person ("he"), the visitor is "you", ROB-092 speaks in the first person. Ettore never says "I" except in a case study's own process notes.
- **Name:** always **Ettore Serra**. Never "Made by Ettore" or a handle.
- **Casing:** Tac One and Alumni Sans are always UPPERCASE. Instrument Sans is sentence case. Caveat is lowercase, with `* asterisks *` around robot sound effects.
- **Separators:** a middle dot with spaces ` · ` between peers; an em dash for asides.
- **Numbers:** timecodes `00:01:24:12`, counters `02 / 05`. Always two digits. Numbers are atmosphere: they never sit next to a film word.
- **No emoji. No phone number.** Contact is email, LinkedIn, GitHub.

## The frame (every scene)

- Every section is one fullscreen scene (100vh, designed at 1440×900), entered by scroll snap or Lenis.
- **The letterbox is an event, not furniture.** No page has bars by default. The bars (`bar-height`, `letterbox` fill) slide in at the end of the countdown leader, from 80% load to 100%, eased out, as the visitor enters the film. Each page then decides whether it keeps them: **Home and About keep them; Projects has none** (the rows float over the 3D room); Contact, Footer and the case study are still to decide.
- **Top row (nav), in the scene itself:** a `bar-height` row on the 64px margins: the logo (ETTORE SERRA as two-weight type) · Projects⁰⁹ / About / Contact (current page: cream with a 5px lit yellow dot, no underline) · `TC 00:00:13:20` with a 44px scroll track, a divider and the waveform Sound toggle. **The nav never moves:** same position on every page. Bars are only a visual layer: where a page has them, the row sits on `letterbox` black; elsewhere it floats over the scene on a soft dark gradient. Full spec: the Letterbox component.
- **Bottom row** (in the scene, or inside the bottom bar when the page keeps it): scene label left (`label-s`, `text-tertiary`) · one cue to the next scene centred (`label-s`, `text-accent`, ending `↓`) · counter and ticks right.
- **Numbering:** each page counts its sections `01 / 05`…`05 / 05`; the countdown is not counted. The bottom-left label names the section plainly (`02 · Projects`, `Pausa · Design system`). The timecode (`HH:MM:SS:FF`) is the scroll position mapped onto the page's runtime.
- Use the **Letterbox** component, with the bars switched on or off per page; never rebuild the rows per page.

## Light (the core rule)

- **One motivated light per scene; everything else falls to shadow.** The source must be visible or implied with a direction: a spotlight, a lamp, a window, a screen.
- **One subject per frame.** If two things glow equally, dim one.
- **Type is lit by the scene.** Big titles take the gold marquee fill (`gold-hi` → `gold` → `gold-lo`, brightest toward the light source) or a glow; they are never pasted flat on top.
- Spills: tungsten sources use `light-warm` at 8–24%; screens use `light-screen` at 6–16% (`screen-spill`). Shadows take `grade-teal` at 20–35%.
- **Constants on dark scenes:** animated grain at ~8fps (`grain` opacity), a vignette (`vignette`), the teal-and-orange grade, and occasional dust in beams. Use the **Scene** component.
- The only gradients on the site are light: radial spills, beams, the gold name. No decorative gradients, no blobs, no glass.
- **2D and 3D share one light.** The WebGL scene sits behind the DOM. Whatever lights the scene (the spotlight, the projects screen) also drives the DOM: its colour and strength are sampled each frame and written to CSS variables, so the text's glow, the spill around the screen and the 3D crowd's rim light are always the same light. Text stays real DOM (crisp, accessible); grain and vignette are one overlay above both layers.

## Colour

- **Black is the ground.** `bg-base` is `black` on every scene except About, which flips to `[data-theme="paper"]` (`cream`). Cream appears as a ground in that one scene only.
- **Yellow means light or action:** the current-page dot, the next-section cue, the one primary button, active states, progress. Never yellow text on cream — on paper the accent becomes `red` (`text-accent`) and the primary becomes `ink` (`action-fill`). On About, yellow survives only as fills with ink on top: the ASK key, the active dot and progress tick.
- **Red is rare and loud:** one word or title per scene at most. Red *type* on dark is `red-lit`; raw `red` is a pigment (dots, underlines) on dark and type only on cream.
- **Orange is the robot's voice:** Caveat notes, gibberish (`text-note`). On cream it becomes red.
- **Legibility floor:** text on its ground meets WCAG AA in both themes. Secondary text is `text-secondary`; `text-tertiary` (`fog`) is only for micro-labels on `black`/`night` and never sits on `smoke`. Grey-on-grey is a bug.
- `rob-body` and `rob-metal` are 3D material colours, not UI colours.

## Typography — four voices, one job each

- **Tac One** (`marquee-*`): the name, section titles, `ROB-092`. Uppercase only (its lowercase is weak). Lit fill or glow.
- **Alumni Sans** (`poster-*`, `label*`): headlines, labels, buttons, billing, meta, timecodes. Uppercase, condensed; labels tracked +6–14%, billing +6–12%. Timecodes and counters use tabular figures. **Nothing below 13px** (`label-s`).
- **Instrument Sans** (`lead`, `body`, `small`, `subtitle`, `dialogue`): everything you read. Body 17/1.55 at max 60ch; lead 22/1.45 at max 40ch; full `text-primary`.
- **Caveat** (`note`, `gibberish`): the director's pencil. **One note per screen, six words max.** Never for body, quotes, the email or anything you must read accurately.
- Mobile scale: `marquee-xl` → 84px, `poster-xl` → 72px, `poster-l` → 44px; reading sizes stay.

## Space, grid, radius

- 4px base: `space-1`…`space-11` (4 → 192). Desktop: 12 columns, `margin-desktop` 64px, `gutter` 24px. Tablet 1024: 8 columns, `margin-tablet`. Mobile 402: 4 columns, `margin-mobile`. Mobile layouts are redesigned, not shrunk.
- Align everything to the 64px margins and the column grid; centred compositions (the triangle, the credits) centre on the grid, not on the content box.
- `radius-0` for everything poster-like (buttons, frames, cards, the screen). `radius-pill` only for things that talk (dance tooltip, chips). `radius-ui` only inside interface chrome (tabs, genre tags).
- Screens and video players are **flat 2D rectangles**, never in perspective.

## Components and states

- **One primary button per screen** (Button `primary`, full `yellow`, `glow-yellow`). Hover makes the light hotter (`glow-yellow-hot`) — buttons don't jump or scale. Pressed sinks 1px. Disabled loses glow and drops to 40%.
- Focus: `2px solid var(--focus-ring)`, 3px offset, on every interactive element.
- **Sound toggle:** a 34×14 waveform, no label: a yellow breathing sine when on, a dashed `ash` line when off, 44px hit area, `aria-pressed` carries the state. Present on every page, the loading page included.
- Hover on lists and rows lights the row (title to `yellow`, a play glyph appears); it never adds borders or shifts layout.
- Netflix is a quiet structural reference only: auto-advance (10s, pauses on hover), filters — never rows of identical thumbnail cards, and never invented metrics (no match %).

## Motion and sound

- Transitions between scenes are **film cuts**: a 2-frame black (or, into About, white) flash, a slight gate jitter, a projector clack. Camera moves are scrubbed by scroll, never on a timer, with one exception: the hero's opening shot.
- Easing: cuts are instant; scrubbed moves are linear to scroll; UI eases `cubic-bezier(0.2, 0.7, 0, 1)` at 160ms (hover) / 320ms (reveal). Marquee letters light with a 60ms stagger.
- Grain animates at ~8fps, not 60.
- `prefers-reduced-motion`: replace every camera move with a cut; grain becomes static.
- **Countdown leader:** runs only as long as the real load (5 → 1 maps onto 0–100%), shows the name and role from the first frame, holds on 1 until the visitor picks sound or silence, and is skipped on return visits (one 0.6s light-leak frame, then the cut).
- **Hero opening shot:** a subtle cinematic push-in (about 5s, eased out, played once per visit) from a full-body wide of ROB-092 to a medium close-up in which he covers part of the name; then scroll takes over. Only the 3D layer is filmed: the copy never moves or shrinks and stays fully legible. The move is a **dolly zoom**: the camera travels in while the lens widens, so the name holds its size while ROB-092 grows into it. The name is part of the 3D set (lit, shadowed and covered for real), with a visually hidden `<h1>` for SEO and screen readers.
- **The poster frame:** the hero's close-up is the site's og:image and Awwwards thumbnail.
- **Hero → Projects (scrubbed by scroll):** the hero copy fades out (GSAP stagger) · ROB-092 turns 180° so we end on his back · the camera pushes in past him and he settles into the blurred crowd at the bottom of the Projects scene · the projects screen switches on and exploring starts.
- Sound is **off until the countdown choice**, then remembered. Hover ticks at −18 dB; clicks, gibberish, hums, clacks. The Sound toggle is always in the top row.

## ROB-092

- **The one continuous actor:** the same real-time model travels through every scene and the site is built around him; he is never reloaded per page.
- **Painted, with a light sheen:** the original matte look plus a touch of reflection from a dark environment (one warm softbox where the key light is, a warm rim strip, a faint teal fill, a floor bounce). Body `rob-body` `#F29A26`, metalness 0.22, roughness 0.4, clearcoat 0.12 · grey `rob-metal` `#BDB9AE`, metalness 0.35, roughness 0.36 · black `#3D3D3D`, metalness 0.15, roughness 0.28 · environment intensity 0.6. ACES tone mapping. Never full chrome.
- Always the real 3D RobotExpressive model (Tomás Laulhé / Quaternius, CC0), body `rob-body`, grey `rob-metal`. Never a flat vector.
- He speaks gibberish (`gibberish`, `text-note`) in About only: in the hero he is silent. His answers type on at ~40 chars/s.
- **The About interview is hybrid:** suggested questions play pre-written answers (no API call, never made up); only free-typed questions reach a guarded free-tier LLM that answers only about Ettore. The input is an ask line with a yellow ASK key, never a chat box or bubbles.
- On the Projects scene the audience robots are atmosphere: blurred, darkened, at most `crowd` opacity.

## Iconography

- **The logo is the name as type** (the Logo component): ETTORE in Alumni Sans 800 cream, SERRA in 600 `#8C8576`, 16px, tracked +24%; hover brightens SERRA. No mark, no icon set. Icons are limited to a few hand-built glyphs drawn inline as SVG with `currentColor`: play triangle, speaker / speaker-muted, arrows `↓ ↑ ← →` (typed as text in Alumni Sans), the hand-drawn annotation arrow. 1.75px strokes, square caps, except the pencil arrow (round caps).
- No emoji, no icon-feature grids.

## Don't

Drawn curtains, marquee bulbs, set-dressed rooms, sunsets · invented light sources or shadows nobody asked for (e.g. a window shadow on About) · a metallic robot · an SVG logo mark · perspective screens · chat bubbles or a chat panel · gradient blobs, glass cards, identical card rows · Caveat for long text · yellow on cream · a phone number · random, in-focus robot crowds.
