const CACHE = "escala-sr-v20260501143315";
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/portal.html',
  '/manifest.json',
  '/logo_santarita.jpg'
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for static, network-first for Firestore
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Network-first for Firestore / Firebase API calls
  if (
    url.hostname === 'firestore.googleapis.com' ||
    url.hostname.endsWith('.firebaseio.com') ||
    url.hostname.endsWith('.googleapis.com') ||
    url.hostname.endsWith('.firebaseapp.com')
  ) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
