# Letterbox

The top row (nav), the bottom row, and the optional black bars. Minimal, with a lot of small details.

- **The nav never moves.** Same position on every page, 72px tall on the 64px margins, three zones:
  - **Logo (`a.rob-logo`):** ETTORE SERRA as type: Alumni Sans 16px, tracked +24%, ETTORE 800 cream, SERRA 600 `#8C8576`. Hover brightens SERRA. See the Logo component.
  - **Links (`es-nav`):** Projects · About · Contact, `label` 18px tracked +10%, `#8C8576`. Projects carries its count as a superscript (`09`). **Current page:** cream label, yellow superscript and a 5px lit dot to its left, like a lamp that's on. No underline. Hover: cream.
  - **Meta:** `es-timecode` (`TC` in fog · `HH:MM:SS` in cream · `:FF` frames in ash, ticking) with a 44px track whose yellow tick is the scroll position · `es-bar-divider` · SoundToggle.
- **Bars are a visual layer, decided per page.** With them (`es-bar--letterbox`) the rows sit on black: the loading page brings them in from 80% load, the hero keeps them, About keeps them (v23). **Projects has none**: the rows float over the room with a soft dark gradient behind them, so the visitor is inside the cinema.
- **Bottom row (`footer.es-bar.es-bar--bottom`):** section label ("02 · Projects") · one `es-cue` ending in `↓` · counter with one tick per section, the current one lit.
- **Mobile:** logo (14px) · sound waveform · divider · Menu (two lines, the short one yellow). No timecode.
- **Don't** put film words in the rows, add a second cue, or beg for the scroll.
