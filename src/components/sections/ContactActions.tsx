"use client";

import { useEffect, useRef, useState } from "react";

import Button from "@/components/ui/Button";
import { copy, EMAIL, GITHUB, LINKEDIN } from "@/lib/contact";

const RESET_MS = 2600;

/** The three actions. Copy email writes the address to the clipboard (or opens the mail app without one) and says so in a status line. */
export default function ContactActions() {
  const [status, setStatus] = useState<"idle" | "copied" | "mail">("idle");
  const timer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const done = (next: "copied" | "mail") => {
    copy.at = performance.now() / 1000;
    setStatus(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus("idle"), RESET_MS);
  };

  const onCopy = () => {
    if (!navigator.clipboard) {
      window.location.href = `mailto:${EMAIL}`;
      done("mail");
      return;
    }
    navigator.clipboard.writeText(EMAIL).then(
      () => done("copied"),
      () => {
        window.location.href = `mailto:${EMAIL}`;
        done("mail");
      }
    );
  };

  return (
    <div className="contact-actions">
      <div className="contact-buttons">
        <Button size="xl" onClick={onCopy} data-copied={status === "copied"}>
          {status === "copied" ? "Copied ✓" : "Copy email"}
        </Button>
        <Button size="xl" variant="secondary" href={LINKEDIN} external>
          LinkedIn
        </Button>
        <Button size="xl" variant="secondary" href={GITHUB} external>
          GitHub
        </Button>
      </div>
      <p role="status" className="contact-status">
        {status === "copied" && `${EMAIL} is on your clipboard`}
        {status === "mail" && "Opening your mail app"}
      </p>
    </div>
  );
}
