// npm run paths [baseUrl]  → drives every way into every page, checks URL, title and console, prints one line each.
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3000";
const PAGES = [
  { path: "/", title: /Designer/ },
  { path: "/projects", title: /^Projects/ },
  { path: "/about", title: /^About/ },
  { path: "/contact", title: /^Contact/ },
];
const failures = [];
const check = (ok, what) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${what}`);
  if (!ok) failures.push(what);
};

const browser = await chromium.launch({
  // A real GPU: software GL stretches every transition past what the checks wait for.
  args: [
    "--use-angle=metal",
    "--enable-gpu-rasterization",
    "--ignore-gpu-blocklist",
  ],
});
const open = async path => {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => m.type() === "error" && errors.push(m.text()));
  await page.goto(base + path, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute("data-loading"),
    null,
    { timeout: 90000 }
  );
  await page.waitForTimeout(800);
  await landed(
    page,
    PAGES.findIndex(p => p.path === path)
  );
  return { page, errors };
};
// The journey has landed when its position sits on a whole page for a moment (a cut under the veil keeps input locked ~1.7s); slow software GL stretches the travel, so wait on that, not on a timer.
const landed = async (page, index) => {
  // Let the move start, and forget the last landing, so a stale "still" never counts.
  await page.waitForTimeout(300);
  await page.evaluate(() => (window.__still = 0));
  await page.waitForFunction(
    target => {
      const pos = parseFloat(
        document.documentElement.style.getPropertyValue("--pos")
      );
      const still = Math.abs(pos - target) < 0.002;
      window.__still = still ? window.__still || performance.now() : 0;
      return still && performance.now() - window.__still > 2200;
    },
    index,
    { timeout: 60000, polling: 100 }
  );
};
const settled = async (page, to) => {
  await page
    .waitForFunction(p => location.pathname === p, to.path, {
      timeout: 60000,
    })
    .catch(async e => {
      console.log(
        `     stuck at ${await page.evaluate(() => `${location.pathname} --pos ${document.documentElement.style.getPropertyValue("--pos")}`)}`
      );
      throw e;
    });
  await landed(page, PAGES.indexOf(to));
  const title = await page.title();
  const ok = to.title.test(title);
  if (!ok)
    console.log(`     at ${new URL(page.url()).pathname} title "${title}"`);
  return ok;
};

try {
  // Direct loads, then every link from every page.
  for (const from of PAGES) {
    const { page, errors } = await open(from.path);
    check(from.title.test(await page.title()), `direct ${from.path}: title`);
    for (const to of PAGES) {
      if (to === from) continue;
      const link = page.locator(`header a[href="${to.path}"]`).first();
      if ((await link.count()) === 0) continue;
      await link.click();
      check(
        await settled(page, to).catch(() => false),
        `${from.path} → ${to.path} (navbar)`
      );
      await page.goBack();
      check(
        await settled(page, from).catch(() => false),
        `back to ${from.path}`
      );
    }
    check(
      errors.length === 0,
      `${from.path}: no console errors${errors.length ? ` (${errors[0]})` : ""}`
    );
    await page.close();
  }
  // Wheel through the whole journey and back.
  const { page } = await open("/");
  for (const to of PAGES.slice(1)) {
    await page.mouse.wheel(0, 400);
    check(await settled(page, to).catch(() => false), `wheel → ${to.path}`);
  }
  for (const to of [...PAGES].reverse().slice(1)) {
    await page.mouse.wheel(0, -400);
    check(
      await settled(page, to).catch(() => false),
      `wheel back → ${to.path}`
    );
  }
  // A burst of momentum must turn one page, not several.
  await page.goto(base + "/projects", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute("data-loading"),
    null,
    { timeout: 90000 }
  );
  await page.waitForTimeout(800);
  await landed(page, 1);
  for (let i = 0; i < 12; i++) {
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(4200);
  check(
    new URL(page.url()).pathname === "/about",
    "wheel burst turns exactly one page"
  );
  // A link clicked mid-move is taken at once: the move in flight is dropped and the page lands on the new one.
  const interrupt = async (start, first, second, label) => {
    const { page: p, errors } = await open(start.path);
    await p.locator(`header a[href="${first.path}"]`).first().click();
    await p.waitForTimeout(800);
    await p.locator(`header a[href="${second.path}"]`).first().click();
    check(
      await settled(p, second).catch(() => false),
      `interrupted click: ${label}`
    );
    check(errors.length === 0, `interrupted click ${label}: no console errors`);
    await p.close();
  };
  await interrupt(
    PAGES[0],
    PAGES[1],
    PAGES[2],
    "/ → /projects, then /about mid-move"
  );
  await interrupt(
    PAGES[1],
    PAGES[2],
    PAGES[0],
    "/projects → /about, then / mid-move"
  );
  await interrupt(
    PAGES[0],
    PAGES[1],
    PAGES[3],
    "/ → /projects → /contact (skips a page)"
  );
  await page.close();
} finally {
  await browser.close();
}
if (failures.length) {
  console.error(`${failures.length} failed`);
  process.exitCode = 1;
}
