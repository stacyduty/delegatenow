const CACHE_NAME = 'delig8te-v2';
const STATIC_CACHE = 'delig8te-static-v2';
const DYNAMIC_CACHE = 'delig8te-dynamic-v2';

const STATIC_URLS = [
  '/',
  '/manifest.json',
  '/favicon.png',
];

const APP_ROUTES = [
  '/',
  '/dashboard',
  '/tasks',
  '/team',
  '/analytics',
  '/voice-history',
  '/settings',
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_URLS);
      }),
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('Service Worker: Pre-caching app routes');
        return Promise.all(
          APP_ROUTES.map((url) =>
            fetch(url)
              .then((response) => cache.put(url, response))
              .catch((err) => console.log(`Failed to cache ${url}:`, err))
          )
        );
      }),
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![STATIC_CACHE, DYNAMIC_CACHE].includes(cacheName)) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (
    event.request.url.includes('/api/') ||
    event.request.url.startsWith('chrome-extension://') ||
    event.request.url.includes('hot-update')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseToCache = response.clone();

        const cacheTarget = event.request.url.includes('/assets/') 
          ? STATIC_CACHE 
          : DYNAMIC_CACHE;

        caches.open(cacheTarget).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }

          if (event.request.mode === 'navigate') {
            return caches.match('/').then((indexResponse) => {
              return indexResponse || new Response('Offline - App not available', {
                status: 503,
                statusText: 'Service Unavailable',
              });
            });
          }

          return new Response('Offline - Resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mutations') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_MUTATIONS' });
        });
      })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
