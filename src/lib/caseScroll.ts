import { addEntrance } from "@/lib/fx";
import { gsap, SplitText, type SplitText as Split } from "@/lib/gsap";

/** The scenes below the hero move with the scroll: reveals as they arrive, parallax and the wheels while they are on screen. Returns its own cleanup. */
export function scrollScenes(scroller: HTMLElement) {
  const at = (el: Element, start = "top 82%") => ({
    scroller,
    trigger: el,
    start,
    toggleActions: "play none none reverse",
  });
  const scrub = (el: Element, start = "top bottom", end = "bottom top") => ({
    scroller,
    trigger: el,
    start,
    end,
    scrub: true,
  });
  const splits: Split[] = [];
  /** Lines rise out of a mask as the element arrives; titles also decode. */
  const lines = (el: HTMLElement, kind: "title" | "text") => {
    const tl = gsap.timeline({ scrollTrigger: at(el) });
    const split = addEntrance(tl, el, 0, kind);
    if (split) splits.push(split);
  };
  /** A curtain the colour of the page lifts off the tile, top to bottom, while the picture settles out of a push-in. */
  const unveil = (tiles: Element[], trigger: Element, start = "top 100%") => {
    gsap.fromTo(
      tiles,
      { "--cover": 1 },
      {
        "--cover": 0,
        duration: 0.9,
        ease: "power3.inOut",
        stagger: 0.07,
        scrollTrigger: at(trigger, start),
      }
    );
    tiles.forEach(tile =>
      tile.querySelectorAll(":scope > video, :scope > img").forEach(media =>
        gsap.fromTo(
          media,
          { scale: 1.4 },
          {
            scale: 1,
            duration: 1.3,
            ease: "power3.out",
            scrollTrigger: at(trigger, start),
          }
        )
      )
    );
  };

  scroller.querySelectorAll<HTMLElement>("[data-reveal]").forEach(el => {
    const kind = el.dataset.reveal;
    if (kind === "title") lines(el, "title");
    else if (kind === "up") lines(el, "text");
    else if (kind === "block")
      gsap.fromTo(
        el,
        { opacity: 0, y: 56, skewY: 2.5 },
        {
          opacity: 1,
          y: 0,
          skewY: 0,
          duration: 1.2,
          ease: "power4.out",
          scrollTrigger: at(el),
        }
      );
    else if (kind === "words") {
      // The sentence is read out as it scrolls in: each word lights up in turn and settles up from below.
      const split = SplitText.create(el, { type: "words", aria: "none" });
      splits.push(split);
      gsap.fromTo(
        split.words,
        { opacity: 0.14, y: 10 },
        {
          opacity: 1,
          y: 0,
          ease: "none",
          stagger: 0.1,
          scrollTrigger: scrub(el, "top 78%", "bottom 42%"),
        }
      );
    } else if (kind === "stagger")
      // Cards tilt in alternately, as if dealt.
      gsap.fromTo(
        el.children,
        {
          opacity: 0,
          y: 80,
          scale: 0.92,
          rotation: (i: number) => (i % 2 ? 2.5 : -2.5),
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotation: 0,
          duration: 1.3,
          ease: "power4.out",
          stagger: 0.14,
          scrollTrigger: at(el, "top 90%"),
        }
      );
    else if (kind === "media") {
      gsap.fromTo(
        el.children,
        { y: 70 },
        {
          y: 0,
          duration: 0.9,
          ease: "power4.out",
          stagger: 0.07,
          scrollTrigger: at(el, "top 100%"),
        }
      );
      unveil(gsap.utils.toArray(el.children), el, "top 100%");
    } else if (kind === "swatches")
      // The colours are dealt onto the table: each fans in from the floor, then squares up.
      gsap.fromTo(
        el.children,
        {
          opacity: 0,
          y: 140,
          scaleY: 0.7,
          rotation: (i: number) => (i - 4.5) * 4,
          transformOrigin: "50% 100%",
        },
        {
          opacity: 1,
          y: 0,
          scaleY: 1,
          rotation: 0,
          duration: 1.3,
          ease: "power4.out",
          stagger: 0.07,
          scrollTrigger: at(el, "top 88%"),
        }
      );
    else if (kind === "specimen")
      // The two letters meet in the middle from either side, the weight of the page coming in with them.
      gsap.fromTo(
        el.children,
        { opacity: 0, x: (i: number) => (i ? 160 : -160), scale: 1.25 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 1.6,
          ease: "power4.out",
          stagger: 0.12,
          scrollTrigger: at(el, "top 85%"),
        }
      );
    else if (kind === "rows")
      // Rows slide out from behind the margin, one after another.
      gsap.fromTo(
        el.children,
        { opacity: 0, x: -90 },
        {
          opacity: 1,
          x: 0,
          duration: 1.2,
          ease: "power4.out",
          stagger: 0.12,
          scrollTrigger: at(el, "top 88%"),
        }
      );
    else if (kind === "panel") {
      gsap.fromTo(
        el,
        { y: 70, scale: 0.94 },
        {
          y: 0,
          scale: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: at(el, "top 100%"),
        }
      );
      unveil([el], el);
    }
  });
  // Slow drift at different speeds: the layers separate as you scroll.
  scroller.querySelectorAll<HTMLElement>("[data-parallax]").forEach(el => {
    const d = Number(el.dataset.parallax);
    gsap.fromTo(
      el,
      { yPercent: d * 100 },
      {
        yPercent: -d * 100,
        ease: "none",
        scrollTrigger: scrub(el.parentElement ?? el),
      }
    );
  });
  // A line of type slides sideways with the scroll.
  scroller.querySelectorAll<HTMLElement>("[data-drift]").forEach(el => {
    const d = Number(el.dataset.drift);
    gsap.fromTo(
      el,
      { xPercent: d / 2 },
      { xPercent: -d / 2, ease: "none", scrollTrigger: scrub(el) }
    );
  });
  // The wheels turn with the scroll, one way or the other.
  scroller.querySelectorAll<HTMLElement>("[data-spin]").forEach(el => {
    gsap.fromTo(
      el,
      { rotation: 0 },
      {
        rotation: Number(el.dataset.spin) * 360,
        ease: "none",
        scrollTrigger: scrub(el),
      }
    );
  });
  return () => splits.forEach(split => split.revert());
}
