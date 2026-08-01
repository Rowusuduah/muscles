/* muscles — pure logic engine. No DOM, no storage.
   Every function takes its data explicitly so it is unit-testable with node --test.
   Browser: exposes global `L`. Node: module.exports. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.L = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  var LB_PER_KG = 2.2046226218;

  /* ---------------- units ---------------- */
  function lbToKg(lb) { return lb / LB_PER_KG; }
  function kgToLb(kg) { return kg * LB_PER_KG; }
  // canonical storage is lb; convert for display/input
  function toDisplay(lb, unit) {
    if (lb == null) return null;
    if (unit === 'kg') return Math.round(lbToKg(lb) * 2) / 2;   // nearest 0.5 kg
    return Math.round(lb);                                       // nearest 1 lb
  }
  function fromInput(val, unit) {
    if (val == null || val === '') return null;
    var n = parseFloat(val);
    if (isNaN(n)) return null;
    return unit === 'kg' ? kgToLb(n) : n;                        // store lb
  }

  /* ---------------- strength math ---------------- */
  function e1rm(weightLb, reps) {                                // Epley
    if (!weightLb || !reps) return 0;
    if (reps === 1) return weightLb;
    return weightLb * (1 + reps / 30);
  }

  /* ---------------- cycle ---------------- */
  function dayIdAt(program, cycleIndex) {
    var c = program.cycle;
    return c[((cycleIndex % c.length) + c.length) % c.length];
  }
  function nextIndex(program, cycleIndex) {
    return (cycleIndex + 1) % program.cycle.length;
  }

  /* ---------------- lookups ---------------- */
  function byId(list) { var m = {}; list.forEach(function (x) { m[x.id] = x; }); return m; }

  // exercise ids that exist somewhere in the user's equipment
  function availableExerciseIds(equipment) {
    var s = {};
    equipment.forEach(function (e) { (e.exerciseIds || []).forEach(function (id) { s[id] = true; }); });
    return s;
  }
  // which equipment can perform an exercise (for "pick your machine")
  function machinesForExercise(exId, equipment) {
    return equipment.filter(function (e) { return (e.exerciseIds || []).indexOf(exId) >= 0; });
  }

  /* ---------------- session builder (time-aware) ---------------- */
  var SET_SEC = 40, SETUP_SEC = 60;
  function slotSeconds(ex, sets) {
    if (ex.role === 'core' && ex.pattern === 'antiext') {        // plank = time holds
      return sets * (ex.repRange[1] + ex.restSec) + SETUP_SEC;
    }
    return sets * (SET_SEC + ex.restSec) + SETUP_SEC;
  }
  function resolveSlot(slot, EX) {
    var ex = EX[slot.ex];
    return { role: slot.r, target: slot.m, exId: slot.ex, ex: ex, alt: slot.alt || [], sets: slot.sets || (ex ? ex.sets : 3) };
  }
  function sumSeconds(slots) {
    return slots.reduce(function (t, s) { return t + slotSeconds(s.ex, s.sets); }, 0);
  }
  // accessory exercises hitting a muscle (for bonus volume on long sessions)
  function accessoryForMuscle(muscleId, EX, exclude) {
    exclude = exclude || {};
    return Object.keys(EX).map(function (k) { return EX[k]; }).filter(function (e) {
      return e.availability !== false && !exclude[e.id] && e.role === 'accessory' &&
        (e.primary.indexOf(muscleId) >= 0);
    });
  }

  // fit a slots array to a time budget: keep compounds + first core, trim/expand the rest
  function fitToBudget(slots, budgetMin, ctx, EX) {
    ctx = ctx || {};
    var budget = (budgetMin || 60) * 60;
    var coreSeen = false, compoundSeen = 0;
    slots.forEach(function (s) {
      if (s.role === 'compound') compoundSeen++;
      s.essential = (s.role === 'compound' && compoundSeen <= 2) || (s.role === 'core' && !coreSeen);
      if (s.role === 'core' && !coreSeen) coreSeen = true;
    });
    function trimmable() { for (var i = slots.length - 1; i >= 0; i--) if (!slots[i].essential) return i; return -1; }
    while (sumSeconds(slots) > budget) { var i = trimmable(); if (i < 0) break; slots.splice(i, 1); }
    while (sumSeconds(slots) > budget) {
      var shaved = false;
      for (var j = slots.length - 1; j >= 0; j--) { var floor = slots[j].role === 'compound' ? 3 : 2; if (slots[j].sets > floor) { slots[j].sets -= 1; shaved = true; break; } }
      if (!shaved) { for (var k = slots.length - 1; k >= 0; k--) { if (slots[k].sets > 2) { slots[k].sets -= 1; shaved = true; break; } } }
      if (!shaved) break;
    }
    function canAddSet() {
      for (var a = 0; a < slots.length; a++) {
        var role = slots[a].role;
        var cap = role === 'core' ? 3 : 4;
        if (slots[a].sets < cap && sumSeconds(slots) + (SET_SEC + slots[a].ex.restSec) <= budget) return a;
      }
      return -1;
    }
    var guard = 0; while (guard++ < 40) { var a = canAddSet(); if (a < 0) break; slots[a].sets += 1; }
    if (EX && ctx.undertrained) {
      var present = {}; slots.forEach(function (s) { present[s.exId] = true; });
      ctx.undertrained.forEach(function (mid) {
        var cands = accessoryForMuscle(mid, EX, present);
        if (cands.length) {
          var ex = cands[0];
          if (sumSeconds(slots) + slotSeconds(ex, ex.sets) <= budget) {
            slots.splice(slots.length - 1, 0, { role: 'accessory', target: mid, exId: ex.id, ex: ex, alt: [], sets: ex.sets, essential: false, bonus: true });
            present[ex.id] = true;
          }
        }
      });
    }
    return slots;
  }

  /* Build a coached (PPL) session that fits budgetMin. ctx: { undertrained:[muscleId] } */
  function buildSession(program, EX, dayId, budgetMin, ctx) {
    var day = program.days[dayId];
    if (!day || dayId === 'cardio') return null;
    var slots = day.slots.map(function (s) { return resolveSlot(s, EX); });
    fitToBudget(slots, budgetMin, ctx || {}, EX);
    return { dayId: dayId, name: day.name, focusMuscles: day.focusMuscles, budgetMin: budgetMin || 60, estMin: Math.round(sumSeconds(slots) / 60), slots: slots, mode: 'coached' };
  }

  // same-muscle alternative exercise ids, ranked (same pattern first)
  function altsForExercise(exId, EX) {
    var ex = EX[exId]; if (!ex) return [];
    var prim = ex.primary[0];
    return Object.keys(EX).map(function (k) { return EX[k]; }).filter(function (e) {
      return e.availability !== false && e.id !== exId && e.role !== 'cardio' && e.primary.indexOf(prim) >= 0;
    }).sort(function (a, b) { return (b.pattern === ex.pattern ? 1 : 0) - (a.pattern === ex.pattern ? 1 : 0); }).map(function (e) { return e.id; });
  }

  /* Build a freeform session from an explicit exercise-id list (partner mode). */
  function buildCustom(exIds, EX, budgetMin, name) {
    var slots = exIds.map(function (id) {
      var ex = EX[id]; if (!ex) return null;
      return { role: ex.role, target: ex.primary[0], exId: id, ex: ex, alt: altsForExercise(id, EX), sets: ex.sets };
    }).filter(Boolean);
    if (budgetMin) fitToBudget(slots, budgetMin, {}, EX);
    var focus = {}; slots.forEach(function (s) { (s.ex.primary || []).forEach(function (m) { focus[m] = 1; }); });
    return { dayId: name || 'custom', name: name || 'Session', focusMuscles: Object.keys(focus), budgetMin: budgetMin || null, estMin: Math.round(sumSeconds(slots) / 60), slots: slots, mode: 'partner' };
  }

  /* cardio session seeded by budget */
  function buildCardio(program, EX, budgetMin, preferredExId) {
    var modalities = program.optionalCardio || ['treadmill_steady'];
    var exId = preferredExId || modalities[0];
    var ex = EX[exId];
    var minutes = Math.max(12, Math.min(40, budgetMin || 20));
    return { dayId: 'cardio', name: 'Cardio', exId: exId, ex: ex, minutes: minutes, effortTarget: 'Conversational effort — about 3–4 RIR for cardio', modalities: modalities };
  }

  function rampSets(program, workingWeight) {
    var ramps = program && program.warmUp && program.warmUp.rampSets || [];
    return ramps.map(function (ramp) {
      return {
        kind: 'warmup', targetReps: ramp.reps,
        percent: ramp.percent,
        weight: workingWeight == null ? null : Math.max(0, Math.round(workingWeight * ramp.percent / 100)),
        label: ramp.label
      };
    });
  }

  /* ---------------- progression (double progression) ---------------- */
  function incrementLb(ex) { return ex.increment ? ex.increment.lb : 5; }

  // prescribe next weight for an exercise given its lift record (in lb)
  function prescribe(ex, rec) {
    if (!rec || rec.lastWeight == null) {
      return { mode: 'calibrate', weight: null, repRange: ex.repRange, sets: ex.sets, note: ex.pickWeight };
    }
    var reps = rec.lastSetsReps || [];
    var top = ex.repRange[1], bottom = ex.repRange[0];
    var allTop = reps.length > 0 && reps.every(function (r) { return r >= top; });
    var rirAllowsProgress = rec.lastRIR == null || rec.lastRIR >= 1;
    var anyBelow = reps.some(function (r) { return r < bottom; });
    if (allTop && rirAllowsProgress) {
      return { mode: 'progress', weight: Math.max(0, rec.lastWeight + incrementLb(ex)), repRange: ex.repRange, sets: ex.sets, note: 'You hit the top reps — add weight.' };
    }
    if ((rec.missStreak || 0) >= 2 && anyBelow) {
      return { mode: 'reduce_suggested', weight: rec.lastWeight, suggestedWeight: Math.max(0, Math.round(rec.lastWeight * 0.9)), repRange: ex.repRange, sets: ex.sets, note: 'Repeated below-range work. Consider reducing about 10%; you decide.' };
    }
    return { mode: 'hold', weight: rec.lastWeight, repRange: ex.repRange, sets: ex.sets, note: 'Same weight — beat last time’s reps.' };
  }

  // update a lift record after a session (sets = [{reps, weight}]) — weight in lb
  function updateLift(rec, ex, sets) {
    rec = rec || { lastWeight: null, lastSetsReps: [], bestE1RM: 0, missStreak: 0 };
    var working = sets.filter(function (s) { return s && s.reps > 0; });
    if (!working.length) return rec;
    // working weight = the most common / max logged weight
    var w = working.reduce(function (m, s) { return Math.max(m, s.weight || 0); }, 0);
    var repsArr = working.map(function (s) { return s.reps; });
    var rirValues = working.filter(function (s) { return s.rir != null && isFinite(s.rir); }).map(function (s) { return Number(s.rir); });
    var bottom = ex.repRange[0];
    var anyBelow = repsArr.some(function (r) { return r < bottom; });
    var best = working.reduce(function (m, s) { return Math.max(m, e1rm(s.weight, s.reps)); }, 0);
    return {
      lastWeight: w,
      lastSetsReps: repsArr,
      lastRIR: rirValues.length ? rirValues[rirValues.length - 1] : rec.lastRIR,
      bestE1RM: Math.max(rec.bestE1RM || 0, best),
      missStreak: anyBelow ? (rec.missStreak || 0) + 1 : 0
    };
  }

  function acceptReduction(prescription) {
    if (!prescription || prescription.mode !== 'reduce_suggested') return prescription;
    return {
      mode: 'reduced', weight: prescription.suggestedWeight,
      repRange: prescription.repRange, sets: prescription.sets,
      note: 'Accepted reduction — rebuild with clean repetitions.'
    };
  }

  /* ---------------- weekly analysis ---------------- */
  function daysBetween(aISO, bISO) {
    var a = new Date(aISO + 'T00:00:00'), b = new Date(bISO + 'T00:00:00');
    return Math.round((b - a) / 86400000);
  }
  // sets per muscle (primary=1, secondary=0.5) + volume-load, over trailing `days`
  function weeklyVolume(log, EX, todayISO, days) {
    days = days || 7;
    var out = {};
    function add(mid, sets, vol) {
      if (!out[mid]) out[mid] = { sets: 0, volume: 0 };
      out[mid].sets += sets; out[mid].volume += vol;
    }
    Object.keys(log).forEach(function (date) {
      var d = daysBetween(date, todayISO);
      if (d < 0 || d >= days) return;
      var entry = log[date];
      (entry.exercises || []).forEach(function (item) {
        var ex = EX[item.exId]; if (!ex) return;
        var nSets = (item.sets || []).filter(function (s) { return s && s.reps > 0; }).length;
        var vol = (item.sets || []).reduce(function (t, s) { return t + (s.reps || 0) * (s.weight || 0); }, 0);
        (ex.primary || []).forEach(function (m) { add(m, nSets, vol); });
        (ex.secondary || []).forEach(function (m) { add(m, nSets * 0.5, vol * 0.5); });
      });
    });
    return out;
  }
  function cardioMinutes(log, todayISO, days) {
    days = days || 7; var tot = 0;
    Object.keys(log).forEach(function (date) {
      var d = daysBetween(date, todayISO);
      if (d < 0 || d >= days) return;
      if (log[date].cardio) tot += (log[date].cardio.minutes || 0);
    });
    return tot;
  }
  // heat 0..1 per muscle vs weekly target
  function heat(weekly, MUSCLES) {
    var h = {};
    MUSCLES.forEach(function (m) {
      var got = weekly[m.id] ? weekly[m.id].sets : 0;
      h[m.id] = Math.max(0, Math.min(1, got / (m.weeklyTarget || 12)));
    });
    return h;
  }
  // undertrained muscles (ratio < threshold), sorted coldest first
  function recommendations(weekly, MUSCLES, threshold) {
    threshold = threshold == null ? 0.6 : threshold;
    return MUSCLES.map(function (m) {
      var got = weekly[m.id] ? weekly[m.id].sets : 0;
      return { id: m.id, name: m.name, got: got, target: m.weeklyTarget, ratio: got / (m.weeklyTarget || 12) };
    }).filter(function (x) { return x.ratio < threshold; })
      .sort(function (a, b) { return a.ratio - b.ratio; });
  }

  /* ---------------- adaptive coach ---------------- */
  function recentMuscles(log, EX, todayISO, days) {
    days = days || 2; var s = {};
    Object.keys(log).forEach(function (date) {
      var d = daysBetween(date, todayISO); if (d < 0 || d >= days) return;
      (log[date].exercises || []).forEach(function (it) { var ex = EX[it.exId]; if (ex) (ex.primary || []).forEach(function (m) { s[m] = true; }); });
    });
    return s;
  }
  function lastDayId(log, todayISO) {
    var dates = Object.keys(log).sort().reverse();
    for (var i = 0; i < dates.length; i++) if (daysBetween(dates[i], todayISO) <= 3 && log[dates[i]].day) return log[dates[i]].day;
    return null;
  }
  // pick the smartest next alone-mode day from recent history + weekly deficits
  function nextAloneDay(program, EX, MUSCLES, log, todayISO) {
    var wk = weeklyVolume(log, EX, todayISO, 7);
    var recent = recentMuscles(log, EX, todayISO, 2);
    var last = lastDayId(log, todayISO);
    var MU = {}; MUSCLES.forEach(function (m) { MU[m.id] = m; });
    var best = program.liftingDays[0], bestScore = -1e9;
    program.liftingDays.forEach(function (d) {
      var focus = program.days[d].focusMuscles;
      var deficit = focus.reduce(function (s, m) { return s + Math.max(0, (MU[m] ? MU[m].weeklyTarget : 12) - (wk[m] ? wk[m].sets : 0)); }, 0);
      var penalty = focus.filter(function (m) { return recent[m]; }).length * 5;
      if (d === last) penalty += 8;
      var score = deficit - penalty;
      if (score > bestScore) { bestScore = score; best = d; }
    });
    var behind = program.days[best].focusMuscles.filter(function (m) { return (wk[m] ? wk[m].sets : 0) < (MU[m] ? MU[m].weeklyTarget : 12) * 0.5; }).map(function (m) { return MU[m].name; });
    return { dayId: best, reason: behind.length ? (behind.slice(0, 2).join(' & ') + ' need work this week.') : 'Keeping your week balanced.' };
  }
  function exercisesForBodyPart(part, EXERCISES) {
    return EXERCISES.filter(function (e) { return e.availability !== false && e.role !== 'cardio' && (e.primary || []).some(function (m) { return part.muscles.indexOf(m) >= 0; }); });
  }

  /* ---------------- consistency (selected weekly schedule) ---------------- */
  function mondayOf(iso) {
    var d = new Date(iso + 'T00:00:00');
    var offset = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - offset);
    return d.toISOString().slice(0, 10);
  }
  function sessionsInWeek(log, monday) {
    var count = 0;
    for (var i = 0; i < 7; i++) if (sessionOn(log, shiftISO(monday, i))) count++;
    return count;
  }
  function consistencyLevel(completedPlanned) {
    var levels = [
      { name: 'Starting', at: 0 }, { name: 'Building', at: 5 },
      { name: 'Consistent', at: 15 }, { name: 'Established', at: 35 },
      { name: 'Durable', at: 75 }
    ];
    var current = levels[0], next = null;
    for (var i = 0; i < levels.length; i++) {
      if (completedPlanned >= levels[i].at) current = levels[i];
      else { next = levels[i]; break; }
    }
    return { name: current.name, next: next ? next.name : null, toNext: next ? next.at - completedPlanned : 0, progress: next ? (completedPlanned - current.at) / (next.at - current.at) : 1 };
  }
  function weeklyConsistency(log, todayISO, frequency) {
    var target = Math.max(1, Math.min(7, Number(frequency) || 3));
    var currentMonday = mondayOf(todayISO);
    var completed = sessionsInWeek(log, currentMonday);
    var streakWeeks = 0;
    for (var w = 1; w <= 104; w++) {
      var monday = shiftISO(currentMonday, -7 * w);
      if (sessionsInWeek(log, monday) >= target) streakWeeks++;
      else break;
    }
    var total = 0;
    Object.keys(log).forEach(function (date) { if (sessionOn(log, date)) total++; });
    return { completed: completed, target: target, met: completed >= target, streakWeeks: streakWeeks, level: consistencyLevel(total) };
  }

  /* ---------------- streak (never-miss-twice) ---------------- */
  function sessionOn(log, dateISO) {
    var e = log[dateISO];
    if (!e) return false;
    if (e.cardio) return true;
    return (e.exercises || []).some(function (it) { return (it.sets || []).some(function (s) { return s && s.reps > 0; }); });
  }
  function shiftISO(iso, delta) {
    var d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + delta);
    return d.toISOString().slice(0, 10);
  }
  // current streak = trained days in the run ending near today; a single rest day is
  // tolerated, two consecutive empty days (excluding an untrained today) breaks it.
  function streak(log, todayISO) {
    var day = todayISO, count = 0, emptyRun = 0, first = true;
    for (var i = 0; i < 400; i++) {
      if (sessionOn(log, day)) { count++; emptyRun = 0; }
      else {
        if (first) { /* today not done yet — don't penalize */ }
        else { emptyRun++; if (emptyRun >= 2) break; }
      }
      first = false;
      day = shiftISO(day, -1);
    }
    return count;
  }
  function bestStreak(log) {
    var dates = Object.keys(log).filter(function (d) { return sessionOn(log, d); }).sort();
    if (!dates.length) return 0;
    var best = 1, run = 1;
    for (var i = 1; i < dates.length; i++) {
      var gap = daysBetween(dates[i - 1], dates[i]);
      if (gap <= 2) { run++; } else { run = 1; }   // allow single rest day
      if (run > best) best = run;
    }
    return best;
  }

  /* ---------------- rank / XP (goal-gradient) ---------------- */
  var RANKS = [
    { name: 'Beginner', at: 0 }, { name: 'Novice', at: 50 }, { name: 'Intermediate', at: 200 },
    { name: 'Advanced', at: 500 }, { name: 'Elite', at: 1000 }, { name: 'Master', at: 2000 }
  ];
  function totalSets(log) {
    var n = 0;
    Object.keys(log).forEach(function (d) {
      (log[d].exercises || []).forEach(function (it) {
        n += (it.sets || []).filter(function (s) { return s && s.reps > 0; }).length;
      });
    });
    return n;
  }
  function rank(sets) {
    var cur = RANKS[0], nxt = null;
    for (var i = 0; i < RANKS.length; i++) {
      if (sets >= RANKS[i].at) cur = RANKS[i];
      else { nxt = RANKS[i]; break; }
    }
    var progress = nxt ? (sets - cur.at) / (nxt.at - cur.at) : 1;
    return { name: cur.name, next: nxt ? nxt.name : null, toNext: nxt ? nxt.at - sets : 0, progress: Math.max(0, Math.min(1, progress)) };
  }

  /* ---------------- busy-machine swap ---------------- */
  // ranked alternative exercises for a slot, limited to ones the user has equipment for
  function busyAlternatives(slot, EX, equipment) {
    var have = availableExerciseIds(equipment);
    return (slot.alt || []).filter(function (id) { return have[id] && EX[id] && EX[id].availability !== false; }).map(function (id) { return EX[id]; });
  }

  return {
    lbToKg: lbToKg, kgToLb: kgToLb, toDisplay: toDisplay, fromInput: fromInput,
    e1rm: e1rm, dayIdAt: dayIdAt, nextIndex: nextIndex, byId: byId,
    availableExerciseIds: availableExerciseIds, machinesForExercise: machinesForExercise,
    slotSeconds: slotSeconds, buildSession: buildSession, buildCardio: buildCardio, rampSets: rampSets,
    fitToBudget: fitToBudget, buildCustom: buildCustom, altsForExercise: altsForExercise,
    recentMuscles: recentMuscles, lastDayId: lastDayId, nextAloneDay: nextAloneDay, exercisesForBodyPart: exercisesForBodyPart,
    prescribe: prescribe, acceptReduction: acceptReduction, updateLift: updateLift,
    weeklyVolume: weeklyVolume, cardioMinutes: cardioMinutes, heat: heat, recommendations: recommendations,
    streak: streak, bestStreak: bestStreak, weeklyConsistency: weeklyConsistency, consistencyLevel: consistencyLevel, totalSets: totalSets, rank: rank,
    busyAlternatives: busyAlternatives, RANKS: RANKS
  };
});
