/* muscles — service worker. Precache the app shell so it runs fully offline.
   Bump CACHE on each deploy to invalidate. Cache-first with network fallback. */
var CACHE = 'muscles-v1';
var EQ = [2, 5, 6, 9, 11, 12, 13, 17, 19, 20, 21, 22, 24, 28, 29, 30, 31, 33, 34, 36, 37, 38, 40, 43, 44, 45, 46, 47, 48, 49, 50, 51];
var ASSETS = [
  './', 'index.html', 'app.js', 'logic.js', 'figure.js',
  'data/muscles.js', 'data/exercises.js', 'data/equipment.js', 'data/program.js',
  'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png'
].concat(EQ.map(function (n) { return 'assets/equipment/eq' + n + '.webp'; }));

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    // add individually so one missing file doesn't abort the whole install
    return Promise.all(ASSETS.map(function (u) { return c.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy).catch(function () {}); });
        return res;
      }).catch(function () { return hit; });
    })
  );
});
