// PreToolUse: block secrets, token-heavy reads, foreign stylesheets, destructive shell.
import { input, rel, deny } from "./_lib.mjs";

const { tool_name: tool, tool_input: ti = {} } = input();

const SECRET =
  /(^|\/)\.env(\.(?!example$|sample$)[\w.-]+)?$|\.(pem|key|p12)$|id_(rsa|ed25519)/;

if (tool === "Bash") {
  const cmd = String(ti.command || "");
  const rules = [
    [/git\s+push\b.*\s(--force|-f)\b/, "force push"],
    [/git\s+reset\s+--hard/, "hard reset (use git stash or /rewind)"],
    [/--no-verify\b/, "skipping git hooks"],
    [/(curl|wget)[^|]*\|\s*(ba|z)?sh/, "pipe to shell"],
    [/chmod\s+777/, "chmod 777"],
    [/(^|[\s;&|])(sudo|doas)\s/, "privilege escalation"],
    [
      /(cat|less|more|head|tail|grep|rg|sed|awk|bat)\b[^|;&]*\.env(?!\.example|\.sample)\b/,
      "reading secrets",
    ],
    [
      /(cat|less|more|head|tail)\b[^|;&]*package-lock\.json/,
      "dumping the lockfile (use `npm ls <pkg>`)",
    ],
  ];
  for (const m of cmd.matchAll(/\brm\s+((?:-\w+\s+)*)([^;&|]*)/g)) {
    const recursive = /-\w*[rR]/.test(m[1]);
    const targets = m[2].trim().split(/\s+/).filter(Boolean);
    const safe = targets.every(t =>
      /^(\.\/)?(\.next|node_modules|out|coverage|\.lighthouseci|shots|\.claude\/\.cache)\/?$/.test(
        t
      )
    );
    if (recursive && !safe)
      deny("Blocked: recursive delete outside build dirs. Ask the user.");
  }
  for (const [re, why] of rules) if (re.test(cmd)) deny(`Blocked: ${why}.`);
  process.exit(0);
}

const path = rel(ti.file_path || ti.path);
if (!path) process.exit(0);

if (SECRET.test(path))
  deny(
    `Blocked: ${path} is a secret file. Ask the user for the value you need.`
  );

if (tool === "Read" || tool === "Grep") {
  if (/^(package-lock\.json|\.next\/|out\/|coverage\/)/.test(path))
    deny(`Blocked: ${path} is generated and token-heavy.`);
  if (
    path.startsWith("node_modules/") &&
    !/^node_modules\/next\/dist\/docs\/|\.d\.ts$|\/package\.json$/.test(path)
  )
    deny(
      "Blocked: read node_modules only for next/dist/docs, *.d.ts or package.json."
    );
}

if (
  (tool === "Write" || tool === "Edit") &&
  /\.(css|scss|sass|less|styl)$/.test(path) &&
  path !== "src/app/globals.css"
)
  deny(
    "Blocked: all styles live in src/app/globals.css (@theme tokens + @utility classes)."
  );

process.exit(0);
