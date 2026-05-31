const CACHE = 'verallia-2026-v7';
const FILES = ['/', '/index.html', '/schedule-data.js', '/manifest.json', '/verallia_logo.avif', '/verallia_logo.avif'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
  self.clients.matchAll().then(clients => clients.forEach(c => c.postMessage('reload')));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
