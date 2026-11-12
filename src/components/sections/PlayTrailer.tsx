"use client";

import Button from "@/components/ui/Button";
import { isMuted } from "@/lib/sound";

/** Restarts the hero screen's trailer from the top, with the page's sound setting. */
export default function PlayTrailer() {
  return (
    <Button
      onClick={() => {
        const video =
          document.querySelector<HTMLVideoElement>("[data-pull] video");
        if (!video) return;
        video.muted = isMuted();
        video.currentTime = 0;
        void video.play();
      }}
    >
      Play trailer
    </Button>
  );
}
