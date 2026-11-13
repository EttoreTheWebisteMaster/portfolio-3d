"use client";

import { useEffect, useRef } from "react";

/** A silent looping clip that only plays while it is on the screen: off-screen footage costs a decoder for nothing. */
export default function LoopVideo({
  src,
  label,
}: Readonly<{ src: string; label: string }>) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const watch = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void video.play().catch(() => {});
      else video.pause();
    });
    watch.observe(video);
    return () => watch.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      src={src}
      aria-label={label}
      muted
      loop
      playsInline
      preload="metadata"
    />
  );
}
