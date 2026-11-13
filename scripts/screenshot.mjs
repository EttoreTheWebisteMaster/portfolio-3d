// npm run shot -- /route [baseUrl] [--only=375,1440] [--scroll=0,50,100] [--motion]
// → shots/<route>-<w>x<h>[-s<pct>].png for every viewport below.
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const VIEWPORTS = [
  { width: 375, height: 812, mobile: true },
  { width: 812, height: 375, mobile: true },
  { width: 820, height: 1180, mobile: true },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

const args = process.argv.slice(2);
const flag = name => args.find(a => a.startsWith(`--${name}=`))?.split("=")[1];
const [route = "/", base = "http://localhost:3000"] = args.filter(
  a => !a.startsWith("--")
);
const only = flag("only")?.split(",").map(Number);
const scrolls = (flag("scroll") ?? "").split(",").filter(Boolean).map(Number);
const reducedMotion = args.includes("--motion") ? "no-preference" : "reduce";

const slug = route.replace(/^\/|\/$/g, "").replace(/\//g, "_") || "home";
mkdirSync("shots", { recursive: true });

const browser = await chromium.launch();
try {
  for (const { width, height, mobile } of VIEWPORTS) {
    if (only && !only.includes(width)) continue;
    const context = await browser.newContext({
      viewport: { width, height },
      hasTouch: mobile,
      isMobile: mobile,
      deviceScaleFactor: mobile ? 2 : 1,
    });
    const page = await context.newPage();
    await page.emulateMedia({ reducedMotion });
    await page.goto(base + route, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.evaluate(() => document.fonts.ready);
    // The loader covers the page until the scene is ready: wait it out, then let the entry shot settle.
    await page
      .locator('[role="dialog"][aria-label="Loading"]')
      .waitFor({ state: "detached", timeout: 150000 })
      .catch(() => console.warn("loader still on screen after 150s"));
    await page.waitForTimeout(reducedMotion === "reduce" ? 1000 : 6000);
    const size = `${width}x${height}`;
    if (scrolls.length === 0) {
      const out = `shots/${slug}-${size}.png`;
      await page.screenshot({ path: out, fullPage: false });
      console.log(out);
    }
    for (const pct of scrolls) {
      await page.evaluate(p => {
        const max = document.documentElement.scrollHeight - innerHeight;
        scrollTo(0, (max * p) / 100);
      }, pct);
      await page.waitForTimeout(400);
      const out = `shots/${slug}-${size}-s${pct}.png`;
      await page.screenshot({ path: out });
      console.log(out);
    }
    await context.close();
  }
} catch (err) {
  console.error(`shot failed: ${err.message} (is \`npm run dev\` running?)`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
