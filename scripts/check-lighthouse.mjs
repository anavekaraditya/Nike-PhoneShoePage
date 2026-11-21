// Reads one or more Lighthouse JSON reports and prints PASS or FAIL for
// performance_score_min in speed-budget.json, using the median score when there
// are several runs. Exits 1 on FAIL, and also when a report was not run with the
// Web Platform Slow 4G Mobile Check Profile settings.
//
// Usage: node scripts/check-lighthouse.mjs <report.json> [more reports...]
import fs from "node:fs";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node scripts/check-lighthouse.mjs <report.json> [more reports...]");
  process.exit(2);
}
const budget = JSON.parse(fs.readFileSync(new URL("../speed-budget.json", import.meta.url), "utf8"));

function settingsProblems(s) {
  const t = s.throttling;
  const e = s.screenEmulation;
  const p = [];
  if (s.formFactor !== "mobile") p.push(`formFactor ${s.formFactor}`);
  if (s.throttlingMethod !== "simulate") p.push(`throttlingMethod ${s.throttlingMethod}`);
  if (t.rttMs !== 150) p.push(`rttMs ${t.rttMs}`);
  if (t.throughputKbps !== 1638.4) p.push(`throughputKbps ${t.throughputKbps}`);
  if (t.cpuSlowdownMultiplier !== 4) p.push(`cpuSlowdownMultiplier ${t.cpuSlowdownMultiplier}`);
  if (e.width !== 375 || e.height !== 812 || e.deviceScaleFactor !== 3 || !e.mobile) {
    p.push(`screen ${e.width}x${e.height}@${e.deviceScaleFactor} mobile=${e.mobile}`);
  }
  return p;
}

const reports = files.map((f) => JSON.parse(fs.readFileSync(f, "utf8")));
const problems = reports.flatMap((r, i) => settingsProblems(r.configSettings).map((x) => `run ${i + 1}: ${x}`));

const scores = reports.map((r) => Math.round(r.categories.performance.score * 100));
const sorted = [...scores].sort((a, b) => a - b);
const median = sorted[Math.floor(sorted.length / 2)];
const ok = median >= budget.performance_score_min && problems.length === 0;

console.log(`Lighthouse ${reports[0].lighthouseVersion} on ${reports[0].finalDisplayedUrl}`);
reports.forEach((r, i) => {
  const a = r.audits;
  console.log(
    `  run ${i + 1}: score ${scores[i]}  FCP ${a["first-contentful-paint"].displayValue}  LCP ${a["largest-contentful-paint"].displayValue}  TBT ${a["total-blocking-time"].displayValue}  CLS ${a["cumulative-layout-shift"].displayValue}  (machine benchmark index ${r.environment.benchmarkIndex})`,
  );
});
console.log(`performance_score_min   >= ${budget.performance_score_min}: ${ok ? "PASS" : "FAIL"}  (median of ${scores.length} runs: ${median})`);
if (problems.length) console.log(`FAIL: not run with the profile settings: ${problems.join(", ")}`);
process.exit(ok ? 0 : 1);
