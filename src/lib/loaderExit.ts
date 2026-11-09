import { gsap } from "@/lib/gsap";

/** The countdown has landed on 0: after a held beat, numeral and rings punch through the lens, swelling and dissolving. */
export function playCountdownOut(leader: HTMLElement) {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  gsap.to(leader, {
    scale: still ? 1 : 2.6,
    opacity: 0,
    duration: still ? 0.15 : 0.6,
    delay: still ? 0 : 0.35,
    ease: "power2.in",
    overwrite: true,
  });
}

/**
 * Loader → hero. The light leaks flare as the type steps back, then the whole loader dissolves at one constant speed onto the hero already moving underneath.
 * Transform and opacity only. Reduced motion is a short plain fade.
 */
export function playLoaderExit(root: HTMLElement, done: () => void) {
  const pick = (sel: string) => root.querySelectorAll(sel);
  const mm = gsap.matchMedia();
  mm.add(
    {
      full: "(prefers-reduced-motion: no-preference)",
      reduced: "(prefers-reduced-motion: reduce)",
    },
    ctx => {
      if (ctx.conditions?.reduced) {
        gsap.to(root, {
          opacity: 0,
          duration: 0.15,
          ease: "none",
          onComplete: done,
        });
        return;
      }
      gsap
        .timeline({ onComplete: done })
        .to(
          pick(".loader-info, .loader-corner"),
          { opacity: 0, y: 8, duration: 0.25, ease: "none" },
          0
        )
        .to(
          pick(".loader-leak"),
          { scale: 1.8, opacity: 1, duration: 0.4, ease: "power2.out" },
          0
        )
        .to(root, { opacity: 0, duration: 0.4, ease: "none" }, 0.1);
    }
  );
}
