"use client";

import { Input } from "@headlessui/react";
import { useEffect, useRef, useState } from "react";

import Button from "@/components/ui/Button";
import {
  answerFor,
  asking,
  GREETING,
  markAsked,
  match,
  nextPicks,
  onGreet,
  PICKS,
  QUESTIONS,
} from "@/lib/interview";
import { play } from "@/lib/sound";

/** Characters per second a line types on at. */
const SPEED = 40;
/** How many lines stay in full colour; older ones go quiet. */
const FRESH = 2;

type Line = { from: "rob" | "you"; text: string };

/** The interview: a conversation that types on in place (never bubbles), the question field, and three suggestions that change as they are used. */
export default function AboutAsk() {
  const [value, setValue] = useState("");
  const [log, setLog] = useState<Line[]>([]);
  const [reply, setReply] = useState("");
  const [shown, setShown] = useState(0);
  const [used, setUsed] = useState<ReadonlySet<string>>(new Set());
  const timer = useRef<number>(0);

  // He says hello as he rises into the cut.
  useEffect(() => onGreet(() => setReply(GREETING)), []);

  useEffect(() => {
    if (!reply) return;
    const start = performance.now();
    asking.speaking = true;
    const tick = () => {
      const n = Math.min(
        reply.length,
        Math.floor(((performance.now() - start) / 1000) * SPEED)
      );
      setShown(n);
      if (n < reply.length) {
        timer.current = requestAnimationFrame(tick);
        return;
      }
      // Done: the line joins the conversation.
      asking.speaking = false;
      setLog(lines => [...lines, { from: "rob", text: reply }]);
      setReply("");
      setShown(0);
    };
    timer.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(timer.current);
      asking.speaking = false;
    };
  }, [reply]);

  const send = (question: string, answer: string, id?: string) => {
    markAsked();
    play("pop");
    // A question asked mid-answer finishes that answer first.
    setLog(lines => [
      ...lines,
      ...(reply ? [{ from: "rob" as const, text: reply }] : []),
      { from: "you", text: question },
    ]);
    setShown(0);
    setReply(answer);
    if (!id) return;
    // A used question leaves the list; once too few are left, the list starts over.
    const next = new Set(used).add(id);
    setUsed(QUESTIONS.length - next.size < PICKS ? new Set() : next);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text) return;
    send(text, answerFor(text), match(text)?.id);
    setValue("");
  };

  const lines: (Line & { live?: boolean })[] = reply
    ? [...log, { from: "rob", text: reply.slice(0, shown), live: true }]
    : log;

  return (
    <>
      <div className="chat" role="log" aria-live="polite">
        {lines.map((line, i) => (
          <p
            key={i}
            className="chat-line"
            data-from={line.from}
            data-old={i < lines.length - FRESH || undefined}
          >
            {line.from === "you" && <span className="chat-from">You</span>}
            {line.text}
            {line.live && <span className="ask-caret" aria-hidden />}
          </p>
        ))}
      </div>

      <form onSubmit={submit} className="ask-line">
        <Input
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Type your question"
          aria-label="Your question for ROB-092"
          autoComplete="off"
          maxLength={120}
          className="ask-input"
        />
        <Button type="submit" variant="key" arrow>
          Ask
        </Button>
      </form>

      <ul className="ask-picks" aria-label="Suggested questions">
        {nextPicks(used).map(q => (
          <li key={q.id}>
            <button
              type="button"
              className="ask-pick"
              onClick={() => send(q.question, q.answer, q.id)}
            >
              {q.question}
            </button>
          </li>
        ))}
      </ul>

      <p className="ask-note">
        An AI trained on Ettore&apos;s CV. May embellish. Nothing is stored.
      </p>
    </>
  );
}
