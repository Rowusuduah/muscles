/* muscles — generated verified equipment facade.
   The complete instructional content lives in HANDBOOK_GUIDES. This compatibility
   layer keeps the coach/runtime API small while exposing exactly 45 confirmed guides. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./handbook.js'));
  else root.EQUIPMENT = factory(root.HANDBOOK_GUIDES);
})(typeof self !== 'undefined' ? self : this, function (guides) {
  var categoryTags = {
    'Push': ['chest', 'shoulders', 'arms'],
    'Pull': ['back', 'shoulders', 'arms'],
    'Legs': ['legs', 'glutes'],
    'Core': ['abs'],
    'Full Body': ['chest', 'back', 'shoulders', 'arms', 'legs', 'abs'],
    'Cardio': ['cardio']
  };
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
      exerciseIds: guide.linkedExerciseIds.slice(),
      confidence: guide.evidence.confidence,
      evidence: guide.evidence.summary,
      note: guide.purpose,
      verified: true
    };
  });
});
