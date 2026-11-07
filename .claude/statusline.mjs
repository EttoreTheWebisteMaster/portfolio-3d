// model · branch · context% · 5h/7d plan usage
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

let d = {};
try {
  d = JSON.parse(readFileSync(0, "utf8"));
} catch {}
const cwd = d.workspace?.current_dir || d.cwd || process.cwd();
const branch = (
  spawnSync("git", ["-C", cwd, "branch", "--show-current"], {
    encoding: "utf8",
  }).stdout || ""
).trim();
const col = p => (p < 50 ? 32 : p < 75 ? 33 : 31);
const fmt = (label, p) =>
  p == null ? "" : ` · \x1b[${col(p)}m${label} ${Math.round(p)}%\x1b[0m`;
const ctx = d.context_window?.used_percentage;
const bar =
  ctx == null
    ? ""
    : ` [${"█".repeat(Math.round(ctx / 10))}${"░".repeat(10 - Math.round(ctx / 10))}]`;
process.stdout.write(
  `${d.model?.display_name || "claude"} · ${branch || "—"}${bar}${fmt("ctx", ctx)}${fmt("5h", d.rate_limits?.five_hour?.used_percentage)}${fmt("7d", d.rate_limits?.seven_day?.used_percentage)}`
);
