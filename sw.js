const VERSION = 'v1';
const STATIC_CACHE = `static-${VERSION}`;
const PACK_CACHE = `packs-${VERSION}`;
const APP_SHELL = [
  '/',
  '/index.html',
  '/builder/index.html',
  '/compendium/index.html',
  '/js/loader.js',
  '/builder/wizard.js',
  '/builder/summary.js',
  '/packs/manifest.json',
  '/manifest.webmanifest',
  '/icons/icon.svg'
];

async function cacheShell() {
  const cache = await caches.open(STATIC_CACHE);
  await cache.addAll(APP_SHELL);
}

async function cleanOldCaches() {
  const keep = new Set([STATIC_CACHE, PACK_CACHE]);
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key)));
}

async function cachePackAssets(assets = []) {
  if (!assets.length) return;
  const cache = await caches.open(PACK_CACHE);
  await Promise.all(assets.map(async (asset) => {
    try {
      const request = new Request(asset, { credentials: 'same-origin' });
      const existing = await cache.match(request);
      if (existing) {
        return;
      }
      const response = await fetch(request);
      if (response && response.ok) {
        await cache.put(request, response.clone());
      }
    } catch (error) {
      console.warn('Failed to precache pack asset', asset, error);
    }
  }));
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheShell());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(cleanOldCaches());
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (APP_SHELL.includes(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })());
    return;
  }

  if (url.pathname.startsWith('/data/') || url.pathname.startsWith('/packs/')) {
    event.respondWith((async () => {
      const cache = await caches.open(PACK_CACHE);
      const cached = await cache.match(request);
      if (cached) {
        event.waitUntil(fetch(request).then((response) => {
          if (response && response.ok) {
            cache.put(request, response.clone());
          }
        }).catch(() => {}));
        return cached;
      }
      const response = await fetch(request).catch(() => null);
      if (response && response.ok) {
        cache.put(request, response.clone());
        return response;
      }
      return caches.match(request);
    })());
    return;
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});

self.addEventListener('message', (event) => {
  if (!event.data || typeof event.data !== 'object') return;
  const { type, assets } = event.data;
  if (type === 'CACHE_PACKS') {
    event.waitUntil(cachePackAssets(Array.isArray(assets) ? assets : []));
  }
  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
