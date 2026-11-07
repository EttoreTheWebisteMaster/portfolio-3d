# Open issues and contradictions

Found while assembling this package. The sources were exported as they are; nothing below has been fixed in them. Each item says which side `PAGES.md` follows.

## Contradictions between sources

1. **Section count: 04 or 05?** All current frames read `0X / 04` (Contact v8 made the footer a strip, not a page). `Working-instructions.md` §7, `About-scene.md`, `Portfolio.md` and the design-system README still say `0X / 05`. → `PAGES.md` follows the frames: **04**.
2. **Bars on every page?** `Working-instructions.md` §7 says every page has the 72px letterbox bars "exactly as on Home/Projects". The design system and brief say Projects has **no** bars, and Contact v8 has none either. → Follow the design system: bars per page.
3. **Projects title colour.** `Working-instructions.md` §8 says "gold title"; `scenes.md`, the MarqueeTitle component and the frames use **cream** (gold stays the hero's). Brief §11.4 still asks to confirm. → Cream, pending confirmation.
4. **About headline.** Spec says "Ask me / about / Ettore."; the v23 frame reads "Ask me / **Anything** / about Ettore." with "Anything" on a yellow highlight. → Decide which; the frame is the newer build.
5. **Contact in `scenes.md` and the brief is stale.** Both still describe the v5 idea (lamp on the right, ROB-092 waving, CONTACT title in red, the email large, a pipe). Contact v8 (`03-page-specs/Contact-scene.md`) rejects all of that. → Follow Contact v8.
6. **Footer in `scenes.md` and the brief is stale.** They describe a billing block + gold name + post-credits line; v8 replaced it with a 272px strip and parked the rest. → Follow the strip.
7. **Brief status table is out of date.** It lists Contact and Footer as "not built"; both have desktop frames now.
8. **Canvas tokens copy is stale.** `04-canvas/source/ds/ettore-serra/tokens.json` still has film-word samples (NOW CASTING, NOW SHOWING, WATCH THE CASE, 98% match), the old `marquee-wordmark`, and a pill sound button with orange glow. → Use `02-design-system/tokens.json`.
9. **Component previews behind their READMEs.** `Annotation/preview.html` still shows "click to make the robot talk!" and "every robot that wasn't cast"; `ProgrammeList` preview shows the retired Now Showing version (its README says so). Viewfinder, FilterTabs and Screenplay are retired; DanceTooltip is on hold.
10. **`orange` token usage.** Canvas copy says the sound button uses orange; the current system says the sound toggle is the yellow waveform. → Yellow waveform.

## Still undecided

- Bars on the case study.
- Mobile frames for Projects, Contact and the footer strip; any tablet frames.
- `About-Iris` (the Projects → About transition frame) needs redoing to v23.
- Case study not designed on the canvas.
- Easter eggs: which survive (dancing/draggable audience, "action" stunt, Konami "director's cut", idle sleep, post-credits line).
- Content placeholders: trailers, project years, case-study copy, the Pausa palette.
