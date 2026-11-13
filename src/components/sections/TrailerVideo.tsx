"use client";

import { useEffect, useRef } from "react";

import { caseState, whenLanded } from "@/lib/caseStudy";
import { view } from "@/lib/projects";

/** The case study's backdrop: the Projects trailer carrying on, silent. It is a transition element, never a player, so it ignores the sound switch. */
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
      const at = view.video?.currentTime ?? 0;
      if (at > 0) video.currentTime = at;
      if (video.paused && video.dataset.parked === undefined)
        void video.play().catch(() => {});
    };
    if (caseState.diving) video.pause();
    return whenLanded(play);
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
