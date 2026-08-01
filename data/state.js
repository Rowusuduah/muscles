/* muscles — AppStateV2 migration and validated local backup helpers. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./program.js'));
  else root.APPSTATE = factory(root.PROGRAM);
})(typeof self !== 'undefined' ? self : this, function (programRegistry) {
  'use strict';
  var KEY = 'muscles-state-v2';
  var VERSION = 2;

  function todayISO() {
    var d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  function plainObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
  function safeParse(value, fallback) {
    if (value == null || value === '') return fallback;
    try { return JSON.parse(value); } catch (e) { return fallback; }
  }
  function read(storage, key, fallback) {
    try { return safeParse(storage.getItem(key), fallback); } catch (e) { return fallback; }
  }
  function defaultState() {
    return {
      schemaVersion: VERSION,
      config: {
        name: '', units: 'lb', figure: 'male', start: todayISO(), onboarded: false,
        experience: 'beginner', weeklyFrequency: 3, programId: 'beginner_full_body',
        theme: 'system', advanced: false
      },
      selectedProgram: 'beginner_full_body',
      programRotation: { cycleIndex: 0, sessionCount: 0, calibrated: false },
      workoutLogs: {},
      liftHistory: {},
      machineSettings: {},
      customLabels: {},
      migration: { fromVersion: null, migratedAt: null }
    };
  }
  function normalize(state) {
    var base = defaultState();
    if (!plainObject(state)) return base;
    var config = plainObject(state.config) ? state.config : {};
    Object.keys(base.config).forEach(function (key) {
      if (config[key] !== undefined) base.config[key] = config[key];
    });
    base.config.weeklyFrequency = Math.max(2, Math.min(7, Number(base.config.weeklyFrequency) || 3));
    base.config.experience = base.config.experience === 'intermediate' ? 'intermediate' : 'beginner';
    base.config.theme = ['system', 'dark', 'light'].indexOf(base.config.theme) >= 0 ? base.config.theme : 'system';
    var requestedProgram = state.selectedProgram || base.config.programId;
    var selected = programRegistry && programRegistry.programs && programRegistry.programs[requestedProgram] ? requestedProgram :
      (programRegistry && programRegistry.recommend ? programRegistry.recommend(base.config.experience, base.config.weeklyFrequency) : 'beginner_full_body');
    base.selectedProgram = selected;
    base.config.programId = selected;
    base.programRotation = plainObject(state.programRotation) ? Object.assign(base.programRotation, state.programRotation) : base.programRotation;
    base.workoutLogs = plainObject(state.workoutLogs) ? state.workoutLogs : {};
    base.liftHistory = plainObject(state.liftHistory) ? state.liftHistory : {};
    base.machineSettings = plainObject(state.machineSettings) ? state.machineSettings : {};
    base.customLabels = plainObject(state.customLabels) ? state.customLabels : {};
    base.migration = plainObject(state.migration) ? Object.assign(base.migration, state.migration) : base.migration;
    return base;
  }
  function migrate(storage) {
    var existing = read(storage, KEY, null);
    if (existing && existing.schemaVersion === VERSION) return { state: normalize(existing), migrated: false };

    var legacyConfig = read(storage, 'muscles-config', {});
    var legacyPlan = read(storage, 'muscles-plan', {});
    var legacyLifts = read(storage, 'muscles-lifts', {});
    var legacyLogs = read(storage, 'muscles-log', {});
    var legacyLabels = read(storage, 'muscles-eqnames', {});
    var state = defaultState();
    ['name', 'units', 'figure', 'start', 'onboarded'].forEach(function (key) {
      if (legacyConfig[key] !== undefined) state.config[key] = legacyConfig[key];
    });
    if (legacyConfig.experience) state.config.experience = legacyConfig.experience;
    if (legacyConfig.weeklyFrequency) state.config.weeklyFrequency = legacyConfig.weeklyFrequency;
    var recommended = programRegistry && programRegistry.recommend ?
      programRegistry.recommend(state.config.experience, state.config.weeklyFrequency) : 'beginner_full_body';
    state.selectedProgram = recommended;
    state.config.programId = recommended;
    state.programRotation = Object.assign(state.programRotation, plainObject(legacyPlan) ? legacyPlan : {});
    state.liftHistory = plainObject(legacyLifts) ? legacyLifts : {};
    state.workoutLogs = plainObject(legacyLogs) ? legacyLogs : {};
    state.customLabels = plainObject(legacyLabels) ? legacyLabels : {};
    state.migration = { fromVersion: existing ? existing.schemaVersion || 1 : 1, migratedAt: new Date().toISOString() };
    save(storage, state);
    return { state: state, migrated: true };
  }
  function save(storage, state) {
    var normalized = normalize(state);
    try { storage.setItem(KEY, JSON.stringify(normalized)); } catch (e) {}
    return normalized;
  }
  function validateBackup(value) {
    var errors = [];
    if (!plainObject(value)) errors.push('Backup must contain a JSON object.');
    var version = value && Number(value.schemaVersion);
    if (!version) errors.push('Backup schema version is missing.');
    else if (version > VERSION) errors.push('This backup comes from a newer version of muscles.');
    else if (version !== VERSION) errors.push('Only AppStateV2 backups can be imported.');
    if (value && !plainObject(value.config)) errors.push('Configuration is missing or invalid.');
    if (value && !plainObject(value.workoutLogs)) errors.push('Workout history is missing or invalid.');
    if (value && !plainObject(value.liftHistory)) errors.push('Lift history is missing or invalid.');
    if (value && typeof value.selectedProgram !== 'string') errors.push('Selected program is missing.');
    if (!errors.length && (!programRegistry.programs || !programRegistry.programs[value.selectedProgram])) errors.push('Selected program is not available in this app.');
    var logs = value && plainObject(value.workoutLogs) ? Object.keys(value.workoutLogs).length : 0;
    var lifts = value && plainObject(value.liftHistory) ? Object.keys(value.liftHistory).length : 0;
    return {
      ok: errors.length === 0,
      errors: errors,
      summary: { workoutDays: logs, trackedExercises: lifts, program: value && value.selectedProgram || 'unknown' }
    };
  }
  function parseBackup(text) {
    var value;
    try { value = JSON.parse(text); } catch (e) {
      return { ok: false, errors: ['The selected file is not valid JSON.'], summary: { workoutDays: 0, trackedExercises: 0, program: 'unknown' } };
    }
    var validation = validateBackup(value);
    validation.value = validation.ok ? normalize(value) : null;
    return validation;
  }
  function exportBackup(state) {
    var payload = normalize(state);
    payload.exportedAt = new Date().toISOString();
    return JSON.stringify(payload, null, 2);
  }
  function replaceFromBackup(storage, parsed) {
    if (!parsed || !parsed.ok || !parsed.value) return { ok: false, error: 'Backup was not validated.' };
    var saved = save(storage, parsed.value);
    return { ok: true, state: saved };
  }

  return {
    KEY: KEY, VERSION: VERSION, defaultState: defaultState, normalize: normalize,
    migrate: migrate, save: save, validateBackup: validateBackup, parseBackup: parseBackup,
    exportBackup: exportBackup, replaceFromBackup: replaceFromBackup
  };
});
