// Records how each watched element moves and changes while the page loads,
// under the Web Platform Slow 4G Mobile Check Profile (DevTools throttling values).
// Usage: node record.mjs <url> <runs> <outfile.json>
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const [url = 'http://localhost:3200', runs = '3', out = 'watched.json'] = process.argv.slice(2);
const CHROME = '/Users/adityaanavekar/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

// Profile part 1 values (DevTools / trace side).
const NET = { offline: false, latency: 562.5, downloadThroughput: (1474.56 * 1024) / 8, uploadThroughput: (675 * 1024) / 8 };
const CPU = 4;
const SCREEN = { width: 375, height: 812, deviceScaleFactor: 3, mobile: true };

// The page has no data-testid attributes, so each watched element is found by its real markup.
const recorder = () => {
  const SEL = {
    'size-grid': '#size div.grid',
    'size-button': '#size div.grid > button:not([aria-disabled="true"])',
    'size-button-sold-out': '#size div.grid > button[aria-disabled="true"]',
    'main-photo': 'section[aria-label="Product photos"] img',
    price: null, // the <p> whose text starts with a currency symbol
  };
  const findPrice = () => [...document.querySelectorAll('main p')].find((p) => /^\s*[$€£]/.test(p.textContent || '')) || null;
  const rec = { samples: [], shifts: [], lcp: [], fonts: [], img: null, events: {} };
  window.__rec = rec;
  const t = () => +performance.now().toFixed(1);
  const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { top: +(r.top + scrollY).toFixed(1), h: +r.height.toFixed(1), w: +r.width.toFixed(1) }; };
  let last = '';
  const sample = () => {
    const q = (s) => document.querySelector(s);
    const all = (s) => [...document.querySelectorAll(s)];
    const btn = all(SEL['size-button']), sold = all(SEL['size-button-sold-out']);
    const minSide = (els) => (els.length ? Math.min(...els.map((b) => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height); })) : null);
    const priceEl = findPrice();
    const s = {
      grid: rect(q(SEL['size-grid'])),
      photo: rect(q(SEL['main-photo'])),
      photoLoaded: !!q(SEL['main-photo'])?.complete && (q(SEL['main-photo'])?.naturalWidth || 0) > 0,
      price: rect(priceEl),
      priceText: priceEl?.textContent?.trim() || null,
      priceFont: priceEl ? getComputedStyle(priceEl).fontFamily.split(',')[0] : null,
      fontsStatus: document.fonts.status,
      btnCount: btn.length, btnMin: minSide(btn) == null ? null : +minSide(btn).toFixed(1),
      soldCount: sold.length, soldMin: minSide(sold) == null ? null : +minSide(sold).toFixed(1),
    };
    const key = JSON.stringify(s);
    if (key !== last) { rec.samples.push({ t: t(), ...s }); last = key; }
  };
  const loop = () => { sample(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  new MutationObserver(sample).observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
  new PerformanceObserver((l) => l.getEntries().forEach((e) => rec.shifts.push({
    t: +e.startTime.toFixed(1), value: e.value, hadRecentInput: e.hadRecentInput,
    sources: (e.sources || []).map((s) => ({ node: s.node ? (s.node.id ? '#' + s.node.id : s.node.nodeName + '.' + String(s.node.className || '').split(' ').slice(0, 3).join('.')) : null, from: s.previousRect && Math.round(s.previousRect.y), to: s.currentRect && Math.round(s.currentRect.y) })),
  }))).observe({ type: 'layout-shift', buffered: true });
  new PerformanceObserver((l) => l.getEntries().forEach((e) => rec.lcp.push({ t: +e.startTime.toFixed(1), el: e.element ? e.element.nodeName + (e.element.alt ? ' alt="' + e.element.alt + '"' : '') : null, size: e.size, url: e.url || null }))).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!rec.events[e.name]) rec.events[e.name] = +e.startTime.toFixed(1); })).observe({ type: 'paint', buffered: true });
  document.fonts.addEventListener('loadingdone', (e) => rec.fonts.push({ t: t(), loaded: e.fontfaces.map((f) => f.family + ' ' + f.weight) }));
  document.addEventListener('DOMContentLoaded', () => { rec.events.domContentLoaded = t(); });
  window.addEventListener('load', () => { rec.events.load = t(); sample(); });
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-first-run'] });
const results = [];
for (let i = 1; i <= Number(runs); i++) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  const cdp = await page.createCDPSession();
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', NET);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  await page.setViewport({ ...SCREEN, hasTouch: true, isMobile: true });
  const requests = [];
  cdp.on('Network.loadingFinished', (e) => requests.push(e));
  const urls = new Map();
  cdp.on('Network.responseReceived', (e) => urls.set(e.requestId, { url: e.response.url.replace(url, ''), type: e.type }));
  await page.evaluateOnNewDocument(recorder);
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
  await new Promise((r) => setTimeout(r, 1500));
  const rec = await page.evaluate(() => window.__rec);
  rec.wallMs = Date.now() - t0;
  rec.resources = requests.map((r) => ({ ...urls.get(r.requestId), kb: +(r.encodedDataLength / 1024).toFixed(1) })).filter((r) => r.url);
  results.push(rec);
  console.error(`run ${i}: ${rec.samples.length} samples, ${rec.shifts.length} shifts, load at ${rec.events.load} ms`);
  await ctx.close();
}
await browser.close();
fs.writeFileSync(out, JSON.stringify({ url, settings: { NET, CPU, SCREEN }, results }, null, 2));
