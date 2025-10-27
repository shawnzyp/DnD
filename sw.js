const APP_CACHE = 'quest-kit-shell-v1';
const PACK_CACHE = 'quest-kit-packs-v1';
const BASE_URL = new URL('./', self.location.href);
const BASE_PATH = BASE_URL.pathname.endsWith('/') ? BASE_URL.pathname : `${BASE_URL.pathname}/`;
const APP_SHELL_PATHS = [
  './',
  'index.html',
  'css/theme.css',
  'js/app.js',
  'js/loader.js',
  'js/home.js',
  'js/pack-validation.js',
  'js/compendium.js',
  'js/compendium-worker.js',
  'builder/wizard.js',
  'builder/summary.js',
  'builder/index.html',
  'compendium/index.html',
  'manifest.webmanifest',
  'packs/manifest.json'
];
const APP_SHELL_URLS = APP_SHELL_PATHS.map((path) => new URL(path, BASE_URL).toString());
const APP_SHELL_URL_SET = new Set(APP_SHELL_URLS);

let packRevisions = new Map();

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_CACHE);
      await cache.addAll(APP_SHELL_URLS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const expected = new Set([APP_CACHE, PACK_CACHE]);
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => !expected.has(key)).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

async function fetchAndCache(request, cacheName, { refresh = false } = {}) {
  const cache = await caches.open(cacheName);
  const response = await fetch(request, refresh ? { cache: 'reload' } : undefined);
  if (response && response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetchAndCache(request, cacheName);
    if (response) {
      return response;
    }
  } catch (error) {
    console.warn('SW: cacheFirst network error', error);
  }
  return caches.match(new URL('index.html', BASE_URL).toString());
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetchAndCache(request, cacheName).catch((error) => {
    console.warn('SW: staleWhileRevalidate network error', error);
    return null;
  });
  return cached || (await fetchPromise) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(cacheFirst(request, APP_CACHE));
    return;
  }

  if (url.pathname.startsWith(`${BASE_PATH}data/`)) {
    event.respondWith(staleWhileRevalidate(request, PACK_CACHE));
    return;
  }

  if (APP_SHELL_URL_SET.has(request.url)) {
    event.respondWith(cacheFirst(request, APP_CACHE));
    return;
  }
});

function normaliseEntry(entry = {}) {
  const urls = Array.isArray(entry.urls) ? entry.urls : [];
  const revision = typeof entry.revision === 'string' ? entry.revision : '';
  return {
    revision,
    urls: urls
      .map((value) => {
        try {
          return new URL(value, BASE_URL).toString();
        } catch (error) {
          return null;
        }
      })
      .filter(Boolean)
  };
}

async function syncPackCache(entries = []) {
  const cache = await caches.open(PACK_CACHE);
  const desiredMap = new Map();

  for (const rawEntry of entries) {
    const entry = normaliseEntry(rawEntry);
    entry.urls.forEach((url) => {
      desiredMap.set(url, entry.revision || '');
    });
  }

  const updatedRevisions = new Map();

  for (const [url, revision] of desiredMap.entries()) {
    const prevRevision = packRevisions.get(url);
    if (typeof prevRevision !== 'undefined' && prevRevision === revision) {
      updatedRevisions.set(url, revision);
      continue;
    }
    try {
      const response = await fetch(url, { cache: 'reload', credentials: 'same-origin' });
      if (response.ok) {
        await cache.put(url, response.clone());
        updatedRevisions.set(url, revision);
        continue;
      }
    } catch (error) {
      console.warn('SW: failed to refresh pack', url, error);
    }
    if (typeof prevRevision !== 'undefined') {
      updatedRevisions.set(url, prevRevision);
    }
  }

  const cachedRequests = await cache.keys();
  await Promise.all(
    cachedRequests.map((request) => {
      if (!desiredMap.has(request.url)) {
        return cache.delete(request);
      }
      return Promise.resolve();
    })
  );

  packRevisions = updatedRevisions;
}

self.addEventListener('message', (event) => {
  const { type, entries } = event.data || {};
  if (type === 'packs:update') {
    event.waitUntil(syncPackCache(entries));
  }
});
