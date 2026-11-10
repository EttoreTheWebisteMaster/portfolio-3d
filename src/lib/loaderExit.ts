import { gsap } from "@/lib/gsap";

/** Matches the hold plus the bars' close-in in the loader, so the leaks are fully swollen just as the dark parts. */
const BUILD_S = 0.43;

/**
 * The countdown has landed on 0: the numeral stays crisp (no scale-up) and burns out while the light leaks swell and a 1px seam draws across the middle of the frame.
 * Constant speed, transform and opacity only.
 */
export function playCountdownOut(root: HTMLElement, leader: HTMLElement) {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const leaks = root.querySelectorAll<HTMLElement>(".loader-leak");
  // The leaks' idle pulse hands over to the tween from wherever it is, without a jump.
  const from = Array.from(leaks, leak => getComputedStyle(leak).opacity);
  // The CSS countdown (lens creep, idle pulse) lets go; the tweens take over from where it ended.
  root.dataset.fog = "";
  gsap.fromTo(
    leader,
    { scale: 1.08, opacity: 1 },
    {
      scale: still ? 1.08 : 1.12,
      opacity: 0,
      duration: still ? 0.15 : 0.24,
      delay: 0,
      ease: "none",
      overwrite: true,
    }
  );
  if (still) return;
  leaks.forEach((leak, i) => gsap.set(leak, { opacity: from[i] }));
  gsap.to(root.querySelectorAll(".loader-info, .loader-corner"), {
    opacity: 0,
    y: 8,
    duration: 0.3,
    ease: "none",
  });
  gsap.to(leaks, { scale: 2.4, opacity: 1, duration: BUILD_S, ease: "none" });
  // The seam draws out from the centre, so you watch the screen being cut in two before it opens.
  gsap.fromTo(
    root.querySelector(".loader-seam"),
    { scaleX: 0, opacity: 1 },
    { scaleX: 1, duration: BUILD_S - 0.06, delay: 0.06, ease: "none" }
  );
}

/**
 * Loader → hero. The dark splits down the middle, along the 1px seam drawn across the frame when the countdown landed, top up and bottom down, at one constant speed, onto the hero already moving.
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
          pick(".loader-pane-top"),
          { yPercent: -100, duration: 0.55, ease: "none" },
          0
        )
        .to(
          pick(".loader-pane-bottom"),
          { yPercent: 100, duration: 0.55, ease: "none" },
          0
        )
        .to(
          pick(".loader-seam"),
          { opacity: 0, duration: 0.15, ease: "none" },
          0
        )
        .to(
          pick(".loader-leak"),
          { opacity: 0, duration: 0.4, ease: "none" },
          0
        );
    }
  );
}
