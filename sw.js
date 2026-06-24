const CACHE = 'verallia-v2-030';
const FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/base.css?v=30',
  './css/components.css?v=30',
  './css/hoje.css?v=30',
  './css/onboarding.css?v=30',
  './css/alarm.css?v=30',
  './css/rendimento.css?v=30',
  './js/data.js?v=30',
  './js/core.js?v=30',
  './js/weather.js?v=30',
  './js/medico.js?v=30',
  './js/hoje.js?v=30',
  './js/mes.js?v=30',
  './js/mais.js?v=30',
  './js/timeline.js?v=30',
  './js/onboarding.js?v=30',
  './js/alarm.js?v=30',
  './js/rendimento.js?v=30',
  './js/ausencias.js?v=30',
  './js/news.js?v=30',
  './js/tabs.js?v=30',
  './js/app.js?v=30',
  './assets/verallia_logo.avif',
  './assets/verallia_logo.png',
  './assets/qrcode.png?v=30',
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
