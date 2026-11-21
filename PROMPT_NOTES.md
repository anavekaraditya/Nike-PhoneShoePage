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
