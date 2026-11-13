---
paths: ["src/**"]
---

Production polish pass. Full checklists (A site must-haves, B Awwwards lens, C WCAG 2.2, D responsive, E 3D, F AI mistakes) live in `~/.claude/PRODUCTION-QUALITY.md`; read it at the start of every polish session.

- Current design and layout are final. Change only what Ettore asks. Do nothing unprompted.
- For each requested change: small plan first (what, why, files, responsive, a11y, perf, reduced motion, risks), explain choices, wait for OK.
- Per page: read-only audit first, findings table, Ettore picks, then fix.
- No mobile/tablet mockups: adapt what exists.
- Viewports: 375x812, 812x375, 820x1180, 1440x900, 1920x1080. `npm run shot -- /route --scroll=0,50,100` captures all of them. `--only=375,1440` narrows, `--motion` keeps animations on.
- Test back/forward, direct URL load, resize and orientation change. Done = `npm run check` + screenshots reviewed.
