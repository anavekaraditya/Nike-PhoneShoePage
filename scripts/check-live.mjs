// Checks a page against the Web Platform Slow 4G Mobile Check Profile and
// prints PASS or FAIL for each value in speed-budget.json that a browser run can
// measure, plus whether the five watched data-testid elements are on the page.
//
// Usage:  node scripts/check-live.mjs <url> [runs]
//   e.g.  node scripts/check-live.mjs https://nike-pegasus-phone-page-one.vercel.app 3
// Chrome: set CHROME_PATH, or the Playwright Chrome for Testing path below is used.
// The Lighthouse score (performance_score_min) is measured separately, see PROMPT_NOTES.md.
import fs from "node:fs";
import puppeteer from "puppeteer-core";

const [url = "http://localhost:3000", runs = "3"] = process.argv.slice(2);
const CHROME =
  process.env.CHROME_PATH ||
  "/Users/adityaanavekar/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
const budget = JSON.parse(fs.readFileSync(new URL("../speed-budget.json", import.meta.url), "utf8"));

// Profile part 1, DevTools side: Slow 4G, 4x CPU, 375 x 812 at 3x, mobile.
const NET = {
  offline: false,
  latency: 562.5,
  downloadThroughput: (1474.56 * 1024) / 8,
  uploadThroughput: (675 * 1024) / 8,
};
const TESTIDS = ["size-grid", "size-button", "size-button-sold-out", "main-photo", "price"];

// Runs inside the page from the first moment of the document.
const recorder = () => {
  const rec = { gridTops: [], shifts: [] };
  window.__rec = rec;
  const grid = () => document.querySelector('[data-testid="size-grid"]');
  const sample = () => {
    const el = grid();
    if (!el) return;
    const top = +(el.getBoundingClientRect().top + scrollY).toFixed(1);
    const last = rec.gridTops[rec.gridTops.length - 1];
    if (!last || last.top !== top) rec.gridTops.push({ t: performance.now(), top });
  };
  const loop = () => {
    sample();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  new MutationObserver(sample).observe(document, { subtree: true, childList: true, attributes: true });
  new PerformanceObserver((l) => l.getEntries().forEach((e) => rec.shifts.push(e.value))).observe({
    type: "layout-shift",
    buffered: true,
  });
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-first-run"] });
const results = [];
for (let i = 1; i <= Number(runs); i++) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  const cdp = await page.createCDPSession();
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", NET);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(recorder);
  await page.goto(url, { waitUntil: "networkidle0", timeout: 120000 });
  await new Promise((r) => setTimeout(r, 3000));

  const data = await page.evaluate((ids) => {
    const minSide = (sel) => {
      const els = [...document.querySelectorAll(`[data-testid="${sel}"]`)];
      return {
        count: els.length,
        min: els.length
          ? Math.min(...els.map((b) => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height); }))
          : null,
      };
    };
    const found = Object.fromEntries(ids.map((id) => [id, document.querySelectorAll(`[data-testid="${id}"]`).length]));
    const { gridTops: all, shifts } = window.__rec;
    // The profile counts movement from first paint to fully loaded. Before first
    // paint the page is unstyled and nothing is on screen, so those readings are
    // kept separately and not counted. The position shown at first paint is the
    // last reading taken before it.
    const firstPaint = performance.getEntriesByName("first-paint")[0]?.startTime ?? 0;
    let start = 0;
    all.forEach((s, k) => { if (s.t <= firstPaint) start = k; });
    const gridTops = all.slice(start).map((s) => s.top);
    const beforePaint = all.slice(0, start).map((s) => s.top);
    let movement = 0;
    for (let k = 1; k < gridTops.length; k++) movement += Math.abs(gridTops[k] - gridTops[k - 1]);
    return {
      found,
      firstPaintMs: +firstPaint.toFixed(0),
      gridTopsBeforeFirstPaint: beforePaint,
      gridTops,
      gridMovementPx: +movement.toFixed(1),
      layoutShiftScore: +shifts.reduce((a, b) => a + b, 0).toFixed(4),
      button: minSide("size-button"),
      soldOut: minSide("size-button-sold-out"),
      vw: innerWidth,
      dpr: devicePixelRatio,
    };
  }, TESTIDS);
  results.push(data);
  await ctx.close();
}
await browser.close();

const gridMove = Math.max(...results.map((r) => r.gridMovementPx));
const minButton = Math.min(...results.flatMap((r) => [r.button.min, r.soldOut.min]));
const missing = TESTIDS.filter((id) => results.some((r) => r.found[id] === 0));
const pf = (ok) => (ok ? "PASS" : "FAIL");

console.log(`URL: ${url}  (${runs} runs, 375x812 @3x, Slow 4G, 4x CPU)`);
console.log(`size_grid_shift_px_max  <= ${budget.size_grid_shift_px_max}: ${pf(gridMove <= budget.size_grid_shift_px_max)}  (measured ${gridMove} px, layout-shift score ${Math.max(...results.map((r) => r.layoutShiftScore))})`);
console.log(`size_button_min_px      >= ${budget.size_button_min_px}: ${pf(minButton >= budget.size_button_min_px)}  (smallest side ${minButton} px across ${results[0].button.count} size-button + ${results[0].soldOut.count} size-button-sold-out)`);
console.log(`watched elements found: ${pf(missing.length === 0)}  ${JSON.stringify(results[0].found)}${missing.length ? "  missing: " + missing.join(", ") : ""}`);
console.log(`performance_score_min   >= ${budget.performance_score_min}: measured separately with Lighthouse`);
console.log(JSON.stringify({ url, runs: results }, null, 2));
process.exit(gridMove <= budget.size_grid_shift_px_max && minButton >= budget.size_button_min_px && missing.length === 0 ? 0 : 1);
