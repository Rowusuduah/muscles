/* muscles — app controller. Wires data + logic + figure into the UI.
   No framework: render-to-HTML + event delegation. State persists in localStorage. */
(function () {
  'use strict';
  var EX = L.byId(EXERCISES), MU = L.byId(MUSCLES), EQ = L.byId(EQUIPMENT);

  /* ---------- storage ---------- */
  var mem = {};
  function get(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : (mem[k] !== undefined ? mem[k] : d); } catch (e) { return mem[k] !== undefined ? mem[k] : d; } }
  function set(k, v) { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function todayISO() { var d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }

  /* ---------- state ---------- */
  var cfg = get('muscles-config', { units: 'lb', start: todayISO(), figure: 'male', theme: 'dark' });
  var plan = get('muscles-plan', { cycleIndex: 0, sessionCount: 0, calibrated: false });
  var lifts = get('muscles-lifts', {});
  var log = get('muscles-log', {});
  if (!cfg.start) { cfg.start = todayISO(); set('muscles-config', cfg); }

  var SESSION = null; // in-progress session

  /* ---------- helpers ---------- */
  var FRONT_M = ['traps', 'front_delts', 'side_delts', 'chest', 'biceps', 'forearms', 'abs', 'obliques', 'quads', 'calves'];
  var BACK_M = ['traps', 'rear_delts', 'triceps', 'forearms', 'mid_back', 'lats', 'lower_back', 'glutes', 'hamstrings', 'calves'];
  function pickView(mark) {
    var f = 0, b = 0; Object.keys(mark).forEach(function (m) { if (FRONT_M.indexOf(m) >= 0) f++; if (BACK_M.indexOf(m) >= 0) b++; });
    return b > f ? 'back' : 'front';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function wLbl(lb) { if (lb == null) return '—'; return L.toDisplay(lb, cfg.units) + ' ' + cfg.units; }
  function toast(msg) { var t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('show'); }, 2600); }
  function focusMark(day) {
    var mark = {};
    (day.focusMuscles || []).forEach(function (m) { mark[m] = 'primary'; });
    (day.slots || []).forEach(function (s) { var ex = EX[s.ex]; if (ex) { (ex.primary || []).forEach(function (m) { mark[m] = 'primary'; }); (ex.secondary || []).forEach(function (m) { if (mark[m] !== 'primary') mark[m] = 'secondary'; }); } });
    return mark;
  }
  function machinesForEx(exId) { return EQUIPMENT.filter(function (e) { return (e.exerciseIds || []).indexOf(exId) >= 0; }); }
  function shot(machine, cls) {
    if (machine && machine.photo) return '<img class="shot ' + (cls || '') + '" src="' + machine.photo + '" onerror="this.style.display=\'none\'" alt="">';
    return '<div class="shot ph ' + (cls || '') + '">NO<br>PHOTO</div>';
  }

  /* ---------- header ---------- */
  function updateHeader() {
    var d = new Date();
    document.getElementById('date').textContent =
      ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()] + ' · ' +
      ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][d.getMonth()] + ' ' + d.getDate();
    var ts = L.totalSets(log), r = L.rank(ts);
    document.getElementById('ranklab').textContent = 'Rank · ' + r.name + (r.next ? ' → ' + r.next : '');
    document.getElementById('rankbar').style.width = Math.round(r.progress * 100) + '%';
    document.getElementById('streak').textContent = L.streak(log, todayISO());
  }

  /* ---------- TODAY (idle) ---------- */
  function proposedDayId() { return L.dayIdAt(PROGRAM, plan.cycleIndex); }
  function renderToday() {
    if (SESSION) return renderSession();
    var dayId = proposedDayId(), day = PROGRAM.days[dayId];
    var wk = L.weeklyVolume(log, EX, todayISO(), 7);
    var recs = L.recommendations(wk, MUSCLES, 0.6);
    var el = document.getElementById('s-today');
    var isCardio = dayId === 'cardio';
    var mark = isCardio ? {} : focusMark(day);
    var view = pickView(mark);
    var sessN = plan.sessionCount + 1;

    var recHtml = '';
    if (recs.length && log && Object.keys(log).length) {
      recHtml = '<div class="panel fade"><div class="tinfo"><div class="lab">This week is light on</div>' +
        '<div class="chips">' + recs.slice(0, 4).map(function (r) { return '<span class="chip cool">' + esc(r.name) + '</span>'; }).join('') +
        '</div></div><p class="sub" style="margin:10px 0 0">Your next sessions will lean into these.</p></div>';
    }

    var hero;
    if (isCardio) {
      hero = '<div class="eyebrow">Session ' + sessN + ' · Cardio</div>' +
        '<h1 class="day">Cardio</h1>' +
        '<p class="sub">Easy conditioning to stay lean — <b>you pick the machine and minutes.</b></p>';
    } else {
      hero = '<div class="eyebrow">Session ' + sessN + ' · ' + esc(day.name) + '</div>' +
        '<h1 class="day">' + esc(day.name) + '</h1>' +
        '<p class="sub"><b>' + day.focusMuscles.map(function (m) { return MU[m] ? MU[m].name : m; }).join(' · ') + '</b></p>' +
        '<div class="panel figpanel fade"><div class="figwrap">' + FIGURE.figureSVG(view, { mark: mark }) + '</div>' +
        '<div class="tinfo"><div class="lab">Today you\'ll heat</div><div class="chips">' +
        Object.keys(mark).filter(function (m) { return mark[m] === 'primary'; }).slice(0, 5).map(function (m) { return '<span class="chip">' + esc(MU[m] ? MU[m].name : m) + '</span>'; }).join('') +
        '</div></div></div>';
    }

    el.innerHTML = hero +
      '<button class="cta" data-action="start-train">Train alone</button>' +
      '<div style="height:10px"></div>' +
      '<button class="cta sub" data-action="change-focus">Change today\'s focus</button>' +
      '<div style="height:14px"></div>' + recHtml;
  }

  /* ---------- flow: start / time ---------- */
  function startTrain() {
    SESSION = { phase: 'time', dayId: proposedDayId(), budgetMin: null };
    renderSession();
  }
  function renderTime() {
    var el = document.getElementById('s-today');
    var mins = [30, 45, 60, 90, 120];
    el.innerHTML = '<div class="eyebrow">Before we start</div><h1 class="day">How long?</h1>' +
      '<p class="sub">I\'ll build a session that <b>fits your time</b> — more time, more work.</p>' +
      '<div class="timegrid">' + mins.map(function (m) {
        return '<button class="timechip" data-action="pick-time" data-min="' + m + '"><div class="big">' + m + '</div><div class="u">min</div></button>';
      }).join('') +
      '<button class="timechip" data-action="pick-time" data-min="20"><div class="big">20</div><div class="u">quick</div></button></div>' +
      '<button class="cta sub" data-action="cancel-session">Cancel</button>';
  }

  /* ---------- flow: focus ---------- */
  function renderFocus() {
    var el = document.getElementById('s-today');
    var order = ['push', 'pull', 'legs', 'upper', 'lower', 'cardio'];
    var proposed = SESSION.dayId;
    el.innerHTML = '<div class="eyebrow">What are we doing?</div><h1 class="day">Focus</h1>' +
      '<p class="sub">Your plan says <b>' + esc(PROGRAM.days[proposed].name) + '</b>. Keep it or pick another.</p>' +
      order.map(function (d) {
        var day = PROGRAM.days[d];
        var mus = d === 'cardio' ? 'Treadmill · Elliptical' : day.focusMuscles.map(function (m) { return MU[m] ? MU[m].name : m; }).join(' · ');
        return '<div class="weekrow ' + (d === proposed ? 'now ' : '') + (d === 'cardio' ? 'cardio' : '') + '" data-action="pick-focus" data-day="' + d + '">' +
          '<span class="nm">' + esc(day.name) + '</span><span class="mus">' + esc(mus) + '</span></div>';
      }).join('') +
      '<div style="height:8px"></div><button class="cta sub" data-action="cancel-session">Cancel</button>';
  }

  /* ---------- flow: build + active session ---------- */
  function buildAndStart(dayId) {
    SESSION.dayId = dayId;
    if (dayId === 'cardio') {
      SESSION.phase = 'cardio';
      SESSION.cardio = L.buildCardio(PROGRAM, EX, SESSION.budgetMin);
      return renderSession();
    }
    var wk = L.weeklyVolume(log, EX, todayISO(), 7);
    var recs = L.recommendations(wk, MUSCLES, 0.6).map(function (r) { return r.id; });
    var built = L.buildSession(PROGRAM, EX, dayId, SESSION.budgetMin, { undertrained: recs });
    // attach per-slot working state
    built.slots.forEach(function (s) {
      var rec = lifts[s.exId]; var pre = L.prescribe(s.ex, rec);
      s.machineId = (machinesForEx(s.exId)[0] || {}).id || null;
      s.pre = pre;
      s.log = []; for (var i = 0; i < s.sets; i++) s.log.push({ reps: null, weight: pre.weight, done: false });
    });
    SESSION.built = built; SESSION.idx = 0; SESSION.phase = 'active';
    renderSession();
  }

  function sessionProgress() {
    var done = 0, total = 0;
    SESSION.built.slots.forEach(function (s) { total += s.sets; s.log.forEach(function (x) { if (x.done) done++; }); });
    return { done: done, total: total };
  }

  function renderActive() {
    var el = document.getElementById('s-today');
    var b = SESSION.built, s = b.slots[SESSION.idx];
    var mark = focusMark(PROGRAM.days[b.dayId]); var view = pickView(mark);
    var pr = sessionProgress();
    var pips = ''; for (var i = 0; i < Math.min(pr.total, 24); i++) pips += '<span class="pip' + (i < pr.done ? ' on' : '') + '"></span>';

    var machines = machinesForEx(s.exId);
    var machSel = EQ[s.machineId] || machines[0];
    var pickerHtml = machines.length ? ('<div class="picker"><div class="lab">Pick your machine</div><div class="machopts">' +
      machines.map(function (m) {
        return '<div class="macho ' + (m.id === s.machineId ? 'sel' : '') + '" data-action="pick-machine" data-machine="' + m.id + '">' +
          '<img src="' + m.photo + '" onerror="this.style.visibility=\'hidden\'" alt="">' +
          '<div class="nm">' + esc(m.name) + '</div></div>';
      }).join('') + '</div></div>') : '';

    var ex = s.ex;
    var tgtWeight = s.pre.mode === 'calibrate' ? 'find it' : wLbl(s.pre.weight);
    var targetLine = '<div class="target"><span class="t">' + s.sets + ' × ' + ex.repRange[0] + '–' + ex.repRange[1] + ' · ' + tgtWeight + '</span>' +
      '<span class="note">' + esc(s.pre.note) + '</span></div>';

    var rows = s.log.map(function (x, i) {
      var wDisp = x.weight != null ? L.toDisplay(x.weight, cfg.units) : '';
      return '<div class="setrow">' +
        '<span class="slab">SET ' + (i + 1) + '</span>' +
        '<input type="number" inputmode="numeric" placeholder="reps" value="' + (x.reps != null ? x.reps : '') + '" data-set="' + i + '" data-f="reps">' +
        '<span class="x">reps</span>' +
        '<input type="number" inputmode="decimal" placeholder="wt" value="' + wDisp + '" data-set="' + i + '" data-f="weight">' +
        '<span class="x">' + cfg.units + '</span>' +
        '<button class="tick ' + (x.done ? 'done' : '') + '" data-action="check-set" data-set="' + i + '"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></button>' +
        '</div>';
    }).join('');

    var last = (SESSION.idx + 1) >= b.slots.length;
    el.innerHTML =
      '<div class="topbar"><div class="eyebrow">' + esc(b.name) + ' · ' + b.estMin + ' min</div>' +
      '<button class="mini" data-action="cancel-session">End</button></div>' +
      '<div class="meter"><div class="pips">' + pips + '</div><span class="n">' + pr.done + ' / ' + pr.total + ' sets</span></div>' +
      '<div class="card active slot fade">' +
        '<div class="chead">' + shot(machSel) +
          '<div><div class="cnum">' + String(SESSION.idx + 1).padStart(2, '0') + ' / ' + b.slots.length + ' · ' + s.role.toUpperCase() + '</div>' +
          '<div class="cname">' + esc(ex.name) + '</div>' +
          '<div class="ctag">Target: ' + esc(MU[s.target] ? MU[s.target].name : s.target) + '</div></div></div>' +
        pickerHtml + targetLine +
        '<div class="sets">' + rows + '</div>' +
        '<div class="cfoot">' +
          '<span class="rest" id="rest">REST ' + ex.restSec + 's</span>' +
          '<span class="cue"><b>Cue:</b> ' + esc(ex.cues[0]) + '</span>' +
          '<button class="mini busy" data-action="busy">Busy?</button>' +
          '<button class="next-btn" data-action="next-slot">' + (last ? 'Finish ▸' : 'Next ▸') + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="panel"><div class="tinfo"><div class="lab">Common mistakes</div>' +
        '<p class="sub" style="margin:6px 0 0">' + ex.mistakes.map(esc).join(' · ') + '</p></div></div>';
  }

  function captureSets() {
    var s = SESSION.built.slots[SESSION.idx];
    document.querySelectorAll('#s-today input[data-set]').forEach(function (inp) {
      var i = +inp.getAttribute('data-set'), f = inp.getAttribute('data-f');
      if (f === 'reps') s.log[i].reps = inp.value === '' ? null : parseInt(inp.value, 10);
      else s.log[i].weight = inp.value === '' ? s.log[i].weight : L.fromInput(inp.value, cfg.units);
    });
  }

  var restTimer = null;
  function startRest(sec) {
    var pill = document.getElementById('rest'); if (!pill) return;
    clearInterval(restTimer); var t = sec; pill.classList.add('run');
    pill.textContent = 'REST ' + t + 's';
    restTimer = setInterval(function () {
      t--; if (t <= 0) { clearInterval(restTimer); pill.classList.remove('run'); pill.textContent = 'GO'; return; }
      pill.textContent = 'REST ' + t + 's';
    }, 1000);
  }

  function checkSet(i) {
    captureSets();
    var s = SESSION.built.slots[SESSION.idx];
    if (!s.log[i].reps) { toast('Enter your reps first'); return; }
    s.log[i].done = true;
    renderActive();
    startRest(s.ex.restSec);
  }

  function busy() {
    var s = SESSION.built.slots[SESSION.idx];
    var alts = L.busyAlternatives({ alt: s.alt }, EX, EQUIPMENT);
    if (!alts.length) { toast('No alternative — try again in a minute'); return; }
    var el = document.getElementById('s-today');
    el.insertAdjacentHTML('afterbegin',
      '<div class="panel fade" id="altpanel"><div class="tinfo"><div class="lab">Machine busy — swap to</div></div>' +
      alts.map(function (a) {
        var m = machinesForEx(a.id)[0];
        return '<div class="weekrow" data-action="swap" data-ex="' + a.id + '"><span class="nm" style="font-size:15px">' + esc(a.name) + '</span>' +
          '<span class="mus">' + esc(m ? m.name : a.equipType) + '</span></div>';
      }).join('') +
      '<div class="weekrow" data-action="requeue" style="border-style:dashed"><span class="nm" style="font-size:15px;color:var(--steel)">Come back later ↻</span><span class="mus">skip &amp; requeue</span></div>' +
      '<div style="height:8px"></div><button class="cta sub" data-action="close-alt">Never mind</button></div>');
    window.scrollTo(0, 0);
  }
  function swapTo(exId) {
    var s = SESSION.built.slots[SESSION.idx];
    s.exId = exId; s.ex = EX[exId]; s.machineId = (machinesForEx(exId)[0] || {}).id || null;
    var rec = lifts[exId]; s.pre = L.prescribe(s.ex, rec);
    s.log = []; for (var i = 0; i < s.sets; i++) s.log.push({ reps: null, weight: s.pre.weight, done: false });
    renderActive();
  }
  function requeue() {
    var b = SESSION.built;
    if (SESSION.idx >= b.slots.length - 1) { toast('Last exercise — no room to requeue'); nextSlot(true); return; }
    var s = b.slots.splice(SESSION.idx, 1)[0];
    b.slots.push(s);
    renderActive();
    toast('Moved to the end — come back to it');
  }

  function nextSlot(skipCapture) {
    if (!skipCapture) captureSets();
    if (SESSION.idx + 1 < SESSION.built.slots.length) { SESSION.idx++; renderActive(); window.scrollTo(0, 0); }
    else { SESSION.phase = 'summary'; renderSummary(); }
  }

  /* ---------- cardio ---------- */
  function renderCardio() {
    var el = document.getElementById('s-today'); var c = SESSION.cardio;
    el.innerHTML = '<div class="topbar"><div class="eyebrow">Cardio · ' + c.minutes + ' min</div><button class="mini" data-action="cancel-session">End</button></div>' +
      '<h1 class="day">Cardio</h1><p class="sub">Target: <b>' + esc(c.effortTarget) + '</b></p>' +
      '<div class="picker" style="padding:0"><div class="lab">Pick your machine</div><div class="machopts">' +
      c.modalities.map(function (id) {
        var ex = EX[id];
        return '<div class="macho ' + (id === c.exId ? 'sel' : '') + '" data-action="pick-modality" data-ex="' + id + '" style="width:140px">' +
          '<div class="nm" style="padding:14px 10px;font-family:var(--disp);text-transform:uppercase">' + esc(ex.name) + '</div></div>';
      }).join('') + '</div></div>' +
      '<div class="panel"><div class="tinfo"><div class="lab">How to</div><p class="sub" style="margin:6px 0 0">' + EX[c.exId].cues.map(esc).join(' · ') + '</p></div></div>' +
      '<div class="setrow" style="border:1px solid var(--line);border-radius:12px;margin:0 0 12px">' +
      '<span class="slab">MINUTES</span><input type="number" inputmode="numeric" id="cardiomin" value="' + c.minutes + '" style="width:70px">' +
      '<span class="x">min · effort</span><input type="number" inputmode="numeric" id="cardioeff" placeholder="1-10" style="width:56px"></div>' +
      '<button class="cta" data-action="log-cardio">Log cardio ✓</button>';
  }

  /* ---------- summary / save ---------- */
  function renderSummary() {
    var el = document.getElementById('s-today');
    var pr = sessionProgress();
    el.innerHTML = '<div class="eyebrow">' + esc(SESSION.built.name) + '</div><h1 class="day">Done.</h1>' +
      '<p class="sub">You logged <b>' + pr.done + ' sets</b>. How did it feel?</p>' +
      '<div class="timegrid" style="grid-template-columns:repeat(5,1fr)">' +
      [['1', 'rough'], ['2', 'meh'], ['3', 'ok'], ['4', 'good'], ['5', 'strong']].map(function (f) {
        return '<button class="timechip" data-action="felt" data-v="' + f[0] + '"><div class="big" style="font-size:22px">' + f[0] + '</div><div class="u">' + f[1] + '</div></button>';
      }).join('') + '</div>' +
      '<input id="snote" placeholder="Note — energy, sleep, anything…" style="width:100%;background:var(--panel);border:1px solid var(--line);border-radius:10px;color:var(--chalk);font-family:var(--sans);font-size:14px;padding:12px;margin:6px 0 12px">' +
      '<button class="cta" data-action="save-session">Save session ✓</button>';
  }

  function saveLiftSession() {
    var date = todayISO();
    var entry = { day: SESSION.built.dayId, budgetMin: SESSION.budgetMin, exercises: [], felt: SESSION.felt || null, note: SESSION.note || '' };
    SESSION.built.slots.forEach(function (s) {
      var sets = s.log.filter(function (x) { return x.reps > 0; }).map(function (x) { return { reps: x.reps, weight: x.weight || 0 }; });
      if (sets.length) {
        entry.exercises.push({ exId: s.exId, machineId: s.machineId, sets: sets });
        lifts[s.exId] = L.updateLift(lifts[s.exId], s.ex, sets);
      }
    });
    log[date] = entry; set('muscles-log', log); set('muscles-lifts', lifts);
    plan.cycleIndex = L.nextIndex(PROGRAM, plan.cycleIndex); plan.sessionCount++; plan.calibrated = true; set('muscles-plan', plan);
    var prName = celebrate(entry);
    SESSION = null; updateHeader(); renderToday();
    toast(prName || 'Session saved — nice work');
  }
  function saveCardio() {
    var min = parseInt((document.getElementById('cardiomin') || {}).value, 10) || SESSION.cardio.minutes;
    var eff = parseInt((document.getElementById('cardioeff') || {}).value, 10) || null;
    var date = todayISO();
    log[date] = { day: 'cardio', budgetMin: SESSION.budgetMin, cardio: { modality: EX[SESSION.cardio.exId].equipType, kind: 'steady', minutes: min, avgEffort: eff }, felt: null, note: '' };
    set('muscles-log', log);
    plan.cycleIndex = L.nextIndex(PROGRAM, plan.cycleIndex); plan.sessionCount++; set('muscles-plan', plan);
    SESSION = null; updateHeader(); renderToday(); toast(min + ' min cardio logged 🫁');
  }
  function celebrate(entry) {
    // detect a PR this session
    var pr = null;
    entry.exercises.forEach(function (it) {
      var rec = lifts[it.exId]; if (!rec) return;
      var best = it.sets.reduce(function (m, s) { return Math.max(m, L.e1rm(s.weight, s.reps)); }, 0);
      if (best >= rec.bestE1RM && best > 0 && it.sets.some(function (s) { return s.weight > 0; })) pr = EX[it.exId].name;
    });
    return pr ? ('New best on ' + pr + ' 🔥') : null;
  }

  function renderSession() {
    if (!SESSION) return renderToday();
    if (SESSION.phase === 'time') return renderTime();
    if (SESSION.phase === 'focus') return renderFocus();
    if (SESSION.phase === 'active') return renderActive();
    if (SESSION.phase === 'cardio') return renderCardio();
    if (SESSION.phase === 'summary') return renderSummary();
  }

  /* ---------- TRAIN explorer ---------- */
  var trainFilter = 'all';
  function renderTrain() {
    var el = document.getElementById('s-train');
    var cats = ['all', 'chest', 'back', 'shoulders', 'arms', 'legs', 'glutes', 'abs', 'cardio'];
    var list = EQUIPMENT.filter(function (e) { return trainFilter === 'all' || (e.cats || []).indexOf(trainFilter) >= 0; });
    el.innerHTML = '<h2 class="sec">Train</h2><p class="lede">Browse by body part → pick a machine → see how to use it.</p>' +
      '<div class="bodyparts">' + cats.map(function (c) { return '<button class="bp ' + (c === trainFilter ? 'on' : '') + '" data-action="train-filter" data-cat="' + c + '">' + c + '</button>'; }).join('') + '</div>' +
      '<div class="eqgrid">' + list.map(function (e) {
        var exs = (e.exerciseIds || []).map(function (id) { return EX[id] ? EX[id].name : id; }).slice(0, 3).join(', ');
        return '<div class="eqcard" data-action="open-eq" data-eq="' + e.id + '">' +
          '<img src="' + e.photo + '" onerror="this.style.visibility=\'hidden\'" alt="">' +
          '<div class="b"><div class="nm">' + esc(e.name) + '</div><div class="ty">' + esc(e.type) + (e.confirm ? ' · verify' : '') + '</div>' +
          '<div class="ex">' + esc(exs || '—') + '</div></div></div>';
      }).join('') + '</div>';
  }
  function openEquipment(id) {
    var e = EQ[id]; if (!e) return;
    var el = document.getElementById('s-train');
    el.innerHTML = '<button class="mini" data-action="train-back">‹ Back</button>' +
      '<h2 class="sec" style="margin-top:12px">' + esc(e.name) + '</h2>' +
      '<img src="' + e.photo + '" onerror="this.style.display=\'none\'" style="width:100%;height:200px;object-fit:cover;border-radius:14px;border:1px solid var(--line);margin-bottom:12px" alt="">' +
      (e.note ? '<p class="lede">' + esc(e.note) + '</p>' : '') +
      (e.confirm ? '<div class="panel"><p class="sub" style="margin:0">📸 <b>Verify this one:</b> tell me in the morning if the photo matches the machine name and I\'ll correct it.</p></div>' : '') +
      (e.exerciseIds || []).map(function (id) {
        var ex = EX[id]; if (!ex) return '';
        return '<div class="card"><div class="chead" style="padding:14px"><div><div class="cnum">' + esc(ex.primary.map(function (m) { return MU[m] ? MU[m].name : m; }).join(' + ')) + '</div>' +
          '<div class="cname">' + esc(ex.name) + '</div><div class="ctag">' + ex.repRange[0] + '–' + ex.repRange[1] + ' reps · ' + ex.sets + ' sets</div></div></div>' +
          '<div class="target" style="padding:0 14px 12px"><span class="note" style="max-width:100%;text-align:left;color:var(--muted)"><b style="color:var(--chalk)">Cues:</b> ' + ex.cues.map(esc).join(' · ') + '</span></div></div>';
      }).join('');
  }

  /* ---------- PROGRESS ---------- */
  function renderProgress() {
    var el = document.getElementById('s-progress');
    var wk = L.weeklyVolume(log, EX, todayISO(), 7);
    var heat = L.heat(wk, MUSCLES);
    var cardio = L.cardioMinutes(log, todayISO(), 7);
    var ts = L.totalSets(log), r = L.rank(ts);
    var sessions = Object.keys(log).length;
    // PRs
    var prs = Object.keys(lifts).map(function (id) { return { name: EX[id] ? EX[id].name : id, e: lifts[id].bestE1RM, w: lifts[id].lastWeight }; })
      .filter(function (x) { return x.e > 0; }).sort(function (a, b) { return b.e - a.e; }).slice(0, 6);

    var frontHeat = FIGURE.figureSVG('front', { heat: heat });
    var backHeat = FIGURE.figureSVG('back', { heat: heat });

    var volRows = MUSCLES.slice().sort(function (a, b) { return (heat[b.id] || 0) - (heat[a.id] || 0); }).map(function (m) {
      var got = wk[m.id] ? wk[m.id].sets : 0; var pct = Math.round((heat[m.id] || 0) * 100);
      return '<div class="volrow"><span class="nm">' + esc(m.name) + '</span>' +
        '<div class="volbar"><i style="width:' + pct + '%;background:' + FIGURE.heatColor(heat[m.id] || 0) + '"></i></div>' +
        '<span class="c">' + (Math.round(got * 10) / 10) + '/' + m.weeklyTarget + '</span></div>';
    }).join('');

    el.innerHTML = '<h2 class="sec">Progress</h2><p class="lede">Everything you do — planned or freestyle — in one weekly picture.</p>' +
      '<div class="stats"><div class="stat"><div class="v">' + ts + '</div><div class="k">Total sets</div></div>' +
      '<div class="stat"><div class="v">' + sessions + '</div><div class="k">Sessions</div></div>' +
      '<div class="stat"><div class="v">' + cardio + '</div><div class="k">Cardio min/wk</div></div></div>' +
      '<div class="panel"><div class="lab tinfo" style="margin-bottom:6px"><div class="lab">Weekly heat — what\'s hot, what\'s cold</div></div>' +
      '<div style="display:flex;gap:10px;justify-content:center">' +
      '<div style="width:120px">' + frontHeat + '<div class="date" style="text-align:center;margin-top:4px">FRONT</div></div>' +
      '<div style="width:120px">' + backHeat + '<div class="date" style="text-align:center;margin-top:4px">BACK</div></div></div></div>' +
      '<div class="panel"><div class="lab" style="font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">Weekly sets vs target</div>' + volRows + '</div>' +
      (prs.length ? ('<div class="panel"><div class="lab" style="font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">Personal bests (est. 1-rep max)</div>' +
        prs.map(function (p) { return '<div class="volrow"><span class="nm" style="width:auto;flex:1;color:var(--chalk)">' + esc(p.name) + '</span><span class="mono" style="color:var(--ember);font-size:13px">' + Math.round(L.toDisplay(p.e, cfg.units)) + ' ' + cfg.units + '</span></div>'; }).join('') + '</div>') : '') +
      '<div class="panel"><div class="tinfo"><div class="lab">Rank · ' + r.name + (r.next ? ' → ' + r.next : ' (max)') + '</div>' +
      '<div class="rank"><div class="barwrap" style="margin-top:8px"><div class="bar" style="width:' + Math.round(r.progress * 100) + '%"></div></div></div>' +
      (r.next ? '<p class="sub" style="margin:8px 0 0">' + r.toNext + ' more sets to <b>' + r.next + '</b>.</p>' : '') + '</div></div>';
  }

  /* ---------- PLAN ---------- */
  function renderPlan() {
    var el = document.getElementById('s-plan');
    var cur = plan.cycleIndex;
    el.innerHTML = '<h2 class="sec">Plan</h2><p class="lede">A 7-session cycle — 5 lifting days + 2 cardio. It advances each time you finish a session, so a missed day never leaves a hole.</p>' +
      PROGRAM.cycle.map(function (d, i) {
        var day = PROGRAM.days[d];
        var mus = d === 'cardio' ? 'Treadmill / Elliptical' : day.focusMuscles.map(function (m) { return MU[m] ? MU[m].name : m; }).join(' · ');
        return '<div class="weekrow ' + (i === cur ? 'now ' : '') + (d === 'cardio' ? 'cardio' : '') + '">' +
          '<span class="idx">' + (i + 1) + '</span><span class="nm">' + esc(day.name) + '</span><span class="mus">' + esc(mus) + '</span></div>';
      }).join('') +
      '<div class="panel"><div class="rule" style="border:0;padding:0;margin:0"><b>How weight progresses</b>' +
      '<p>Hit the top of the rep range on every set → the app adds a little weight next time. Fall short twice → it eases off ~10% and you rebuild. You find the first weight; after that it tells you.</p></div></div>' +
      '<div class="panel"><div class="rule" style="border:0;padding:0;margin:0"><b>Why this split</b>' +
      '<p>Push / Pull / Legs / Upper / Lower hits each muscle about twice a week — better for building muscle than training each once. Cardio is spaced so it never sits next to a hard leg day.</p></div></div>' +
      '<div class="panel"><div class="rule" style="border:0;padding:0;margin:0"><b>Units</b>' +
      '<p>Currently showing <b>' + cfg.units + '</b>. <button class="mini" data-action="toggle-units" style="margin-top:8px">Switch to ' + (cfg.units === 'lb' ? 'kg' : 'lb') + '</button></p></div></div>';
  }

  /* ---------- COACH ---------- */
  function renderCoach() {
    var el = document.getElementById('s-coach');
    var rules = [
      ['Leave 1–2 reps in the tank', 'As a beginner, stop each set with a rep or two left. Hard enough to grow, safe enough to keep perfect form.'],
      ['Full range, controlled', 'A slower negative (2s down) and a full stretch beat heaving heavier weight. Feel the muscle, not the momentum.'],
      ['Add reps, then weight', 'Beat last time by a rep or two before you add load. The app tracks this for you (double progression).'],
      ['Never miss twice', 'Life happens — miss a day, fine. Just don\'t miss two in a row. That single rule keeps the habit alive.'],
      ['Warm up the first lift', 'Do 1–2 light sets of your first exercise before your working weight. Joints and reps both get better.'],
      ['Abs are trained, not starved', 'The core finisher builds the muscle. A visible six-pack also needs low body fat — that\'s the kitchen, not the gym.'],
      ['Machine busy? Swap, don\'t wait', 'Tap “Busy?” for a same-muscle alternative and come back. Momentum beats standing around.']
    ];
    el.innerHTML = '<h2 class="sec">Coach</h2><p class="lede">The habits that matter more than any single workout.</p>' +
      rules.map(function (r) { return '<div class="rule"><b>' + esc(r[0]) + '</b><p>' + esc(r[1]) + '</p></div>'; }).join('') +
      '<div class="panel" style="margin-top:12px"><div class="rule" style="border:0;padding:0;margin:0"><b>Your identity</b><p>You\'re not “trying the gym.” You\'re becoming someone who trains. Show up, log it, let the numbers climb. That\'s the whole game.</p></div></div>';
  }

  /* ---------- router ---------- */
  var TAB = 'today';
  function renderTab(t) {
    if (t === 'today') renderToday();
    else if (t === 'train') renderTrain();
    else if (t === 'progress') renderProgress();
    else if (t === 'plan') renderPlan();
    else if (t === 'coach') renderCoach();
  }
  function showTab(t) {
    TAB = t;
    ['today', 'train', 'progress', 'plan', 'coach'].forEach(function (n) {
      document.getElementById('s-' + n).classList.toggle('hidden', n !== t);
    });
    document.querySelectorAll('nav.tabs button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === t); });
    renderTab(t);
    window.scrollTo(0, 0);
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var tab = e.target.closest('nav.tabs button'); if (tab) { showTab(tab.getAttribute('data-tab')); return; }
    var a = e.target.closest('[data-action]'); if (!a) return;
    var act = a.getAttribute('data-action');
    switch (act) {
      case 'start-train': startTrain(); break;
      case 'change-focus': SESSION = { phase: 'focus', dayId: proposedDayId(), budgetMin: 60 }; renderSession(); break;
      case 'pick-time': SESSION.budgetMin = +a.getAttribute('data-min'); SESSION.phase = 'focus'; renderSession(); break;
      case 'pick-focus': buildAndStart(a.getAttribute('data-day')); break;
      case 'pick-machine': { var s = SESSION.built.slots[SESSION.idx]; s.machineId = a.getAttribute('data-machine'); renderActive(); break; }
      case 'check-set': checkSet(+a.getAttribute('data-set')); break;
      case 'busy': busy(); break;
      case 'close-alt': { var p = document.getElementById('altpanel'); if (p) p.remove(); break; }
      case 'swap': { var pp = document.getElementById('altpanel'); if (pp) pp.remove(); swapTo(a.getAttribute('data-ex')); break; }
      case 'requeue': { var q = document.getElementById('altpanel'); if (q) q.remove(); requeue(); break; }
      case 'next-slot': nextSlot(); break;
      case 'cancel-session': SESSION = null; renderToday(); break;
      case 'felt': SESSION.felt = +a.getAttribute('data-v'); document.querySelectorAll('[data-action=felt]').forEach(function (b) { b.classList.remove('sel'); }); a.classList.add('sel'); break;
      case 'save-session': { var n = document.getElementById('snote'); SESSION.note = n ? n.value : ''; saveLiftSession(); break; }
      case 'pick-modality': SESSION.cardio.exId = a.getAttribute('data-ex'); renderCardio(); break;
      case 'log-cardio': saveCardio(); break;
      case 'train-filter': trainFilter = a.getAttribute('data-cat'); renderTrain(); break;
      case 'open-eq': openEquipment(a.getAttribute('data-eq')); break;
      case 'train-back': renderTrain(); break;
      case 'toggle-units': cfg.units = cfg.units === 'lb' ? 'kg' : 'lb'; set('muscles-config', cfg); renderPlan(); toast('Now showing ' + cfg.units); break;
    }
  });

  /* ---------- boot ---------- */
  updateHeader();
  showTab('today');
})();
