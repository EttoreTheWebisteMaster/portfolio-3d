export type Line = { from: "rob" | "you"; text: string; live?: boolean };
/** One page of the conversation: a question with its answer, or the greeting alone. */
type Turn = { question?: string; answer?: Line };

/** The conversation as turns: each question starts one, and the answer that follows joins it. */
export function turnsOf(lines: Line[]) {
  const turns: Turn[] = [];
  for (const line of lines) {
    const last = turns[turns.length - 1];
    if (line.from === "you") turns.push({ question: line.text });
    else if (last && !last.answer) last.answer = line;
    else turns.push({ answer: line });
  }
  return turns;
}
