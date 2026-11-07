#!/usr/bin/env node
// Enforces the hybrid style contract:
//   - the only stylesheet is src/app/globals.css
//   - JSX className = layout utilities + classes defined in globals.css
//   - no arbitrary values, no raw hex outside @theme, no duplicate/unused @utility
// Usage: node scripts/check-styles.mjs [files...]   (no args = full scan)
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const GLOBALS = "src/app/globals.css";
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "out",
  "build",
  ".git",
  "coverage",
]);
const STYLE_EXT = /\.(css|scss|sass|less|styl)$/;
const CODE_EXT = /\.(tsx|jsx)$/;

// Layout / structure utilities allowed directly in JSX. Everything visual goes to globals.css.
const LAYOUT = [
  /^(block|inline-block|inline|flex|inline-flex|grid|inline-grid|contents|hidden|flow-root|list-item|table|table-row|table-cell)$/,
  /^(static|fixed|absolute|relative|sticky|isolate|container|visible|invisible|collapse|sr-only|not-sr-only|truncate|grow|shrink|box-border|box-content)$/,
  /^-?(inset|inset-x|inset-y|top|right|bottom|left|start|end)-/,
  /^-?z-\d+$|^z-auto$/,
  /^flex-(row|col|row-reverse|col-reverse|wrap|wrap-reverse|nowrap|1|auto|initial|none)$/,
  /^(grow|shrink)-\d+$/,
  /^(basis|order)-/,
  /^(grid-cols|grid-rows|col-span|col-start|col-end|row-span|row-start|row-end|grid-flow|auto-cols|auto-rows|columns)-/,
  /^(gap|gap-x|gap-y)-/,
  /^-?(space-x|space-y)-/,
  /^(justify|justify-items|justify-self|items|self|content|place-content|place-items|place-self)-/,
  /^-?(p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me)-/,
  /^(w|h|size|min-w|max-w|min-h|max-h)-/,
  /^(overflow|overflow-x|overflow-y|overscroll|overscroll-x|overscroll-y)-/,
  /^(line-clamp|whitespace|aspect|object|float|clear|pointer-events|cursor|select|touch|will-change|scroll-m|scroll-p|snap)-/,
  /^text-(left|center|right|justify|start|end)$/,
  /^(group|peer)(\/[\w-]+)?$/,
];

const isLayout = c => LAYOUT.some(re => re.test(c));

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else out.push(relative(ROOT, p).split(sep).join("/"));
  }
  return out;
}

const lineOf = (text, index) => text.slice(0, index).split("\n").length;

