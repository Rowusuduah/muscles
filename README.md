# muscles

Your personal strength coach + tracker. A private, offline, installable web app built around **your** gym's equipment (USF Rec). Coached Push/Pull/Legs/Upper/Lower sessions, a body figure that **heats up** as you train each muscle, and a "Train alone" flow that adapts to how much time you have.

Built in the spirit of the skincare-routine PWA — no accounts, no build step, all data stays on your device.

## What it does

- **Train alone** → asks how long you have → builds a session that fits the time (more time = more work) → you pick which of your machines to use → log sets. Targets and weight are pre-filled; the app tells you when to add weight.
- **7-session cycle**: Push · Pull · Legs · Cardio · Upper · Lower · Cardio. Advances each time you finish a session, so a missed day never leaves a hole.
- **Busy machine?** One tap swaps to a same-muscle alternative and requeues the skipped one.
- **Everything counts**: planned or freestyle, plus cardio and abs, all roll into one weekly picture — a body heat-map, sets-per-muscle vs target, PRs (est. 1-rep max), rank, and a streak (never-miss-twice).
- **Coach**: form cues, common mistakes, and the habit psychology that keeps you consistent.

## Run it

It's a static site — just open `index.html`, or serve the folder:

```
npx serve .          # or any static server
```

For the installable PWA / service worker to work, serve over http(s) (open `http://localhost:3000`), not `file://`.

## Deploy (Vercel)

1. Push this folder to a GitHub repo.
2. Import it in Vercel as a static project (no build command, output = root).
3. Push to deploy. Bump `CACHE` in `sw.js` when you change files.

## Project layout

```
index.html        UI shell + styles (dark "Iron & Chalk" theme)
app.js            controller: Train-alone flow, logging, all screens
logic.js          pure engine: session builder, progression, volume, streaks, units  (unit-tested)
figure.js         front/back anatomy SVG with glowing muscle regions
data/
  muscles.js      muscle regions + weekly set targets
  exercises.js    exercise library (cues, mistakes, rep schemes)
  equipment.js    your 51 USF machines -> exercises  (some flagged `confirm:true`)
  program.js      the 7-session cycle + slot alternatives
assets/equipment/ compressed machine photos (eqN.webp)
tools/optimize-images.mjs   one-time: raw GYM/*.jpeg -> webp
test/logic.test.mjs         node --test suite
sw.js, manifest.json, icons/   PWA
```

## Tests

```
node --test
```

## Regenerate machine photos

Raw photos live in `GYM/` (gitignored — too large). To rebuild the compressed webp:

```
node tools/optimize-images.mjs
```

## Still to confirm (morning to-do)

A handful of machines were identified from photos and flagged `confirm:true` in `data/equipment.js` (also shown with a "verify" tag in the Train tab). Walk the gym, check the photo matches the name, and correct any. Everything else is wired and working.
