(function () {
  const MANIFEST_URL = '/packs/manifest.json';
  const SERVICE_WORKER_URL = '/sw.js';
  const PACK_CACHE_MESSAGE = 'CACHE_PACKS';
  const USER_PACKS_KEY = 'dndUserPacks';
  const DEFAULT_FILES = ['classes', 'races', 'backgrounds', 'feats', 'spells', 'items', 'companions', 'rules'];
  const TYPE_MAP = {
    spells: 'spell',
    feats: 'feat',
    items: 'item',
    rules: 'rule'
  };

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL);
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      } catch (error) {
        console.warn('Service worker registration failed', error);
      }
    });
  }

  function pushPackAssetsToServiceWorker(assets) {
    if (!('serviceWorker' in navigator)) return;
    if (!Array.isArray(assets) || assets.length === 0) return;
    navigator.serviceWorker.ready
      .then((registration) => {
        const target = navigator.serviceWorker.controller || registration.active;
        if (target) {
          target.postMessage({ type: PACK_CACHE_MESSAGE, assets });
        }
      })
      .catch((error) => {
        console.warn('Unable to send pack assets to service worker', error);
      });
  }

  function safeLocalStorageGet(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn('Unable to read local storage packs', error);
      return null;
    }
  }

  function safeLocalStorageSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Unable to persist local storage packs', error);
    }
  }

  function normaliseDefinition(definition) {
    if (!definition || typeof definition !== 'object') return null;
    const normalised = {
      id: definition.id,
      name: definition.name || definition.id || 'Unknown Pack',
      edition: definition.edition || '',
      version: definition.version || '',
      description: definition.description || '',
      license: definition.license || '',
      priority: typeof definition.priority === 'number' ? definition.priority : 50,
      path: definition.path || '',
      files: Array.isArray(definition.files) && definition.files.length ? definition.files.slice() : DEFAULT_FILES.slice(),
      data: definition.data && typeof definition.data === 'object' ? definition.data : null
    };
    return normalised.id ? normalised : null;
  }

  async function fetchJSON(url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.status}`);
    }
    return response.json();
  }

  async function loadPack(definition) {
    const initialData = definition.data && typeof definition.data === 'object' ? definition.data : null;
    const pack = { ...definition, data: initialData ? { ...initialData } : {} };
    if (pack.data && Object.keys(pack.data).length) {
      return pack;
    }
    const basePath = pack.path.replace(/\/$/, '');
    await Promise.all(pack.files.map(async (file) => {
      const target = basePath ? `${basePath}/${file}.json` : `${file}.json`;
      try {
        const dataset = await fetchJSON(target);
        pack.data[file] = Array.isArray(dataset) ? dataset : [];
      } catch (error) {
        console.warn(`Missing dataset ${file} for pack ${pack.id}`, error);
        pack.data[file] = [];
      }
    }));
    return pack;
  }

  function resolvePackAssets(pack) {
    const basePath = (pack && pack.path ? pack.path : '').replace(/\/$/, '');
    if (!basePath) return [];
    const files = Array.isArray(pack.files) && pack.files.length ? pack.files : DEFAULT_FILES;
    return files.map((file) => {
      const relative = `${basePath}/${file}.json`;
      try {
        return new URL(relative, window.location.origin).toString();
      } catch (error) {
        return relative;
      }
    });
  }

  function mergeData(packs) {
    const sourceIndex = new Map();
    packs.forEach((pack) => {
      sourceIndex.set(pack.id, {
        id: pack.id,
        name: pack.name,
        edition: pack.edition,
        version: pack.version,
        description: pack.description,
        license: pack.license,
        priority: pack.priority
      });
    });

    const datasetMaps = new Map();
    packs.forEach((pack) => {
      const source = sourceIndex.get(pack.id);
      Object.entries(pack.data || {}).forEach(([key, records]) => {
        if (!Array.isArray(records)) return;
        if (!datasetMaps.has(key)) {
          datasetMaps.set(key, new Map());
        }
        const entryMap = datasetMaps.get(key);
        records.forEach((record) => {
          if (!record || typeof record !== 'object') return;
          const slug = record.slug || record.id;
          if (!slug) return;
          const cloned = { ...record, slug, sourceId: pack.id };
          if (!cloned.type && TYPE_MAP[key]) {
            cloned.type = TYPE_MAP[key];
          }
          cloned.source = source;
          entryMap.set(slug, cloned);
        });
      });
    });

    const merged = {};
    const keys = new Set([...DEFAULT_FILES, ...datasetMaps.keys()]);
    keys.forEach((key) => {
      const entryMap = datasetMaps.get(key);
      if (!entryMap) {
        merged[key] = [];
        return;
      }
      const sorted = Array.from(entryMap.values()).sort((a, b) => {
        const nameA = (a.name || a.slug || '').toString().toLowerCase();
        const nameB = (b.name || b.slug || '').toString().toLowerCase();
        return nameA.localeCompare(nameB, 'en', { sensitivity: 'base' });
      });
      merged[key] = sorted;
    });

    merged.sources = Array.from(sourceIndex.values()).sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
    merged.sourceIndex = Object.fromEntries(Array.from(sourceIndex.entries()).map(([id, meta]) => [id, meta]));
    return merged;
  }

  function describePacks(packs) {
    if (!packs || !packs.length) return 'No content packs loaded';
    return packs.map((pack) => {
      const edition = pack.edition ? ` (${pack.edition})` : '';
      return `${pack.name}${edition}`;
    }).join(', ');
  }

  async function loadAllPacks() {
    const manifest = await fetchJSON(MANIFEST_URL).catch((error) => {
      console.warn('Unable to load manifest', error);
      return { packs: [] };
    });
    const builtin = Array.isArray(manifest.packs) ? manifest.packs : [];
    const user = safeLocalStorageGet(USER_PACKS_KEY) || [];
    const definitions = [...builtin, ...user]
      .map(normaliseDefinition)
      .filter(Boolean)
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));

    const loaded = [];
    const assetSet = new Set();
    for (const definition of definitions) {
      try {
        const pack = await loadPack(definition);
        loaded.push(pack);
        resolvePackAssets(pack).forEach((asset) => asset && assetSet.add(asset));
      } catch (error) {
        console.error(`Failed to load pack ${definition.id}`, error);
        loaded.push({ ...definition, data: {} });
      }
    }

    const merged = mergeData(loaded);
    const packSummaries = loaded.map((pack) => ({
      id: pack.id,
      name: pack.name,
      edition: pack.edition,
      version: pack.version,
      description: pack.description,
      license: pack.license,
      priority: pack.priority
    }));

    return {
      manifest,
      packs: packSummaries,
      packAssets: Array.from(assetSet),
      ...merged
    };
  }

  function getUserPacks() {
    const packs = safeLocalStorageGet(USER_PACKS_KEY);
    return Array.isArray(packs) ? packs : [];
  }

  function setUserPacks(packs) {
    safeLocalStorageSet(USER_PACKS_KEY, packs);
  }

  function ensureGlobal() {
    if (!window.dndPacks) {
      window.dndPacks = {};
    }
  }

  registerServiceWorker();

  const readyPromise = loadAllPacks().catch((error) => {
    console.error('Pack loading failed', error);
    return {
      manifest: { packs: [] },
      packs: [],
      classes: [],
      races: [],
      backgrounds: [],
      feats: [],
      spells: [],
      items: [],
      companions: [],
      rules: [],
      sources: [],
      sourceIndex: {}
    };
  });

  window.dndDataReady = readyPromise.then((data) => {
    window.dndData = data;
    window.dispatchEvent(new CustomEvent('dnd-data-ready', { detail: data }));
    if (data && data.packAssets) {
      pushPackAssetsToServiceWorker(data.packAssets);
    }
    return data;
  });

  ensureGlobal();
  window.dndPacks.importPack = function importPack(pack) {
    if (!pack || typeof pack !== 'object' || !pack.id) {
      throw new Error('Pack must include an id');
    }
    const current = getUserPacks();
    const index = current.findIndex((entry) => entry.id === pack.id);
    if (index >= 0) {
      current[index] = pack;
    } else {
      current.push(pack);
    }
    setUserPacks(current);
    window.location.reload();
  };

  window.dndPacks.removeUserPack = function removeUserPack(id) {
    if (!id) return;
    const remaining = getUserPacks().filter((pack) => pack.id !== id);
    setUserPacks(remaining);
    window.location.reload();
  };

  window.dndPacks.listUserPacks = function listUserPacks() {
    return getUserPacks();
  };

  window.dndPacks.describeActive = function describeActive() {
    return describePacks(window.dndData ? window.dndData.packs : []);
  };
})();
