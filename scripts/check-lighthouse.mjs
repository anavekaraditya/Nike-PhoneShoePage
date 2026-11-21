// Reads a Lighthouse JSON report and prints PASS or FAIL for performance_score_min
// in speed-budget.json. Exits 1 on FAIL, and also when the report was not run with
// the Web Platform Slow 4G Mobile Check Profile settings.
//
// Usage: node scripts/check-lighthouse.mjs <report.json>
import fs from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/check-lighthouse.mjs <report.json>");
  process.exit(2);
}
const budget = JSON.parse(fs.readFileSync(new URL("../speed-budget.json", import.meta.url), "utf8"));
const report = JSON.parse(fs.readFileSync(file, "utf8"));

const s = report.configSettings;
const t = s.throttling;
const wrongSettings = [];
if (s.formFactor !== "mobile") wrongSettings.push(`formFactor ${s.formFactor}`);
if (s.throttlingMethod !== "simulate") wrongSettings.push(`throttlingMethod ${s.throttlingMethod}`);
if (t.rttMs !== 150) wrongSettings.push(`rttMs ${t.rttMs}`);
if (t.throughputKbps !== 1638.4) wrongSettings.push(`throughputKbps ${t.throughputKbps}`);
if (t.cpuSlowdownMultiplier !== 4) wrongSettings.push(`cpuSlowdownMultiplier ${t.cpuSlowdownMultiplier}`);
const e = s.screenEmulation;
if (e.width !== 375 || e.height !== 812 || e.deviceScaleFactor !== 3 || !e.mobile) {
  wrongSettings.push(`screen ${e.width}x${e.height}@${e.deviceScaleFactor} mobile=${e.mobile}`);
}

const score = Math.round(report.categories.performance.score * 100);
const a = report.audits;
const ok = score >= budget.performance_score_min && wrongSettings.length === 0;

console.log(`Lighthouse ${report.lighthouseVersion} on ${report.finalDisplayedUrl}`);
console.log(
  `performance_score_min   >= ${budget.performance_score_min}: ${ok ? "PASS" : "FAIL"}  (score ${score}; FCP ${a["first-contentful-paint"].displayValue}, LCP ${a["largest-contentful-paint"].displayValue}, TBT ${a["total-blocking-time"].displayValue}, CLS ${a["cumulative-layout-shift"].displayValue})`,
);
if (wrongSettings.length) console.log(`FAIL: report was not run with the profile settings: ${wrongSettings.join(", ")}`);
process.exit(ok ? 0 : 1);
