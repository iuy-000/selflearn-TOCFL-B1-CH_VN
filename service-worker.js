const CACHE = 'boar-vocab-v2025041701';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './styles.css',
  './data.js',
  './assets/boar_datouzhao.png',
  './assets/boar_happy.png',
  './assets/boar_proud.png',
  './assets/boar_sad.png',
  './assets/boar_study.png',
  './assets/boar_tired.png',
  './assets/boar_boba.png',
  './assets/boar_angry_cry_locked.png',
  './assets/boar_confused_think.png',
  './assets/boar_fridge_empty_full.png',
  './assets/boar_relax_study_mask.png',
  './assets/boar_rich_eyes.png',
  './assets/boar_study_victory.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
