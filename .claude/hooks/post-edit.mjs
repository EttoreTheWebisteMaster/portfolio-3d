// PostToolUse: format, lint and style-check the edited file. Only problems reach Claude.
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { input, rel, report, ROOT } from "./_lib.mjs";

const path = rel(input().tool_input?.file_path);
if (!path || !existsSync(`${ROOT}/${path}`) || path.startsWith("node_modules/"))
  process.exit(0);

const bin = name => `${ROOT}/node_modules/.bin/${name}`;
const run = (cmd, args) =>
  spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8" });
const problems = [];

if (
  /\.(m?[jt]sx?|css|json|md|ya?ml)$/.test(path) &&
  existsSync(bin("prettier"))
)
  run(bin("prettier"), ["--write", "--log-level", "silent", path]);

if (/\.(m?[jt]sx?)$/.test(path) && existsSync(bin("eslint"))) {
  const r = run(bin("eslint"), ["--fix", "--format", "json", path]);
  try {
    for (const f of JSON.parse(r.stdout || "[]"))
      for (const m of f.messages)
        problems.push(
          `${path}:${m.line}:${m.column} ${m.ruleId ?? "error"} ${m.message}`
        );
  } catch {
    if (r.status)
      problems.push(
        (r.stderr || r.stdout).trim().split("\n").slice(0, 5).join("\n")
      );
  }
}

if (/\.(tsx|jsx|css|scss|sass|less)$/.test(path)) {
  const { checkFiles } = await import(
    pathToFileURL(`${ROOT}/scripts/check-styles.mjs`).href
  );
  problems.push(...checkFiles([path]));
}

if (problems.length) report(problems);
