# muscles — Personal Strength Coach & Tracker — Design

**Date:** 2026-07-30
**Status:** Approved in brainstorming by Marvin (okmarvin1@gmail.com)
**Supersedes:** the existing `Forge Personal - Standalone` Vue prototype (kept only as reference; not reused)

## Goal

A beautiful, private, installable web app that **coaches** a beginner through a real muscle-building program built around **his actual gym equipment** (USF Rec, 51 photographed machines), tracks every set in detail, and turns that data into motivating analysis — with evidence-based behavior psychology baked in throughout. Same spirit and quality bar as the owner's skincare-routine PWA.

## Confirmed decisions (from brainstorming)

- **Name:** `muscles` (lowercase wordmark).
- **Primary experience:** a **coached plan + free explore**. Opening the app on a training day shows today's prescribed session; the user can also browse by body part or by machine and swap/add exercises freely.
- **Program:** a **7-session weekly cycle** — 5 lifting days **Push / Pull / Legs / Upper / Lower** (goal = **hypertrophy / build muscle**) **+ 2 scheduled cardio sessions** woven in. Each muscle trained ~2×/week when all lifting days are hit.
- **Cardio:** **scheduled**, not just optional — 2 guided treadmill/elliptical sessions/week (duration + effort target), folded into the session cycle; supports conditioning and staying lean, not counted as muscle volume.
- **Abs / six-pack:** programmed **2–3×/week as core finishers** on lifting days and shown on the heat-map like any muscle. **No nutrition tracking in v1** — the app trains and tracks abs as muscle; the honest note that *seeing* a six-pack also needs low body fat (diet) lives in Coach, but food is not logged.
- **Coaching depth:** full — prescribes sets/reps, tells the user the **load** to use via automatic progression, rest times, form cues, common mistakes, deloads.
- **"Train alone" guided session + time budget:** the app's front-door action is **Train alone** — it starts a coached session that first asks **how much time you have**, then **auto-scales** the workout to fit (≈2 h → more accessory volume; ≈1 h → compounds + one accessory + abs; ≈30 min → compounds only). The coach states the focus (e.g. *Push → Chest first*), the user **picks which of their machines** to use for each slot, logs, and moves on. Focus can be overridden ("what are we doing? → Chest").
- **Machine-busy handling (it's a shared gym):** on any slot the user can tap **"busy / occupied"** → the coach offers an **alternative machine/exercise for the same target muscle** (from `altExIds`, ranked by similarity) or moves to the next slot, and **requeues the skipped slot** to return to later. So a taken machine never stalls the session.
- **Closed-loop, everything-counts analysis:** every logged set — planned **or** freeform, plus cardio and abs — feeds **one** weekly picture (sets per muscle, balance, PRs, strength, cardio minutes). At session start and week's end the app **uses that analysis to recommend what to train next** (biasing toward undertrained muscles), so the user always knows what to do. The layers interact end-to-end: time → session build → machine choice → logging → analysis → next recommendation.
- **Equipment:** all 51 USF machines identified from the owner's photos and turned into guided equipment cards. Ambiguous photos get confirmed with the owner during the build.
- **Units:** both **lb and kg**, user-toggleable, values auto-converted.
- **Anatomy figure:** polished **male** front/back figure; target muscles **glow** (ember). This is the app's signature and the reason for the name.
- **Look:** **"Iron & Chalk" — dark.** Graphite-iron base, chalk off-white, single molten-ember accent (effort/heat), steel-blue secondary (rest/recovery). Industrial display type + monospace for all data.
- **Tech/hosting:** static, no-build PWA (like the skincare app) — `index.html` + `logic.js` + data files + service worker, `localStorage`, self-hosted fonts, offline, deploy to Vercel. Fully local/private, no accounts.

## Core loop

Open app → tap **Train alone** → *"How long do you have?"* (time budget) → coach states today's focus from the cycle (e.g. *Push — Chest, Shoulders, Triceps*), which the user can accept or change → the engine **builds a session that fits the time** → for each slot: coach names the target muscle, user **picks one of their machines**, sees the guide + target, and **logs each set** (pre-filled, progression-aware) → abs finisher → session complete → progress, streak, PRs, and the body heat-map update, and the **weekly analysis + next recommendation** refresh. Any time: explore by body part or machine and swap/add.

## System layers (how the intelligence fits together)

The app is deliberately layered so each part feeds the next — this is what makes it feel like a coach rather than a form:

1. **Time layer** — session opens by asking available minutes; sets the budget everything else respects.
2. **Focus layer** — the 7-session cycle proposes today's target; the user may override the body part.
3. **Session-builder layer** — fits the right number of exercises/sets into the time budget (see Program engine).
4. **Equipment layer** — for each target muscle, offers *the user's* machines; opens the coaching guide for the chosen one.
5. **Logging layer** — pre-filled targets + double-progression; per-set reps/weight/RPE.
6. **Analysis layer** — aggregates **every** session (planned, freeform, cardio, abs) into weekly sets-per-muscle, balance heat-map, PRs, strength and cardio trends.
7. **Feedback layer** — the analysis biases the *next* session's suggestion (catch up undertrained muscles) and drives the end-of-week readout. Loop closes back to layer 1.

## Architecture

No build step. Static files served as-is (works on Vercel and from `file://` for local testing).

```
E:/gYM/                              # project root (new git repo)
  index.html                        # UI shell: inline CSS, DOM + render code, wires everything
  logic.js                          # PURE functions, no DOM. UMD-lite (global RoutineLogic-style + module.exports)
  data/
    exercises.js                    # exercise DB: id, name, primary/secondary muscles, equipmentIds, repScheme, cues[], mistakes[], difficulty
    equipment.js                    # 51 machines: id, name, photo, type, bodyParts[], exerciseIds[], guide{setup,execute,cues,mistakes,pickWeight,safety}
    program.js                      # split definition (Push/Pull/Legs/Upper/Lower) as ordered slots + progression params
  assets/equipment/                 # compressed machine photos (~120 KB webp each), generated once from GYM/ raw jpegs
  figure/figure.svg (inline)        # front + back anatomical figure, muscle regions as classed paths
  fonts/                            # self-hosted woff2: Oswald (display), IBM Plex Mono (data), Inter (body)
  sw.js                             # service worker: versioned precache of shell + data + fonts + assets
  manifest.json                     # real manifest (name "muscles", theme #121417, standalone)
  icon-192.png / icon-512.png       # app icons (maskable)
  test/logic.test.mjs               # node --test suite for logic.js
  tools/optimize-images.mjs         # one-time image pipeline (raw jpeg -> webp); not shipped
  docs/superpowers/specs/           # this spec
  README.md
GYM/                                # RAW source photos + old prototype — gitignored (too large to commit)
mockups/                            # brainstorming mockups — kept for reference
```

`logic.js` holds all rules (program cycle, progression math, streaks, volume aggregation, unit conversion, e1RM) and is unit-tested with `node --test`. `index.html` does all rendering/event wiring. Data lives in `data/*.js` as plain objects loaded via `<script src>`.

## Data model (localStorage)

- `muscles-config` — `{ units:'lb'|'kg', start:ISO, figure:'male', theme:'dark', trainingDays:[weekday ints], reminderTime:'HH:MM'|null }`
- `muscles-plan` — `{ split:'ppl-ul+2cardio', cycleIndex:0..6, sessionCount:int, calibrated:bool }` (7-session cycle; advances by **sessions completed, not calendar** — see Program engine)
- `muscles-log` — lifting day: `{ 'YYYY-MM-DD': { day:'push'|…, budgetMin:int|null, focus:muscle|null, exercises:[ { exId, machineId, sets:[ { reps, weight, rpe? } ] } ], felt:1..5|null, note } }`; cardio day: `{ 'YYYY-MM-DD': { day:'cardio', budgetMin, cardio:{ modality, kind, minutes, distance?, avgEffort? }, felt, note } }`
- `muscles-lifts` — per exercise: `{ [exId]: { lastWeight, lastSetsReps:[int], bestE1RM, missStreak:int } }` (fast lookup for prescribing next load)
- `muscles-streak` — `{ current, best, lastCompleteDate, graceUsedOn:ISO|null }`

All writes wrapped in try/catch with in-memory fallback (same resilience pattern as the skincare app). Corrupt JSON treated as absent. Dates use local `YYYY-MM-DD` throughout via one helper.

## Program engine (in `logic.js`)

**Weekly cycle.** Seven sessions in fixed order: **Push → Pull → Legs → Cardio → Upper → Lower → Cardio** (cardio spaced so it never sits back-to-back with a hard leg day). Each **lifting** day-type is an ordered list of **slots**. A slot = `{ role:'compound'|'accessory'|'core', targetMuscle, preferredExId, altExIds:[…], sets, repRange:[lo,hi], restSec }`. Alternatives let the user swap when a machine is busy without losing the slot's purpose. Every lifting day ends with 1–2 `core` (abs) slots so abs are hit 2–3×/week. A **cardio** session is `{ modality:'treadmill'|'elliptical', kind:'steady'|'interval', minutes, effortTarget }` — guided, timed, and logged, but not counted toward muscle volume.

**Rep/rest scheme (hypertrophy).** Compounds 3–4 × 6–10, rest 90–120 s. Accessories/isolation 3 × 10–15, rest 60–75 s. Defaults per slot; user can override.

**Advance-by-session (adaptive frequency).** The plan advances to the next session in the 7-session cycle **each time a session is completed**, not by the calendar. Training the full week cycles all seven (each muscle ~2×, plus 2 cardio); training fewer days still marches Push→Pull→Legs→Cardio→… in order — the user never "misses" a day, the cycle just takes a bit longer. This makes the plan self-healing against missed days. (Honest note in the app: 2×/week frequency, and its extra growth, only fully applies at ~5 lifting days/week.) The user can skip an upcoming cardio session with one tap if short on time, and it re-inserts later.

**Load prescription (double progression).** For each exercise:
- **Calibration (first time on that exercise):** no target weight. The app guides the user to find a weight where the last 1–2 reps are hard at the top of the range (~RPE 8): start light, add, confirm. Store as `lastWeight`.
- **Thereafter:** if last session hit **≥ top of range on all sets** → prescribe `lastWeight + increment` (smallest available for that equipment type: selectorized 5–10 lb, dumbbell to next pair, plate-loaded +small plate/side). If a set fell **below the bottom of range** two sessions running (`missStreak ≥ 2`) → prescribe a ~10% deload and reset. Otherwise keep the weight and aim for more reps. The prescribed number is pre-filled; the user can always override.

**Session builder (time-aware).** At session start the user gives a **time budget** (minutes). The builder estimates each slot's cost = `sets × (≈40 s work + restSec) + ≈60 s setup/transition`, then fills the session by priority: compounds first, then the abs finisher, then accessories, then optional extra volume — adding or trimming slots (and, at the margins, a set) until the estimate fits the budget. Rough shape: **~30 min → compounds only**, **~60 min → compounds + 1–2 accessories + abs**, **~90–120 min → full slate + extra accessory/isolation volume**. The current focus and any undertrained-muscle bias (from the analysis layer) steer *which* accessories get added. The builder is pure and unit-tested.

**Busy-machine swap & requeue.** Each slot carries `altExIds` (same-muscle alternatives, ranked by movement similarity). "Busy" pops the ranked alternatives that map to a machine the user *has*; choosing one substitutes in place (carrying the slot's sets/target). "Come back later" moves the slot to the end of the remaining queue and advances; when its machine is presumed free the app resurfaces it. Skipping never drops the slot's muscle from the session's plan.

**Weekly analysis & next-session recommendation.** All sessions in the trailing 7 days — coached, freeform, cardio, abs — aggregate into sets-per-muscle vs. a per-muscle weekly target (hypertrophy default ~10–16 sets). Muscles under target are "cold"; the app surfaces them as the **next recommendation** ("Back is light this week — let's prioritize it") and biases the session builder's accessory picks. This closes the loop so freestyle days and coached days both keep weekly balance on track.

**Derived metrics.** e1RM via Epley `w*(1+reps/30)`; per-set volume `reps*weight`; weekly volume per muscle = Σ over sets in the last 7 days, split primary(full)/secondary(half); PR = max weight or max e1RM per exercise.

## Screens (bottom tab bar)

1. **Today** — home + the coached session. Idle state leads with a big **Train alone** button and today's proposed focus + a "what's light this week" nudge from the analysis. Tapping it runs the start flow: **① how long do you have?** (quick chips: 30 / 45 / 60 / 90 / 120 min or custom) → **② focus** (accept the cycle's day or change it) → **③ the built session** appears: header (day, muscles, moves, est. time vs. your budget), the **body figure with today's target muscles glowing**, a sets-progress meter, then one machine-slot at a time — *pick your machine* → guide + target → **log each set** (pre-filled, progression-aware) → rest timer → next. Every lifting day ends with an abs finisher. Mid-session you can add/swap/drop a slot; the est. time updates live. On a **cardio day** the flow instead prescribes modality + duration (seeded by your time budget) + effort target with a big timer and one-tap log (or skip-to-later).
2. **Train** — the explorer. Pick a **body part** on the figure (or from a list) → its **machines/exercises**, each opening a full coaching guide. Or browse **Equipment** directly (all 51 machines as photo cards). Add any exercise to today or swap.
3. **Progress** — analysis. The **whole-body heat-map** (each muscle glows by how much it's been trained this week vs. target → undertrained = "cold"), weekly sets per muscle, volume/tonnage trend, per-lift strength (e1RM) trend, PR list, weekly **cardio minutes** (conditioning), sessions, streak, rank.
4. **Plan** — the 7-session weekly cycle laid out (5 lifting + 2 cardio), current position in the cycle, the week's schedule, and a plain-language explanation of the progression logic and why the split is built this way.
5. **Coach** — the "how" library: form cues, common mistakes, safety, warm-up guidance, and the habit/psychology tools (training days, reminders, identity, never-miss-twice).

## Equipment catalog

Each of the 51 machines becomes a card: cleaned/compressed photo, name, type (plate-loaded / selectorized / cable / free-weight / rack / cardio), **body part(s)**, the exercise(s) it performs, difficulty, and a guide (setup, execution, cues, common mistakes, how to pick starting weight, safety). Body-part categories, all first-class: **Chest · Back · Shoulders · Biceps · Triceps · Quads · Hamstrings · Glutes · Calves · Abs · Cardio.** (Abs are explicitly included.) Catalog is structured to allow adding other gyms later (Planet Fitness, hostel) without redesign — each equipment entry has a `gym` field (default `usf`).

## Anatomy figure

One inline SVG with **front and back** views. Every muscle region is a classed path: chest, front/side/rear delts, biceps, triceps, forearms, traps, lats, upper back, lower back, abs, obliques, glutes, quads, hamstrings, calves. Two render modes:
- **Exercise mode:** primary muscles bright ember, secondary dim ember.
- **Heat mode (Progress):** each region's fill interpolates cold→hot by weekly volume ÷ target volume.

The build will produce a cleaner, more anatomical figure than the stylized brainstorming mockup (proper front + back, believable muscle shapes), still matte and on-brand — not a medical diagram, not photoreal.

## Behavior psychology layer (mapped to features)

- **Identity-based habit** — onboarding frames it as "becoming someone who trains"; rank names reinforce it.
- **Implementation intentions** — user sets *which days / what time* they'll train; optional local reminder.
- **Streak + never-miss-twice + one grace day** — a missed day doesn't break the streak if the next planned day is done; one monthly grace protects a genuine miss (loss-aversion without fragility).
- **Goal-gradient** — rank progress bar always shows proximity to the next rank.
- **Competence (Self-Determination Theory)** — visible progression: "you added 15 lb on chest press this month," e1RM trend, PR celebrations (variable reward).
- **Autonomy (SDT)** — free explore + swap; nothing is forced.
- **Minimum viable session** — express mode so a rushed day still counts and preserves momentum.
- **Reflection / auto-regulation** — per-session RPE + "how you felt" + note; the coach nudges load down after bad-sleep/low-energy sessions.
- **Small-wins framing** — first set, first session, first week, first PR each get a moment.

## Visual design — "Iron & Chalk" (dark)

- **Palette:** `--iron:#121417` base, `--panel:#1A1E22`, `--line:#2C3237`, `--chalk:#F1EEE6` text, `--muted:#8B939B`, **`--ember:#F2551C`** accent + `--ember2:#FF8348` glow, **`--steel:#6C97BC`** secondary (rest/recovery), `--ok:#5FB07E`. A light "Chalk & Steel" theme ships too (theme toggle) but dark is default.
- **Type:** **Oswald** (industrial condensed) for day names / exercise names / section heads; **IBM Plex Mono** for all numbers, weights, labels, eyebrows (the "engineering logbook" feel — the owner is an engineer); **Inter** for body copy.
- **Signature:** the **heating muscle figure** + **plate-math** (working weight drawn as stacked plates).
- **Motion (restrained, `prefers-reduced-motion` respected):** set-logged pulse on the tick, rest-timer bar, muscle "heat" transition when a session completes, page-load reveal on Today. No gratuitous animation.
- **Quality floor:** responsive to 360 px, visible `:focus-visible`, safe-area insets, works fully offline.

## Tech, image pipeline, hosting

- **PWA:** manifest + service worker precache (versioned) of shell, `logic.js`, `data/*.js`, fonts, icons, and equipment webp; cache-first with network fallback. Installable, offline.
- **Image pipeline (`tools/optimize-images.mjs`, run once, not shipped):** convert the 51 raw jpegs (~3 MB each) to ~1080 px **webp at ~120 KB**, auto-cropped to a consistent frame, written to `assets/equipment/`. Keeps the app fast. Raw `GYM/` stays gitignored.
- **Deploy:** GitHub repo → Vercel static import, push-to-deploy (same pattern as the skincare app). No build command.

## Testing

- `test/logic.test.mjs` (`node --test`, timers unref'd): plan advance-by-session and 7-session cycle order (incl. cardio placement); double-progression (advance / hold / deload, calibration first-time); e1RM; volume aggregation per muscle (primary vs secondary weighting, cardio excluded from muscle volume); streak edge cases (in-progress today, grace day, never-miss-twice); lb↔kg conversion round-trips and display rounding.
- Manual mobile browser pass: session logging persists across reload, swap/express modes, heat-map correctness, install prompt on deployed HTTPS.

## Build phases

1. **Shell + look** — tabs, dark palette, type, the anatomy figure (front/back + glow), theme toggle.
2. **Equipment catalog** — identify all 51 machines (confirm ambiguous with owner), image pipeline, equipment + exercise data, Train/Equipment browsing.
3. **Coached program + logging** — program engine (7-session cycle incl. scheduled cardio + abs finishers), calibration, double-progression, Today session flow, per-set logging, rest timer, cardio session flow, express mode.
4. **Progress + psychology** — heat-map, charts, PRs, rank, streak/grace, reflection, reminders/identity.
5. **PWA polish + deploy** — service worker, manifest, icons, offline, Vercel.

## Out of scope (v1)

Accounts / cloud sync / multi-device; social or sharing; nutrition/diet or bodyweight tracking; progress photos; wearable/HR integration; exercise demo videos; the not-yet-accessible gyms (the catalog is built to add them later, but only USF equipment ships in v1).
