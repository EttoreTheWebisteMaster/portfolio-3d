"use client";

import { useEffect, useRef } from "react";

import { caseState, LAND, whenLanded } from "@/lib/caseMotion";
import { gsap } from "@/lib/gsap";
import { view } from "@/lib/projects";
import { volumeGain } from "@/lib/sound";

/** The sound the Projects trailer was playing is carried over and fades out over this many seconds, starting when the copy comes in. */
const FADE = 1.4;

/** The case study's backdrop: the Projects trailer carrying on. It is a transition element, never a player: it takes the sound over from the programme's trailer and lets it fade as the text arrives. */
export default function TrailerVideo({
  src,
  poster,
  label,
}: Readonly<{ src: string; poster?: string; label: string }>) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;
    // The programme's trailer stopped here when the dive began: this one carries on from the same frame.
    const from = view.video?.currentTime ?? 0;
    if (from > 0) {
      const seek = () => {
        video.currentTime = from;
      };
      if (video.readyState >= 1) seek();
      else video.addEventListener("loadedmetadata", seek, { once: true });
    }
    // Under the dive it waits on the frame the programme's trailer stopped at, and rolls the moment the case study lands.
    // Parked (swapped for its still, or reduced motion): it stays stopped.
    const play = () => {
      if (video.paused && video.dataset.parked === undefined) {
        const at = view.video?.currentTime ?? 0;
        if (at > 0) video.currentTime = at;
        void video.play().catch(() => {});
      }
    };
    if (caseState.diving) video.pause();

    // The sound does not stop with the programme's trailer: this one takes it up at the same moment and the same level, so nothing cuts.
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    let fade: gsap.core.Tween | null = null;
    let landed = false;
    const handOver = () => {
      if (!caseState.held || !caseState.programme) return;
      gsap.ticker.remove(handOver);
      // Too late to take the sound up: the case study has already landed.
      if (landed) return;
      const level = Math.min(volumeGain(), 1);
      if (level === 0 || video.dataset.parked !== undefined) return;
      video.currentTime = view.video?.currentTime ?? video.currentTime;
      video.volume = level;
      video.muted = false;
      void video.play().catch(() => {
        video.muted = true;
      });
    };
    if (!reduced && caseState.diving) gsap.ticker.add(handOver);

    // The copy comes in `LAND` seconds after the landing: that is when the sound starts to drop.
    const stopWait = whenLanded(() => {
      landed = true;
      gsap.ticker.remove(handOver);
      play();
      if (video.muted) return;
      fade = gsap.to(video, {
        volume: 0,
        duration: FADE,
        delay: LAND,
        ease: "sine.inOut",
        onComplete: () => {
          video.muted = true;
        },
      });
    });
    return () => {
      gsap.ticker.remove(handOver);
      fade?.kill();
      stopWait();
    };
  }, [poster]);
  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      aria-label={label}
    />
  );
}
