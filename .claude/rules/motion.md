---
paths:
  ["src/components/three/**", "src/components/sections/**", "src/lib/gsap.ts"]
---

Ettore's recurring motion/3D feedback. Bake these in first time.

- Cinematic = camera moves, lights stay still. Never animate the light source with the camera.
- Transitions: one constant speed start to end (no slow-in/fast-out), continuous, no dead moments. Lights never go fully off mid-transition; fade gradually.
- Nothing pops in. Actors (robots, text) enter from off-scene along a path, never appear over content or float.
- Grade: dark and moody, not black. Dark Knight/Joker feel but still readable. Start mid, nudge; "too dark" has happened.
- The h1 and body text must stay readable over the 3D scene at every scroll position. Place the robot lower/further instead of covering text.
- Hover micro-interactions: slight. Click interactions: a clear A→B morph. Waves/curves: sinusoidal and symmetrical.
- Shared elements (loader bars ↔ navbar, text colour on dark bg) must stay continuous across states.
- Fixed bars (top/bottom nav) are `fixed`, not in flow.
- Page-load and scroll-start get motion too, not only mid-scroll.
- Always honour reduced motion via `gsap.matchMedia()`.
