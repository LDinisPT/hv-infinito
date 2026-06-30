const CACHE = 'verallia-v2-034';
const FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/base.css?v=34',
  './css/components.css?v=34',
  './css/hoje.css?v=34',
  './css/onboarding.css?v=34',
  './css/alarm.css?v=34',
  './css/rendimento.css?v=34',
  './js/data.js?v=34',
  './js/core.js?v=34',
  './js/weather.js?v=34',
  './js/medico.js?v=34',
  './js/hoje.js?v=34',
  './js/mes.js?v=34',
  './js/mais.js?v=34',
  './js/timeline.js?v=34',
  './js/onboarding.js?v=34',
  './js/alarm.js?v=34',
  './js/rendimento.js?v=34',
  './js/ausencias.js?v=34',
  './js/news.js?v=34',
  './js/tabs.js?v=34',
  './js/app.js?v=34',
  './assets/verallia_logo.avif',
  './assets/verallia_logo.png',
  './assets/qrcode.png?v=34',
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
