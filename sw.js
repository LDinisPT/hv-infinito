const CACHE = 'verallia-v2-020';
const FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/base.css?v=20',
  './css/components.css?v=20',
  './css/hoje.css?v=20',
  './css/onboarding.css?v=20',
  './css/alarm.css?v=20',
  './css/rendimento.css?v=20',
  './js/data.js?v=20',
  './js/core.js?v=20',
  './js/weather.js?v=20',
  './js/medico.js?v=20',
  './js/hoje.js?v=20',
  './js/mes.js?v=20',
  './js/mais.js?v=20',
  './js/timeline.js?v=20',
  './js/onboarding.js?v=20',
  './js/alarm.js?v=20',
  './js/rendimento.js?v=20',
  './js/tabs.js?v=20',
  './js/app.js?v=20',
  './assets/verallia_logo.avif',
  './assets/qrcode.png?v=20',
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
