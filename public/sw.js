const CACHE_NAME = 'scifi-networks-v1';
const OFFLINE_URL = '/offline';

const PRECACHE_URLS = ['/', '/packages', '/status', '/offline'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Network-first for navigation requests, falling back to cache, then to the
// offline page. Never intercepts /api, /staff, /wp-admin, or /track — those
// require a live server and must not appear to "work" offline (spec: don't
// pretend offline capability where a live connection is actually required).
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isProtected =
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/staff') ||
    url.pathname.startsWith('/wp-admin') ||
    url.pathname.startsWith('/track');

  if (event.request.method !== 'GET' || isProtected) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request).then((cached) => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
