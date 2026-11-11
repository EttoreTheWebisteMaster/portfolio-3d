# Sc. 03 · Interview with the robot (About) — v24 spec

**Supersedes v23.** No triangle, no tunnel, no window. About is a cream room ROB-092 walks into at the end of the Projects → About shot ("the walk-out"). Frames `About`, `M-About`, `M-About-Interview` still show v23 and need redoing.

## The room

- A seamless cream sweep (floor curving into the back wall, no floor line), neutral daylight and **one** soft top-left key, matching the hero's light direction. No props, no window, no marks.
- The robot is the matte palette (#F29A26 / #BDB9AE, light sheen). He is the same model instance as on Home and Projects (`HeroRobot`), never reloaded; his paint turns from the hero's polished metal to the matte palette as the daylight takes over.
- Shadows: a contact shadow plus a long soft shadow from the key, falling right on the cream.

## End frame (1440×900)

| Element | Position / style |
|---|---|
| Robot | Full body in the left columns (centre of cols 1–7), feet on y = 86% of the viewport (774px), head top ≈ 25%. Long lens (24°), level camera |
| Headline | Right column (cols 8–12), top = his head line. "Ask me / **Anything** / about Ettore." Alumni 800 84/0.84, ink, "Anything" on a yellow fill |
| Context + ask line | Under the headline, unchanged from v23 |
| Facts | Hairline, then 2×2 grid; **last row level with his feet line** (`--about-feet`) |
| Caption | Bottom-left, x 64: **ROB-092** / Public relations unit. Clears his feet and shadow |
| Bars | The Home/Projects veil strips (72px, 56px mobile), ink on cream |

`--about-top` / `--about-feet` come from the 3D camera (`aboutFrame` in `aboutShot.ts`); the CSS never hard-codes them.

## Mobile (402)

Same shot, driven by vertical swipe over a shorter distance. End frame: robot on top (feet at 40% of the height), then headline, context and ask line. Facts and caption are hidden.

## Behaviour on his mark

Head on camera, body turned 0.12 rad toward the text, `Idle` breathing; the head then follows the cursor and nods on send. The interview greets as he stops. The ask input is **not** auto-focused.

## Reduced motion

No camera move: a veil cut to About, robot already on his mark.

# The walk-out (Projects → About)

One continuous, scrubbed, reversible shot along +X in one persistent canvas. Journey 1 → 2 **is** the shot (`walk = journey − 1`); no scene swap, the camera physically travels.

World, left to right: the cinema (x 0) · a dark door in its end wall (x 15) · a short dark passage (to x 26) · the cream sweep (mark at x 36).

| Progress | Camera | ROB-092 | UI |
|---|---|---|---|
| 0–0.12 | Drops from the cinema frame; focus racks from the screen to him (DOF); the screen goes soft | Seated, trailer light on him | Projects panel fades; the trailer's timer holds, the trailer plays on |
| 0.12–0.25 | Lower, pushes in | `Sitting` clip scrubbed backwards (stands), turns right | — |
| 0.25–0.56 | Trucks right a little behind him | `Walking`, phase = distance / stride (3.48 u), so feet never slide; footsteps on the stride | Screen leaves frame left |
| 0.46–0.66 | — | Pushes the door; it swings shut behind him; light spills through | Door creak |
| 0.50–0.75 | Runs ahead and settles, locked off; exposure blooms then settles | Matte paint arrives | Theme → paper at 0.72; grade neutral |
| 0.75–0.93 | Locked | Enters from the left, walks to his mark | Headline / ask / facts reveal (`data-fx`) |
| 0.93–1 | Locked | Stops, turns to camera, `Idle` | Snap lands at 1 |

- **Input:** wheel, swipe, PageDown / arrows / space move the scroll a little at a time (3400 px of wheel = whole shot, 1800 on mobile; keys play it at constant speed, 9 s / 6 s). Letting go anywhere inside the shot eases to the nearer end. Scrolling back plays it in reverse (he walks backward to his seat). Resize keeps the progress.
- **Hard cut instead of the walk:** nav click on About, "Ask the robot", the `/about` deep link, browser Back/Forward, reduced motion → the veil cut, robot already on his mark.
- **Bottom bar:** "About →" on Projects (the one sideways move); label, counter and ticks flip at progress 0.5. About keeps "Contact ↓".
- **About → Contact** stays vertical: he turns and walks off right while the daylight dims into Contact's dark, then Contact's own arrival runs.
- **Sound** (synth, existing −18 dB family, only when sound is on): footsteps on the stride, door creak, room tone from cinema hum to daylight air. The trailer has no audio to duck (it is muted).
- **Code:** `walkPose.ts` (all beats as functions of the scroll), `aboutShot.ts` (camera, frame, DOM publish), `robotShot.ts` (clip scrubbing), `AboutScene.tsx` / `AboutDoor.tsx` / `aboutRoom.ts` (set), `PageSnap.tsx` (scrub + snap). The case-study dive (screen fly-through) is separate: `diveShot.ts` / `lib/caseStudy.ts`.
