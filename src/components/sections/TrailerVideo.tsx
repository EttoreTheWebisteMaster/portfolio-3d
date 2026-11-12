"use client";

import { useEffect, useRef } from "react";

import { isMuted, subscribeMuted } from "@/lib/sound";

/** The case study's trailer. It starts the way the page's sound switch says; if the browser blocks sound it plays silent, and the first gesture gives the sound back. */
export default function TrailerVideo({
  src,
  poster,
  label,
}: Readonly<{ src: string; poster?: string; label: string }>) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const sync = () => {
      video.muted = isMuted();
      if (video.paused)
        void video.play().catch(() => {
          video.muted = true;
          void video.play().catch(() => {});
        });
    };
    sync();
    const stop = subscribeMuted(sync);
    window.addEventListener("pointerdown", sync, { once: true });
    window.addEventListener("keydown", sync, { once: true });
    return () => {
      stop();
      window.removeEventListener("pointerdown", sync);
      window.removeEventListener("keydown", sync);
    };
  }, []);
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
