/* muscles — optional Google Drive sync.
   Saves the single AppStateV2 blob as one file in your Google Drive so your
   training data follows you across devices. Offline-first: nothing here runs
   unless you connect. Ported from the MoneyTrack sync pattern; reuses the same
   Google app (client id) with its own file, so the two never mix.

   Browser global: MDRIVE. Also require()-able in Node for testing the pure
   decision logic — the factory touches no browser APIs at load time. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.MDRIVE = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var CLIENT_ID = '394124622094-3cj4ho2ipp3m6pm0un09tg9knelhfqtu.apps.googleusercontent.com';
  var SCOPE     = 'https://www.googleapis.com/auth/drive.file';
  var FILENAME  = 'Muscles_Backup.json';
  var KEY_FILE      = 'muscles_gdrive_file_id';
  var KEY_CONNECTED = 'muscles_gdrive_ok';
  var KEY_UPDATED   = 'muscles-updated-at';
  var DEBOUNCE_MS   = 3000;

  // ---- pure sync decision (unit-tested) -----------------------------------
  // ISO-8601 strings sort chronologically, so plain string comparison works.
  // Returns 'pull' (drive newer), 'push' (local newer), or 'same'.
  function decideSync(localUpdatedAt, driveUpdatedAt) {
    var l = localUpdatedAt || '';
    var d = driveUpdatedAt || '';
    if (d > l) return 'pull';
    if (l > d) return 'push';
    return 'same';
  }

  // In a Node/test context there's no browser — expose only the pure bits.
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { decideSync: decideSync, FILENAME: FILENAME, SCOPE: SCOPE };
  }

  // ---- browser state ------------------------------------------------------
  var tokenClient = null;
  var accessToken = null;
  var pendingOp = null;
  var isAutoAuth = false;
  var syncTimer = null;
  var retrying = false;
  var lastStatus = '';
  var hooks = { onStatus: null, onLoaded: null };

  function setStatus(text, isError) {
    lastStatus = text || '';
    if (hooks.onStatus) try { hooks.onStatus(lastStatus, !!isError); } catch (e) {}
  }
  function status() { return lastStatus; }
  function isConnected() { try { return !!localStorage.getItem(KEY_CONNECTED); } catch (e) { return false; } }
  function localUpdatedAt() { try { return localStorage.getItem(KEY_UPDATED) || ''; } catch (e) { return ''; } }
  function stampNow() { var t = new Date().toISOString(); try { localStorage.setItem(KEY_UPDATED, t); } catch (e) {} return t; }

  function readLocalState() {
    try { return JSON.parse(localStorage.getItem(APPSTATE.KEY)); } catch (e) { return null; }
  }
  function buildPayload() {
    // exportBackup normalizes and stamps exportedAt; we add our own change time.
    var raw;
    try { raw = JSON.parse(APPSTATE.exportBackup(readLocalState())); } catch (e) { raw = {}; }
    raw.updatedAt = localUpdatedAt() || stampNow();
    return JSON.stringify(raw);
  }

  function googleReady() {
    return typeof google !== 'undefined' && google.accounts && google.accounts.oauth2;
  }
  function initClient() {
    if (tokenClient || !googleReady()) return;
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: function (resp) {
        if (resp.error) {
          if (!isAutoAuth) setStatus('Sign-in failed: ' + resp.error, true);
          isAutoAuth = false; pendingOp = null; return;
        }
        accessToken = resp.access_token;
        isAutoAuth = false;
        if (pendingOp) { var op = pendingOp; pendingOp = null; op(); }
      }
    });
  }
  function withToken(op) {
    if (!googleReady()) { setStatus('Google library not loaded — check your connection and reload.', true); return; }
    if (!tokenClient) initClient();
    if (accessToken) op();
    else { pendingOp = op; tokenClient.requestAccessToken({ prompt: '' }); }
  }
  function silentToken() {
    return new Promise(function (resolve) {
      if (!tokenClient) { resolve(false); return; }
      var prev = tokenClient.callback;
      tokenClient.callback = function (resp) {
        tokenClient.callback = prev;
        if (resp.error) { resolve(false); return; }
        accessToken = resp.access_token; resolve(true);
      };
      tokenClient.requestAccessToken({ prompt: '' });
    });
  }

  function gFetch(url, options) {
    options = options || {};
    var headers = Object.assign({ Authorization: 'Bearer ' + accessToken }, options.headers || {});
    return fetch(url, Object.assign({}, options, { headers: headers })).then(function (resp) {
      if (resp.status === 401) { accessToken = null; throw { _status: 401 }; }
      return resp;
    });
  }
  function findFile() {
    var q = encodeURIComponent("name='" + FILENAME + "' and trashed=false");
    return gFetch('https://www.googleapis.com/drive/v3/files?q=' + q + '&spaces=drive&fields=files(id)')
      .then(function (r) { return r.json(); })
      .then(function (data) { return (data.files && data.files[0] && data.files[0].id) || null; });
  }
  function createFile(content) {
    var meta = { name: FILENAME, mimeType: 'application/json' };
    var form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'application/json' }));
    return gFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
      { method: 'POST', body: form })
      .then(function (r) { if (!r.ok) throw new Error('Drive create failed (' + r.status + ')'); return r.json(); })
      .then(function (data) { if (!data.id) throw new Error('Drive create failed: no id'); return data.id; });
  }
  function updateFile(fileId, content) {
    return gFetch('https://www.googleapis.com/upload/drive/v3/files/' + fileId + '?uploadType=media',
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: content })
      .then(function (r) { if (!r.ok) throw new Error('Drive update failed (' + r.status + ')'); });
  }
  function cachedFileId() { try { return localStorage.getItem(KEY_FILE); } catch (e) { return null; } }
  function rememberFile(id) { try { localStorage.setItem(KEY_FILE, id); } catch (e) {} }
  function markConnected() { try { localStorage.setItem(KEY_CONNECTED, '1'); } catch (e) {} }

  function pushLocal() {
    var json = buildPayload();
    var id = cachedFileId();
    var write = id ? Promise.resolve(id) : findFile().then(function (found) { if (found) rememberFile(found); return found; });
    return write.then(function (fileId) {
      if (fileId) return updateFile(fileId, json).then(function () { return fileId; });
      return createFile(json).then(function (created) { rememberFile(created); return created; });
    });
  }
  function fetchRemote() {
    var id = cachedFileId();
    var find = id ? Promise.resolve(id) : findFile().then(function (found) { if (found) rememberFile(found); return found; });
    return find.then(function (fileId) {
      if (!fileId) return null;
      return gFetch('https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media')
        .then(function (r) { return r.text(); })
        .then(function (text) {
          var raw; try { raw = JSON.parse(text); } catch (e) { return null; }
          return { text: text, updatedAt: raw && raw.updatedAt || '', raw: raw };
        });
    });
  }
  // Validate + apply a pulled remote snapshot, then reload so the UI reflects it.
  function applyRemote(remote) {
    var parsed = APPSTATE.parseBackup(remote.text);
    if (!parsed.ok) { setStatus('Cloud data failed validation', true); return false; }
    APPSTATE.replaceFromBackup(localStorage, parsed);
    try { localStorage.setItem(KEY_UPDATED, remote.updatedAt || new Date().toISOString()); } catch (e) {}
    setStatus('Loaded from Drive');
    if (hooks.onLoaded) hooks.onLoaded();
    return true;
  }

  // ---- public operations --------------------------------------------------
  function connect() {
    withToken(function () {
      setStatus('Connecting…');
      markConnected();
      fetchRemote().then(function (remote) {
        if (!remote) {
          if (!localUpdatedAt()) stampNow();
          return pushLocal().then(function () { setStatus('Connected · backed up to Drive'); });
        }
        var decision = localUpdatedAt() ? decideSync(localUpdatedAt(), remote.updatedAt) : 'ask';
        if (decision === 'pull' || decision === 'ask') {
          var msg = 'A muscles backup was found in your Google Drive (updated ' +
            (remote.updatedAt ? remote.updatedAt.slice(0, 10) : 'unknown') +
            ').\n\nLoad it onto this device? This replaces the data currently on this device.';
          if (window.confirm(msg)) { applyRemote(remote); return; }
          if (!localUpdatedAt()) stampNow();
          return pushLocal().then(function () { setStatus('Kept this device · updated Drive'); });
        }
        if (decision === 'push') return pushLocal().then(function () { setStatus('Connected · updated Drive'); });
        setStatus('Connected · already in sync');
      }).catch(function (err) { handleErr(err, connect, 'Connect'); });
    });
  }
  function saveNow() {
    withToken(function () {
      setStatus('Saving…');
      pushLocal().then(function () { markConnected(); setStatus('Saved ' + clock()); })
        .catch(function (err) { handleErr(err, saveNow, 'Save'); });
    });
  }
  function loadNow() {
    withToken(function () {
      setStatus('Loading…');
      fetchRemote().then(function (remote) {
        if (!remote) { setStatus('No backup in Drive yet'); return; }
        var warn = decideSync(localUpdatedAt(), remote.updatedAt) === 'push'
          ? '\n\n⚠️ Your data on this device is NEWER than the Drive copy — loading overwrites your recent changes.' : '';
        if (!window.confirm('Load the Drive backup (updated ' + (remote.updatedAt ? remote.updatedAt.slice(0, 10) : 'unknown') + ')?' + warn + '\n\nThis replaces the data on this device.')) { setStatus(''); return; }
        applyRemote(remote);
      }).catch(function (err) { handleErr(err, loadNow, 'Load'); });
    });
  }
  function disconnect() {
    try { localStorage.removeItem(KEY_CONNECTED); localStorage.removeItem(KEY_FILE); } catch (e) {}
    accessToken = null;
    setStatus('Disconnected');
  }

  // Debounced background push after local changes (only when connected).
  function runSync() {
    if (!accessToken) {
      if (!tokenClient) initClient();
      if (!tokenClient) return Promise.resolve();
      return silentToken().then(function (ok) { if (ok) return runSync(); setStatus('Drive disconnected', true); });
    }
    return pushLocal().then(function () { retrying = false; setStatus('Auto-saved ' + clock()); })
      .catch(function (err) {
        if (err && err._status === 401 && !retrying) { accessToken = null; retrying = true; return silentToken().then(function (ok) { if (ok) return runSync(); setStatus('Drive disconnected', true); }); }
        retrying = false;
      });
  }
  function queue() {
    if (!isConnected()) return;
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(function () { syncTimer = null; runSync(); }, DEBOUNCE_MS);
  }
  function flush() { if (syncTimer) { clearTimeout(syncTimer); syncTimer = null; runSync(); } }
  // Called by the app on any persisted change: always record the change time so
  // last-write-wins is meaningful; push if connected.
  function markChanged() { stampNow(); queue(); }

  // Silent pull-if-newer on boot for a previously-connected device.
  function autoBoot() {
    if (!isConnected()) return;
    var attempts = 0;
    (function tryAuto() {
      if (!googleReady()) { if (++attempts >= 20) return; setTimeout(tryAuto, 500); return; }
      if (!tokenClient) initClient();
      silentToken().then(function (ok) {
        if (!ok) { setStatus('Drive: sign in to sync', true); return; }
        setStatus('Syncing…');
        fetchRemote().then(function (remote) {
          if (!remote) { setStatus(''); return; }
          var decision = decideSync(localUpdatedAt(), remote.updatedAt);
          if (decision === 'pull') { applyRemote(remote); }
          else if (decision === 'push') { pushLocal().then(function () { setStatus('Synced ' + clock()); }); }
          else { setStatus('In sync'); }
        }).catch(function (err) { if (!(err && err._status === 401)) setStatus(''); });
      });
    })();
  }

  function handleErr(err, retryFn, label) {
    if (err && err._status === 401 && !retrying) { retrying = true; accessToken = null; return silentToken().then(function (ok) { retrying = false; if (ok) return retryFn(); setStatus(label + ' failed — sign in again', true); }); }
    retrying = false;
    setStatus(label + ' failed', true);
    if (typeof console !== 'undefined') console.error('[muscles Drive]', err);
  }
  function clock() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }

  return {
    decideSync: decideSync,
    isConnected: isConnected,
    status: status,
    setHooks: function (h) { hooks.onStatus = h.onStatus || null; hooks.onLoaded = h.onLoaded || null; },
    connect: connect, disconnect: disconnect, saveNow: saveNow, loadNow: loadNow,
    queue: queue, flush: flush, markChanged: markChanged, autoBoot: autoBoot,
    FILENAME: FILENAME, SCOPE: SCOPE
  };
});
