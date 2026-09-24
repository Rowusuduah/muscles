/* muscles — generated verified equipment facade.
   The complete instructional content lives in HANDBOOK_GUIDES. This compatibility
   layer keeps the coach/runtime API small while exposing exactly 45 confirmed guides. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./handbook.js'), require('./dumbbells.js'));
  else root.EQUIPMENT = factory(root.HANDBOOK_GUIDES, root.DUMBBELL_EXERCISES || []);
})(typeof self !== 'undefined' ? self : this, function (guides, dumbbells) {
  var categoryTags = {
    'Push': ['chest', 'shoulders', 'arms'],
    'Pull': ['back', 'shoulders', 'arms'],
    'Legs': ['legs', 'glutes'],
    'Core': ['abs'],
    'Full Body': ['chest', 'back', 'shoulders', 'arms', 'legs', 'abs'],
    'Cardio': ['cardio']
  };
  var allDumbbells = (dumbbells || []).map(function (exercise) { return exercise.id; });
  var benchDumbbells = (dumbbells || []).filter(function (exercise) { return exercise.requiresBench; }).map(function (exercise) { return exercise.id; });
  var lightDumbbells = (dumbbells || []).filter(function (exercise) { return exercise.role === 'isolation' && !exercise.requiresBench; }).map(function (exercise) { return exercise.id; });
  return (guides || []).map(function (guide) {
    var first = guide.photos[0];
    return {
      id: guide.id,
      guideId: guide.id,
      guideNo: guide.no,
      name: guide.identity,
      type: guide.equipmentType,
      category: guide.category,
      categoryColor: guide.categoryColor,
      photo: first.webp,
      photos: guide.photos,
      src: first.raw,
      sourceFiles: guide.photos.map(function (photo) { return photo.filename; }),
      cats: categoryTags[guide.category] || [],
      exerciseIds: guide.id === 'guide-39-dumbbells' ? allDumbbells.slice() :
        (guide.id === 'guide-40-light-dumbbells-and-small-tools' ? lightDumbbells.slice() :
          (guide.id === 'guide-42-adjustable-utility-benches' ? Array.from(new Set(guide.linkedExerciseIds.concat(benchDumbbells))) : guide.linkedExerciseIds.slice())),
      confidence: guide.evidence.confidence,
      evidence: guide.evidence.summary,
      note: guide.purpose,
      verified: true
    };
  });
});
