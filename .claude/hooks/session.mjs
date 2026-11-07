// SessionStart: ≤10 lines of state so Claude doesn't spend tool calls rediscovering it.
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { ROOT } from "./_lib.mjs";

const git = a =>
  (spawnSync("git", a, { cwd: ROOT, encoding: "utf8" }).stdout || "").trim();
const out = [];
const branch = git(["branch", "--show-current"]);
if (branch) {
  const dirty = git(["status", "--porcelain"])
    .split("\n")
    .filter(Boolean).length;
  out.push(
    `git: ${branch} · ${dirty} changed · last: ${git(["log", "-1", "--format=%s"])}`
  );
}
if (existsSync(`${ROOT}/STATE.md`)) {
  const state = readFileSync(`${ROOT}/STATE.md`, "utf8")
    .split("\n")
    .filter(l => /^\w+:\s*\S/.test(l));
  if (state.length) out.push("STATE.md:", ...state.slice(0, 8));
}
if (!existsSync(`${ROOT}/node_modules/.bin/prettier`))
  out.push("warn: deps missing → npm install");
if (out.length) console.log(out.join("\n"));
