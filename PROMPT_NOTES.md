# Prompt notes

## Request

```
Hand back a working Next.js page with Tailwind CSS that I can run locally and open at phone size. Also save this request in a file called PROMPT_NOTES.md.
```

## How to run it

```bash
npm install
npm run dev
```

Open http://localhost:3000, then view it at phone size (375 x 812):

- Chrome or Edge: open DevTools (Cmd+Opt+I), toggle the device toolbar (Cmd+Shift+M), choose a phone or set 375 x 812.
- Safari: Develop > Enter Responsive Design Mode.
- Or open the URL on a phone on the same Wi-Fi using your computer's local IP address.

Production check: `npm run build && npm start`.

## What is on the page

Top to bottom: header, name / price / colorway, product photo, size selector
(2 columns, 167.5 x 48 px at 375 px wide), Add to Bag, product details, reviews.

- Size data comes from `data/pegasus-43-sizes.json`; labels are shown as written in the file.
- Out-of-stock sizes are tappable and show an out-of-stock message with Notify me.
- Low-stock sizes get a corner dot and show "Just a few left. Order soon." when tapped.
- Tech specs, shipping copy and reviews are placeholders until real content is supplied.

## Slow 4G phone trace (20 November 2026)

### Request

```
I have attached a slow 4G Mobile check profile. I want you to set up a chrome devtool mcp to simulate a slow phone with 4x throttling. The information of the mobile profile is in the yaml file. Trace the results from them
```

Follow-up:

```
Return the watched_elements data, like the how far each element moves the grid and what happens during loading
```

### Settings used

From `Web Platform Slow 4G Mobile Check Profile.yaml`: 375 x 812 CSS px at 3x with
mobile on, Slow 4G (150 ms round trip, 1638.4 Kbps; DevTools side 562.5 ms
request latency, 1474.56 Kbps down, 675 Kbps up) and a 4x CPU slowdown.
This section's numbers were measured on a local production build
(`npm run build && npm start`). The live Vercel page is measured in the next
section.

### Where the results are

`traces/2026-11-20-slow4g/README.md` summarises the results. The raw files are
in the same folder.

## Vercel launch and live Lighthouse (20 November 2026)

### Prompts

```
Can you deploy this app on vercel and run a mobile Lighthouse on it. Provide me with the live link.
```

Follow-ups, in order:

```
Use the new stock file for the app
```

```
Add this screenshot to the repo and add the Live URL on the readme's first line.
```

```
Push the code
```

"The new stock file" is `Pegasus Size and Stock Snapshot, 8 December 2026.json`,
now copied to `data/pegasus-43-sizes.json` (9 sold out, 7 low stock, 10 in stock).

### Repeat the deploy

Needs the Vercel CLI, logged in (`vercel whoami`). The project name must be
lowercase, so the folder name `Nike-PhoneShoePage` cannot be used as the name.

```bash
vercel link --yes --project nike-pegasus-phone-page
vercel deploy --prod --yes
```

The production address is https://nike-pegasus-phone-page-one.vercel.app

### Repeat the mobile Lighthouse run

Uses the profile's settings from `traces/2026-11-20-slow4g/simulate.config.cjs`
(375 x 812 at 3x, mobile, Slow 4G simulated, 4x CPU). Set `CHROME_PATH` to a
Chrome binary first; Lighthouse reads the path from that variable.

```bash
export CHROME_PATH="/path/to/Google Chrome"
npx -y lighthouse https://nike-pegasus-phone-page-one.vercel.app/ \
  --config-path=traces/2026-11-20-slow4g/simulate.config.cjs \
  --chrome-flags="--headless=new" --output=html --output=json \
  --output-path=./live --quiet
```

### Repeat the pass or fail check

`scripts/check-live.mjs` loads the page under the same phone, Slow 4G and 4x CPU
settings, finds the five `data-testid` elements, and prints PASS or FAIL for
`size_grid_shift_px_max` and `size_button_min_px` from `speed-budget.json`.

```bash
npm install
node scripts/check-live.mjs https://nike-pegasus-phone-page-one.vercel.app 3
```

Grid movement is counted from first paint, as the profile says. Before first
paint the page is unstyled and the grid sits at 307.7 px; that reading is
reported separately and not counted.

### Live results

| Budget key | Required | Live result | Result |
| --- | --- | --- | --- |
| `performance_score_min` | >= 90 | 99, 99, 99 (Lighthouse, 3 runs) | Pass |
| `size_grid_shift_px_max` | 0 px | 0 px in 3 runs; layout shift score 0 | Pass |
| `size_button_min_px` | >= 44 px | 48 px (17 size-button, 9 size-button-sold-out) | Pass |

Lighthouse on the live page: first paint 0.8 s, largest paint 2.1 s, total
blocking time 70 to 80 ms, layout shift 0. The full report is
`traces/2026-11-20-slow4g/live-vercel.lighthouse.html`; the check output is
`traces/2026-11-20-slow4g/live-check.txt`.

## Automatic speed check on every push (20 November 2026)

### Request

A review suggestion, pasted as a screenshot:

```
Make check-live.mjs and the Lighthouse run happen on their own every time you push, so a change that moves the size grid gets caught before it goes live.
```

Its solution: a GitHub Actions workflow that runs Lighthouse with
`simulate.config.cjs` and `check-live.mjs`, and fails on any FAIL.

### What was added

- `.github/workflows/phone-speed-check.yml` runs on every push to `main`, every
  pull request, and by hand from the Actions tab.
- `scripts/check-lighthouse.mjs` reads a Lighthouse report and prints PASS or
  FAIL for `performance_score_min`. It also fails if the report was not run with
  the profile settings (mobile, Slow 4G, 4x CPU, 375 x 812 at 3x).
- `scripts/check-live.mjs` now turns off Chrome's sandbox when `CI` is set,
  which GitHub's runners need.

The job builds the commit, serves it on the runner, runs Lighthouse 13.6.0 three
times with `traces/2026-11-20-slow4g/simulate.config.cjs` and checks the median
score, then runs `node scripts/check-live.mjs` for 3 runs.

Why the median: the first CI run on a slow runner scored 86 (blocking time
410 ms) while the same page scores 97 to 99 on a laptop. In the next run the
three Lighthouse scores were 87, 100 and 98; the 87 came from a slower machine
(Lighthouse's machine benchmark index 2530 against about 3000 for the others).
The median of 3 was 98, so the run passed. The profile values (4x CPU, Slow 4G)
are unchanged. If two of three runs land on slow machines the check can still
fail by chance; re-run the workflow before treating that as a real slowdown. Any FAIL makes the run fail, and the
Lighthouse HTML report is kept as a run artifact.

It checks the commit it builds, not a Vercel preview, because this repo is not
connected to Vercel's Git integration (it was deployed with the CLI), so there
is no preview to wait for and no secrets are needed. To check a deployed address
instead, run the workflow by hand from the Actions tab and fill in `url`.

### Try it locally

```bash
npm run build && npx next start -p 3000
node scripts/check-live.mjs http://localhost:3000 3
```

Tested against a page whose grid moves after first paint: it reported FAIL with
300 px of grid movement. A Lighthouse report with a score below 90, or one run
without the 4x CPU slowdown, also reports FAIL.
