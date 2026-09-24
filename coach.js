/* muscles — transparent, deterministic coaching engine.
   No network, account, model, or DOM dependency. Safety/program constraints are
   applied before scoring or personalization. Browser global: COACH. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.COACH = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var GOALS = {
    hypertrophy: { id: 'hypertrophy', name: 'Muscle Gain / Hypertrophy', compoundReps: [6, 12], accessoryReps: [10, 20], rir: [1, 3], restMultiplier: 1, volumeMultiplier: 1 },
    strength_muscle: { id: 'strength_muscle', name: 'Strength + Muscle', compoundReps: [5, 10], accessoryReps: [8, 15], rir: [1, 3], restMultiplier: 1.2, volumeMultiplier: 0.95 },
    general_fitness: { id: 'general_fitness', name: 'General Fitness', compoundReps: [8, 15], accessoryReps: [10, 20], rir: [2, 3], restMultiplier: 0.85, volumeMultiplier: 0.9 }
  };

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function avg(values) { return values.length ? values.reduce(function (a, b) { return a + b; }, 0) / values.length : null; }
  function isoDays(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000); }
  function goal(id) { return GOALS[id] || GOALS.hypertrophy; }
  function workingSets(item) { return (item && item.sets || []).filter(function (set) { return set && set.kind !== 'warmup' && Number(set.reps || set.durationSec || 0) > 0; }); }

  function historyFor(log, exerciseId, limit) {
    var out = [];
    Object.keys(log || {}).sort().forEach(function (date) {
      (log[date].exercises || []).forEach(function (item) {
        if (item.exId !== exerciseId) return;
        var sets = workingSets(item);
        if (!sets.length) return;
        var reps = sets.map(function (set) { return Number(set.reps || 0); });
        var rirs = sets.filter(function (set) { return set.rir != null && isFinite(set.rir); }).map(function (set) { return Number(set.rir); });
        var weights = sets.map(function (set) { return Number(set.weight || 0); });
        out.push({
          date: date, gymId: log[date].gymId || null, sets: sets, reps: reps,
          weight: weights.length ? Math.max.apply(null, weights) : 0,
          totalReps: reps.reduce(function (a, b) { return a + b; }, 0),
          avgReps: avg(reps), bestSet: reps.length ? Math.max.apply(null, reps) : 0,
          avgRIR: avg(rirs), minRIR: rirs.length ? Math.min.apply(null, rirs) : null,
          volume: sets.reduce(function (sum, set) { return sum + Number(set.weight || 0) * Number(set.reps || 0); }, 0),
          techniqueNote: item.techniqueNote || '', sideSets: item.sideSets || null
        });
      });
    });
    return limit ? out.slice(-limit) : out;
  }

  function nearestRack(load, rack, direction) {
    rack = (rack || []).map(Number).filter(function (n) { return isFinite(n) && n > 0; }).sort(function (a, b) { return a - b; });
    if (!rack.length) return null;
    if (direction > 0) return rack.filter(function (n) { return n > load; })[0] || null;
    var lower = rack.filter(function (n) { return n < load; });
    return lower.length ? lower[lower.length - 1] : null;
  }

  function performanceTrend(history) {
    var h = (history || []).slice(-5);
    if (!h.length) return { direction: 'calibration', exposures: 0, totalRepChange: 0, volumeChange: 0, summary: 'No completed sessions yet.' };
    if (h.length === 1) return { direction: 'calibration', exposures: 1, totalRepChange: 0, volumeChange: 0, summary: 'One exposure recorded; continue calibrating.' };
    var first = h[0], last = h[h.length - 1];
    var sameLoad = h.filter(function (x) { return Math.abs(x.weight - last.weight) < 0.01; });
    var base = sameLoad.length > 1 ? sameLoad[0] : first;
    var repDelta = last.totalReps - base.totalReps;
    var volumeDelta = last.volume - base.volume;
    var direction = last.weight > first.weight || (sameLoad.length > 1 && repDelta > 0) ? 'improving' :
      (sameLoad.length >= 3 && repDelta < 0 ? 'declining' : 'stable');
    var summary = direction === 'improving' ? (repDelta > 0 && base.weight === last.weight ? ('+' + repDelta + ' clean reps at the same load.') : 'Load or volume is trending upward.') :
      (direction === 'declining' ? 'Recent repeated performance is below the earlier exposure.' : 'Performance is broadly stable.');
    return { direction: direction, exposures: h.length, sameLoadExposures: sameLoad.length, totalRepChange: repDelta, volumeChange: volumeDelta, summary: summary };
  }

  function plateauStatus(ex, history) {
    var h = (history || []).slice(-5);
    if (h.length < 4) return { plateau: false, evidence: h.length, reason: 'Fewer than four meaningful exposures.' };
    var last = h[h.length - 1];
    var comparable = h.filter(function (x) { return Math.abs(x.weight - last.weight) < 0.01; });
    if (comparable.length < 4) return { plateau: false, evidence: comparable.length, reason: 'Load changed recently; continue the current progression.' };
    var bestEarly = Math.max(comparable[0].totalReps, comparable[1].totalReps);
    var bestLate = Math.max(comparable[comparable.length - 2].totalReps, comparable[comparable.length - 1].totalReps);
    var recoveryConcern = comparable.slice(-3).filter(function (x) { return x.avgRIR != null && x.avgRIR < 1; }).length >= 2;
    var plateau = bestLate <= bestEarly && !recoveryConcern;
    return { plateau: plateau, evidence: comparable.length, reason: plateau ? 'Four comparable exposures show no clear rep or load improvement.' : (recoveryConcern ? 'Effort has repeatedly exceeded the target; recover or reduce before calling this a plateau.' : 'Recent reps or load are still moving.') };
  }

  function recommendLoad(ex, history, rack, context) {
    context = context || {};
    var h = (history || []).slice(-5);
    var targetSets = Number(context.targetSets || ex.sets || 3);
    var range = (context.repRange || ex.repRange || [8, 12]).slice();
    if (!h.length) return { mode: 'calibrate', weight: null, repRange: range, sets: targetSets, confidence: 'Calibration phase', note: ex.calibration || ex.pickWeight, reason: 'No history exists for this exercise; no starting load was invented.' };
    var last = h[h.length - 1], top = range[1], bottom = range[0];
    var recentSame = h.filter(function (x) { return Math.abs(x.weight - last.weight) < 0.01; });
    var complete = last.reps.length >= targetSets;
    var allTop = complete && last.reps.slice(0, targetSets).every(function (n) { return n >= top; });
    var below = last.reps.some(function (n) { return n < bottom; });
    var effortOkay = last.minRIR == null ? recentSame.length >= 2 : last.minRIR >= 1;
    var confirmation = recentSame.length >= 2 && recentSame.slice(-2).every(function (x) { return x.reps.length >= targetSets && x.reps.every(function (n) { return n >= bottom; }); });
    var missStreak = 0;
    for (var i = h.length - 1; i >= 0; i--) { if (h[i].reps.some(function (n) { return n < bottom; })) missStreak++; else break; }
    var next = nearestRack(last.weight, rack, 1);
    var rackKnown = Array.isArray(rack) && rack.length > 0;
    if (next == null) next = last.weight + Number(ex.increment && ex.increment.lb || 5);
    var jump = last.weight > 0 ? (next - last.weight) / last.weight : 0;
    var largeJump = jump > (ex.role === 'compound' ? 0.15 : 0.12);
    var confirmedLarge = recentSame.length >= 2 && recentSame.slice(-2).every(function (x) { return x.reps.length >= targetSets && x.reps.every(function (n) { return n >= top; }) && (x.minRIR == null || x.minRIR >= 2); });
    if (allTop && effortOkay && confirmation && (!largeJump || confirmedLarge)) {
      return { mode: 'progress', weight: next, previousWeight: last.weight, repRange: range, sets: targetSets, confidence: h.length >= 3 && rackKnown ? 'Strong history' : 'Some history', rackKnown: rackKnown,
        note: 'Move to ' + next + ' lb/hand next time.', reason: 'All planned sets reached the top of the range with appropriate effort, and the recommendation uses ' + (rackKnown ? 'the next recorded rack dumbbell.' : 'the exercise increment because the rack is not recorded.') };
    }
    if (allTop && largeJump && !confirmedLarge) {
      return { mode: 'hold', weight: last.weight, repRange: range, sets: targetSets, confidence: 'Some history', rackKnown: rackKnown,
        note: 'Stay at ' + last.weight + ' lb/hand and confirm the top reps with clean range and about 2 RIR.', reason: 'The next available dumbbell is a ' + Math.round(jump * 100) + '% jump, which is large for this movement.' };
    }
    if (missStreak >= 3 && below) {
      var lower = nearestRack(last.weight, rack, -1);
      if (lower == null) lower = Math.max(0, Math.round(last.weight * 0.9 / 2.5) * 2.5);
      return { mode: 'reduce_suggested', weight: last.weight, suggestedWeight: lower, repRange: range, sets: targetSets, confidence: 'Strong history', note: 'Repeated below-range work. Consider ' + lower + ' lb/hand and rebuild; you decide.', reason: 'Three consecutive meaningful exposures were below the target range. One poor workout never triggers this.' };
    }
    var trend = performanceTrend(h);
    var goalReps = last.totalReps + (trend.direction === 'improving' ? 1 : Math.min(3, targetSets));
    return { mode: 'hold', weight: last.weight, repRange: range, sets: targetSets, confidence: h.length >= 3 ? 'Strong history' : 'Some history', rackKnown: rackKnown,
      note: 'Stay at ' + last.weight + ' lb/hand. Aim for about ' + goalReps + ' total clean reps while keeping the target RIR.', reason: trend.summary + ' The full set target is not yet consistently complete.' };
  }

  function weightedVolume(log, EX, today, days) {
    days = days || 7;
    var out = {};
    function add(id, sets, volume) { if (!out[id]) out[id] = { sets: 0, volume: 0, primarySets: 0, secondarySets: 0 }; out[id].sets += sets; out[id].volume += volume; }
    Object.keys(log || {}).forEach(function (date) {
      var age = isoDays(date, today); if (age < 0 || age >= days) return;
      (log[date].exercises || []).forEach(function (item) {
        var ex = EX[item.exId]; if (!ex) return;
        var sets = workingSets(item), hard = sets.length;
        var volume = sets.reduce(function (sum, set) { return sum + Number(set.weight || 0) * Number(set.reps || 0); }, 0);
        (ex.primary || []).forEach(function (m) { add(m, hard, volume); out[m].primarySets += hard; });
        (ex.secondary || []).forEach(function (m) { var weight = ex.secondaryContribution && ex.secondaryContribution[m] != null ? ex.secondaryContribution[m] : 0.5; add(m, hard * weight, volume * weight); out[m].secondarySets += hard * weight; });
      });
    });
    return out;
  }

  function fatigueLabel(muscleId, log, EX, today, target) {
    var vol = weightedVolume(log, EX, today, 7)[muscleId];
    var recentDates = [];
    Object.keys(log || {}).forEach(function (date) {
      (log[date].exercises || []).some(function (item) { var ex = EX[item.exId]; if (ex && (ex.primary || []).indexOf(muscleId) >= 0 && workingSets(item).length) { recentDates.push(date); return true; } return false; });
    });
    recentDates.sort();
    var since = recentDates.length ? isoDays(recentDates[recentDates.length - 1], today) : 99;
    var ratio = (vol ? vol.sets : 0) / (target || 12);
    var label = ratio > 1.25 || since === 0 ? 'High recent workload' : (ratio > 0.9 || since === 1 ? 'Some accumulated fatigue' : (since >= 3 ? 'Fresh' : 'Normal'));
    return { label: label, weightedSets: vol ? vol.sets : 0, daysSince: since, explanation: 'Based on recent weighted sets and days since this muscle was trained; this is not a medical measurement.' };
  }

  function readinessAdjustment(readiness, declineCount) {
    readiness = readiness || { energy: 'normal', soreness: 'mild', sleep: 'okay' };
    var score = 0, reasons = [];
    if (readiness.energy === 'low') { score--; reasons.push('energy is low'); }
    if (readiness.sleep === 'poor') { score--; reasons.push('sleep was poor'); }
    if (readiness.soreness === 'high') { score--; reasons.push('soreness is high'); }
    if (readiness.energy === 'high') score++;
    if (readiness.sleep === 'good') score++;
    if ((declineCount || 0) >= 2) { score--; reasons.push('performance declined in recent sessions'); }
    var action = score <= -2 ? 'trim_accessory' : 'normal';
    return { level: score >= 2 ? 'high' : (score <= -2 ? 'low' : 'normal'), action: action, targetRIRAdd: score <= -1 ? 1 : 0,
      explanation: action === 'trim_accessory' ? 'Keeping priority work but trimming one late accessory set because ' + reasons.join(' and ') + '.' : (reasons.length ? 'Keeping the planned session; ' + reasons.join(' and ') + ' will make progression conservative.' : 'Readiness supports the normal planned session.') };
  }

  function equipmentIndex(equipment) {
    var byExercise = {};
    (equipment || []).forEach(function (item) {
      if (item.autoEligible === false) return;
      (item.exerciseIds || []).forEach(function (id) { if (!byExercise[id]) byExercise[id] = []; byExercise[id].push(item); });
    });
    return byExercise;
  }

  function scoreExercise(candidate, intended, context) {
    context = context || {};
    var prefs = context.preferences || {};
    if (!candidate || candidate.availability === false || (prefs.avoided || {})[candidate.id] || (context.discomfort || {})[candidate.id]) return { score: -10000, reasons: ['avoided or unavailable'] };
    var score = 0, reasons = [];
    if (candidate.pattern === intended.pattern) { score += 50; reasons.push('same movement pattern'); }
    var primaryOverlap = (candidate.primary || []).filter(function (m) { return (intended.primary || []).indexOf(m) >= 0; }).length;
    score += primaryOverlap * 25; if (primaryOverlap) reasons.push('same primary muscle');
    if (candidate.role === intended.role) { score += 20; reasons.push('same training role'); }
    if ((context.available || {})[candidate.id]) { score += 30; reasons.push('verified at this gym'); } else score -= 200;
    if ((context.verified || {})[candidate.id]) { score += 8; reasons.push('high-confidence equipment'); }
    if ((prefs.preferred || {})[candidate.id]) { score += 12; reasons.push('preferred'); }
    var skipped = Number((prefs.skippedCounts || {})[candidate.id] || 0);
    if (skipped) { score -= Math.min(18, skipped * 3); reasons.push('frequently skipped'); }
    if ((context.historyCount || {})[candidate.id]) { score += Math.min(10, context.historyCount[candidate.id] * 2); reasons.push('training continuity'); }
    if (context.goal === 'strength_muscle' && candidate.role === 'compound') { score += 5; reasons.push('goal fit'); }
    if (context.goal === 'hypertrophy' && candidate.role !== 'compound') { score += 3; reasons.push('goal fit'); }
    if (context.currentZone && (context.zones || {})[candidate.id] === context.currentZone) { score += 3; reasons.push('same zone'); }
    score += Math.min(8, Number((prefs.substitutionCounts || {})[intended.id + '>' + candidate.id] || 0));
    return { score: score, reasons: reasons };
  }

  function rankedAlternatives(intended, candidateIds, EX, equipment, profile, log, currentZone) {
    var idx = equipmentIndex(equipment), available = {}, verified = {}, zones = {}, historyCount = {};
    Object.keys(idx).forEach(function (id) { available[id] = true; verified[id] = idx[id].some(function (item) { return item.verified !== false && item.autoEligible !== false; }); zones[id] = idx[id][0].zoneId || null; });
    Object.keys(EX).forEach(function (id) { historyCount[id] = historyFor(log, id).length; });
    return (candidateIds || []).map(function (id) {
      var candidate = EX[id];
      var scored = scoreExercise(candidate, intended, { available: available, verified: verified, zones: zones, currentZone: currentZone, preferences: profile && profile.preferences, discomfort: profile && profile.discomfort, historyCount: historyCount, goal: profile && profile.goal });
      return { exercise: candidate, score: scored.score, reasons: scored.reasons, equipment: idx[id] || [] };
    }).filter(function (x) { return x.exercise && x.score > -1000; }).sort(function (a, b) { return b.score - a.score; });
  }

  function routeFor(slots, equipment) {
    var idx = equipmentIndex(equipment), groups = [];
    (slots || []).forEach(function (slot) {
      var zone = (idx[slot.exId] && idx[slot.exId][0] && idx[slot.exId][0].zoneId) || 'unmapped';
      slot.zoneId = zone;
      var last = groups[groups.length - 1];
      if (last && last.zoneId === zone) last.exerciseIds.push(slot.exId);
      else groups.push({ zoneId: zone, exerciseIds: [slot.exId] });
    });
    return groups;
  }

  function estimateDuration(base, log) {
    var samples = Object.keys(log || {}).map(function (date) { return log[date]; }).filter(function (entry) { return entry.day === base.dayId && Number(entry.sessionDurationSec) > 0; }).slice(-5);
    if (!samples.length) return { minutes: base.estMin, confidence: 'Calibration phase', reason: 'Using exercise and rest defaults until full session durations are recorded.' };
    var minutes = Math.round(avg(samples.map(function (x) { return x.sessionDurationSec / 60; })));
    return { minutes: minutes, confidence: samples.length >= 3 ? 'Strong history' : 'Some history', reason: 'Based on ' + samples.length + ' recent ' + base.name + ' session' + (samples.length === 1 ? '' : 's') + '.' };
  }

  function enhanceWorkout(base, ctx) {
    ctx = ctx || {};
    var EX = ctx.EX || {}, equipment = ctx.equipment || [], profile = ctx.profile || {}, log = ctx.log || {};
    var idx = equipmentIndex(equipment), ready = readinessAdjustment(ctx.readiness, ctx.declineCount || 0), decisions = [], selectedGoal = goal(profile.goal);
    base.slots.forEach(function (slot, index) {
      slot.originalSets = slot.sets;
      var original = slot.ex;
      if (!idx[slot.exId] || (profile.preferences && profile.preferences.avoided && profile.preferences.avoided[slot.exId])) {
        var ranked = rankedAlternatives(original, slot.alt || [], EX, equipment, profile, log, null);
        if (ranked.length) {
          slot.originalExId = slot.exId; slot.exId = ranked[0].exercise.id; slot.ex = ranked[0].exercise;
          decisions.push({ type: 'exercise_swap', from: slot.originalExId, to: slot.exId, reasons: ranked[0].reasons.slice(0, 4) });
        }
      }
      var originalRange = (slot.ex.repRange || [8, 12]).slice();
      var adjustedRange = originalRange;
      if (slot.ex.role === 'cardio') {
        slot.ex = Object.assign({}, slot.ex, { repRange: originalRange, restSec: 0, defaultRIR: null });
      } else {
        var goalRange = slot.ex.role === 'compound' ? selectedGoal.compoundReps : selectedGoal.accessoryReps;
        adjustedRange = [Math.max(originalRange[0], goalRange[0]), Math.min(originalRange[1], goalRange[1])];
        if (adjustedRange[0] > adjustedRange[1]) adjustedRange = originalRange;
        var adjustedRIR = clamp(Number(slot.ex.defaultRIR == null ? 2 : slot.ex.defaultRIR) + ready.targetRIRAdd, selectedGoal.rir[0], Math.max(selectedGoal.rir[1], Number(slot.ex.defaultRIR || 2) + ready.targetRIRAdd));
        slot.ex = Object.assign({}, slot.ex, { repRange: adjustedRange, restSec: Math.max(45, Math.round(Number(slot.ex.restSec || 90) * selectedGoal.restMultiplier / 5) * 5), defaultRIR: adjustedRIR });
        if (adjustedRange[0] !== originalRange[0] || adjustedRange[1] !== originalRange[1]) decisions.push({ type: 'goal_rep_emphasis', exerciseId: slot.exId, reasons: [selectedGoal.name + ' adjusted the emphasis within the exercise\'s safe programming range.'] });
      }
      slot.priority = index + 1;
      slot.trainingRole = slot.role;
      slot.reasonSelected = slot.originalExId ? 'Selected as the highest-ranked verified substitute while preserving movement and training role.' : 'Preserved from the selected program for progression continuity.';
      slot.alternativesRanked = rankedAlternatives(slot.ex, slot.alt || [], EX, equipment, profile, log, null).map(function (x) { return { exerciseId: x.exercise.id, score: x.score, reasons: x.reasons }; });
    });
    if (ready.action === 'trim_accessory') {
      for (var i = base.slots.length - 1; i >= 0; i--) {
        if (base.slots[i].role !== 'compound' && base.slots[i].sets > 2) { base.slots[i].sets--; decisions.push({ type: 'readiness_volume_adjustment', exerciseId: base.slots[i].exId, reasons: [ready.explanation] }); break; }
      }
    }
    base.goal = selectedGoal;
    base.readinessContext = ready;
    base.route = routeFor(base.slots, equipment);
    base.durationEstimate = estimateDuration(base, log);
    base.estimatedDuration = base.durationEstimate.minutes;
    base.decisionLog = decisions;
    base.reasonSelected = 'Program priority and exercise continuity were preserved; equipment verification and readiness were then applied. Zone efficiency never outranks training order.';
    return base;
  }

  function liveSetAdvice(ex, planned, completed, lastRestSec) {
    completed = (completed || []).filter(function (set) { return set && Number(set.reps) > 0; });
    if (!completed.length) return null;
    var last = completed[completed.length - 1], bottom = planned.repRange[0];
    if (last.reps < bottom && last.rir != null && last.rir <= 0) return { type: 'load_too_high', action: 'offer_lower', message: 'Today\'s load appears heavier than intended. Use the next lighter dumbbell for remaining sets if technique is deteriorating; you decide.' };
    if (completed.length >= 2) {
      var prev = completed[completed.length - 2];
      if (prev.reps - last.reps >= 3 && lastRestSec != null && lastRestSec < Math.max(75, ex.restSec * 0.75)) return { type: 'rest', action: 'rest_longer', message: 'Reps dropped sharply after a short rest. Try another 60–90 seconds before changing load.' };
    }
    if (last.rir != null && last.rir === 0 && ex.role === 'compound') return { type: 'effort', action: 'hold_or_reduce', message: 'That compound set reached 0 RIR. Keep the load only if technique is stable; normal work sets target about 1–3 RIR.' };
    return { type: 'continue', action: 'hold', message: 'Keep the current load and complete the next clean set; do not increase mid-session.' };
  }

  function warmupPlan(ex, workingWeight, context) {
    context = context || {};
    if (!ex || ex.role !== 'compound' || ex.measure === 'duration') return [];
    var firstMajor = Number(context.exerciseIndex || 0) === 0;
    var load = Number(workingWeight);
    var ramps = firstMajor ? [{ percent: 45, reps: 8, label: 'easy rehearsal' }, { percent: 70, reps: 4, label: 'controlled ramp' }] : [{ percent: 55, reps: 6, label: 'brief pattern rehearsal' }];
    if (firstMajor && isFinite(load) && load >= 60) ramps.push({ percent: 85, reps: 2, label: 'final readiness check' });
    return ramps.map(function (ramp) {
      return { kind: 'warmup', targetReps: ramp.reps, percent: ramp.percent, weight: isFinite(load) && load > 0 ? Math.max(0, Math.round(load * ramp.percent / 100 / 2.5) * 2.5) : null, label: ramp.label };
    });
  }

  function unilateralSignal(history) {
    var comparable = (history || []).filter(function (x) { return x.sideSets && x.sideSets.left && x.sideSets.right; }).slice(-3);
    if (comparable.length < 3) return { repeated: false, message: 'More paired-side sessions are needed.' };
    var diffs = comparable.map(function (x) {
      var left = x.sideSets.left.reduce(function (s, set) { return s + Number(set.reps || 0); }, 0);
      var right = x.sideSets.right.reduce(function (s, set) { return s + Number(set.reps || 0); }, 0);
      return left - right;
    });
    var sameDirection = diffs.every(function (d) { return d <= -1; }) || diffs.every(function (d) { return d >= 1; });
    if (!sameDirection) return { repeated: false, message: 'No consistent side-to-side difference across three sessions.' };
    var lower = avg(diffs) < 0 ? 'left' : 'right';
    return { repeated: true, side: lower, message: 'Your ' + lower + ' side completed fewer repetitions across three sessions. Start there next time and match its clean reps on the other side.' };
  }

  function recordsFor(ex, history) {
    var h = history || [], all = [];
    h.forEach(function (session) { session.sets.forEach(function (set) { all.push(set); }); });
    var records = {};
    if (ex.measure === 'duration') {
      records.longestDuration = all.reduce(function (m, set) { return Math.max(m, Number(set.durationSec || set.reps || 0)); }, 0);
      records.heaviestCarry = all.reduce(function (m, set) { return Math.max(m, Number(set.weight || 0)); }, 0);
    } else {
      records.highestWeight = all.reduce(function (m, set) { return Math.max(m, Number(set.weight || 0)); }, 0);
      records.bestReps = all.reduce(function (m, set) { return Math.max(m, Number(set.reps || 0)); }, 0);
      records.bestVolume = h.reduce(function (m, session) { return Math.max(m, session.volume); }, 0);
      if (ex.role === 'compound') records.bestEstimatedStrength = all.reduce(function (m, set) { return Math.max(m, Number(set.weight || 0) * (1 + Number(set.reps || 0) / 30)); }, 0);
    }
    return records;
  }

  return {
    GOALS: GOALS, goal: goal, historyFor: historyFor, performanceTrend: performanceTrend,
    plateauStatus: plateauStatus, recommendLoad: recommendLoad, weightedVolume: weightedVolume,
    fatigueLabel: fatigueLabel, readinessAdjustment: readinessAdjustment, scoreExercise: scoreExercise,
    rankedAlternatives: rankedAlternatives, routeFor: routeFor, estimateDuration: estimateDuration,
    enhanceWorkout: enhanceWorkout, liveSetAdvice: liveSetAdvice, warmupPlan: warmupPlan, unilateralSignal: unilateralSignal,
    recordsFor: recordsFor, nearestRack: nearestRack
  };
});
