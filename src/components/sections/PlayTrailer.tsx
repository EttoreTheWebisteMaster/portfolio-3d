"use client";

import Button from "@/components/ui/Button";

/** Restarts the hero screen's trailer from the top, with sound. */
export default function PlayTrailer() {
  return (
    <Button
      onClick={() => {
        const video =
          document.querySelector<HTMLVideoElement>("[data-pull] video");
        if (!video) return;
        video.muted = false;
        video.currentTime = 0;
        void video.play();
      }}
    >
      Play trailer
    </Button>
  );
}
