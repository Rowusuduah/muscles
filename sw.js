/* muscles — update-safe offline service worker.
   HTML is network-first, the versioned shell is precached, and the large handbook
   PDF is cached only after the owner opens it online. */
var CACHE = 'muscles-verified-v2-2026-07-31-r8';
var PDF = 'Complete_Gym_Equipment_Handbook_Revised.pdf';
var EQUIPMENT = Array.from({ length: 51 }, function (_, i) { return 'assets/equipment/eq' + (i + 1) + '.webp'; });
var DEMO_IDS = [
  'ab_crunch_machine','assisted_dip','assisted_pullup','bulgarian_split','cable_crossover','cable_crunch','cable_curl','cable_kickback','cable_lateral','cable_pushdown','cable_rear_delt','cable_row','close_grip_smith','db_bench','db_curl','db_incline','db_lateral','db_rdl','db_row','db_shoulder_press','db_shrug','db_skullcrusher','ez_curl','face_pull','goblet_squat','hack_squat','hammer_curl','hanging_leg_raise','hip_abduction','incline_db_curl','lat_pulldown','leg_extension','leg_press','leg_press_calf','lying_leg_curl','lying_leg_raise','overhead_cable_ext','pec_deck','pl_chest_press','pl_high_row','pl_incline_press','pl_low_row','pl_shoulder_press','plank','pushup','rear_delt_machine','russian_twist','seated_calf','seated_leg_curl','sel_arm_curl','sel_chest_press','sel_seated_row','sel_shoulder_press','smith_bench','smith_hip_thrust','smith_ohp','smith_rdl','smith_squat','standing_calf','straight_arm_pulldown','walking_lunge'
];
var DEMOS = DEMO_IDS.reduce(function (all, id) {
  all.push('assets/demos/' + id + '_0.webp', 'assets/demos/' + id + '_1.webp');
  return all;
}, []);
var SHELL = [
  './', 'index.html', 'app.js', 'logic.js', 'figure.js', 'howto.js',
  'data/muscles.js', 'data/exercises.js', 'data/handbook.js', 'data/equipment.js',
  'data/program.js', 'data/state.js', 'data/demos.js', 'manifest.json',
  'icons/icon-192.png', 'icons/icon-512.png', 'og.png',
  'fonts/Oswald-Variable.ttf', 'fonts/IBMPlexMono-Regular.ttf',
  'fonts/IBMPlexMono-SemiBold.ttf', 'fonts/Inter-Variable.ttf'
].concat(EQUIPMENT, DEMOS);

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return Promise.all(SHELL.map(function (url) {
      return cache.add(url).catch(function (error) {
        console.warn('Optional precache failed', url, error && error.message);
      });
    }));
  }));
});

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key !== CACHE; }).map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }));
});

function networkFirst(request, fallback) {
  return fetch(request).then(function (response) {
    if (response && response.ok) caches.open(CACHE).then(function (cache) { cache.put(request, response.clone()); });
    return response;
  }).catch(function () { return caches.match(request).then(function (hit) { return hit || caches.match(fallback); }); });
}

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, 'index.html'));
    return;
  }
  if (url.pathname.endsWith('/' + PDF) || url.pathname.endsWith(PDF)) {
    event.respondWith(networkFirst(event.request, null));
    return;
  }
  event.respondWith(caches.match(event.request).then(function (cached) {
    if (cached) return cached;
    return fetch(event.request).then(function (response) {
      if (response && response.ok) caches.open(CACHE).then(function (cache) { cache.put(event.request, response.clone()); });
      return response;
    });
  }));
});
