# Sc. 04 · Contact — v8 spec (final direction)

**Date:** 7 November 2026. **Supersedes** section 6 "04 · Contact" and "05 · Footer" of `Portfolio.md`, and v1–v7 of this doc.

Canvas: row **Contact** (`Contact-Hit` · a robot lands in the light, `Contact` · poster frame, `Contact-Copied`), and `Footer-Strip` under `Contact`.

## The scene

A dark, hazy warehouse floor. A hanging lamp just above the top-left corner throws one hard, cold beam diagonally across the frame onto the floor. **No email on screen.** The three actions are the subject, big and centred in the dark air. Robots fall randomly from above the frame, tumbling through the dark; when one crosses the beam it catches the light and casts a moving shadow on the floor. They land with a clunk (sparks when one hits inside the light) and lie in the shadows at the edges.

## Decisions (Ettore, 7 Nov 2026)

- **v8: the 3D email text is removed.** The page is three big buttons in the centre with robots falling randomly from the top.
- **No pipe.** Robots enter from above the frame at random positions and times.
- **Falling rules (build):** random x across the width and random depth (some close and large, some far and fogged); random spin; staggered timing (one every ~1.5–3s, never more than ~6 in frame); landed robots pile at the edges of the light and the oldest fade out so the floor never fills. Robots fall *behind* the DOM layer, so they never block a click; a clear zone around the button block keeps tumbling silhouettes from sitting behind the labels. Choreographed paths are fine (pre-baked random set), as long as it reads as random.
- **Sparks** when a robot lands inside the light: the only warm colour on the page (~300ms), with a clang if sound is on.
- **Grade:** cold and almost colourless. Grey robots (darkened primer `Main #3C3B38`, `Grey #302F2C`, no orange), dark worn concrete, near-black air with haze. Teal multiply overlay 22%.
- **Light:** the hanging lamp, top-left, out of frame except its rim. One hard cold key (`#EEF2F3`). The beam with dust is drawn diagonally from the top-left to the floor, passing behind the buttons.
- **No letterbox bars · no 3D interactions · ROB-092 absent · no CONTACT title (hidden h1).**

## Layout (1440×900, as built)

| Element | Position |
|---|---|
| Pitch line | Top 322, centred, Instrument Sans 20/1.5, #CFC8B8: "Open to frontend and full-stack roles. Turin or remote, employee or freelance." |
| Buttons | 36px below, centred: **Copy email** (primary, yellow, glow) · LinkedIn · GitHub (secondary, cream 12%). 80px tall, Alumni Sans 700 26px uppercase 0.08em, 16px gap. Block ≈ 435–1005 × 388–468. |
| Status line | Under the buttons, 13px Alumni label, empty at rest; after copying: "serra.ettore.es@gmail.com is on your clipboard". |
| Light pool | Floor, ≈ 660–830 |
| Bottom row | "04 · Contact" · "04 / 04" |

## Copy-email feedback

"Copied" + check, hot glow, the beam brightens for a beat, `role="status"` line. Copy email copies lowercase.

## Accessibility note

The address is no longer visible until someone copies it. It's still in the status line after copying, in the footer strip's Email link (`mailto:`), and in the Copy button's accessible name if needed. Consider a `mailto:` fallback when the Clipboard API is unavailable.

## Footer

A short strip (~272px) below Contact, not a page: © 2026 Ettore Serra · "Designed and built in Turin. Next.js, Three.js, GSAP." · Back to top ↑ · Email / LinkedIn / GitHub · robot-model credit. **4 sections**: counters read "0X / 04". The post-credits line is parked.

## Render notes (stills only; final quality in the build)

Three.js r170 + Playwright, 2× DPR, exposure 1.12. Camera fov 28 at (0, 0.7, 7.4) looking at (0, 1.1, 0). Spot 280, 42°, penumbra 0.7, from (−2.1, 2.72, 0.9) to (0.3, 0.3, 0.2). Floor `#1B1C1C` with stains, roughness 0.7. Fog `#0A0B0C` 5→15. Bokeh on.

## Reduced motion

A static frame: two robots on the floor at the edges, none falling, the beam still.

## Rejected for Contact (all versions)

ROB-092 waving goodbye · timed pipe drops, draggable robots, golden robot · red glow · the scroll pull-back · the email as any 3D object (floating, hanging sign, flat slab, channel letters, carved box, halo plate, push-through plate, chained letters, standing steel letters top or bottom) · a CONTACT title · sepia/warm grade · the lamp as a big saucer in frame · the pipe.

## Open

1. Mobile frames (Contact + footer strip): buttons stacked full-width, fewer robots.
2. `Portfolio.md` still lists the footer as page 05.
