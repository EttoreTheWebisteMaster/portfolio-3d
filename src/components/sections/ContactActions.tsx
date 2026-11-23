"use client";

import { useEffect, useRef, useState } from "react";

import Button from "@/components/ui/Button";
import { EMAIL, GITHUB, LINKEDIN } from "@/lib/contact";

const RESET_MS = 5000;

/** The three actions. Send email opens the mail app; the key confirms with a check, and a line below says where the mail is going. */
export default function ContactActions() {
  const [sent, setSent] = useState(false);
  const timer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const send = () => {
    setSent(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSent(false), RESET_MS);
  };

  return (
    <div className="contact-actions">
      <div className="contact-buttons">
        <Button
          size="xl"
          href={`mailto:${EMAIL}`}
          onClick={send}
          data-sent={sent}
        >
          {sent ? "Sent ✓" : "Send email"}
        </Button>
        <Button size="xl" variant="secondary" href={LINKEDIN} external>
          LinkedIn
        </Button>
        <Button size="xl" variant="secondary" href={GITHUB} external>
          GitHub
        </Button>
      </div>
      <p role="status" data-on={sent} className="contact-status">
        {sent && `Sending mail to ${EMAIL}`}
      </p>
    </div>
  );
}
