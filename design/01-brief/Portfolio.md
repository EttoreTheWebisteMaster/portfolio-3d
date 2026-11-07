# Ettore Serra — Portfolio brief (v6, current state)

**Updated:** 6 November 2026
**Replaces:** the v5 brief (PNG hand-off, 3 November). Nothing in v5 applies unless it's repeated here.
**Goal:** Awwwards Site of the Day / Site of the Year. *"Cinema, but subtly perfect."* The reaction we want is *"How the hell did he do that?"*

How to work on this project is in `claude/Working-instructions.md`. This file describes **what the site is and where every page stands**.

---

## 0. Where things live

| Source | What it holds | Priority |
|---|---|---|
| Ettore's latest message | Anything new | 1 |
| **Design system** artifact: https://claude.ai/code/artifact/d2e821b8-d0d7-4024-9d42-087e7a9d9e4a | `README.md` (brand book), `tokens.json`, `scenes.md`, `components/` | 2 |
| **Canvas** *Ettore Serra · Portfolio*: https://claude.ai/code/artifact/757b0e6b-ff8d-4abd-b73b-bcb3066f1ae6 | Every designed frame, desktop + mobile | 3 |
| Page specs in this project | `claude/About-scene.md` (v23) | 4 |
| This file | Concept, decisions, status, rejections | 5 |

The old PNG set (`00-countdown.png` … `C5-case-next.png`, `07-storyboard-the-cut.png`) and the Figma file are **retired**. The canvas is the only design source.

---

## 1. Status

| Page | Desktop | Mobile | State |
|---|---|---|---|
| **Loading** | 3 frames: first visit · loaded, waiting for a choice · return visit 0.6s | 1 frame | **Loved.** Done. |
| **01 · Home** | 3 frames: opening wide · close-up (poster frame) · scrolling, ROB-092 turns | 2 frames | **Loved.** Done. |
| **02 · Projects** | 3 frames: screen ignites · playing Pausa, hovering Chef AI · long-content test (The Morning Ledger) | **Not built** | "Almost perfect". Needs final confirmation, then mobile. |
| **03 · About** | v23 (`About.dc.html`) + `About-Iris` (**outdated, redo**) | 2 frames | In polish. Spec: `claude/About-scene.md`. |
| **04 · Contact** | Not built | Not built | Brief only (section 6). |
| **05 · Footer** | Not built | Not built | Brief only (section 6). |
| **Case study** (sample: Pausa) | Not built on canvas | Not built | Only the old v5 PNGs existed; the hero was loved. |
| Tablet 1024 | None yet | | Keep as close to desktop as possible. |

**Next step:** confirm Projects and build its mobile version, then finish About, then Contact → Footer → case study.

---

## 2. Who and why

- **Ettore Serra.** Designer and frontend/full-stack developer, Turin, Italy. Six years of experience (2021–2026). English C2. October 2023–December 2025 at **INFN** (Italian National Institute for Nuclear Physics), the **only developer** on his team, presenting his own work to his boss.
- **Positioning:** **"Designer & engineer. One person."** Full stack, focused on UX/UI and frontend.
- **Targets:** Frontend and Full Stack roles (React/Next.js), Turin or remote, employee or freelance.
- **Audiences:** recruiters first, tech leads in depth. **Success = the link gets forwarded internally.**
- **The site is the proof.** It exists to show what he can build, not to be a CV. It's an expression of his personality.
- **Name:** only **Ettore Serra**. Never "Made by Ettore" or @madebyettore.
- **Language:** English. Italian maybe later.
- **Contact:** `serra.ettore.es@gmail.com` · `linkedin.com/in/ettore-serra-developer` · `github.com/EttoreTheWebisteMaster` · domain `ettoreserra.it`. **No phone number, ever.**

---

## 3. The concept

**The website is a film.** Every section is a fullscreen scene lit like a movie still. The cinema lives in **light, composition, type and small silent details**: timecodes, frame counters, letterbox bars, grain, subtitles. It never lives in drawn props, and **never in the copy**. Nobody should read the word "film" to feel it.

**ROB-092 · Public Relations Unit** is the one continuous actor: a small orange robot, the same real-time 3D model travelling through every scene, never reloaded per page.

