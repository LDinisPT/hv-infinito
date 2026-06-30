const CACHE = 'verallia-v2-036';
const FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/base.css?v=36',
  './css/components.css?v=36',
  './css/hoje.css?v=36',
  './css/onboarding.css?v=36',
  './css/alarm.css?v=36',
  './css/rendimento.css?v=36',
  './js/data.js?v=36',
  './js/core.js?v=36',
  './js/weather.js?v=36',
  './js/medico.js?v=36',
  './js/hoje.js?v=36',
  './js/mes.js?v=36',
  './js/mais.js?v=36',
  './js/timeline.js?v=36',
  './js/onboarding.js?v=36',
  './js/alarm.js?v=36',
  './js/rendimento.js?v=36',
  './js/ausencias.js?v=36',
  './js/news.js?v=36',
  './js/tabs.js?v=36',
  './js/app.js?v=36',
  './js/firebase.js?v=36',
  './assets/verallia_logo.avif',
  './assets/verallia_logo.png',
  './assets/qrcode.png?v=36',
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
  const req = e.request;
  // Só tratamos GET. Firestore (POST/canal em tempo real) passa direto à rede.
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('firebaseio.com')) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        // Só guardamos respostas válidas (evita cachear erros/opacas indevidamente)
        if(res && res.ok){
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone)).catch(()=>{});
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
