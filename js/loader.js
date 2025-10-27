(function () {
  'use strict';

  const MANIFEST_URL = '/packs/manifest.json';
  const DEFAULT_FILES = ['classes', 'races', 'backgrounds', 'feats', 'spells', 'items', 'companions', 'rules'];
  const TYPE_MAP = {
    classes: 'class',
    races: 'race',
    backgrounds: 'background',
    feats: 'feat',
    spells: 'spell',
    items: 'item',
    companions: 'creature',
    rules: 'rule'
  };

  const DB_NAME = 'dnd-packs';
  const DB_VERSION = 1;
  const PACK_STORE = 'packs';
  const USER_STORE = 'userPacks';
  const SERVICE_WORKER_URL = '/sw.js';

  function createEmptyData() {
    return {
      classes: [],
      races: [],
      backgrounds: [],
      feats: [],
      spells: [],
      items: [],
      companions: [],
      rules: []
    };
  }

  function createFallbackDetail() {
    const empty = createEmptyData();
    return {
      manifest: { packs: [] },
      merged: {
        data: empty,
        packSummaries: [],
        sources: [],
        sourceIndex: {}
      },
      builder: {
        packs: [],
        classes: [],
        races: [],
        backgrounds: [],
        feats: [],
        items: [],
        companions: []
      },
      compendium: {
        packs: [],
        spells: [],
        feats: [],
        items: [],
        rules: []
      },
      loadedPacks: []
    };
  }

  let dbPromise = null;
  let readyPromise = null;
  let initialised = false;
  let lastDetail = createFallbackDetail();
  const listeners = new Set();
  let serviceWorkerRegistrationStarted = false;
  let pendingPackEntries = [];

  function slugify(value) {
    return value
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function cloneData(data) {
    if (!data || typeof data !== 'object') return null;
    const clone = {};
    Object.keys(data).forEach((key) => {
      const value = data[key];
      if (Array.isArray(value)) {
        clone[key] = value.map((entry) => (entry && typeof entry === 'object' ? { ...entry } : entry));
      } else if (value && typeof value === 'object') {
        clone[key] = { ...value };
      } else {
        clone[key] = value;
      }
    });
    return clone;
  }

  function buildPackCacheEntries(loadedPacks) {
    if (!Array.isArray(loadedPacks) || !loadedPacks.length) {
      return [];
    }
    const urlMap = new Map();
    loadedPacks.forEach((pack) => {
      if (!pack || typeof pack !== 'object') return;
      const path = typeof pack.path === 'string' ? pack.path.trim() : '';
      if (!path) return;
      let base = path.endsWith('/') ? path.slice(0, -1) : path;
      if (!/^https?:/i.test(base) && !base.startsWith('/')) {
        base = `/${base}`;
      }
      if (!base) return;
      const files = Array.isArray(pack.files) ? pack.files : [];
      files.forEach((file) => {
        const clean = typeof file === 'string' ? file.replace(/\.json$/i, '').trim() : '';
        if (!clean) return;
        const url = `${base}/${clean}.json`;
        const revisionParts = [];
        if (typeof pack.version === 'string' && pack.version.trim()) {
          revisionParts.push(pack.version.trim());
        }
        if (pack.updatedAt) {
          revisionParts.push(String(pack.updatedAt));
        } else if (pack.addedAt) {
          revisionParts.push(String(pack.addedAt));
        }
        const revision = revisionParts.join(':');
        urlMap.set(url, revision);
      });
    });
    return Array.from(urlMap.entries()).map(([url, revision]) => ({ urls: [url], revision }));
  }

  function flushPackCacheUpdate() {
    if (!('serviceWorker' in navigator)) return;
    const controller = navigator.serviceWorker.controller;
    if (!controller) return;
    controller.postMessage({ type: 'packs:update', entries: pendingPackEntries });
  }

  function queuePackCacheUpdate(loadedPacks) {
    pendingPackEntries = buildPackCacheEntries(loadedPacks);
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      flushPackCacheUpdate();
    }
  }

  function registerServiceWorker() {
    if (serviceWorkerRegistrationStarted || !('serviceWorker' in navigator)) {
      return;
    }
    serviceWorkerRegistrationStarted = true;
    navigator.serviceWorker
      .register(SERVICE_WORKER_URL)
      .then(() => {
        flushPackCacheUpdate();
      })
      .catch((error) => {
        console.warn('Service worker registration failed', error);
      });
    navigator.serviceWorker.ready
      .then(() => {
        flushPackCacheUpdate();
      })
      .catch(() => {});
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      flushPackCacheUpdate();
    });
  }

  function openDatabase() {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(PACK_STORE)) {
            db.createObjectStore(PACK_STORE, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(USER_STORE)) {
            db.createObjectStore(USER_STORE, { keyPath: 'id' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          console.warn('IndexedDB unavailable for pack caching', request.error);
          resolve(null);
        };
      } catch (error) {
        console.warn('IndexedDB initialization failed', error);
        resolve(null);
      }
    });
  }

  function getDb() {
    if (dbPromise === null) {
      if (!('indexedDB' in window)) {
        dbPromise = Promise.resolve(null);
      } else {
        dbPromise = openDatabase();
      }
    }
    return dbPromise;
  }

  async function readAll(storeName) {
    const db = await getDb();
    if (!db) return [];
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  async function readEntry(storeName, key) {
    const db = await getDb();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  async function writeEntry(storeName, value) {
    const db = await getDb();
    if (!db) return;
    await new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      const store = tx.objectStore(storeName);
      store.put(value);
    });
  }

  async function deleteEntry(storeName, key) {
    const db = await getDb();
    if (!db) return;
    await new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      const store = tx.objectStore(storeName);
      store.delete(key);
    });
  }

  async function clearStore(storeName) {
    const db = await getDb();
    if (!db) return;
    await new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.objectStore(storeName).clear();
    });
  }

  async function getUserDefinitions() {
    const entries = await readAll(USER_STORE);
    return entries.map((entry) => ({
      id: entry.id,
      definition: entry.definition,
      addedAt: entry.addedAt || Date.now()
    }));
  }

  async function saveUserDefinition(definition) {
    const normalised = normalizeDefinition(definition);
    if (!normalised) {
      throw new Error('Pack definition must include an id');
    }
    const existing = await readEntry(USER_STORE, normalised.id);
    const addedAt = existing && existing.addedAt ? existing.addedAt : Date.now();
    normalised.addedAt = addedAt;
    await deleteEntry(PACK_STORE, normalised.id);
    await writeEntry(USER_STORE, { id: normalised.id, definition: normalised, addedAt });
    return normalised;
  }

  async function deleteUserDefinition(id) {
    await deleteEntry(USER_STORE, id);
    await deleteEntry(PACK_STORE, id);
  }

  async function clearUserDefinitions() {
    const definitions = await getUserDefinitions();
    await clearStore(USER_STORE);
    await Promise.all(definitions.map((entry) => deleteEntry(PACK_STORE, entry.id)));
  }

  async function getCachedPack(id) {
    const entry = await readEntry(PACK_STORE, id);
    return entry || null;
  }

  async function storePackData(pack) {
    await writeEntry(PACK_STORE, {
      id: pack.id,
      version: pack.version || '',
      priority: pack.priority || 0,
      data: pack.data,
      files: pack.files,
      name: pack.name,
      edition: pack.edition,
      license: pack.license,
      origin: pack.origin || null,
      url: pack.url || null,
      updatedAt: Date.now()
    });
  }

  function normalizeDefinition(definition) {
    if (!definition || typeof definition !== 'object') return null;
    const id = typeof definition.id === 'string' ? definition.id.trim() : '';
    if (!id) return null;
    const priority = Number(definition.priority);
    const data = definition.data && typeof definition.data === 'object' ? cloneData(definition.data) : null;
    const files = Array.isArray(definition.files) ? definition.files : [];
    const cleanedFiles = files
      .map((file) => file.toString().trim().replace(/\.json$/i, ''))
      .filter(Boolean);
    if (!cleanedFiles.length && data) {
      Object.keys(data).forEach((key) => cleanedFiles.push(key));
    }
    if (!cleanedFiles.length) {
      cleanedFiles.push(...DEFAULT_FILES);
    }
    return {
      id,
      name: typeof definition.name === 'string' && definition.name.trim() ? definition.name.trim() : id,
      edition: typeof definition.edition === 'string' ? definition.edition : '',
      version: typeof definition.version === 'string' ? definition.version : '',
      description: typeof definition.description === 'string' ? definition.description : '',
      license: typeof definition.license === 'string' ? definition.license : '',
      priority: Number.isFinite(priority) ? priority : 50,
      path: typeof definition.path === 'string' ? definition.path : '',
      files: Array.from(new Set(cleanedFiles)),
      data,
      origin: definition.origin || null,
      url: definition.url || null,
      filename: definition.filename || null,
      addedAt: definition.addedAt || null
    };
  }

  async function fetchJSON(url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.status}`);
    }
    return response.json();
  }

  async function fetchPackFiles(definition) {
    const base = definition.path ? definition.path.replace(/\/$/, '') : '';
    const data = {};
    await Promise.all(definition.files.map(async (file) => {
      const name = file.replace(/\.json$/i, '');
      const target = base ? `${base}/${name}.json` : `${name}.json`;
      try {
        const payload = await fetchJSON(target);
        data[name] = Array.isArray(payload) ? payload : [];
      } catch (error) {
        console.warn(`Unable to load ${target}`, error);
        data[name] = [];
      }
    }));
    return data;
  }

  function ensureFiles(definition, data) {
    const set = new Set(Array.isArray(definition.files) ? definition.files : []);
    Object.keys(data || {}).forEach((key) => set.add(key));
    if (!set.size) {
      DEFAULT_FILES.forEach((key) => set.add(key));
    }
    return Array.from(set);
  }

  function normaliseRecord(record, pack, key) {
    if (!record || typeof record !== 'object') return null;
    const clone = { ...record };
    let slug = '';
    if (typeof clone.slug === 'string' && clone.slug.trim()) {
      slug = clone.slug.trim();
    } else if (typeof clone.id === 'string' && clone.id.trim()) {
      slug = clone.id.trim().replace(/^.*[./]/, '');
    } else if (typeof clone.name === 'string' && clone.name.trim()) {
      slug = slugify(clone.name);
    }
    slug = slugify(slug);
    if (!slug) return null;
    clone.slug = slug;
    if (!clone.id) {
      clone.id = `${pack.id}.${slug}`;
    }
    if (!clone.name && typeof clone.title === 'string') {
      clone.name = clone.title;
    }
    if (!clone.type && TYPE_MAP[key]) {
      clone.type = TYPE_MAP[key];
    }
    clone.sourceId = pack.id;
    const source = clone.source && typeof clone.source === 'object' ? { ...clone.source } : {};
    if (!source.id) source.id = pack.id;
    if (!source.name) source.name = pack.name;
    if (!source.edition && pack.edition) source.edition = pack.edition;
    if (!source.license && pack.license) source.license = pack.license;
    clone.source = source;
    return clone;
  }

  async function loadPack(definition) {
    const cached = await getCachedPack(definition.id);
    let data = null;
    let usedCache = false;

    if (definition.data) {
      data = cloneData(definition.data);
    } else {
      try {
        data = await fetchPackFiles(definition);
      } catch (error) {
        console.warn(`Failed to fetch pack ${definition.id}`, error);
      }
      if ((!data || !Object.keys(data).length) && cached && cached.data) {
        data = cloneData(cached.data);
        usedCache = true;
      }
    }

    if (!data) {
      data = {};
    }

    const files = ensureFiles(definition, data);
    const normalisedData = {};

    files.forEach((key) => {
      const entries = Array.isArray(data[key]) ? data[key] : [];
      const normalisedEntries = [];
      entries.forEach((entry) => {
        const normalised = normaliseRecord(entry, definition, key);
        if (normalised) {
          normalisedEntries.push(normalised);
        }
      });
      normalisedData[key] = normalisedEntries;
    });

    const pack = { ...definition, data: normalisedData, files };

    if (!usedCache) {
      await storePackData(pack);
    }

    return pack;
  }

  function mergePacks(packs) {
    const datasetMaps = new Map();
    const packSummaries = [];

    packs.forEach((pack, index) => {
      const summary = {
        id: pack.id,
        name: pack.name,
        edition: pack.edition || '',
        version: pack.version || '',
        description: pack.description || '',
        license: pack.license || '',
        priority: Number.isFinite(pack.priority) ? pack.priority : 0,
        origin: pack.origin || null,
        url: pack.url || null,
        filename: pack.filename || null,
        addedAt: pack.addedAt || null
      };
      packSummaries.push(summary);

      Object.entries(pack.data || {}).forEach(([key, records]) => {
        if (!Array.isArray(records)) return;
        if (!datasetMaps.has(key)) {
          datasetMaps.set(key, new Map());
        }
        const map = datasetMaps.get(key);
        records.forEach((record) => {
          if (!record || typeof record !== 'object') return;
          const slug = record.slug;
          if (!slug) return;
          const existing = map.get(slug);
          const priority = summary.priority;
          const shouldReplace = !existing || priority > existing.priority || (priority === existing.priority && index >= existing.index);
          if (shouldReplace) {
            map.set(slug, { record: { ...record }, priority, index });
          }
        });
      });
    });

    const data = {};
    const keys = new Set([...DEFAULT_FILES, ...datasetMaps.keys()]);
    keys.forEach((key) => {
      const map = datasetMaps.get(key);
      if (!map) {
        data[key] = [];
        return;
      }
      const sorted = Array.from(map.values())
        .sort((a, b) => {
          const nameA = (a.record.name || a.record.title || a.record.slug || '').toString().toLowerCase();
          const nameB = (b.record.name || b.record.title || b.record.slug || '').toString().toLowerCase();
          return nameA.localeCompare(nameB, 'en', { sensitivity: 'base' });
        })
        .map((entry) => {
          const clone = { ...entry.record };
          delete clone.priority;
          delete clone.index;
          return clone;
        });
      data[key] = sorted;
    });

    const sources = packSummaries.slice().sort((a, b) => {
      const priorityDelta = a.priority - b.priority;
      if (priorityDelta !== 0) return priorityDelta;
      return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
    });
    const sourceIndex = {};
    sources.forEach((source) => {
      sourceIndex[source.id] = source;
    });

    return { data, packSummaries, sources, sourceIndex };
  }

  function createBuilderView(merged) {
    return {
      packs: merged.packSummaries,
      classes: merged.data.classes || [],
      races: merged.data.races || [],
      backgrounds: merged.data.backgrounds || [],
      feats: merged.data.feats || [],
      items: merged.data.items || [],
      companions: merged.data.companions || []
    };
  }

  function createCompendiumView(merged) {
    return {
      packs: merged.packSummaries,
      spells: merged.data.spells || [],
      feats: merged.data.feats || [],
      items: merged.data.items || [],
      rules: merged.data.rules || [],
      skills: merged.data.skills || [],
      monsters: merged.data.monsters || []
    };
  }

  async function fetchManifest() {
    try {
      const manifest = await fetchJSON(MANIFEST_URL);
      return manifest && typeof manifest === 'object' ? manifest : { packs: [] };
    } catch (error) {
      console.warn('Unable to load manifest', error);
      return { packs: [] };
    }
  }

  async function loadAllPacks() {
    const manifest = await fetchManifest();
    const builtin = Array.isArray(manifest.packs) ? manifest.packs.map(normalizeDefinition).filter(Boolean) : [];
    const userEntries = await getUserDefinitions();
    const userDefs = userEntries
      .map((entry) => normalizeDefinition({ ...entry.definition, addedAt: entry.addedAt }))
      .filter(Boolean);

    const definitions = [...builtin, ...userDefs].sort((a, b) => {
      const priorityDelta = (a.priority || 0) - (b.priority || 0);
      if (priorityDelta !== 0) return priorityDelta;
      return a.id.localeCompare(b.id, 'en', { sensitivity: 'base' });
    });

    const packs = [];
    for (const definition of definitions) {
      try {
        const pack = await loadPack(definition);
        packs.push(pack);
      } catch (error) {
        console.error(`Failed to load pack ${definition.id}`, error);
        if (definition.data) {
          packs.push({ ...definition });
        }
      }
    }

    const merged = mergePacks(packs);
    const builder = createBuilderView(merged);
    const compendium = createCompendiumView(merged);

    return { manifest, merged, builder, compendium, loadedPacks: packs };
  }

  function applyState(detail) {
    lastDetail = detail;
    queuePackCacheUpdate(Array.isArray(detail?.loadedPacks) ? detail.loadedPacks : []);
    window.dndData = {
      packs: detail.merged.packSummaries,
      classes: detail.builder.classes,
      races: detail.builder.races,
      backgrounds: detail.builder.backgrounds,
      feats: detail.builder.feats,
      items: detail.builder.items,
      companions: detail.builder.companions,
      spells: detail.compendium.spells,
      skills: detail.compendium.skills,
      monsters: detail.compendium.monsters,
      rules: detail.compendium.rules,
      sources: detail.merged.sources,
      sourceIndex: detail.merged.sourceIndex
    };
    if (!initialised) {
      window.dispatchEvent(new CustomEvent('dnd-data-ready', { detail }));
      initialised = true;
    }
    window.dispatchEvent(new CustomEvent('dnd-data-changed', { detail }));
    listeners.forEach((listener) => {
      try {
        listener(detail);
      } catch (error) {
        console.error('dnd pack listener failed', error);
      }
    });
  }

  async function refreshPacks() {
    try {
      const detail = await loadAllPacks();
      applyState(detail);
      return detail;
    } catch (error) {
      console.error('Pack loading failed, using fallback data', error);
      const fallback = createFallbackDetail();
      applyState(fallback);
      return fallback;
    }
  }

  function ensureReady() {
    if (!readyPromise) {
      readyPromise = refreshPacks();
    }
    return readyPromise;
  }

  function onChange(callback) {
    if (typeof callback !== 'function') {
      return () => {};
    }
    listeners.add(callback);
    if (lastDetail) {
      try {
        callback(lastDetail);
      } catch (error) {
        console.error('dnd pack listener failed', error);
      }
    }
    return () => {
      listeners.delete(callback);
    };
  }

  function extractDefinitions(payload) {
    if (!payload || typeof payload !== 'object') return [];
    if (Array.isArray(payload.packs)) {
      return payload.packs.map(normalizeDefinition).filter(Boolean);
    }
    const single = normalizeDefinition(payload);
    return single ? [single] : [];
  }

  async function importPackFile(file) {
    if (!file) {
      throw new Error('No pack file provided');
    }
    const text = await file.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch (error) {
      throw new Error('Pack file is not valid JSON');
    }
    const definitions = extractDefinitions(payload).map((definition) => ({
      ...definition,
      origin: 'file',
      filename: file.name
    }));
    if (!definitions.length) {
      throw new Error('No pack definitions found in file');
    }
    for (const definition of definitions) {
      await saveUserDefinition(definition);
    }
    readyPromise = null;
    return ensureReady();
  }

  async function importPackFromUrl(url) {
    if (!url) {
      throw new Error('No URL provided');
    }
    const trimmed = url.trim();
    const response = await fetch(trimmed, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch pack: ${response.status}`);
    }
    const payload = await response.json();
    const definitions = extractDefinitions(payload).map((definition) => ({
      ...definition,
      origin: 'url',
      url: trimmed
    }));
    if (!definitions.length) {
      throw new Error('No pack definitions found at URL');
    }
    for (const definition of definitions) {
      await saveUserDefinition(definition);
    }
    readyPromise = null;
    return ensureReady();
  }

  async function listUserPacks() {
    const entries = await getUserDefinitions();
    return entries
      .map((entry) => {
        const definition = entry.definition || {};
        return {
          id: definition.id,
          name: definition.name || definition.id,
          version: definition.version || '',
          origin: definition.origin || null,
          url: definition.url || null,
          filename: definition.filename || null,
          addedAt: entry.addedAt || Date.now()
        };
      })
      .sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
  }

  async function removeUserPack(id) {
    if (!id) return ensureReady();
    await deleteUserDefinition(id);
    readyPromise = null;
    return ensureReady();
  }

  async function resetPacks() {
    await clearUserDefinitions();
    readyPromise = null;
    return ensureReady();
  }

  const api = {
    ready: ensureReady,
    getBuilderData: async () => (await ensureReady()).builder,
    getCompendiumData: async () => (await ensureReady()).compendium,
    getMergedData: async () => (await ensureReady()).merged,
    importPackFile,
    importPackFromUrl,
    listUserPacks,
    removeUserPack,
    resetPacks,
    reload: async () => {
      readyPromise = null;
      return ensureReady();
    },
    onChange
  };

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', registerServiceWorker, { once: true });
  }

  const ready = ensureReady();
  window.dnd = api;
  window.dndDataReady = ready.then(() => window.dndData);
})();

