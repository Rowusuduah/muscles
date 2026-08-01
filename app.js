/* muscles — Verified Gym Guide & Coach (AppStateV2).
   Device-local coaching, verified handbook guides, adaptive timing, partner mode,
   accessible timers, history, backups, themes and offline-aware navigation. */
(function () {
  'use strict';
  var EX = L.byId(EXERCISES), MU = L.byId(MUSCLES), EQ = L.byId(EQUIPMENT), GUIDE = L.byId(HANDBOOK_GUIDES);
  var PROGRAM_REGISTRY = window.PROGRAM;

  /* ---------- storage ---------- */
  function todayISO() { var d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  function nowClock() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }

  /* ---------- state ---------- */
  var migration = APPSTATE.migrate(localStorage);
  var state = migration.state;
  var cfg = state.config;
  var plan = state.programRotation;
  var lifts = state.liftHistory;
  var log = state.workoutLogs;
  var eqNames = state.customLabels;
  var machineSettings = state.machineSettings;
  var ACTIVE_PROGRAM = PROGRAM_REGISTRY.get(state.selectedProgram);
  function persist() {
    state.config = cfg; state.selectedProgram = cfg.programId; state.programRotation = plan;
    state.liftHistory = lifts; state.workoutLogs = log; state.customLabels = eqNames;
    state.machineSettings = machineSettings;
    state = APPSTATE.save(localStorage, state);
  }
  function set(k, v) {
    if (k === 'muscles-config') cfg = state.config = v;
    else if (k === 'muscles-plan') plan = state.programRotation = v;
    else if (k === 'muscles-lifts') lifts = state.liftHistory = v;
    else if (k === 'muscles-log') log = state.workoutLogs = v;
    else if (k === 'muscles-eqnames') eqNames = state.customLabels = v;
    persist();
  }
  if (!cfg.start) { cfg.start = todayISO(); persist(); }
  var SESSION = null, workInt = null, restInt = null;

  /* ---------- helpers ---------- */
  var FRONT_M = ['traps', 'front_delts', 'side_delts', 'chest', 'biceps', 'forearms', 'abs', 'obliques', 'quads', 'calves'];
  var BACK_M = ['traps', 'rear_delts', 'triceps', 'forearms', 'mid_back', 'lats', 'lower_back', 'glutes', 'hamstrings', 'calves'];
  function pickView(mark) { var f = 0, b = 0; Object.keys(mark).forEach(function (m) { if (FRONT_M.indexOf(m) >= 0) f++; if (BACK_M.indexOf(m) >= 0) b++; }); return b > f ? 'back' : 'front'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function wLbl(lb) { return lb == null ? '—' : L.toDisplay(lb, cfg.units) + ' ' + cfg.units; }
  function fmtDur(sec) { sec = Math.round(sec); return sec < 60 ? sec + 's' : Math.floor(sec / 60) + ':' + ('0' + (sec % 60)).slice(-2); }
  function toast(msg) { var t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('show'); }, 2600); }
  function machinesForEx(exId) { return EQUIPMENT.filter(function (e) { return (e.exerciseIds || []).indexOf(exId) >= 0; }); }
  function nameOf(eq) { return eq ? (eqNames[eq.id] || eq.name) : ''; }
  function markFromMuscles(muscles, secondary) { var m = {}; (muscles || []).forEach(function (x) { m[x] = 'primary'; }); (secondary || []).forEach(function (x) { if (m[x] !== 'primary') m[x] = 'secondary'; }); return m; }
  function focusMark(focusMuscles, slots) {
    var mark = {}; (focusMuscles || []).forEach(function (m) { mark[m] = 'primary'; });
    (slots || []).forEach(function (s) { var ex = s.ex || EX[s.ex]; if (ex) { (ex.primary || []).forEach(function (m) { mark[m] = 'primary'; }); (ex.secondary || []).forEach(function (m) { if (mark[m] !== 'primary') mark[m] = 'secondary'; }); } });
    return mark;
  }
  function shot(machine, cls) { return machine && machine.photo ? '<img class="shot ' + (cls || '') + '" src="' + machine.photo + '" alt="' + esc(machine.name) + '">' : '<div class="shot ph ' + (cls || '') + '" aria-label="No equipment photo">NO<br>PHOTO</div>'; }
  function applyTheme() {
    var mode = cfg.theme || 'system';
    var resolved = mode === 'system' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : mode;
    document.documentElement.setAttribute('data-theme', resolved);
    document.querySelector('meta[name="theme-color"]').setAttribute('content', resolved === 'light' ? '#F2F0EA' : '#121417');
  }

  /* ---------- header ---------- */
  function updateHeader() {
    var d = new Date();
    document.getElementById('date').textContent = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()] + ' · ' + ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][d.getMonth()] + ' ' + d.getDate();
    var consistency = L.weeklyConsistency(log, todayISO(), cfg.weeklyFrequency), r = consistency.level;
    document.getElementById('ranklab').textContent = 'Consistency · ' + r.name + (r.next ? ' → ' + r.next : '');
    document.getElementById('rankbar').style.width = Math.round(r.progress * 100) + '%';
    document.getElementById('streak').textContent = consistency.completed + '/' + consistency.target;
    document.getElementById('streak').parentElement.setAttribute('aria-label', consistency.completed + ' of ' + consistency.target + ' planned sessions completed this week');
  }

  /* ---------- onboarding ---------- */
  function renderOnboarding() {
    var el = document.getElementById('s-today');
    el.innerHTML = '<div class="onboard fade">' +
      '<div class="eyebrow">Welcome</div><h1>Let\'s build muscle.</h1>' +
      '<p class="sub">Your private coach and verified guide for the 51 photographs from this gym. Your workout data never leaves this device.</p>' +
      '<label class="fieldlabel" for="obname">Name <span>optional</span></label><input class="search" id="obname" autocomplete="name" placeholder="What should the coach call you?">' +
      '<fieldset class="choicegroup"><legend>Training experience</legend><button type="button" data-action="ob-experience" data-v="beginner" class="on">Beginner</button><button type="button" data-action="ob-experience" data-v="intermediate">Intermediate</button></fieldset>' +
      '<fieldset class="choicegroup"><legend>Realistic sessions per week</legend>' + [2, 3, 4].map(function (n) { return '<button type="button" data-action="ob-frequency" data-v="' + n + '" class="' + (n === 3 ? 'on' : '') + '">' + n + '</button>'; }).join('') + '</fieldset>' +
      '<div class="panel recommend" id="obrecommend"><div class="eyebrow">Recommended program</div><b>' + esc(PROGRAM_REGISTRY.get(PROGRAM_REGISTRY.recommend('beginner', 3)).name) + '</b></div>' +
      '<div class="obpoint"><span class="n">1</span><p>The coach fits only your selected program into <b>20–120 minutes</b>.</p></div>' +
      '<div class="obpoint"><span class="n">2</span><p>Busy-machine swaps, partner sessions, timers and demonstrations stay ready.</p></div>' +
      '<div class="obpoint"><span class="n">3</span><p>Every machine identity and source filename is traceable to the completed handbook.</p></div>' +
      '<div class="unitpick"><button data-action="ob-unit" data-u="lb" class="' + (cfg.units === 'lb' ? 'on' : '') + '">Pounds (lb)</button>' +
      '<button data-action="ob-unit" data-u="kg" class="' + (cfg.units === 'kg' ? 'on' : '') + '">Kilograms (kg)</button></div>' +
      '<button class="cta" data-action="ob-done">Start training →</button></div>';
  }

  /* ---------- TODAY / home ---------- */
  function proposedAlone() {
    var dayId = L.dayIdAt(ACTIVE_PROGRAM, plan.cycleIndex || 0);
    return { dayId: dayId, reason: 'Next in ' + ACTIVE_PROGRAM.name + '. Resume the rotation where you left off.' };
  }
  function renderToday() {
    if (!cfg.onboarded) return renderOnboarding();
    if (SESSION) return renderSession();
    var prop = proposedAlone();
    var day = ACTIVE_PROGRAM.days[prop.dayId];
    var isCardio = false;
    var mark = focusMark(day.focusMuscles, day.slots);
    var recs = [];
    var el = document.getElementById('s-today');

    var hero = isCardio
      ? '<div class="eyebrow">Coach suggests</div><h1 class="day">Cardio</h1><p class="sub">' + esc(prop.reason) + '</p>'
      : '<div class="eyebrow">' + (cfg.name ? esc(cfg.name) + ' · ' : '') + 'Coach suggests</div><h1 class="day">' + esc(day.name) + '</h1>' +
        '<p class="sub">' + esc(prop.reason) + '</p>' +
        '<div class="panel figpanel fade"><div class="figwrap">' + FIGURE.figureSVG(pickView(mark), { mark: mark }) + '</div>' +
        '<div class="tinfo"><div class="lab">You\'ll heat</div><div class="chips">' +
        Object.keys(mark).filter(function (m) { return mark[m] === 'primary'; }).slice(0, 5).map(function (m) { return '<span class="chip">' + esc(MU[m] ? MU[m].name : m) + '</span>'; }).join('') +
        '</div></div></div>';

    el.innerHTML = hero +
      '<button class="modebtn primary" data-action="start-alone"><span class="ic"><svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="3.2"/><path d="M6 21c0-4 2.6-7 6-7s6 3 6 7"/></svg></span>' +
      '<span><span class="t">Start coached workout</span><span class="d">' + esc(ACTIVE_PROGRAM.name) + ' · ' + esc(day.name) + '</span></span></button>' +
      '<button class="modebtn" data-action="start-partner"><span class="ic"><svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c0-3.5 2.7-6 6-6s6 2.5 6 6M14.5 20c.2-2.6 1.8-4.4 4-4.4s3.3 1.4 3.5 4.4"/></svg></span>' +
      '<span><span class="t">Partner / custom session</span><span class="d">You lead · search the verified equipment</span></span></button>' +
      (recs.length && Object.keys(log).length ? '<div class="panel fade" style="margin-top:14px"><div class="tinfo"><div class="lab">Light this week — I\'ll steer toward these</div><div class="chips">' + recs.slice(0, 4).map(function (r) { return '<span class="chip cool">' + esc(r.name) + '</span>'; }).join('') + '</div></div></div>' : '');
  }

  /* ---------- ALONE flow ---------- */
  function startAlone() { SESSION = { mode: 'alone', phase: 'time', dayId: proposedAlone().dayId, budgetMin: null }; renderSession(); }
  function renderTime() {
    var el = document.getElementById('s-today');
    el.innerHTML = '<div class="eyebrow">Before we start</div><h1 class="day">How long?</h1>' +
      '<p class="sub">I\'ll fit the session to your time and keep the program intact. <b>Your time is a ceiling, not a quota for unsafe volume.</b></p>' +
      '<div class="timegrid">' + [30, 45, 60, 90, 120].map(function (m) { return '<button class="timechip" data-action="pick-time" data-min="' + m + '"><div class="big">' + m + '</div><div class="u">min</div></button>'; }).join('') +
      '<button class="timechip" data-action="pick-time" data-min="20"><div class="big">20</div><div class="u">quick</div></button></div>' +
      '<button class="cta sub" data-action="cancel-session">Cancel</button>';
  }
  function renderFocus() {
    var el = document.getElementById('s-today'); var proposed = SESSION.dayId;
    el.innerHTML = '<div class="eyebrow">Stay inside your program</div><h1 class="day">Choose day</h1>' +
      '<p class="sub">I suggest <b>' + esc(ACTIVE_PROGRAM.days[proposed].name) + '</b>. You may choose another day from ' + esc(ACTIVE_PROGRAM.name) + '.</p>' +
      ACTIVE_PROGRAM.cycle.map(function (d) {
        var day = ACTIVE_PROGRAM.days[d];
        var mus = day.focusMuscles.map(function (m) { return MU[m] ? MU[m].name : m; }).join(' · ');
        return '<button class="weekrow ' + (d === proposed ? 'now ' : '') + '" data-action="pick-focus" data-day="' + d + '"><span class="nm">' + esc(day.name) + '</span><span class="mus">' + esc(mus) + '</span></button>';
      }).join('') + '<button class="weekrow cardio" data-action="start-cardio"><span class="nm">Optional cardio</span><span class="mus">Treadmill · recumbent bike · upper-body ergometer</span></button>' +
      '<div style="height:8px"></div><button class="cta sub" data-action="cancel-session">Cancel</button>';
  }
  function buildAndStart(dayId) {
    SESSION.dayId = dayId;
    if (dayId === 'cardio') { SESSION.phase = 'cardio'; SESSION.cardio = L.buildCardio(ACTIVE_PROGRAM, EX, SESSION.budgetMin); return renderSession(); }
    SESSION.built = prepBuilt(L.buildSession(ACTIVE_PROGRAM, EX, dayId, SESSION.budgetMin, {}));
    SESSION.idx = 0; SESSION.phase = 'active'; renderSession();
  }

  /* ---------- PARTNER flow ---------- */
  function startPartner() { SESSION = { mode: 'partner', phase: 'part' }; renderSession(); }
  function renderPart() {
    var el = document.getElementById('s-today');
    el.innerHTML = '<div class="topbar"><div class="eyebrow">Training with a partner</div><button class="mini" data-action="cancel-session">Cancel</button></div>' +
      '<h1 class="day">What today?</h1><p class="sub">Pick a body part — I\'ll suggest exercises and you can <b>search & add</b> any machine.</p>' +
      '<div class="partgrid">' + ACTIVE_PROGRAM.bodyParts.map(function (p) {
        return '<button class="partbtn" data-action="pick-part" data-part="' + p.id + '"><span class="t">' + esc(p.name) + '</span><span class="d">' + p.muscles.map(function (m) { return MU[m] ? MU[m].name : m; }).slice(0, 3).join(' · ') + '</span></button>';
      }).join('') + '</div>';
  }
  function renderCompose() {
    var el = document.getElementById('s-today');
    var part = ACTIVE_PROGRAM.bodyParts.filter(function (p) { return p.id === SESSION.part; })[0];
    var q = (SESSION.query || '').toLowerCase();
    var pool = L.exercisesForBodyPart(part, EXERCISES);
    if (q) pool = pool.filter(function (e) { return e.name.toLowerCase().indexOf(q) >= 0 || (machinesForEx(e.id)[0] && machinesForEx(e.id)[0].name.toLowerCase().indexOf(q) >= 0); });
    SESSION.picked = SESSION.picked || ACTIVE_PROGRAM.classic[SESSION.part].slice(0, 5);
    var picked = SESSION.picked;
    el.innerHTML = '<div class="topbar"><div class="eyebrow">' + esc(part.name) + ' · with a partner</div><button class="mini" data-action="partner-back">‹ Parts</button></div>' +
      '<h1 class="day">Build it</h1><p class="sub">Tap to add or remove. <b>' + picked.length + ' picked.</b></p>' +
      '<label class="fieldlabel" for="exsearch">Search verified exercises</label><input class="search" id="exsearch" placeholder="Machine or exercise" value="' + esc(SESSION.query || '') + '" oninput="window.__search(this.value)">' +
      pool.map(function (e) {
        var m = machinesForEx(e.id)[0]; var on = picked.indexOf(e.id) >= 0;
        var thumb = m && m.photo ? '<img class="exthumb" src="' + m.photo + '" alt="' + esc(m.name) + '">' : '<span class="exthumb ph" aria-hidden="true">?</span>';
        return '<button class="exrow ' + (on ? 'on' : '') + '" data-action="toggle-ex" data-ex="' + e.id + '" aria-pressed="' + on + '">' + thumb + '<span class="nm"><b>' + esc(e.name) + '</b><span>' + esc(e.primary.map(function (x) { return MU[x] ? MU[x].name : x; }).join(', ')) + (m ? ' · ' + esc(m.name) : '') + '</span></span><span class="add" aria-hidden="true">' + (on ? '✓' : '+') + '</span></button>';
      }).join('') +
      '<div style="height:12px"></div><button class="cta" data-action="partner-time">Next → set the time</button>';
  }
  window.__search = function (v) { SESSION.query = v; var a = document.activeElement; renderCompose(); var s = document.getElementById('exsearch'); if (s) { s.focus(); s.setSelectionRange(v.length, v.length); } };
  function partnerTime() {
    var el = document.getElementById('s-today');
    el.innerHTML = '<div class="eyebrow">Almost there</div><h1 class="day">How long?</h1><p class="sub">Optional — I\'ll trim or pad your ' + SESSION.picked.length + ' exercises to fit.</p>' +
      '<div class="timegrid">' + [30, 45, 60, 90].map(function (m) { return '<button class="timechip" data-action="partner-go" data-min="' + m + '"><div class="big">' + m + '</div><div class="u">min</div></button>'; }).join('') +
      '<button class="timechip" data-action="partner-go" data-min="0"><div class="big">—</div><div class="u">no limit</div></button></div>' +
      '<button class="cta sub" data-action="partner-back">Back</button>';
  }
  function partnerGo(min) {
    var part = ACTIVE_PROGRAM.bodyParts.filter(function (p) { return p.id === SESSION.part; })[0];
    SESSION.built = prepBuilt(L.buildCustom(SESSION.picked, EX, min || null, part.name));
    SESSION.budgetMin = min || null; SESSION.idx = 0; SESSION.phase = 'active'; renderSession();
  }

  /* set object + fresh log */
  function newSet(weight, kind) { return { kind: kind || 'work', reps: null, weight: weight, done: false, running: false, startMs: 0, durSec: 0, endClock: '', clusters: [], b: null, rp: false }; }
  function freshLog(n, weight) { var a = []; for (var i = 0; i < n; i++) a.push(newSet(weight)); return a; }

  /* prepare a built session's per-slot working state */
  function prepBuilt(built) {
    built.slots.forEach(function (s, index) {
      var pre = L.prescribe(s.ex, lifts[s.exId]);
      s.machineId = (machinesForEx(s.exId)[0] || {}).id || null;
      s.pre = pre; s.showHow = false; s.superEx = null; s.techniqueNote = '';
      s.log = freshLog(s.sets, pre.weight);
      if (built.mode === 'coached' && index === 0) {
        L.rampSets(ACTIVE_PROGRAM, pre.weight).slice().reverse().forEach(function (ramp) {
          var warm = newSet(ramp.weight, 'warmup'); warm.targetReps = ramp.targetReps; warm.rampLabel = ramp.label; s.log.unshift(warm);
        });
      }
    });
    return built;
  }

  /* ---------- ACTIVE session (timed logging + how-to) ---------- */
  function sessionProgress() { var done = 0, total = 0; SESSION.built.slots.forEach(function (s) { s.log.forEach(function (x) { if (x.kind === 'warmup') return; total++; if (x.done) done++; }); }); return { done: done, total: total }; }

  function renderActive() {
    clearInterval(workInt); clearInterval(restInt);
    var el = document.getElementById('s-today'), b = SESSION.built, s = b.slots[SESSION.idx];
    var mark = focusMark(b.focusMuscles, b.slots); var pr = sessionProgress();
    var pips = ''; for (var i = 0; i < Math.min(pr.total, 26); i++) pips += '<span class="pip' + (i < pr.done ? ' on' : '') + '"></span>';
    var machines = machinesForEx(s.exId); var machSel = EQ[s.machineId] || machines[0];
    var ex = s.ex;

    var picker = machines.length ? '<div class="picker"><div class="lab">Pick your machine</div><div class="machopts">' +
      machines.map(function (m) { return '<button class="macho ' + (m.id === s.machineId ? 'sel' : '') + '" data-action="pick-machine" data-machine="' + m.id + '" aria-pressed="' + (m.id === s.machineId) + '"><img src="' + m.photo + '" alt="' + esc(m.name) + '"><span class="nm">' + esc(m.name) + '</span></button>'; }).join('') + '</div>' +
      (machSel ? '<label class="fieldlabel compact" for="machinesetting">Machine setting <span>seat, pin or pad position</span></label><input class="search compact" id="machinesetting" data-machine-setting="' + esc(machSel.id) + '" value="' + esc(machineSettings[machSel.id] || '') + '" placeholder="Example: seat 4">' : '') +
      multiUse(machSel, s) + '</div>' : '';

    var tgt = s.pre.mode === 'calibrate' ? 'find your weight' : wLbl(s.pre.weight);
    var target = '<div class="target"><span class="t">' + s.sets + ' × ' + ex.repRange[0] + '–' + ex.repRange[1] + ' · ' + tgt + '</span><span class="note">' + esc(s.pre.note) + '</span></div>' +
      (s.pre.mode === 'reduce_suggested' ? '<div class="coach-suggest"><span>Repeated misses, not one bad day. Reduction is optional.</span><button class="mini" data-action="accept-reduction">Use ' + wLbl(s.pre.suggestedWeight) + '</button></div>' : '');

    var rows = s.log.map(function (x, i) { return setRow(x, i, s, ex); }).join('');
    var how = s.showHow ? howPanel(ex) : '';
    var last = (SESSION.idx + 1) >= b.slots.length;

    el.innerHTML =
      '<div class="topbar"><div class="eyebrow">' + esc(b.name) + (b.estMin ? ' · ' + b.estMin + ' min' : '') + '</div><button class="mini" data-action="cancel-session">End</button></div>' +
      '<div class="meter"><div class="pips">' + pips + '</div><span class="n">' + pr.done + ' / ' + pr.total + ' sets</span></div>' +
      '<div class="card active slot fade"><div class="chead">' + shot(machSel) +
        '<div><div class="cnum">' + String(SESSION.idx + 1).padStart(2, '0') + ' / ' + b.slots.length + ' · ' + s.role.toUpperCase() + '</div>' +
        '<div class="cname">' + esc(ex.name) + '</div><div class="ctag">Target: ' + esc(MU[s.target] ? MU[s.target].name : s.target) + '</div></div>' +
        '<button class="howbtn" data-action="toggle-how" style="margin-left:auto;align-self:flex-start">' + (s.showHow ? 'Hide' : 'How ▸') + '</button></div>' +
        picker + target + how +
        '<div class="note-field"><label class="fieldlabel" for="technote">Pain-free technique note <span>optional</span></label><input id="technote" class="search compact" data-technique-note value="' + esc(s.techniqueNote || '') + '" placeholder="Settings, comfort, or a cue that helped"></div>' +
        '<div class="sets">' + rows + '</div>' +
        '<div class="cfoot"><span class="cue"><b>Cue:</b> ' + esc(ex.cues[0]) + '</span>' +
        '<button class="mini" data-action="add-warmup">+ Warm-up</button>' +
        (cfg.advanced ? '<button class="mini ' + (s.superEx ? 'busy' : '') + '" data-action="superset">' + (s.superEx ? 'Superset ✓' : '+ Superset') + '</button>' : '') +
        '<button class="mini busy" data-action="busy">Busy?</button>' +
        '<button class="next-btn" data-action="next-slot">' + (last ? 'Finish ▸' : 'Next ▸') + '</button></div></div>';
    if (SESSION._rest) startRestUI(SESSION._rest);
  }

  function multiUse(machine, slot) {
    if (!machine) return '';
    var others = (machine.exerciseIds || []).filter(function (id) { return id !== slot.exId && EX[id]; });
    if (!others.length) return '';
    return '<div class="lab" style="margin:8px 0 6px">This machine also does — tap to switch</div><div class="chips">' +
      others.map(function (id) { return '<button type="button" class="chip cool tap" data-action="switch-ex" data-ex="' + id + '">' + esc(EX[id].name) + '</button>'; }).join('') + '</div>';
  }

  function setNumber(s, i) { var n = 0; for (var j = 0; j <= i; j++) if (s.log[j].kind !== 'warmup') n++; return n; }
  function slabFor(x, s, i) { return x.kind === 'warmup' ? 'WARM' : 'SET ' + setNumber(s, i); }
  function shortName(ex) { return ex ? ex.name.split(' ')[0] : ''; }
  function loadLabel(ex) {
    return { perSide: 'per side', perHand: 'per hand', stack: 'stack', assistance: 'assistance', total: 'total load', bodyweight: 'added load' }[ex.loadMode] || 'load';
  }
  function subInputs(x, i, ex, superEx) {
    var wD = x.weight != null ? L.toDisplay(x.weight, cfg.units) : '';
    var A = '<div class="subin">' + (superEx ? '<span class="subnm">' + esc(shortName(ex)) + '</span>' : '') +
      '<input type="number" inputmode="numeric" aria-label="Repetitions" placeholder="reps" value="' + (x.reps != null ? x.reps : '') + '" data-set="' + i + '" data-f="reps">' +
      '<input type="number" inputmode="decimal" aria-label="' + esc(loadLabel(ex)) + ' in ' + cfg.units + '" placeholder="load" value="' + wD + '" data-set="' + i + '" data-f="weight"><span class="x">' + cfg.units + ' ' + esc(loadLabel(ex)) + '</span>' +
      (x.kind === 'warmup' ? '' : '<input class="rir" type="number" min="0" max="5" inputmode="numeric" aria-label="Repetitions in reserve" placeholder="RIR" value="' + (x.rir != null ? x.rir : '') + '" data-set="' + i + '" data-f="rir">') + '</div>';
    if (!superEx) return A;
    var b = x.b || {}; var bw = b.weight != null ? L.toDisplay(b.weight, cfg.units) : '';
    var B = '<div class="subin"><span class="subnm">' + esc(shortName(EX[superEx])) + '</span>' +
      '<input type="number" inputmode="numeric" aria-label="Superset repetitions" placeholder="reps" value="' + (b.reps != null ? b.reps : '') + '" data-set="' + i + '" data-f="breps">' +
      '<input type="number" inputmode="decimal" aria-label="Superset load in ' + cfg.units + '" placeholder="load" value="' + bw + '" data-set="' + i + '" data-f="bweight"><span class="x">' + cfg.units + '</span></div>';
    return A + B;
  }
  function setRow(x, i, s, ex) {
    var no = slabFor(x, s, i);
    if (x.done) {
      var reps = x.clusters && x.clusters.length > 1 ? x.clusters.join('+') : x.reps;
      var main = '<span class="slab">' + no + '</span><span class="setsummary">' + reps + ' <span class="u">reps</span> · ' + L.toDisplay(x.weight, cfg.units) + ' <span class="u">' + cfg.units + '</span>';
      if (s.superEx && x.b && x.b.reps) main += ' <span class="u">+</span> ' + esc(shortName(EX[s.superEx])) + ' ' + x.b.reps + '×' + L.toDisplay(x.b.weight || 0, cfg.units);
      if (x.durSec) main += '<span class="dur">⏱ ' + fmtDur(x.durSec) + '</span>';
      main += '</span>';
      var rp = cfg.advanced && x.rp
        ? '<span class="rpadd"><input type="number" inputmode="numeric" placeholder="+reps" data-rp="' + i + '"><button class="mini" data-action="rp-add" data-set="' + i + '">Add</button></span>'
        : (cfg.advanced && x.kind !== 'warmup' ? '<button class="rpbtn" data-action="rp-open" data-set="' + i + '">+ rest-pause</button>' : '');
      return '<div class="setrow done2">' + main + rp + '<span class="tick done" style="margin-left:auto"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></span></div>';
    }
    if (x.running) {
      return '<div class="setrow run ' + (s.superEx ? 'col' : '') + '"><span class="slab">' + no + '</span>' + subInputs(x, i, ex, s.superEx) +
        '<button class="endbtn" data-action="end-set" data-set="' + i + '">End <span class="tmr" id="tmr-' + i + '">0s</span></button></div>';
    }
    var firstIdle = s.log.findIndex(function (y) { return !y.done && !y.running; });
    if (i === firstIdle) {
      return '<div class="setrow"><span class="slab">' + no + '</span><button class="startbtn" data-action="start-set" data-set="' + i + '">Start ' + (x.kind === 'warmup' ? 'ramp-up' + (x.targetReps ? ' · ' + x.targetReps + ' reps' : '') : 'set ' + setNumber(s, i)) + '</button></div>';
    }
    return '<div class="setrow"><span class="slab">' + no + '</span><span class="setsummary u" style="color:var(--muted2)">target ' + ex.repRange[0] + '–' + ex.repRange[1] + ' · ' + wLbl(x.weight) + '</span></div>';
  }

  function howPanel(ex) {
    var steps = HOWTO.steps(ex);
    var hasDemo = (typeof DEMOS !== 'undefined') && DEMOS[ex.id];
    var media = hasDemo
      ? '<div class="demoblock"><div class="demo" aria-label="Two-frame demonstration of ' + esc(ex.name) + '"><img class="f1" src="assets/demos/' + ex.id + '_1.webp" alt="' + esc(ex.name) + ' finish position"><img class="f0" src="assets/demos/' + ex.id + '_0.webp" alt="' + esc(ex.name) + ' start position"><span class="tag">two-frame demo</span></div><div class="democontrols" aria-label="Demonstration controls"><button data-action="demo-frame" data-frame="start">Start</button><button data-action="demo-toggle" aria-pressed="false">Pause</button><button data-action="demo-frame" data-frame="end">End</button></div></div>'
      : '<div class="howfig" role="img" aria-label="Code-drawn movement path for ' + esc(ex.name) + '"><div class="howv">' + HOWTO.howtoSVG(ex, 'right') + '</div></div>';
    return '<div class="howwrap">' + media +
      '<div style="flex:1"><ol class="steps">' + steps.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>' +
      '<div class="howmiss"><b>Don\'t:</b> ' + esc(HOWTO.wrongLabel(ex)) + '.</div></div></div>';
  }
  window.__howtog = function (btn, i) {
    var w = btn.closest('.howwrap'); if (!w) return;
    w.querySelectorAll('.howv').forEach(function (f, j) { f.classList.toggle('hidden', j !== i); });
    w.querySelectorAll('.howtog button').forEach(function (b, j) { b.classList.toggle('on', j === i); b.classList.toggle('bad', i === 1 && j === 1); });
  };

  /* set timers */
  function startSet(i) {
    var s = SESSION.built.slots[SESSION.idx]; SESSION._rest = null;
    s.log[i].running = true; s.log[i].startMs = Date.now();
    renderActive();
    workInt = setInterval(function () { var el = document.getElementById('tmr-' + i); if (el) el.textContent = fmtDur((Date.now() - s.log[i].startMs) / 1000); }, 500);
  }
  function endSet(i) {
    clearInterval(workInt);
    var s = SESSION.built.slots[SESSION.idx];
    var rIn = document.querySelector('#s-today input[data-set="' + i + '"][data-f="reps"]');
    var wIn = document.querySelector('#s-today input[data-set="' + i + '"][data-f="weight"]');
    var rirIn = document.querySelector('#s-today input[data-set="' + i + '"][data-f="rir"]');
    var reps = rIn && rIn.value !== '' ? parseInt(rIn.value, 10) : null;
    if (!reps) { toast('How many reps did you get?'); if (rIn) rIn.focus(); s.log[i].running = true; return; }
    s.log[i].reps = reps; s.log[i].clusters = [reps];
    if (wIn && wIn.value !== '') s.log[i].weight = L.fromInput(wIn.value, cfg.units);
    if (rirIn && rirIn.value !== '') s.log[i].rir = Math.max(0, Math.min(5, parseInt(rirIn.value, 10)));
    if (s.superEx) {
      var brIn = document.querySelector('#s-today input[data-set="' + i + '"][data-f="breps"]');
      var bwIn = document.querySelector('#s-today input[data-set="' + i + '"][data-f="bweight"]');
      s.log[i].b = { reps: brIn && brIn.value !== '' ? parseInt(brIn.value, 10) : null, weight: bwIn && bwIn.value !== '' ? L.fromInput(bwIn.value, cfg.units) : null };
    }
    s.log[i].durSec = (Date.now() - s.log[i].startMs) / 1000;
    s.log[i].endClock = nowClock();
    s.log[i].done = true; s.log[i].running = false;
    for (var j = i + 1; j < s.log.length; j++) if (!s.log[j].done) { s.log[j].weight = s.log[i].weight; if (s.superEx && s.log[i].b) s.log[j].b = { reps: null, weight: s.log[i].b.weight }; }
    var allDone = s.log.every(function (y) { return y.done; });
    SESSION._rest = allDone ? null : { sec: s.ex.restSec, left: s.ex.restSec };
    renderActive();
    if (!allDone) toast('Logged ✓ Rest ~' + s.ex.restSec + 's, then start the next set');
  }
  function startRestUI(rest) {
    clearInterval(restInt); rest.left = rest.sec;
    restInt = setInterval(function () { rest.left--; if (rest.left <= 0) { clearInterval(restInt); SESSION._rest = null; } }, 1000);
  }

  /* busy / swap */
  function busy() {
    var s = SESSION.built.slots[SESSION.idx];
    var alts = L.busyAlternatives({ alt: s.alt }, EX, EQUIPMENT);
    if (!alts.length) { toast('No alternative right now — try again in a minute'); return; }
    document.getElementById('s-today').insertAdjacentHTML('afterbegin',
      '<div class="panel fade" id="altpanel"><div class="tinfo"><div class="lab">Machine busy — swap to</div></div>' +
      alts.map(function (a) { var m = machinesForEx(a.id)[0]; return '<button type="button" class="weekrow" data-action="swap" data-ex="' + a.id + '"><span class="nm" style="font-size:15px">' + esc(a.name) + '</span><span class="mus">' + esc(m ? m.name : a.equipType) + '</span></button>'; }).join('') +
      '<button type="button" class="weekrow" data-action="requeue" style="border-style:dashed"><span class="nm" style="font-size:15px;color:var(--steel)">Come back later ↻</span><span class="mus">skip &amp; requeue</span></button>' +
      '<div style="height:8px"></div><button class="cta sub" data-action="close-alt">Never mind</button></div>');
    window.scrollTo(0, 0);
  }
  function swapTo(exId) {
    var s = SESSION.built.slots[SESSION.idx];
    s.exId = exId; s.ex = EX[exId]; s.alt = L.altsForExercise(exId, EX); s.machineId = (machinesForEx(exId)[0] || {}).id || null; s.showHow = false;
    s.pre = L.prescribe(s.ex, lifts[exId]); s.superEx = null;
    s.log = freshLog(s.sets, s.pre.weight);
    SESSION._rest = null; renderActive();
  }
  function requeue() {
    var b = SESSION.built;
    if (SESSION.idx >= b.slots.length - 1) { toast('Last exercise — nothing to requeue after'); return; }
    b.slots.push(b.slots.splice(SESSION.idx, 1)[0]); SESSION._rest = null; renderActive(); toast('Moved to the end — come back to it');
  }
  function addWarmup() {
    var s = SESSION.built.slots[SESSION.idx];
    var w = s.pre.weight != null ? Math.max(0, Math.round(s.pre.weight * 0.5)) : null;
    s.log.unshift(newSet(w, 'warmup')); SESSION._rest = null; renderActive();
    toast('Warm-up set added (lighter) — it won\'t count toward your volume');
  }
  function openSuperset() {
    var s = SESSION.built.slots[SESSION.idx]; var opts = [];
    SESSION.built.slots.forEach(function (o) { if (o.exId !== s.exId && opts.indexOf(o.exId) < 0) opts.push(o.exId); });
    L.altsForExercise(s.exId, EX).slice(0, 3).forEach(function (id) { if (opts.indexOf(id) < 0) opts.push(id); });
    var panel = '<div class="panel fade" id="altpanel"><div class="tinfo"><div class="lab">Superset with — do both back-to-back as one set</div></div>' +
      opts.map(function (id) { var m = machinesForEx(id)[0]; return '<button type="button" class="weekrow" data-action="pick-super" data-ex="' + id + '"><span class="nm" style="font-size:15px">' + esc(EX[id].name) + '</span><span class="mus">' + esc(m ? m.name : EX[id].equipType) + '</span></button>'; }).join('') +
      (s.superEx ? '<button type="button" class="weekrow" data-action="pick-super" data-ex="" style="border-style:dashed"><span class="nm" style="font-size:15px;color:var(--steel)">Remove superset</span></button>' : '') +
      '<div style="height:8px"></div><button class="cta sub" data-action="close-alt">Never mind</button></div>';
    document.getElementById('s-today').insertAdjacentHTML('afterbegin', panel); window.scrollTo(0, 0);
  }
  function pickSuper(exId) {
    var p = document.getElementById('altpanel'); if (p) p.remove();
    var s = SESSION.built.slots[SESSION.idx]; s.superEx = exId || null; renderActive();
    if (exId) toast('Superset added — log both movements in each set');
  }
  function rpAdd(i) {
    var s = SESSION.built.slots[SESSION.idx], x = s.log[i];
    var inp = document.querySelector('[data-rp="' + i + '"]'); var extra = inp && inp.value !== '' ? parseInt(inp.value, 10) : 0;
    if (!extra || extra < 1) { toast('Enter how many more reps you did'); return; }
    if (!x.clusters || !x.clusters.length) x.clusters = [x.reps];
    x.clusters.push(extra); x.reps = x.clusters.reduce(function (a, b) { return a + b; }, 0); x.rp = false;
    renderActive(); toast('Rest-pause added — that set is now ' + x.clusters.join('+') + ' = ' + x.reps + ' reps');
  }
  function nextSlot() { if (SESSION.idx + 1 < SESSION.built.slots.length) { SESSION.idx++; SESSION._rest = null; renderActive(); window.scrollTo(0, 0); } else { SESSION.phase = 'summary'; renderSummary(); } }

  /* cardio */
  function renderCardio() {
    var el = document.getElementById('s-today'), c = SESSION.cardio;
    el.innerHTML = '<div class="topbar"><div class="eyebrow">Cardio · ' + c.minutes + ' min</div><button class="mini" data-action="cancel-session">End</button></div>' +
      '<h1 class="day">Cardio</h1><p class="sub">Target: <b>' + esc(c.effortTarget) + '</b></p>' +
      '<div class="picker" style="padding:0"><div class="lab">Pick your machine</div><div class="machopts">' +
      c.modalities.map(function (id) { return '<button type="button" class="macho ' + (id === c.exId ? 'sel' : '') + '" data-action="pick-modality" data-ex="' + id + '" style="width:150px"><span class="nm" style="padding:14px 10px;font-family:var(--disp);text-transform:uppercase">' + esc(EX[id].name) + '</span></button>'; }).join('') + '</div></div>' +
      howPanel(EX[c.exId]) +
      '<div class="setrow" style="border:1px solid var(--line);border-radius:12px;margin:10px 0"><span class="slab">MIN</span><input type="number" inputmode="numeric" id="cardiomin" value="' + c.minutes + '" style="width:64px"><span class="x">min · effort</span><input type="number" inputmode="numeric" id="cardioeff" placeholder="1-10" style="width:56px"></div>' +
      '<button class="cta" data-action="log-cardio">Log cardio ✓</button>';
  }

  /* summary / save */
  function renderSummary() {
    var el = document.getElementById('s-today'), pr = sessionProgress();
    var totMin = 0; SESSION.built.slots.forEach(function (s) { s.log.forEach(function (x) { if (x.done) totMin += x.durSec; }); });
    el.innerHTML = '<div class="eyebrow">' + esc(SESSION.built.name) + '</div><h1 class="day">Done.</h1>' +
      '<p class="sub"><b>' + pr.done + ' sets</b> · ' + fmtDur(totMin) + ' under tension. How did it feel?</p>' +
      '<div class="timegrid" style="grid-template-columns:repeat(5,1fr)">' + [['1', 'rough'], ['2', 'meh'], ['3', 'ok'], ['4', 'good'], ['5', 'strong']].map(function (f) { return '<button class="timechip" data-action="felt" data-v="' + f[0] + '"><div class="big" style="font-size:22px">' + f[0] + '</div><div class="u">' + f[1] + '</div></button>'; }).join('') + '</div>' +
      '<input id="snote" class="search" placeholder="Note — energy, sleep, anything…">' +
      '<button class="cta" data-action="save-session">Save session ✓</button>';
  }
  function saveLiftSession() {
    var date = todayISO();
    var entry = { day: SESSION.built.dayId, mode: SESSION.mode, budgetMin: SESSION.budgetMin || null, exercises: [], felt: SESSION.felt || null, note: SESSION.note || '' };
    SESSION.built.slots.forEach(function (s) {
      var work = s.log.filter(function (x) { return x.kind !== 'warmup' && x.done && x.reps > 0; });
      var sets = work.map(function (x) { return { reps: x.reps, weight: x.weight || 0, rir: x.rir != null ? x.rir : undefined, durSec: Math.round(x.durSec), endClock: x.endClock, clusters: (x.clusters && x.clusters.length > 1) ? x.clusters : undefined }; });
      if (sets.length) { entry.exercises.push({ exId: s.exId, machineId: s.machineId, machineSetting: s.machineId ? machineSettings[s.machineId] || '' : '', techniqueNote: s.techniqueNote || '', sets: sets }); lifts[s.exId] = L.updateLift(lifts[s.exId], s.ex, sets); }
      if (s.superEx) {
        var bsets = work.filter(function (x) { return x.b && x.b.reps > 0; }).map(function (x) { return { reps: x.b.reps, weight: x.b.weight || 0 }; });
        if (bsets.length) { entry.exercises.push({ exId: s.superEx, sets: bsets, superOf: s.exId }); lifts[s.superEx] = L.updateLift(lifts[s.superEx], EX[s.superEx], bsets); }
      }
    });
    log[date] = entry; set('muscles-log', log); set('muscles-lifts', lifts);
    plan.cycleIndex = L.nextIndex(ACTIVE_PROGRAM, plan.cycleIndex); plan.sessionCount++; plan.calibrated = true; set('muscles-plan', plan);
    var pr = celebrate(entry); SESSION = null; updateHeader(); renderToday(); toast(pr || 'Session saved — nice work 💪');
  }
  function saveCardio() {
    var min = parseInt((document.getElementById('cardiomin') || {}).value, 10) || SESSION.cardio.minutes;
    var eff = parseInt((document.getElementById('cardioeff') || {}).value, 10) || null;
    log[todayISO()] = { day: 'cardio', mode: SESSION.mode, cardio: { modality: EX[SESSION.cardio.exId].equipType, kind: 'steady', minutes: min, avgEffort: eff }, felt: null, note: '' };
    set('muscles-log', log); plan.sessionCount++; set('muscles-plan', plan);
    SESSION = null; updateHeader(); renderToday(); toast(min + ' min cardio logged 🫁');
  }
  function celebrate(entry) {
    var pr = null;
    entry.exercises.forEach(function (it) { var rec = lifts[it.exId]; if (!rec) return; var best = it.sets.reduce(function (m, s) { return Math.max(m, L.e1rm(s.weight, s.reps)); }, 0); if (best >= rec.bestE1RM && best > 0 && it.sets.some(function (s) { return s.weight > 0; })) pr = EX[it.exId].name; });
    return pr ? 'New best on ' + pr + ' 🔥' : null;
  }

  function renderSession() {
    if (!SESSION) return renderToday();
    switch (SESSION.phase) {
      case 'time': return renderTime();
      case 'focus': return renderFocus();
      case 'part': return renderPart();
      case 'compose': return renderCompose();
      case 'ptime': return partnerTime();
      case 'active': return renderActive();
      case 'cardio': return renderCardio();
      case 'summary': return renderSummary();
    }
  }

  /* ---------- TRAIN / program selection ---------- */
  function renderTrain() {
    var el = document.getElementById('s-train');
    var programs = Object.keys(PROGRAM_REGISTRY.programs).map(function (id) { return PROGRAM_REGISTRY.programs[id]; });
    el.innerHTML = '<div class="eyebrow">Your training system</div><h1 class="day">Train</h1><p class="lede">The timer may fit a session to your day, but every exercise stays inside the program you selected.</p>' +
      '<div class="program-hero" style="--category:#C67A24"><div><span class="status-dot"></span><span class="eyebrow">Active · ' + cfg.weeklyFrequency + ' sessions/week</span><h2>' + esc(ACTIVE_PROGRAM.name) + '</h2><p>' + esc(ACTIVE_PROGRAM.description) + '</p></div><button class="mini" data-action="start-alone">Start next</button></div>' +
      '<h2 class="sec">Rotation</h2><div class="program-days">' + ACTIVE_PROGRAM.cycle.map(function (id, index) {
        var day = ACTIVE_PROGRAM.days[id]; var current = index === (plan.cycleIndex || 0) % ACTIVE_PROGRAM.cycle.length;
        return '<button class="weekrow ' + (current ? 'now' : '') + '" data-action="start-day" data-day="' + id + '"><span class="idx">' + (index + 1) + '</span><span class="nm">' + esc(day.name) + '</span><span class="mus">' + day.focusMuscles.slice(0, 3).map(function (m) { return esc(MU[m] ? MU[m].name : m); }).join(' · ') + '</span></button>';
      }).join('') + '</div>' +
      '<button class="modebtn" data-action="start-partner"><span class="ic" aria-hidden="true">+</span><span><span class="t">Partner / custom</span><span class="d">Build a session from verified exercises</span></span></button>' +
      '<h2 class="sec">Programs</h2><p class="lede">Changing programs keeps every previous workout and personal record.</p><div class="program-grid">' + programs.map(function (p) {
        var active = p.id === ACTIVE_PROGRAM.id;
        return '<button class="program-card ' + (active ? 'active' : '') + '" data-action="select-program" data-program="' + p.id + '" aria-pressed="' + active + '"><span class="eyebrow">' + esc(p.experienceLevel) + ' · ' + p.sessionsPerRotation.join(' or ') + ' days</span><b>' + esc(p.name) + '</b><span>' + esc(p.description) + '</span><i>' + (active ? 'Selected' : 'Choose program') + '</i></button>';
      }).join('') + '</div>';
  }

  /* ---------- EQUIPMENT / 45 verified handbook guides ---------- */
  var equipmentFilter = 'All', equipmentQuery = '';
  function renderEquipment() {
    var el = document.getElementById('s-equipment');
    var categories = ['All', 'Push', 'Pull', 'Legs', 'Core', 'Full Body', 'Cardio'];
    var q = equipmentQuery.trim().toLowerCase();
    var list = HANDBOOK_GUIDES.filter(function (guide) {
      var inCategory = equipmentFilter === 'All' || guide.category === equipmentFilter;
      var photoTerms = guide.photos.map(function (p) {
        var displayNumber = p.number === 0 ? 1 : p.number;
        return p.filename + ' photo ' + displayNumber + ' image ' + displayNumber + ' eq' + displayNumber;
      });
      var haystack = [guide.identity, guide.purpose, guide.movementPattern].concat(guide.aliases || [], photoTerms).join(' ').toLowerCase();
      return inCategory && (!q || haystack.indexOf(q) >= 0);
    });
    el.innerHTML = '<div class="eyebrow">45 verified guides · 51 source files</div><h1 class="day">Equipment</h1><p class="lede">Every photo is mapped. Alternate angles stay together, and shared-room views are explicitly cross-referenced.</p>' +
      '<label class="fieldlabel" for="eqsearch">Search by machine or filename</label><input class="search" id="eqsearch" value="' + esc(equipmentQuery) + '" placeholder="Try pulldown, photo 50, or cardio" oninput="window.__eqSearch(this.value)">' +
      '<div class="bodyparts" aria-label="Equipment categories">' + categories.map(function (category) { return '<button class="bp ' + (category === equipmentFilter ? 'on' : '') + '" data-action="equipment-filter" data-cat="' + category + '" style="--category:' + (category === 'All' ? 'var(--ember)' : (HANDBOOK_GUIDES.filter(function (g) { return g.category === category; })[0] || {}).categoryColor) + '">' + category + '</button>'; }).join('') + '</div>' +
      '<div class="result-count" aria-live="polite">' + list.length + ' guide' + (list.length === 1 ? '' : 's') + '</div>' +
      '<div class="eqgrid">' + list.map(function (guide) {
        var nickname = eqNames[guide.id];
        return '<button class="eqcard verified" data-action="open-eq" data-eq="' + guide.id + '" style="--category:' + guide.categoryColor + '"><img src="' + guide.photos[0].webp + '" alt="' + esc(guide.photos[0].alt) + '"><span class="b"><span class="guide-label">' + esc(guide.category) + ' · Guide ' + String(guide.no).padStart(2, '0') + '</span><span class="nm">' + esc(guide.identity) + '</span>' + (nickname ? '<span class="nickname">“' + esc(nickname) + '”</span>' : '') + '<span class="ty">' + esc(guide.evidence.confidence) + ' confidence · ' + guide.photos.length + ' view' + (guide.photos.length === 1 ? '' : 's') + '</span></span></button>';
      }).join('') + '</div>';
  }
  window.__eqSearch = function (value) { equipmentQuery = value; renderEquipment(); var field = document.getElementById('eqsearch'); if (field) { field.focus(); field.setSelectionRange(value.length, value.length); } };

  function openEquipment(id) {
    var guide = GUIDE[id] || HANDBOOK_GUIDES.filter(function (g) { return g.slug === id; })[0];
    if (!guide) return;
    var e = EQ[guide.id], el = document.getElementById('s-equipment');
    var callouts = guide.callouts.map(function (c) { return '<span class="callout ' + (c.x > 65 ? 'left' : '') + '" style="left:' + c.x + '%;top:' + c.y + '%" aria-label="Callout: ' + esc(c.label) + '"><i>' + esc(c.label) + '</i></span>'; }).join('');
    var photos = guide.photos.map(function (photo, index) {
      return '<figure class="guide-photo"><div class="photo-stage"><img src="' + photo.webp + '" alt="' + esc(photo.alt) + '">' + (index === 0 ? callouts : '') + '</div><figcaption>' + esc(photo.filename) + (photo.crossReference ? ' · cross-referenced view' : '') + '</figcaption></figure>';
    }).join('');
    var steps = guide.execution.map(function (step, index) { return '<li><b>' + esc(step.phase) + '</b><span>' + esc(step.instruction) + '</span></li>'; }).join('');
    var checks = guide.adjustmentsAndChecks.map(function (item) { return '<li>' + esc(item) + '</li>'; }).join('');
    var mistakes = guide.mistakes.map(function (item) { return '<div class="correction"><b>' + esc(item.mistake) + '</b><span>' + esc(item.correction) + '</span></div>'; }).join('');
    var nickname = eqNames[guide.id] || '';
    el.innerHTML = '<button class="mini" data-action="equipment-back">‹ All 45 guides</button>' +
      '<article class="guide-detail" style="--category:' + guide.categoryColor + '"><header class="guide-head"><span class="guide-label">' + esc(guide.category) + ' · Guide ' + String(guide.no).padStart(2, '0') + '</span><h1>' + esc(guide.identity) + '</h1>' + (nickname ? '<p class="nickname">Personal nickname · “' + esc(nickname) + '”</p>' : '') + '<p>' + esc(guide.purpose) + '</p><div class="guide-meta"><span>' + esc(guide.movementPattern) + '</span><span>' + esc(guide.difficulty) + '</span><span>' + esc(guide.evidence.confidence) + ' confidence</span></div></header>' +
      '<div class="guide-carousel" aria-label="Source photo carousel">' + photos + '</div>' +
      '<div class="evidence"><span class="eyebrow">Identity evidence</span><p>' + esc(guide.evidence.summary) + '</p></div>' +
      '<section class="guide-section muscle-block"><div><span class="eyebrow">Primary</span><b>' + esc(guide.muscles.primary) + '</b></div><div><span class="eyebrow">Secondary</span><b>' + esc(guide.muscles.secondary) + '</b></div></section>' +
      '<section class="guide-section"><h2>Adjust & check</h2><ol class="checklist">' + checks + '</ol></section>' +
      '<section class="guide-section"><h2>Start → movement → finish</h2><ol class="phase-list">' + steps + '</ol><div class="guide-cues">' + guide.cues.map(function (cue) { return '<span>' + esc(cue) + '</span>'; }).join('') + '</div></section>' +
      '<section class="guide-section split"><div><span class="eyebrow">Breathing</span><p>' + esc(guide.breathing) + '</p></div><div><span class="eyebrow">Tempo & range</span><p>' + esc(guide.tempo) + '. ' + esc(guide.rangeOfMotion) + '</p></div></section>' +
      '<section class="guide-section"><h2>Mistakes → corrections</h2>' + mistakes + '</section>' +
      '<aside class="safety-note"><span class="eyebrow">Safety</span><p>' + esc(guide.safety) + '</p><small>Stop if you feel sharp pain, chest pain, faintness, or unusual shortness of breath. This guide is education, not rehabilitation.</small></aside>' +
      '<section class="guide-section program-block"><div><span class="eyebrow">Programming</span><p>' + esc(guide.programming) + '</p></div><div><span class="eyebrow">Progression</span><p>' + esc(guide.progression) + '</p></div><div><span class="eyebrow">Workout placement</span><p>' + esc(guide.workoutPlacement) + '</p></div><div><span class="eyebrow">Alternatives</span><p>' + guide.alternatives.map(esc).join(' · ') + '</p></div></section>' +
      '<section class="guide-section nickname-editor"><label class="fieldlabel" for="eqrename">Personal nickname <span>optional · authoritative identity stays unchanged</span></label><div class="inline-field"><input class="search" id="eqrename" value="' + esc(nickname) + '" placeholder="Your name for this machine"><button class="mini" data-action="save-eqname" data-eq="' + guide.id + '">Save</button></div></section>' +
      ((guide.linkedExerciseIds || []).length ? '<section class="guide-section"><h2>Linked exercise demos</h2>' + guide.linkedExerciseIds.map(function (xid) {
        var ex = EX[xid]; if (!ex) return '';
        var guidePrescription = ex.loadMode === 'duration' ? '5–30 min · continuous or intervals' : ex.repRange[0] + '–' + ex.repRange[1] + ' reps · ' + ex.sets + ' sets';
        return '<div class="card"><div class="chead" style="padding:14px"><div><div class="cnum">' + esc(ex.primary.map(function (m) { return MU[m] ? MU[m].name : m; }).join(' + ')) + '</div><div class="cname">' + esc(ex.name) + '</div><div class="ctag">' + guidePrescription + '</div></div></div>' + howPanel(ex) + '</div>';
      }).join('') + '</section>' : '') + '<p class="source-line">Source: Complete Gym Equipment Handbook · ' + guide.photos.map(function (p) { return esc(p.filename); }).join(' · ') + '</p></article>';
    if (location.hash !== '#/equipment/' + guide.slug) history.replaceState(null, '', '#/equipment/' + guide.slug);
  }

  /* ---------- PROGRESS ---------- */
  function programRange(muscleId) {
    var key = muscleId;
    if (['lats', 'mid_back', 'traps', 'rear_delts', 'lower_back'].indexOf(muscleId) >= 0) key = 'back';
    else if (['front_delts', 'side_delts'].indexOf(muscleId) >= 0) key = 'shoulders';
    else if (['biceps', 'triceps', 'forearms'].indexOf(muscleId) >= 0) key = 'arms';
    else if (['abs', 'obliques'].indexOf(muscleId) >= 0) key = 'core';
    return ACTIVE_PROGRAM.hardSetRanges[key] || [2, 8];
  }
  function renderProgress() {
    var el = document.getElementById('s-progress');
    var wk = L.weeklyVolume(log, EX, todayISO(), 7), heat = L.heat(wk, MUSCLES);
    var cardio = L.cardioMinutes(log, todayISO(), 7), sessions = Object.keys(log).length;
    var consistency = L.weeklyConsistency(log, todayISO(), cfg.weeklyFrequency), r = consistency.level;
    var prs = Object.keys(lifts).map(function (id) { return { name: EX[id] ? EX[id].name : id, e: lifts[id].bestE1RM }; }).filter(function (x) { return x.e > 0; }).sort(function (a, b) { return b.e - a.e; }).slice(0, 6);
    var volRows = MUSCLES.slice().sort(function (a, b) { return (heat[b.id] || 0) - (heat[a.id] || 0); }).map(function (m) {
      var got = wk[m.id] ? wk[m.id].sets : 0, range = programRange(m.id), ratio = Math.min(1, got / range[1]), pct = Math.round(ratio * 100);
      return '<div class="volrow"><span class="nm">' + esc(m.name) + '</span><div class="volbar"><i style="width:' + pct + '%;background:' + FIGURE.heatColor(ratio) + '"></i></div><span class="c">' + (Math.round(got * 10) / 10) + ' / ' + range[0] + '–' + range[1] + '</span></div>';
    }).join('');
    el.innerHTML = '<div class="eyebrow">Consistency, history & records</div><h1 class="day">Progress</h1><p class="lede">Progress rewards completing the schedule you chose—not chasing raw set volume.</p>' +
      '<div class="stats"><div class="stat"><div class="v">' + consistency.completed + '/' + consistency.target + '</div><div class="k">This week</div></div><div class="stat"><div class="v">' + sessions + '</div><div class="k">All sessions</div></div><div class="stat"><div class="v">' + cardio + '</div><div class="k">Cardio min/wk</div></div></div>' +
      '<div class="panel"><div class="lab" style="font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">Weekly heat — what\'s hot, what\'s cold</div><div style="display:flex;gap:10px;justify-content:center"><div style="width:120px">' + FIGURE.figureSVG('front', { heat: heat }) + '<div class="date" style="text-align:center;margin-top:4px">FRONT</div></div><div style="width:120px">' + FIGURE.figureSVG('back', { heat: heat }) + '<div class="date" style="text-align:center;margin-top:4px">BACK</div></div></div></div>' +
      '<div class="panel"><div class="lab" style="font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">Program-derived weekly hard-set ranges</div>' + volRows + '</div>' +
      (prs.length ? '<div class="panel"><div class="lab" style="font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">Personal bests (est. 1-rep max)</div>' + prs.map(function (p) { return '<div class="volrow"><span class="nm" style="width:auto;flex:1;color:var(--chalk)">' + esc(p.name) + '</span><span class="mono" style="color:var(--ember);font-size:13px">' + Math.round(L.toDisplay(p.e, cfg.units)) + ' ' + cfg.units + '</span></div>'; }).join('') + '</div>' : '') +
      '<div class="panel"><div class="tinfo"><div class="lab">Consistency level · ' + r.name + (r.next ? ' → ' + r.next : ' (max)') + '</div><div class="barwrap" style="margin-top:8px"><div class="bar" style="width:' + Math.round(r.progress * 100) + '%"></div></div>' + (r.next ? '<p class="sub" style="margin:8px 0 0">Complete ' + r.toNext + ' more planned sessions to reach <b>' + r.next + '</b>.</p>' : '') + '<p class="sub" style="margin:8px 0 0">Completed-week streak: <b>' + consistency.streakWeeks + '</b></p></div></div>';
    renderHistory(true);
  }

  /* ---------- HISTORY / calendar ---------- */
  var calMonth = null;
  function renderHistory(append) {
    var el = document.getElementById('s-progress');
    var now = new Date(); if (!calMonth) calMonth = { y: now.getFullYear(), m: now.getMonth() };
    var startM = new Date(cfg.start + 'T00:00:00');
    var first = new Date(calMonth.y, calMonth.m, 1);
    var startDow = (first.getDay() + 6) % 7; // Mon-start
    var days = new Date(calMonth.y, calMonth.m + 1, 0).getDate();
    var cells = [];
    for (var i = 0; i < startDow; i++) cells.push('<div class="cday out"></div>');
    for (var d = 1; d <= days; d++) {
      var iso = calMonth.y + '-' + ('0' + (calMonth.m + 1)).slice(-2) + '-' + ('0' + d).slice(-2);
      var e = log[iso]; var cls = 'cday'; if (iso === todayISO()) cls += ' today';
      if (e) cls += e.day === 'cardio' ? ' cardio' : ' lift';
      var note = e && e.note ? '<span class="dot"></span>' : '';
      cells.push('<button class="' + cls + '" ' + (e ? 'data-action="cal-day" data-d="' + iso + '"' : '') + '>' + d + note + '</button>');
    }
    var prevOk = !(calMonth.y === startM.getFullYear() && calMonth.m === startM.getMonth());
    var nextOk = !(calMonth.y === now.getFullYear() && calMonth.m === now.getMonth());
    var monName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][calMonth.m];
    var historyHtml = '<h2 class="sec">History</h2><p class="lede">Every session on a calendar. Tap a day to see exactly what you did, including deprecated exercises from older sessions.</p>' +
      '<div class="panel"><div class="calhead"><button ' + (prevOk ? 'data-action="cal-prev"' : 'disabled') + '>‹</button><span class="m">' + monName + ' ' + calMonth.y + '</span><button ' + (nextOk ? 'data-action="cal-next"' : 'disabled') + '>›</button></div>' +
      '<div class="calgrid">' + ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(function (x) { return '<div class="cdow">' + x + '</div>'; }).join('') + cells.join('') + '</div>' +
      '<div class="caldetail" id="caldetail"></div></div>' +
      '<div class="panel"><div class="tinfo"><div class="lab">Legend</div><div class="chips"><span class="chip">lifting day</span><span class="chip cool" style="color:var(--steel);border-color:rgba(108,151,188,.4)">cardio</span><span class="chip cool">• note</span></div></div></div>';
    if (append) el.insertAdjacentHTML('beforeend', historyHtml); else el.innerHTML = historyHtml;
  }
  function calDay(iso) {
    var e = log[iso]; if (!e) return; var wrap = document.getElementById('caldetail');
    var dt = new Date(iso + 'T00:00:00');
    var head = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dt.getDay()] + ' ' + dt.getDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][dt.getMonth()];
    if (e.day === 'cardio') { wrap.innerHTML = '<div class="lab" style="font-family:var(--mono);font-size:10px;color:var(--muted);text-transform:uppercase;margin-bottom:6px">' + head + ' · Cardio</div><p class="sub" style="margin:0">' + e.cardio.minutes + ' min · ' + esc(e.cardio.modality) + (e.cardio.avgEffort ? ' · effort ' + e.cardio.avgEffort + '/10' : '') + '</p>'; return; }
    var totMin = 0; (e.exercises || []).forEach(function (it) { (it.sets || []).forEach(function (s) { totMin += (s.durSec || 0); }); });
    var body = (e.exercises || []).map(function (it) {
      var ex = EX[it.exId];
      return '<div style="margin:8px 0"><div style="font-family:var(--disp);font-weight:600;text-transform:uppercase;font-size:15px">' + esc(ex ? ex.name : it.exId) + '</div>' +
        it.sets.map(function (s, i) { return '<span class="mono" style="font-size:11.5px;color:var(--muted);margin-right:10px">S' + (i + 1) + ': ' + s.reps + '×' + L.toDisplay(s.weight, cfg.units) + (s.durSec ? ' ·' + fmtDur(s.durSec) : '') + '</span>'; }).join('') + '</div>';
    }).join('');
    var dayName = ACTIVE_PROGRAM.days[e.day] ? ACTIVE_PROGRAM.days[e.day].name : e.day;
    wrap.innerHTML = '<div class="lab" style="font-family:var(--mono);font-size:10px;color:var(--muted);text-transform:uppercase;margin-bottom:2px">' + head + ' · ' + esc(dayName) + (e.mode ? ' · ' + e.mode : '') + '</div>' +
      '<div class="date" style="margin-bottom:6px">' + (e.exercises || []).length + ' exercises · ' + fmtDur(totMin) + ' work' + (e.felt ? ' · felt ' + e.felt + '/5' : '') + '</div>' + body + (e.note ? '<p class="sub" style="margin:8px 0 0">“' + esc(e.note) + '”</p>' : '');
  }

  /* ---------- LEARN / handbook principles + settings ---------- */
  var LEARN_TOPICS = {
    safety: { title: 'Safety first', color: '#C74B50', summary: 'Pre-use checks, pain rules, spotting and emergency awareness.', points: [
      ['Before every machine', 'Inspect the cable, belt, pin, pad, stops and moving path. Match plate loads on both sides and keep fingers clear of pivots.'],
      ['Pain is information', 'Muscular effort is expected; sharp pain, chest pain, faintness or unusual shortness of breath is a stop signal. Seek appropriate medical help when symptoms warrant it.'],
      ['Free weights', 'Set safeties, use collars as the facility requires, and use a competent spotter for challenging barbell sets.']
    ] },
    setup: { title: 'Machine setup', color: '#C67A24', summary: 'A repeatable sequence for seats, pads, selectors and range.', points: [
      ['Read the station', 'Confirm the authoritative guide, movement direction and source photograph before loading.'],
      ['Fit the joints', 'Align the machine pivot with the working joint where applicable; place handles and pads so the start is stable and pain-free.'],
      ['Record settings', 'Save the seat, pin, pad or foot position in the workout screen so the next visit starts consistently.']
    ] },
    warmup: { title: 'Warm-up & ramp sets', color: '#C67A24', summary: 'Prepare generally, then rehearse the exact first lift.', points: [
      ['General warm-up', 'Use 5–10 easy minutes of treadmill walking, recumbent cycling or upper-body ergometry. You should feel warmer, not tired.'],
      ['Ramp automatically', 'The coach adds two non-counting rehearsal sets to the first programmed compound: about 40% for 8 reps and 65% for 5 reps.'],
      ['Specific preparation', 'Use the same setup and controlled range you intend to use for work sets. Add another ramp only when the working load or skill demands it.']
    ] },
    mobility: { title: 'Mobility', color: '#7356A5', summary: 'Build usable range without turning the warm-up into a workout.', points: [
      ['Move, then load', 'Use a few controlled repetitions through the joints and patterns needed today rather than long aggressive stretching immediately before heavy work.'],
      ['Own the range', 'Mobility is useful only when you can control the position. Never force a machine to create range your joint cannot tolerate.'],
      ['Progress patiently', 'A little frequent practice beats one intense session. Stop if stretching creates sharp, radiating or unstable symptoms.']
    ] },
    rir: { title: 'RIR & effort', color: '#2E6FA7', summary: 'Use repetitions in reserve to train hard without losing form.', points: [
      ['What RIR means', 'RIR estimates how many clean repetitions remained when the set ended. Two RIR means you likely could have completed two more with the same technique.'],
      ['Default target', 'Most work sets use about 1–3 RIR. Beginners should learn consistency before deliberately training to failure.'],
      ['Log honestly', 'Record optional RIR after the set. Top-range repetitions only trigger a load increase when effort did not exceed the plan.']
    ] },
    overload: { title: 'Progressive overload', color: '#2E8555', summary: 'Add repetitions first, then the smallest sensible load.', points: [
      ['Double progression', 'Keep the same load while repetitions rise inside the programmed range. When every set reaches the top with clean form, add the smallest appropriate increment.'],
      ['Load semantics matter', 'The log labels per-side plates, per-hand dumbbells, selector stacks, total barbell load and assistance so comparisons remain meaningful.'],
      ['One variable at a time', 'Avoid simultaneously jumping load, sets and intensity. A small repeatable improvement is enough.']
    ] },
    deloads: { title: 'Recovery & reductions', color: '#2E8555', summary: 'One poor workout is not an automatic deload.', points: [
      ['Look for a pattern', 'Sleep, stress, setup and timing can make one day worse. The coach holds the load after a single below-range session.'],
      ['Repeated misses', 'Only repeated below-range performance triggers an optional reduction suggestion of about 10 percent. You choose whether to accept it.'],
      ['Recover on purpose', 'If performance, motivation and soreness remain unusually poor, reduce load or volume temporarily and seek qualified advice for persistent symptoms.']
    ] },
    cardio: { title: 'Cardio', color: '#16889E', summary: 'Use the three verified modalities without compromising strength work.', points: [
      ['Easy aerobic work', 'Conversational treadmill walking, recumbent cycling or arm cranking can build aerobic capacity and support recovery.'],
      ['Progress duration first', 'Add weekly minutes before making large jumps in speed, incline, cadence or resistance. Warm up and cool down.'],
      ['Public-health context', 'Build toward the current U.S. physical-activity guidance over time; any amount is useful, and individual needs differ.']
    ] },
    nutrition: { title: 'Nutrition basics', color: '#C67A24', summary: 'Simple habits that support training without prescribing a diet.', points: [
      ['Energy and pattern', 'Use a sustainable eating pattern built mostly from nutrient-dense foods. Muscle gain is helped by enough total energy and resistance training.'],
      ['Protein distribution', 'Include protein-rich foods across the day. Needs vary with body size, goals, health and dietary pattern; this app does not prescribe an individualized target.'],
      ['Hydration', 'Arrive hydrated, drink to thirst and account for heat and long sessions. Medical fluid restrictions require clinician guidance.']
    ] },
    etiquette: { title: 'Gym etiquette', color: '#C67A24', summary: 'Share equipment, re-rack and keep walkways safe.', points: [
      ['Between sets', 'Let others work in when practical, avoid occupying multiple stations during busy periods and use the app’s swap/requeue tools.'],
      ['Reset the station', 'Wipe contact surfaces, return attachments, unload plates and restore adjustable benches or selectors.'],
      ['Keep the floor clear', 'Dumbbells, plates, mats and small tools become trip hazards when left out.']
    ] },
    faq: { title: 'FAQ', color: '#7356A5', summary: 'Answers for common first-week questions.', points: [
      ['What if a machine is busy?', 'Tap Busy? for a same-pattern alternative or requeue the exercise at the end. The coach keeps you inside the selected program.'],
      ['What if a setting hurts?', 'Stop, reduce the load and range, re-check the guide and choose a pain-free alternative. Persistent pain needs qualified assessment.'],
      ['Will changing programs erase history?', 'No. Program changes reset only the next-day rotation; all logs, lift history, settings and nicknames remain.'],
      ['Can I use this offline?', 'Yes after the first successful load. The shell, verified guides, photos, fonts and demonstrations are precached; the large PDF caches only when opened online.']
    ] },
    references: { title: 'References', color: '#2E6FA7', summary: 'Authoritative guidance and manufacturer evidence used by the handbook.', points: [
      ['Training guidance', '<a href="https://acsm.org/resistance-training-guidelines-update-2026/" target="_blank" rel="noopener">ACSM resistance-training guidance update</a> · <a href="https://odphp.health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines/current-guidelines" target="_blank" rel="noopener">U.S. Physical Activity Guidelines</a>'],
      ['Nutrition', '<a href="https://www.dietaryguidelines.gov/" target="_blank" rel="noopener">Dietary Guidelines for Americans</a> · <a href="https://pubmed.ncbi.nlm.nih.gov/28698222/" target="_blank" rel="noopener">Morton et al. protein meta-analysis</a>'],
      ['Equipment identity', '<a href="https://us.matrixfitness.com/eng/innovations/glute-trainer" target="_blank" rel="noopener">Matrix Glute Trainer</a> · <a href="https://bootybuilder.com/product/booty-builder-platinum/" target="_blank" rel="noopener">Booty Builder</a> · manufacturer placards and geometry documented in the completed handbook.']
    ], html: true }
  };

  function renderLearn(topicId) {
    var el = document.getElementById('s-learn'), topic = LEARN_TOPICS[topicId];
    if (topic) {
      el.innerHTML = '<button class="mini" data-action="learn-back">‹ Learn</button><article class="learn-detail" style="--category:' + topic.color + '"><span class="guide-label">Handbook principle</span><h1>' + esc(topic.title) + '</h1><p class="lede">' + esc(topic.summary) + '</p>' +
        topic.points.map(function (point) { return '<section class="rule"><b>' + esc(point[0]) + '</b><p>' + (topic.html ? point[1] : esc(point[1])) + '</p></section>'; }).join('') + '</article>';
      if (location.hash !== '#/learn/' + topicId) history.replaceState(null, '', '#/learn/' + topicId);
      return;
    }
    el.innerHTML = '<div class="eyebrow">Handbook knowledge & app controls</div><h1 class="day">Learn</h1><p class="lede">Short, practical chapters for safe independent training. Open the full 187-page handbook when you want the complete reference.</p>' +
      '<a class="pdf-link" href="Complete_Gym_Equipment_Handbook_Revised.pdf" target="_blank" rel="noopener"><span><b>The Complete Gym Equipment Handbook</b><small>187 pages · opens online, then can be cached by your browser</small></span><i>PDF ↗</i></a>' +
      '<div class="learn-grid">' + Object.keys(LEARN_TOPICS).map(function (id) { var item = LEARN_TOPICS[id]; return '<button class="learn-card" data-action="learn-topic" data-topic="' + id + '" style="--category:' + item.color + '"><b>' + esc(item.title) + '</b><span>' + esc(item.summary) + '</span></button>'; }).join('') + '</div>' +
      '<h2 class="sec">Preferences & privacy</h2>' +
      '<div class="panel settings"><div><span class="fieldlabel">Theme</span><div class="unitpick">' + ['system', 'dark', 'light'].map(function (mode) { return '<button data-action="set-theme" data-theme="' + mode + '" class="' + (cfg.theme === mode ? 'on' : '') + '">' + mode + '</button>'; }).join('') + '</div></div>' +
      '<div class="setting-row"><span><b>Units</b><small>Current display: ' + cfg.units + '</small></span><button class="mini" data-action="toggle-units">Switch to ' + (cfg.units === 'lb' ? 'kg' : 'lb') + '</button></div>' +
      '<div class="setting-row"><span><b>Advanced tools</b><small>Supersets and rest-pause; off by default for beginners.</small></span><button class="mini ' + (cfg.advanced ? 'busy' : '') + '" data-action="toggle-advanced" aria-pressed="' + cfg.advanced + '">' + (cfg.advanced ? 'On' : 'Off') + '</button></div>' +
      '<div class="setting-row"><span><b>Offline readiness</b><small id="offline-detail">Checking cached app shell…</small></span><span class="offline-badge" id="offline-badge">Checking</span></div></div>' +
      '<div class="panel backup"><span class="fieldlabel">Device-local backup</span><p class="sub">Export includes settings, history, records, machine settings and nicknames. Import validates first and asks before replacing this device’s state.</p><div class="inline-field"><button class="mini" data-action="export-backup">Export JSON</button><label class="mini file-button" for="importbackup">Import JSON</label><input id="importbackup" type="file" accept="application/json,.json" hidden></div></div>' +
      '<p class="privacy-note">No account. No analytics. No workout upload. Data stays in this browser unless you export it.</p>';
    updateOfflineBadge();
  }

  /* ---------- router ---------- */
  var TABS = ['today', 'train', 'equipment', 'progress', 'learn'];
  function renderTab(t) { ({ today: renderToday, train: renderTrain, equipment: renderEquipment, progress: renderProgress, learn: renderLearn }[t] || renderToday)(); }
  function activateTab(t) {
    TABS.forEach(function (name) { document.getElementById('s-' + name).classList.toggle('hidden', name !== t); });
    document.querySelectorAll('nav.tabs button').forEach(function (button) {
      var current = button.getAttribute('data-tab') === t;
      button.classList.toggle('on', current);
      if (current) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    });
  }
  function showTab(t) {
    if (TABS.indexOf(t) < 0) t = 'today';
    var target = '#/' + t;
    if (location.hash === target) routeFromHash(); else location.hash = target;
  }
  function routeFromHash() {
    var parts = (location.hash || '#/today').replace(/^#\/?/, '').split('/');
    var tab = parts[0] || 'today';
    if (tab === 'equipment' && parts[1]) {
      activateTab('equipment'); renderEquipment(); openEquipment(decodeURIComponent(parts.slice(1).join('/')));
    } else if (tab === 'learn' && parts[1]) {
      activateTab('learn'); renderLearn(decodeURIComponent(parts[1]));
    } else {
      if (TABS.indexOf(tab) < 0) tab = 'today';
      activateTab(tab); renderTab(tab);
    }
    window.scrollTo(0, 0);
  }

  function updateOnboardingRecommendation() {
    var id = PROGRAM_REGISTRY.recommend(cfg.experience, cfg.weeklyFrequency);
    var el = document.getElementById('obrecommend');
    if (el) el.innerHTML = '<div class="eyebrow">Recommended program</div><b>' + esc(PROGRAM_REGISTRY.get(id).name) + '</b>';
  }
  function updateOfflineBadge() {
    var badge = document.getElementById('offline-badge'), detail = document.getElementById('offline-detail');
    if (!badge || !detail) return;
    var ready = !!navigator.serviceWorker && !!navigator.serviceWorker.controller;
    badge.textContent = navigator.onLine ? (ready ? 'Ready' : 'First load') : (ready ? 'Offline' : 'Unavailable');
    badge.classList.toggle('ready', ready);
    detail.textContent = ready ? (navigator.onLine ? 'Shell, guide data and media are available offline.' : 'You are offline; cached navigation remains available.') : 'Keep this page open online once so the verified library can finish caching.';
  }
  function exportBackup() {
    var blob = new Blob([APPSTATE.exportBackup(state)], { type: 'application/json' });
    var url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = 'muscles-backup-' + todayISO() + '.json';
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    toast('Validated AppStateV2 backup exported');
  }
  function importBackupFile(file) {
    if (!file) return;
    file.text().then(function (text) {
      var parsed = APPSTATE.parseBackup(text);
      if (!parsed.ok) { toast('Import rejected: ' + parsed.errors.join(' ')); return; }
      var s = parsed.summary;
      var message = 'Validated backup\n\nProgram: ' + s.program + '\nWorkout days: ' + s.workoutDays + '\nTracked exercises: ' + s.trackedExercises + '\n\nReplace the state on this device?';
      if (!window.confirm(message)) { toast('Import cancelled; current data unchanged'); return; }
      var result = APPSTATE.replaceFromBackup(localStorage, parsed);
      if (result.ok) { toast('Backup restored. Reloading…'); setTimeout(function () { location.reload(); }, 500); }
    }).catch(function () { toast('Import rejected: file could not be read'); });
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var tab = e.target.closest('nav.tabs button'); if (tab) return showTab(tab.getAttribute('data-tab'));
    var a = e.target.closest('[data-action]'); if (!a) return;
    var act = a.getAttribute('data-action'), d = a.getAttribute.bind(a);
    switch (act) {
      case 'ob-unit': cfg.units = d('data-u'); document.querySelectorAll('[data-action=ob-unit]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-u') === cfg.units); }); break;
      case 'ob-experience': cfg.experience = d('data-v'); document.querySelectorAll('[data-action=ob-experience]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === cfg.experience); }); updateOnboardingRecommendation(); break;
      case 'ob-frequency': cfg.weeklyFrequency = +d('data-v'); document.querySelectorAll('[data-action=ob-frequency]').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-v') === cfg.weeklyFrequency); }); updateOnboardingRecommendation(); break;
      case 'ob-done': cfg.name = (document.getElementById('obname') || {}).value || ''; cfg.onboarded = true; cfg.programId = PROGRAM_REGISTRY.recommend(cfg.experience, cfg.weeklyFrequency); state.selectedProgram = cfg.programId; ACTIVE_PROGRAM = PROGRAM_REGISTRY.get(cfg.programId); persist(); renderToday(); updateHeader(); break;
      case 'start-alone': showTab('today'); startAlone(); break;
      case 'start-day': showTab('today'); SESSION = { mode: 'alone', phase: 'time', dayId: d('data-day'), budgetMin: null }; renderSession(); break;
      case 'start-cardio': buildAndStart('cardio'); break;
      case 'start-partner': showTab('today'); startPartner(); break;
      case 'pick-time': SESSION.budgetMin = +d('data-min'); SESSION.phase = 'focus'; renderSession(); break;
      case 'pick-focus': buildAndStart(d('data-day')); break;
      case 'pick-part': SESSION.part = d('data-part'); SESSION.picked = ACTIVE_PROGRAM.classic[SESSION.part].slice(0, 5); SESSION.query = ''; SESSION.phase = 'compose'; renderSession(); break;
      case 'partner-back': SESSION.phase = 'part'; renderSession(); break;
      case 'toggle-ex': { var id = d('data-ex'); var i = SESSION.picked.indexOf(id); if (i >= 0) SESSION.picked.splice(i, 1); else SESSION.picked.push(id); renderCompose(); break; }
      case 'partner-time': if (!SESSION.picked.length) { toast('Add at least one exercise'); break; } SESSION.phase = 'ptime'; renderSession(); break;
      case 'partner-go': partnerGo(+d('data-min')); break;
      case 'pick-machine': SESSION.built.slots[SESSION.idx].machineId = d('data-machine'); renderActive(); break;
      case 'switch-ex': swapTo(d('data-ex')); break;
      case 'toggle-how': { var s = SESSION.built.slots[SESSION.idx]; s.showHow = !s.showHow; renderActive(); break; }
      case 'start-set': startSet(+d('data-set')); break;
      case 'end-set': endSet(+d('data-set')); break;
      case 'busy': busy(); break;
      case 'add-warmup': addWarmup(); break;
      case 'superset': openSuperset(); break;
      case 'pick-super': pickSuper(d('data-ex')); break;
      case 'rp-open': { var so = SESSION.built.slots[SESSION.idx]; so.log[+d('data-set')].rp = true; renderActive(); break; }
      case 'rp-add': rpAdd(+d('data-set')); break;
      case 'close-alt': { var p = document.getElementById('altpanel'); if (p) p.remove(); break; }
      case 'swap': { var pp = document.getElementById('altpanel'); if (pp) pp.remove(); swapTo(d('data-ex')); break; }
      case 'requeue': { var q = document.getElementById('altpanel'); if (q) q.remove(); requeue(); break; }
      case 'next-slot': nextSlot(); break;
      case 'cancel-session': SESSION = null; clearInterval(workInt); clearInterval(restInt); renderToday(); break;
      case 'felt': SESSION.felt = +d('data-v'); document.querySelectorAll('[data-action=felt]').forEach(function (b) { b.classList.remove('sel'); }); a.classList.add('sel'); break;
      case 'save-session': { var n = document.getElementById('snote'); SESSION.note = n ? n.value : ''; saveLiftSession(); break; }
      case 'pick-modality': SESSION.cardio.exId = d('data-ex'); renderCardio(); break;
      case 'log-cardio': saveCardio(); break;
      case 'select-program': { cfg.programId = d('data-program'); state.selectedProgram = cfg.programId; ACTIVE_PROGRAM = PROGRAM_REGISTRY.get(cfg.programId); if (ACTIVE_PROGRAM.sessionsPerRotation.indexOf(cfg.weeklyFrequency) < 0) cfg.weeklyFrequency = ACTIVE_PROGRAM.sessionsPerRotation[ACTIVE_PROGRAM.sessionsPerRotation.length - 1]; plan.cycleIndex = 0; persist(); renderTrain(); updateHeader(); toast('Program changed; workout history preserved'); break; }
      case 'equipment-filter': equipmentFilter = d('data-cat'); renderEquipment(); break;
      case 'open-eq': openEquipment(d('data-eq')); break;
      case 'save-eqname': { var v = ((document.getElementById('eqrename') || {}).value || '').trim(); var eid = d('data-eq'); if (v) eqNames[eid] = v; else delete eqNames[eid]; set('muscles-eqnames', eqNames); openEquipment(eid); toast('Personal nickname saved'); break; }
      case 'equipment-back': history.replaceState(null, '', '#/equipment'); renderEquipment(); break;
      case 'cal-prev': calMonth.m--; if (calMonth.m < 0) { calMonth.m = 11; calMonth.y--; } renderProgress(); break;
      case 'cal-next': calMonth.m++; if (calMonth.m > 11) { calMonth.m = 0; calMonth.y++; } renderProgress(); break;
      case 'cal-day': calDay(d('data-d')); break;
      case 'learn-topic': renderLearn(d('data-topic')); break;
      case 'learn-back': history.replaceState(null, '', '#/learn'); renderLearn(); break;
      case 'toggle-units': cfg.units = cfg.units === 'lb' ? 'kg' : 'lb'; persist(); renderLearn(); toast('Now showing ' + cfg.units); break;
      case 'set-theme': cfg.theme = d('data-theme'); persist(); applyTheme(); renderLearn(); break;
      case 'toggle-advanced': cfg.advanced = !cfg.advanced; persist(); renderLearn(); toast('Advanced tools ' + (cfg.advanced ? 'enabled' : 'hidden')); break;
      case 'export-backup': exportBackup(); break;
      case 'accept-reduction': { var rs = SESSION.built.slots[SESSION.idx]; rs.pre = L.acceptReduction(rs.pre); rs.log.forEach(function (x) { if (!x.done) x.weight = rs.pre.weight; }); renderActive(); toast('Reduction accepted for this exercise'); break; }
      case 'demo-toggle': { var block = a.closest('.demoblock'), demo = block && block.querySelector('.demo'); if (!demo) break; demo.classList.remove('start', 'end'); var paused = demo.classList.toggle('paused'); a.textContent = paused ? 'Play' : 'Pause'; a.setAttribute('aria-pressed', paused); break; }
      case 'demo-frame': { var db = a.closest('.demoblock'), dm = db && db.querySelector('.demo'); if (!dm) break; dm.classList.remove('start', 'end'); dm.classList.add(d('data-frame')); dm.classList.add('paused'); var toggle = db.querySelector('[data-action=demo-toggle]'); if (toggle) { toggle.textContent = 'Play'; toggle.setAttribute('aria-pressed', 'true'); } break; }
    }
  });

  document.addEventListener('change', function (e) {
    if (e.target.matches('[data-machine-setting]')) { machineSettings[e.target.getAttribute('data-machine-setting')] = e.target.value.trim(); persist(); toast('Machine setting saved'); }
    if (e.target.matches('[data-technique-note]') && SESSION) { SESSION.built.slots[SESSION.idx].techniqueNote = e.target.value.trim(); }
    if (e.target.id === 'importbackup') importBackupFile(e.target.files && e.target.files[0]);
  });
  window.addEventListener('hashchange', routeFromHash);
  window.addEventListener('online', updateOfflineBadge);
  window.addEventListener('offline', updateOfflineBadge);
  if (matchMedia('(prefers-color-scheme: light)').addEventListener) matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () { if (cfg.theme === 'system') applyTheme(); });

  /* ---------- boot ---------- */
  applyTheme(); updateHeader(); routeFromHash();
  if (migration.migrated && (Object.keys(log).length || Object.keys(lifts).length)) toast('History migrated safely to AppStateV2');
})();
