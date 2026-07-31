import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { setTimeout as sleep } from 'node:timers/promises';
const require = createRequire(import.meta.url);
const EXERCISES = require('E:/gYM/data/exercises.js');
const DB = JSON.parse(readFileSync('./fedb.json', 'utf8'));
const RAW = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';
const OUT = './demos_raw'; if (!existsSync(OUT)) mkdirSync(OUT);

// explicit preferred DB names for the confident ones
const PREF = {
  pl_incline_press: 'Leverage Incline Chest Press', pl_chest_press: 'Leverage Chest Press', sel_chest_press: 'Leverage Chest Press',
  pec_deck: 'Butterfly', cable_crossover: 'Cable Crossover', smith_bench: 'Smith Machine Bench Press', db_bench: 'Dumbbell Bench Press',
  db_incline: 'Incline Dumbbell Press', pushup: 'Pushups',
  sel_shoulder_press: 'Leverage Shoulder Press', pl_shoulder_press: 'Leverage Shoulder Press', db_shoulder_press: 'Dumbbell Shoulder Press',
  smith_ohp: 'Smith Machine Overhead Press', db_lateral: 'Side Lateral Raise', cable_lateral: 'Cable Seated Lateral Raise',
  rear_delt_machine: 'Reverse Machine Flyes', cable_rear_delt: 'Cable Rear Delt Fly', face_pull: 'Face Pull',
  cable_pushdown: 'Triceps Pushdown', overhead_cable_ext: 'Cable Rope Overhead Triceps Extension', assisted_dip: 'Dip Machine',
  lat_pulldown: 'Wide-Grip Lat Pulldown', straight_arm_pulldown: 'Straight-Arm Pulldown', db_shrug: 'Dumbbell Shrug',
  sel_arm_curl: 'Machine Preacher Curls', cable_curl: 'Standing Biceps Cable Curl', hammer_curl: 'Hammer Curls',
  leg_press: 'Leg Press', hack_squat: 'Hack Squat', leg_extension: 'Leg Extensions', smith_squat: 'Smith Machine Squat',
  goblet_squat: 'Goblet Squat', seated_leg_curl: 'Seated Leg Curl', lying_leg_curl: 'Lying Leg Curls',
  db_rdl: 'Romanian Deadlift', smith_rdl: 'Romanian Deadlift', smith_hip_thrust: 'Barbell Hip Thrust',
  leg_press_calf: 'Calf Press On The Leg Press Machine',
  ez_curl: 'EZ-Bar Curl', db_curl: 'Dumbbell Bicep Curl', incline_db_curl: 'Alternate Incline Dumbbell Curl',
  walking_lunge: 'Barbell Walking Lunge', hip_abduction: 'Thigh Abductor', standing_calf: 'Standing Calf Raises',
  seated_calf: 'Seated Calf Raise', pl_low_row: 'Leverage Iso Row', pl_high_row: 'Leverage High Row',
  hanging_leg_raise: 'Hanging Leg Raise', lying_leg_raise: 'Flat Bench Lying Leg Raise', cable_crunch: 'Cable Crunch',
  ab_crunch_machine: 'Ab Crunch Machine', plank: 'Plank', russian_twist: 'Russian Twist',
  cable_row: 'Seated Cable Rows', sel_seated_row: 'Seated Cable Rows'
};

