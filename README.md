# muscles · Verified Gym Guide & Coach

`muscles` is a private, phone-first strength coach and multi-gym equipment handbook. It preserves the original gym's 45 verified guides / 51 source photographs and adds a Crunch Fitness library built from a 140-photo equipment audit, with adaptive workouts, logging, gym-specific substitutions, partner sessions, animated demonstrations, history, progress tracking, and an indoor equipment-zone map.

The signature Iron & Chalk dark theme is retained, with a system-aware light theme and manual override. The app works offline after installation; workout records never leave the device.

## Verified equipment libraries

- The original gym keeps exactly 45 authoritative guides mapping all 51 photographs, including grouped alternate views and explicit filename traceability.
- Crunch Fitness adds 60 model-level guides derived from 140 unique canonical photos. Repeated sightings/angles are grouped instead of counted as extra equipment.
- Crunch identities use readable equipment plaques when available. Ambiguous plate-loaded/cardio pieces are marked manual-only and excluded from automatic workout selection.
- Every coached program slot has either a verified Crunch-compatible movement or a verified alternative from the program's existing substitution list.
- Crunch includes a schematic zone map built from EXIF capture sequence, timestamps, camera direction, and visible adjacency. Indoor GPS is used only to anchor the venue because the photo audit's median horizontal error is about 22.6 m.
- Disputed mappings are corrected conservatively: photos 3/4, 9/12, 44/45, 50, and 51.
- No unsupported StepMill, elliptical, or hip-abduction catalog entries remain.
- Each guide includes evidence and confidence, annotated photographs, adjustments, safety checks, execution phases, form corrections, programming, progression, alternatives, and source references.
- `tools/export_handbook_app_data.py` generates `data/handbook.js` from the handbook builder's canonical inventory, so the document and app share one source of truth.

## Coaching and programs

- Beginner Full Body A/B for two or three sessions per week
- Push/Pull/Legs for three sessions
- Upper/Lower for four sessions
- Intermediate four-day strength and hypertrophy structure
- 20/30/45/60/90/120-minute time fitting that stays inside the selected program
- Solo coaching automatically assigns one verified station using the planned route and the most recent compatible machine record; no equipment picker is shown during a coached workout.
- Partner/custom sessions retain manual equipment choice because the partner leads the session.
- Automatic warm-up and ramp-up sets, RIR-aware double progression, conservative reduction suggestions, intelligent busy-machine substitutions, requeueing, custom partner sessions, and optional advanced techniques
- The current Crunch station can be opened directly in the existing equipment-zone map from the workout screen.
- Correct load semantics for plates per side, dumbbells per hand, selector stacks, bodyweight assistance, and machine settings

## Run and validate

Requires Node.js 22.13+.

```powershell
npm test
```

The Node test suite covers the existing gym handbook and coaching logic plus Crunch inventory integrity, manual-only safeguards, zone-map metadata, exercise references, and full program-to-equipment coverage.

Installed copies check for a new service worker on launch, when returning to the app, and when connectivity returns. Learn → App updates also provides a manual check and displays the current release.

## Project structure

```text
index.html                 App shell, themes, accessibility and responsive styles
app.js                     SPA routes, training, guides, progress, Learn and settings
logic.js                   Pure session, progression, consistency and unit logic
howto.js                   Equipment-aware, reduced-motion-safe code demonstrations
data/handbook.js           Original gym's generated 45-guide/51-photo browser data
data/crunch.js             Crunch 140-photo audit, 60 guides, mappings and schematic zone map
data/exercises.js          Versioned active and deprecated exercise definitions
data/program.js            Versioned program registry and warm-up prescriptions
data/state.js              AppStateV2 migration and validated backup/restore
assets/equipment/          eq1.webp through eq51.webp
assets/demos/              Validated two-frame demonstration assets
fonts/                     Self-hosted Open Font License typefaces
worker/index.js            Sites static-asset worker and SPA fallback
sw.js                      Update-safe offline service worker
test/logic.test.mjs        Data, logic, migration, backup and offline contract tests
tools/                     Handbook export and acceptance validation scripts
```

## Privacy and backup

There is no account database, analytics upload, or cloud workout storage. App state is stored locally under schema version 2. Export creates a validated JSON backup; import previews a summary and replaces local state only after confirmation. Invalid or future-version backups are rejected without changing current data.

The original complete handbook is linked from Learn as `Complete_Gym_Equipment_Handbook_Revised.pdf`. Crunch guide data is part of the app shell; Crunch source photos are referenced from the user's Google Drive and therefore require network access unless already browser-cached.

Exercise demonstration source photographs in `assets/demos/` derive from [free-exercise-db](https://github.com/yuhonas/free-exercise-db), released under the Unlicense. The generated OpenAI social artwork is `og.png`; the equipment photographs and handbook remain the user's private source material.
