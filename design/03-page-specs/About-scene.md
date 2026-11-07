# Sc. 03 · Interview with the robot (About) — v23 spec

**Supersedes** the "Sc. 03" section of `Portfolio.md` and every earlier version of this doc. Canvas *Ettore Serra · Portfolio*, row **About**: `About`, `M-About`, `M-About-Interview`. `About-Iris` still shows an older version and needs redoing.

## v23 changes (Ettore)

- **ROB-092 sits lower, with his upper body out of the triangle.** He leans out of the cut like someone at a window, **forearms folded on the bottom edge**, facing you, about to talk.
  - His hips stay behind the wall plane, so the wall hides his lower body: no clipping, no fake blends.
  - Pose: Idle at 1.2s, lean 0.5 rad, head counter-tilted −0.5 so he looks straight at you, turned 0.12 rad toward the text.
  - Arms: `ShoulderL` / `ShoulderR` −0.9 on x; `LowerArmL` −1.5 and `LowerArmR` +1.5 on z (folded).
  - Position (0, −1.72, −1.1), scale 1.55.
- **The top and bottom bars are exactly the Home and Projects letterbox bars:** 72px black (56px on mobile), cream links, the yellow active dot on About, the timecode, the yellow sound wave, "03 · About", "Contact ↓" in yellow, "03 / 05" with the third tick lit yellow.
- **Camera** (yc 2.8, D 17.4) frames the whole scene between the bars: apex at y 133, base at y 717, his folded arms ending at y 794.

## The hole (unchanged from v21/v22)

- A thin, crisp cut (0.08 units, no bevel) in the cream wall.
- A 10-unit-deep triangular tunnel with near-black walls and black fog, so it vanishes to black: **nothing readable inside, no yellow or warm light**.
- Only neutral daylight enters, and the cut's own shadow falls inside.
- ROB-092 uses the hero lighting (matte #F29A26 / #BDB9AE, one soft top-left spot). He casts a soft shadow on the cream.

## Layout (desktop)

| Element | Position / style |
|---|---|
| Headline | x 980, top 248, width 396. "Ask me / about / Ettore." Alumni 800 84/0.84, ink |
| Context | +20px, Instrument 17/1.6, dust |
| Ask line | +28px: blinking ink caret, "Type your question", yellow ASK ↵ key |
| Facts | A hairline at y 606, then the 2×2 grid; the last row is level with the cut's base |
| Caption | Bottom-left, x 64, y 736: **ROB-092** / Public relations unit (clear of his arms) |
| Bars | The Home/Projects letterbox bars, unchanged |

## Mobile

- **`M-About`:** the render on top (783 × 490 at −71, 30), between the black bars; the caption at y 466; then the headline, the context and the ask line.
- **`M-About-Interview`:** full screen, no bars. A smaller render, the quoted question, the answer, and the ask line above the keyboard.

## Motion

- Idle breathing; his head tracks the cursor and looks at you while he speaks.
- On send, a small nod.
- Hole parallax.
- Reduced motion: static.