export function parseGlobals(rawCss) {
  // blank out comments but keep offsets/line numbers
  const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, c =>
    c.replace(/[^\n]/g, " ")
  );
  const defined = new Map();
  const problems = [];
  const re =
    /@utility\s+([\w-]+)|(?:^|[\s,}])\.([a-zA-Z][\w-]*)(?=[\s,{:.[])/gm;
  let m;
  while ((m = re.exec(css))) {
    const name = m[1] || m[2];
    if (m[1] && defined.has(name) && defined.get(name).utility)
      problems.push(
        `${GLOBALS}:${lineOf(css, m.index)} duplicate @utility "${name}"`
      );
    if (!defined.has(name) || m[1])
      defined.set(name, { utility: Boolean(m[1]), line: lineOf(css, m.index) });
  }
  // raw colors outside @theme
  const themeBlocks = [...css.matchAll(/@theme[^{]*\{[\s\S]*?\n\}/g)].map(b => [
    b.index,
    b.index + b[0].length,
  ]);
  const inTheme = i => themeBlocks.some(([a, b]) => i >= a && i < b);
  for (const c of css.matchAll(
    /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(/g
  ))
    if (!inTheme(c.index))
      problems.push(
        `${GLOBALS}:${lineOf(css, c.index)} raw color "${c[0]}" outside @theme → add a --color-* token`
      );
  for (const a of css.matchAll(/@apply[^;]*-\[[^\]]+\]/g))
    problems.push(
      `${GLOBALS}:${lineOf(css, a.index)} arbitrary value in @apply → add a token to @theme`
    );
  return { defined, problems };
}

// Pull string literals out of className={...}, className="...", cn(...), clsx(...)
export function extractClasses(src) {
  const found = [];
  const pushStrings = (chunk, offset) => {
    for (const s of chunk.matchAll(/(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/g)) {
      // skip literals used in comparisons: size === "sm", "sm" === size
      const before = chunk.slice(Math.max(0, s.index - 4), s.index);
      const after = chunk.slice(
        s.index + s[0].length,
        s.index + s[0].length + 4
      );
      if (/[=!]=\s*$/.test(before) || /^\s*[=!]==?/.test(after)) continue;
      // keep quoted literals inside ${...}, drop the expressions themselves
      const body = s[2].replace(
        /\$\{([^}]*)\}/g,
        (_, inner) =>
          ` ${[...inner.matchAll(/(["'])(.*?)\1/g)].map(q => q[2]).join(" ")} `
      );
      for (const cls of body.split(/\s+/).filter(Boolean))
        found.push({ cls, line: lineOf(src, offset + s.index) });
    }
  };
  const balanced = start => {
    let depth = 0;
    for (let i = start; i < src.length; i++) {
      if (src[i] === "{" || src[i] === "(") depth++;
      else if (src[i] === "}" || src[i] === ")") {
        depth--;
        if (depth === 0) return src.slice(start, i + 1);
      }
    }
    return src.slice(start);
  };
  for (const m of src.matchAll(/className\s*=\s*(["'])(.*?)\1/g))
    pushStrings(m[0].slice(m[0].indexOf(m[1])), m.index + m[0].indexOf(m[1]));
  for (const m of src.matchAll(/className\s*=\s*\{|\b(?:cn|clsx)\s*\(/g)) {
    const start = m.index + m[0].length - 1;
    pushStrings(balanced(start), start);
  }
  // dedupe (cn() inside className={} is matched twice)
  const seen = new Set();
  return found.filter(f => {
    const k = `${f.line}:${f.cls}`;
    return seen.has(k) ? false : seen.add(k);
  });
}

function baseUtility(cls) {
  // strip variants (md:, hover:, data-open:, group-hover/x:) — brackets allowed in variants
  let depth = 0;
  let cut = -1;
  for (let i = 0; i < cls.length; i++) {
    if (cls[i] === "[") depth++;
    else if (cls[i] === "]") depth--;
    else if (cls[i] === ":" && depth === 0) cut = i;
  }
  return cls.slice(cut + 1).replace(/^!|!$/g, "");
}

export function checkFiles(files, { full = false } = {}) {
  const problems = [];
  const globalsPath = join(ROOT, GLOBALS);
  if (!existsSync(globalsPath)) return [`${GLOBALS} missing`];
  const css = readFileSync(globalsPath, "utf8");
  const { defined, problems: cssProblems } = parseGlobals(css);
  const used = new Set();
  const word = name => new RegExp(`(?<![\\w-])${name}(?![\\w-])`);

  for (const f of files) {
    if (STYLE_EXT.test(f) && f !== GLOBALS) {
      problems.push(`${f} stylesheet not allowed → move rules into ${GLOBALS}`);
      continue;
    }
    if (f === GLOBALS) {
      problems.push(...cssProblems);
      continue;
    }
    if (!CODE_EXT.test(f) || !existsSync(join(ROOT, f))) continue;
    const src = readFileSync(join(ROOT, f), "utf8");
    // any mention of a defined class counts as usage (variant maps, constants…)
    if (full)
      for (const name of defined.keys())
        if (!used.has(name) && word(name).test(src)) used.add(name);
    const lines = src.split("\n");
    for (const { cls, line } of extractClasses(src)) {
      if (
        /style-ok/.test(lines[line - 1] || "") ||
        /style-ok/.test(lines[line - 2] || "")
      )
        continue;
      const base = baseUtility(cls);
      if (!base || /^[{}()?:&|!=<>+,]+$/.test(base)) continue;
      if (/\[.*\]/.test(base)) {
        problems.push(
          `${f}:${line} arbitrary value "${cls}" → token/@utility in ${GLOBALS}`
        );
        continue;
      }
      const name = base.replace(/^-/, "");
      if (name.endsWith("-")) {
        problems.push(
          `${f}:${line} dynamic class "${cls}…" → map variants to full class names`
        );
        continue;
      }
      if (defined.has(name)) {
        used.add(name);
        continue;
      }
      if (isLayout(name)) continue;
      problems.push(
        `${f}:${line} "${cls}" is visual/unknown → define an @utility in ${GLOBALS}`
      );
    }
  }

  if (full) {
    if (!files.includes(GLOBALS)) problems.push(...cssProblems);
    // unused semantic classes = dead CSS (applies only to @utility, base rules are global)
    for (const [name, info] of defined)
      if (
        info.utility &&
        !used.has(name) &&
        !new RegExp(`@apply[^;]*(?<![\\w-])${name}(?![\\w-])`).test(css)
      )
        problems.push(
          `${GLOBALS}:${info.line} @utility "${name}" is unused → delete it`
        );
  }
  return problems;
}

const isMain = import.meta.url === pathToFileURL(process.argv[1] || "").href;
if (isMain) {
  const args = process.argv.slice(2);
  const full = args.length === 0;
  const files = full
    ? walk(join(ROOT, "src")).filter(f => CODE_EXT.test(f) || STYLE_EXT.test(f))
    : args.map(a => relative(ROOT, join(ROOT, a)).split(sep).join("/"));
  const problems = checkFiles(files, { full });
  if (problems.length) {
    console.error(problems.slice(0, 40).join("\n"));
    if (problems.length > 40)
      console.error(`…and ${problems.length - 40} more`);
    console.error(`styles: ${problems.length} problem(s)`);
    process.exit(1);
  }
  console.log("styles: ok");
}
