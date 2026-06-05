const CACHE = 'verallia-2027-v26';
const FILES = ['/', '/index.html', '/schedule-data.js', '/manifest.json', '/verallia_logo.avif'];

// Force update on every install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
    .then(() => caches.open(CACHE).then(c => c.addAll(FILES)))
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


// ===== ALARM HANDLING =====
let scheduledAlarms = [];
let alarmTimers = [];

function clearAlarmTimers(){
  alarmTimers.forEach(t => clearTimeout(t));
  alarmTimers = [];
}

function scheduleAlarmTimers(alarms, label){
  clearAlarmTimers();
  const now = Date.now();
  alarms.forEach(ts => {
    const delay = ts - now;
    if(delay > 0 && delay < 7 * 24 * 3600 * 1000){
      const timer = setTimeout(() => {
        self.registration.showNotification('Verallia Portugal', {
          body: label || 'Turno Manhã 05h — Bom turno! 🌅',
          icon: '/verallia_logo.avif',
          badge: '/verallia_logo.avif',
          tag: 'verallia-alarm-' + ts,
          renotify: true,
          requireInteraction: false,
          vibrate: [200, 100, 200],
        });
      }, delay);
      alarmTimers.push(timer);
    }
  });
}

self.addEventListener('message', event => {
  if(event.data && event.data.type === 'SCHEDULE_ALARMS'){
    scheduledAlarms = event.data.alarms || [];
    scheduleAlarmTimers(scheduledAlarms, event.data.label);
  }
  if(event.data && event.data.type === 'CANCEL_ALARMS'){
    clearAlarmTimers();
    scheduledAlarms = [];
  }
  if(event.data === 'reload'){
    self.clients.matchAll().then(clients => {
      clients.forEach(c => c.navigate(c.url));
    });
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
