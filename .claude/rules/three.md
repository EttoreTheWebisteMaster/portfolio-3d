---
paths: ["src/components/three/**"]
---

- Every scene is a `*Canvas.tsx` client component, loaded via a `next/dynamic` wrapper with `ssr: false` and a sized placeholder (no CLS).
- `<Canvas dpr={[1, 1.75]}>`; `frameloop="demand"` for static scenes, then `invalidate()` on change.
- Models: `useGLTF` + `<Suspense>`, Draco/Meshopt compressed, `useGLTF.preload` for hero assets. Total < 5 MB.
- Never `setState` in `useFrame`; mutate refs. Memoize geometries/materials.
- GSAP drives three via refs inside `useGSAP`, not via React state.
- Reduced motion or low-power: render a static poster image instead of the canvas.
