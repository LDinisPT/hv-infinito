const CACHE = 'verallia-v2-022';
const FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/base.css?v=22',
  './css/components.css?v=22',
  './css/hoje.css?v=22',
  './css/onboarding.css?v=22',
  './css/alarm.css?v=22',
  './css/rendimento.css?v=22',
  './js/data.js?v=22',
  './js/core.js?v=22',
  './js/weather.js?v=22',
  './js/medico.js?v=22',
  './js/hoje.js?v=22',
  './js/mes.js?v=22',
  './js/mais.js?v=22',
  './js/timeline.js?v=22',
  './js/onboarding.js?v=22',
  './js/alarm.js?v=22',
  './js/rendimento.js?v=22',
  './js/tabs.js?v=22',
  './js/app.js?v=22',
  './assets/verallia_logo.avif',
  './assets/qrcode.png?v=22',
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
