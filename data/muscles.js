/* muscles — muscle region definitions.
   Each region maps to a path group in the anatomy figure (figure.js),
   belongs to a training "group" (used by the split), and has a weekly
   set target used by the analysis/heat-map (hypertrophy defaults).
   side: which figure view shows it best ('front' | 'back' | 'both'). */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.MUSCLES = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  return [
    { id: 'chest',      name: 'Chest',          short: 'Chest',   group: 'push', side: 'front', weeklyTarget: 14 },
    { id: 'front_delts',name: 'Front delts',    short: 'F.Delt',  group: 'push', side: 'front', weeklyTarget: 10 },
    { id: 'side_delts', name: 'Side delts',     short: 'S.Delt',  group: 'push', side: 'front', weeklyTarget: 12 },
    { id: 'rear_delts', name: 'Rear delts',     short: 'R.Delt',  group: 'pull', side: 'back',  weeklyTarget: 10 },
    { id: 'triceps',    name: 'Triceps',        short: 'Tri',     group: 'push', side: 'back',  weeklyTarget: 12 },
    { id: 'biceps',     name: 'Biceps',         short: 'Bi',      group: 'pull', side: 'front', weeklyTarget: 12 },
    { id: 'forearms',   name: 'Forearms',       short: 'Fore',    group: 'pull', side: 'both',  weeklyTarget: 6 },
    { id: 'traps',      name: 'Traps',          short: 'Traps',   group: 'pull', side: 'both',  weeklyTarget: 8 },
    { id: 'lats',       name: 'Lats',           short: 'Lats',    group: 'pull', side: 'back',  weeklyTarget: 14 },
    { id: 'mid_back',   name: 'Mid back',       short: 'M.Back',  group: 'pull', side: 'back',  weeklyTarget: 12 },
    { id: 'lower_back', name: 'Lower back',     short: 'L.Back',  group: 'legs', side: 'back',  weeklyTarget: 6 },
    { id: 'abs',        name: 'Abs',            short: 'Abs',     group: 'core', side: 'front', weeklyTarget: 12 },
    { id: 'obliques',   name: 'Obliques',       short: 'Obl',     group: 'core', side: 'front', weeklyTarget: 8 },
    { id: 'glutes',     name: 'Glutes',         short: 'Glute',   group: 'legs', side: 'back',  weeklyTarget: 12 },
    { id: 'quads',      name: 'Quads',          short: 'Quad',    group: 'legs', side: 'front', weeklyTarget: 14 },
    { id: 'hamstrings', name: 'Hamstrings',     short: 'Ham',     group: 'legs', side: 'back',  weeklyTarget: 12 },
    { id: 'calves',     name: 'Calves',         short: 'Calf',    group: 'legs', side: 'both',  weeklyTarget: 10 }
  ];
});
