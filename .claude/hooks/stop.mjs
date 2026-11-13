// Stop: typecheck + style-check once per change set. Blocks once, then lets Claude stop.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { input, report, ROOT } from "./_lib.mjs";

if (input().stop_hook_active) process.exit(0);

const git = args =>
  spawnSync("git", args, { cwd: ROOT, encoding: "utf8" }).stdout || "";
const changed = [
  ...new Set([
    ...git(["diff", "--name-only", "HEAD"]).split("\n"),
    ...git(["ls-files", "--others", "--exclude-standard"]).split("\n"),
  ]),
].filter(f => /^src\/.*\.(tsx?|css)$/.test(f) && existsSync(`${ROOT}/${f}`));
if (!changed.length) process.exit(0);

const hash = createHash("sha1");
for (const f of changed.sort())
  hash.update(f).update(readFileSync(`${ROOT}/${f}`));
const key = hash.digest("hex");
const cache = `${ROOT}/.claude/.cache/stop-ok`;
if (existsSync(cache) && readFileSync(cache, "utf8") === key) process.exit(0);

const problems = [];
const tsc = `${ROOT}/node_modules/.bin/tsc`;
if (existsSync(tsc)) {
  const r = spawnSync(tsc, ["--noEmit", "--pretty", "false"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (r.status)
    problems.push(...r.stdout.split("\n").filter(l => /error TS/.test(l)));
}
const prettier = `${ROOT}/node_modules/.bin/prettier`;
if (existsSync(prettier)) {
  const r = spawnSync(
    prettier,
    ["--check", "--log-level", "warn", ...changed],
    {
      cwd: ROOT,
      encoding: "utf8",
    }
  );
  if (r.status)
    problems.push(
      ...r.stderr
        .split("\n")
        .filter(l => l.startsWith("[warn]") && !/Code style/.test(l))
    );
}
const { checkFiles } = await import(
  pathToFileURL(`${ROOT}/scripts/check-styles.mjs`).href
);
problems.push(...checkFiles(changed));

if (problems.length)
  report(["Gate failed — fix before finishing:", ...problems], 20);
mkdirSync(`${ROOT}/.claude/.cache`, { recursive: true });
writeFileSync(cache, key);
