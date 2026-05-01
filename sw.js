const CACHE = "escala-sr-v20260501173234";
const STATIC_ASSETS = [
  '/escalamusicossantarita/',
  '/escalamusicossantarita/index.html',
  '/escalamusicossantarita/manifest.json',
  '/escalamusicossantarita/logo_santarita.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Network-first para Firestore / Firebase
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

  // Cache-first para assets estáticos
  event.respondWith(
    caches.match(event.request).then(cached => {
      if(cached) return cached;
      return fetch(event.request).then(response => {
        if(response && response.status === 200 && response.type === 'basic'){
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
