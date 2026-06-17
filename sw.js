const CACHE = 'verallia-v2-014';
const FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/base.css?v=14',
  './css/components.css?v=14',
  './css/hoje.css?v=14',
  './css/onboarding.css?v=14',
  './css/alarm.css?v=14',
  './js/data.js?v=14',
  './js/core.js?v=14',
  './js/weather.js?v=14',
  './js/medico.js?v=14',
  './js/hoje.js?v=14',
  './js/mes.js?v=14',
  './js/mais.js?v=14',
  './js/timeline.js?v=14',
  './js/onboarding.js?v=14',
  './js/alarm.js?v=14',
  './js/tabs.js?v=14',
  './js/app.js?v=14',
  './assets/verallia_logo.avif',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => caches.open(CACHE).then(c => c.addAll(FILES)))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
  self.clients.matchAll({includeUncontrolled: true}).then(clients => {
    clients.forEach(c => c.postMessage('reload'));
  });
});

// Network first, fallback to cache
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
