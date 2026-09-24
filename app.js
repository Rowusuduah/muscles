/* muscles — Verified Gym Guide & Coach (AppStateV2).
   Device-local coaching, verified handbook guides, adaptive timing, partner mode,
   accessible timers, history, backups, themes and offline-aware navigation. */
(function () {
  'use strict';
  var APP_RELEASE = '2026.09.24.4';
  var EX = L.byId(EXERCISES), MU = L.byId(MUSCLES);
  var HOME_EQUIPMENT = EQUIPMENT.slice(), HOME_GUIDES = HANDBOOK_GUIDES.slice();
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
  var trainingProfile = state.trainingProfile;
  var decisionLog = state.decisionLog;
  var ACTIVE_PROGRAM = PROGRAM_REGISTRY.get(state.selectedProgram);
  function persist() {
    state.config = cfg; state.selectedProgram = cfg.programId; state.programRotation = plan;
    state.liftHistory = lifts; state.workoutLogs = log; state.customLabels = eqNames;
    state.machineSettings = machineSettings;
    state.trainingProfile = trainingProfile;
    state.decisionLog = decisionLog;
    state = APPSTATE.save(localStorage, state);
    // Record the change time and, if Drive is connected, queue a background sync.
    if (window.MDRIVE) window.MDRIVE.markChanged();
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
  var SESSION = null, workInt = null, restInt = null, forceGymPicker = false;

  /* ---------- helpers ---------- */
  var FRONT_M = ['traps', 'front_delts', 'side_delts', 'chest', 'biceps', 'forearms', 'abs', 'obliques', 'quads', 'calves'];
  var BACK_M = ['traps', 'rear_delts', 'triceps', 'forearms', 'mid_back', 'lats', 'lower_back', 'glutes', 'hamstrings', 'calves'];
  function pickView(mark) { var f = 0, b = 0; Object.keys(mark).forEach(function (m) { if (FRONT_M.indexOf(m) >= 0) f++; if (BACK_M.indexOf(m) >= 0) b++; }); return b > f ? 'back' : 'front'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function wLbl(lb) { return lb == null ? '—' : L.toDisplay(lb, cfg.units) + ' ' + cfg.units; }
  function fmtDur(sec) { sec = Math.round(sec); return sec < 60 ? sec + 's' : Math.floor(sec / 60) + ':' + ('0' + (sec % 60)).slice(-2); }
  function toast(msg) { var t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('show'); }, 2600); }
  function activeEquipment() { return cfg && cfg.gymId === 'crunch' && window.CRUNCH_EQUIPMENT ? window.CRUNCH_EQUIPMENT : HOME_EQUIPMENT; }
  function activeGuides() { return cfg && cfg.gymId === 'crunch' && window.CRUNCH_GUIDES ? window.CRUNCH_GUIDES : HOME_GUIDES; }
  function activeGymName() { return cfg && cfg.gymId === 'crunch' ? 'Crunch Fitness' : 'Original gym'; }
  function gymConfirmedToday() { return cfg && cfg.gymConfirmedOn === todayISO(); }
  function applyGymTheme() { document.documentElement.setAttribute('data-gym', cfg && cfg.gymId === 'crunch' ? 'crunch' : 'home'); }
  function zoneName(zoneId) { var zone = window.CRUNCH_MAP && window.CRUNCH_MAP.zones.filter(function (z) { return z.id === zoneId; })[0]; return zone ? zone.name : String(zoneId || 'Unmapped').replace(/-/g, ' '); }
  function machinesForEx(exId) { return activeEquipment().filter(function (e) { return (e.exerciseIds || []).indexOf(exId) >= 0; }); }
  function chooseMachineForExercise(exId, preferredZone) {
    return L.selectEquipmentForExercise(exId, activeEquipment(), log, preferredZone);
  }
  function routeForAssignedSlots(slots) {
    var groups = [];
    (slots || []).forEach(function (slot) {
      var zoneId = slot.zoneId || 'unmapped', previous = groups[groups.length - 1];
      if (previous && previous.zoneId === zoneId) previous.exerciseIds.push(slot.exId);
      else groups.push({ zoneId: zoneId, exerciseIds: [slot.exId] });
    });
    return groups;
  }
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
    applyGymTheme();
    document.querySelector('meta[name="theme-color"]').setAttribute('content', resolved === 'light' ? '#F2F0EA' : '#121417');
    var toggle = document.getElementById('theme-toggle'), next = resolved === 'dark' ? 'light' : 'dark';
    if (toggle) {
      toggle.setAttribute('aria-label', 'Switch to ' + next + ' mode');
      toggle.setAttribute('aria-pressed', resolved === 'light' ? 'true' : 'false');
      toggle.setAttribute('title', 'Switch to ' + next + ' mode');
      toggle.innerHTML = '<span class="theme-icon" aria-hidden="true">' + (resolved === 'dark' ? '☀' : '☾') + '</span><span>' + (resolved === 'dark' ? 'Light' : 'Dark') + '</span>';
    }
  }

  function frequencyPicker() {
    return '<div class="schedule-picker"><fieldset class="choicegroup schedule-choice"><legend>Training days per week</legend>' + [2, 3, 4, 5, 6, 7].map(function (days) {
      return '<button type="button" data-action="set-frequency" data-days="' + days + '" class="' + (cfg.weeklyFrequency === days ? 'on' : '') + '" aria-pressed="' + (cfg.weeklyFrequency === days) + '">' + days + '<span>day' + (days === 1 ? '' : 's') + '</span></button>';
    }).join('') + '</fieldset><small>Change this anytime. If the current program does not fit your schedule, muscles selects the matching handbook program and keeps all history.</small></div>';
  }

  function gymChoiceCards(action) {
    return '<div class="gym-choice-grid" role="group" aria-label="Choose today\'s gym">' +
      '<button type="button" class="gym-choice home-choice ' + (cfg.gymId !== 'crunch' ? 'on' : '') + '" data-action="' + action + '" data-gym="home" aria-pressed="' + (cfg.gymId !== 'crunch') + '"><span class="gym-mark">OG</span><span><b>Original gym</b><small>Use only the original verified equipment, guides, photos and substitutions.</small></span></button>' +
      '<button type="button" class="gym-choice crunch-choice ' + (cfg.gymId === 'crunch' ? 'on' : '') + '" data-action="' + action + '" data-gym="crunch" aria-pressed="' + (cfg.gymId === 'crunch') + '"><span class="gym-mark">C</span><span><b>Crunch Fitness</b><small>Orange mode · Crunch equipment, free weights, photos, zones and substitutions only.</small></span></button>' +
      '</div>';
  }
  function gymContextBar() {
    return '<div class="panel gym-context"><div><span class="eyebrow">Active gym today</span><b>' + esc(activeGymName()) + '</b><small>Everything shown below is available at this gym.</small></div><button class="mini" data-action="gym-jump">Change gym</button></div>';
  }
  function renderGymPicker() {
    var el = document.getElementById('s-today');
    el.innerHTML = '<div class="gym-gate fade"><div class="eyebrow">Set today\'s training location</div><h1 class="day">Which gym are you at today?</h1>' +
      '<p class="sub">Choose once for today. The coach will activate only that gym\'s workouts, equipment photos, exercise choices, substitutions and location guidance. Your workout history stays together when you switch.</p>' +
      gymChoiceCards('select-daily-gym') +
      '<div class="gym-gate-note"><b>Why this comes first</b><span>It prevents the coach from showing a machine or route that is not in the building you are using.</span></div></div>';
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
      '<p class="sub">Your private multi-gym coach, exercise encyclopedia and verified equipment guide. Your workout data never leaves this device.</p>' +
      '<fieldset class="onboard-gym"><legend>First: which gym are you at today?</legend>' + gymChoiceCards('ob-gym') + '<small>Crunch switches the app to its orange identity. Only the selected gym\'s equipment and exercise mappings are activated.</small></fieldset>' +
      '<label class="fieldlabel" for="obname">Name <span>optional</span></label><input class="search" id="obname" autocomplete="name" placeholder="What should the coach call you?">' +
      '<fieldset class="choicegroup"><legend>Training experience</legend><button type="button" data-action="ob-experience" data-v="beginner" class="on">Beginner</button><button type="button" data-action="ob-experience" data-v="intermediate">Intermediate</button></fieldset>' +
      '<fieldset class="choicegroup goal-choice"><legend>Primary goal</legend><button type="button" data-action="ob-goal" data-v="hypertrophy" class="on">Muscle gain</button><button type="button" data-action="ob-goal" data-v="strength_muscle">Strength + muscle</button><button type="button" data-action="ob-goal" data-v="general_fitness">General fitness</button></fieldset>' +
      '<fieldset class="choicegroup"><legend>Realistic sessions per week</legend>' + [2, 3, 4, 5, 6, 7].map(function (n) { return '<button type="button" data-action="ob-frequency" data-v="' + n + '" class="' + (n === 3 ? 'on' : '') + '">' + n + '</button>'; }).join('') + '</fieldset>' +
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
    if (!gymConfirmedToday() || forceGymPicker) return renderGymPicker();
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

    var gymBanner = '<div class="panel gym-banner"><div><span class="eyebrow">Active gym today</span><b>' + esc(activeGymName()) + '</b><small>Workout, substitutions and equipment guidance are scoped to this gym.</small></div><button class="mini" data-action="gym-jump">Change gym</button></div>';
    el.innerHTML = hero + gymBanner +
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
  function renderReadiness() {
    var el = document.getElementById('s-today');
    var r = SESSION.readiness || (SESSION.readiness = { energy: 'normal', soreness: 'mild', sleep: 'okay' });
    function choices(key, values) {
      return '<fieldset class="choicegroup readiness-choice"><legend>' + key.charAt(0).toUpperCase() + key.slice(1) + '</legend>' + values.map(function (value) {
        return '<button type="button" data-action="readiness-pick" data-key="' + key + '" data-v="' + value + '" class="' + (r[key] === value ? 'on' : '') + '" aria-pressed="' + (r[key] === value) + '">' + value + '</button>';
      }).join('') + '</fieldset>';
    }
    el.innerHTML = '<div class="eyebrow">Optional 10-second check</div><h1 class="day">How are you?</h1>' +
      '<p class="sub">This is a training signal, not a medical measurement. It can trim late accessory work, but it will not automatically cancel your workout.</p>' +
      choices('energy', ['low', 'normal', 'high']) + choices('soreness', ['none', 'mild', 'high']) + choices('sleep', ['poor', 'okay', 'good']) +
      '<button class="cta" data-action="readiness-continue">Continue →</button><button class="cta sub" data-action="readiness-skip">Skip check</button>';
  }
  function renderFocus() {
    var el = document.getElementById('s-today'); var proposed = SESSION.dayId;
    el.innerHTML = '<div class="eyebrow">Stay inside your program</div><h1 class="day">Choose day</h1>' +
      '<p class="sub">I suggest <b>' + esc(ACTIVE_PROGRAM.days[proposed].name) + '</b>. You may choose another day from ' + esc(ACTIVE_PROGRAM.name) + '.</p>' +
      ACTIVE_PROGRAM.cycle.map(function (d) {
        var day = ACTIVE_PROGRAM.days[d];
        var mus = day.focusMuscles.map(function (m) { return MU[m] ? MU[m].name : m; }).join(' · ');
        return '<button class="weekrow ' + (d === proposed ? 'now ' : '') + '" data-action="pick-focus" data-day="' + d + '"><span class="nm">' + esc(day.name) + '</span><span class="mus">' + esc(mus) + '</span></button>';
      }).join('') + '<button class="weekrow cardio" data-action="start-cardio"><span class="nm">Optional cardio</span><span class="mus">' + (cfg.gymId === 'crunch' ? 'Verified Crunch cardio only' : 'Treadmill · recumbent bike · upper-body ergometer') + '</span></button>' +
      '<div style="height:8px"></div><button class="cta sub" data-action="cancel-session">Cancel</button>';
  }
  function buildAndStart(dayId) {
    SESSION.dayId = dayId;
    if (dayId === 'cardio') {
      SESSION.phase = 'cardio';
      SESSION.cardio = L.buildCardio(ACTIVE_PROGRAM, EX, SESSION.budgetMin);
      if (cfg.gymId === 'crunch') {
        SESSION.cardio.modalities = SESSION.cardio.modalities.filter(function (id) { return machinesForEx(id).length > 0; });
        if (!SESSION.cardio.modalities.length && EX.treadmill_steady && machinesForEx('treadmill_steady').length) SESSION.cardio.modalities = ['treadmill_steady'];
        SESSION.cardio.exId = SESSION.cardio.modalities[0] || SESSION.cardio.exId;
      }
      return renderSession();
    }
    var base = L.buildSession(ACTIVE_PROGRAM, EX, dayId, SESSION.budgetMin, {});
    SESSION.built = COACH.enhanceWorkout(base, { EX: EX, equipment: activeEquipment(), profile: trainingProfile, log: log, readiness: SESSION.readiness });
    SESSION.built = prepBuilt(SESSION.built);
    decisionLog = decisionLog.concat(SESSION.built.decisionLog || []).slice(-100);
    SESSION.idx = 0; SESSION.phase = 'preview'; persist(); renderSession();
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
    pool = pool.filter(function (e) { return machinesForEx(e.id).length > 0; });
    if (q) pool = pool.filter(function (e) { return e.name.toLowerCase().indexOf(q) >= 0 || (machinesForEx(e.id)[0] && machinesForEx(e.id)[0].name.toLowerCase().indexOf(q) >= 0); });
    SESSION.picked = (SESSION.picked || ACTIVE_PROGRAM.classic[SESSION.part].slice(0, 5)).filter(function (id) { return machinesForEx(id).length > 0; });
    if (!SESSION.picked.length) SESSION.picked = pool.slice(0, 5).map(function (exercise) { return exercise.id; });
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
      '<div class="timegrid">' + [30, 45, 60, 90, 120].map(function (m) { return '<button class="timechip" data-action="partner-go" data-min="' + m + '"><div class="big">' + m + '</div><div class="u">' + (m === 120 ? '2 hours' : 'min') + '</div></button>'; }).join('') +
      '<button class="timechip" data-action="partner-go" data-min="0"><div class="big">—</div><div class="u">no limit</div></button></div>' +
      '<button class="cta sub" data-action="partner-back">Back</button>';
  }
  function partnerGo(min) {
    var part = ACTIVE_PROGRAM.bodyParts.filter(function (p) { return p.id === SESSION.part; })[0];
    var custom = L.buildCustom(SESSION.picked, EX, min || null, part.name);
    SESSION.built = prepBuilt(COACH.enhanceWorkout(custom, { EX: EX, equipment: activeEquipment(), profile: trainingProfile, log: log, readiness: null }));
    SESSION.budgetMin = min || null; SESSION.idx = 0; SESSION.phase = 'preview'; renderSession();
  }

  function renderPreview() {
    var el = document.getElementById('s-today'), b = SESSION.built;
    var route = (b.route || []).map(function (group, index) { return '<span><b>' + (index + 1) + '</b>' + esc(zoneName(group.zoneId)) + '<small>' + group.exerciseIds.length + ' exercise' + (group.exerciseIds.length === 1 ? '' : 's') + '</small></span>'; }).join('<i aria-hidden="true">↓</i>');
    el.innerHTML = '<div class="topbar"><div class="eyebrow">Workout preview · ' + esc(activeGymName()) + '</div><button class="mini" data-action="cancel-session">Cancel</button></div>' +
      '<h1 class="day">' + esc(b.name) + '</h1><p class="sub"><b>Estimated ' + esc(b.estimatedDuration || b.estMin) + ' min</b> · ' + esc(b.durationEstimate ? b.durationEstimate.confidence : 'Calibration phase') + '</p>' +
      '<div class="panel coach-explain"><span class="eyebrow">Why today</span><p>' + esc(b.reasonSelected) + '</p><small>' + esc(b.readinessContext ? b.readinessContext.explanation : 'Normal planned session.') + '</small>' + (b.readinessContext && b.readinessContext.action === 'trim_accessory' ? '<button class="mini" data-action="restore-readiness-volume">Restore planned volume</button>' : '') + '</div>' +
      '<div class="workout-preview">' + b.slots.map(function (slot, index) { var load = slot.pre && slot.pre.weight != null ? ' · ' + wLbl(slot.pre.weight) + (slot.ex.loadMode === 'perHand' ? '/hand' : '') : ' · calibration'; var assigned = L.byId(machinesForEx(slot.exId))[slot.machineId]; return '<div class="preview-row"><span class="idx">' + (index + 1) + '</span><div><b>' + esc(slot.ex.name) + '</b><small>' + slot.sets + ' × ' + slot.ex.repRange[0] + '–' + slot.ex.repRange[1] + (slot.ex.measure === 'duration' ? ' sec' : '') + ' · ' + slot.ex.defaultRIR + ' RIR' + load + ' · ' + esc(assigned ? nameOf(assigned) : zoneName(slot.zoneId)) + (assigned && assigned.zoneId ? ' · ' + esc(zoneName(assigned.zoneId)) : '') + '</small></div></div>'; }).join('') + '</div>' +
      (route ? '<section class="route-preview"><span class="eyebrow">Workout route · training order preserved</span><div>' + route + '</div></section>' : '') +
      '<button class="cta" data-action="begin-previewed-workout">Start workout →</button>';
  }

  /* set object + fresh log */
  function newSet(weight, kind) { return { kind: kind || 'work', reps: null, weight: weight, done: false, running: false, startMs: 0, durSec: 0, durationSec: null, distance: null, restBeforeSec: null, endClock: '', clusters: [], b: null, rp: false }; }
  function freshLog(n, weight) { var a = []; for (var i = 0; i < n; i++) a.push(newSet(weight)); return a; }

  /* prepare a built session's per-slot working state */
  function prepBuilt(built) {
    built.slots.forEach(function (s, index) {
      // Every session is constrained to equipment mapped at today's selected gym.
      // If a programmed exercise is unavailable, preserve the role/sets and use the first
      // verified program alternative rather than inventing equipment.
      if (!machinesForEx(s.exId).length) {
        var replacement = (s.alt || []).filter(function (id) { return EX[id] && machinesForEx(id).length; })[0];
        if (replacement) {
          s.gymSwapFrom = s.exId;
          s.exId = replacement;
          s.ex = EX[replacement];
        }
      }
      var pre = s.ex.equipType === 'dumbbell' ? COACH.recommendLoad(s.ex, COACH.historyFor(log, s.exId, 5), trainingProfile.availableDumbbellsLb, { targetSets: s.sets, repRange: s.ex.repRange }) : L.prescribe(s.ex, lifts[s.exId]);
      var assigned = chooseMachineForExercise(s.exId, s.zoneId);
      s.machineId = assigned.machine ? assigned.machine.id : null;
      s.machineChoiceReason = assigned.reason;
      if (assigned.machine && assigned.machine.zoneId) s.zoneId = assigned.machine.zoneId;
      s.pre = pre; s.showHow = false; s.superEx = null; s.techniqueNote = ''; s.loadTests = []; s.loadTestOpen = false; s.loadTestResult = null;
      s.log = freshLog(s.sets, pre.weight);
      s.targetSets = s.sets; s.targetRepRange = s.ex.repRange.slice(); s.targetRIR = s.ex.defaultRIR; s.restRangeSec = [Math.round(s.ex.restSec * 0.8), Math.round(s.ex.restSec * 1.25)]; s.recommendedWeight = pre.weight; s.loadConfidence = pre.confidence || (pre.mode === 'calibrate' ? 'Calibration phase' : 'Some history'); s.progressionReason = pre.reason || pre.note;
      if (built.mode === 'coached') {
        COACH.warmupPlan(s.ex, pre.weight, { exerciseIndex: index }).slice().reverse().forEach(function (ramp) {
          var warm = newSet(ramp.weight, 'warmup'); warm.targetReps = ramp.targetReps; warm.rampLabel = ramp.label; s.log.unshift(warm);
        });
      }
      if (assigned.machine) built.decisionLog.push({ type: 'equipment_assigned', exerciseId: s.exId, machineId: assigned.machine.id, reasons: [assigned.reason, 'verified at ' + activeGymName()] });
    });
    built.route = routeForAssignedSlots(built.slots);
    return built;
  }

  function crunchTrainingMapHtml(activeZoneId) {
    if (cfg.gymId !== 'crunch' || !window.CRUNCH_MAP || !SESSION.showMap) return '';
    return '<section class="panel training-map" aria-label="Crunch equipment-zone map"><div class="eyebrow">Crunch route map · current stop highlighted</div><div class="map-route">' + window.CRUNCH_MAP.zones.map(function (zone, index) {
      return '<div class="map-zone ' + (zone.id === activeZoneId ? 'current' : '') + '"><span class="map-order">' + (index + 1) + '</span><div><b>' + esc(zone.name) + '</b><small>Photos ' + esc(zone.ranges.join(', ')) + '</small><p>' + esc(zone.note) + '</p></div></div>';
    }).join('') + '</div><p class="source-line">Schematic / not to scale. The highlighted zone is the station selected by the coach.</p></section>';
  }

  function supportsLoadTest(ex) {
    return ex && ex.role !== 'cardio' && ex.measure !== 'duration' && ['perSide', 'perHand', 'stack', 'assistance', 'total'].indexOf(ex.loadMode) >= 0;
  }
  function loadTestPanel(slot, ex) {
    if (!supportsLoadTest(ex)) return '';
    var result = slot.loadTestResult;
    if (!slot.loadTestOpen) {
      var heading = result && result.accepted ? 'Starting load confirmed' : (slot.pre.mode === 'calibrate' ? 'No reliable load record yet' : 'Want to verify this load?');
      var message = result && result.accepted ? wLbl(result.load) + (ex.loadMode === 'perHand' ? ' per hand' : '') + ' passed the controlled load test. It is now filled into your working sets.' : 'The coach will test a load you choose; it will not guess your strength. The test set is recorded separately and does not count as a working set.';
      return '<section class="load-test-callout ' + (result && result.accepted ? 'accepted' : '') + '"><div><span class="eyebrow">Guided load test</span><b>' + esc(heading) + '</b><small>' + esc(message) + '</small></div><button type="button" class="mini" data-action="start-load-test">' + (result && result.accepted ? 'Retest' : 'Find my load') + '</button></section>';
    }
    var draft = slot.loadTestDraft || {}, displayLoad = draft.load != null ? L.toDisplay(draft.load, cfg.units) : '';
    var feedback = result ? '<div class="load-test-result ' + esc(result.verdict) + '" role="status"><b>' + (result.accepted ? 'Right load' : (result.verdict === 'stop' ? 'Stop' : 'Adjust and retest')) + '</b><span>' + esc(result.message) + '</span></div>' : '';
    return '<section class="load-test-panel"><div class="load-test-head"><div><span class="eyebrow">Guided load test · not a working set</span><b>Test one controlled set</b></div><button type="button" class="mini" data-action="cancel-load-test">Close</button></div>' +
      '<ol><li>Choose a conservative labeled load—do not guess from another person.</li><li>Perform controlled repetitions. Stop for pain or when clean technique changes.</li><li>Report the result below; aim for ' + ex.repRange[0] + '–' + ex.repRange[1] + ' reps with 1–3 clean reps left.</li></ol>' + feedback +
      '<div class="load-test-fields"><label>Test load <span>' + cfg.units + ' · ' + esc(loadLabel(ex)) + '</span><input class="search compact" id="loadtestweight" type="number" min="0" step="any" inputmode="decimal" value="' + displayLoad + '" placeholder="Labeled load"></label>' +
      '<label>Clean reps completed<input class="search compact" id="loadtestreps" type="number" min="1" inputmode="numeric" value="" placeholder="Reps"></label>' +
      '<label>Clean reps left (RIR)<input class="search compact" id="loadtestrir" type="number" min="0" max="5" inputmode="numeric" value="" placeholder="0–5"></label>' +
      '<label>Technique stayed clean<select class="search compact" id="loadtestclean"><option value="yes" selected>Yes</option><option value="no">No</option></select></label>' +
      '<label>Any pain?<select class="search compact" id="loadtestpain"><option value="no" selected>No</option><option value="yes">Yes—stop</option></select></label></div>' +
      '<button type="button" class="cta" data-action="evaluate-load-test">Evaluate this load</button><p class="load-test-note">Rest before the next attempt. Do not repeatedly test to failure.</p></section>';
  }

  /* ---------- ACTIVE session (timed logging + how-to) ---------- */
  function sessionProgress() { var done = 0, total = 0; SESSION.built.slots.forEach(function (s) { s.log.forEach(function (x) { if (x.kind === 'warmup') return; total++; if (x.done) done++; }); }); return { done: done, total: total }; }

  function renderActive() {
    clearInterval(workInt); clearInterval(restInt);
    var el = document.getElementById('s-today'), b = SESSION.built, s = b.slots[SESSION.idx];
    var mark = focusMark(b.focusMuscles, b.slots); var pr = sessionProgress();
    var pips = ''; for (var i = 0; i < Math.min(pr.total, 26); i++) pips += '<span class="pip' + (i < pr.done ? ' on' : '') + '"></span>';
    var machines = machinesForEx(s.exId); var machSel = L.byId(machines)[s.machineId] || machines[0];
    var isPartner = SESSION.mode === 'partner';
    var ex = s.ex;
    var lastHistory = COACH.historyFor(log, s.exId, 1)[0];
    var sameZoneAhead = 0; for (var zi = SESSION.idx; zi < b.slots.length && b.slots[zi].zoneId === s.zoneId; zi++) sameZoneAhead++;
    var locationCue = s.zoneId && s.zoneId !== 'unmapped' ? '<div class="location-cue"><b>' + esc(zoneName(s.zoneId)) + '</b><span>' + (sameZoneAhead > 1 ? 'Next ' + sameZoneAhead + ' exercises stay here.' : 'Current equipment zone.') + '</span></div>' : '';

    var gymSwapNote = s.gymSwapFrom ? '<div class="coach-suggest"><span>Crunch availability swap: <b>' + esc(EX[s.gymSwapFrom] ? EX[s.gymSwapFrom].name : s.gymSwapFrom) + '</b> → <b>' + esc(ex.name) + '</b>.</span></div>' : '';
    var picker = machines.length && isPartner ? '<div class="picker"><div class="lab">Partner-led equipment choice</div><div class="machopts">' +
      machines.map(function (m) { return '<button class="macho ' + (m.id === s.machineId ? 'sel' : '') + '" data-action="pick-machine" data-machine="' + m.id + '" aria-pressed="' + (m.id === s.machineId) + '"><img src="' + m.photo + '" alt="' + esc(m.name) + '"><span class="nm">' + esc(m.name) + (cfg.gymId === 'crunch' && m.zoneId ? '<small>Zone · ' + esc(m.zoneId.replace(/-/g, ' ')) + '</small>' : '') + '</span></button>'; }).join('') + '</div>' +
      (machSel ? '<label class="fieldlabel compact" for="machinesetting">Machine setting <span>seat, pin or pad position</span></label><input class="search compact" id="machinesetting" data-machine-setting="' + esc(machSel.id) + '" value="' + esc(machineSettings[machSel.id] || '') + '" placeholder="Example: seat 4">' : '') +
      multiUse(machSel, s) + '</div>' : (machSel ? '<section class="coach-machine"><div><span class="eyebrow">Coach chose your equipment</span><b>' + esc(nameOf(machSel)) + '</b><small>' + esc(s.machineChoiceReason || 'Verified for this exercise.') + (machSel.zoneId ? ' Go to ' + esc(zoneName(machSel.zoneId)) + '.' : '') + '</small></div>' +
        (cfg.gymId === 'crunch' ? '<button type="button" class="mini" data-action="toggle-session-map" aria-expanded="' + (!!SESSION.showMap) + '">' + (SESSION.showMap ? 'Hide map' : 'Show on map') + '</button>' : '') +
        '<label class="fieldlabel compact" for="machinesetting">Your saved machine setting <span>seat, pin or pad position</span></label><input class="search compact" id="machinesetting" data-machine-setting="' + esc(machSel.id) + '" value="' + esc(machineSettings[machSel.id] || '') + '" placeholder="Example: seat 4"></section>' : '');

    var tgt = s.pre.mode === 'calibrate' ? 'find your weight' : wLbl(s.pre.weight) + (ex.loadMode === 'perHand' ? '/hand' : '');
    var repUnit = ex.measure === 'duration' ? ' sec' : '';
    var lastPerformance = lastHistory ? '<div class="last-performance"><span class="eyebrow">Last performance</span><b>' + esc(wLbl(lastHistory.weight) + (ex.loadMode === 'perHand' ? '/hand' : '')) + '</b><span>' + esc(lastHistory.reps.join(', ')) + (lastHistory.avgRIR != null ? (ex.measure === 'duration' ? ' sec' : ' reps') + ' · ~' + lastHistory.avgRIR.toFixed(1) + ' RIR' : (ex.measure === 'duration' ? ' sec' : ' reps')) + '</span></div>' : '';
    var target = '<div class="target"><span class="t">' + s.sets + ' × ' + ex.repRange[0] + '–' + ex.repRange[1] + repUnit + ' · ' + tgt + ' · ' + ex.defaultRIR + ' RIR</span><span class="note">' + esc(s.pre.note) + '</span>' + (s.pre.reason ? '<button class="why-button" type="button" data-action="toggle-why">Why?</button><p class="why-copy hidden">' + esc(s.pre.reason) + '</p>' : '') + '</div>' + lastPerformance +
      (s.pre.mode === 'reduce_suggested' ? '<div class="coach-suggest"><span>Repeated misses, not one bad day. Reduction is optional.</span><button class="mini" data-action="accept-reduction">Use ' + wLbl(s.pre.suggestedWeight) + '</button></div>' : '');

    target += gymSwapNote;
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
        locationCue + picker + crunchTrainingMapHtml(s.zoneId) + target + loadTestPanel(s, ex) + (s.liveAdvice ? '<div class="coach-suggest"><span>' + esc(s.liveAdvice.message) + '</span></div>' : '') + how +
        ((ex.settings || []).length ? '<label class="fieldlabel compact" for="exsetting">Exercise setting <span>' + esc(ex.settings.join(' · ')) + '</span></label><input class="search compact" id="exsetting" data-exercise-setting="' + esc(ex.id) + '" value="' + esc(trainingProfile.exerciseSettings[ex.id] || '') + '" placeholder="Example: bench notch 3 · neutral grip">' : '') +
        '<div class="note-field"><label class="fieldlabel" for="technote">Pain-free technique note <span>optional</span></label><input id="technote" class="search compact" data-technique-note value="' + esc(s.techniqueNote || '') + '" placeholder="Settings, comfort, or a cue that helped"></div>' +
        '<div class="sets">' + rows + '</div>' +
        '<div class="cfoot"><span class="cue"><b>Cue:</b> ' + esc(ex.cues[0]) + '</span>' + (SESSION._rest ? '<span class="rest run" id="rest-clock">Rest ' + fmtDur(SESSION._rest.left) + '</span>' : '') +
        '<button class="mini" data-action="add-warmup">+ Warm-up</button>' +
        (cfg.advanced ? '<button class="mini ' + (s.superEx ? 'busy' : '') + '" data-action="superset">' + (s.superEx ? 'Superset ✓' : '+ Superset') + '</button>' : '') +
        '<button class="mini busy" data-action="busy">Busy?</button>' +
        '<button class="next-btn" data-action="next-slot">' + (last ? 'Finish ▸' : 'Next ▸') + '</button></div></div>';
    requestAnimationFrame(pauseReducedMotion);
    if (SESSION._rest) startRestUI(SESSION._rest);
  }

  function multiUse(machine, slot) {
    if (!machine) return '';
    var others = (machine.exerciseIds || []).filter(function (id) { return id !== slot.exId && EX[id]; });
    if (!others.length) return '';
    var current = EX[slot.exId] || {};
    others.sort(function (a, b) {
      function relevance(id) {
        var ex = EX[id] || {}, score = 0;
        if ((ex.primary || []).indexOf(slot.target) >= 0) score += 4;
        if (ex.movementPattern && ex.movementPattern === current.movementPattern) score += 3;
        if (ex.role && ex.role === current.role) score += 1;
        return score;
      }
      return relevance(b) - relevance(a) || EX[a].name.localeCompare(EX[b].name);
    });
    var shown = others.slice(0, 8), remaining = others.length - shown.length;
    return '<div class="lab" style="margin:8px 0 6px">Other relevant movements here — tap to switch</div><div class="chips">' +
      shown.map(function (id) { return '<button type="button" class="chip cool tap" data-action="switch-ex" data-ex="' + id + '">' + esc(EX[id].name) + '</button>'; }).join('') + '</div>' +
      (remaining > 0 ? '<div class="tiny muted" style="margin-top:6px">' + remaining + ' more verified exercises are available in the Exercise library.</div>' : '');
  }

  function setNumber(s, i) { var n = 0; for (var j = 0; j <= i; j++) if (s.log[j].kind !== 'warmup') n++; return n; }
  function slabFor(x, s, i) { return x.kind === 'warmup' ? 'WARM' : 'SET ' + setNumber(s, i); }
  function shortName(ex) { return ex ? ex.name.split(' ')[0] : ''; }
  function loadLabel(ex) {
    return { perSide: 'per side', perHand: 'per hand', stack: 'stack', assistance: 'assistance', total: 'total load', bodyweight: 'added load' }[ex.loadMode] || 'load';
  }
  function subInputs(x, i, ex, superEx) {
    var wD = x.weight != null ? L.toDisplay(x.weight, cfg.units) : '';
    if (!superEx && ex.handedness === 'unilateral' && x.kind !== 'warmup') {
      var sides = x.sides || {}, left = sides.left || {}, right = sides.right || {};
      function sideRow(label, side, value) {
        var sw = value.weight != null ? L.toDisplay(value.weight, cfg.units) : wD;
        var measureLabel = ex.measure === 'duration' ? 'duration in seconds' : 'repetitions';
        return '<div class="side-input"><b>' + label + '</b><input type="number" inputmode="numeric" aria-label="' + label + ' ' + measureLabel + '" placeholder="' + (ex.measure === 'duration' ? 'sec' : 'reps') + '" value="' + (value.reps != null ? value.reps : '') + '" data-set="' + i + '" data-f="' + side + 'reps"><input type="number" inputmode="decimal" aria-label="' + label + ' weight per hand in ' + cfg.units + '" placeholder="load" value="' + sw + '" data-set="' + i + '" data-f="' + side + 'weight"><input class="rir" type="number" min="0" max="5" inputmode="numeric" aria-label="' + label + ' repetitions in reserve" placeholder="RIR" value="' + (value.rir != null ? value.rir : '') + '" data-set="' + i + '" data-f="' + side + 'rir"></div>';
      }
      return '<div class="subin unilateral-input">' + sideRow('L', 'l', left) + sideRow('R', 'r', right) + '<span class="x">' + cfg.units + ' per hand</span></div>';
    }
    if (!superEx && ex.measure === 'duration' && x.kind !== 'warmup') {
      return '<div class="subin"><input type="number" inputmode="numeric" aria-label="Duration in seconds" placeholder="sec" value="' + (x.durationSec != null ? x.durationSec : '') + '" data-set="' + i + '" data-f="duration"><input type="number" inputmode="decimal" aria-label="Weight per hand in ' + cfg.units + '" placeholder="load" value="' + wD + '" data-set="' + i + '" data-f="weight"><span class="x">' + cfg.units + ' ' + esc(loadLabel(ex)) + '</span><input type="number" inputmode="decimal" aria-label="Optional distance" placeholder="distance" value="' + (x.distance != null ? x.distance : '') + '" data-set="' + i + '" data-f="distance"><input class="rir" type="number" min="0" max="5" inputmode="numeric" aria-label="Repetitions in reserve" placeholder="RIR" value="' + (x.rir != null ? x.rir : '') + '" data-set="' + i + '" data-f="rir"></div>';
    }
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
      var sideSummary = x.sides ? ('L ' + x.sides.left.reps + '×' + L.toDisplay(x.sides.left.weight, cfg.units) + ' · R ' + x.sides.right.reps + '×' + L.toDisplay(x.sides.right.weight, cfg.units)) : null;
      var measured = ex.measure === 'duration' ? ((x.durationSec || reps) + ' <span class="u">sec</span>' + (x.distance != null ? ' · ' + x.distance + ' <span class="u">distance</span>' : '') + ' · ' + L.toDisplay(x.weight, cfg.units)) : (reps + ' <span class="u">reps</span> · ' + L.toDisplay(x.weight, cfg.units));
      var main = '<span class="slab">' + no + '</span><span class="setsummary">' + (sideSummary || measured) + ' <span class="u">' + cfg.units + (ex.loadMode === 'perHand' ? '/hand' : '') + '</span>';
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
    return '<div class="setrow"><span class="slab">' + no + '</span><span class="setsummary u" style="color:var(--muted2)">target ' + ex.repRange[0] + '–' + ex.repRange[1] + (ex.measure === 'duration' ? ' sec' : '') + ' · ' + wLbl(x.weight) + '</span></div>';
  }

  function howPanel(ex, detailed) {
    var steps = ex.movement && ex.movement.length ? ex.movement : HOWTO.steps(ex);
    var demoKind = (typeof DEMOS !== 'undefined') && DEMOS[ex.id];
    var controls = '<div class="motion-status" aria-live="polite"><span>View</span><strong>Playing full repetition</strong></div><div class="democontrols" aria-label="Demonstration controls"><button data-action="demo-frame" data-frame="start" aria-label="Show the start position">Start</button><button data-action="demo-toggle" aria-pressed="false" aria-label="Pause or play the demonstration">Pause</button><button data-action="demo-frame" data-frame="end" aria-label="Show the end position">End</button></div>';
    var stageLabel = '<span class="motion-stage-label"><b>Start → finish → controlled return</b><small>Highlighted joints show the movement path</small></span>';
    var media = demoKind === 'svg'
      ? '<div class="demoblock"><div class="motion-demo" data-duration="' + HOWTO.duration(ex).toFixed(2) + '" role="img" aria-label="Animated start-to-end movement demonstration for ' + esc(ex.name) + '">' + stageLabel + HOWTO.howtoSVG(ex, 'right') + '<span class="tag">exercise demonstration</span></div>' + controls + '</div>'
      : (demoKind ? '<div class="demoblock"><div class="demo" aria-label="Two-frame demonstration of ' + esc(ex.name) + '">' + stageLabel + '<img class="f1" src="assets/demos/' + ex.id + '_1.webp" alt="' + esc(ex.name) + ' finish position"><img class="f0" src="assets/demos/' + ex.id + '_0.webp" alt="' + esc(ex.name) + ' start position"><span class="tag">exercise demonstration</span></div>' + controls + '</div>'
        : '<div class="howfig" role="img" aria-label="Code-drawn movement path for ' + esc(ex.name) + '"><div class="howv">' + HOWTO.howtoSVG(ex, 'right') + '</div></div>');
    var compactCoach = '<div class="motion-copy">' + (ex.startPosition ? '<p class="motion-phase"><b>Start position</b>' + esc(ex.startPosition) + '</p>' : '') + '<ol class="steps">' + steps.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>' +
      (ex.endPosition ? '<p class="motion-phase"><b>Finish / reset</b>' + esc(ex.endPosition) + '</p>' : '') + '<div class="howmiss"><b>Don\'t:</b> ' + esc(HOWTO.wrongLabel(ex)) + '.</div></div>';
    if (!detailed) return '<div class="howwrap">' + media + compactCoach + '</div>';
    var setup = (ex.setup || []).map(function (item) { return '<li>' + esc(item) + '</li>'; }).join('');
    var firstMistake = (ex.mistakes || [])[0];
    var correction = firstMistake ? '<div class="motion-correction"><span>Watch for</span><b>' + esc(firstMistake.mistake) + '</b><p>' + esc(firstMistake.correction) + '</p></div>' : '<div class="howmiss"><b>Don\'t:</b> ' + esc(HOWTO.wrongLabel(ex)) + '.</div>';
    var coaching = '<div class="motion-coaching"><section><span class="phase-number">1</span><div><b>Set up before the first rep</b><ul>' + setup + '</ul></div></section>' +
      '<section><span class="phase-number">2</span><div><b>Own the start position</b><p>' + esc(ex.startPosition || 'Brace in a stable, repeatable starting position.') + '</p></div></section>' +
      '<section><span class="phase-number">3</span><div><b>Perform one clean rep</b><ol class="steps">' + steps.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol></div></section>' +
      '<section><span class="phase-number">4</span><div><b>Finish and reset</b><p>' + esc(ex.endPosition || 'Return under control and rebuild your brace before the next repetition.') + '</p></div></section></div>' +
      '<div class="motion-details"><p><b>Range</b>' + esc(ex.rangeOfMotion || 'Use the largest pain-free range you can control.') + '</p><p><b>Breathing</b>' + esc(ex.breathing || 'Exhale through the effort and inhale during the controlled return.') + '</p><p><b>Tempo</b>' + esc(ex.tempo || 'Move deliberately without bouncing or rushing.') + '</p></div>' +
      '<div class="motion-cues">' + (ex.cues || []).slice(0, 4).map(function (cue) { return '<span>' + esc(cue) + '</span>'; }).join('') + '</div>' + correction;
    return '<div class="howwrap detailed-how">' + media + '<div class="motion-instructions">' + coaching + '</div></div>';
  }
  function pauseReducedMotion() {
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll('.motion-demo svg').forEach(function (svg) { if (svg.pauseAnimations) { svg.pauseAnimations(); svg.setCurrentTime(0); } });
    document.querySelectorAll('.motion-demo').forEach(function (demo) { demo.classList.add('paused'); var block = demo.parentElement, btn = block && block.querySelector('[data-action=demo-toggle]'), status = block && block.querySelector('.motion-status strong'); if (btn) { btn.textContent = 'Play'; btn.setAttribute('aria-pressed', 'true'); } if (status) status.textContent = 'Start position · reduced motion'; });
  }
  window.__howtog = function (btn, i) {
    var w = btn.closest('.howwrap'); if (!w) return;
    w.querySelectorAll('.howv').forEach(function (f, j) { f.classList.toggle('hidden', j !== i); });
    w.querySelectorAll('.howtog button').forEach(function (b, j) { b.classList.toggle('on', j === i); b.classList.toggle('bad', i === 1 && j === 1); });
  };

  /* set timers */
  function startSet(i) {
    var s = SESSION.built.slots[SESSION.idx];
    if (SESSION._rest) s.log[i].restBeforeSec = Math.max(0, Math.round((Date.now() - SESSION._rest.startedAt) / 1000));
    SESSION._rest = null; clearInterval(restInt);
    s.log[i].running = true; s.log[i].startMs = Date.now();
    renderActive();
    workInt = setInterval(function () { var el = document.getElementById('tmr-' + i); if (el) el.textContent = fmtDur((Date.now() - s.log[i].startMs) / 1000); }, 500);
  }
  function endSet(i) {
    clearInterval(workInt);
    var s = SESSION.built.slots[SESSION.idx];
    var rIn = document.querySelector('#s-today input[data-set="' + i + '"][data-f="reps"]');
    var durationIn = document.querySelector('#s-today input[data-set="' + i + '"][data-f="duration"]');
    var distanceIn = document.querySelector('#s-today input[data-set="' + i + '"][data-f="distance"]');
    var wIn = document.querySelector('#s-today input[data-set="' + i + '"][data-f="weight"]');
    var rirIn = document.querySelector('#s-today input[data-set="' + i + '"][data-f="rir"]');
    var reps = durationIn && durationIn.value !== '' ? parseInt(durationIn.value, 10) : (rIn && rIn.value !== '' ? parseInt(rIn.value, 10) : null);
    if (s.ex.handedness === 'unilateral' && s.log[i].kind !== 'warmup') {
      function sideValue(prefix) {
        var rr = document.querySelector('#s-today input[data-set="' + i + '"][data-f="' + prefix + 'reps"]');
        var ww = document.querySelector('#s-today input[data-set="' + i + '"][data-f="' + prefix + 'weight"]');
        var ri = document.querySelector('#s-today input[data-set="' + i + '"][data-f="' + prefix + 'rir"]');
        return { field: rr, reps: rr && rr.value !== '' ? parseInt(rr.value, 10) : null, weight: ww && ww.value !== '' ? L.fromInput(ww.value, cfg.units) : s.log[i].weight || 0, rir: ri && ri.value !== '' ? Math.max(0, Math.min(5, parseInt(ri.value, 10))) : undefined };
      }
      var left = sideValue('l'), right = sideValue('r');
      if (!left.reps || !right.reps) { toast('Enter clean reps for both sides'); (left.reps ? right.field : left.field).focus(); s.log[i].running = true; return; }
      s.log[i].sides = { left: { reps: left.reps, weight: left.weight, rir: left.rir }, right: { reps: right.reps, weight: right.weight, rir: right.rir } };
      s.log[i].reps = Math.min(left.reps, right.reps); s.log[i].durationSec = s.ex.measure === 'duration' ? s.log[i].reps : null; s.log[i].weight = Math.max(left.weight, right.weight); s.log[i].rir = left.rir != null && right.rir != null ? Math.min(left.rir, right.rir) : undefined; s.log[i].clusters = [s.log[i].reps];
    } else {
      if (!reps) { toast('How many reps did you get?'); if (rIn) rIn.focus(); s.log[i].running = true; return; }
      s.log[i].reps = reps; s.log[i].clusters = [reps];
      if (durationIn) s.log[i].durationSec = reps;
      if (distanceIn && distanceIn.value !== '') s.log[i].distance = Number(distanceIn.value);
      if (wIn && wIn.value !== '') s.log[i].weight = L.fromInput(wIn.value, cfg.units);
      if (rirIn && rirIn.value !== '') s.log[i].rir = Math.max(0, Math.min(5, parseInt(rirIn.value, 10)));
    }
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
    s.liveAdvice = COACH.liveSetAdvice(s.ex, { repRange: s.ex.repRange, sets: s.sets }, s.log.filter(function (set) { return set.kind !== 'warmup' && set.done; }), s.log[i].restBeforeSec);
    SESSION._rest = allDone ? null : { sec: s.ex.restSec, left: s.ex.restSec, startedAt: Date.now() };
    renderActive();
    if (!allDone) toast('Logged ✓ Rest ~' + s.ex.restSec + 's, then start the next set');
  }
  function startRestUI(rest) {
    clearInterval(restInt);
    function tick() { rest.left = Math.max(0, rest.sec - Math.round((Date.now() - rest.startedAt) / 1000)); var clock = document.getElementById('rest-clock'); if (clock) clock.textContent = rest.left ? 'Rest ' + fmtDur(rest.left) : 'Target rest complete'; if (rest.left <= 0) clearInterval(restInt); }
    tick(); restInt = setInterval(tick, 1000);
  }

  /* busy / swap */
  function busy() {
    var s = SESSION.built.slots[SESSION.idx];
    var ranked = COACH.rankedAlternatives(s.ex, s.alt, EX, activeEquipment(), trainingProfile, log, s.zoneId);
    if (SESSION.mode !== 'partner') {
      if (ranked.length) {
        var automatic = ranked[0];
        swapTo(automatic.exercise.id);
        toast('Coach switched you to ' + automatic.exercise.name + ' · records stay together');
        return;
      }
      if (SESSION.idx < SESSION.built.slots.length - 1) {
        requeue();
        toast('No verified alternative here — coach moved this exercise to the end');
      } else toast('No verified alternative available. Wait for this station or end the exercise.');
      return;
    }
    if (!ranked.length) { toast('No verified same-role alternative right now — requeue this exercise'); return; }
    document.getElementById('s-today').insertAdjacentHTML('afterbegin',
      '<div class="panel fade" id="altpanel"><div class="tinfo"><div class="lab">Machine busy — swap to</div></div>' +
      ranked.map(function (item) { var a = item.exercise, m = item.equipment[0]; return '<button type="button" class="weekrow" data-action="swap" data-ex="' + a.id + '"><span class="nm" style="font-size:15px">' + esc(a.name) + '</span><span class="mus">' + esc((m ? nameOf(m) : a.equipType) + ' · ' + item.reasons.slice(0, 2).join(', ')) + '</span></button>'; }).join('') +
      '<button type="button" class="weekrow" data-action="requeue" style="border-style:dashed"><span class="nm" style="font-size:15px;color:var(--steel)">Come back later ↻</span><span class="mus">skip &amp; requeue</span></button>' +
      '<div style="height:8px"></div><button class="cta sub" data-action="close-alt">Never mind</button></div>');
    window.scrollTo(0, 0);
  }
  function swapTo(exId) {
    var s = SESSION.built.slots[SESSION.idx];
    var fromId = s.exId;
    s.exId = exId; s.ex = EX[exId]; s.alt = L.altsForExercise(exId, EX); s.showHow = false;
    var assigned = chooseMachineForExercise(exId, s.zoneId);
    s.machineId = assigned.machine ? assigned.machine.id : null; s.machineChoiceReason = assigned.reason;
    s.zoneId = (assigned.machine || {}).zoneId || 'unmapped';
    s.pre = s.ex.equipType === 'dumbbell' ? COACH.recommendLoad(s.ex, COACH.historyFor(log, exId, 5), trainingProfile.availableDumbbellsLb, { targetSets: s.sets }) : L.prescribe(s.ex, lifts[exId]); s.superEx = null; s.loadTests = []; s.loadTestOpen = false; s.loadTestResult = null;
    s.log = freshLog(s.sets, s.pre.weight);
    var key = fromId + '>' + exId; trainingProfile.preferences.substitutionCounts[key] = Number(trainingProfile.preferences.substitutionCounts[key] || 0) + 1;
    var decision = { type: 'exercise_swap', from: fromId, to: exId, machineId: s.machineId, reasons: ['equipment marked busy', 'verified alternative', s.ex.pattern === EX[fromId].pattern ? 'same movement pattern' : 'same intended muscle/training role'] };
    decisionLog.push(decision); decisionLog = decisionLog.slice(-100); SESSION.built.decisionLog.push(decision); SESSION.built.route = routeForAssignedSlots(SESSION.built.slots); persist();
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
  function nextSlot() {
    var current = SESSION.built.slots[SESSION.idx];
    if (current && !current.log.some(function (set) { return set.kind !== 'warmup' && set.done; })) {
      trainingProfile.preferences.skippedCounts[current.exId] = Number(trainingProfile.preferences.skippedCounts[current.exId] || 0) + 1;
      SESSION.built.decisionLog.push({ type: 'exercise_skipped', exerciseId: current.exId, reasons: ['advanced without a completed working set'] });
      persist();
    }
    if (SESSION.idx + 1 < SESSION.built.slots.length) { SESSION.idx++; SESSION._rest = null; renderActive(); window.scrollTo(0, 0); } else { SESSION.phase = 'summary'; renderSummary(); }
  }

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
    requestAnimationFrame(pauseReducedMotion);
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
    var entry = { day: SESSION.built.dayId, mode: SESSION.mode, gymId: cfg.gymId, goal: trainingProfile.goal, budgetMin: SESSION.budgetMin || null, readiness: SESSION.readiness || null, exercises: [], felt: SESSION.felt || null, note: SESSION.note || '', sessionDurationSec: SESSION.startedAt ? Math.max(1, Math.round((Date.now() - SESSION.startedAt) / 1000)) : null, decisions: (SESSION.built.decisionLog || []).slice() };
    SESSION.built.slots.forEach(function (s) {
      var work = s.log.filter(function (x) { return x.kind !== 'warmup' && x.done && x.reps > 0; });
      var sets = work.map(function (x) { return { reps: x.reps, durationSec: x.durationSec != null ? x.durationSec : undefined, distance: x.distance != null ? x.distance : undefined, weight: x.weight || 0, weightPerHand: s.ex.loadMode === 'perHand' ? x.weight || 0 : undefined, loadMode: s.ex.loadMode, rir: x.rir != null ? x.rir : undefined, sides: x.sides || undefined, restBeforeSec: x.restBeforeSec != null ? x.restBeforeSec : undefined, durSec: Math.round(x.durSec), endClock: x.endClock, clusters: (x.clusters && x.clusters.length > 1) ? x.clusters : undefined }; });
      if (sets.length) {
        var sideSets = s.ex.handedness === 'unilateral' ? { left: work.filter(function (x) { return x.sides; }).map(function (x) { return x.sides.left; }), right: work.filter(function (x) { return x.sides; }).map(function (x) { return x.sides.right; }) } : undefined;
        entry.exercises.push({ exId: s.exId, exerciseVariation: s.ex.name, loadMode: s.ex.loadMode, machineId: s.machineId, machineChoiceReason: s.machineChoiceReason || '', machineSetting: s.machineId ? machineSettings[s.machineId] || '' : '', exerciseSetting: trainingProfile.exerciseSettings[s.exId] || '', techniqueNote: s.techniqueNote || '', loadTests: (s.loadTests || []).slice(), sideSets: sideSets, sets: sets }); lifts[s.exId] = L.updateLift(lifts[s.exId], s.ex, sets);
        var restSamples = sets.filter(function (set) { return set.restBeforeSec != null; }).map(function (set) { return set.restBeforeSec; });
        if (restSamples.length) trainingProfile.typicalRestSec[s.exId] = Math.round(restSamples.reduce(function (sum, value) { return sum + value; }, 0) / restSamples.length);
        trainingProfile.typicalExerciseSec[s.exId] = Math.round(work.reduce(function (sum, set) { return sum + Number(set.durSec || 0); }, 0));
      }
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
      case 'readiness': return renderReadiness();
      case 'focus': return renderFocus();
      case 'part': return renderPart();
      case 'compose': return renderCompose();
      case 'ptime': return partnerTime();
      case 'preview': return renderPreview();
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
      '<div class="panel schedule-panel">' + frequencyPicker() + '</div>' +
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

  /* ---------- EQUIPMENT / multi-gym verified guides ---------- */
  var equipmentFilter = 'All', equipmentQuery = '', equipmentZoneFilter = 'All';
  var equipmentView = 'equipment', exerciseFilter = 'All', exerciseMuscle = 'All';
  function exerciseEquipmentGroup(ex) {
    if (ex.equipType === 'dumbbell') return 'Dumbbell';
    if (ex.equipType === 'selectorized' || ex.equipType === 'plate') return 'Machines';
    if (ex.equipType === 'cable') return 'Cable';
    if (ex.equipType === 'smith') return 'Smith';
    if (ex.equipType === 'bodyweight') return 'Bodyweight';
    if (ex.equipType === 'cardio') return 'Cardio';
    return 'Other';
  }
  function libraryToggle() {
    return '<div class="library-toggle" role="group" aria-label="Browse equipment or exercises"><button data-action="equipment-view" data-view="equipment" class="' + (equipmentView === 'equipment' ? 'on' : '') + '">Equipment</button><button data-action="equipment-view" data-view="exercises" class="' + (equipmentView === 'exercises' ? 'on' : '') + '">Exercises</button></div>';
  }
  function crunchMapHtml() {
    if (cfg.gymId !== 'crunch' || !window.CRUNCH_MAP) return '';
    var map = window.CRUNCH_MAP;
    return '<details class="panel gym-map"><summary><span><b>Crunch equipment-zone map</b><small>Schematic / not to scale · open map</small></span><i aria-hidden="true">⌄</i></summary><div class="map-content"><p class="lede" style="margin-bottom:12px">' + esc(map.method) + '</p>' +
      '<div class="map-route"><button type="button" class="map-zone map-all ' + (equipmentZoneFilter === 'All' ? 'on' : '') + '" data-action="equipment-zone" data-zone="All"><span class="map-order">◎</span><div><b>All Crunch zones</b><small>Show the complete verified inventory</small></div></button>' + map.zones.map(function (z, i) {
        return '<button type="button" class="map-zone ' + (equipmentZoneFilter === z.id ? 'on' : '') + '" data-action="equipment-zone" data-zone="' + esc(z.id) + '"><span class="map-order">' + (i + 1) + '</span><div><b>' + esc(z.name) + '</b><small>Photos ' + esc(z.ranges.join(', ')) + '</small><p>' + esc(z.note) + '</p></div></button>';
      }).join('') + '</div>' +
      '<p class="source-line">EXIF audit: ' + map.exif.photoCount + ' unique photos · median GPS horizontal error ' + map.exif.gpsMedianErrorM + ' m · range ' + map.exif.gpsMinErrorM + '–' + map.exif.gpsMaxErrorM + ' m. GPS is therefore used only to anchor the venue, not individual machines.</p></div></details>';
  }
  function renderEquipment() {
    if (equipmentView === 'exercises') return renderExerciseLibrary();
    var el = document.getElementById('s-equipment');
    var guides = activeGuides();
    var categories = ['All', 'Push', 'Pull', 'Legs', 'Core', 'Full Body', 'Cardio'];
    var q = equipmentQuery.trim().toLowerCase();
    var list = guides.filter(function (guide) {
      var inCategory = equipmentFilter === 'All' || guide.category === equipmentFilter;
      var photoTerms = (guide.photos || []).map(function (p) {
        var displayNumber = p.number === 0 ? 1 : p.number;
        return p.filename + ' photo ' + displayNumber + ' image ' + displayNumber + ' eq' + displayNumber;
      });
      var haystack = [guide.identity, guide.purpose, guide.movementPattern, guide.zoneId || ''].concat(guide.aliases || [], photoTerms).join(' ').toLowerCase();
      var inZone = equipmentZoneFilter === 'All' || guide.zoneId === equipmentZoneFilter;
      return inCategory && inZone && (!q || haystack.indexOf(q) >= 0);
    });
    var totalPhotos = cfg.gymId === 'crunch' && window.CRUNCH_GYM ? window.CRUNCH_GYM.photoCount : 51;
    el.innerHTML = '<div class="eyebrow">' + guides.length + ' verified/model-level guides · ' + totalPhotos + ' source photos</div><h1 class="day">Equipment</h1>' + libraryToggle() +
      gymContextBar() +
      '<p class="lede">' + (cfg.gymId === 'crunch' ? 'Crunch guides are built from the September 22 photo audit. Repeated sightings of the same model are grouped, and uncertain machines are not auto-prescribed.' : 'Every original-gym photo is mapped. Alternate angles stay together, and shared-room views are explicitly cross-referenced.') + '</p>' +
      crunchMapHtml() +
      '<label class="fieldlabel" for="eqsearch">Search by machine or filename</label><input class="search" id="eqsearch" value="' + esc(equipmentQuery) + '" placeholder="Try pulldown, chest press, or IMG_2147" oninput="window.__eqSearch(this.value)">' +
      '<div class="bodyparts" aria-label="Equipment categories">' + categories.map(function (category) { var sample = guides.filter(function (g) { return g.category === category; })[0]; return '<button class="bp ' + (category === equipmentFilter ? 'on' : '') + '" data-action="equipment-filter" data-cat="' + category + '" style="--category:' + (category === 'All' ? 'var(--ember)' : (sample || {}).categoryColor) + '">' + category + '</button>'; }).join('') + '</div>' +
      '<div class="result-count" aria-live="polite">' + list.length + ' guide' + (list.length === 1 ? '' : 's') + ' at ' + esc(activeGymName()) + '</div>' +
      '<div class="eqgrid">' + list.map(function (guide) {
        var nickname = eqNames[guide.id], firstPhoto = (guide.photos || [])[0] || {};
        return '<button class="eqcard verified" data-action="open-eq" data-eq="' + guide.id + '" style="--category:' + guide.categoryColor + '">' +
          (firstPhoto.webp ? '<img src="' + firstPhoto.webp + '" alt="' + esc(firstPhoto.alt || guide.identity) + '" loading="lazy">' : '<span class="shot ph">NO PHOTO</span>') +
          '<span class="b"><span class="guide-label">' + esc(guide.category) + ' · ' + (guide.autoEligible === false ? 'Manual only' : 'Coach eligible') + '</span><span class="nm">' + esc(guide.identity) + '</span>' +
          (nickname ? '<span class="nickname">“' + esc(nickname) + '”</span>' : '') +
          '<span class="ty">' + esc(guide.evidence.confidence) + ' confidence · ' + (guide.photos || []).length + ' source view' + ((guide.photos || []).length === 1 ? '' : 's') + (guide.zoneId ? ' · ' + esc(guide.zoneId.replace(/-/g, ' ')) : '') + '</span></span></button>';
      }).join('') + '</div>';
  }
  window.__eqSearch = function (value) { equipmentQuery = value; renderEquipment(); var field = document.getElementById('eqsearch'); if (field) { field.focus(); field.setSelectionRange(value.length, value.length); } };

  function renderExerciseLibrary() {
    var el = document.getElementById('s-equipment');
    var types = ['All', 'Dumbbell', 'Machines', 'Cable', 'Smith', 'Bodyweight', 'Cardio'];
    var muscles = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Full Body'];
    var available = {};
    activeEquipment().forEach(function (item) { (item.exerciseIds || []).forEach(function (id) { available[id] = true; }); });
    var q = equipmentQuery.trim().toLowerCase();
    var list = Object.keys(EX).map(function (id) { return EX[id]; }).filter(function (ex) {
      var type = exerciseEquipmentGroup(ex);
      var typeMatch = exerciseFilter === 'All' || type === exerciseFilter;
      var familyMatch = exerciseMuscle === 'All' || ex.family === exerciseMuscle || (exerciseMuscle === 'Arms' && (ex.primary || []).some(function (m) { return m === 'biceps' || m === 'triceps' || m === 'forearms'; }));
      var muscleTerms = (ex.primary || []).concat(ex.secondary || []).map(function (m) { return MU[m] ? MU[m].name : m; });
      var haystack = [ex.name, ex.family, ex.pattern, ex.equipType, type, ex.purpose, ex.why].concat(muscleTerms, ex.usefulFor || []).join(' ').toLowerCase();
      return typeMatch && familyMatch && (!q || haystack.indexOf(q) >= 0) && available[ex.id];
    }).sort(function (a, b) { return String(a.family || '').localeCompare(String(b.family || '')) || a.name.localeCompare(b.name); });
    var dumbbellCount = Object.keys(EX).filter(function (id) { return EX[id].equipType === 'dumbbell'; }).length;
    el.innerHTML = '<div class="eyebrow">' + dumbbellCount + ' coached dumbbell movements · ' + Object.keys(EX).length + ' total exercises</div><h1 class="day">Exercises</h1>' + libraryToggle() +
      gymContextBar() +
      '<p class="lede">Browse by movement, muscle or equipment. Results show only exercises mapped to verified equipment at ' + esc(activeGymName()) + '.</p>' +
      '<label class="fieldlabel" for="eqsearch">Search exercise, muscle, movement or equipment</label><input class="search" id="eqsearch" value="' + esc(equipmentQuery) + '" placeholder="Try rear delt, hamstrings, curl, press, or dumbbell" oninput="window.__eqSearch(this.value)">' +
      '<div class="bodyparts" aria-label="Exercise equipment filters">' + types.map(function (type) { return '<button class="bp ' + (exerciseFilter === type ? 'on' : '') + '" data-action="exercise-filter" data-cat="' + type + '">' + type + '</button>'; }).join('') + '</div>' +
      (exerciseFilter === 'Dumbbell' ? '<div class="bodyparts muscle-filters" aria-label="Dumbbell muscle filters">' + muscles.map(function (family) { return '<button class="bp ' + (exerciseMuscle === family ? 'on' : '') + '" data-action="exercise-muscle" data-muscle="' + family + '">' + family + '</button>'; }).join('') + '</div>' : '') +
      '<div class="result-count" aria-live="polite">' + list.length + ' exercise' + (list.length === 1 ? '' : 's') + ' available at ' + esc(activeGymName()) + '</div>' +
      '<div class="exercise-grid">' + list.map(function (ex) {
        var loc = machinesForEx(ex.id)[0], load = ex.loadMode === 'perHand' ? 'per hand' : (ex.loadMode || 'reps');
        return '<button class="exercise-card" data-action="open-ex" data-ex="' + ex.id + '" style="--category:' + (ex.equipType === 'dumbbell' ? 'var(--full)' : 'var(--steel)') + '"><span class="exercise-kind">' + esc(ex.family || 'Training') + ' · ' + esc(exerciseEquipmentGroup(ex)) + '</span><b>' + esc(ex.name) + '</b><span>' + esc((ex.primary || []).map(function (m) { return MU[m] ? MU[m].name : m; }).join(' + ')) + '</span><small>' + ex.sets + ' × ' + ex.repRange[0] + '–' + ex.repRange[1] + (ex.measure === 'duration' ? ' sec' : '') + ' · ' + ex.defaultRIR + ' RIR' + (ex.equipType === 'dumbbell' ? ' · ' + load : '') + (loc && loc.zoneId ? ' · ' + esc(zoneName(loc.zoneId)) : '') + '</small></button>';
      }).join('') + '</div>';
  }

  function listText(items) { return (items || []).map(function (item) { return '<li>' + esc(item) + '</li>'; }).join(''); }
  function latestPerformance(ex, history) {
    if (!history.length) return '<p class="sub">No completed sessions yet. Use the calibration guidance; the coach will not invent a starting weight.</p>';
    var last = history[history.length - 1];
    return '<p><b>' + wLbl(last.weight) + (ex.loadMode === 'perHand' ? '/hand' : '') + '</b> · ' + last.reps.join(', ') + (ex.measure === 'duration' ? ' sec' : ' reps') + (last.avgRIR == null ? '' : ' · ' + (Math.round(last.avgRIR * 10) / 10) + ' avg RIR') + '<br><small>' + esc(last.date) + '</small></p>';
  }

  function openExercise(id) {
    var ex = EX[id], el = document.getElementById('s-equipment');
    if (!ex) return;
    if (!machinesForEx(id).length) {
      equipmentView = 'exercises';
      history.replaceState(null, '', '#/equipment');
      renderExerciseLibrary();
      toast(ex.name + ' is not mapped at ' + activeGymName());
      return;
    }
    equipmentView = 'exercises';
    var exerciseHistory = COACH.historyFor(log, ex.id);
    var recommendation = ex.equipType === 'dumbbell' ? COACH.recommendLoad(ex, exerciseHistory, trainingProfile.availableDumbbellsLb, { targetSets: ex.sets, repRange: ex.repRange }) : null;
    var trend = COACH.performanceTrend(exerciseHistory), plateau = COACH.plateauStatus(ex, exerciseHistory), records = COACH.recordsFor(ex, exerciseHistory);
    var equipment = machinesForEx(ex.id), primary = (ex.primary || []).map(function (m) { return MU[m] ? MU[m].name : m; }), secondary = (ex.secondary || []).map(function (m) { return MU[m] ? MU[m].name : m; });
    var mark = markFromMuscles(ex.primary, ex.secondary), preference = trainingProfile.preferences.preferred[ex.id] ? 'preferred' : (trainingProfile.preferences.avoided[ex.id] ? 'avoided' : 'neutral');
    var errors = (ex.mistakes || []).map(function (item) { return '<div class="correction"><b>' + esc(item.mistake) + '</b><span>' + esc(item.correction) + '</span></div>'; }).join('');
    var substitutes = (ex.equipmentSubstitutes || []).filter(function (item) { return machinesForEx(item.id).length > 0; }).map(function (item) { var sx = EX[item.id]; return '<div class="correction"><b>' + esc(sx ? sx.name : item.id.replace(/_/g, ' ')) + '</b><span>' + esc(item.note) + '</span></div>'; }).join('');
    var locationPhotos = equipment.map(function (item) { return '<div class="location-equipment">' + shot(item) + '<div><b>' + esc(nameOf(item)) + '</b><small>' + (item.zoneId ? esc(zoneName(item.zoneId)) : esc(activeGymName())) + '</small></div></div>'; }).join('');
    var exerciseAlternatives = (ex.alternatives || []).filter(function (aid) { return EX[aid] && machinesForEx(aid).length > 0; }).map(function (aid) { return '<button class="chip cool tap" data-action="open-ex" data-ex="' + aid + '">' + esc(EX[aid].name) + '</button>'; }).join('');
    var recordRows = Object.keys(records).filter(function (key) { return records[key] > 0; }).map(function (key) { var label = key.replace(/([A-Z])/g, ' $1').replace(/^./, function (c) { return c.toUpperCase(); }); var val = key === 'bestVolume' ? Math.round(records[key]) + ' lb-reps' : (key.toLowerCase().indexOf('weight') >= 0 || key === 'bestEstimatedStrength' || key === 'heaviestCarry' ? wLbl(Math.round(records[key] * 10) / 10) : Math.round(records[key] * 10) / 10); return '<div class="record"><span>' + esc(label) + '</span><b>' + esc(val) + '</b></div>'; }).join('');
    var progression = ex.progression || {};
    el.innerHTML = '<button class="mini" data-action="exercise-back">‹ Exercise library</button><article class="exercise-detail">' +
      '<header class="exercise-hero"><span class="guide-label">' + esc(ex.family) + ' · ' + esc(exerciseEquipmentGroup(ex)) + ' · ' + esc(ex.role) + '</span><h1>' + esc(ex.name) + '</h1><p>' + esc(ex.purpose) + '</p><div class="guide-meta"><span>' + esc(ex.pattern.replace(/_/g, ' ')) + '</span><span>' + esc(ex.handedness || 'bilateral') + '</span><span>' + esc(ex.difficulty || 'all levels') + '</span>' + (ex.loadMode === 'perHand' ? '<span>load · per hand</span>' : '') + '</div></header>' +
      '<section class="panel muscle-visual"><div class="muscle-figures"><div>' + FIGURE.figureSVG('front', { mark: mark }) + '<small>Front</small></div><div>' + FIGURE.figureSVG('back', { mark: mark }) + '<small>Back</small></div></div><div><span class="eyebrow">Primary</span><p><b>' + esc(primary.join(' · ')) + '</b></p><span class="eyebrow">Secondary / stabilizing</span><p>' + esc(secondary.join(' · ') || 'No additional region listed') + '</p><small class="legend"><i></i> Primary <i></i> Secondary</small></div></section>' +
      '<section class="guide-section"><h2>What does this achieve?</h2><p>' + esc(ex.purpose) + '</p><h3>Why choose it</h3><p>' + esc(ex.why) + '</p><div class="guide-cues">' + (ex.usefulFor || []).map(function (item) { return '<span>' + esc(item) + '</span>'; }).join('') + '</div></section>' +
      '<section class="guide-section exercise-motion"><h2>How to perform it</h2><p class="motion-intro">Watch the full repetition, then use Start and End to inspect each position before you lift.</p>' + howPanel(ex, true) + '</section>' +
      '<section class="guide-section"><h2>Setup & movement</h2><div class="detail-columns"><div><span class="eyebrow">Setup</span><ol class="checklist">' + listText(ex.setup) + '</ol></div><div><span class="eyebrow">Range of motion</span><p>' + esc(ex.rangeOfMotion) + '</p><span class="eyebrow">Breathing</span><p>' + esc(ex.breathing) + '</p><span class="eyebrow">Tempo</span><p>' + esc(ex.tempo) + '</p></div></div><div class="guide-cues">' + (ex.cues || []).map(function (cue) { return '<span>' + esc(cue) + '</span>'; }).join('') + '</div></section>' +
      '<section class="guide-section"><h2>Common mistakes → corrections</h2>' + errors + '</section>' +
      '<aside class="safety-note"><span class="eyebrow">Safety</span><ul>' + listText(ex.safety) + '</ul><small>Stop for sharp pain, faintness, chest pain, or unusual shortness of breath. This is exercise education, not diagnosis or rehabilitation.</small></aside>' +
      '<section class="guide-section target-panel"><h2>Your target</h2><div class="target-stats"><b>' + ex.sets + ' × ' + ex.repRange[0] + '–' + ex.repRange[1] + (ex.measure === 'duration' ? ' sec' : '') + '</b><span>' + ex.defaultRIR + ' RIR</span><span>' + Math.round(ex.restSec / 60 * 10) / 10 + ' min rest</span></div><p><b>RIR</b> means clean repetitions still possible before failure. Most work here stays around 1–3 RIR so technique remains stable.</p><p><b>Load:</b> ' + esc(ex.weightSemantics ? ex.weightSemantics.note : (ex.pickWeight || 'Choose a controlled training load.')) + '</p><p><b>First session:</b> ' + esc(ex.calibration || ex.pickWeight) + '</p></section>' +
      (recommendation ? '<section class="guide-section coach-detail"><span class="eyebrow">Today · ' + esc(recommendation.confidence) + '</span><h2>' + esc(recommendation.note) + '</h2><p>' + esc(recommendation.reason) + '</p><div class="last-performance"><span class="eyebrow">Last performance</span>' + latestPerformance(ex, exerciseHistory) + '</div><p><b>Trend:</b> ' + esc(trend.summary) + '</p><p><b>Plateau check:</b> ' + esc(plateau.reason) + '</p></section>' : '') +
      '<section class="guide-section"><h2>Progression rules</h2><div class="progression-rules"><p><b>Increase</b>' + esc(progression.increase) + '</p><p><b>Keep the same</b>' + esc(progression.hold) + '</p><p><b>Decrease</b>' + esc(progression.decrease) + '</p></div></section>' +
      (recordRows ? '<section class="guide-section"><h2>Personal records</h2><div class="records-grid">' + recordRows + '</div>' + (ex.role !== 'compound' ? '<p class="source-line">Estimated one-rep max is intentionally not emphasized for isolation/accessory work.</p>' : '') + '</section>' : '') +
      '<section class="guide-section"><h2>Placement & suitability</h2><p>' + esc(ex.placement) + '</p><p><b>Level:</b> ' + esc(ex.difficulty) + ' · <b>Training role:</b> ' + esc(ex.role) + '</p></section>' +
      '<section class="guide-section"><h2>Alternatives</h2><div class="chips">' + (exerciseAlternatives || '<span class="sub">No direct exercise alternative is recommended for this movement.</span>') + '</div><h3>Equipment substitutions are not identical</h3>' + (substitutes || '<p class="sub">No machine is treated as a close substitute. Use a listed exercise alternative only when it preserves today’s training purpose.</p>') + '</section>' +
      '<section class="guide-section location-panel"><span class="eyebrow">Equipment-location photograph · not the movement demo</span><h2>' + esc(activeGymName()) + ' location</h2>' + (equipment.length ? '<p>' + (cfg.gymId === 'crunch' ? 'Go to <b>' + esc(zoneName(equipment[0].zoneId)) + '</b>. The schematic zone and photo sequence guide you; indoor GPS is not used as a machine coordinate.' : 'Use one of the mapped stations below.') + '</p>' + locationPhotos : '<p class="sub">No verified station mapping at this gym. Choose a verified alternative rather than assuming availability.</p>') + '</section>' +
      '<section class="guide-section"><h2>Your preference</h2><p class="sub">Preferences influence equivalent-choice ranking; safety and program role still come first.</p><div class="preference-controls" role="group" aria-label="Exercise preference"><button data-action="exercise-preference" data-pref="preferred" data-ex="' + ex.id + '" class="' + (preference === 'preferred' ? 'on' : '') + '">Prefer</button><button data-action="exercise-preference" data-pref="neutral" data-ex="' + ex.id + '" class="' + (preference === 'neutral' ? 'on' : '') + '">Neutral</button><button data-action="exercise-preference" data-pref="avoided" data-ex="' + ex.id + '" class="' + (preference === 'avoided' ? 'on' : '') + '">Avoid</button></div></section>' +
      '<section class="guide-section"><label class="fieldlabel" for="detailsetting">Exercise setup note <span>bench angle, notch, grip, or side</span></label><input class="search" id="detailsetting" data-exercise-setting="' + ex.id + '" value="' + esc(trainingProfile.exerciseSettings[ex.id] || '') + '" placeholder="' + esc((ex.settings || []).join(' · ') || 'Optional repeatable setup') + '"></section>' +
      '</article>';
    if (location.hash !== '#/exercise/' + encodeURIComponent(ex.id)) history.replaceState(null, '', '#/exercise/' + encodeURIComponent(ex.id));
    window.scrollTo(0, 0);
    requestAnimationFrame(pauseReducedMotion);
  }

  function openEquipment(id) {
    var guides = activeGuides(), equipmentIndex = L.byId(activeEquipment());
    var guide = L.byId(guides)[id] || guides.filter(function (g) { return g.slug === id; })[0];
    if (!guide) return;
    var e = equipmentIndex[guide.id], el = document.getElementById('s-equipment');
    var callouts = (guide.callouts || []).map(function (c) { return '<span class="callout ' + (c.x > 65 ? 'left' : '') + '" style="left:' + c.x + '%;top:' + c.y + '%" aria-label="Callout: ' + esc(c.label) + '"><i>' + esc(c.label) + '</i></span>'; }).join('');
    var photos = (guide.photos || []).map(function (photo, index) {
      return '<figure class="guide-photo"><div class="photo-stage"><img src="' + photo.webp + '" alt="' + esc(photo.alt) + '" loading="lazy">' + (index === 0 ? callouts : '') + '</div><figcaption>' + esc(photo.filename) + (photo.crossReference ? ' · cross-referenced view' : '') + '</figcaption></figure>';
    }).join('');
    var steps = (guide.execution || []).map(function (step) { return '<li><b>' + esc(step.phase) + '</b><span>' + esc(step.instruction) + '</span></li>'; }).join('');
    var checks = (guide.adjustmentsAndChecks || []).map(function (item) { return '<li>' + esc(item) + '</li>'; }).join('');
    var mistakes = (guide.mistakes || []).map(function (item) { return '<div class="correction"><b>' + esc(item.mistake) + '</b><span>' + esc(item.correction) + '</span></div>'; }).join('');
    var nickname = eqNames[guide.id] || '';
    el.innerHTML = '<button class="mini" data-action="equipment-back">‹ ' + esc(activeGymName()) + ' equipment</button>' +
      '<article class="guide-detail" style="--category:' + guide.categoryColor + '"><header class="guide-head"><span class="guide-label">' + esc(guide.category) + ' · ' + esc(activeGymName()) + (guide.autoEligible === false ? ' · manual only' : ' · coach eligible') + '</span><h1>' + esc(guide.identity) + '</h1>' +
      (nickname ? '<p class="nickname">Personal nickname · “' + esc(nickname) + '”</p>' : '') + '<p>' + esc(guide.purpose) + '</p><div class="guide-meta"><span>' + esc(guide.movementPattern) + '</span><span>' + esc(guide.difficulty) + '</span><span>' + esc(guide.evidence.confidence) + ' confidence</span>' + (guide.zoneId ? '<span>Zone · ' + esc(guide.zoneId.replace(/-/g, ' ')) + '</span>' : '') + '</div></header>' +
      '<div class="guide-carousel" aria-label="Source photo carousel">' + photos + '</div>' +
      '<div class="evidence"><span class="eyebrow">Identity evidence</span><p>' + esc(guide.evidence.summary) + '</p></div>' +
      '<section class="guide-section muscle-block"><div><span class="eyebrow">Primary</span><b>' + esc(guide.muscles.primary) + '</b></div><div><span class="eyebrow">Secondary</span><b>' + esc(guide.muscles.secondary) + '</b></div></section>' +
      '<section class="guide-section"><h2>Adjust & check</h2><ol class="checklist">' + checks + '</ol></section>' +
      '<section class="guide-section"><h2>Start → movement → finish</h2><ol class="phase-list">' + steps + '</ol><div class="guide-cues">' + (guide.cues || []).map(function (cue) { return '<span>' + esc(cue) + '</span>'; }).join('') + '</div></section>' +
      '<section class="guide-section split"><div><span class="eyebrow">Breathing</span><p>' + esc(guide.breathing) + '</p></div><div><span class="eyebrow">Tempo & range</span><p>' + esc(guide.tempo) + '. ' + esc(guide.rangeOfMotion) + '</p></div></section>' +
      '<section class="guide-section"><h2>Mistakes → corrections</h2>' + mistakes + '</section>' +
      '<aside class="safety-note"><span class="eyebrow">Safety</span><p>' + esc(guide.safety) + '</p><small>Stop if you feel sharp pain, chest pain, faintness, or unusual shortness of breath. This guide is education, not rehabilitation.</small></aside>' +
      '<section class="guide-section program-block"><div><span class="eyebrow">Programming</span><p>' + esc(guide.programming) + '</p></div><div><span class="eyebrow">Progression</span><p>' + esc(guide.progression) + '</p></div><div><span class="eyebrow">Workout placement</span><p>' + esc(guide.workoutPlacement) + '</p></div><div><span class="eyebrow">Alternatives</span><p>' + ((guide.alternatives || []).length ? guide.alternatives.map(esc).join(' · ') : 'Use another coach-eligible machine for the same exercise or movement pattern.') + '</p></div></section>' +
      '<section class="guide-section nickname-editor"><label class="fieldlabel" for="eqrename">Personal nickname <span>optional · authoritative identity stays unchanged</span></label><div class="inline-field"><input class="search" id="eqrename" value="' + esc(nickname) + '" placeholder="Your name for this machine"><button class="mini" data-action="save-eqname" data-eq="' + guide.id + '">Save</button></div></section>' +
      ((((e && e.exerciseIds) || guide.linkedExerciseIds || []).length) ? '<section class="guide-section"><h2>Linked exercise demos</h2>' + ((e && e.exerciseIds) || guide.linkedExerciseIds || []).map(function (xid) { var ex = EX[xid]; if (!ex) return ''; var gp = ex.loadMode === 'duration' ? '5–30 min · continuous or intervals' : ex.repRange[0] + '–' + ex.repRange[1] + ' reps · ' + ex.sets + ' sets'; return '<div class="card"><div class="chead" style="padding:14px"><div><div class="cnum">' + esc(ex.primary.map(function (m) { return MU[m] ? MU[m].name : m; }).join(' + ')) + '</div><div class="cname">' + esc(ex.name) + '</div><div class="ctag">' + gp + '</div></div><button class="mini" data-action="open-ex" data-ex="' + ex.id + '">Full guide</button></div>' + howPanel(ex) + '</div>'; }).join('') + '</section>' : '') +
      '<p class="source-line">Source photos · ' + (guide.photos || []).map(function (p) { return esc(p.filename); }).join(' · ') + '</p></article>';
    if (location.hash !== '#/equipment/' + guide.slug) history.replaceState(null, '', '#/equipment/' + guide.slug);
    window.scrollTo(0, 0);
    requestAnimationFrame(pauseReducedMotion);
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
    var dumbbellInsights = Object.keys(EX).filter(function (id) { return EX[id].equipType === 'dumbbell'; }).map(function (id) { var h = COACH.historyFor(log, id, 5); return { ex: EX[id], history: h, trend: COACH.performanceTrend(h), plateau: COACH.plateauStatus(EX[id], h) }; }).filter(function (item) { return item.history.length >= 2; }).sort(function (a, b) { return b.history.length - a.history.length; }).slice(0, 5);
    var durationSamples = Object.keys(log).map(function (date) { return Number(log[date].sessionDurationSec || 0); }).filter(function (seconds) { return seconds > 0; }).slice(-8);
    var averageDuration = durationSamples.length ? Math.round(durationSamples.reduce(function (sum, seconds) { return sum + seconds; }, 0) / durationSamples.length / 60) : null;
    var volRows = MUSCLES.slice().sort(function (a, b) { return (heat[b.id] || 0) - (heat[a.id] || 0); }).map(function (m) {
      var got = wk[m.id] ? wk[m.id].sets : 0, range = programRange(m.id), ratio = Math.min(1, got / range[1]), pct = Math.round(ratio * 100);
      return '<div class="volrow"><span class="nm">' + esc(m.name) + '</span><div class="volbar"><i style="width:' + pct + '%;background:' + FIGURE.heatColor(ratio) + '"></i></div><span class="c">' + (Math.round(got * 10) / 10) + ' / ' + range[0] + '–' + range[1] + '</span></div>';
    }).join('');
    el.innerHTML = '<div class="eyebrow">Consistency, history & records</div><h1 class="day">Progress</h1><p class="lede">Progress rewards completing the schedule you chose—not chasing raw set volume.</p>' +
      '<div class="stats"><div class="stat"><div class="v">' + consistency.completed + '/' + consistency.target + '</div><div class="k">This week</div></div><div class="stat"><div class="v">' + sessions + '</div><div class="k">All sessions</div></div><div class="stat"><div class="v">' + cardio + '</div><div class="k">Cardio min/wk</div></div></div>' +
      '<div class="panel"><div class="lab" style="font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">Weekly heat — what\'s hot, what\'s cold</div><div style="display:flex;gap:10px;justify-content:center"><div style="width:120px">' + FIGURE.figureSVG('front', { heat: heat }) + '<div class="date" style="text-align:center;margin-top:4px">FRONT</div></div><div style="width:120px">' + FIGURE.figureSVG('back', { heat: heat }) + '<div class="date" style="text-align:center;margin-top:4px">BACK</div></div></div></div>' +
      '<div class="panel"><div class="lab" style="font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">Program-derived weekly hard-set ranges</div>' + volRows + '</div>' +
      (dumbbellInsights.length || averageDuration ? '<div class="panel"><div class="lab" style="font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">Coach facts · no composite score</div>' + (averageDuration ? '<div class="insight-row"><b>Average workout duration</b><span>' + averageDuration + ' min · ' + durationSamples.length + ' recent session' + (durationSamples.length === 1 ? '' : 's') + '</span></div>' : '') + dumbbellInsights.map(function (item) { return '<div class="insight-row"><b>' + esc(item.ex.name) + '</b><span>' + esc(item.plateau.plateau ? 'Plateau candidate · ' + item.plateau.reason : item.trend.summary) + '</span></div>'; }).join('') + '</div>' : '') +
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
    cardio: { title: 'Cardio', color: '#16889E', summary: 'Use gym-verified cardio options without compromising strength work.', points: [
      ['Easy aerobic work', 'Conversational treadmill walking and any other cardio modality verified at your selected gym can build aerobic capacity and support recovery.'],
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
      ['Can I use this offline?', 'The app shell, coaching logic, original-gym guide assets, fonts and demonstrations are available offline after caching. Crunch guide data is local to the app shell, but its source photos currently load from your Google Drive and need network access unless the browser already cached them.']
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
      '<div class="setting-row goal-setting"><div><b>Primary training goal</b><small>Changes rep emphasis, rest and equivalent-choice ranking without erasing history.</small><div class="preference-controls">' + Object.keys(COACH.GOALS).map(function (id) { return '<button data-action="set-goal" data-goal="' + id + '" class="' + (trainingProfile.goal === id ? 'on' : '') + '">' + esc(COACH.GOALS[id].name.replace(' / Hypertrophy', '')) + '</button>'; }).join('') + '</div></div></div>' +
      '<div class="setting-row rack-setting"><div><b>Available dumbbell rack</b><small>Optional. Enter the actual rack numbers in ' + cfg.units + '; the coach otherwise uses a clearly labeled generic increment.</small><div class="inline-field"><input class="search compact" id="rackweights" inputmode="decimal" value="' + esc((trainingProfile.availableDumbbellsLb || []).map(function (n) { return L.toDisplay(n, cfg.units); }).join(', ')) + '" placeholder="Example: 5, 10, 15, 20, 25"><button class="mini" data-action="save-rack">Save rack</button></div></div></div>' +
      '<div class="setting-row"><div style="width:100%">' + frequencyPicker() + '</div></div>' +
      '<div class="setting-row"><span><b>Units</b><small>Current display: ' + cfg.units + '</small></span><button class="mini" data-action="toggle-units">Switch to ' + (cfg.units === 'lb' ? 'kg' : 'lb') + '</button></div>' +
      '<div class="setting-row"><span><b>Advanced tools</b><small>Supersets and rest-pause; off by default for beginners.</small></span><button class="mini ' + (cfg.advanced ? 'busy' : '') + '" data-action="toggle-advanced" aria-pressed="' + cfg.advanced + '">' + (cfg.advanced ? 'On' : 'Off') + '</button></div>' +
      '<div class="setting-row"><span><b>App updates</b><small id="update-detail">Release ' + APP_RELEASE + ' · checks automatically when the app opens.</small></span><button class="mini" data-action="check-update">Check now</button></div>' +
      '<div class="setting-row"><span><b>Offline readiness</b><small id="offline-detail">Checking cached app shell…</small></span><span class="offline-badge" id="offline-badge">Checking</span></div></div>' +
      '<div class="panel backup"><span class="fieldlabel">Device-local backup</span><p class="sub">Export includes settings, history, records, machine settings and nicknames. Import validates first and asks before replacing this device’s state.</p><div class="inline-field"><button class="mini" data-action="export-backup">Export JSON</button><label class="mini file-button" for="importbackup">Import JSON</label><input id="importbackup" type="file" accept="application/json,.json" hidden></div></div>' +
      '<div class="panel backup"><span class="fieldlabel">Cloud sync — Google Drive</span><p class="sub">Sign in with Google to save your training data to a single file in your Drive and keep it in sync across devices. Optional; the app works fully offline without it.</p>' +
      '<div class="inline-field" id="gdrive-actions"></div>' +
      '<p class="sub" id="gdrive-status" role="status" aria-live="polite" style="margin-top:8px"></p></div>' +
      '<p class="privacy-note">No account required to train. Google sign-in is only for optional cross-device sync — your data goes to your own Google Drive, nowhere else.</p>';
    updateOfflineBadge();
    updateDrivePanel();
  }
  // Render the Drive buttons + status to reflect the current connection state.
  function updateDrivePanel() {
    var actions = document.getElementById('gdrive-actions');
    if (!actions) return;
    var connected = window.MDRIVE && window.MDRIVE.isConnected();
    actions.innerHTML = connected
      ? '<button class="mini" data-action="drive-save">Save now</button><button class="mini" data-action="drive-load">Load from Drive</button><button class="mini" data-action="drive-disconnect">Disconnect</button>'
      : '<button class="mini" data-action="drive-connect">Connect Google Drive</button>';
    updateDriveStatus(window.MDRIVE ? window.MDRIVE.status() : '');
  }
  function updateDriveStatus(text) {
    var el = document.getElementById('gdrive-status');
    if (el) el.textContent = text || (window.MDRIVE && window.MDRIVE.isConnected() ? 'Connected to Google Drive.' : '');
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
    if (cfg.onboarded && !SESSION && (!gymConfirmedToday() || forceGymPicker)) {
      activateTab('today');
      renderGymPicker();
      if (location.hash !== '#/today') history.replaceState(null, '', '#/today');
      window.scrollTo(0, 0);
      return;
    }
    if (tab === 'equipment' && parts[1]) {
      activateTab('equipment'); renderEquipment(); openEquipment(decodeURIComponent(parts.slice(1).join('/')));
    } else if (tab === 'exercise' && parts[1]) {
      activateTab('equipment'); equipmentView = 'exercises'; openExercise(decodeURIComponent(parts.slice(1).join('/')));
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
      case 'ob-gym': cfg.gymId = d('data-gym') === 'crunch' ? 'crunch' : 'home'; applyGymTheme(); document.querySelectorAll('[data-action=ob-gym]').forEach(function (b) { var selected = b.getAttribute('data-gym') === cfg.gymId; b.classList.toggle('on', selected); b.setAttribute('aria-pressed', selected); }); break;
      case 'ob-experience': cfg.experience = d('data-v'); document.querySelectorAll('[data-action=ob-experience]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === cfg.experience); }); updateOnboardingRecommendation(); break;
      case 'ob-goal': trainingProfile.goal = d('data-v'); document.querySelectorAll('[data-action=ob-goal]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === trainingProfile.goal); }); break;
      case 'ob-frequency': cfg.weeklyFrequency = +d('data-v'); document.querySelectorAll('[data-action=ob-frequency]').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-v') === cfg.weeklyFrequency); }); updateOnboardingRecommendation(); break;
      case 'ob-done': cfg.name = (document.getElementById('obname') || {}).value || ''; cfg.onboarded = true; cfg.gymConfirmedOn = todayISO(); cfg.programId = PROGRAM_REGISTRY.recommend(cfg.experience, cfg.weeklyFrequency); state.selectedProgram = cfg.programId; ACTIVE_PROGRAM = PROGRAM_REGISTRY.get(cfg.programId); persist(); applyGymTheme(); renderToday(); updateHeader(); break;
      case 'select-daily-gym': cfg.gymId = d('data-gym') === 'crunch' ? 'crunch' : 'home'; cfg.gymConfirmedOn = todayISO(); forceGymPicker = false; equipmentFilter = 'All'; equipmentZoneFilter = 'All'; equipmentQuery = ''; persist(); applyGymTheme(); renderToday(); updateHeader(); toast(activeGymName() + ' activated for today'); break;
      case 'start-alone': showTab('today'); startAlone(); break;
      case 'start-day': showTab('today'); SESSION = { mode: 'alone', phase: 'time', dayId: d('data-day'), budgetMin: null }; renderSession(); break;
      case 'start-cardio': buildAndStart('cardio'); break;
      case 'start-partner': showTab('today'); startPartner(); break;
      case 'pick-time': SESSION.budgetMin = +d('data-min'); SESSION.phase = 'readiness'; renderSession(); break;
      case 'readiness-pick': SESSION.readiness = SESSION.readiness || { energy: 'normal', soreness: 'mild', sleep: 'okay' }; SESSION.readiness[d('data-key')] = d('data-v'); renderReadiness(); break;
      case 'readiness-continue': trainingProfile.readinessHistory.push({ date: todayISO(), energy: SESSION.readiness.energy, soreness: SESSION.readiness.soreness, sleep: SESSION.readiness.sleep }); trainingProfile.readinessHistory = trainingProfile.readinessHistory.slice(-30); persist(); SESSION.phase = 'focus'; renderSession(); break;
      case 'readiness-skip': SESSION.readiness = null; SESSION.phase = 'focus'; renderSession(); break;
      case 'pick-focus': buildAndStart(d('data-day')); break;
      case 'begin-previewed-workout': SESSION.phase = 'active'; SESSION.startedAt = Date.now(); renderSession(); break;
      case 'restore-readiness-volume': SESSION.built.slots.forEach(function (slot) { while (slot.sets < slot.originalSets) { slot.sets++; slot.log.push(newSet(slot.pre.weight)); } slot.targetSets = slot.sets; }); SESSION.built.readinessContext.action = 'user_override'; SESSION.built.readinessContext.explanation = 'You restored the planned accessory volume; the original readiness note remains in the decision log.'; renderPreview(); toast('Planned volume restored'); break;
      case 'pick-part': SESSION.part = d('data-part'); SESSION.picked = ACTIVE_PROGRAM.classic[SESSION.part].slice(0, 5); SESSION.query = ''; SESSION.phase = 'compose'; renderSession(); break;
      case 'partner-back': SESSION.phase = 'part'; renderSession(); break;
      case 'toggle-ex': { var id = d('data-ex'); var i = SESSION.picked.indexOf(id); if (i >= 0) SESSION.picked.splice(i, 1); else SESSION.picked.push(id); renderCompose(); break; }
      case 'partner-time': if (!SESSION.picked.length) { toast('Add at least one exercise'); break; } SESSION.phase = 'ptime'; renderSession(); break;
      case 'partner-go': partnerGo(+d('data-min')); break;
      case 'pick-machine': {
        if (!SESSION || SESSION.mode !== 'partner') break;
        var manualSlot = SESSION.built.slots[SESSION.idx], manualMachine = L.byId(machinesForEx(manualSlot.exId))[d('data-machine')];
        if (!manualMachine) break;
        manualSlot.machineId = manualMachine.id; manualSlot.zoneId = manualMachine.zoneId || manualSlot.zoneId; manualSlot.machineChoiceReason = 'Selected by you for this partner-led session.';
        SESSION.built.decisionLog.push({ type: 'partner_equipment_selected', exerciseId: manualSlot.exId, machineId: manualMachine.id, reasons: ['partner-led manual choice'] });
        SESSION.built.route = routeForAssignedSlots(SESSION.built.slots);
        renderActive(); break;
      }
      case 'toggle-session-map': SESSION.showMap = !SESSION.showMap; renderActive(); break;
      case 'switch-ex': swapTo(d('data-ex')); break;
      case 'toggle-how': { var s = SESSION.built.slots[SESSION.idx]; s.showHow = !s.showHow; renderActive(); break; }
      case 'toggle-why': { var why = a.parentElement && a.parentElement.querySelector('.why-copy'); if (why) why.classList.toggle('hidden'); break; }
      case 'start-load-test': {
        var testSlot = SESSION.built.slots[SESSION.idx];
        testSlot.loadTestOpen = true; testSlot.loadTestResult = null;
        testSlot.loadTestDraft = { load: testSlot.pre && testSlot.pre.weight != null ? testSlot.pre.weight : null };
        renderActive(); break;
      }
      case 'cancel-load-test': { var closingSlot = SESSION.built.slots[SESSION.idx]; closingSlot.loadTestOpen = false; renderActive(); break; }
      case 'evaluate-load-test': {
        var loadSlot = SESSION.built.slots[SESSION.idx], weightField = document.getElementById('loadtestweight'), repsField = document.getElementById('loadtestreps'), rirField = document.getElementById('loadtestrir');
        if (!weightField || weightField.value === '' || !repsField || repsField.value === '' || !rirField || rirField.value === '') { toast('Enter the labeled load, completed reps, and RIR'); if (weightField && weightField.value === '') weightField.focus(); else if (repsField && repsField.value === '') repsField.focus(); else if (rirField) rirField.focus(); break; }
        var attempt = { load: L.fromInput(weightField.value, cfg.units), reps: Number(repsField.value), rir: Number(rirField.value), clean: (document.getElementById('loadtestclean') || {}).value !== 'no', pain: (document.getElementById('loadtestpain') || {}).value === 'yes', testedAt: new Date().toISOString() };
        var result = L.assessLoadTest(loadSlot.ex, attempt, { availableDumbbellsLb: trainingProfile.availableDumbbellsLb });
        if (!result.valid) { toast(result.message); break; }
        loadSlot.loadTests = loadSlot.loadTests || []; loadSlot.loadTests.push(Object.assign({}, attempt, { verdict: result.verdict, suggestedLoad: result.suggestedLoad, message: result.message }));
        loadSlot.loadTestResult = result;
        if (result.accepted) {
          loadSlot.pre = { mode: 'calibrated', weight: result.load, repRange: loadSlot.ex.repRange, sets: loadSlot.sets, confidence: 'Guided load test', note: 'Confirmed by a controlled test set at 1–3 RIR.', reason: result.message };
          loadSlot.recommendedWeight = result.load; loadSlot.loadConfidence = 'Guided load test'; loadSlot.progressionReason = result.message; loadSlot.loadTestOpen = false;
          loadSlot.log.forEach(function (setItem) { if (!setItem.done && setItem.kind !== 'warmup') setItem.weight = result.load; });
          var loadDecision = { type: 'load_calibrated', exerciseId: loadSlot.exId, load: result.load, loadMode: loadSlot.ex.loadMode, reasons: ['controlled test set', attempt.reps + ' repetitions', attempt.rir + ' RIR', 'pain-free technique reported'] };
          SESSION.built.decisionLog.push(loadDecision); decisionLog.push(loadDecision); decisionLog = decisionLog.slice(-100); persist();
          toast('Starting load confirmed · ' + wLbl(result.load));
        } else {
          loadSlot.loadTestDraft = { load: result.suggestedLoad != null ? result.suggestedLoad : attempt.load };
          toast(result.verdict === 'stop' ? 'Stop this exercise—do not test through pain' : 'Adjust the load and retest after resting');
        }
        renderActive(); break;
      }
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
      case 'set-frequency': {
        var requestedDays = +d('data-days'); if (requestedDays < 2 || requestedDays > 7) break;
        cfg.weeklyFrequency = requestedDays;
        var switchedProgram = false;
        if (ACTIVE_PROGRAM.sessionsPerRotation.indexOf(requestedDays) < 0) {
          cfg.programId = PROGRAM_REGISTRY.recommend(cfg.experience, requestedDays);
          state.selectedProgram = cfg.programId; ACTIVE_PROGRAM = PROGRAM_REGISTRY.get(cfg.programId);
          plan.cycleIndex = 0; switchedProgram = true;
        }
        persist(); updateHeader(); routeFromHash();
        toast(requestedDays + ' training days selected' + (switchedProgram ? ' · ' + ACTIVE_PROGRAM.name + ' selected; history preserved' : ' · history preserved'));
        break;
      }
      case 'gym-jump': forceGymPicker = true; showTab('today'); break;
      case 'select-gym': cfg.gymId = d('data-gym') === 'crunch' ? 'crunch' : 'home'; cfg.gymConfirmedOn = todayISO(); forceGymPicker = false; equipmentFilter = 'All'; equipmentZoneFilter = 'All'; equipmentQuery = ''; persist(); applyGymTheme(); routeFromHash(); toast(activeGymName() + ' activated for today'); break;
      case 'equipment-view': equipmentView = d('data-view') === 'exercises' ? 'exercises' : 'equipment'; equipmentQuery = ''; history.replaceState(null, '', '#/equipment'); renderEquipment(); break;
      case 'equipment-zone': equipmentZoneFilter = d('data-zone') || 'All'; renderEquipment(); break;
      case 'equipment-filter': equipmentFilter = d('data-cat'); renderEquipment(); break;
      case 'exercise-filter': exerciseFilter = d('data-cat') || 'All'; if (exerciseFilter !== 'Dumbbell') exerciseMuscle = 'All'; renderEquipment(); break;
      case 'exercise-muscle': exerciseMuscle = d('data-muscle') || 'All'; renderEquipment(); break;
      case 'open-ex': openExercise(d('data-ex')); break;
      case 'exercise-back': history.replaceState(null, '', '#/equipment'); equipmentView = 'exercises'; renderExerciseLibrary(); break;
      case 'exercise-preference': {
        var prefId = d('data-ex'), pref = d('data-pref');
        delete trainingProfile.preferences.preferred[prefId]; delete trainingProfile.preferences.avoided[prefId];
        if (pref === 'preferred') trainingProfile.preferences.preferred[prefId] = true;
        if (pref === 'avoided') trainingProfile.preferences.avoided[prefId] = true;
        persist(); openExercise(prefId); toast(pref === 'neutral' ? 'Preference cleared' : 'Exercise marked ' + pref); break;
      }
      case 'open-eq': openEquipment(d('data-eq')); break;
      case 'save-eqname': { var v = ((document.getElementById('eqrename') || {}).value || '').trim(); var eid = d('data-eq'); if (v) eqNames[eid] = v; else delete eqNames[eid]; set('muscles-eqnames', eqNames); openEquipment(eid); toast('Personal nickname saved'); break; }
      case 'equipment-back': history.replaceState(null, '', '#/equipment'); renderEquipment(); break;
      case 'cal-prev': calMonth.m--; if (calMonth.m < 0) { calMonth.m = 11; calMonth.y--; } renderProgress(); break;
      case 'cal-next': calMonth.m++; if (calMonth.m > 11) { calMonth.m = 0; calMonth.y++; } renderProgress(); break;
      case 'cal-day': calDay(d('data-d')); break;
      case 'learn-topic': renderLearn(d('data-topic')); break;
      case 'learn-back': history.replaceState(null, '', '#/learn'); renderLearn(); break;
      case 'toggle-units': cfg.units = cfg.units === 'lb' ? 'kg' : 'lb'; persist(); renderLearn(); toast('Now showing ' + cfg.units); break;
      case 'set-goal': trainingProfile.goal = COACH.GOALS[d('data-goal')] ? d('data-goal') : 'hypertrophy'; persist(); renderLearn(); toast(COACH.goal(trainingProfile.goal).name + ' selected; history preserved'); break;
      case 'save-rack': {
        var rackValue = ((document.getElementById('rackweights') || {}).value || '');
        trainingProfile.availableDumbbellsLb = rackValue.split(/[ ,;]+/).map(function (value) { return L.fromInput(value, cfg.units); }).filter(function (value) { return value != null && isFinite(value) && value > 0; }).sort(function (x, y) { return x - y; }).filter(function (value, index, values) { return index === 0 || value !== values[index - 1]; });
        persist(); renderLearn(); toast(trainingProfile.availableDumbbellsLb.length ? trainingProfile.availableDumbbellsLb.length + ' rack weights saved' : 'Rack list cleared; no increments assumed'); break;
      }
      case 'set-theme': cfg.theme = d('data-theme'); persist(); applyTheme(); renderLearn(); break;
      case 'toggle-theme': {
        cfg.theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        persist(); applyTheme();
        if (!document.getElementById('s-learn').classList.contains('hidden') && location.hash === '#/learn') renderLearn();
        toast((cfg.theme === 'light' ? 'Light' : 'Dark') + ' mode on');
        break;
      }
      case 'toggle-advanced': cfg.advanced = !cfg.advanced; persist(); renderLearn(); toast('Advanced tools ' + (cfg.advanced ? 'enabled' : 'hidden')); break;
      case 'check-update': {
        var updateDetail = document.getElementById('update-detail');
        if (updateDetail) updateDetail.textContent = 'Checking for the newest release…';
        if (window.MUSCLES_UPDATES && window.MUSCLES_UPDATES.check) {
          window.MUSCLES_UPDATES.check().then(function (message) { var current = document.getElementById('update-detail'); if (current) current.textContent = message; toast(message); });
        } else {
          if (updateDetail) updateDetail.textContent = 'Update checking becomes available after the app is installed or refreshed online.';
          toast('Refresh once online to enable update checking');
        }
        break;
      }
      case 'export-backup': exportBackup(); break;
      case 'drive-connect': if (window.MDRIVE) { window.MDRIVE.connect(); updateDrivePanel(); } break;
      case 'drive-save': if (window.MDRIVE) window.MDRIVE.saveNow(); break;
      case 'drive-load': if (window.MDRIVE) window.MDRIVE.loadNow(); break;
      case 'drive-disconnect': if (window.MDRIVE) { window.MDRIVE.disconnect(); updateDrivePanel(); toast('Google Drive disconnected'); } break;
      case 'accept-reduction': { var rs = SESSION.built.slots[SESSION.idx]; rs.pre = L.acceptReduction(rs.pre); rs.log.forEach(function (x) { if (!x.done) x.weight = rs.pre.weight; }); renderActive(); toast('Reduction accepted for this exercise'); break; }
      case 'demo-toggle': {
        var block = a.closest('.demoblock'), demo = block && block.querySelector('.demo, .motion-demo'); if (!demo) break;
        demo.classList.remove('start', 'end'); var paused = demo.classList.toggle('paused'); var svg = demo.querySelector('svg');
        if (svg && svg.pauseAnimations) { if (paused) svg.pauseAnimations(); else svg.unpauseAnimations(); }
        var playStatus = block.querySelector('.motion-status strong'); if (playStatus) playStatus.textContent = paused ? 'Paused' : 'Playing full repetition';
        a.textContent = paused ? 'Play' : 'Pause'; a.setAttribute('aria-pressed', paused); break;
      }
      case 'demo-frame': {
        var db = a.closest('.demoblock'), dm = db && db.querySelector('.demo, .motion-demo'); if (!dm) break;
        dm.classList.remove('start', 'end'); dm.classList.add(d('data-frame')); dm.classList.add('paused');
        var motionSvg = dm.querySelector('svg'); if (motionSvg && motionSvg.pauseAnimations) { motionSvg.pauseAnimations(); motionSvg.setCurrentTime(d('data-frame') === 'end' ? Number(dm.getAttribute('data-duration') || 2.4) * 0.5 : 0); }
        var toggle = db.querySelector('[data-action=demo-toggle]'), frameStatus = db.querySelector('.motion-status strong'); if (toggle) { toggle.textContent = 'Play'; toggle.setAttribute('aria-pressed', 'true'); } if (frameStatus) frameStatus.textContent = d('data-frame') === 'end' ? 'End position' : 'Start position'; break;
      }
    }
  });

  document.addEventListener('change', function (e) {
    if (e.target.matches('[data-machine-setting]')) { machineSettings[e.target.getAttribute('data-machine-setting')] = e.target.value.trim(); persist(); toast('Machine setting saved'); }
    if (e.target.matches('[data-exercise-setting]')) { trainingProfile.exerciseSettings[e.target.getAttribute('data-exercise-setting')] = e.target.value.trim(); persist(); toast('Exercise setting saved'); }
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

  // Optional Google Drive sync: reflect status in the settings panel, reload on
  // a pulled snapshot, flush pending pushes before the tab is backgrounded.
  if (window.MDRIVE) {
    window.MDRIVE.setHooks({
      onStatus: function (text) { updateDriveStatus(text); updateDrivePanel(); },
      onLoaded: function () { location.reload(); }
    });
    window.MDRIVE.autoBoot();
    window.addEventListener('visibilitychange', function () { if (document.hidden) window.MDRIVE.flush(); });
    window.addEventListener('pagehide', function () { window.MDRIVE.flush(); });
  }
})();
