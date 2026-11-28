// Offline support. Bump VERSION whenever any file in docs/ changes.
const VERSION = 'wordgames-v18';
const FILES = ['./', 'index.html', 'config.js?v=18', 'styles.css?v=18', 'app.js?v=18', 'words.js?v=18', 'kids-words.js?v=18', 'english-data.js?v=18', 'tenth-data.js?v=18', 'luli-english.js?v=18', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Network first (so updates arrive), cache as fallback when offline. Google Fonts are cached too.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok || res.type === 'opaque') {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
