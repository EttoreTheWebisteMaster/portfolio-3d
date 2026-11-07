# Button

Square-cornered buttons in Alumni Sans uppercase, 56px tall (44px with `es-btn--sm`).

- `es-btn--primary`: `action-fill` / `action-text` — yellow with `glow-yellow` on dark, ink on paper. **One per screen.** Leads with the play triangle only when it actually plays a video.
- `es-btn--secondary`: `text-primary` at 12% over the ground; 18% on hover.
- `es-btn--ink`: ink on cream, for a secondary action on About.
- **The ASK key** (About): a small square yellow key with ink text "ASK ↵" at the end of the ask line. Yellow as a fill is allowed on cream; yellow text is not.
- **The Next pair** (Projects): `primary` View the case study + a quiet secondary "Next · <project> · 07s" whose yellow underline is the 10s trailer timer (pauses on hover/focus).
- `es-btn--timer`: auto-advance to the next project. Set `--p` 0→1 over 10s; pause on hover/focus; any scroll or click cancels. Label counts down ("Next project in 07s").
- **States:** hover = the light gets hotter (`glow-yellow-hot`), no movement · active = 1px sink · disabled = 40%, no glow · focus = 2px `focus-ring`, 3px offset.
- **Copy says what happens:** See the projects, Ask the robot, View the case study, Play video, Copy email, Send. No film puns, never "Learn more".
