// npm run shot -- /route [baseUrl]  → shots/<route>-375.png + -1440.png
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const [route = "/", base = "http://localhost:3000"] = process.argv.slice(2);
const slug = route.replace(/^\/|\/$/g, "").replace(/\//g, "_") || "home";
mkdirSync("shots", { recursive: true });

const browser = await chromium.launch();
try {
  for (const width of [375, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(base + route, { waitUntil: "networkidle", timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    const out = `shots/${slug}-${width}.png`;
    await page.screenshot({ path: out, fullPage: true });
    console.log(out);
  }
} catch (err) {
  console.error(`shot failed: ${err.message} (is \`npm run dev\` running?)`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
