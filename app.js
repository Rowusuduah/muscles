/* muscles — app controller (v2). Onboarding, two training modes (alone = coached
   PPL adaptive; partner = classic body-part, search & add), timed Start/End set
   logging, animated how-to, multi-use machines, calendar, adaptive coach. */
(function () {
  'use strict';
  var EX = L.byId(EXERCISES), MU = L.byId(MUSCLES), EQ = L.byId(EQUIPMENT);

  /* ---------- storage ---------- */
  var mem = {};
  function get(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : (mem[k] !== undefined ? mem[k] : d); } catch (e) { return mem[k] !== undefined ? mem[k] : d; } }
  function set(k, v) { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function todayISO() { var d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  function nowClock() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }

  /* ---------- state ---------- */
  var cfg = get('muscles-config', { units: 'lb', start: todayISO(), figure: 'male', onboarded: false, name: '' });
  var plan = get('muscles-plan', { cycleIndex: 0, sessionCount: 0, calibrated: false });
  var lifts = get('muscles-lifts', {});
  var log = get('muscles-log', {});
  var eqNames = get('muscles-eqnames', {}); // user's corrected machine names
  if (!cfg.start) { cfg.start = todayISO(); set('muscles-config', cfg); }
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
  function shot(machine, cls) { return machine && machine.photo ? '<img class="shot ' + (cls || '') + '" src="' + machine.photo + '" onerror="this.style.display=\'none\'" alt="">' : '<div class="shot ph ' + (cls || '') + '">NO<br>PHOTO</div>'; }

  /* ---------- header ---------- */
  function updateHeader() {
    var d = new Date();
    document.getElementById('date').textContent = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()] + ' · ' + ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][d.getMonth()] + ' ' + d.getDate();
    var ts = L.totalSets(log), r = L.rank(ts);
    document.getElementById('ranklab').textContent = 'Rank · ' + r.name + (r.next ? ' → ' + r.next : '');
    document.getElementById('rankbar').style.width = Math.round(r.progress * 100) + '%';
    document.getElementById('streak').textContent = L.streak(log, todayISO());
  }

  /* ---------- onboarding ---------- */
  function renderOnboarding() {
    var el = document.getElementById('s-today');
    el.innerHTML = '<div class="onboard fade">' +
      '<div class="eyebrow">Welcome</div><h1>Let\'s build muscle.</h1>' +
      '<p class="sub">I\'m your coach. I\'ll tell you what to do, how to do it, and track everything — you just show up.</p>' +
      '<input class="search" id="obname" placeholder="Your name (optional)">' +
      '<div class="obpoint"><span class="n">1</span><p><b>Train alone</b> and I coach you through a smart Push/Pull/Legs plan that fits your time.</p></div>' +
      '<div class="obpoint"><span class="n">2</span><p><b>Training with a friend?</b> Switch to the classic Chest / Back / Legs style and add any machine you want.</p></div>' +
      '<div class="obpoint"><span class="n">3</span><p>Every exercise has a <b>short animation</b> showing how to do it right. You don\'t need to know anything yet.</p></div>' +
      '<div class="unitpick"><button data-action="ob-unit" data-u="lb" class="' + (cfg.units === 'lb' ? 'on' : '') + '">Pounds (lb)</button>' +
      '<button data-action="ob-unit" data-u="kg" class="' + (cfg.units === 'kg' ? 'on' : '') + '">Kilograms (kg)</button></div>' +
      '<button class="cta" data-action="ob-done">Start training →</button></div>';
  }

  /* ---------- TODAY / home ---------- */
  function proposedAlone() {
    if (plan.sessionCount === 0) return { dayId: 'push', reason: 'Let\'s start with a Push day — chest, shoulders, triceps.' };
    return L.nextAloneDay(PROGRAM, EX, MUSCLES, log, todayISO());
  }
  function renderToday() {
    if (!cfg.onboarded) return renderOnboarding();
    if (SESSION) return renderSession();
    var prop = proposedAlone();
    var day = PROGRAM.days[prop.dayId];
    var isCardio = prop.dayId === 'cardio';
    var mark = isCardio ? {} : focusMark(day.focusMuscles, day.slots);
    var wk = L.weeklyVolume(log, EX, todayISO(), 7);
    var recs = L.recommendations(wk, MUSCLES, 0.6);
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
      '<span><span class="t">Train alone</span><span class="d">I coach you · today: ' + esc(day.name) + '</span></span></button>' +
      '<button class="modebtn" data-action="start-partner"><span class="ic"><svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c0-3.5 2.7-6 6-6s6 2.5 6 6M14.5 20c.2-2.6 1.8-4.4 4-4.4s3.3 1.4 3.5 4.4"/></svg></span>' +
      '<span><span class="t">Train with a partner</span><span class="d">You lead · classic Chest / Back / Legs</span></span></button>' +
      (recs.length && Object.keys(log).length ? '<div class="panel fade" style="margin-top:14px"><div class="tinfo"><div class="lab">Light this week — I\'ll steer toward these</div><div class="chips">' + recs.slice(0, 4).map(function (r) { return '<span class="chip cool">' + esc(r.name) + '</span>'; }).join('') + '</div></div></div>' : '');
  }

  /* ---------- ALONE flow ---------- */
  function startAlone() { SESSION = { mode: 'alone', phase: 'time', dayId: proposedAlone().dayId, budgetMin: null }; renderSession(); }
  function renderTime() {
    var el = document.getElementById('s-today');
    el.innerHTML = '<div class="eyebrow">Before we start</div><h1 class="day">How long?</h1>' +
      '<p class="sub">I\'ll fit the session to your time — <b>more time, more work.</b></p>' +
      '<div class="timegrid">' + [30, 45, 60, 90, 120].map(function (m) { return '<button class="timechip" data-action="pick-time" data-min="' + m + '"><div class="big">' + m + '</div><div class="u">min</div></button>'; }).join('') +
      '<button class="timechip" data-action="pick-time" data-min="20"><div class="big">20</div><div class="u">quick</div></button></div>' +
      '<button class="cta sub" data-action="cancel-session">Cancel</button>';
  }
  function renderFocus() {
    var el = document.getElementById('s-today'); var proposed = SESSION.dayId;
    el.innerHTML = '<div class="eyebrow">What are we doing?</div><h1 class="day">Focus</h1>' +
      '<p class="sub">I suggest <b>' + esc(PROGRAM.days[proposed].name) + '</b>. Keep it or pick another.</p>' +
      ['push', 'pull', 'legs', 'upper', 'lower', 'cardio'].map(function (d) {
        var day = PROGRAM.days[d];
        var mus = d === 'cardio' ? 'Treadmill · Elliptical' : day.focusMuscles.map(function (m) { return MU[m] ? MU[m].name : m; }).join(' · ');
        return '<div class="weekrow ' + (d === proposed ? 'now ' : '') + (d === 'cardio' ? 'cardio' : '') + '" data-action="pick-focus" data-day="' + d + '"><span class="nm">' + esc(day.name) + '</span><span class="mus">' + esc(mus) + '</span></div>';
      }).join('') + '<div style="height:8px"></div><button class="cta sub" data-action="cancel-session">Cancel</button>';
  }
  function buildAndStart(dayId) {
    SESSION.dayId = dayId;
    if (dayId === 'cardio') { SESSION.phase = 'cardio'; SESSION.cardio = L.buildCardio(PROGRAM, EX, SESSION.budgetMin); return renderSession(); }
    var recs = L.recommendations(L.weeklyVolume(log, EX, todayISO(), 7), MUSCLES, 0.6).map(function (r) { return r.id; });
    SESSION.built = prepBuilt(L.buildSession(PROGRAM, EX, dayId, SESSION.budgetMin, { undertrained: recs }));
    SESSION.idx = 0; SESSION.phase = 'active'; renderSession();
  }

  /* ---------- PARTNER flow ---------- */
  function startPartner() { SESSION = { mode: 'partner', phase: 'part' }; renderSession(); }
  function renderPart() {
    var el = document.getElementById('s-today');
    el.innerHTML = '<div class="topbar"><div class="eyebrow">Training with a partner</div><button class="mini" data-action="cancel-session">Cancel</button></div>' +
      '<h1 class="day">What today?</h1><p class="sub">Pick a body part — I\'ll suggest exercises and you can <b>search & add</b> any machine.</p>' +
      '<div class="partgrid">' + PROGRAM.bodyParts.map(function (p) {
        return '<button class="partbtn" data-action="pick-part" data-part="' + p.id + '"><span class="t">' + esc(p.name) + '</span><span class="d">' + p.muscles.map(function (m) { return MU[m] ? MU[m].name : m; }).slice(0, 3).join(' · ') + '</span></button>';
      }).join('') + '</div>';
  }
  function renderCompose() {
    var el = document.getElementById('s-today');
    var part = PROGRAM.bodyParts.filter(function (p) { return p.id === SESSION.part; })[0];
    var q = (SESSION.query || '').toLowerCase();
    var pool = L.exercisesForBodyPart(part, EXERCISES);
    if (q) pool = pool.filter(function (e) { return e.name.toLowerCase().indexOf(q) >= 0 || (machinesForEx(e.id)[0] && machinesForEx(e.id)[0].name.toLowerCase().indexOf(q) >= 0); });
    SESSION.picked = SESSION.picked || PROGRAM.classic[SESSION.part].slice(0, 5);
    var picked = SESSION.picked;
    el.innerHTML = '<div class="topbar"><div class="eyebrow">' + esc(part.name) + ' · with a partner</div><button class="mini" data-action="partner-back">‹ Parts</button></div>' +
      '<h1 class="day">Build it</h1><p class="sub">Tap to add or remove. <b>' + picked.length + ' picked.</b></p>' +
      '<input class="search" id="exsearch" placeholder="Search a machine or exercise…" value="' + esc(SESSION.query || '') + '" oninput="window.__search(this.value)">' +
      pool.map(function (e) {
        var m = machinesForEx(e.id)[0]; var on = picked.indexOf(e.id) >= 0;
        var thumb = m && m.photo ? '<img class="exthumb" src="' + m.photo + '" onerror="this.style.visibility=\'hidden\'" alt="">' : '<div class="exthumb ph">?</div>';
        return '<div class="exrow ' + (on ? 'on' : '') + '" data-action="toggle-ex" data-ex="' + e.id + '">' + thumb + '<div class="nm"><b>' + esc(e.name) + '</b><span>' + esc(e.primary.map(function (x) { return MU[x] ? MU[x].name : x; }).join(', ')) + (m ? ' · ' + esc(nameOf(m)) : '') + '</span></div><button class="add">' + (on ? '✓' : '+') + '</button></div>';
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
    var part = PROGRAM.bodyParts.filter(function (p) { return p.id === SESSION.part; })[0];
    SESSION.built = prepBuilt(L.buildCustom(SESSION.picked, EX, min || null, part.name));
    SESSION.budgetMin = min || null; SESSION.idx = 0; SESSION.phase = 'active'; renderSession();
  }

  /* set object + fresh log */
  function newSet(weight, kind) { return { kind: kind || 'work', reps: null, weight: weight, done: false, running: false, startMs: 0, durSec: 0, endClock: '', clusters: [], b: null, rp: false }; }
  function freshLog(n, weight) { var a = []; for (var i = 0; i < n; i++) a.push(newSet(weight)); return a; }

  /* prepare a built session's per-slot working state */
  function prepBuilt(built) {
    built.slots.forEach(function (s) {
      var pre = L.prescribe(s.ex, lifts[s.exId]);
      s.machineId = (machinesForEx(s.exId)[0] || {}).id || null;
      s.pre = pre; s.showHow = false; s.superEx = null;
      s.log = freshLog(s.sets, pre.weight);
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
      machines.map(function (m) { return '<div class="macho ' + (m.id === s.machineId ? 'sel' : '') + '" data-action="pick-machine" data-machine="' + m.id + '"><img src="' + m.photo + '" onerror="this.style.visibility=\'hidden\'" alt=""><div class="nm">' + esc(nameOf(m)) + '</div></div>'; }).join('') + '</div>' +
      multiUse(machSel, s) + '</div>' : '';

    var tgt = s.pre.mode === 'calibrate' ? 'find your weight' : wLbl(s.pre.weight);
    var target = '<div class="target"><span class="t">' + s.sets + ' × ' + ex.repRange[0] + '–' + ex.repRange[1] + ' · ' + tgt + '</span><span class="note">' + esc(s.pre.note) + '</span></div>';

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
        '<div class="sets">' + rows + '</div>' +
        '<div class="cfoot"><span class="cue"><b>Cue:</b> ' + esc(ex.cues[0]) + '</span>' +
        '<button class="mini" data-action="add-warmup">+ Warm-up</button>' +
        '<button class="mini ' + (s.superEx ? 'busy' : '') + '" data-action="superset">' + (s.superEx ? 'Superset ✓' : '+ Superset') + '</button>' +
        '<button class="mini busy" data-action="busy">Busy?</button>' +
        '<button class="next-btn" data-action="next-slot">' + (last ? 'Finish ▸' : 'Next ▸') + '</button></div></div>';
    if (SESSION._rest) startRestUI(SESSION._rest);
  }

  function multiUse(machine, slot) {
    if (!machine) return '';
    var others = (machine.exerciseIds || []).filter(function (id) { return id !== slot.exId && EX[id]; });
    if (!others.length) return '';
    return '<div class="lab" style="margin:8px 0 6px">This machine also does — tap to switch</div><div class="chips">' +
      others.map(function (id) { return '<span class="chip cool tap" data-action="switch-ex" data-ex="' + id + '">' + esc(EX[id].name) + '</span>'; }).join('') + '</div>';
  }

  function setNumber(s, i) { var n = 0; for (var j = 0; j <= i; j++) if (s.log[j].kind !== 'warmup') n++; return n; }
  function slabFor(x, s, i) { return x.kind === 'warmup' ? 'WARM' : 'SET ' + setNumber(s, i); }
  function shortName(ex) { return ex ? ex.name.split(' ')[0] : ''; }
  function subInputs(x, i, ex, superEx) {
    var wD = x.weight != null ? L.toDisplay(x.weight, cfg.units) : '';
    var A = '<div class="subin">' + (superEx ? '<span class="subnm">' + esc(shortName(ex)) + '</span>' : '') +
      '<input type="number" inputmode="numeric" placeholder="reps" value="' + (x.reps != null ? x.reps : '') + '" data-set="' + i + '" data-f="reps">' +
      '<input type="number" inputmode="decimal" placeholder="wt" value="' + wD + '" data-set="' + i + '" data-f="weight"><span class="x">' + cfg.units + '</span></div>';
    if (!superEx) return A;
    var b = x.b || {}; var bw = b.weight != null ? L.toDisplay(b.weight, cfg.units) : '';
    var B = '<div class="subin"><span class="subnm">' + esc(shortName(EX[superEx])) + '</span>' +
      '<input type="number" inputmode="numeric" placeholder="reps" value="' + (b.reps != null ? b.reps : '') + '" data-set="' + i + '" data-f="breps">' +
      '<input type="number" inputmode="decimal" placeholder="wt" value="' + bw + '" data-set="' + i + '" data-f="bweight"><span class="x">' + cfg.units + '</span></div>';
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
      var rp = x.rp
        ? '<span class="rpadd"><input type="number" inputmode="numeric" placeholder="+reps" data-rp="' + i + '"><button class="mini" data-action="rp-add" data-set="' + i + '">Add</button></span>'
        : (x.kind !== 'warmup' ? '<button class="rpbtn" data-action="rp-open" data-set="' + i + '">+ rest-pause</button>' : '');
      return '<div class="setrow done2">' + main + rp + '<span class="tick done" style="margin-left:auto"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></span></div>';
    }
    if (x.running) {
      return '<div class="setrow run ' + (s.superEx ? 'col' : '') + '"><span class="slab">' + no + '</span>' + subInputs(x, i, ex, s.superEx) +
        '<button class="endbtn" data-action="end-set" data-set="' + i + '">End <span class="tmr" id="tmr-' + i + '">0s</span></button></div>';
    }
    var firstIdle = s.log.findIndex(function (y) { return !y.done && !y.running; });
    if (i === firstIdle) {
      return '<div class="setrow"><span class="slab">' + no + '</span><button class="startbtn" data-action="start-set" data-set="' + i + '">Start ' + (x.kind === 'warmup' ? 'warm-up' : 'set ' + setNumber(s, i)) + '</button></div>';
    }
    return '<div class="setrow"><span class="slab">' + no + '</span><span class="setsummary u" style="color:var(--muted2)">target ' + ex.repRange[0] + '–' + ex.repRange[1] + ' · ' + wLbl(x.weight) + '</span></div>';
  }

  function howPanel(ex) {
    var steps = HOWTO.steps(ex.pattern);
    return '<div class="howwrap"><div class="howfig"><div class="howv">' + HOWTO.howtoSVG(ex.pattern, 'right') + '</div>' +
      '<div class="howv hidden">' + HOWTO.howtoSVG(ex.pattern, 'wrong') + '</div>' +
      '<div class="howtog"><button class="on" onclick="window.__howtog(this,0)">✓ Right</button><button onclick="window.__howtog(this,1)">✗ Wrong</button></div></div>' +
      '<div style="flex:1"><ol class="steps">' + steps.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>' +
      '<div class="howmiss"><b>Don\'t:</b> ' + esc(HOWTO.wrongLabel(ex.pattern)) + '.</div></div></div>';
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
    var reps = rIn && rIn.value !== '' ? parseInt(rIn.value, 10) : null;
    if (!reps) { toast('How many reps did you get?'); if (rIn) rIn.focus(); s.log[i].running = true; return; }
    s.log[i].reps = reps; s.log[i].clusters = [reps];
    if (wIn && wIn.value !== '') s.log[i].weight = L.fromInput(wIn.value, cfg.units);
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
      alts.map(function (a) { var m = machinesForEx(a.id)[0]; return '<div class="weekrow" data-action="swap" data-ex="' + a.id + '"><span class="nm" style="font-size:15px">' + esc(a.name) + '</span><span class="mus">' + esc(m ? m.name : a.equipType) + '</span></div>'; }).join('') +
      '<div class="weekrow" data-action="requeue" style="border-style:dashed"><span class="nm" style="font-size:15px;color:var(--steel)">Come back later ↻</span><span class="mus">skip &amp; requeue</span></div>' +
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
      opts.map(function (id) { var m = machinesForEx(id)[0]; return '<div class="weekrow" data-action="pick-super" data-ex="' + id + '"><span class="nm" style="font-size:15px">' + esc(EX[id].name) + '</span><span class="mus">' + esc(m ? m.name : EX[id].equipType) + '</span></div>'; }).join('') +
      (s.superEx ? '<div class="weekrow" data-action="pick-super" data-ex="" style="border-style:dashed"><span class="nm" style="font-size:15px;color:var(--steel)">Remove superset</span></div>' : '') +
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
      c.modalities.map(function (id) { return '<div class="macho ' + (id === c.exId ? 'sel' : '') + '" data-action="pick-modality" data-ex="' + id + '" style="width:150px"><div class="nm" style="padding:14px 10px;font-family:var(--disp);text-transform:uppercase">' + esc(EX[id].name) + '</div></div>'; }).join('') + '</div></div>' +
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
      var sets = work.map(function (x) { return { reps: x.reps, weight: x.weight || 0, durSec: Math.round(x.durSec), endClock: x.endClock, clusters: (x.clusters && x.clusters.length > 1) ? x.clusters : undefined }; });
      if (sets.length) { entry.exercises.push({ exId: s.exId, machineId: s.machineId, sets: sets }); lifts[s.exId] = L.updateLift(lifts[s.exId], s.ex, sets); }
      if (s.superEx) {
        var bsets = work.filter(function (x) { return x.b && x.b.reps > 0; }).map(function (x) { return { reps: x.b.reps, weight: x.b.weight || 0 }; });
        if (bsets.length) { entry.exercises.push({ exId: s.superEx, sets: bsets, superOf: s.exId }); lifts[s.superEx] = L.updateLift(lifts[s.superEx], EX[s.superEx], bsets); }
      }
    });
    log[date] = entry; set('muscles-log', log); set('muscles-lifts', lifts);
    plan.cycleIndex = L.nextIndex(PROGRAM, plan.cycleIndex); plan.sessionCount++; plan.calibrated = true; set('muscles-plan', plan);
    var pr = celebrate(entry); SESSION = null; updateHeader(); renderToday(); toast(pr || 'Session saved — nice work 💪');
  }
  function saveCardio() {
    var min = parseInt((document.getElementById('cardiomin') || {}).value, 10) || SESSION.cardio.minutes;
    var eff = parseInt((document.getElementById('cardioeff') || {}).value, 10) || null;
    log[todayISO()] = { day: 'cardio', mode: SESSION.mode, cardio: { modality: EX[SESSION.cardio.exId].equipType, kind: 'steady', minutes: min, avgEffort: eff }, felt: null, note: '' };
    set('muscles-log', log); plan.cycleIndex = L.nextIndex(PROGRAM, plan.cycleIndex); plan.sessionCount++; set('muscles-plan', plan);
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

  /* ---------- TRAIN explorer ---------- */
  var trainFilter = 'all';
  function renderTrain() {
    var el = document.getElementById('s-train');
    var cats = ['all', 'chest', 'back', 'shoulders', 'arms', 'legs', 'glutes', 'abs', 'cardio'];
    var list = EQUIPMENT.filter(function (e) { return trainFilter === 'all' || (e.cats || []).indexOf(trainFilter) >= 0; });
    el.innerHTML = '<h2 class="sec">Train</h2><p class="lede">Browse by body part → pick a machine → see how to use it (with an animation).</p>' +
      '<div class="bodyparts">' + cats.map(function (c) { return '<button class="bp ' + (c === trainFilter ? 'on' : '') + '" data-action="train-filter" data-cat="' + c + '">' + c + '</button>'; }).join('') + '</div>' +
      '<div class="eqgrid">' + list.map(function (e) {
        var exs = (e.exerciseIds || []).map(function (id) { return EX[id] ? EX[id].name : id; }).slice(0, 3).join(', ');
        return '<div class="eqcard" data-action="open-eq" data-eq="' + e.id + '"><img src="' + e.photo + '" onerror="this.style.visibility=\'hidden\'" alt=""><div class="b"><div class="nm">' + esc(nameOf(e)) + '</div><div class="ty">' + esc(e.type) + (e.confirm ? ' · verify' : '') + '</div><div class="ex">' + esc(exs || '—') + '</div></div></div>';
      }).join('') + '</div>';
  }
  function openEquipment(id) {
    var e = EQ[id]; if (!e) return; var el = document.getElementById('s-train');
    el.innerHTML = '<button class="mini" data-action="train-back">‹ Back</button>' +
      '<h2 class="sec" style="margin-top:12px">' + esc(nameOf(e)) + '</h2>' +
      '<img src="' + e.photo + '" onerror="this.style.display=\'none\'" style="width:100%;height:260px;object-fit:contain;background:var(--panel2);border-radius:14px;border:1px solid var(--line);margin-bottom:12px" alt="">' +
      '<div class="panel"><div class="lab" style="font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;color:var(--muted);text-transform:uppercase">Wrong name? Fix it — saved on your device</div>' +
      '<div style="display:flex;gap:8px;margin-top:8px"><input class="search" id="eqrename" style="margin:0" value="' + esc(nameOf(e)) + '"><button class="mini" data-action="save-eqname" data-eq="' + e.id + '" style="flex:0 0 auto">Save</button></div></div>' +
      (e.note ? '<p class="lede">' + esc(e.note) + '</p>' : '') +
      ((e.exerciseIds || []).length > 1 ? '<p class="lede">This machine does <b>' + e.exerciseIds.length + ' exercises</b> — here\'s each, with how to do it:</p>' : '') +
      (e.confirm ? '<div class="panel"><p class="sub" style="margin:0">📸 <b>Verify this one:</b> tell me if the photo matches the name and I\'ll correct it.</p></div>' : '') +
      (e.exerciseIds || []).map(function (xid) {
        var ex = EX[xid]; if (!ex) return '';
        return '<div class="card"><div class="chead" style="padding:14px"><div><div class="cnum">' + esc(ex.primary.map(function (m) { return MU[m] ? MU[m].name : m; }).join(' + ')) + '</div><div class="cname">' + esc(ex.name) + '</div><div class="ctag">' + ex.repRange[0] + '–' + ex.repRange[1] + ' reps · ' + ex.sets + ' sets</div></div></div>' + howPanel(ex) + '</div>';
      }).join('');
  }

  /* ---------- PROGRESS ---------- */
  function renderProgress() {
    var el = document.getElementById('s-progress');
    var wk = L.weeklyVolume(log, EX, todayISO(), 7), heat = L.heat(wk, MUSCLES);
    var cardio = L.cardioMinutes(log, todayISO(), 7), ts = L.totalSets(log), r = L.rank(ts), sessions = Object.keys(log).length;
    var prs = Object.keys(lifts).map(function (id) { return { name: EX[id] ? EX[id].name : id, e: lifts[id].bestE1RM }; }).filter(function (x) { return x.e > 0; }).sort(function (a, b) { return b.e - a.e; }).slice(0, 6);
    var volRows = MUSCLES.slice().sort(function (a, b) { return (heat[b.id] || 0) - (heat[a.id] || 0); }).map(function (m) {
      var got = wk[m.id] ? wk[m.id].sets : 0, pct = Math.round((heat[m.id] || 0) * 100);
      return '<div class="volrow"><span class="nm">' + esc(m.name) + '</span><div class="volbar"><i style="width:' + pct + '%;background:' + FIGURE.heatColor(heat[m.id] || 0) + '"></i></div><span class="c">' + (Math.round(got * 10) / 10) + '/' + m.weeklyTarget + '</span></div>';
    }).join('');
    el.innerHTML = '<h2 class="sec">Progress</h2><p class="lede">Everything you do — coached or freestyle — in one weekly picture.</p>' +
      '<div class="stats"><div class="stat"><div class="v">' + ts + '</div><div class="k">Total sets</div></div><div class="stat"><div class="v">' + sessions + '</div><div class="k">Sessions</div></div><div class="stat"><div class="v">' + cardio + '</div><div class="k">Cardio min/wk</div></div></div>' +
      '<div class="panel"><div class="lab" style="font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">Weekly heat — what\'s hot, what\'s cold</div><div style="display:flex;gap:10px;justify-content:center"><div style="width:120px">' + FIGURE.figureSVG('front', { heat: heat }) + '<div class="date" style="text-align:center;margin-top:4px">FRONT</div></div><div style="width:120px">' + FIGURE.figureSVG('back', { heat: heat }) + '<div class="date" style="text-align:center;margin-top:4px">BACK</div></div></div></div>' +
      '<div class="panel"><div class="lab" style="font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">Weekly sets vs target</div>' + volRows + '</div>' +
      (prs.length ? '<div class="panel"><div class="lab" style="font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">Personal bests (est. 1-rep max)</div>' + prs.map(function (p) { return '<div class="volrow"><span class="nm" style="width:auto;flex:1;color:var(--chalk)">' + esc(p.name) + '</span><span class="mono" style="color:var(--ember);font-size:13px">' + Math.round(L.toDisplay(p.e, cfg.units)) + ' ' + cfg.units + '</span></div>'; }).join('') + '</div>' : '') +
      '<div class="panel"><div class="tinfo"><div class="lab">Rank · ' + r.name + (r.next ? ' → ' + r.next : ' (max)') + '</div><div class="barwrap" style="margin-top:8px"><div class="bar" style="width:' + Math.round(r.progress * 100) + '%"></div></div>' + (r.next ? '<p class="sub" style="margin:8px 0 0">' + r.toNext + ' more sets to <b>' + r.next + '</b>.</p>' : '') + '</div></div>';
  }

  /* ---------- HISTORY / calendar ---------- */
  var calMonth = null;
  function renderHistory() {
    var el = document.getElementById('s-history');
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
    el.innerHTML = '<h2 class="sec">History</h2><p class="lede">Every session on a calendar. Tap a day to see exactly what you did.</p>' +
      '<div class="panel"><div class="calhead"><button ' + (prevOk ? 'data-action="cal-prev"' : 'disabled') + '>‹</button><span class="m">' + monName + ' ' + calMonth.y + '</span><button ' + (nextOk ? 'data-action="cal-next"' : 'disabled') + '>›</button></div>' +
      '<div class="calgrid">' + ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(function (x) { return '<div class="cdow">' + x + '</div>'; }).join('') + cells.join('') + '</div>' +
      '<div class="caldetail" id="caldetail"></div></div>' +
      '<div class="panel"><div class="tinfo"><div class="lab">Legend</div><div class="chips"><span class="chip">lifting day</span><span class="chip cool" style="color:var(--steel);border-color:rgba(108,151,188,.4)">cardio</span><span class="chip cool">• skin/note</span></div></div></div>';
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
    wrap.innerHTML = '<div class="lab" style="font-family:var(--mono);font-size:10px;color:var(--muted);text-transform:uppercase;margin-bottom:2px">' + head + ' · ' + esc(PROGRAM.days[e.day] ? PROGRAM.days[e.day].name : e.day) + (e.mode ? ' · ' + e.mode : '') + '</div>' +
      '<div class="date" style="margin-bottom:6px">' + (e.exercises || []).length + ' exercises · ' + fmtDur(totMin) + ' work' + (e.felt ? ' · felt ' + e.felt + '/5' : '') + '</div>' + body + (e.note ? '<p class="sub" style="margin:8px 0 0">“' + esc(e.note) + '”</p>' : '');
  }

  /* ---------- COACH ---------- */
  function renderCoach() {
    var el = document.getElementById('s-coach');
    var rules = [
      ['Leave 1–2 reps in the tank', 'As a beginner, stop each set with a rep or two left. Hard enough to grow, safe enough to keep perfect form.'],
      ['Add reps, then weight', 'Beat last time by a rep or two before adding load. The app tracks this and tells you when to go up.'],
      ['Full range, slow negative', 'Lower for about 2 seconds and use the full stretch. That beats heaving heavier weight.'],
      ['Never miss twice', 'Miss a day — fine. Just don\'t miss two in a row. That one rule keeps the habit alive.'],
      ['Warm up the first lift', 'Do 1–2 light sets of your first exercise before your working weight.'],
      ['Machine busy? Swap, don\'t wait', 'Tap "Busy?" for a same-muscle alternative and come back. Momentum beats standing around.']
    ];
    el.innerHTML = '<h2 class="sec">Coach</h2><p class="lede">The habits that matter more than any single workout.</p>' +
      rules.map(function (r) { return '<div class="rule"><b>' + esc(r[0]) + '</b><p>' + esc(r[1]) + '</p></div>'; }).join('') +
      '<h2 class="sec">Your plan</h2><p class="lede">When you train alone, I cycle these — 5 lifting days + 2 cardio — and adapt to what you actually did.</p>' +
      PROGRAM.cycle.map(function (d, i) { var day = PROGRAM.days[d]; var mus = d === 'cardio' ? 'Treadmill / Elliptical' : day.focusMuscles.map(function (m) { return MU[m] ? MU[m].name : m; }).join(' · '); return '<div class="weekrow ' + (d === 'cardio' ? 'cardio' : '') + '"><span class="idx">' + (i + 1) + '</span><span class="nm">' + esc(day.name) + '</span><span class="mus">' + esc(mus) + '</span></div>'; }).join('') +
      '<div class="panel" style="margin-top:12px"><div class="rule" style="border:0;padding:0;margin:0"><b>How weight progresses</b><p>Hit the top of the rep range on all sets → I add a little next time. Fall short twice → I ease off ~10% and you rebuild.</p></div></div>' +
      '<div class="panel"><div class="rule" style="border:0;padding:0;margin:0"><b>Six-pack, honestly</b><p>The abs finisher builds the muscle. Seeing it also needs lower body fat — that\'s food, not the gym.</p></div></div>' +
      '<div class="panel"><div class="rule" style="border:0;padding:0;margin:0"><b>Units</b><p>Showing <b>' + cfg.units + '</b>. <button class="mini" data-action="toggle-units" style="margin-top:8px">Switch to ' + (cfg.units === 'lb' ? 'kg' : 'lb') + '</button></p></div></div>';
  }

  /* ---------- router ---------- */
  function renderTab(t) { ({ today: renderToday, train: renderTrain, progress: renderProgress, history: renderHistory, coach: renderCoach }[t] || renderToday)(); }
  function showTab(t) {
    ['today', 'train', 'progress', 'history', 'coach'].forEach(function (n) { document.getElementById('s-' + n).classList.toggle('hidden', n !== t); });
    document.querySelectorAll('nav.tabs button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === t); });
    renderTab(t); window.scrollTo(0, 0);
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var tab = e.target.closest('nav.tabs button'); if (tab) return showTab(tab.getAttribute('data-tab'));
    var a = e.target.closest('[data-action]'); if (!a) return;
    var act = a.getAttribute('data-action'), d = a.getAttribute.bind(a);
    switch (act) {
      case 'ob-unit': cfg.units = d('data-u'); document.querySelectorAll('[data-action=ob-unit]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-u') === cfg.units); }); break;
      case 'ob-done': cfg.name = (document.getElementById('obname') || {}).value || ''; cfg.onboarded = true; set('muscles-config', cfg); renderToday(); break;
      case 'start-alone': startAlone(); break;
      case 'start-partner': startPartner(); break;
      case 'pick-time': SESSION.budgetMin = +d('data-min'); SESSION.phase = 'focus'; renderSession(); break;
      case 'pick-focus': buildAndStart(d('data-day')); break;
      case 'pick-part': SESSION.part = d('data-part'); SESSION.picked = PROGRAM.classic[SESSION.part].slice(0, 5); SESSION.query = ''; SESSION.phase = 'compose'; renderSession(); break;
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
      case 'train-filter': trainFilter = d('data-cat'); renderTrain(); break;
      case 'open-eq': openEquipment(d('data-eq')); break;
      case 'save-eqname': { var v = ((document.getElementById('eqrename') || {}).value || '').trim(); var eid = d('data-eq'); if (v) eqNames[eid] = v; else delete eqNames[eid]; set('muscles-eqnames', eqNames); openEquipment(eid); toast('Name saved ✓'); break; }
      case 'train-back': renderTrain(); break;
      case 'cal-prev': calMonth.m--; if (calMonth.m < 0) { calMonth.m = 11; calMonth.y--; } renderHistory(); break;
      case 'cal-next': calMonth.m++; if (calMonth.m > 11) { calMonth.m = 0; calMonth.y++; } renderHistory(); break;
      case 'cal-day': calDay(d('data-d')); break;
      case 'toggle-units': cfg.units = cfg.units === 'lb' ? 'kg' : 'lb'; set('muscles-config', cfg); renderCoach(); toast('Now showing ' + cfg.units); break;
    }
  });

  /* ---------- boot ---------- */
  updateHeader(); showTab('today');
})();
