"use client";

import { Input } from "@headlessui/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import Button from "@/components/ui/Button";
import {
  answerFor,
  asking,
  GREETING,
  markAsked,
  match,
  onGreet,
} from "@/lib/interview";
import { type Line, turnsOf } from "@/lib/chatTurns";
import { play } from "@/lib/sound";
import { usePicks } from "@/lib/usePicks";

import ChatJump from "./ChatJump";

/** Characters per second a line types on at. */
const SPEED = 40;

/** The interview: one message at a time (a question and its answer, typed on in place, never bubbles), the question field, and three suggestions that change as they are used. */
export default function AboutAsk() {
  const [value, setValue] = useState("");
  const [log, setLog] = useState<Line[]>([]);
  const [reply, setReply] = useState("");
  const [shown, setShown] = useState(0);
  const { picks, leaving, retire } = usePicks();
  /** Scrolled up from the newest message: the round button to go back down shows. */
  const [away, setAway] = useState(false);
  const timer = useRef<number>(0);
  const chat = useRef<HTMLDivElement>(null);

  // He says hello as he rises into the cut.
  useEffect(() => onGreet(() => setReply(GREETING)), []);

  const lines: Line[] = reply
    ? [...log, { from: "rob", text: reply.slice(0, shown), live: true }]
    : log;
  const turns = turnsOf(lines);
  const last = turns.length - 1;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  /** The newest message's top edge in the chat's scroll. */
  const newest = () => chat.current?.children[last] as HTMLElement | undefined;
  const scrollToNewest = () =>
    chat.current?.scrollTo({
      top: newest()?.offsetTop ?? 0,
      behavior: reduced() ? "auto" : "smooth",
    });

  // The chat fades at an edge only while there is more text past it, and the round button shows once the newest message is out of reach.
  const sync = () => {
    const el = chat.current;
    if (!el) return;
    const below = Math.max(el.scrollHeight - el.scrollTop - el.clientHeight, 0);
    const top = newest()?.offsetTop ?? 0;
    // Resting on the newest message, nothing is cut off at the top: the fade grows as the chat moves away from it.
    const above = el.scrollTop > 0 ? Math.abs(top - el.scrollTop) : 0;
    el.style.setProperty("--fade-top", `${Math.min(above, 28)}px`);
    el.style.setProperty("--fade-bottom", `${Math.min(below, 28)}px`);
    setAway(top - el.scrollTop > 24);
  };
  // A new message goes up and fills the chat; the earlier ones are above it.
  useLayoutEffect(() => {
    if (last > 0) scrollToNewest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [last]);
  // Measured when the messages change, not on every typed letter (a forced layout per frame stutters the greeting).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(sync, [last, Math.floor(shown / 16)]);

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
    if (id) retire(id);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text) return;
    send(text, answerFor(text), match(text)?.id);
    setValue("");
  };

  return (
    <>
      <div data-fx="item" className="fx chat-wrap">
        <div
          ref={chat}
          onScroll={sync}
          className="chat"
          role="log"
          aria-live="polite"
        >
          {turns.map((t, n) => (
            <section key={n} className="chat-turn">
              <p className="chat-meta">
                <span>{t.question ? "You" : "ROB"}</span>
                {t.question ?? "Nice to meet you"}
              </p>
              {t.answer && (
                <p className="chat-answer">
                  {t.answer.text}
                  {t.answer.live && <span className="ask-caret" aria-hidden />}
                </p>
              )}
            </section>
          ))}
        </div>
        <ChatJump show={away} onJump={scrollToNewest} />
      </div>

      <form onSubmit={submit} data-fx="item" className="fx ask-line">
        <Input
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Type your question"
          aria-label="Your question for ROB-092"
          autoComplete="off"
          maxLength={120}
          className="ask-input"
        />
        <Button type="submit" variant="key" arrow aria-label="Send question">
          Ask
        </Button>
      </form>

      <ul
        data-fx="stack"
        className="fx ask-picks"
        aria-label="Suggested questions"
      >
        {/* A slot keeps its element (the page transition animates it); only the button inside is new. */}
        {picks.map((q, i) => (
          <li key={i}>
            <button
              key={q.id}
              type="button"
              className="ask-pick"
              data-leaving={leaving.includes(i) || undefined}
              onClick={() => send(q.question, q.answer, q.id)}
            >
              {q.question}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
