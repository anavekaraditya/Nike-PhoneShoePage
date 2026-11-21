# Slow 4G phone trace: 20 November 2026

Page: production build of this repo (`npm run build && npm start`), not the live Vercel page.
Settings: `Web Platform Slow 4G Mobile Check Profile.yaml`, part 1 (375 x 812 at 3x,
mobile, Slow 4G, 4x CPU slowdown).

## Budget keys

| Key | Required | Measured | Result |
| --- | --- | --- | --- |
| `performance_score_min` | >= 90 | 98 (3 simulated runs and 1 DevTools-throttled run) | Pass |
| `size_grid_shift_px_max` | 0 px | 0 px (no layout shifts in any run) | Pass |
| `size_button_min_px` | >= 44 px | 48 px (all 26 buttons are 167.5 x 48) | Pass |

DevTools-throttled run: first paint 1.5 s, largest paint 2.3 s, total blocking time 40 ms.

## Watched elements

All five `data-testid` attributes are now on the page. The "Found by" column
below shows the markup each one was matched by in the earlier runs; a re-run
after adding the attributes found 1 `size-grid`, 22 `size-button`, 4
`size-button-sold-out`, 1 `main-photo` and 1 `price`, with 0 px grid movement
and no layout shifts. Lighthouse after the change: 97, 98 and 97.

| Watched element | Found by | What happens while loading | Grid movement |
| --- | --- | --- | --- |
| `size-grid` | `#size div.grid` | Top edge at 724.8 px from first paint (about 1.45 s) to fully loaded (about 2.5 s) | 0 px |
| `size-button` | grid buttons without `aria-disabled="true"` | 22 buttons, 167.5 x 48 px | n/a |
| `size-button-sold-out` | grid buttons with `aria-disabled="true"` | 4 buttons, 167.5 x 48 px, kept in the grid | n/a |
| `main-photo` | `section[aria-label="Product photos"] img` | 375 x 468.8 px box reserved at 192 px; the image fills it at about 2.3 s and becomes the largest element | 0 px |
| `price` | the `$140.00` line | Top 128 px, 28 px tall; Geist replaces the matched fallback font at about 1.8 s with no size change | 0 px |

Why nothing moves: the photo has a fixed 4:5 box, `next/font` draws text in a
fallback (`local(Arial)` with `size-adjust` and ascent/descent overrides) sized
to match Geist, and the price's line height is fixed at 28 px.

Not covered: devices without Arial (most Android phones) fall back to another
font without the matched sizing, so a line that wraps differently there could
move the grid.

## Files

| File | What it is |
| --- | --- |
| `slow4g-phone.trace.json` | DevTools performance trace (open in the Performance panel) |
| `slow4g-phone.lighthouse.html` | Lighthouse report from the DevTools-throttled run |
| `simulate-run1.lighthouse.json` | Lighthouse JSON from simulated run 1 |
| `simulate.config.cjs`, `devtools.config.cjs` | Lighthouse configs with the profile's settings |
| `watched-elements.json` | Per-frame positions of each watched element, 3 runs |
| `record-watched-elements.mjs` | Script that produced `watched-elements.json` (needs `puppeteer-core`) |

## Live Vercel page (https://nike-pegasus-phone-page-one.vercel.app)

Measured after the `data-testid` attributes were added, with the 8 December stock
file, under the same phone, Slow 4G and 4x CPU settings.

| `speed-budget.json` key | Required | Live result | Result |
| --- | --- | --- | --- |
| `performance_score_min` | >= 90 | 99, 99, 99 (Lighthouse, 3 runs) | Pass |
| `size_grid_shift_px_max` | 0 px | 0 px in 3 runs, layout shift score 0 | Pass |
| `size_button_min_px` | >= 44 px | 48 px: 17 `size-button`, 9 `size-button-sold-out` | Pass |

All five watched `data-testid` elements are found on the live page. Lighthouse:
first paint 0.8 s, largest paint 2.1 s, total blocking time 70 to 80 ms.

| File | What it is |
| --- | --- |
| `live-vercel.lighthouse.html` | Lighthouse report for the live page |
| `live-check.txt` | Output of `scripts/check-live.mjs` (3 runs, per-frame grid positions) |

The earlier `record-watched-elements.mjs` finds elements by markup because the
page had no `data-testid` attributes then. `scripts/check-live.mjs` replaces it
and reads the `data-testid` names directly.