- **Model:** RobotExpressive from the three.js examples (Tomás Laulhé / Quaternius, CC0). Animations: Dance, Death, Idle, Jump, No, Punch, Running, Sitting, Standing, ThumbsUp, Walking, WalkJump, Wave, Yes. Morphs: Angry, Surprised, Sad.
- **Look:** painted with a light sheen, lit like the hero. Body `#F29A26` (metalness 0.22, roughness 0.4, clearcoat 0.12), grey `#BDB9AE` (metalness 0.35, roughness 0.36), black `#3D3D3D`. Dark environment, ACES tone mapping. **Not chrome** (a metallic version was tried and reverted).
- **Voice:** gibberish with subtitles, **in About only**. In the hero he is silent.

**Tone:** witty, confident, a bit playful, never cheesy. The site talks *about* Ettore in the third person; the visitor is "you"; ROB-092 speaks in the first person.

**Visual inspiration:** film posters (A Clockwork Orange, Pulp Fiction, Moon, Jaws, Metropolis, Full Metal Jacket, Earthrise, Muybridge's horse), editorial portfolios (danielkiss.hu, Luke Baffait, bleibtgleich), and Netflix only as a quiet structural reference (auto-advance, filters). Each scene may **borrow a poster's composition, never its imagery**.

**Emotional arc:** dark → one daylight scene in cream (About) → dark again for Contact and the footer.

---

## 4. Decisions (current, all binding)

**Copy**
- **Functional copy is plain:** Projects, About, Contact, "See the projects", "View the case study", "Copy email", "Loading · 64%".
- **No film vocabulary in the copy:** no "now showing", "now casting", reels, scenes, programme, credits, ratings, "starring", "presents", "see the films".
- **No fake metrics:** no "98% match", no "sorted by what you're hiring for". Real facts only.
- No taglines that tell people what to feel ("an immersive portfolio"), no begging for the scroll.

**Frame**
- Every section is one fullscreen scene (100vh, designed at 1440×900), snapped or driven by Lenis.
- **Nav row:** logotype left (ETTORE bold cream + SERRA muted, brightening on hover; **no SVG mark**) · Projects · About · Contact, current page cream with a 5px yellow dot · timecode with a small scroll track, a divider and the **waveform sound toggle** right. Same position on every page.
- **Bottom row:** section label left ("02 · Projects") · one yellow cue to the next section centred ("About ↓") · counter "02 / 05" with ticks right.
- **Numbering:** sections 01–05 on the home page; the loading countdown is not counted.
- **Bars:** the black letterbox bars (72px, 56px mobile) slide in at the end of the loading countdown. Home keeps them; **Projects has none** (nav and bottom row float over the 3D room so you sit inside it); **About v23 uses them** like Home. Contact, Footer and the case study decide per page.

**Loading:** runs only as long as the real load, skipped on return visits, **Enter with sound / Enter in silence**.

**Hero:** no "click to make the robot talk". Scroll transition to Projects: copy fades out (GSAP) → ROB-092 turns 180° → camera pushes in → he settles as a blurred member of the audience → the screen switches on.

**Projects:** a real 3D cinema behind the DOM; the playing screen is the only light and lights the audience. Screen flat, front-on, no UI on it.

**About:** a hybrid AI. Suggested questions play pre-written answers (zero API calls); only free-typed questions hit an LLM on a free tier, guarded, answering only about Ettore.

**Robot:** matte with a light sheen everywhere. Silent outside About.

---

## 5. Rejected (don't bring these back)

| Rejected | Why |
|---|---|
| Drawn curtains, velvet valance, marquee sign with bulbs | "Very ugly." Illustrating cinema instead of shooting it. |
| Drawn Kubrick room for About; drawn sunset for Contact | Set dressing. Didn't fit the style. |
| Plain wireframe version (flat cards, no light) | "You downgraded the design. It's too plain." |
| Flat vector robot | Always the real 3D model. |
| Fully metallic robot | Tried, reverted to matte + light sheen. |
| Screens in perspective | Screens and video players are flat 2D. |
| Random or in-focus robot crowds | Must read as a believable audience: blurred, dark, never the subject. |
| Oversimplified Projects (plain screen + plain list) | "You took out all the best parts." |
| Netflix thumbnail rows as the project UI | Netflix stays a quiet structural reference only. |
| Chat bubbles, pills, avatar tiles, a SaaS chat box | "The chat is ugly." |
| About robot off-centre, scattered layout | Strict grid. |
| Invented window shadow on About | Not asked for. Only the robot's shadow. |
| Custom SVG logo (countdown ring, ROB-092 head) | Replaced by the two-weight text logotype. |
| "click to make the robot talk", "make the robot dance" in the hero | Sound is chosen at loading; the hero robot is silent. |
| "98% match", "sorted by what you're hiring for" | Fake metrics. |
| "Now showing", "Now casting", "See the films", "Watch the case" | Film puns in functional copy. |
| "an Immersive Portfolio", "don't stop here ↓ continue scrolling" | Telling people what to feel; begging for the scroll. |
| 12-line skill list in display type | Competed with the name; skills live in a small billing block. |
| Caveat for long text, quotes or the email | Illegible. One short note per screen at most. |
| Yellow text on cream | Fails contrast. |
| Phone number | Removed on purpose. |
| Generic AI patterns | Gradient blobs, glass cards, icon grids, emoji, identical card rows. |

---

## 6. Pages

### Loading (uncounted) — LOVED, done
- A film countdown: a big yellow numeral in thin cream circles, crosshairs, a radial sweep driven by the **real** load progress (5 → 1 maps onto 0–100%), scratches, orange light-leak burns in two corners.
- Name and role visible from the first frame. "Loading · 64%".
- Holds on 1 until the visitor chooses **Enter with sound** (primary) or **Enter in silence**. That click is the browser gesture that unlocks audio; the choice is remembered.
- The letterbox bars slide in from 80% to 100% load.
- **Return visit:** one 0.6s light-leak frame, then the cut.
- Waveform sound toggle present here too.

### 01 · Home (hero) — LOVED, done
- **Light:** hard spotlight from top-left, visible beam with dust, warm floor glow, teal/orange grade.
- **Name:** ETTORE SERRA in Tac One, gold fill brightest top-left. It's part of the 3D set (lit, shadowed, covered for real by ROB-092), with a visually hidden `<h1>` for SEO and screen readers.
- **Opening shot** (~5s, once per visit): a dolly zoom from a full-body wide of ROB-092 to a medium close-up where he covers the base of the name. Only the 3D layer moves; the copy never moves. The close-up is the **og:image** and the Awwwards thumbnail.
- **Copy, bottom-left:** "Designer & engineer. One person.", one line of body, **See the projects** (primary) and **Ask the robot** (secondary, jumps to About).
- **Bottom-right:** the stack in a small billing block (React · Next.js · Three.js · GSAP · TypeScript · Swift · Python · Figma).
- Mouse moves the light slightly so his shadow on the name follows you. ROB-092 is silent; no Caveat note.
- Build note: in the close-up, nudge ROB-092 ~20px right so his hand clears the body text.

### 02 · Projects — almost done, desktop only
- **Room:** a real rendered cinema, camera in the middle rows, **no black bars**. The playing trailer is the only light: its colour lights the floor and the audience's heads (a cream trailer lights them brighter than a dark one). A faint projector beam with dust above the heads.
- **Screen:** a flat front-on rectangle on columns 1–6 (680×382, top at 112px). Only the picture: no UI, no effects.
- **Right column** (columns 8–12, top aligned with the screen), fixed-height blocks that never move:
  1. a 28px row: "01 / 09" and the project's facts;
  2. the title, one line, Tac One **cream** (56px; names over 12 characters drop to 44px; never wraps). Gold stays the hero's;
  3. a two-line lead, clamped;
  4. the CTA pair: **View the case study** (primary) · **Next · Antonino · 07s**, whose yellow underline is the 10s trailer timer (pauses on hover);
  5. the index: four 44px rows visible, scrolling, fading at the bottom, a 2px track on the right.
- **Hover a row:** it lights (cream, yellow number, →), a 224×140 thumbnail floats beside the cursor tilted −3°, overlapping the screen's edge, and the screen cuts to that trailer.
- **Trailers:** the first plays on arrival (with sound if sound is on); when one ends the next starts and the list follows.
- **Sequence in:** ROB-092 turns his back · the spotlight dies · 3 black frames · the screen ignites as a line, then the picture.
- **Opening a project** grows the screen to fill the viewport and it becomes the case-study hero.
- Audience robots: blurred, darkened, at most 22% visibility.
- **Open:** mobile version; Ettore's question on whether the big title in gold "ruins the layout" was resolved as cream — confirm.

### 03 · About — in polish (see `claude/About-scene.md`, v23)
- The only cream scene. Cut in from Projects on a 2-frame white flash.
- **Composition (A Clockwork Orange triangle, never its imagery):** a thin, crisp triangular cut in the cream wall. Inside, a 10-unit tunnel fading to black: nothing readable, no warm light.
- **ROB-092** leans out of the cut like someone at a window, forearms folded on its bottom edge, looking at you, about to talk. His hips stay behind the wall, so no clipping. Hero lighting, soft shadow on the cream.
- **Right column:** headline "Ask me / about / Ettore." (Alumni 800, 84px, ink) · a context line · the ask line (ink caret, "Type your question", yellow ASK ↵ key) · a hairline and a 2×2 grid of facts, the last row level with the cut's base.
- **Caption bottom-left:** ROB-092 / Public relations unit.
- **Bars:** the Home/Projects letterbox rows, "03 · About", "Contact ↓", "03 / 05".
- **Chat:** hybrid (section 4). Gibberish audio while the answer types on at ~40 chars/s. AI note: "An AI trained on Ettore's CV. May embellish. Nothing is stored."
- **Mobile:** `M-About` (render on top, then headline, context, ask line) and `M-About-Interview` (full screen, no bars, answer above the keyboard).
- **Motion:** idle breathing, head tracks the cursor, a nod on send, hole parallax. Reduced motion: static.
- **Open:** redo `About-Iris` (the transition frame) to match v23.

### 04 · Contact — not built
- **Light:** darkness, one hanging industrial lamp on the right (cord, conical shade, glowing bulb, light cone with dust).
- **Subject:** ROB-092 under the lamp, waving goodbye, sharp and lit. Behind him, out of focus, a heap of rejected robots; a pipe enters top right and a robot is caught mid-fall.
- **Left:** "CONTACT" in Tac One, `red-lit` with a red glow · one pitch line · the **email** large (Alumni Sans, cream, red underline) · **Copy email** (primary), LinkedIn, GitHub.
- **Behaviour:** every 4–6s the pipe drops a robot (clunk), it falls with physics onto the heap (cap 40, oldest despawn); robots are draggable; the lamp swings when hit; click the pipe 5 times and it jams, then spits out a golden robot.
- **Ettore's brief:** "Make it more cinematic, I like the skeleton, make it stand up, the robots are in the bg but also have a main scene, keep it interesting."
- Old v5 copy ("Now casting", "Auditions are open") must be rewritten under the plain-copy rule.

### 05 · Footer — not built
- Black, no light source: type is self-lit.
- A dense, centred poster **billing block** listing the projects, the stack and the credits for open-source work (robot model by Tomás Laulhé / Quaternius), then **ETTORE SERRA** in gold `marquee-xl`, then © 2026 Ettore Serra · Back to top ↑ on one baseline.
- **Post-credits line:** ROB-092 peeking from the bottom: "* bip? * Is he hired yet?"
- Scrolling rolls the credits; the music fades out.
- **Open:** the billing-block format ("presents", "starring") conflicts with the no-film-words rule. Decide how literal the billing can be.

### Case study (sample: Pausa) — not built on canvas
- **Hero (loved in v5, keep):** night interior; a glowing monitor plays the project trailer and is the only light; a moonlit window with blinds as fill; ROB-092 on the desk, rim-lit by the screen. Title huge with lit gradient, real meta only (year · platform · stack · read time), **Play trailer** and **View on GitHub**, "← Back to projects". Reached by the screen-grows transition from Projects.
- **Then:** story + episode list (The story · Design decisions · Design system · Final result) · palette & type · final result (interface stills) · more projects + a "Next project in 07s" auto-advance that any scroll or click cancels.
- Every case study backs the claim "Designer & engineer" by showing engineering (performance, accessibility, architecture) next to the spectacle.

---

## 7. Projects (sample order; years and details to confirm)

1. **Pausa** — macOS menu-bar app (SwiftUI) that spins a fortune wheel across eight kinds of break. 2026.
2. **Antonino** — voice-first Italian cooking assistant.
3. **Chef AI** — React cooking app with AI recipe generation, dietary filters, timers.
4. **The Morning Ledger** — a personalised, Warren Buffett–style morning financial briefing (AI, Alpha Vantage, Tavily).
5. **This portfolio** — Next.js, Three.js, GSAP.
6. **Photo Curator** — local AI that organises phone and camera photos, removes duplicates, keeps the best.
7. **INFN** — research software, 2023–2025.
8. **Mr Fruitman** — branding and React.
9. **Local Agents** — local coding assistant with several models routed per task.

Currently 9 on the canvas ("01 / 09"); Ettore will add more.

---

## 8. Design system (summary — the artifact is the source)

- **Colour:** black `#0B0A09` ground · night `#171412` · smoke `#2B2723` · ash `#A9A296` · fog `#8C857A` (micro-labels on black only) · cream `#F2EDDA` · ink `#15120F` · dust `#5C5549` · yellow `#FFD84D` (light/action) · orange `#F2A93B` (robot's voice) · red `#D7261E` (pigment, type on cream) · red-lit `#EC3A2E` (red type on dark) · gold `#FFE68F → #F5B941 → #A8641A`. Themes `screen` / `paper` flip via `[data-theme]`.
- **Type:** Tac One (marquee, uppercase only) · Alumni Sans (poster, labels, timecodes; never under 13px) · Instrument Sans (reading: body 17/1.55, lead 22/1.45) · Caveat (one note per screen, six words max).
- **Grid:** 12 columns, 64px margins, 24px gutters at 1440 · 8 columns, 40px at 1024 · 4 columns, 20px at 402. 4px spacing scale.
- **Radius:** 0 for everything poster-like · pill only for things that talk · 4px only inside interface chrome.
- **Buttons:** one primary per screen (yellow, ink text, glow that gets hotter on hover; nothing moves). Focus: 2px yellow ring, 3px offset.
- **Light:** one motivated source per scene; type lit by it; the only gradients are light. 2D and 3D share one light: the WebGL scene's light is sampled each frame into CSS variables.
- **Constants on dark scenes:** grain at ~8fps, vignette, teal/orange grade, dust in beams.

---

## 9. Motion, sound, 3D

- **Stack:** Next.js + Tailwind + Three.js / React Three Fiber (**one persistent canvas** behind the DOM) + GSAP/ScrollTrigger + Lenis.
- **Transitions:** film cuts (2-frame black flash, white into About, slight gate jitter, projector clack) or camera moves scrubbed by scroll. Only the hero's opening shot runs on a timer.
- **Easing:** UI `cubic-bezier(0.2, 0.7, 0, 1)`, 160ms hover / 320ms reveal.
- **Sound:** off until the loading choice, then remembered. Hover ticks at −18 dB, clicks, gibberish, hums, clacks. Waveform toggle on every page.
- **Reduced motion:** every camera move becomes a cut; grain is static.
- **Performance:** first scene < 2.5s, 60fps on an M1, a lighter mobile scene.
- **Easter-egg ideas (not yet confirmed):** audience robots dance and can be dragged; type "action" for a letterbox-and-clapperboard stunt; Konami code "director's cut"; idle 30s → ROB-092 falls asleep; the golden robot from the Contact pipe; the post-credits line.

---

## 10. Placeholders

- **Trailers:** Ettore will produce a short cinematic trailer per project. Current screen images are stand-ins.
- **Content:** project years, case-study copy and the Pausa palette are samples.
- **Renders:** canvas images are stills of the real model; live, he's real-time Three.js.

---

## 11. Open questions

1. **Bars per page:** Contact, Footer and the case study haven't decided whether they keep the letterbox bars.
2. **Footer billing block:** how literal can it be under the no-film-words rule?
3. **Easter eggs:** which ones survive (the rating-badge flip is gone with the rating copy).
4. **Projects title:** confirm cream (current) over gold.