const byName = {}; DB.forEach(e => { byName[e.name.toLowerCase()] = e; });
const SYN = { chest: ['chest', 'bench', 'pec', 'butterfly'], bench: ['bench', 'chest'], shoulder: ['shoulder', 'overhead', 'military'], lateral: ['lateral', 'side'], rear: ['rear', 'reverse'], fly: ['fly', 'flyes', 'butterfly'], pushdown: ['pushdown'], triceps: ['triceps', 'tricep'], curl: ['curl', 'curls'], hammer: ['hammer'], preacher: ['preacher'], pulldown: ['pulldown'], lat: ['lat', 'lats'], row: ['row', 'rows'], squat: ['squat'], hack: ['hack'], extension: ['extension', 'extensions'], romanian: ['romanian', 'stiff'], deadlift: ['deadlift'], hip: ['hip'], thrust: ['thrust'], abduction: ['abductor', 'abduction'], kickback: ['kickback', 'glute'], calf: ['calf', 'calves'], crunch: ['crunch'], raise: ['raise', 'raises'], hanging: ['hanging'], plank: ['plank'], russian: ['russian', 'twist'], lunge: ['lunge', 'lunges'], dip: ['dip', 'dips'], skullcrusher: ['skullcrusher', 'lying', 'extension'], goblet: ['goblet'], incline: ['incline'], press: ['press'], seated: ['seated'], standing: ['standing'], split: ['split', 'bulgarian'], bulgarian: ['bulgarian', 'split'], glute: ['glute', 'kickback'] };
const equipMap = { plate: ['machine', 'leverage'], selectorized: ['machine', 'cable'], smith: ['machine', 'barbell'], dumbbell: ['dumbbell'], barbell: ['barbell', 'e-z curl bar'], cable: ['cable'], bodyweight: ['body only'] };
const muscMap = { chest: 'chest', front_delts: 'shoulders', side_delts: 'shoulders', rear_delts: 'shoulders', triceps: 'triceps', biceps: 'biceps', forearms: 'forearms', traps: 'traps', lats: 'lats', mid_back: 'middle back', lower_back: 'lower back', abs: 'abdominals', obliques: 'abdominals', glutes: 'glutes', quads: 'quadriceps', hamstrings: 'hamstrings', calves: 'calves' };
function toks(s) { return s.toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter(Boolean); }
function expand(ts) { const s = new Set(); ts.forEach(t => { s.add(t); (SYN[t] || []).forEach(x => s.add(x)); }); return s; }
function score(ex, e) {
  const my = expand(toks(ex.name)); const db = expand(toks(e.name));
  let ov = 0; my.forEach(t => { if (db.has(t)) ov++; });
  let s = ov * 2;
  const eqs = equipMap[ex.equipType] || []; if (e.equipment && eqs.includes(e.equipment.toLowerCase())) s += 3;
  const myMus = (ex.primary || []).map(m => muscMap[m]); if ((e.primaryMuscles || []).some(m => myMus.includes(m.toLowerCase()))) s += 2;
  return s;
}

const map = {}; const review = [];
for (const ex of EXERCISES) {
  if (ex.role === 'cardio') continue;
  let entry = null, method = 'fuzzy';
  if (PREF[ex.id] && byName[PREF[ex.id].toLowerCase()]) { entry = byName[PREF[ex.id].toLowerCase()]; method = 'pref'; }
  if (!entry) { let best = null, bs = -1; for (const e of DB) { if (!e.images || e.images.length < 2) continue; const s = score(ex, e); if (s > bs) { bs = s; best = e; } } entry = best; }
  if (!entry) { review.push([ex.id, ex.name, 'NO MATCH', '']); continue; }
  map[ex.id] = { db: entry.name, i0: RAW + '/' + entry.images[0], i1: RAW + '/' + entry.images[1] };
  review.push([ex.id, ex.name, entry.name, method]);
}
console.log('matched', Object.keys(map).length, 'exercises');
review.forEach(r => console.log(r[3].padEnd(6), r[0].padEnd(20), '=>', r[2]));
writeFileSync('./demos-map.json', JSON.stringify(map, null, 1));

// download frame 0 (for review) + frame 1
let ok = 0;
for (const id of Object.keys(map)) {
  for (const [k, url] of [['0', map[id].i0], ['1', map[id].i1]]) {
    try { const r = await fetch(url); if (r.ok) { writeFileSync(OUT + '/' + id + '_' + k + '.jpg', Buffer.from(await r.arrayBuffer())); if (k === '0') ok++; } else console.log('miss', id, r.status); } catch (e) { console.log('err', id, e.message); }
    await sleep(30);
  }
}
console.log('downloaded frames for', ok, 'exercises ->', OUT);
