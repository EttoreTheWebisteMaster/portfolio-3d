# ProgrammeList

The Projects index: a vertical list of numbered project rows under the title block, in the right column.

- **Provide:** projects `{no, title, discipline, year}` in order, the current index, the trailer progress.
- **Block:** four 44px rows visible, scrolling vertically, fading at the bottom, a 2px track on the right. Always at least three rows visible, whatever the content above.
- **Row:** Nº (`text-tertiary`) · title `poster-s` · one discipline tag (GenreTag) · year. Hairlines between.
- **Current row:** follows the playing trailer; when one ends, the next starts and the list follows.
- **Hover:** the row lights (title cream, number yellow, → appears), a 224×140 thumbnail floats beside the cursor tilted −3° and overlapping the screen's edge, and the screen cuts to that trailer. No borders, no layout shift.
- **Only real facts.** No match %, no "sorted by what you're hiring for", no now-playing card, no countdown ring (the Next button carries the timer).
- *The preview still shows the retired Now Showing version and needs redrawing.*
