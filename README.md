# muscles · Verified Gym Guide & Coach

`muscles` is a private, phone-first strength coach and equipment handbook for one specific gym. It combines 45 verified equipment guides covering all 51 source photographs with adaptive workouts, logging, substitutions, partner sessions, animated demonstrations, history, and progress tracking.

The signature Iron & Chalk dark theme is retained, with a system-aware light theme and manual override. The app works offline after installation; workout records never leave the device.

## Verified handbook

- Exactly 45 authoritative guides map all 51 photographs, including grouped alternate views and explicit filename traceability.
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
- Automatic warm-up and ramp-up sets, RIR-aware double progression, conservative reduction suggestions, busy-machine substitutions, requeueing, custom partner sessions, and optional advanced techniques
- Correct load semantics for plates per side, dumbbells per hand, selector stacks, bodyweight assistance, and machine settings

## Run and validate

Requires Node.js 20.19+.

```powershell
npm install
npm run dev
npm run validate
```

`npm run validate` runs the Node test suite, produces the Sites-compatible Vite/Worker build, and audits the output for all 51 equipment images, the service worker, the PDF, and the expected packaging files.

## Project structure

```text
index.html                 App shell, themes, accessibility and responsive styles
app.js                     SPA routes, training, guides, progress, Learn and settings
logic.js                   Pure session, progression, consistency and unit logic
howto.js                   Equipment-aware, reduced-motion-safe code demonstrations
data/handbook.js           Generated 45-guide/51-photo authoritative browser data
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

The complete handbook is linked from Learn as `Complete_Gym_Equipment_Handbook_Revised.pdf`. It is intentionally cached only when the owner opens it online so the installation shell stays small.

Exercise demonstration source photographs in `assets/demos/` derive from [free-exercise-db](https://github.com/yuhonas/free-exercise-db), released under the Unlicense. The generated OpenAI social artwork is `og.png`; the equipment photographs and handbook remain the user's private source material.
