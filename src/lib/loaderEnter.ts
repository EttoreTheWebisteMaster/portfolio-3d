import { playImpact } from "@/lib/audio";
import { INTRO } from "@/lib/journey";
import { enter } from "@/lib/loading";
import { isMuted } from "@/lib/sound";

/** The hero's opening shot: the impact, the scene's intro, and the bars' lettering that arrives with the hero copy. */
export function startHero() {
  if (!isMuted()) playImpact();
  enter();
  document.documentElement.style.setProperty("--intro-text", `${INTRO.text}s`);
  document.documentElement.dataset.in = "";
}

/** The page is the visitor's again. Called the moment they enter, not when the loader finishes fading. */
export function release() {
  delete document.documentElement.dataset.loading;
  document.querySelector("main")?.removeAttribute("inert");
}

/** Keyboard and screen-reader users land on the page's title, not on nothing, when the loader is gone. */
export function focusPage() {
  const title = document.querySelector<HTMLElement>("main h1");
  if (!title) return;
  title.tabIndex = -1;
  title.focus({ preventScroll: true });
}
