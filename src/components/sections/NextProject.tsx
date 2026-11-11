"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import Button from "@/components/ui/Button";
import { gsap } from "@/lib/gsap";

const SECONDS = 7;

/** "Next project in 07s": once it is on screen the underline runs for 7 seconds, then the next case study opens. Any scroll, key or click cancels it. */
export default function NextProject({
  href,
  title,
}: Readonly<{ href: string; title: string }>) {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const clock = { t: 0 };
    const run = gsap.to(clock, {
      t: SECONDS,
      duration: SECONDS,
      ease: "none",
      paused: true,
      onUpdate: () => {
        el.style.setProperty("--p", String(clock.t / SECONDS));
        if (label.current)
          label.current.textContent = String(
            Math.ceil(SECONDS - clock.t)
          ).padStart(2, "0");
      },
      onComplete: () => router.push(href),
    });
    const events = ["wheel", "touchmove", "keydown", "pointerdown"] as const;
    let armed = 0;
    const disarm = () => {
      window.clearTimeout(armed);
      events.forEach(name => window.removeEventListener(name, cancel));
    };
    function cancel() {
      disarm();
      run.kill();
      seen.disconnect();
      el?.style.setProperty("--p", "0");
      if (label.current) label.current.textContent = "";
    }
    const seen = new IntersectionObserver(
      ([entry]) => {
        disarm();
        if (!entry.isIntersecting) {
          run.pause(0);
          return;
        }
        run.play();
        // A beat of grace, so the scroll that brought it here does not cancel it.
        armed = window.setTimeout(
          () =>
            events.forEach(name =>
              window.addEventListener(name, cancel, { passive: true })
            ),
          600
        );
      },
      { threshold: 1 }
    );
    seen.observe(el);
    return () => {
      seen.disconnect();
      disarm();
      run.kill();
    };
  }, [router, href]);

  return (
    <div ref={root} className="case-next">
      <p className="eyebrow">
        Next project <span ref={label} />
      </p>
      <Button href={href} variant="timer" arrow>
        {title}
      </Button>
    </div>
  );
}
