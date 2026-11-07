# MarqueeTitle

Tac One uppercase titles that are lit by the scene, never pasted on top.

- `es-marquee--gold`: the name (hero, footer). Gradient `gold-hi` → `gold` → `gold-lo`; point `--light-angle` away from the scene's light so the brightest letters face it. In the hero the name is part of the 3D set; this class is its 2D twin (footer, fallbacks).
- **Cream (`marquee-m`):** the playing project's title on Projects. The screen is that page's subject, so the title stays cream; gold belongs to the hero's name.
- `es-marquee--yellow`: currently unused (Projects no longer has a section title).
- `es-marquee--red`: the one loud title per page (CONTACT) in `text-loud` with `glow-red`.
- On paper, gold and yellow fall back to ink (yellow never sits on cream).
- Titles say what the section is: Contact, a project's name. No film words.
- Sizes from `marquee-xl` / `-l` / `-m`. On load, letters light one by one (wrap each in a span, toggle `es-dim`, 60ms stagger, relay-click sound).
