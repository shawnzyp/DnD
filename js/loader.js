(function () {
  'use strict';

  const MANIFEST_URL = '/packs/manifest.json';
  const DEFAULT_FILES = [
    'classes',
    'races',
    'backgrounds',
    'feats',
    'spells',
    'items',
    'companions',
    'rules',
    'skills',
    'monsters'
  ];
  const TYPE_MAP = {
    classes: 'class',
    races: 'race',
    backgrounds: 'background',
    feats: 'feat',
    spells: 'spell',
    items: 'item',
    companions: 'creature',
    rules: 'rule',
    skills: 'skill',
    monsters: 'monster'
  };

  const DB_NAME = 'dnd-packs';
  const DB_VERSION = 2;
  const PACK_STORE = 'packs';
  const USER_STORE = 'userPacks';
  const SETTINGS_STORE = 'settings';
  const PACK_SETTINGS_ID = 'pack-state';
  const PACK_STATE_STORAGE_KEY = 'quest-kit:pack-state';
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
      rules: [],
      skills: [],
      monsters: []
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
        companions: [],
        skills: [],
        monsters: []
      },
      compendium: {
        packs: [],
        spells: [],
        feats: [],
        items: [],
        rules: [],
        skills: [],
        monsters: []
      },
      loadedPacks: [],
      availablePacks: [],
      packSettings: { order: [], enabled: {} }
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

  function readLocalPackSettings() {
    if (!('localStorage' in window)) {
      return null;
    }
    try {
      const raw = window.localStorage.getItem(PACK_STATE_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return normalisePackSettings(parsed);
    } catch (error) {
      console.warn('Unable to read stored pack settings from localStorage', error);
      return null;
    }
  }

  function writeLocalPackSettings(settings) {
    if (!('localStorage' in window)) {
      return;
    }
    try {
      window.localStorage.setItem(PACK_STATE_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Unable to persist pack settings to localStorage', error);
    }
  }

  function normalisePackSettings(value) {
    const settings = { order: [], enabled: {} };
    if (!value || typeof value !== 'object') {
      return settings;
    }

    const seen = new Set();
    if (Array.isArray(value.order)) {
      value.order.forEach((id) => {
        if (typeof id !== 'string') return;
        const trimmed = id.trim();
        if (!trimmed || seen.has(trimmed)) return;
        seen.add(trimmed);
        settings.order.push(trimmed);
      });
    }

    if (value.enabled && typeof value.enabled === 'object') {
      Object.entries(value.enabled).forEach(([id, state]) => {
        if (typeof id !== 'string') return;
        const trimmed = id.trim();
        if (!trimmed) return;
        if (state === true) {
          settings.enabled[trimmed] = true;
        } else if (state === false) {
          settings.enabled[trimmed] = false;
        }
      });
    } else if (Array.isArray(value.disabled)) {
      value.disabled.forEach((id) => {
        if (typeof id !== 'string') return;
        const trimmed = id.trim();
        if (!trimmed) return;
        settings.enabled[trimmed] = false;
      });
    }

    return settings;
  }

  function arePackSettingsEqual(a, b) {
    if (!a || !b) return false;
    if (a.order.length !== b.order.length) return false;
    for (let index = 0; index < a.order.length; index += 1) {
      if (a.order[index] !== b.order[index]) {
        return false;
      }
    }
    const keysA = Object.keys(a.enabled).sort();
    const keysB = Object.keys(b.enabled).sort();
    if (keysA.length !== keysB.length) return false;
    for (let index = 0; index < keysA.length; index += 1) {
      const key = keysA[index];
      if (key !== keysB[index]) return false;
      if (a.enabled[key] !== b.enabled[key]) return false;
    }
    return true;
  }

  function buildPackOrder(definitions, storedOrder) {
    const availableIds = new Set(definitions.map((definition) => definition.id));
    const order = [];
    const seen = new Set();
    if (Array.isArray(storedOrder)) {
      storedOrder.forEach((id) => {
        if (typeof id !== 'string') return;
        const trimmed = id.trim();
        if (!trimmed || seen.has(trimmed) || !availableIds.has(trimmed)) return;
        seen.add(trimmed);
        order.push(trimmed);
      });
    }
    definitions.forEach((definition) => {
      if (seen.has(definition.id)) return;
      seen.add(definition.id);
      order.push(definition.id);
    });
    return order;
  }

  function applyPackSettings(definitions, settings) {
    const normalised = normalisePackSettings(settings);
    const clones = definitions.map((definition) => ({ ...definition }));
    clones.sort((a, b) => {
      const priorityDelta = (a.priority || 0) - (b.priority || 0);
      if (priorityDelta !== 0) return priorityDelta;
      return a.id.localeCompare(b.id, 'en', { sensitivity: 'base' });
    });

    const order = buildPackOrder(clones, normalised.order);
    const orderIndex = new Map();
    order.forEach((id, index) => {
      orderIndex.set(id, index);
    });

    clones.sort((a, b) => {
      const indexA = orderIndex.has(a.id) ? orderIndex.get(a.id) : Number.MAX_SAFE_INTEGER;
      const indexB = orderIndex.has(b.id) ? orderIndex.get(b.id) : Number.MAX_SAFE_INTEGER;
      if (indexA !== indexB) return indexA - indexB;
      const priorityDelta = (a.priority || 0) - (b.priority || 0);
      if (priorityDelta !== 0) return priorityDelta;
      return a.id.localeCompare(b.id, 'en', { sensitivity: 'base' });
    });

    const total = clones.length;
    const basePriority = 1000 + total;
    clones.forEach((definition, index) => {
      definition.priority = basePriority - index;
    });

    const filteredEnabled = {};
    Object.entries(normalised.enabled).forEach(([id, state]) => {
      if (!orderIndex.has(id)) return;
      if (state === false) {
        filteredEnabled[id] = false;
      } else if (state === true) {
        filteredEnabled[id] = true;
      }
    });

    return { definitions: clones, order, enabled: filteredEnabled };
  }

  function isPackEnabled(id, enabledMap) {
    if (!id) return true;
    if (!enabledMap || typeof enabledMap !== 'object') return true;
    if (Object.prototype.hasOwnProperty.call(enabledMap, id)) {
      return enabledMap[id] !== false;
    }
    return true;
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
          if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
            db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
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

  async function persistPackSettings(settings) {
    const normalised = normalisePackSettings(settings);
    const order = normalised.order.slice();
    const enabled = {};
    const orderSet = new Set(order);
    Object.entries(normalised.enabled).forEach(([id, state]) => {
      if (!orderSet.has(id)) return;
      if (state === false) {
        enabled[id] = false;
      } else if (state === true) {
        enabled[id] = true;
      }
    });
    const payload = { order, enabled };
    await writeEntry(SETTINGS_STORE, {
      id: PACK_SETTINGS_ID,
      value: payload,
      updatedAt: Date.now()
    });
    writeLocalPackSettings(payload);
    return payload;
  }

  async function readPackSettings() {
    const entry = await readEntry(SETTINGS_STORE, PACK_SETTINGS_ID);
    if (entry && entry.value) {
      return normalisePackSettings(entry.value);
    }
    const local = readLocalPackSettings();
    if (local) {
      return await persistPackSettings(local);
    }
    return { order: [], enabled: {} };
  }

  async function prunePackSettings(ids) {
    if (!Array.isArray(ids) || !ids.length) {
      return;
    }
    const current = await readPackSettings();
    if (!current.order.length && !Object.keys(current.enabled).length) {
      return;
    }
    const removeSet = new Set(ids);
    const nextOrder = current.order.filter((id) => !removeSet.has(id));
    const nextEnabled = {};
    Object.entries(current.enabled).forEach(([id, state]) => {
      if (!removeSet.has(id)) {
        nextEnabled[id] = state;
      }
    });
    const nextSettings = { order: nextOrder, enabled: nextEnabled };
    if (!arePackSettingsEqual(current, nextSettings)) {
      await persistPackSettings(nextSettings);
    }
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
    await prunePackSettings(definitions.map((entry) => entry.id).filter(Boolean));
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
      companions: merged.data.companions || [],
      skills: merged.data.skills || [],
      monsters: merged.data.monsters || []
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

    const combined = [...builtin, ...userDefs].map((definition) => ({ ...definition }));
    const packSettings = await readPackSettings();
    const applied = applyPackSettings(combined, packSettings);
    const orderedDefinitions = applied.definitions;
    const enabledMap = applied.enabled;
    const order = applied.order;
    const canonicalSettings = { order, enabled: enabledMap };
    if (!arePackSettingsEqual(packSettings, canonicalSettings)) {
      await persistPackSettings(canonicalSettings);
    }

    const packs = [];
    const availablePacks = [];

    for (const definition of orderedDefinitions) {
      const enabled = isPackEnabled(definition.id, enabledMap);
      const summary = {
        id: definition.id,
        name: definition.name,
        edition: definition.edition || '',
        version: definition.version || '',
        description: definition.description || '',
        license: definition.license || '',
        origin: definition.origin || null,
        url: definition.url || null,
        filename: definition.filename || null,
        addedAt: definition.addedAt || null,
        path: definition.path || '',
        files: Array.isArray(definition.files) ? definition.files.slice() : [],
        priority: Number.isFinite(definition.priority) ? definition.priority : 0,
        enabled
      };
      availablePacks.push(summary);
      if (!enabled) {
        continue;
      }
      try {
        const pack = await loadPack(definition);
        summary.files = Array.isArray(pack.files) ? pack.files.slice() : summary.files;
        summary.priority = Number.isFinite(pack.priority) ? pack.priority : summary.priority;
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
    const packSettingsDetail = {
      order: order.slice(),
      enabled: { ...enabledMap }
    };

    return {
      manifest,
      merged,
      builder,
      compendium,
      loadedPacks: packs,
      availablePacks,
      packSettings: packSettingsDetail
    };
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
      skills: detail.builder.skills,
      monsters: detail.builder.monsters,
      spells: detail.compendium.spells,
      rules: detail.compendium.rules,
      sources: detail.merged.sources,
      sourceIndex: detail.merged.sourceIndex,
      availablePacks: Array.isArray(detail.availablePacks) ? detail.availablePacks : [],
      packSettings: detail.packSettings || { order: [], enabled: {} },
      manifest: detail.manifest
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
    await prunePackSettings([id]);
    readyPromise = null;
    return ensureReady();
  }

  async function resetPacks() {
    await clearUserDefinitions();
    await persistPackSettings({ order: [], enabled: {} });
    readyPromise = null;
    return ensureReady();
  }

  async function updatePackSettings(nextSettings) {
    const current = await readPackSettings();
    const patch = normalisePackSettings(nextSettings);
    const merged = {
      order: patch.order.length ? patch.order : current.order.slice(),
      enabled: { ...current.enabled }
    };
    if (patch.order.length) {
      const orderSet = new Set(patch.order);
      Object.keys(merged.enabled).forEach((id) => {
        if (!orderSet.has(id)) {
          delete merged.enabled[id];
        }
      });
      merged.order = patch.order;
    }
    Object.entries(patch.enabled).forEach(([id, state]) => {
      if (state === false) {
        merged.enabled[id] = false;
      } else if (state === true) {
        delete merged.enabled[id];
      }
    });
    const normalised = normalisePackSettings(merged);
    if (arePackSettingsEqual(current, normalised)) {
      return ensureReady();
    }
    await persistPackSettings(normalised);
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
    getPackSettings: readPackSettings,
    updatePackSettings,
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

