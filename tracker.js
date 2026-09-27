/* muscles — hand-off to the owner's Time Tracker app. No DOM, no storage.
   Saved workouts become Time Tracker activities ("Push Day — chest, front delts,
   triceps", Weightlifting & Strength, start → end) and travel as a copied code:
   "TT1:" + base64url(UTF-8 JSON {source, activities}). A copied code, not a link,
   because on iPhone every home-screen web app has its own storage and a link
   would open a separate Safari copy of the tracker. The tracker's
   "Paste from app" reads it and fills in the gym entry you logged there.
   Browser: exposes global `TT`. Node: module.exports. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.TT = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  var DAY_MS = 86400000;

  function sessionsOf(entry) {
    if (!entry) return [];
    return entry.sessions && entry.sessions.length ? entry.sessions : [entry];
  }

  function isCardio(s, EX) {
    if (s.cardio || s.day === 'cardio') return true;
    var items = s.exercises || [];
    return items.length > 0 && items.every(function (it) {
      return it.cardioMinutes != null || (EX[it.exId] && EX[it.exId].role === 'cardio');
    });
  }

  // Top three muscles by working sets, e.g. "chest, front delts, triceps".
  function topMuscles(s, EX, MU) {
    var sets = {};
    (s.exercises || []).forEach(function (it) {
      var ex = EX[it.exId];
      if (!ex || ex.role === 'cardio') return;
      var n = it.sets ? it.sets.length : 1;
      (ex.primary || []).forEach(function (m) { sets[m] = (sets[m] || 0) + n; });
    });
    return Object.keys(sets)
      .sort(function (a, b) { return sets[b] - sets[a] || a.localeCompare(b); })
      .slice(0, 3)
      .map(function (m) { return (MU[m] ? MU[m].name : m).toLowerCase(); });
  }

  function title(s, EX, MU) {
    if (s.cardio) {
      var ex = EX[s.cardio.exId];
      return 'Cardio — ' + (ex ? ex.name : 'session') + (s.cardio.minutes ? ' · ' + s.cardio.minutes + ' min' : '');
    }
    var name = s.name || (s.mode === 'walkin' ? 'Gym visit' : 'Workout');
    var top = topMuscles(s, EX, MU);
    return top.length ? name + ' — ' + top.join(', ') : name;
  }

  function notes(s, EX) {
    var items = (s.exercises || []).filter(function (it) { return !it.superOf; });
    var sets = (s.exercises || []).reduce(function (n, it) { return n + (it.sets ? it.sets.length : 0); }, 0);
    var names = items.slice(0, 3).map(function (it) { return EX[it.exId] ? EX[it.exId].name : it.exId; });
    var parts = ['Muscles'];
    if (sets) parts.push(sets + ' sets');
    if (names.length) parts.push(names.join(', ') + (items.length > 3 ? ' +' + (items.length - 3) : ''));
    if (s.felt) parts.push('felt ' + s.felt + '/5');
    if (s.note) parts.push(String(s.note).slice(0, 200));
    return parts.join(' · ');
  }

  /* Workouts saved in the last `days` days (default 14) that the tracker hasn't
     been sent yet. `sent` maps activity id → the endTime that was sent, so an
     edited session goes again. Sessions saved before this feature have no id or
     end time and are skipped (nothing to anchor them to). */
  function activitiesFromLog(log, EX, MU, sent, opts) {
    opts = opts || {};
    var now = opts.now || Date.now();
    var since = now - (opts.days || 14) * DAY_MS;
    var out = [];
    Object.keys(log || {}).forEach(function (date) {
      sessionsOf(log[date]).forEach(function (s) {
        if (!s || !s.id || !s.endedAt) return;
        var end = Number(s.endedAt);
        var start = Number(s.startedAt) ||
          (s.sessionDurationSec ? end - s.sessionDurationSec * 1000 : 0) ||
          (s.cardio && s.cardio.minutes ? end - s.cardio.minutes * 60000 : 0);
        if (!start || !(end > start) || end < since || end > now + 60000) return;
        var id = 'mus-' + s.id;
        if (sent && sent[id] === end && !opts.includeSent) return;
        var cardio = isCardio(s, EX);
        out.push({
          id: id,
          title: title(s, EX, MU),
          category: cardio ? 'Cardio' : 'Weightlifting & Strength',
          domain: 'Health & Physical',
          load: 'Recovery',
          startTime: start,
          endTime: end,
          duration: Math.round((end - start) / 1000),
          notes: notes(s, EX)
        });
      });
    });
    return out.sort(function (a, b) { return a.startTime - b.startTime; });
  }

  function encode(doc) {
    var bytes = new TextEncoder().encode(JSON.stringify(doc));
    var bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return 'TT1:' + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function newSessionId(now) {
    return (now || Date.now()).toString(36) + Math.random().toString(36).slice(2, 6);
  }

  return { activitiesFromLog: activitiesFromLog, encode: encode, newSessionId: newSessionId, sessionsOf: sessionsOf };
});
