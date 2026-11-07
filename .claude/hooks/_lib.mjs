import { readFileSync } from "node:fs";
import { relative, isAbsolute, sep } from "node:path";

export const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();

export function input() {
  try {
    return JSON.parse(readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

/** Project-relative POSIX path, or null if outside the project. */
export function rel(p) {
  if (!p) return null;
  const r = relative(ROOT, isAbsolute(p) ? p : `${ROOT}/${p}`)
    .split(sep)
    .join("/");
  return r.startsWith("..") ? null : r;
}

export function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    })
  );
  process.exit(0);
}

/** Feed problems back to Claude (exit 2 → stderr is shown to the model). */
export function report(lines, max = 15) {
  const out = lines.slice(0, max);
  if (lines.length > max) out.push(`…+${lines.length - max} more`);
  process.stderr.write(out.join("\n") + "\n");
  process.exit(2);
}
