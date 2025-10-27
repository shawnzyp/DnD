import { summariseValidationIssues } from '../js/pack-validation.js';

const STORAGE_KEY = 'dndBuilderState';
const COACHMARK_KEY = 'dndBuilderCoachMarksSeen';
const QUICK_ADD_KEY = 'dndBuilderQuickAddQueue';
const HISTORY_LIMIT = 50;
const SHARE_QUERY_PARAM = 'share';
const SHARE_VERSION = 1;

const abilityFields = [
  { id: 'str', label: 'Strength' },
  { id: 'dex', label: 'Dexterity' },
  { id: 'con', label: 'Constitution' },
  { id: 'int', label: 'Intelligence' },
  { id: 'wis', label: 'Wisdom' },
  { id: 'cha', label: 'Charisma' }
];

const abilityNameIndex = abilityFields.reduce((map, field) => {
  map[field.label.toLowerCase()] = field.id;
  map[field.id] = field.id;
  map[field.label.slice(0, 3).toLowerCase()] = field.id;
  return map;
}, {});

const abilityLabelIndex = abilityFields.reduce((map, field) => {
  map[field.id] = field.label;
  map[field.label.toLowerCase()] = field.label;
  return map;
}, {});

const MAX_CHARACTER_LEVEL = 20;

const SPELLCASTING_CLASS_SLUGS = new Set([
  'artificer',
  'bard',
  'cleric',
  'druid',
  'paladin',
  'ranger',
  'sorcerer',
  'warlock',
  'wizard'
]);

const FEAT_LEVEL_THRESHOLDS = [4, 8, 12, 16, 19];

const CLASS_FEAT_BONUS_LEVELS = {
  fighter: [6, 14],
  rogue: [10]
};

function calculateProficiencyBonus(level) {
  if (!Number.isFinite(level) || level <= 0) return 2;
  const bounded = Math.min(Math.max(1, level), MAX_CHARACTER_LEVEL);
  return 2 + Math.floor((bounded - 1) / 4);
}

function parseJsonValue(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  const firstChar = trimmed[0];
  const lastChar = trimmed[trimmed.length - 1];
  if ((firstChar === '{' && lastChar === '}') || (firstChar === '[' && lastChar === ']')) {
    try {
      return JSON.parse(trimmed);
    } catch (error) {
      return value;
    }
  }
  return value;
}

function sanitizeClassEntry(value, fallbackLevel = 1) {
  let raw = value;
  if (raw === undefined) {
    return { class: '', level: fallbackLevel };
  }
  raw = parseJsonValue(raw);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const identifier = raw.class || raw.slug || raw.id || raw.value || raw.name || '';
    const label = raw.name || raw.label || raw.title || '';
    const rawLevel = raw.level ?? raw.levels ?? raw.count ?? raw.total ?? fallbackLevel;
    const parsedLevel = Number.parseInt(rawLevel, 10);
    const level = Number.isFinite(parsedLevel) && parsedLevel > 0 ? parsedLevel : fallbackLevel;
    return {
      class: identifier ? String(identifier) : '',
      level,
      name: label ? String(label) : undefined
    };
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return { class: '', level: fallbackLevel };
    }
    const match = trimmed.match(/^([^|:]+)[|:](\d+)(?:[|:](.+))?$/);
    if (match) {
      const level = Number.parseInt(match[2], 10);
      const label = match[3] ? match[3].trim() : '';
      return {
        class: match[1].trim(),
        level: Number.isFinite(level) && level > 0 ? level : fallbackLevel,
        name: label || undefined
      };
    }
    return { class: trimmed, level: fallbackLevel };
  }
  if (Array.isArray(raw)) {
    const first = raw[0];
    return sanitizeClassEntry(first, fallbackLevel);
  }
  return { class: '', level: fallbackLevel };
}

function normalizeClassEntries(data) {
  const entries = [];
  const source = [];
  if (Array.isArray(data?.classes)) {
    source.push(...data.classes);
  }
  if (!source.length && Array.isArray(data?.classesJson)) {
    source.push(...data.classesJson);
  }
  if (!source.length && data && (data.class || data.level)) {
    source.push({ class: data.class || '', level: data.level });
  }
  if (!source.length) {
    const totalLevel = Number.parseInt(data?.level, 10);
    source.push({ class: '', level: Number.isFinite(totalLevel) && totalLevel > 0 ? totalLevel : 1 });
  }
  source.forEach((value) => {
    const normalized = sanitizeClassEntry(value, 1);
    if (!normalized) return;
    let level = Number.parseInt(normalized.level, 10);
    if (!Number.isFinite(level) || level < 1) {
      level = 1;
    }
    normalized.level = Math.min(level, MAX_CHARACTER_LEVEL);
    entries.push(normalized);
  });
  if (!entries.length) {
    entries.push({ class: '', level: 1 });
  }
  return entries;
}

function classIsSpellcaster(meta) {
  if (!meta) return false;
  if (meta.spellcasting || meta.hasSpellcasting) return true;
  if (Array.isArray(meta.tags) && meta.tags.some((tag) => /spellcasting/i.test(tag))) {
    return true;
  }
  const slug = String(meta.slug || meta.id || meta.class || '').toLowerCase();
  if (SPELLCASTING_CLASS_SLUGS.has(slug)) {
    return true;
  }
  if (typeof meta.summary === 'string' && /spellcaster|spellcasting/i.test(meta.summary)) {
    return true;
  }
  return false;
}

const EQUIPMENT_CATEGORIES = [
  { key: 'weapons', field: 'equipmentWeapons', datalist: 'weapon-options', legacy: 'weapons', label: 'Weapons', empty: 'No weapons selected.' },
  { key: 'armor', field: 'equipmentArmor', datalist: 'armor-options', legacy: 'armor', label: 'Armor & Shields', empty: 'No armor selected.' },
  { key: 'gear', field: 'equipmentGear', datalist: 'gear-options', legacy: 'gear', label: 'Adventuring Gear', empty: 'No gear tracked yet.' },
  { key: 'attunements', field: 'equipmentAttunements', datalist: 'attunement-options', legacy: null, label: 'Attunements', empty: 'No attuned items.' }
];

const ATTUNEMENT_LIMIT = 3;

const steps = Array.from(document.querySelectorAll('section.step'));
const form = document.getElementById('builder-form');
const indicator = document.getElementById('step-indicator');
const progressNav = document.getElementById('step-progress');
const progressItems = progressNav ? Array.from(progressNav.querySelectorAll('[data-step-item]')) : [];
const progressBar = document.getElementById('step-progressbar');
const prevBtn = document.getElementById('prev-step');
const nextBtn = document.getElementById('next-step');
const summaryToggle = document.getElementById('toggle-summary');
const coachmarkOverlay = document.getElementById('coachmark-overlay');
const undoBtn = document.getElementById('builder-undo');
const redoBtn = document.getElementById('builder-redo');
const exportStateBtn = document.getElementById('builder-export-state');
const importStateBtn = document.getElementById('builder-import-state');
const stateFileInput = document.getElementById('builder-state-file');
const packStatusNode = document.getElementById('builder-pack-status');

let currentStep = 0;
let packStatusPermanent = '';
let packStatusTimer = null;

function createBaseState() {
  return {
    data: { classes: [], feats: [], featSelections: [], featBonusSlots: '0' },
    completedSteps: [],
    saveCount: 1,
    updatedAt: Date.now(),
    derived: { abilities: {} },
    currentStepIndex: 0,
    currentStep: steps[0] ? steps[0].dataset.step : null
  };
}

let state = createBaseState();

const history = {
  entries: [],
  index: -1,
  push(snapshot) {
    this.entries = this.entries.slice(0, this.index + 1);
    this.entries.push(cloneState(snapshot));
    if (this.entries.length > HISTORY_LIMIT) {
      const overflow = this.entries.length - HISTORY_LIMIT;
      this.entries = this.entries.slice(overflow);
    }
    this.index = this.entries.length - 1;
  },
  reset(snapshot) {
    this.entries = snapshot ? [cloneState(snapshot)] : [];
    this.index = this.entries.length - 1;
  },
  canUndo() {
    return this.index > 0;
  },
  canRedo() {
    return this.index >= 0 && this.index < this.entries.length - 1;
  },
  undo() {
    if (!this.canUndo()) return null;
    this.index -= 1;
    return cloneState(this.entries[this.index]);
  },
  redo() {
    if (!this.canRedo()) return null;
    this.index += 1;
    return cloneState(this.entries[this.index]);
  },
  current() {
    if (this.index < 0) return null;
    return cloneState(this.entries[this.index]);
  }
};

const stepModules = new Map();

let packData = {
  packs: [],
  classes: [],
  races: [],
  backgrounds: [],
  feats: [],
  items: [],
  companions: [],
  monsters: []
};

function cloneState(value) {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch (error) {
      // fall back to JSON method below
    }
  }
  return JSON.parse(JSON.stringify(value));
}

function utf8EncodeString(input) {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(input);
  }
  const escaped = unescape(encodeURIComponent(input));
  const result = new Uint8Array(escaped.length);
  for (let i = 0; i < escaped.length; i += 1) {
    result[i] = escaped.charCodeAt(i);
  }
  return result;
}

function base64UrlEncode(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError('Expected Uint8Array for base64 encoding.');
  }
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  const base64 = window.btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(encoded) {
  if (typeof encoded !== 'string') {
    throw new TypeError('Expected string for base64 decoding.');
  }
  const sanitized = encoded.replace(/[^A-Za-z0-9\-_]/g, '');
  const padding = (4 - (sanitized.length % 4)) % 4;
  const base64 = sanitized.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padding);
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function lzwCompress(input) {
  const dictionary = new Map();
  for (let i = 0; i < 256; i += 1) {
    dictionary.set(String.fromCharCode(i), i);
  }
  let dictSize = 256;
  let w = '';
  const result = [];
  for (let i = 0; i < input.length; i += 1) {
    const c = input[i];
    const wc = w + c;
    if (dictionary.has(wc)) {
      w = wc;
    } else {
      result.push(dictionary.get(w));
      if (dictSize < 65535) {
        dictionary.set(wc, dictSize);
        dictSize += 1;
      }
      w = c;
    }
  }
  if (w) {
    result.push(dictionary.get(w));
  }
  return result;
}

function lzwDecompress(codes) {
  if (!codes.length) return '';
  const dictionary = new Map();
  for (let i = 0; i < 256; i += 1) {
    dictionary.set(i, String.fromCharCode(i));
  }
  let dictSize = 256;
  let w = dictionary.get(codes[0]);
  if (typeof w !== 'string') {
    throw new Error('Invalid LZW data.');
  }
  let result = w;
  for (let i = 1; i < codes.length; i += 1) {
    const k = codes[i];
    let entry;
    if (dictionary.has(k)) {
      entry = dictionary.get(k);
    } else if (k === dictSize) {
      entry = w + w[0];
    } else {
      throw new Error('Corrupt LZW sequence.');
    }
    result += entry;
    if (dictSize < 65535) {
      dictionary.set(dictSize, w + entry[0]);
      dictSize += 1;
    }
    w = entry;
  }
  return result;
}

function packCodesToBytes(codes) {
  const bytes = new Uint8Array(codes.length * 2);
  for (let i = 0; i < codes.length; i += 1) {
    const value = codes[i];
    bytes[i * 2] = (value >> 8) & 0xff;
    bytes[i * 2 + 1] = value & 0xff;
  }
  return bytes;
}

function unpackBytesToCodes(bytes) {
  if (bytes.length % 2 !== 0) {
    throw new Error('Invalid packed LZW payload.');
  }
  const codes = new Array(bytes.length / 2);
  for (let i = 0; i < codes.length; i += 1) {
    codes[i] = (bytes[i * 2] << 8) | bytes[i * 2 + 1];
  }
  return codes;
}

function formatByteSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  const precision = unitIndex === 0 ? 0 : size >= 10 ? 1 : 2;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
}

function createShareSnapshot(currentState = state) {
  const baseState = currentState || state || createBaseState();
  const snapshotData = baseState.data ? cloneState(baseState.data) : serializeForm();
  const completedSteps = Array.isArray(baseState.completedSteps)
    ? baseState.completedSteps.filter((step) => typeof step === 'string')
    : [];
  const currentIndex = Number.isFinite(baseState.currentStepIndex)
    ? Math.max(0, Math.min(baseState.currentStepIndex, steps.length - 1))
    : 0;
  const currentId = typeof baseState.currentStep === 'string' && baseState.currentStep
    ? baseState.currentStep
    : steps[currentIndex]?.dataset.step || null;
  const updatedAt = Number.isFinite(baseState.updatedAt) ? baseState.updatedAt : Date.now();
  const saveCount = Number.isFinite(baseState.saveCount) ? baseState.saveCount : 1;
  const name = snapshotData?.name ? String(snapshotData.name).trim() : '';
  const className = snapshotData?.class ? String(snapshotData.class).trim() : '';
  const level = snapshotData?.level ? String(snapshotData.level).trim() : '';
  return {
    v: SHARE_VERSION,
    d: snapshotData,
    s: completedSteps,
    i: currentIndex,
    c: currentId,
    u: updatedAt,
    n: saveCount,
    m: {
      name,
      class: className,
      level
    }
  };
}

function encodeShareSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error('Invalid snapshot for sharing.');
  }
  const json = JSON.stringify(snapshot);
  const rawBytes = utf8EncodeString(json).length;
  const compressedCodes = lzwCompress(json);
  const compressedBytes = packCodesToBytes(compressedCodes);
  const encoded = base64UrlEncode(compressedBytes);
  return {
    encoded,
    rawBytes,
    compressedBytes: compressedBytes.length
  };
}

function decodeShareSnapshot(encoded) {
  const bytes = base64UrlDecode(encoded);
  const codes = unpackBytesToCodes(bytes);
  const json = lzwDecompress(codes);
  const parsed = JSON.parse(json);
  if (!parsed || typeof parsed !== 'object' || parsed.v !== SHARE_VERSION) {
    throw new Error('Unsupported share payload.');
  }
  if (!parsed.d || typeof parsed.d !== 'object') {
    throw new Error('Shared payload is missing character data.');
  }
  const completedSteps = Array.isArray(parsed.s)
    ? parsed.s.filter((step) => typeof step === 'string')
    : [];
  const currentStepIndex = Number.isFinite(parsed.i)
    ? Math.max(0, Math.min(parsed.i, steps.length - 1))
    : 0;
  const currentStepId = typeof parsed.c === 'string' ? parsed.c : null;
  const updatedAt = Number.isFinite(parsed.u) ? parsed.u : Date.now();
  const saveCount = Number.isFinite(parsed.n) ? parsed.n : 1;
  return {
    state: {
      data: parsed.d,
      completedSteps,
      currentStepIndex,
      currentStep: currentStepId,
      updatedAt,
      saveCount
    },
    meta: parsed.m && typeof parsed.m === 'object' ? parsed.m : {}
  };
}

function computeShareInfo(currentState = state) {
  const snapshot = createShareSnapshot(currentState);
  const { encoded, rawBytes, compressedBytes } = encodeShareSnapshot(snapshot);
  return {
    snapshot,
    encoded,
    rawBytes,
    compressedBytes,
    meta: snapshot.m || {}
  };
}

function buildShareUrl(encoded) {
  const url = new URL(window.location.href);
  url.searchParams.set(SHARE_QUERY_PARAM, encoded);
  return url.toString();
}

async function copyTextToClipboard(text) {
  if (!text) return false;
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn('navigator.clipboard.writeText failed', error);
    }
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  let success = false;
  try {
    success = document.execCommand('copy');
  } catch (error) {
    console.warn('document.execCommand copy failed', error);
  }
  document.body.removeChild(textarea);
  return success;
}

function sanitizeForHistory(value) {
  return {
    data: value.data,
    completedSteps: value.completedSteps,
    currentStepIndex: value.currentStepIndex,
    currentStep: value.currentStep,
    derived: value.derived
  };
}

function statesEqual(a, b) {
  return JSON.stringify(sanitizeForHistory(a)) === JSON.stringify(sanitizeForHistory(b));
}

function notifyModules(hook, ...args) {
  stepModules.forEach((module) => {
    const handler = module && module[hook];
    if (typeof handler === 'function') {
      handler(...args);
    }
  });
}

function setPackData(data) {
  packData = {
    packs: Array.isArray(data?.packs) ? data.packs : [],
    classes: Array.isArray(data?.classes) ? data.classes : [],
    races: Array.isArray(data?.races) ? data.races : [],
    backgrounds: Array.isArray(data?.backgrounds) ? data.backgrounds : [],
    feats: Array.isArray(data?.feats) ? data.feats : [],
    items: Array.isArray(data?.items) ? data.items : [],
    companions: Array.isArray(data?.companions) ? data.companions : [],
    monsters: Array.isArray(data?.monsters) ? data.monsters : []
  };
  window.dndBuilderData = packData;
}

function getPackData() {
  return packData;
}

function setPackStatus(message) {
  if (!packStatusNode) return;
  if (packStatusTimer) {
    window.clearTimeout(packStatusTimer);
    packStatusTimer = null;
  }
  packStatusPermanent = message || '';
  packStatusNode.textContent = packStatusPermanent;
}

function flashPackStatus(message, duration = 4000) {
  if (!packStatusNode) return;
  if (packStatusTimer) {
    window.clearTimeout(packStatusTimer);
    packStatusTimer = null;
  }
  packStatusNode.textContent = message || '';
  if (duration > 0) {
    packStatusTimer = window.setTimeout(() => {
      packStatusTimer = null;
      packStatusNode.textContent = packStatusPermanent;
    }, duration);
  }
}

function setBaselinePackStatus(message) {
  packStatusPermanent = message || '';
  if (packStatusTimer) {
    return;
  }
  if (packStatusNode) {
    packStatusNode.textContent = packStatusPermanent;
  }
}

function updatePackStatusFromDetail(detail) {
  const packs = Array.isArray(detail?.availablePacks) ? detail.availablePacks : [];
  const summary = summariseValidationIssues(packs);
  if (summary.message) {
    setBaselinePackStatus(summary.message);
  } else {
    setBaselinePackStatus('');
  }
}

function abilityNameToId(name) {
  if (!name) return null;
  const key = String(name).toLowerCase();
  return abilityNameIndex[key] || null;
}

function findEntry(list, value) {
  if (!Array.isArray(list) || !value) return null;
  const target = String(value).toLowerCase();
  return list.find((entry) => {
    const slug = entry.slug ? String(entry.slug).toLowerCase() : null;
    const id = entry.id ? String(entry.id).toLowerCase() : null;
    const name = entry.name ? String(entry.name).toLowerCase() : null;
    return slug === target || id === target || name === target || entry.name === value;
  }) || null;
}

function loadQuickAddQueue() {
  try {
    const raw = localStorage.getItem(QUICK_ADD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to read builder quick-add queue', error);
    return [];
  }
}

function persistQuickAddQueue(queue) {
  try {
    const payload = Array.isArray(queue) ? queue : [];
    localStorage.setItem(QUICK_ADD_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Failed to persist builder quick-add queue', error);
  }
}

function formatList(values, { conjunction = 'and' } = {}) {
  const entries = Array.isArray(values)
    ? values.filter((value) => value || value === 0).map((value) => String(value))
    : [];
  if (!entries.length) return '';
  if (entries.length === 1) return entries[0];
  if (entries.length === 2) {
    return `${entries[0]} ${conjunction} ${entries[1]}`;
  }
  const head = entries.slice(0, -1).join(', ');
  const tail = entries[entries.length - 1];
  return `${head}, ${conjunction} ${tail}`;
}

function slugifyLoose(value) {
  if (!value && value !== 0) return '';
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getEquipmentRecordKey(entry) {
  if (!entry) return '';
  if (entry.slug) return String(entry.slug);
  if (entry.id) return String(entry.id);
  if (entry.name) return `custom-${slugifyLoose(entry.name)}`;
  return '';
}

function parseEquipmentList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      // fall back to comma/semicolon separated parsing
    }
    return trimmed
      .split(/[,;\n]+/)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((name) => ({ name, custom: true }));
  }
  return [];
}

function normalizeEquipmentEntry(entry) {
  if (!entry) return null;
  if (typeof entry === 'string') {
    const name = entry.trim();
    if (!name) return null;
    return { slug: null, id: null, name, quantity: 1, custom: true, notes: '' };
  }
  if (typeof entry === 'object') {
    const slug = typeof entry.slug === 'string' && entry.slug ? entry.slug : null;
    const id = typeof entry.id === 'string' && entry.id ? entry.id : null;
    const nameValue = typeof entry.name === 'string' && entry.name ? entry.name.trim() : '';
    const baseName = nameValue || slug || id;
    if (!baseName) return null;
    const quantityValue = Number.parseInt(entry.quantity, 10);
    const quantity = Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 1;
    const notes = typeof entry.notes === 'string' ? entry.notes : '';
    const custom = entry.custom === true || (!slug && !id);
    return {
      slug,
      id,
      name: baseName,
      quantity,
      custom,
      notes
    };
  }
  return null;
}

function mergeEquipmentEntries(entries) {
  if (!Array.isArray(entries)) return [];
  const map = new Map();
  entries.forEach((raw) => {
    const normalized = normalizeEquipmentEntry(raw);
    if (!normalized) return;
    const key = getEquipmentRecordKey(normalized);
    if (!key) return;
    if (map.has(key)) {
      const existing = map.get(key);
      existing.quantity += normalized.quantity;
      if (!existing.slug && normalized.slug) existing.slug = normalized.slug;
      if (!existing.id && normalized.id) existing.id = normalized.id;
      if (!existing.name && normalized.name) existing.name = normalized.name;
      if (!existing.notes && normalized.notes) existing.notes = normalized.notes;
      existing.custom = existing.custom && normalized.custom;
    } else {
      map.set(key, { ...normalized });
    }
  });
  return Array.from(map.values());
}

function resolveEquipmentItem(entry) {
  if (!entry) return null;
  const items = (getPackData().items || []);
  if (!items.length) return null;
  const candidates = [entry.slug, entry.id, entry.name];
  for (const candidate of candidates) {
    const item = findEntry(items, candidate);
    if (item) return item;
  }
  return null;
}

function itemRequiresAttunement(item) {
  if (!item) return false;
  if (typeof item.requires_attunement === 'boolean') return item.requires_attunement;
  if (typeof item.requires_attunement === 'string') {
    return item.requires_attunement.toLowerCase() !== 'no';
  }
  if (item.attunement === true) return true;
  if (typeof item.attunement === 'string') {
    return item.attunement.toLowerCase() !== 'no';
  }
  const text = `${item.summary || ''} ${item.description || ''}`.toLowerCase();
  return text.includes('requires attunement');
}

function getEquipmentRecordsFromFormData(formData) {
  const records = {};
  EQUIPMENT_CATEGORIES.forEach(({ key, field, legacy }) => {
    const raw = formData ? formData[field] : null;
    let entries = parseEquipmentList(raw);
    if (!entries.length && legacy && formData && formData[legacy]) {
      entries = parseEquipmentList(formData[legacy]);
    }
    records[key] = mergeEquipmentEntries(entries);
  });
  return records;
}

function getClassProficiencies(formData) {
  const classes = Array.isArray(formData?.classes) ? formData.classes : normalizeClassEntries(formData || {});
  const weaponProfs = new Set();
  const armorProfs = new Set();
  const entries = [];
  classes.forEach((cls) => {
    const identifier = cls?.class || cls?.slug || cls?.id || cls;
    if (!identifier) return;
    const entry = findEntry(getPackData().classes || [], identifier);
    if (!entry) return;
    entries.push(entry);
    if (Array.isArray(entry.weapon_proficiencies)) {
      entry.weapon_proficiencies.forEach((value) => {
        if (!value) return;
        weaponProfs.add(String(value).toLowerCase());
      });
    }
    if (Array.isArray(entry.armor_proficiencies)) {
      entry.armor_proficiencies.forEach((value) => {
        if (!value) return;
        armorProfs.add(String(value).toLowerCase());
      });
    }
  });
  return { entries, weaponProfs, armorProfs };
}

function assessWeaponProficiency(item, weaponProfs) {
  if (!item) return true;
  if (!weaponProfs || !weaponProfs.size) return true;
  const name = String(item.name || '').toLowerCase();
  const category = String(item.category || '').toLowerCase();
  if (weaponProfs.has(name)) return true;
  if (category.includes('simple') && weaponProfs.has('simple weapons')) return true;
  if (category.includes('martial') && weaponProfs.has('martial weapons')) return true;
  if (category.includes('melee') && weaponProfs.has('melee weapons')) return true;
  if (category.includes('ranged') && weaponProfs.has('ranged weapons')) return true;
  for (const prof of weaponProfs) {
    if (!prof) continue;
    if (name.includes(prof) || category.includes(prof)) {
      return true;
    }
  }
  return false;
}

function assessArmorProficiency(item, armorProfs) {
  if (!item) return true;
  if (!armorProfs || !armorProfs.size) return true;
  const name = String(item.name || '').toLowerCase();
  const category = String(item.category || '').toLowerCase();
  if (armorProfs.has(name)) return true;
  if (armorProfs.has('all armor') && category.includes('armor')) return true;
  if (category.includes('light') && armorProfs.has('light armor')) return true;
  if (category.includes('medium') && armorProfs.has('medium armor')) return true;
  if (category.includes('heavy') && armorProfs.has('heavy armor')) return true;
  if ((category.includes('shield') || name.includes('shield')) && armorProfs.has('shields')) return true;
  for (const prof of armorProfs) {
    if (!prof) continue;
    if (name.includes(prof) || category.includes(prof)) {
      return true;
    }
  }
  return false;
}

function formatWeight(value) {
  if (!Number.isFinite(value)) return '0 lb';
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded.toFixed(0)} lb` : `${rounded.toFixed(1)} lb`;
}

function computeEquipmentDerived(formData, abilityDerived = {}) {
  const derived = {
    groups: { weapons: [], armor: [], gear: [], attunements: [] },
    proficiency: { weaponMismatches: [], armorMismatches: [] },
    attunement: { count: 0, limit: ATTUNEMENT_LIMIT, exceeded: false },
    encumbrance: { totalWeight: 0, capacity: 0, ratio: 0, nearLimit: false, overLimit: false }
  };
  if (!formData) {
    return derived;
  }
  const records = getEquipmentRecordsFromFormData(formData);
  const { weaponProfs, armorProfs } = getClassProficiencies(formData);
  EQUIPMENT_CATEGORIES.forEach(({ key }) => {
    const list = records[key] || [];
    list.forEach((record) => {
      const keyId = getEquipmentRecordKey(record);
      if (!keyId) return;
      const item = resolveEquipmentItem(record);
      const quantity = Number.isFinite(record.quantity) ? record.quantity : 1;
      const baseWeight = Number.isFinite(Number(item?.weight)) ? Number(item.weight) : 0;
      const totalWeight = Number.parseFloat((baseWeight * quantity).toFixed(2));
      let proficient = true;
      if (key === 'weapons') {
        proficient = assessWeaponProficiency(item, weaponProfs);
        if (!proficient) {
          derived.proficiency.weaponMismatches.push(record.name || item?.name || keyId);
        }
      } else if (key === 'armor') {
        proficient = assessArmorProficiency(item, armorProfs);
        if (!proficient) {
          derived.proficiency.armorMismatches.push(record.name || item?.name || keyId);
        }
      }
      derived.groups[key].push({
        key: keyId,
        slug: record.slug || null,
        id: record.id || null,
        name: record.name || item?.name || keyId || 'Item',
        quantity,
        custom: Boolean(record.custom && !item),
        notes: record.notes || '',
        category: item?.category || '',
        weightEach: baseWeight ? Number.parseFloat(baseWeight.toFixed(2)) : 0,
        totalWeight,
        proficient,
        source: item?.source?.name || null,
        requiresAttunement: itemRequiresAttunement(item)
      });
      derived.encumbrance.totalWeight += totalWeight;
    });
  });

  const attunements = derived.groups.attunements;
  let attunedCount = 0;
  attunements.forEach((entry) => {
    const quantity = Number.isFinite(entry.quantity) ? entry.quantity : 1;
    attunedCount += Math.max(1, quantity);
  });
  derived.attunement.count = attunedCount;
  derived.attunement.limit = ATTUNEMENT_LIMIT;
  derived.attunement.exceeded = attunedCount > ATTUNEMENT_LIMIT;

  derived.encumbrance.totalWeight = Number.parseFloat(derived.encumbrance.totalWeight.toFixed(2));
  const strengthScore = abilityDerived?.str?.total ?? Number.parseInt(formData?.str, 10);
  const strength = Number.isFinite(strengthScore) ? strengthScore : 10;
  const capacity = Math.max(0, strength * 15);
  derived.encumbrance.capacity = capacity;
  derived.encumbrance.ratio = capacity > 0 ? derived.encumbrance.totalWeight / capacity : 0;
  derived.encumbrance.overLimit = capacity > 0 && derived.encumbrance.totalWeight > capacity;
  derived.encumbrance.nearLimit = capacity > 0 && !derived.encumbrance.overLimit && derived.encumbrance.totalWeight > capacity * 0.75;

  return derived;
}

function computeClassDerived(formData) {
  const derived = {
    entries: [],
    totalLevel: 0,
    proficiencyBonus: 2,
    hitDice: {},
    primary: null,
    spellcastingCount: 0
  };
  if (!formData) {
    return derived;
  }
  const classes = Array.isArray(formData.classes) ? formData.classes : normalizeClassEntries(formData);
  const packClasses = getPackData().classes || [];
  classes.forEach((cls, index) => {
    const identifier = cls?.class || cls?.slug || cls?.id || cls;
    const rawLevel = cls?.level;
    const parsedLevel = Number.parseInt(rawLevel, 10);
    const level = Number.isFinite(parsedLevel) && parsedLevel > 0 ? parsedLevel : 1;
    const meta = identifier ? findEntry(packClasses, identifier) : null;
    const hitDie = meta?.hit_die || cls?.hit_die || null;
    const entry = {
      index,
      class: identifier ? String(identifier) : '',
      level,
      name: meta?.name || cls?.name || (identifier ? String(identifier) : `Class ${index + 1}`),
      slug: meta?.slug || '',
      id: meta?.id || '',
      hitDie,
      source: meta?.source?.name || null,
      spellcasting: classIsSpellcaster(meta),
      meta: meta ? { slug: meta.slug || null, id: meta.id || null } : null
    };
    derived.entries.push(entry);
    derived.totalLevel += level;
    if (hitDie) {
      const key = String(hitDie);
      derived.hitDice[key] = (derived.hitDice[key] || 0) + level;
    }
    if (entry.spellcasting) {
      derived.spellcastingCount += 1;
    }
  });
  derived.primary = derived.entries[0] || null;
  derived.proficiencyBonus = calculateProficiencyBonus(derived.totalLevel);
  return derived;
}

function formatModifier(score) {
  if (!Number.isFinite(score)) return '+0';
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

const ABILITY_INCREASE_KEYS = [
  'ability_score_increase',
  'ability_score_increases',
  'ability_score_improvement',
  'ability_score_improvements',
  'ability_score_bonus',
  'ability_score_bonuses',
  'ability_bonus',
  'ability_bonuses',
  'ability_modifiers',
  'ability_mods',
  'ability_increase',
  'ability_increases',
  'ability_boosts',
  'ability_score_boosts',
  'ability_adjustments',
  'asi',
  'asis'
];

function normalizeAbilityIncreaseContainer(container) {
  if (!container) return [];
  if (Array.isArray(container)) {
    return container.flatMap((entry) => normalizeAbilityIncreaseContainer(entry));
  }
  if (typeof container === 'object') {
    const results = [];
    const abilityKey = container.ability || container.stat || container.ability_score || container.name;
    const amountValue = container.value ?? container.amount ?? container.bonus ?? container.modifier ?? container.score ?? container.increment;
    if (abilityKey && Number.isFinite(Number(amountValue))) {
      results.push({ ability: abilityKey, value: Number(amountValue) });
    }
    Object.entries(container).forEach(([key, value]) => {
      if (['ability', 'ability_score', 'stat', 'name', 'value', 'amount', 'bonus', 'modifier', 'score', 'increment', 'type', 'description', 'text', 'notes'].includes(key)) {
        if ((key === 'value' || key === 'amount' || key === 'bonus' || key === 'modifier' || key === 'score' || key === 'increment') && typeof value === 'object') {
          results.push(...normalizeAbilityIncreaseContainer(value));
        }
        return;
      }
      if (Number.isFinite(value)) {
        results.push({ ability: key, value: Number(value) });
        return;
      }
      if (typeof value === 'string' || typeof value === 'object') {
        results.push(...normalizeAbilityIncreaseContainer(value));
      }
    });
    return results;
  }
  if (typeof container === 'string') {
    const abilityMatch = container.match(/(strength|dexterity|constitution|intelligence|wisdom|charisma)/i);
    const valueMatch = container.match(/([+-]?\d+)/);
    if (abilityMatch && valueMatch) {
      return [{ ability: abilityMatch[1], value: Number(valueMatch[1]) }];
    }
  }
  return [];
}

function collectAbilityIncreases(entry) {
  if (!entry || typeof entry !== 'object') return [];
  const containers = [];
  ABILITY_INCREASE_KEYS.forEach((key) => {
    if (entry[key]) {
      containers.push(entry[key]);
    }
  });
  if (Array.isArray(entry.advancements)) {
    entry.advancements.forEach((advancement) => {
      if (!advancement || typeof advancement !== 'object') return;
      ABILITY_INCREASE_KEYS.forEach((key) => {
        if (advancement[key]) {
          containers.push(advancement[key]);
        }
      });
      if (advancement.type && /ability/i.test(String(advancement.type))) {
        containers.push(advancement);
      }
    });
  }
  return containers.flatMap((value) => normalizeAbilityIncreaseContainer(value));
}

function applyAbilityEntryBonuses(map, entry, label) {
  if (!entry) return;
  const increases = collectAbilityIncreases(entry);
  increases.forEach(({ ability, value }) => {
    const amount = Number(value);
    const id = abilityNameToId(ability);
    if (!id || !Number.isFinite(amount) || amount === 0) return;
    if (!map[id]) {
      map[id] = { total: 0, sources: [] };
    }
    map[id].total += amount;
    map[id].sources.push({ label, value: amount });
  });
}

function parseFeatList(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((entry) => entry && typeof entry === 'string').map((entry) => entry.trim()).filter(Boolean);
  }
  return String(value)
    .split(/[,;\n]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function canonicalizeFeatKey(value) {
  if (value === null || value === undefined) return '';
  const raw = typeof value === 'string' ? value : String(value);
  const target = raw.trim();
  if (!target) return '';
  const lower = target.toLowerCase();
  const feats = getPackData().feats || [];
  for (const feat of feats) {
    if (!feat) continue;
    const slug = feat.slug ? String(feat.slug).toLowerCase() : null;
    const id = feat.id ? String(feat.id).toLowerCase() : null;
    const name = feat.name ? String(feat.name).toLowerCase() : null;
    if (lower === slug || lower === id || lower === name) {
      return feat.slug || feat.id || feat.name || target;
    }
  }
  return target;
}

function normalizeFeatSelections(source) {
  const selections = new Set();

  function addValue(raw) {
    if (raw === null || raw === undefined) return;
    if (Array.isArray(raw)) {
      raw.forEach((entry) => addValue(entry));
      return;
    }
    if (typeof raw === 'object') {
      const candidate = raw.key || raw.slug || raw.id || raw.value || raw.name || raw.label;
      if (candidate) {
        addValue(String(candidate));
      }
      return;
    }
    const parsed = typeof raw === 'string' ? parseJsonValue(raw) : raw;
    if (Array.isArray(parsed)) {
      parsed.forEach((entry) => addValue(entry));
      return;
    }
    if (typeof parsed === 'string') {
      const trimmed = parsed.trim();
      if (!trimmed) return;
      if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
        addValue(parseJsonValue(trimmed));
        return;
      }
      if (/[;,\n]/.test(trimmed)) {
        parseFeatList(trimmed).forEach((entry) => addValue(entry));
        return;
      }
      selections.add(trimmed);
      return;
    }
    if (Number.isFinite(parsed)) {
      selections.add(String(parsed));
    }
  }

  addValue(source && typeof source === 'object' ? source.feats : source);
  if (source && typeof source === 'object') {
    if (source.signatureFeat) {
      addValue(source.signatureFeat);
    }
    if (source.bonusFeats) {
      parseFeatList(source.bonusFeats).forEach((entry) => addValue(entry));
    }
  }

  return Array.from(selections)
    .map((entry) => canonicalizeFeatKey(entry))
    .map((entry) => String(entry).trim())
    .filter(Boolean);
}

function sanitizeFeatSelectionState(records) {
  if (!Array.isArray(records)) return [];
  const feats = getPackData().feats || [];
  return records
    .map((record) => {
      if (record === null || record === undefined) return null;
      if (typeof record === 'string') {
        const key = canonicalizeFeatKey(record);
        if (!key) return null;
        const feat = findEntry(feats, key);
        const prerequisites = Array.isArray(feat?.prerequisites)
          ? feat.prerequisites.map((value) => String(value).trim()).filter(Boolean)
          : [];
        const sourceLabel =
          typeof feat?.source === 'string'
            ? feat.source
            : feat?.source?.name || '';
        return {
          key,
          name: feat?.name || key,
          source: sourceLabel,
          summary: feat?.summary || '',
          prerequisites,
          locked: false,
          checks: []
        };
      }
      if (typeof record === 'object') {
        const candidate =
          record.key || record.slug || record.id || record.value || record.name || record.label;
        const key = canonicalizeFeatKey(candidate);
        if (!key) return null;
        const feat = findEntry(feats, key);
        const prerequisites = Array.isArray(record.prerequisites)
          ? record.prerequisites.map((value) => String(value).trim()).filter(Boolean)
          : Array.isArray(feat?.prerequisites)
          ? feat.prerequisites.map((value) => String(value).trim()).filter(Boolean)
          : [];
        const checks = Array.isArray(record.checks)
          ? record.checks
              .map((check) => {
                if (!check) return null;
                const label = String(check.label || '').trim();
                if (!label) return null;
                return {
                  label,
                  satisfied: Boolean(check.satisfied),
                  unknown: Boolean(check.unknown)
                };
              })
              .filter(Boolean)
          : [];
        const sourceLabel =
          record.source ||
          (typeof feat?.source === 'string'
            ? feat.source
            : feat?.source?.name || '');
        const summary = record.summary || feat?.summary || '';
        return {
          key,
          name: record.name || feat?.name || key,
          source: sourceLabel,
          summary,
          prerequisites,
          locked: Boolean(record.locked),
          checks
        };
      }
      return null;
    })
    .filter(Boolean);
}

function computeAbilityBonuses(formData) {
  const bonuses = {};
  abilityFields.forEach((field) => {
    bonuses[field.id] = { total: 0, sources: [] };
  });
  const raceValue = typeof formData?.race === 'string' ? formData.race.trim() : formData?.race;
  const raceEntry = findEntry(packData.races || [], raceValue);
  if (raceEntry) {
    applyAbilityEntryBonuses(bonuses, raceEntry, raceEntry.name || 'Race');
  }
  const backgroundValue = typeof formData?.background === 'string' ? formData.background.trim() : formData?.background;
  const backgroundEntry = findEntry(packData.backgrounds || [], backgroundValue);
  if (backgroundEntry) {
    applyAbilityEntryBonuses(bonuses, backgroundEntry, backgroundEntry.name || 'Background');
  }
  const featNames = normalizeFeatSelections(formData);
  const seenFeatIds = new Set();
  featNames.forEach((identifier) => {
    const featKey = typeof identifier === 'string' ? identifier.trim() : identifier;
    if (!featKey) return;
    const featEntry = findEntry(packData.feats || [], featKey);
    if (!featEntry) return;
    const unique = featEntry.slug || featEntry.id || featEntry.name || featKey;
    if (unique && seenFeatIds.has(unique)) return;
    if (unique) {
      seenFeatIds.add(unique);
    }
    applyAbilityEntryBonuses(bonuses, featEntry, featEntry.name || 'Feat');
  });
  return bonuses;
}

function computeDerivedState(formData) {
  const derived = { abilities: {} };
  const bonuses = computeAbilityBonuses(formData);
  abilityFields.forEach((field) => {
    const baseValue = Number.parseInt(formData?.[field.id], 10);
    const base = Number.isFinite(baseValue) ? baseValue : 10;
    const bonus = bonuses[field.id]?.total || 0;
    const sources = bonuses[field.id]?.sources || [];
    const total = base + bonus;
    derived.abilities[field.id] = {
      base,
      bonus,
      total,
      sources: sources.map((entry) => ({
        label: entry.label || 'Bonus',
        value: entry.value
      }))
    };
  });
  derived.classes = computeClassDerived(formData);
  derived.equipment = computeEquipmentDerived(formData, derived.abilities);
  derived.proficiencyBonus = derived.classes?.proficiencyBonus || calculateProficiencyBonus(Number.parseInt(formData?.level, 10));
  derived.hitDice = derived.classes?.hitDice || {};
  return derived;
}
function updateProgressIndicator() {
  if (!progressItems.length) return;
  progressItems.forEach((item, index) => {
    const stepId = item.dataset.step;
    const isActive = index === currentStep;
    item.setAttribute('aria-current', isActive ? 'step' : 'false');
    item.classList.toggle('complete', state.completedSteps.includes(stepId));
  });
  if (progressBar) {
    progressBar.setAttribute('aria-valuenow', String(currentStep + 1));
    const title = steps[currentStep]?.querySelector('h2')?.textContent || '';
    progressBar.setAttribute('aria-valuetext', title);
  }
}

function updateHistoryControls() {
  if (undoBtn) {
    undoBtn.disabled = !history.canUndo();
  }
  if (redoBtn) {
    redoBtn.disabled = !history.canRedo();
  }
}

function pushHistorySnapshot(value) {
  const snapshot = cloneState(value);
  const current = history.current();
  if (current && statesEqual(current, snapshot)) {
    updateHistoryControls();
    return;
  }
  history.push(snapshot);
  updateHistoryControls();
}

function resetHistory(snapshot) {
  history.reset(snapshot ? cloneState(snapshot) : null);
  updateHistoryControls();
}

function applySnapshot(snapshot) {
  if (!snapshot) return;
  hydrateForm(snapshot);
  persistState({ skipSerialization: true, skipHistory: true });
  updateHistoryControls();
}

function populateSelectOptions(select, entries, placeholderText) {
  if (!select) return;
  const previousValue = select.value;
  select.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = placeholderText;
  select.appendChild(placeholder);
  entries.forEach((entry) => {
    const option = document.createElement('option');
    option.value = entry.slug || entry.id || entry.name;
    option.textContent = entry.name || entry.title || option.value;
    if (entry.source && entry.source.name) {
      option.dataset.source = entry.source.name;
    }
    select.appendChild(option);
  });
  if (previousValue && entries.some((entry) => (entry.slug || entry.id || entry.name) === previousValue || entry.name === previousValue)) {
    select.value = previousValue;
  }
}

function populateDatalist(id, entries, formatter) {
  const list = document.getElementById(id);
  if (!list) return;
  list.innerHTML = '';
  entries.forEach((entry) => {
    const option = document.createElement('option');
    const label = formatter ? formatter(entry) : (entry.name || entry.title || entry.slug);
    option.value = entry.name || entry.title || entry.slug;
    if (label && label !== option.value) {
      option.label = label;
    }
    list.appendChild(option);
  });
}

function updatePackMeta() {
  const target = document.getElementById('builder-pack-meta');
  if (!target) return;
  const { packs = [] } = getPackData();
  if (!packs.length) {
    target.textContent = 'No licensed content packs loaded.';
    return;
  }
  const summary = packs.map((pack) => {
    const edition = pack.edition ? ` · ${pack.edition}` : '';
    const license = pack.license ? ` • ${pack.license}` : '';
    return `${pack.name}${edition}${license}`;
  }).join(' | ');
  target.textContent = `Loaded packs: ${summary}`;
}

function populateDynamicOptions() {
  const data = getPackData();
  if (form && form.elements) {
    const raceField = form.elements.namedItem('race');
    populateSelectOptions(raceField, data.races || [], 'Choose a race');
  }
  populateDatalist('background-options', data.backgrounds || []);
  populateDatalist('item-options', data.items || [], (entry) => {
    const category = entry.category ? ` (${entry.category})` : '';
    return `${entry.name}${category}`;
  });
  updatePackMeta();
  if (state && state.data) {
    state.derived = computeDerivedState(state.data);
    window.dndBuilderState = state;
  }
  notifyModules('onPackData', data);
  if (quickAddManager && typeof quickAddManager.onPackData === 'function') {
    quickAddManager.onPackData();
  }
  if (state && state.data) {
    window.dispatchEvent(new CustomEvent('dnd-builder-updated', { detail: state }));
    window.dispatchEvent(new CustomEvent('dnd-state-changed'));
  }
}

async function hydratePackData() {
  let detail = null;
  if (window.dnd && typeof window.dnd.getBuilderData === 'function') {
    try {
      const data = await window.dnd.getBuilderData();
      setPackData(data);
      if (typeof window.dnd.ready === 'function') {
        detail = await window.dnd.ready();
      }
    } catch (error) {
      console.warn('Failed to load builder packs', error);
      const fallback = window.dndBuilderData || window.dndData || packData;
      setPackData(fallback);
      if (!detail && (window.dndData || fallback)) {
        detail = window.dndData || { availablePacks: [] };
      }
    }
  } else if (window.dndData) {
    setPackData(window.dndData);
    detail = window.dndData;
  }
  populateDynamicOptions();
  if (detail) {
    updatePackStatusFromDetail(detail);
  } else if (window.dnd && typeof window.dnd.ready === 'function') {
    try {
      const readyDetail = await window.dnd.ready();
      updatePackStatusFromDetail(readyDetail);
    } catch (error) {
      console.warn('Failed to read pack validation status', error);
    }
  }
}

function subscribeToPackChanges() {
  if (window.dnd && typeof window.dnd.onChange === 'function') {
    window.dnd.onChange((detail) => {
      if (detail && detail.builder) {
        setPackData(detail.builder);
        populateDynamicOptions();
        updatePackStatusFromDetail(detail);
      }
    });
  } else {
    window.addEventListener('dnd-data-changed', () => {
      const fallback = window.dndBuilderData || window.dndData || packData;
      setPackData(fallback);
      populateDynamicOptions();
      const detail = window.dndData ? { availablePacks: window.dndData.availablePacks || [] } : null;
      if (detail) {
        updatePackStatusFromDetail(detail);
      }
    });
  }
}

function wirePackControls() {
  const fileInput = document.getElementById('builder-pack-file');
  const importFileButton = document.getElementById('builder-import-file');
  const importUrlButton = document.getElementById('builder-import-url');
  const reloadButton = document.getElementById('builder-reload-packs');

  if (importFileButton && fileInput) {
    importFileButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (event) => {
      const [file] = event.target.files || [];
      if (!file || !window.dnd || typeof window.dnd.importPackFile !== 'function') {
        setPackStatus('Pack loader unavailable.');
        return;
      }
      setPackStatus(`Importing ${file.name}…`);
      try {
        const detail = await window.dnd.importPackFile(file);
        updatePackStatusFromDetail(detail);
        const packs = Array.isArray(detail?.availablePacks) ? detail.availablePacks : [];
        const scoped = packs.filter((pack) => pack && pack.origin === 'file' && pack.filename === file.name);
        const scopedSummary = summariseValidationIssues(scoped);
        const overallSummary = summariseValidationIssues(packs);
        if (scopedSummary.hasErrors || scopedSummary.hasWarnings) {
          const message = scopedSummary.message || overallSummary.message || 'Imported pack requires attention.';
          flashPackStatus(message, 6000);
        } else if (!overallSummary.hasErrors && !overallSummary.hasWarnings) {
          flashPackStatus(`Imported ${file.name}`, 4000);
        }
      } catch (error) {
        console.error('Failed to import pack', error);
        setPackStatus('Import failed. Check console for details.');
      } finally {
        fileInput.value = '';
      }
    });
  }

  if (importUrlButton) {
    importUrlButton.addEventListener('click', async () => {
      if (!window.dnd || typeof window.dnd.importPackFromUrl !== 'function') {
        setPackStatus('Pack loader unavailable.');
        return;
      }
      const url = window.prompt('Enter the URL of a pack manifest JSON file:');
      if (!url) return;
      const trimmed = url.trim();
      if (!trimmed) return;
      setPackStatus('Fetching pack…');
      try {
        const detail = await window.dnd.importPackFromUrl(trimmed);
        updatePackStatusFromDetail(detail);
        const packs = Array.isArray(detail?.availablePacks) ? detail.availablePacks : [];
        const scoped = packs.filter((pack) => pack && pack.origin === 'url' && pack.url === trimmed);
        const scopedSummary = summariseValidationIssues(scoped);
        const overallSummary = summariseValidationIssues(packs);
        if (scopedSummary.hasErrors || scopedSummary.hasWarnings) {
          const message = scopedSummary.message || overallSummary.message || 'Imported pack requires attention.';
          flashPackStatus(message, 6000);
        } else if (!overallSummary.hasErrors && !overallSummary.hasWarnings) {
          flashPackStatus('Pack added from URL.', 4000);
        }
      } catch (error) {
        console.error('Failed to import pack from URL', error);
        setPackStatus('Import failed. Check console for details.');
      }
    });
  }

  if (reloadButton) {
    reloadButton.addEventListener('click', async () => {
      if (!window.dnd || typeof window.dnd.reload !== 'function') {
        setPackStatus('Pack loader unavailable.');
        return;
      }
      setPackStatus('Reloading packs…');
      try {
        const detail = await window.dnd.reload();
        updatePackStatusFromDetail(detail);
        const summary = summariseValidationIssues(Array.isArray(detail?.availablePacks) ? detail.availablePacks : []);
        if (!summary.hasErrors && !summary.hasWarnings) {
          flashPackStatus('Packs reloaded.', 3000);
        }
      } catch (error) {
        console.error('Failed to reload packs', error);
        setPackStatus('Reload failed.');
      }
    });
  }
}

function serializeForm() {
  const formData = new FormData(form);
  const data = {};
  const arrayFields = new Map();
  for (const [key, value] of formData.entries()) {
    if (key.endsWith('[]')) {
      const base = key.slice(0, -2);
      if (!arrayFields.has(base)) {
        arrayFields.set(base, []);
      }
      arrayFields.get(base).push(value);
    } else {
      data[key] = key === 'feats' ? parseJsonValue(value) : value;
    }
  }
  arrayFields.forEach((values, key) => {
    data[key] = values.map((entry) => parseJsonValue(entry));
  });
  const normalizedClasses = normalizeClassEntries(data);
  const packClasses = getPackData().classes || [];
  const classes = normalizedClasses.map((entry, index) => {
    const meta = entry.class ? findEntry(packClasses, entry.class) : null;
    const label = meta?.name || entry.name || entry.class || `Class ${index + 1}`;
    return {
      class: entry.class || '',
      level: entry.level,
      name: label
    };
  });
  data.classes = classes;
  const derivedClasses = computeClassDerived({ ...data, classes });
  const totalLevel = derivedClasses.totalLevel || classes.reduce((sum, entry) => {
    const parsed = Number.parseInt(entry.level, 10);
    return sum + (Number.isFinite(parsed) ? parsed : 0);
  }, 0);
  const boundedTotal = Math.max(1, totalLevel || 1);
  data.level = String(boundedTotal);
  if (classes.length) {
    const primary = classes[0];
    data.class = primary.class || primary.name || '';
  } else {
    data.class = data.class || '';
  }
  const proficiency = Number.isFinite(derivedClasses.proficiencyBonus)
    ? derivedClasses.proficiencyBonus
    : calculateProficiencyBonus(totalLevel);
  data.proficiencyBonus = String(proficiency);
  data.hitDice = derivedClasses.hitDice || {};
  const featSelectionRecords = Array.isArray(data.feats)
    ? sanitizeFeatSelectionState(data.feats)
    : [];
  data.featSelections = featSelectionRecords.map((entry) => ({
    ...entry,
    checks: Array.isArray(entry.checks)
      ? entry.checks.map((check) => ({ ...check }))
      : []
  }));
  data.feats = normalizeFeatSelections({ feats: featSelectionRecords });
  if (familiarModule && typeof familiarModule.getValue === 'function') {
    const familiarState = familiarModule.getValue();
    if (familiarState) {
      data.familiar = familiarState;
      data.familiarName = familiarState.name || data.familiarName || '';
      data.familiarNotes = familiarState.notes || data.familiarNotes || '';
    }
  }
  if (typeof data.familiarData !== 'undefined') {
    delete data.familiarData;
  }
  return data;
}

async function readIndexedDB(key) {
  if (!('indexedDB' in window)) return null;
  return new Promise((resolve) => {
    const open = indexedDB.open('dndApp', 1);
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains('state')) {
        db.createObjectStore('state');
      }
    };
    open.onerror = () => resolve(null);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction('state', 'readonly');
      const store = tx.objectStore('state');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    };
  });
}

function writeIndexedDB(key, value) {
  if (!('indexedDB' in window)) return Promise.resolve();
  return new Promise((resolve) => {
    const open = indexedDB.open('dndApp', 1);
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains('state')) {
        db.createObjectStore('state');
      }
    };
    open.onerror = () => resolve();
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction('state', 'readwrite');
      const store = tx.objectStore('state');
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    };
  });
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('localStorage write failed', err);
  }
}

function markStepCompleted(stepId) {
  if (!stepId) return;
  if (!state.completedSteps.includes(stepId)) {
    state.completedSteps.push(stepId);
  }
}

async function persistState(options = {}) {
  const {
    skipSerialization = false,
    skipHistory = false,
    skipDispatch = false,
    markCompleted = true,
    preserveTimestamp = false
  } = options;

  if (!skipSerialization) {
    state.data = serializeForm();
  }

  const stepId = steps[currentStep]?.dataset.step || null;
  if (markCompleted && stepId) {
    markStepCompleted(stepId);
  }

  state.currentStepIndex = currentStep;
  state.currentStep = stepId;
  state.derived = computeDerivedState(state.data);
  if (!preserveTimestamp) {
    state.updatedAt = Date.now();
  }

  writeLocal(STORAGE_KEY, state);
  await writeIndexedDB(STORAGE_KEY, state);

  if (!skipHistory) {
    pushHistorySnapshot(state);
  } else {
    updateHistoryControls();
  }

  if (!skipDispatch) {
    window.dndBuilderState = state;
    window.dispatchEvent(new CustomEvent('dnd-builder-updated', { detail: state }));
    window.dispatchEvent(new CustomEvent('dnd-state-changed'));
  }

  updateProgressIndicator();
  notifyModules('onStatePersisted', state);
}

function hydrateForm(data) {
  if (!data) return;
  const merged = createBaseState();
  const incoming = cloneState(data);
  merged.data = { ...merged.data, ...(incoming.data || incoming) };
  const normalizedClasses = normalizeClassEntries(merged.data);
  const packClasses = getPackData().classes || [];
  merged.data.classes = normalizedClasses.map((entry, index) => {
    const meta = entry.class ? findEntry(packClasses, entry.class) : null;
    const label = meta?.name || entry.name || entry.class || `Class ${index + 1}`;
    return {
      class: entry.class || '',
      level: entry.level,
      name: label
    };
  });
  const derivedClasses = computeClassDerived({ ...merged.data, classes: merged.data.classes });
  const totalLevel = derivedClasses.totalLevel || merged.data.classes.reduce((sum, entry) => {
    const parsed = Number.parseInt(entry.level, 10);
    return sum + (Number.isFinite(parsed) ? parsed : 0);
  }, 0);
  merged.data.level = String(Math.max(1, totalLevel || Number.parseInt(merged.data.level, 10) || 1));
  if (merged.data.classes.length) {
    const primary = merged.data.classes[0];
    merged.data.class = primary.class || primary.name || merged.data.class || '';
  } else {
    merged.data.class = merged.data.class || '';
  }
  const proficiency = Number.isFinite(derivedClasses.proficiencyBonus)
    ? derivedClasses.proficiencyBonus
    : calculateProficiencyBonus(totalLevel);
  merged.data.proficiencyBonus = String(proficiency);
  merged.data.hitDice = derivedClasses.hitDice || {};
  merged.completedSteps = Array.isArray(incoming.completedSteps) ? [...incoming.completedSteps] : [];
  merged.saveCount = Number.isFinite(incoming.saveCount) ? incoming.saveCount : merged.saveCount;
  merged.updatedAt = incoming.updatedAt || merged.updatedAt;
  if (Number.isFinite(incoming.currentStepIndex)) {
    merged.currentStepIndex = Math.min(Math.max(0, incoming.currentStepIndex), steps.length - 1);
  }
  merged.currentStep = incoming.currentStep || (steps[merged.currentStepIndex] ? steps[merged.currentStepIndex].dataset.step : merged.currentStep);
  merged.derived = computeDerivedState(merged.data);
  state = merged;
  const canonicalFeats = normalizeFeatSelections(state.data);
  const hasStructuredSelections =
    Array.isArray(state.data.featSelections) && state.data.featSelections.length > 0;
  const sanitizedSelections = hasStructuredSelections
    ? sanitizeFeatSelectionState(state.data.featSelections)
    : sanitizeFeatSelectionState(canonicalFeats);
  const selectionKeys = sanitizedSelections.map((entry) => entry.key);
  const canonical = Array.from(new Set([...canonicalFeats, ...selectionKeys]));
  state.data.feats = canonical;
  state.data.featSelections = sanitizedSelections
    .filter((entry) => canonical.includes(entry.key))
    .map((entry) => ({
      ...entry,
      checks: Array.isArray(entry.checks)
        ? entry.checks.map((check) => ({ ...check }))
        : []
    }));
  const bonusSlotsValue = Number.parseInt(state.data.featBonusSlots, 10);
  state.data.featBonusSlots = Number.isFinite(bonusSlotsValue) && bonusSlotsValue >= 0 ? String(bonusSlotsValue) : '0';

  Object.entries(state.data).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (!field) return;
    if (field instanceof RadioNodeList) {
      Array.from(field).forEach((radio) => {
        radio.checked = radio.value === value;
      });
    } else {
      if (key === 'feats') {
        const payload = Array.isArray(state.data.featSelections)
          ? state.data.featSelections
          : [];
        field.value = JSON.stringify(payload);
      } else if (key === 'featBonusSlots') {
        const numeric = Number.parseInt(value, 10);
        field.value = Number.isFinite(numeric) && numeric >= 0 ? String(numeric) : '0';
      } else {
        field.value = value;
      }
    }
  });

  currentStep = state.currentStepIndex || 0;
  notifyModules('onStateHydrated', state);
  updateProgressIndicator();
}

async function loadState() {
  let stored = null;
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    stored = local ? JSON.parse(local) : null;
  } catch (err) {
    console.warn('localStorage parse failed', err);
  }
  if (!stored) {
    stored = await readIndexedDB(STORAGE_KEY);
  }
  let hydrated = false;
  let url;
  try {
    url = new URL(window.location.href);
  } catch (error) {
    url = null;
  }
  const shareParam = url ? url.searchParams.get(SHARE_QUERY_PARAM) : null;
  if (shareParam) {
    try {
      const decoded = decodeShareSnapshot(shareParam);
      if (decoded && decoded.state) {
        const meta = decoded.meta || {};
        const hasExisting = Boolean(stored);
        const subjectParts = [];
        if (meta.name) subjectParts.push(`"${meta.name}"`);
        if (meta.class) {
          const levelDisplay = meta.level ? `Level ${meta.level}` : '';
          const classDisplay = levelDisplay ? `${levelDisplay} ${meta.class}` : meta.class;
          subjectParts.push(classDisplay.trim());
        }
        const subject = subjectParts.length ? subjectParts.join(' · ') : 'the shared character';
        const consentMessage = hasExisting
          ? `Load ${subject} from this link and replace your current progress?`
          : `Load ${subject} from this link?`;
        const approved = window.confirm(consentMessage);
        if (approved) {
          hydrateForm(decoded.state);
          hydrated = true;
          stored = decoded.state;
          writeLocal(STORAGE_KEY, state);
          await writeIndexedDB(STORAGE_KEY, state);
        }
      }
    } catch (error) {
      console.error('Failed to load shared builder state', error);
      window.alert('Sorry, this share link is invalid or has been corrupted.');
    }
    if (url) {
      url.searchParams.delete(SHARE_QUERY_PARAM);
      const clean = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(null, '', clean);
    }
  }
  if (!hydrated) {
    if (stored) {
      hydrateForm(stored);
    } else {
      state = createBaseState();
      state.data = serializeForm();
      state.derived = computeDerivedState(state.data);
    }
  }
  window.dndBuilderState = state;
  window.dispatchEvent(new CustomEvent('dnd-builder-updated', { detail: state }));
  resetHistory(state);
}

function renderStep(index) {
  steps.forEach((step, i) => {
    step.classList.toggle('active', i === index);
  });
  const stepElement = steps[index];
  const title = stepElement?.querySelector('h2')?.textContent || `Step ${index + 1}`;
  if (indicator) {
    indicator.textContent = `Step ${index + 1} of ${steps.length} · ${title}`;
  }
  if (progressBar) {
    progressBar.setAttribute('aria-valuenow', String(index + 1));
    progressBar.setAttribute('aria-valuetext', title);
  }
  prevBtn.disabled = index === 0;
  nextBtn.textContent = index === steps.length - 1 ? 'Finish' : 'Next';
  updateProgressIndicator();
  notifyModules('onStepChange', {
    index,
    id: stepElement?.dataset.step || '',
    element: stepElement,
    title
  });
}

function goToStep(index, { skipPersist = false } = {}) {
  if (index < 0 || index >= steps.length) return;
  currentStep = index;
  state.currentStepIndex = index;
  state.currentStep = steps[index]?.dataset.step || null;
  renderStep(index);
  if (!skipPersist) {
    persistState({
      skipSerialization: true,
      skipHistory: true,
      markCompleted: false,
      preserveTimestamp: true,
      skipDispatch: true
    });
  }
}

async function nextStep() {
  await persistState();
  if (currentStep < steps.length - 1) {
    goToStep(currentStep + 1);
  } else {
    const finalizeStep = document.querySelector('[data-step="finalize"]');
    if (finalizeStep) {
      finalizeStep.scrollIntoView({ behavior: 'smooth' });
    }
    nextBtn.disabled = true;
    nextBtn.textContent = 'Saved';
    setTimeout(() => {
      nextBtn.disabled = false;
      nextBtn.textContent = 'Finish';
    }, 1600);
  }
}

function prevStep() {
  if (currentStep === 0) return;
  goToStep(currentStep - 1);
}

function handleInput() {
  state.saveCount += 1;
  persistState();
}

function exportBuilderState() {
  persistState().then(() => {
    const payload = cloneState(state);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const name = state.data.name || 'character';
    link.href = url;
    link.download = `${name.replace(/\s+/g, '-').toLowerCase()}-builder.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

function triggerBuilderImport() {
  if (stateFileInput) {
    stateFileInput.click();
  }
}

function handleUndo() {
  const snapshot = history.undo();
  if (!snapshot) return;
  applySnapshot(snapshot);
}

function handleRedo() {
  const snapshot = history.redo();
  if (!snapshot) return;
  applySnapshot(snapshot);
}

if (stateFileInput) {
  stateFileInput.addEventListener('change', async (event) => {
    const [file] = event.target.files || [];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid builder export file.');
      }
      hydrateForm(parsed);
      resetHistory(state);
      await persistState({ skipSerialization: true, skipHistory: true });
    } catch (error) {
      console.error('Failed to import builder state', error);
      window.alert('Import failed. Please verify the JSON file and try again.');
    } finally {
      stateFileInput.value = '';
    }
  });
}
const identityModule = (() => {
  let summaryNode = null;
  let raceSelect = null;

  function render(data) {
    if (!summaryNode) return;
    const raceValue = data?.race || (raceSelect ? raceSelect.value : '');
    if (!raceValue) {
      summaryNode.textContent = 'Choose a race to see ability score bonuses.';
      summaryNode.dataset.state = '';
      return;
    }
    const raceEntry = findEntry(getPackData().races || [], raceValue);
    const derived = computeDerivedState(data);
    const parts = abilityFields.map((field) => {
      const bonus = derived.abilities[field.id]?.bonus || 0;
      if (!bonus) return null;
      return `${field.label} ${bonus >= 0 ? '+' : ''}${bonus}`;
    }).filter(Boolean);
    if (!raceEntry) {
      summaryNode.textContent = parts.length ? `Bonuses: ${parts.join(', ')}` : 'No ability bonuses applied.';
      summaryNode.dataset.state = 'warn';
      return;
    }
    summaryNode.textContent = parts.length ? `${raceEntry.name}: ${parts.join(', ')}` : `${raceEntry.name}: No ability bonuses`;
    summaryNode.dataset.state = parts.length ? 'ok' : '';
  }

  return {
    setup(section) {
      summaryNode = section.querySelector('[data-race-summary]');
      raceSelect = section.querySelector('select[name="race"]');
      render(state.data);
    },
    onPackData() {
      render(state.data);
    },
    onStateHydrated(currentState) {
      render(currentState?.data || state.data);
    },
    onFormChange(event) {
      if (event.target && event.target.name === 'race') {
        render(serializeForm());
      }
    }
  };
})();

const classModule = (() => {
  let summaryNode = null;
  let summaryTextNode = null;
  let summaryWarningsNode = null;
  let rowsContainer = null;
  let addButton = null;
  let warningsNode = null;
  let totalDisplay = null;
  let totalField = null;
  let activeStep = false;
  let nextLocked = false;
  const rows = [];
  let pendingAutoBalance = null;
  let autoBalanceMessage = '';

  function setSummaryText(message) {
    const target = summaryTextNode || summaryNode;
    if (!target) return;
    target.textContent = message;
  }

  function updateSummaryWarningsList(warnings) {
    if (!summaryWarningsNode) return;
    summaryWarningsNode.innerHTML = '';
    if (!Array.isArray(warnings) || !warnings.length) {
      summaryWarningsNode.hidden = true;
      return;
    }
    summaryWarningsNode.hidden = false;
    warnings.forEach((warning) => {
      if (!warning?.message) return;
      const item = document.createElement('li');
      item.textContent = warning.message;
      if (warning.severity) {
        item.dataset.state = warning.severity;
      }
      summaryWarningsNode.appendChild(item);
    });
  }

  function extractRowWarnings(allWarnings) {
    if (!Array.isArray(allWarnings)) return [];
    return allWarnings.filter((warning) => {
      const message = typeof warning?.message === 'string' ? warning.message.trim() : '';
      if (!message) return false;
      if (/^Class\s+\d+/i.test(message)) return true;
      if (message.includes(':')) return true;
      if (message.toLowerCase().includes('requires')) return true;
      return false;
    });
  }

  function populateClassOptions(select, value = '', label = '') {
    if (!select) return;
    const currentValue = value || select.value;
    const currentLabel = label || (select.options[select.selectedIndex]?.textContent || '');
    populateSelectOptions(select, getPackData().classes || [], 'Choose a class');
    if (currentValue) {
      const hasOption = Array.from(select.options).some((option) => option.value === currentValue);
      if (!hasOption) {
        const option = document.createElement('option');
        option.value = currentValue;
        option.textContent = currentLabel || currentValue;
        select.appendChild(option);
      }
      select.value = currentValue;
    } else {
      select.value = '';
    }
  }

  function collectRowData() {
    return rows.map((ref) => {
      const classValue = (ref.select.value || '').trim();
      const rawLevel = Number.parseInt(ref.level.value, 10);
      const level = Number.isFinite(rawLevel) && rawLevel > 0 ? Math.min(rawLevel, MAX_CHARACTER_LEVEL) : 1;
      if (ref.level.value !== String(level)) {
        ref.level.value = String(level);
      }
      const option = ref.select.options[ref.select.selectedIndex];
      const name = option ? option.textContent.trim() : classValue;
      ref.hidden.value = JSON.stringify({
        class: classValue,
        level,
        name: name || undefined
      });
      return { class: classValue, level, name };
    });
  }

  function readRowLevel(ref) {
    if (!ref) return 0;
    const raw = Number.parseInt(ref.level.value, 10);
    if (!Number.isFinite(raw)) return 0;
    return Math.min(Math.max(raw, 0), MAX_CHARACTER_LEVEL);
  }

  function getCurrentTotalLevel({ exclude } = {}) {
    if (!rows.length) return 0;
    return rows.reduce((sum, ref) => {
      if (!ref || ref === exclude) return sum;
      return sum + readRowLevel(ref);
    }, 0);
  }

  function updateRowLabels() {
    rows.forEach((ref, index) => {
      if (ref.label) {
        ref.label.textContent = index === 0 ? 'Primary class' : 'Additional class';
      }
      if (ref.remove) {
        const hide = rows.length <= 1;
        ref.remove.hidden = hide;
        ref.remove.disabled = hide;
      }
    });
  }

  function updateTotals(rowData) {
    const total = rowData.reduce((sum, entry) => sum + (Number.isFinite(entry.level) ? entry.level : 0), 0);
    if (totalDisplay) {
      totalDisplay.textContent = String(total || 0);
    }
    if (totalField) {
      totalField.value = String(Math.max(total || 1, 1));
    }
    return total;
  }

  function requestAutoBalance(totalLevel) {
    if (!rows.length) return;
    const minimumTotal = rows.length;
    const maximumTotal = rows.length * MAX_CHARACTER_LEVEL;
    const normalized = Number.isFinite(totalLevel) ? Math.floor(totalLevel) : 0;
    const bounded = Math.min(Math.max(normalized, minimumTotal), maximumTotal);
    pendingAutoBalance = { total: bounded };
    autoBalanceMessage = 'Levels automatically balanced across classes.';
  }

  function applyPendingAutoBalance() {
    if (!pendingAutoBalance || !rows.length) return;
    const total = pendingAutoBalance.total;
    const count = rows.length;
    const base = Math.floor(total / count);
    let remainder = total - base * count;
    rows.forEach((ref) => {
      if (!ref?.level) return;
      let assigned = base;
      if (remainder > 0) {
        assigned += 1;
        remainder -= 1;
      }
      if (assigned < 1) assigned = 1;
      if (assigned > MAX_CHARACTER_LEVEL) assigned = MAX_CHARACTER_LEVEL;
      ref.level.value = String(assigned);
    });
    pendingAutoBalance = null;
  }

  function clearAutoBalanceNotice() {
    pendingAutoBalance = null;
    autoBalanceMessage = '';
  }

  function updateAddButton(rowData, total) {
    if (!addButton) return;
    const totalLevel = Number.isFinite(total) ? total : rowData.reduce((sum, entry) => sum + (Number.isFinite(entry.level) ? entry.level : 0), 0);
    const shouldDisable = totalLevel < 2 || totalLevel >= MAX_CHARACTER_LEVEL || rowData.length >= MAX_CHARACTER_LEVEL;
    addButton.disabled = shouldDisable;
  }

  function applyWarnings(warnings) {
    if (!warningsNode) return;
    warningsNode.innerHTML = '';
    if (!warnings.length) {
      warningsNode.hidden = true;
      return;
    }
    warningsNode.hidden = false;
    warnings.forEach((warning) => {
      const item = document.createElement('li');
      item.textContent = warning.message;
      item.dataset.state = warning.severity;
      warningsNode.appendChild(item);
    });
  }

  function applySummary(derivedClasses, warnings) {
    if (!summaryNode) return;
    const entries = derivedClasses?.entries || [];
    const hasClass = entries.some((entry) => entry.class);
    const rowWarnings = extractRowWarnings(warnings);
    if (autoBalanceMessage) {
      rowWarnings.unshift({ message: autoBalanceMessage, severity: 'info' });
    }
    if (!hasClass) {
      setSummaryText('Pick a class to view hit die and proficiencies.');
      updateSummaryWarningsList(rowWarnings);
      const hasErrors = warnings.some((warning) => warning.severity === 'error');
      const hasWarns = warnings.some((warning) => warning.severity === 'warn');
      const infoOnly = rowWarnings.length > 0 && rowWarnings.every((warning) => (warning.severity || '').toLowerCase() === 'info');
      if (hasErrors) {
        summaryNode.dataset.state = 'error';
      } else if (hasWarns) {
        summaryNode.dataset.state = 'warn';
      } else if (rowWarnings.length) {
        summaryNode.dataset.state = infoOnly ? 'info' : 'warn';
      } else {
        summaryNode.dataset.state = '';
      }
      return;
    }
    const parts = [];
    const totalLevel = derivedClasses?.totalLevel || 0;
    if (totalLevel > 0) {
      parts.push(`Level ${totalLevel}`);
    }
    const pb = derivedClasses?.proficiencyBonus;
    if (Number.isFinite(pb)) {
      parts.push(`PB +${pb}`);
    }
    const hitParts = entries
      .map((entry) => {
        const label = entry.name || entry.class || 'Class';
        if (entry.hitDie && Number.isFinite(entry.level)) {
          return `${label} ${entry.hitDie}×${entry.level}`;
        }
        if (Number.isFinite(entry.level)) {
          return `${label} ${entry.level}`;
        }
        return label;
      })
      .filter(Boolean);
    if (hitParts.length) {
      parts.push(hitParts.join(', '));
    }
    const summaryText = parts.length ? parts.join(' · ') : 'Classes ready.';
    setSummaryText(summaryText);
    updateSummaryWarningsList(rowWarnings);
    const hasErrors = warnings.some((warning) => warning.severity === 'error');
    const hasWarns = warnings.some((warning) => warning.severity === 'warn');
    const infoOnly = rowWarnings.length > 0 && rowWarnings.every((warning) => (warning.severity || '').toLowerCase() === 'info');
    let state = '';
    if (hasErrors) {
      state = 'error';
    } else if (hasWarns) {
      state = 'warn';
    } else if (rowWarnings.length) {
      state = infoOnly ? 'info' : 'warn';
    } else {
      state = 'ok';
    }
    summaryNode.dataset.state = state;
  }

  function enforceNextButton() {
    if (!nextBtn) return;
    if (activeStep) {
      nextBtn.disabled = nextLocked;
    } else if (!activeStep && nextLocked) {
      nextLocked = false;
      nextBtn.disabled = false;
    }
  }

  function extractClassPrereqDetails(meta, { isMulticlass } = {}) {
    const abilityRequirements = new Map();
    const additionalNotes = [];
    let requiresSpellcasting = false;

    const ABILITY_REGEX = /(strength|dexterity|constitution|intelligence|wisdom|charisma)[^0-9]*?(\d+)/gi;

    function recordAbility(name, minimum) {
      if (!name || !Number.isFinite(minimum)) return;
      const abilityId = abilityNameToId(name);
      if (!abilityId) return;
      const existing = abilityRequirements.get(abilityId) || 0;
      if (minimum > existing) {
        abilityRequirements.set(abilityId, minimum);
      }
    }

    function processString(text) {
      if (!text) return;
      const lower = text.toLowerCase();
      if (lower.includes('cast') && lower.includes('spell')) {
        requiresSpellcasting = true;
      }
      let matched = false;
      let match;
      while ((match = ABILITY_REGEX.exec(text))) {
        matched = true;
        const score = Number.parseInt(match[2], 10);
        if (Number.isFinite(score)) {
          recordAbility(match[1], score);
        }
      }
      if (!matched) {
        additionalNotes.push(text.trim());
      }
    }

    function processObject(value) {
      if (value == null) return;
      if (Array.isArray(value)) {
        value.forEach((entry) => processObject(entry));
        return;
      }
      if (typeof value === 'string') {
        processString(value);
        return;
      }
      if (typeof value === 'number') {
        return;
      }
      if (typeof value !== 'object') {
        return;
      }

      const entries = Object.entries(value);
      let handledAbilityMap = false;
      entries.forEach(([key, val]) => {
        const abilityId = abilityNameToId(key);
        if (abilityId) {
          handledAbilityMap = true;
          const minimum = Number.parseInt(val, 10);
          if (Number.isFinite(minimum)) {
            recordAbility(key, minimum);
          }
        }
      });
      if (handledAbilityMap) {
        return;
      }

      const abilityName = value.ability || value.name || value.label;
      if (abilityName) {
        const minimum = Number.parseInt(value.minimum ?? value.score ?? value.value ?? value.requirement ?? value.min, 10);
        if (Number.isFinite(minimum)) {
          recordAbility(abilityName, minimum);
        }
      }
      if (typeof value.spellcasting === 'boolean') {
        requiresSpellcasting = requiresSpellcasting || value.spellcasting;
      }
      if (value.spellcasting && typeof value.spellcasting === 'string') {
        processString(value.spellcasting);
      }

      ['prerequisite', 'prerequisites', 'requirements', 'notes', 'text', 'description', 'details'].forEach((key) => {
        if (value[key] !== undefined) {
          processObject(value[key]);
        }
      });
    }

    const candidates = [
      meta?.ability_prerequisites,
      meta?.prerequisite_abilities,
      meta?.prerequisites,
      meta?.requirements,
      meta?.abilityRequirements,
      meta?.ability_minimums
    ];
    if (isMulticlass) {
      candidates.push(meta?.multiclass_prerequisites);
      const multi = meta?.multiclass || meta?.multiclassing;
      if (multi) {
        candidates.push(multi);
      }
    }

    candidates.forEach((candidate) => processObject(candidate));

    const abilityList = Array.from(abilityRequirements.entries()).map(([ability, minimum]) => ({
      ability,
      minimum,
      label: abilityLabelIndex[ability] || ability.toUpperCase()
    }));

    return { abilityRequirements: abilityList, requiresSpellcasting, additionalNotes };
  }

  function evaluateClassPrereqs(meta, { abilityTotals, dataSnapshot, classLabel, isMulticlass, canCast }) {
    const warnings = [];
    const details = extractClassPrereqDetails(meta, { isMulticlass });
    details.abilityRequirements.forEach((req) => {
      let score = abilityTotals?.[req.ability]?.total;
      if (!Number.isFinite(score)) {
        score = abilityTotals?.[req.ability]?.base;
      }
      if (!Number.isFinite(score)) {
        const raw = Number.parseInt(dataSnapshot?.[req.ability], 10);
        if (Number.isFinite(raw)) {
          score = raw;
        }
      }
      if (!Number.isFinite(score) || score < req.minimum) {
        warnings.push({ severity: 'error', message: `${classLabel} requires ${req.label} ${req.minimum}.` });
      }
    });
    if (details.requiresSpellcasting && !canCast) {
      warnings.push({ severity: 'error', message: `${classLabel} requires the ability to cast at least one spell.` });
    }
    details.additionalNotes.forEach((note) => {
      if (!note) return;
      warnings.push({ severity: 'warn', message: `${classLabel}: ${note}` });
    });
    return warnings;
  }

  function evaluateClassState(rowData, derivedSnapshot, dataSnapshot) {
    const derivedClasses = derivedSnapshot?.classes || computeClassDerived(dataSnapshot || {});
    const warnings = [];
    const totalLevel = derivedClasses.totalLevel || 0;
    const hasSelection = rowData.some((entry) => entry.class);
    if (!hasSelection) {
      warnings.push({ severity: 'error', message: 'Choose at least one class to continue.' });
    }
    rowData.forEach((entry, index) => {
      if (!entry.class) {
        warnings.push({ severity: 'error', message: `Class ${index + 1}: Select a class.` });
      }
      if (!Number.isFinite(entry.level) || entry.level < 1) {
        warnings.push({ severity: 'error', message: `Class ${index + 1}: Level must be at least 1.` });
      }
    });
    if (totalLevel <= 0) {
      warnings.push({ severity: 'error', message: 'Assign at least one class level.' });
    }
    if (totalLevel > MAX_CHARACTER_LEVEL) {
      warnings.push({ severity: 'error', message: `Total level ${totalLevel} exceeds ${MAX_CHARACTER_LEVEL}.` });
    }
    if (rowData.length > totalLevel && totalLevel > 0) {
      warnings.push({ severity: 'error', message: 'Distribute at least one level to each class.' });
    }

    const abilityTotals = derivedSnapshot?.abilities || {};
    const isMulticlass = rowData.length > 1;
    const canCast = derivedClasses.entries.some((entry) => entry.spellcasting);
    const packClasses = getPackData().classes || [];

    rowData.forEach((entry, index) => {
      if (!entry.class) return;
      const meta = findEntry(packClasses, entry.class);
      if (!meta) {
        if (entry.class || entry.name) {
          warnings.push({ severity: 'warn', message: `${entry.name || entry.class}: Custom class prerequisites must be verified manually.` });
        }
        return;
      }
      const prereqWarnings = evaluateClassPrereqs(meta, {
        abilityTotals,
        dataSnapshot,
        classLabel: meta.name || entry.name || `Class ${index + 1}`,
        isMulticlass,
        canCast
      });
      warnings.push(...prereqWarnings);
    });

    return { warnings, derivedClasses };
  }

  function refreshSummary(rowData, { useSnapshot = false } = {}) {
    let dataSnapshot = state.data;
    let derivedSnapshot = state.derived;
    if (useSnapshot) {
      dataSnapshot = serializeForm();
      derivedSnapshot = computeDerivedState(dataSnapshot);
    }
    const evaluation = evaluateClassState(rowData, derivedSnapshot, dataSnapshot);
    applyWarnings(evaluation.warnings);
    applySummary(evaluation.derivedClasses, evaluation.warnings);
    nextLocked = evaluation.warnings.some((warning) => warning.severity === 'error');
    enforceNextButton();
  }

  function updateAll({ useSnapshot = false } = {}) {
    if (!rows.length) return;
    applyPendingAutoBalance();
    const rowData = collectRowData();
    updateRowLabels();
    const total = updateTotals(rowData);
    updateAddButton(rowData, total);
    refreshSummary(rowData, { useSnapshot });
  }

  function handleRowChange() {
    clearAutoBalanceNotice();
    updateAll({ useSnapshot: true });
  }

  function removeRow(ref) {
    if (rows.length <= 1) return;
    const index = rows.indexOf(ref);
    const totalBefore = getCurrentTotalLevel();
    const removedLevel = readRowLevel(ref);
    if (index !== -1) {
      rows.splice(index, 1);
    }
    if (ref.row && ref.row.parentNode) {
      ref.row.parentNode.removeChild(ref.row);
    }
    const targetTotal = Math.max(0, totalBefore - removedLevel);
    if (rows.length) {
      requestAutoBalance(targetTotal);
    } else {
      clearAutoBalanceNotice();
    }
    updateAll({ useSnapshot: true });
    handleInput();
  }

  function createRow(initialData = {}) {
    if (!rowsContainer) return null;
    const row = document.createElement('div');
    row.className = 'class-row';
    row.dataset.classRow = 'true';

    const classLabel = document.createElement('label');
    const classLabelText = document.createElement('span');
    classLabelText.className = 'class-row-label';
    classLabelText.textContent = 'Class';
    classLabel.appendChild(classLabelText);
    const select = document.createElement('select');
    select.dataset.classSelect = 'true';
    classLabel.appendChild(select);

    const levelLabel = document.createElement('label');
    const levelLabelText = document.createElement('span');
    levelLabelText.className = 'class-row-label';
    levelLabelText.textContent = 'Level';
    levelLabel.appendChild(levelLabelText);
    const levelInput = document.createElement('input');
    levelInput.type = 'number';
    levelInput.min = '1';
    levelInput.max = String(MAX_CHARACTER_LEVEL);
    const parsedLevel = Number.parseInt(initialData.level, 10);
    const initialLevel = Number.isFinite(parsedLevel) && parsedLevel > 0 ? Math.min(parsedLevel, MAX_CHARACTER_LEVEL) : 1;
    levelInput.value = String(initialLevel);
    levelInput.dataset.classLevel = 'true';
    levelLabel.appendChild(levelInput);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'class-remove';
    removeButton.dataset.classRemove = 'true';
    removeButton.textContent = 'Remove';
    removeButton.hidden = true;
    removeButton.disabled = true;
    removeButton.setAttribute('aria-label', 'Remove class');

    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = 'classes[]';

    row.append(classLabel, levelLabel, removeButton, hidden);
    rowsContainer.appendChild(row);

    const initialClass = initialData.class ? String(initialData.class) : '';
    const initialName = initialData.name || '';

    populateClassOptions(select, initialClass, initialName);

    const ref = { row, select, level: levelInput, remove: removeButton, hidden, label: classLabelText };

    hidden.value = JSON.stringify({ class: initialClass, level: initialLevel, name: initialName || undefined });

    select.addEventListener('change', () => handleRowChange(ref));
    levelInput.addEventListener('input', () => handleRowChange(ref));
    levelInput.addEventListener('change', () => handleRowChange(ref));
    removeButton.addEventListener('click', () => removeRow(ref));

    rows.push(ref);
    return ref;
  }

  function addRow(initialData = {}) {
    const totalBefore = getCurrentTotalLevel();
    createRow(initialData);
    if (rows.length) {
      requestAutoBalance(totalBefore);
    }
    updateRowLabels();
    updateAll({ useSnapshot: true });
    handleInput();
  }

  function populateRowsFromState(data) {
    if (!rowsContainer) return;
    clearAutoBalanceNotice();
    while (rows.length) {
      const ref = rows.pop();
      if (ref?.row?.parentNode) {
        ref.row.parentNode.removeChild(ref.row);
      }
    }
    const classes = Array.isArray(data?.classes) ? data.classes : normalizeClassEntries(data || {});
    if (classes.length) {
      classes.forEach((entry) => {
        const sanitized = sanitizeClassEntry(entry, 1);
        const meta = sanitized.class ? findEntry(getPackData().classes || [], sanitized.class) : null;
        createRow({
          class: sanitized.class || '',
          level: sanitized.level,
          name: sanitized.name || meta?.name || sanitized.class || ''
        });
      });
    }
    if (!rows.length) {
      createRow({ class: '', level: 1 });
    }
    updateRowLabels();
    updateAll({ useSnapshot: false });
  }

  return {
    setup(section) {
      summaryNode = section.querySelector('[data-class-summary]');
      summaryTextNode = summaryNode?.querySelector('[data-class-summary-text]') || summaryNode;
      summaryWarningsNode = summaryNode?.querySelector('[data-class-summary-warnings]') || null;
      rowsContainer = section.querySelector('[data-class-rows]');
      addButton = section.querySelector('[data-class-add]');
      warningsNode = section.querySelector('[data-class-warnings]');
      totalDisplay = section.querySelector('[data-class-total]');
      totalField = section.querySelector('[data-class-total-field]');
      if (summaryWarningsNode) {
        summaryWarningsNode.hidden = true;
      }
      if (warningsNode) {
        warningsNode.hidden = true;
      }
      if (rowsContainer) {
        rowsContainer.innerHTML = '';
      }
      populateRowsFromState(state.data);
      if (addButton) {
        addButton.addEventListener('click', () => {
          addRow({ class: '', level: 1 });
        });
      }
      updateRowLabels();
      updateAll({ useSnapshot: false });
    },
    onPackData() {
      rows.forEach((ref) => {
        const option = ref.select.options[ref.select.selectedIndex];
        const label = option ? option.textContent.trim() : '';
        populateClassOptions(ref.select, ref.select.value, label);
      });
      updateAll({ useSnapshot: true });
    },
    onStateHydrated(currentState) {
      populateRowsFromState(currentState?.data || state.data);
    },
    onFormInput(event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.matches('[data-class-level]')) {
        updateAll({ useSnapshot: true });
      }
    },
    onFormChange(event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.matches('[data-class-select]')) {
        updateAll({ useSnapshot: true });
      }
    },
    onStatePersisted() {
      updateAll({ useSnapshot: false });
    },
    onStepChange(detail) {
      activeStep = detail?.id === 'classLevel';
      enforceNextButton();
    }
  };
})();

const abilityModule = (() => {
  const abilityMap = new Map();
  const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
  const POINT_BUY_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
  const DICE_METHODS = {
    'roll-4d6-drop': { label: '4d6 (drop lowest)', dice: 4, faces: 6, drop: 1 },
    'roll-3d6': { label: '3d6', dice: 3, faces: 6, drop: 0 }
  };
  const DEFAULT_POINT_POOL = 27;

  let summaryNode = null;
  let methodSelect = null;
  let poolInput = null;
  let hiddenRollsInput = null;
  let rollMeta = null;
  let activeStep = false;
  let nextLocked = false;

  function ensureHiddenRollInput() {
    if (!form) return null;
    const existing = form.elements.namedItem('abilityRolls');
    if (existing instanceof HTMLInputElement) {
      return existing;
    }
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'abilityRolls';
    form.appendChild(input);
    return input;
  }

  function canonicalizeMethod(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized in DICE_METHODS) return normalized;
    if (normalized === 'standard-array') return 'standard-array';
    if (normalized === 'point-buy' || normalized === '27-point buy') return 'point-buy';
    if (normalized === 'manual' || normalized === 'manual entry') return 'manual';
    if (normalized.includes('standard')) return 'standard-array';
    if (normalized.includes('point')) return 'point-buy';
    if (normalized.includes('4d6')) return 'roll-4d6-drop';
    if (normalized.includes('3d6')) return 'roll-3d6';
    if (normalized.includes('manual')) return 'manual';
    if (normalized.includes('roll')) return 'roll-4d6-drop';
    return 'standard-array';
  }

  function isDiceMethod(method) {
    return Object.prototype.hasOwnProperty.call(DICE_METHODS, method);
  }

  function getDiceLabel(method) {
    return DICE_METHODS[method]?.label || 'Dice';
  }

  function rollDiceTotal(count, faces, drop = 0) {
    const rolls = [];
    for (let i = 0; i < count; i += 1) {
      rolls.push(1 + Math.floor(Math.random() * faces));
    }
    rolls.sort((a, b) => a - b);
    const kept = rolls.slice(Math.min(drop, rolls.length));
    return kept.reduce((sum, value) => sum + value, 0);
  }

  function rollAbilityScores(method) {
    const config = DICE_METHODS[method];
    if (!config) return [];
    const results = [];
    for (let i = 0; i < abilityFields.length; i += 1) {
      results.push(rollDiceTotal(config.dice, config.faces, config.drop));
    }
    return results;
  }

  function getAbilityScoresFromInputs() {
    return abilityFields.map((field) => {
      const refs = abilityMap.get(field.id);
      if (!refs) return Number.NaN;
      const parsed = Number.parseInt(refs.input.value, 10);
      return Number.isFinite(parsed) ? parsed : Number.NaN;
    });
  }

  function setAbilityScores(scores) {
    abilityFields.forEach((field, index) => {
      const refs = abilityMap.get(field.id);
      if (!refs) return;
      const score = Number(scores[index]);
      if (!Number.isFinite(score)) return;
      const nextValue = String(score);
      if (refs.input.value === nextValue) return;
      refs.input.value = nextValue;
      refs.input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  function updateInputConstraints(method) {
    abilityMap.forEach(({ input }) => {
      if (!input) return;
      if (method === 'point-buy') {
        input.min = '8';
        input.max = '15';
      } else {
        input.min = '3';
        input.max = '20';
      }
    });
  }

  function updatePoolControl(method) {
    if (!poolInput) return;
    if (method === 'point-buy') {
      poolInput.readOnly = false;
      poolInput.removeAttribute('aria-disabled');
    } else {
      poolInput.readOnly = true;
      poolInput.setAttribute('aria-disabled', 'true');
    }
  }

  function shouldPopulateDefaults(method) {
    const scores = getAbilityScoresFromInputs();
    if (method === 'standard-array') {
      return scores.every((score) => !Number.isFinite(score) || score === 10);
    }
    if (method === 'point-buy') {
      return scores.every((score) => !Number.isFinite(score) || score === 10 || score === 8);
    }
    if (isDiceMethod(method)) {
      return true;
    }
    return false;
  }

  function readRollMeta() {
    if (!hiddenRollsInput || !hiddenRollsInput.value) return null;
    try {
      const parsed = JSON.parse(hiddenRollsInput.value);
      if (parsed && typeof parsed === 'object' && parsed.method) {
        return parsed;
      }
    } catch (error) {
      // ignore malformed JSON
    }
    return null;
  }

  function setRollMeta(meta) {
    rollMeta = meta;
    if (!hiddenRollsInput) return;
    const newValue = meta ? JSON.stringify(meta) : '';
    if (hiddenRollsInput.value === newValue) return;
    hiddenRollsInput.value = newValue;
    hiddenRollsInput.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function applyMethod(rawMethod, { forcePopulate = false } = {}) {
    const method = canonicalizeMethod(rawMethod);
    if (methodSelect && methodSelect.value !== method) {
      methodSelect.value = method;
    }
    updateInputConstraints(method);
    updatePoolControl(method);
    if (method === 'point-buy' && poolInput) {
      const pool = Number.parseInt(poolInput.value, 10);
      if (!Number.isFinite(pool)) {
        poolInput.value = String(DEFAULT_POINT_POOL);
        poolInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    if (!isDiceMethod(method) && rollMeta) {
      setRollMeta(null);
    }
    const shouldPopulate = forcePopulate || shouldPopulateDefaults(method);
    if (method === 'standard-array' && shouldPopulate) {
      setAbilityScores([...STANDARD_ARRAY]);
    } else if (method === 'point-buy' && shouldPopulate) {
      setAbilityScores(Array(abilityFields.length).fill(8));
    } else if (isDiceMethod(method) && (forcePopulate || !rollMeta || rollMeta.method !== method)) {
      const rolled = rollAbilityScores(method);
      if (rolled.length) {
        setRollMeta({ method, values: rolled, timestamp: Date.now() });
        setAbilityScores(rolled);
      }
    }
    updateSummaryAndValidity();
  }

  function getPointBuyEvaluation(scores) {
    const poolValue = Number.parseInt(poolInput ? poolInput.value : '', 10);
    const totalPool = Number.isFinite(poolValue) ? poolValue : DEFAULT_POINT_POOL;
    let spent = 0;
    let hasFatal = false;
    const notes = new Set();
    scores.forEach((score) => {
      if (!Number.isFinite(score)) {
        hasFatal = true;
        notes.add('Enter a score for each ability.');
        return;
      }
      if (score < 8) {
        hasFatal = true;
        notes.add('Scores must be at least 8 before bonuses.');
      }
      if (score > 15) {
        hasFatal = true;
        notes.add('Scores cannot exceed 15 before bonuses.');
      }
      const cost = POINT_BUY_COST[score];
      if (!Number.isFinite(cost)) {
        hasFatal = true;
        notes.add(`Score ${score} is not allowed in point buy.`);
        return;
      }
      spent += cost;
    });
    const remaining = totalPool - spent;
    let message;
    let state = 'ok';
    if (remaining > 0) {
      message = `Point Buy · ${remaining} points remaining (${spent}/${totalPool} spent).`;
      state = 'warn';
    } else if (remaining === 0) {
      message = `Point Buy · All points spent (${spent}/${totalPool}).`;
    } else {
      message = `Point Buy · Over budget by ${Math.abs(remaining)} points (${spent}/${totalPool}).`;
      state = 'warn';
      hasFatal = true;
    }
    if (notes.size) {
      message += ` · ${Array.from(notes).join(' · ')}`;
      state = 'warn';
    }
    return { message, state, valid: !hasFatal };
  }

  function getStandardArrayEvaluation(scores) {
    const pool = [...STANDARD_ARRAY];
    const extras = [];
    let hasFatal = false;
    scores.forEach((score) => {
      if (!Number.isFinite(score)) {
        hasFatal = true;
        extras.push('—');
        return;
      }
      const index = pool.indexOf(score);
      if (index === -1) {
        extras.push(String(score));
      } else {
        pool.splice(index, 1);
      }
    });
    let message;
    let state = 'ok';
    if (!pool.length && !extras.length && !hasFatal) {
      message = `Standard Array · Assigned ${scores.join(', ')}.`;
    } else {
      const parts = [];
      if (pool.length) {
        parts.push(`Remaining values: ${pool.join(', ')}`);
        hasFatal = true;
      }
      if (extras.length) {
        parts.push(`Extra values: ${extras.join(', ')}`);
        hasFatal = true;
      }
      if (!parts.length) {
        parts.push('Assign each array value once.');
        hasFatal = true;
      }
      message = `Standard Array · ${parts.join(' · ')}`;
      state = 'warn';
    }
    return { message, state, valid: !hasFatal };
  }

  function getDiceEvaluation(scores, method) {
    const metaValid = rollMeta && rollMeta.method === method;
    if (!metaValid) {
      return { message: `${getDiceLabel(method)} · Roll ability scores to continue.`, state: 'warn', valid: false };
    }
    const filled = scores.every((score) => Number.isFinite(score));
    if (!filled) {
      return { message: `${getDiceLabel(method)} · Assign each rolled score.`, state: 'warn', valid: false };
    }
    return { message: `${getDiceLabel(method)} · ${scores.join(', ')}`, state: 'ok', valid: true };
  }

  function getManualEvaluation(scores) {
    const filled = scores.every((score) => Number.isFinite(score));
    if (!filled) {
      return { message: 'Manual Entry · Enter a score for each ability.', state: 'warn', valid: false };
    }
    return { message: 'Manual Entry · Customize ability scores as needed.', state: 'ok', valid: true };
  }

  function updateSummaryAndValidity() {
    if (!summaryNode) return;
    const method = canonicalizeMethod(methodSelect ? methodSelect.value : state.data?.abilityMethod);
    const scores = getAbilityScoresFromInputs();
    let result;
    if (method === 'point-buy') {
      result = getPointBuyEvaluation(scores);
    } else if (method === 'standard-array') {
      result = getStandardArrayEvaluation(scores);
    } else if (isDiceMethod(method)) {
      result = getDiceEvaluation(scores, method);
    } else {
      result = getManualEvaluation(scores);
    }
    summaryNode.textContent = result.message;
    summaryNode.dataset.state = result.state || '';
    nextLocked = !result.valid;
    enforceNextButton();
  }

  function enforceNextButton() {
    if (!nextBtn) return;
    if (activeStep) {
      nextBtn.disabled = nextLocked;
    } else if (!activeStep && nextLocked) {
      nextLocked = false;
      nextBtn.disabled = false;
    }
  }

  function updateDisplay({ useFormValues = false } = {}) {
    if (!abilityMap.size) return;
    const snapshot = useFormValues ? serializeForm() : state.data;
    const derived = computeDerivedState(snapshot);
    abilityFields.forEach((field) => {
      const refs = abilityMap.get(field.id);
      if (!refs) return;
      const info = derived.abilities[field.id];
      const base = info?.base ?? 10;
      const total = info?.total ?? base;
      const bonus = info?.bonus ?? 0;
      refs.input.value = base;
      refs.total.textContent = `Total ${total}`;
      if (info?.sources && info.sources.length) {
        const parts = info.sources.map((source) => `${source.value >= 0 ? '+' : ''}${source.value} ${source.label}`);
        refs.helper.innerHTML = `<strong>${bonus >= 0 ? '+' : ''}${bonus}</strong> from ${parts.join(', ')}`;
      } else {
        refs.helper.textContent = 'No bonuses applied.';
      }
      refs.mod.textContent = `Modifier ${formatModifier(total)}`;
    });
    updateSummaryAndValidity();
  }

  function syncFromState(options = {}) {
    rollMeta = readRollMeta();
    const method = canonicalizeMethod(state.data?.abilityMethod || methodSelect?.value);
    if (methodSelect && methodSelect.value !== method) {
      methodSelect.value = method;
    }
    applyMethod(method, options);
    updateDisplay({ useFormValues: true });
  }

  function initialize(section) {
    const container = section.querySelector('[data-ability-grid]');
    if (!container) return;
    container.innerHTML = '';
    abilityFields.forEach((field) => {
      const wrapper = document.createElement('label');
      wrapper.className = 'ability';
      wrapper.dataset.ability = field.id;

      const header = document.createElement('div');
      header.className = 'ability-header';
      const title = document.createElement('strong');
      title.textContent = field.label;
      const total = document.createElement('span');
      total.className = 'ability-total';
      total.dataset.role = 'ability-total';
      total.textContent = 'Total 10';
      header.append(title, total);

      const input = document.createElement('input');
      input.type = 'number';
      input.min = '3';
      input.max = '20';
      input.name = field.id;
      input.value = '10';

      const helper = document.createElement('span');
      helper.className = 'ability-helper';
      helper.dataset.role = 'ability-bonus';
      helper.textContent = 'No bonuses applied.';

      const mod = document.createElement('span');
      mod.className = 'ability-mod';
      mod.dataset.role = 'ability-mod';
      mod.textContent = 'Modifier +0';

      wrapper.append(header, input, helper, mod);
      container.appendChild(wrapper);

      abilityMap.set(field.id, { input, total, helper, mod });
    });

    summaryNode = section.querySelector('[data-ability-summary]');
    methodSelect = section.querySelector('select[name="abilityMethod"]');
    poolInput = section.querySelector('input[name="scorePool"]');
    hiddenRollsInput = ensureHiddenRollInput();

    updateDisplay();
  }

  return {
    setup(section) {
      initialize(section);
      syncFromState();
    },
    onPackData() {
      updateDisplay({ useFormValues: true });
    },
    onStateHydrated() {
      syncFromState();
    },
    onFormInput(event) {
      if (!event.target) return;
      if (abilityMap.has(event.target.name)) {
        updateDisplay({ useFormValues: true });
        return;
      }
      if (event.target.name === 'scorePool') {
        updateSummaryAndValidity();
      }
    },
    onFormChange(event) {
      if (!event.target) return;
      if (event.target.name === 'abilityMethod') {
        applyMethod(event.target.value, { forcePopulate: true });
        return;
      }
      if (event.target.name === 'scorePool') {
        updateSummaryAndValidity();
        return;
      }
      if (abilityMap.has(event.target.name) || event.target.name === 'race') {
        updateDisplay({ useFormValues: true });
      }
    },
    onStatePersisted() {
      updateDisplay();
    },
    onStepChange(detail) {
      activeStep = detail?.id === 'abilities';
      enforceNextButton();
    }
  };
})();

const featsModule = (() => {
  let section = null;
  let summaryNode = null;
  let gridNode = null;
  let searchInput = null;
  let filterContainer = null;
  let hiddenField = null;
  let bonusInput = null;
  let activeFilter = 'all';
  let searchQuery = '';
  let featList = [];
  let featLookup = new Map();
  let selected = new Set();
  let structuredSelections = [];
  let activeStep = false;
  let nextLocked = false;
  const highlightKeys = new Set();

  function sanitizeBonusValue(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 0) return '0';
    return String(parsed);
  }

  function escapeSelector(value) {
    if (!value && value !== 0) return '';
    if (window.CSS && typeof window.CSS.escape === 'function') {
      return window.CSS.escape(String(value));
    }
    return String(value).replace(/([:\\.#\[\],=])/g, '\\$1');
  }

  function computeStructuredSelections(baseSelections = structuredSelections) {
    return Array.from(selected).map((selectionKey) => {
      const feat = getFeatEntry(selectionKey);
      const fallback = baseSelections.find((entry) => entry.key === selectionKey) || null;
      const prerequisites = Array.isArray(feat?.prerequisites)
        ? feat.prerequisites
        : Array.isArray(fallback?.prerequisites)
        ? fallback.prerequisites
        : [];
      return {
        key: selectionKey,
        name: feat?.name || fallback?.name || selectionKey,
        source: feat?.source || fallback?.source || '',
        summary: feat?.summary || fallback?.summary || '',
        prerequisites,
        locked: Boolean(fallback?.locked),
        checks: Array.isArray(fallback?.checks)
          ? fallback.checks
              .map((check) => ({
                label: String(check.label || '').trim(),
                satisfied: Boolean(check.satisfied),
                unknown: Boolean(check.unknown)
              }))
              .filter((check) => Boolean(check.label))
          : []
      };
    });
  }

  function commitSelections(baseSelections = structuredSelections) {
    const preliminary = computeStructuredSelections(baseSelections);
    structuredSelections = preliminary;
    if (state.data) {
      state.data.feats = Array.from(selected);
      state.data.featSelections = preliminary.map((entry) => cloneSelection(entry));
    }
    updateHiddenField({ data: preliminary });
  }

  function applyHighlights() {
    if (!gridNode || !highlightKeys.size) return;
    const keys = Array.from(highlightKeys);
    highlightKeys.clear();
    requestAnimationFrame(() => {
      keys.forEach((key) => {
        const selector = `[data-feat-card="${escapeSelector(key)}"]`;
        const node = gridNode.querySelector(selector);
        if (!node) return;
        node.classList.add('quick-add-highlight');
        window.setTimeout(() => {
          if (node.isConnected) {
            node.classList.remove('quick-add-highlight');
          }
        }, 2000);
      });
    });
  }

  function resolveFeatKey(value) {
    if (value === null || value === undefined) return '';
    const canonical = canonicalizeFeatKey(value);
    const lower = canonical.toLowerCase();
    const entry = featLookup.get(lower);
    return entry ? entry.key : canonical;
  }

  function getFeatEntry(key) {
    if (!key) return null;
    const lower = String(key).trim().toLowerCase();
    return featLookup.get(lower) || null;
  }

  function cloneSelection(entry) {
    if (!entry) return null;
    return {
      ...entry,
      checks: Array.isArray(entry.checks)
        ? entry.checks.map((check) => ({ ...check }))
        : []
    };
  }

  function buildFeatList() {
    const feats = getPackData().feats || [];
    featLookup = new Map();
    featList = feats
      .map((feat) => {
        const baseKey = feat.slug || feat.id || feat.name;
        if (!baseKey) return null;
        const key = String(baseKey).trim();
        if (!key) return null;
        const name = feat.name || key;
        const summary = feat.summary || '';
        const description = feat.description || '';
        const source = feat.source?.name || '';
        const prerequisites = Array.isArray(feat.prerequisites)
          ? feat.prerequisites.map((entry) => String(entry).trim()).filter(Boolean)
          : [];
        const search = `${name} ${summary} ${description} ${prerequisites.join(' ')}`.toLowerCase();
        const entry = { key, name, summary, description, source, prerequisites, search, raw: feat };
        const identifiers = new Set([
          key.toLowerCase(),
          (feat.slug || '').toLowerCase(),
          (feat.id || '').toLowerCase(),
          (feat.name || '').toLowerCase()
        ]);
        identifiers.forEach((identifier) => {
          if (!identifier) return;
          if (!featLookup.has(identifier)) {
            featLookup.set(identifier, entry);
          }
        });
        return entry;
      })
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function updateHiddenField({ silent = false, data = structuredSelections } = {}) {
    if (!hiddenField) return;
    const payload = JSON.stringify(Array.isArray(data) ? data : []);
    if (hiddenField.value === payload) return;
    hiddenField.value = payload;
    if (!silent) {
      hiddenField.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function syncSelectedFromData(data, { silent = false } = {}) {
    const structured = Array.isArray(data?.featSelections) && data.featSelections.length
      ? sanitizeFeatSelectionState(data.featSelections)
      : sanitizeFeatSelectionState(normalizeFeatSelections(data || {}));
    const keys = structured.length
      ? structured.map((entry) => resolveFeatKey(entry.key))
      : normalizeFeatSelections(data || {}).map((value) => resolveFeatKey(value));
    const canonical = keys.filter(Boolean);
    selected = new Set(canonical);
    structuredSelections = structured
      .filter((entry) => entry && selected.has(resolveFeatKey(entry.key)))
      .map((entry) => {
        const feat = getFeatEntry(entry.key) || entry;
        return {
          key: feat.key || entry.key,
          name: entry.name || feat.name || entry.key,
          source: entry.source || feat.source || '',
          summary: entry.summary || feat.summary || '',
          prerequisites: Array.isArray(entry.prerequisites)
            ? entry.prerequisites.map((value) => String(value).trim()).filter(Boolean)
            : Array.isArray(feat.prerequisites)
            ? feat.prerequisites
                .map((value) => String(value).trim())
                .filter(Boolean)
            : [],
          locked: Boolean(entry.locked),
          checks: Array.isArray(entry.checks)
            ? entry.checks.map((check) => ({
                label: String(check.label || '').trim(),
                satisfied: Boolean(check.satisfied),
                unknown: Boolean(check.unknown)
              })).filter((check) => Boolean(check.label))
            : []
        };
      });
    if (state.data) {
      state.data.feats = Array.from(selected);
      state.data.featSelections = structuredSelections.map((entry) => cloneSelection(entry));
    }
    updateHiddenField({ silent, data: structuredSelections });
  }

  function getContext(options = {}) {
    if (!state || !state.data) return null;
    const snapshot = options.useFormValues ? serializeForm() : state.data;
    const derived = options.useFormValues ? computeDerivedState(snapshot) : state.derived;
    return { snapshot, derived };
  }

  function computeSlotInfo(snapshot, derived) {
    const classesDerived = derived?.classes || computeClassDerived(snapshot);
    const totalLevel = classesDerived.totalLevel || Number.parseInt(snapshot?.level, 10) || 1;
    const base = FEAT_LEVEL_THRESHOLDS.reduce(
      (count, threshold) => (totalLevel >= threshold ? count + 1 : count),
      0
    );
    let classBonus = 0;
    (classesDerived.entries || []).forEach((entry) => {
      const slug = String(entry.slug || entry.class || entry.name || '').toLowerCase();
      if (!slug) return;
      const bonuses = CLASS_FEAT_BONUS_LEVELS[slug];
      if (!Array.isArray(bonuses)) return;
      bonuses.forEach((threshold) => {
        if (entry.level >= threshold) {
          classBonus += 1;
        }
      });
    });
    const manualValue = Number.parseInt(snapshot?.featBonusSlots, 10);
    const manual = Number.isFinite(manualValue) && manualValue > 0 ? manualValue : 0;
    const total = base + classBonus + manual;
    return { base, classBonus, manual, total, totalLevel };
  }

  function evaluatePrerequisites(feat, context) {
    const prerequisites = Array.isArray(feat.prerequisites) ? feat.prerequisites : [];
    if (!prerequisites.length) {
      return { locked: false, checks: [] };
    }
    const checks = [];
    const abilities = context.derived?.abilities || {};
    const totalLevel = context.derived?.classes?.totalLevel || Number.parseInt(context.snapshot?.level, 10) || 1;
    const classEntries = context.derived?.classes?.entries || [];
    const classLevels = new Map();
    classEntries.forEach((entry) => {
      const slug = String(entry.slug || entry.class || entry.name || '').toLowerCase();
      if (!slug) return;
      const level = Number.isFinite(entry.level) ? entry.level : Number.parseInt(entry.level, 10) || 0;
      classLevels.set(slug, Math.max(classLevels.get(slug) || 0, level));
    });
    const weaponProfs = context.weaponProfs || new Set();
    const armorProfs = context.armorProfs || new Set();
    const hasMartial = Array.from(weaponProfs).some((value) => value && value.includes('martial'));
    const hasSimple = Array.from(weaponProfs).some((value) => value && value.includes('simple'));
    const hasLightArmor = Array.from(armorProfs).some((value) => value && value.includes('light'));
    const hasMediumArmor = Array.from(armorProfs).some((value) => value && value.includes('medium'));
    const hasHeavyArmor = Array.from(armorProfs).some((value) => value && value.includes('heavy'));
    const hasShields = Array.from(armorProfs).some((value) => value && value.includes('shield'));
    const spellcastingCount = context.derived?.classes?.spellcastingCount || 0;

    prerequisites.forEach((raw) => {
      const label = String(raw).trim();
      if (!label) return;
      const normalized = label.toLowerCase();
      let satisfied = null;
      let unknown = false;
      if (normalized.includes('martial weapon')) {
        satisfied = hasMartial;
      } else if (normalized.includes('simple weapon')) {
        satisfied = hasSimple;
      } else if (normalized.includes('light armor')) {
        satisfied = hasLightArmor;
      } else if (normalized.includes('medium armor')) {
        satisfied = hasMediumArmor;
      } else if (normalized.includes('heavy armor')) {
        satisfied = hasHeavyArmor;
      } else if (normalized.includes('shield')) {
        satisfied = hasShields;
      } else if (/cast\b.*spell/.test(normalized) || normalized.includes('spellcasting')) {
        satisfied = spellcastingCount > 0;
      } else {
        const abilityMatch = label.match(
          /(strength|dexterity|constitution|intelligence|wisdom|charisma)[^0-9]*(\d{1,2})/i
        );
        if (abilityMatch) {
          const abilityId = abilityNameToId(abilityMatch[1]);
          const required = Number.parseInt(abilityMatch[2], 10);
          const score = abilityId
            ? abilities[abilityId]?.total ?? Number.parseInt(context.snapshot?.[abilityId], 10)
            : null;
          satisfied = Number.isFinite(score) && score >= required;
        } else {
          const classMatch = label.match(
            /(barbarian|bard|cleric|druid|fighter|monk|paladin|ranger|rogue|sorcerer|warlock|wizard)[^0-9]*(\d+)/i
          );
          if (classMatch) {
            const slug = classMatch[1].toLowerCase();
            const required = Number.parseInt(classMatch[2], 10);
            const level = classLevels.get(slug) || 0;
            satisfied = Number.isFinite(required) ? level >= required : null;
          } else {
            const levelMatch = label.match(/(?:character|overall)?\s*level\s*(\d+)/i);
            if (levelMatch) {
              const required = Number.parseInt(levelMatch[1], 10);
              satisfied = Number.isFinite(required) ? totalLevel >= required : null;
            }
          }
        }
      }
      if (satisfied === null) {
        unknown = true;
        satisfied = true;
      }
      checks.push({ label, satisfied: Boolean(satisfied), unknown });
    });
    const locked = checks.some((check) => check.satisfied === false);
    return { locked, checks };
  }

  function matchesSearch(feat) {
    if (!searchQuery) return true;
    return feat.search.includes(searchQuery);
  }

  function matchesFilter(feat, status) {
    if (activeFilter === 'available') return !status.locked;
    if (activeFilter === 'locked') return status.locked;
    if (activeFilter === 'selected') return selected.has(feat.key);
    return true;
  }

  function updateSummary(slotInfo, stats) {
    if (!summaryNode) return;
    if (!featList.length) {
      summaryNode.textContent = 'Load a ruleset to browse feats.';
      summaryNode.dataset.state = '';
      nextLocked = false;
      return;
    }
    const { selectedCount, lockedTotal, selectedLocked } = stats;
    const totalSlots = slotInfo.total;
    const parts = [];
    let shouldLock = false;
    if (totalSlots <= 0) {
      parts.push(`Level ${slotInfo.totalLevel} grants 0 feat slots.`);
      if (slotInfo.classBonus > 0 || slotInfo.manual > 0) {
        const extras = [];
        if (slotInfo.classBonus > 0) extras.push(`class bonus ${slotInfo.classBonus}`);
        if (slotInfo.manual > 0) extras.push(`bonus ${slotInfo.manual}`);
        parts.push(`Tracking ${extras.join(' + ')} slot${slotInfo.classBonus + slotInfo.manual === 1 ? '' : 's'}.`);
      } else {
        parts.push('Add bonus slots to track racial or class features that grant feats.');
      }
      if (lockedTotal > 0) {
        parts.push(`${lockedTotal} locked by prerequisites`);
      }
      summaryNode.textContent = parts.join(' ');
      summaryNode.dataset.state = '';
      nextLocked = false;
      return;
    }
    if (selectedCount === 0) {
      parts.push(`Choose at least one feat (0/${totalSlots}).`);
      shouldLock = true;
    } else if (selectedCount > totalSlots) {
      parts.push(`Over capacity: ${selectedCount}/${totalSlots} feats selected.`);
      shouldLock = true;
    } else {
      parts.push(`Using ${selectedCount}/${totalSlots} feat slots.`);
    }
    const breakdown = [`base ${slotInfo.base}`];
    if (slotInfo.classBonus > 0) breakdown.push(`class bonus ${slotInfo.classBonus}`);
    if (slotInfo.manual > 0) breakdown.push(`bonus ${slotInfo.manual}`);
    if (breakdown.length > 1) {
      parts.push(`(${breakdown.join(' + ')})`);
    }
    if (selectedLocked > 0) {
      parts.push(
        `${selectedLocked} selection${selectedLocked === 1 ? ' has' : 's have'} unmet prerequisites.`
      );
      shouldLock = true;
    } else if (lockedTotal > 0) {
      parts.push(`${lockedTotal} locked by prerequisites`);
    }
    summaryNode.textContent = parts.join(' ');
    nextLocked = shouldLock;
    summaryNode.dataset.state = shouldLock ? 'warn' : 'ok';
  }

  function enforceNextButton() {
    if (!nextBtn) return;
    if (activeStep) {
      nextBtn.disabled = nextLocked;
    } else if (nextLocked) {
      nextLocked = false;
      nextBtn.disabled = false;
    }
  }

  function render(options = {}) {
    if (!section) return;
    const context = getContext(options);
    if (!context) return;
    const canonicalSelections = normalizeFeatSelections(context.snapshot)
      .map((value) => resolveFeatKey(value))
      .filter(Boolean);
    selected = new Set(canonicalSelections);
    const snapshotSelections = Array.isArray(context.snapshot?.featSelections)
      ? sanitizeFeatSelectionState(context.snapshot.featSelections)
      : [];
    const snapshotLookup = new Map(
      snapshotSelections.map((entry) => [resolveFeatKey(entry.key), entry])
    );
    const sanitizedBonus = sanitizeBonusValue(context.snapshot?.featBonusSlots);
    if (state.data) {
      state.data.featBonusSlots = sanitizedBonus;
    }
    if (bonusInput && bonusInput.value !== sanitizedBonus) {
      bonusInput.value = sanitizedBonus;
    }
    const slotInfo = computeSlotInfo({ ...context.snapshot, featBonusSlots: sanitizedBonus }, context.derived);
    const proficiency = getClassProficiencies(context.snapshot);
    const evaluationContext = {
      snapshot: context.snapshot,
      derived: context.derived,
      weaponProfs: proficiency.weaponProfs,
      armorProfs: proficiency.armorProfs
    };
    const evaluated = featList.map((feat) => ({
      feat,
      status: evaluatePrerequisites(feat, evaluationContext)
    }));
    const statusLookup = new Map(evaluated.map(({ feat, status }) => [feat.key, status]));
    const filtered = evaluated.filter(
      (item) => matchesSearch(item.feat) && matchesFilter(item.feat, item.status)
    );
    if (gridNode) {
      gridNode.innerHTML = '';
      if (!featList.length) {
        const empty = document.createElement('p');
        empty.className = 'feat-empty';
        empty.textContent = 'Load a ruleset to browse feats.';
        gridNode.appendChild(empty);
      } else if (!filtered.length) {
        const empty = document.createElement('p');
        empty.className = 'feat-empty';
        empty.textContent = 'No feats match your search or filters.';
        gridNode.appendChild(empty);
      } else {
        filtered.forEach(({ feat, status }) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'feat-card';
          button.dataset.featCard = feat.key;
          const isSelected = selected.has(feat.key);
          button.dataset.selected = isSelected ? 'true' : 'false';
          button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
          button.dataset.state = status.locked ? 'locked' : 'available';
          if (status.locked && !isSelected) {
            button.disabled = true;
            button.setAttribute('aria-disabled', 'true');
          } else {
            button.disabled = false;
            button.removeAttribute('aria-disabled');
          }
          const header = document.createElement('div');
          header.className = 'feat-card-header';
          const title = document.createElement('strong');
          title.textContent = feat.name;
          header.appendChild(title);
          if (feat.source) {
            const source = document.createElement('span');
            source.className = 'feat-card-source';
            source.textContent = feat.source;
            header.appendChild(source);
          }
          button.appendChild(header);
          if (feat.summary) {
            const summary = document.createElement('p');
            summary.className = 'feat-card-summary';
            summary.textContent = feat.summary;
            button.appendChild(summary);
          }
          const chips = [];
          if (isSelected) {
            chips.push('Selected');
          }
          if (!feat.prerequisites.length) {
            chips.push('No prerequisites');
          } else if (status.locked) {
            chips.push('Prerequisites unmet');
          } else {
            chips.push('Prerequisites met');
          }
          if (chips.length) {
            const chipWrapper = document.createElement('div');
            chipWrapper.className = 'feat-card-chips';
            chips.forEach((label) => {
              const chip = document.createElement('span');
              chip.className = 'feat-card-chip';
              chip.textContent = label;
              chipWrapper.appendChild(chip);
            });
            button.appendChild(chipWrapper);
          }
          if (status.checks.length) {
            const list = document.createElement('ul');
            list.className = 'feat-card-prereqs';
            status.checks.forEach((check) => {
              const item = document.createElement('li');
              if (check.unknown) {
                item.dataset.state = 'unknown';
              } else if (check.satisfied) {
                item.dataset.state = 'ok';
              } else {
                item.dataset.state = 'warn';
              }
              const icon = document.createElement('span');
              icon.textContent = check.unknown ? '❔' : check.satisfied ? '✅' : '⚠️';
              const text = document.createElement('span');
              text.textContent = check.label;
              item.append(icon, text);
              list.appendChild(item);
            });
            button.appendChild(list);
          }
          gridNode.appendChild(button);
        });
      }
    }
    const selectionDetails = Array.from(selected).map((key) => {
      const resolved = resolveFeatKey(key);
      const feat = getFeatEntry(resolved);
      const fallback = snapshotLookup.get(resolved) || structuredSelections.find((entry) => entry.key === resolved) || null;
      const status = statusLookup.get(resolved) || {
        locked: Boolean(fallback?.locked),
        checks: Array.isArray(fallback?.checks) ? fallback.checks : []
      };
      const prerequisites = Array.isArray(feat?.prerequisites)
        ? feat.prerequisites
        : Array.isArray(fallback?.prerequisites)
        ? fallback.prerequisites
        : [];
      const checks = Array.isArray(status.checks)
        ? status.checks
            .map((check) => {
              if (!check) return null;
              const label = String(check.label || '').trim();
              if (!label) return null;
              return {
                label,
                satisfied: Boolean(check.satisfied),
                unknown: Boolean(check.unknown)
              };
            })
            .filter(Boolean)
        : [];
      const sourceLabel = feat?.source || fallback?.source || '';
      const summaryText = feat?.summary || fallback?.summary || '';
      return {
        key: resolved,
        name: feat?.name || fallback?.name || resolved,
        source: sourceLabel,
        summary: summaryText,
        prerequisites,
        locked: Boolean(status.locked),
        checks
      };
    });
    structuredSelections = selectionDetails;
    selected = new Set(selectionDetails.map((entry) => entry.key));
    if (state.data) {
      state.data.feats = Array.from(selected);
      state.data.featSelections = selectionDetails.map((entry) => cloneSelection(entry));
      state.data.featBonusSlots = sanitizedBonus;
    }
    updateHiddenField({ data: selectionDetails, silent: !options.useFormValues });
    const lockedTotal = evaluated.filter((item) => item.status.locked).length;
    const selectedLocked = selectionDetails.filter((entry) => entry.locked).length;
    updateSummary(slotInfo, {
      selectedCount: selectionDetails.length,
      lockedTotal,
      selectedLocked
    });
    enforceNextButton();
    applyHighlights();
  }

  function handleCardClick(event) {
    const button = event.target.closest('[data-feat-card]');
    if (!button || button.disabled) return;
    const key = button.dataset.featCard;
    if (!key) return;
    const resolved = resolveFeatKey(key);
    if (!resolved) return;
    const previousStructured = structuredSelections.map((entry) => cloneSelection(entry));
    if (selected.has(resolved)) {
      selected.delete(resolved);
    } else {
      selected.add(resolved);
    }
    commitSelections(previousStructured);
    render({ useFormValues: true });
  }

  function handleFilterClick(event) {
    if (!filterContainer) return;
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    const filter = button.dataset.filter || 'all';
    if (filter === activeFilter) return;
    activeFilter = filter;
    Array.from(filterContainer.querySelectorAll('button[data-filter]')).forEach((node) => {
      node.setAttribute('aria-pressed', node.dataset.filter === activeFilter ? 'true' : 'false');
    });
    render({ useFormValues: true });
  }

  function handleSearchInput() {
    searchQuery = searchInput.value.trim().toLowerCase();
    render({ useFormValues: true });
  }

  function handleBonusInput(event) {
    const value = event.target.value;
    const sanitized = sanitizeBonusValue(value);
    if (state.data) {
      state.data.featBonusSlots = sanitized;
    }
    render({ useFormValues: true });
  }

  function handleBonusBlur() {
    if (!bonusInput) return;
    const sanitized = sanitizeBonusValue(bonusInput.value);
    if (bonusInput.value !== sanitized) {
      bonusInput.value = sanitized;
      bonusInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  return {
    setup(stepSection) {
      section = stepSection;
      summaryNode = section.querySelector('[data-feat-summary]');
      gridNode = section.querySelector('[data-feat-grid]');
      searchInput = section.querySelector('[data-feat-search]');
      filterContainer = section.querySelector('[data-feat-filters]');
      hiddenField = section.querySelector('[data-feat-field]');
      bonusInput = section.querySelector('[data-feat-bonus]');
      buildFeatList();
      syncSelectedFromData(state.data, { silent: true });
      if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
      }
      if (filterContainer) {
        filterContainer.addEventListener('click', handleFilterClick);
      }
      if (gridNode) {
      gridNode.addEventListener('click', handleCardClick);
      }
      if (bonusInput) {
        bonusInput.addEventListener('input', handleBonusInput);
        bonusInput.addEventListener('change', handleBonusBlur);
        bonusInput.addEventListener('blur', handleBonusBlur);
      }
      render();
    },
    onPackData() {
      buildFeatList();
      syncSelectedFromData(state.data, { silent: true });
      render();
    },
    onStateHydrated(currentState) {
      syncSelectedFromData(currentState?.data || state.data, { silent: true });
      render();
    },
    onStatePersisted() {
      render();
    },
    onFormInput(event) {
      const target = event.target;
      if (!target) return;
      if (abilityFields.some((field) => field.id === target.name)) {
        render({ useFormValues: true });
        return;
      }
      if (target.matches('[data-class-level]') || target.matches('[data-class-select]')) {
        render({ useFormValues: true });
        return;
      }
      if (target.name === 'featBonusSlots') {
        handleBonusInput(event);
      }
    },
    onFormChange(event) {
      const target = event.target;
      if (!target) return;
      if (target.matches('[data-class-level]') || target.matches('[data-class-select]')) {
        render({ useFormValues: true });
        return;
      }
      if (target.name === 'featBonusSlots') {
        handleBonusBlur();
      }
    },
    onStepChange(detail) {
      activeStep = detail?.id === 'feats';
      enforceNextButton();
      if (activeStep) {
        render({ useFormValues: true });
      }
    },
    applyQuickAdd(payloads = []) {
      if (!Array.isArray(payloads) || !payloads.length) {
        return null;
      }
      const applied = [];
      const additions = [];
      const duplicates = [];
      const missing = [];
      const previousSelected = new Set(selected);
      const previousStructured = structuredSelections.map((entry) => cloneSelection(entry));

      payloads.forEach((payload) => {
        if (!payload || typeof payload !== 'object') return;
        const candidate = payload.slug || payload.id || payload.name || payload.key;
        if (!candidate) {
          missing.push(payload);
          return;
        }
        const key = resolveFeatKey(candidate);
        if (!key) {
          missing.push(payload);
          return;
        }
        applied.push(payload);
        highlightKeys.add(key);
        if (selected.has(key)) {
          duplicates.push(getFeatEntry(key)?.name || key);
          return;
        }
        const feat = getFeatEntry(key);
        selected.add(key);
        additions.push(feat?.name || key);
      });

      if (!applied.length) {
        return { applied: [], message: '', undo: null };
      }

      let undo = null;
      let undoMessage = '';
      if (additions.length) {
        commitSelections(previousStructured);
        render({ useFormValues: true });
        undo = () => {
          selected = new Set(previousSelected);
          commitSelections(previousStructured);
          render({ useFormValues: true });
        };
        undoMessage = `Removed ${formatList(additions)} from feats.`;
      } else {
        render({ useFormValues: true });
      }

      let message = '';
      if (additions.length && duplicates.length) {
        message = `Added ${formatList(additions)} to feats. Already tracking ${formatList(duplicates)}.`;
      } else if (additions.length) {
        message = `Added ${formatList(additions)} to feats.`;
      } else if (duplicates.length) {
        message = `Already tracking ${formatList(duplicates)} in feats.`;
      }

      return {
        applied,
        message,
        undo,
        undoMessage: additions.length ? undoMessage : '',
        remaining: missing
      };
    }
  };
})();

const equipmentModule = (() => {
  const equipmentState = EQUIPMENT_CATEGORIES.reduce((acc, { key }) => {
    acc[key] = [];
    return acc;
  }, {});
  const groupRefs = new Map();
  const fieldRefs = new Map();
  let section = null;
  let summaryNode = null;
  let attunementFeedback = null;
  const highlightKeys = new Set();

  function syncStateFromData(data) {
    const parsed = getEquipmentRecordsFromFormData(data || {});
    EQUIPMENT_CATEGORIES.forEach(({ key }) => {
      const list = Array.isArray(parsed[key]) ? parsed[key] : [];
      equipmentState[key] = list.map((entry) => ({ ...entry }));
    });
  }

  function setFieldValue(category, list, { skipEvent = false } = {}) {
    const field = fieldRefs.get(category);
    if (!field) return;
    const payload = JSON.stringify(Array.isArray(list) ? list : []);
    field.value = payload;
    if (!skipEvent) {
      field.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function createRecordFromValue(value, quantity, category) {
    const trimmed = value ? String(value).trim() : '';
    if (!trimmed) return null;
    const item = findEntry(getPackData().items || [], trimmed);
    if (item) {
      return {
        slug: item.slug || null,
        id: item.id || null,
        name: item.name || trimmed,
        quantity: category === 'attunements' ? 1 : quantity,
        custom: false
      };
    }
    return {
      slug: null,
      id: null,
      name: trimmed,
      quantity: category === 'attunements' ? 1 : quantity,
    custom: true
  };
  }

  function categorizeQuickAddItem(item) {
    if (!item) return 'gear';
    const category = String(item.category || '').toLowerCase();
    if (category.includes('weapon')) return 'weapons';
    if (category.includes('armor') || category.includes('shield')) return 'armor';
    return 'gear';
  }

  function renderOptions() {
    const items = Array.isArray(getPackData().items) ? getPackData().items : [];
    const buckets = {
      weapons: [],
      armor: [],
      gear: [],
      attunements: []
    };
    items.forEach((item) => {
      const name = item?.name;
      const identifier = item?.slug || item?.id || name;
      if (!identifier || !name) return;
      const entry = {
        value: identifier,
        label: item.category ? `${name} (${item.category})` : name
      };
      const category = String(item.category || '').toLowerCase();
      if (category.includes('weapon')) {
        buckets.weapons.push(entry);
      }
      if (category.includes('armor') || category.includes('shield')) {
        buckets.armor.push(entry);
      }
      if (!category.includes('weapon') && !category.includes('armor') && !category.includes('shield')) {
        buckets.gear.push(entry);
      }
      if (itemRequiresAttunement(item)) {
        buckets.attunements.push(entry);
      }
    });
    if (!buckets.attunements.length) {
      items.forEach((item) => {
        const name = item?.name;
        const identifier = item?.slug || item?.id || name;
        if (!identifier || !name) return;
        const category = String(item.category || '').toLowerCase();
        if (/(wondrous|ring|rod|staff|wand)/.test(category)) {
          buckets.attunements.push({
            value: identifier,
            label: item.category ? `${name} (${item.category})` : name
          });
        }
      });
    }
    EQUIPMENT_CATEGORIES.forEach(({ key, datalist }) => {
      const list = document.getElementById(datalist);
      if (!list) return;
      list.innerHTML = '';
      const entries = buckets[key] || [];
      const seen = new Set();
      entries
        .sort((a, b) => a.label.localeCompare(b.label))
        .forEach(({ value, label }) => {
          if (!value) return;
          const uniqueKey = String(value).toLowerCase();
          if (seen.has(uniqueKey)) return;
          seen.add(uniqueKey);
          const option = document.createElement('option');
          option.value = value;
          option.label = label;
          list.appendChild(option);
        });
    });
  }

  function renderGroup(category, derivedEquipment) {
    const refs = groupRefs.get(category);
    if (!refs || !refs.list) return;
    const listNode = refs.list;
    listNode.innerHTML = '';
    const entries = equipmentState[category] || [];
    const derivedGroup = derivedEquipment?.groups?.[category] || [];
    if (!entries.length) {
      const empty = document.createElement('li');
      empty.className = 'equipment-empty';
      const config = EQUIPMENT_CATEGORIES.find((cfg) => cfg.key === category);
      empty.textContent = config ? config.empty : 'No items selected.';
      listNode.appendChild(empty);
      return;
    }
    entries.forEach((record) => {
      const key = getEquipmentRecordKey(record);
      const resolved = derivedGroup.find((entry) => entry.key === key) || null;
      const itemNode = document.createElement('li');
      itemNode.className = 'equipment-item';
      itemNode.dataset.key = key;
      if ((category === 'weapons' || category === 'armor') && resolved && resolved.proficient === false) {
        itemNode.dataset.state = 'warn';
      } else {
        itemNode.removeAttribute('data-state');
      }

      const main = document.createElement('div');
      main.className = 'equipment-item-main';
      const title = document.createElement('strong');
      title.textContent = resolved?.name || record.name || key || 'Item';
      main.appendChild(title);

      const metaParts = [];
      if (resolved?.category) metaParts.push(resolved.category);
      if (resolved?.weightEach) metaParts.push(`${formatWeight(resolved.weightEach)} each`);
      if (resolved?.source) metaParts.push(resolved.source);
      if (metaParts.length) {
        const meta = document.createElement('span');
        meta.className = 'equipment-item-meta';
        meta.textContent = metaParts.join(' · ');
        main.appendChild(meta);
      }

      const showProficiency = category === 'weapons' || category === 'armor';
      if (showProficiency) {
        const status = document.createElement('span');
        status.className = 'equipment-item-status';
        status.textContent = resolved && resolved.proficient === false ? '⚠️ Not proficient' : '✅ Proficient';
        main.appendChild(status);
      } else if (resolved && resolved.totalWeight) {
        const status = document.createElement('span');
        status.className = 'equipment-item-status';
        status.textContent = `${formatWeight(resolved.totalWeight)} total`;
        main.appendChild(status);
      }

      itemNode.appendChild(main);

      const controls = document.createElement('div');
      controls.className = 'equipment-item-controls';
      if (category !== 'attunements') {
        const label = document.createElement('label');
        label.textContent = 'Qty';
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.step = '1';
        input.value = String(record.quantity || 1);
        input.dataset.equipmentQuantityControl = 'true';
        input.dataset.equipmentCategory = category;
        input.dataset.equipmentKey = key;
        label.appendChild(input);
        controls.appendChild(label);
      }
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.dataset.equipmentRemove = 'true';
      remove.dataset.equipmentCategory = category;
      remove.dataset.equipmentKey = key;
      controls.appendChild(remove);
      itemNode.appendChild(controls);

      listNode.appendChild(itemNode);
      if (highlightKeys.has(key)) {
        highlightKeys.delete(key);
        requestAnimationFrame(() => {
          if (!itemNode.isConnected) return;
          itemNode.classList.add('quick-add-highlight');
          window.setTimeout(() => {
            if (itemNode.isConnected) {
              itemNode.classList.remove('quick-add-highlight');
            }
          }, 2000);
        });
      }
    });
  }

  function renderSummary(equipmentDerived) {
    if (attunementFeedback) {
      attunementFeedback.dataset.state = '';
    }
    if (!summaryNode) return;
    if (!equipmentDerived) {
      summaryNode.textContent = 'Add equipment to track proficiency and encumbrance.';
      summaryNode.dataset.state = '';
      if (attunementFeedback) {
        attunementFeedback.textContent = 'Choose up to three magic items requiring attunement.';
      }
      return;
    }
    const hasEntries = EQUIPMENT_CATEGORIES.some(({ key }) => (equipmentDerived.groups?.[key] || []).length > 0);
    if (!hasEntries) {
      summaryNode.textContent = 'Add equipment to track proficiency and encumbrance.';
      summaryNode.dataset.state = '';
      const attune = equipmentDerived.attunement || { count: 0, limit: ATTUNEMENT_LIMIT };
      if (attunementFeedback) {
        attunementFeedback.textContent = `Choose up to three magic items requiring attunement. (${attune.count}/${attune.limit})`;
      }
      return;
    }

    const weaponMismatches = equipmentDerived.proficiency?.weaponMismatches || [];
    const armorMismatches = equipmentDerived.proficiency?.armorMismatches || [];
    const attunement = equipmentDerived.attunement || { count: 0, limit: ATTUNEMENT_LIMIT, exceeded: false };
    const encumbrance = equipmentDerived.encumbrance || { totalWeight: 0, capacity: 0, nearLimit: false, overLimit: false };

    const statuses = [];
    if (weaponMismatches.length) {
      statuses.push(`⚠️ ${weaponMismatches.length} weapon${weaponMismatches.length === 1 ? '' : 's'} without proficiency`);
    } else {
      statuses.push('✅ Weapon proficiency');
    }
    if (armorMismatches.length) {
      statuses.push(`⚠️ ${armorMismatches.length} armor item${armorMismatches.length === 1 ? '' : 's'} without proficiency`);
    } else {
      statuses.push('✅ Armor proficiency');
    }
    const attuneLabel = `${attunement.count}/${attunement.limit} attuned`;
    if (attunement.exceeded) {
      statuses.push(`⚠️ Attunement exceeded (${attuneLabel})`);
    } else {
      statuses.push(`✅ Attunement ${attuneLabel}`);
    }
    if (encumbrance.capacity > 0) {
      const weightText = formatWeight(encumbrance.totalWeight);
      const capacityText = formatWeight(encumbrance.capacity);
      if (encumbrance.overLimit) {
        statuses.push(`⚠️ Over capacity (${weightText} / ${capacityText})`);
      } else if (encumbrance.nearLimit) {
        statuses.push(`⚠️ Near capacity (${weightText} / ${capacityText})`);
      } else {
        statuses.push(`✅ Weight ${weightText} of ${capacityText}`);
      }
    } else {
      statuses.push(`Equipment weight ${formatWeight(encumbrance.totalWeight)}`);
    }

    summaryNode.innerHTML = statuses.join(' · ');
    const hasWarning = weaponMismatches.length > 0 || armorMismatches.length > 0 || attunement.exceeded || encumbrance.overLimit;
    summaryNode.dataset.state = hasWarning ? 'warn' : 'ok';

    if (attunementFeedback) {
      if (attunement.exceeded) {
        attunementFeedback.textContent = `⚠️ Attunement slots exceeded (${attunement.count}/${attunement.limit}).`;
        attunementFeedback.dataset.state = 'warn';
      } else {
        attunementFeedback.textContent = `Choose up to three magic items requiring attunement. (${attunement.count}/${attunement.limit})`;
        attunementFeedback.dataset.state = '';
      }
    }
  }

  function render(options = {}) {
    if (!section) return;
    const useFormValues = options.useFormValues === true;
    const snapshot = useFormValues ? serializeForm() : state.data;
    if (!snapshot) return;
    const baseDerived = useFormValues ? computeDerivedState(snapshot) : state.derived;
    const equipmentDerived = baseDerived && baseDerived.equipment
      ? baseDerived.equipment
      : computeEquipmentDerived(snapshot, baseDerived?.abilities || {});
    syncStateFromData(snapshot);
    EQUIPMENT_CATEGORIES.forEach(({ key }) => renderGroup(key, equipmentDerived));
    renderSummary(equipmentDerived);
    section.dataset.itemCount = String((getPackData().items || []).length);
  }

  function totalAttunementCount() {
    return (equipmentState.attunements || []).reduce((sum, entry) => {
      const qty = Number.isFinite(entry.quantity) ? entry.quantity : 1;
      return sum + Math.max(1, qty);
    }, 0);
  }

  function handleAdd(category) {
    const refs = groupRefs.get(category);
    if (!refs || !refs.input) return;
    const rawValue = refs.input.value;
    const quantityValue = refs.quantity ? Number.parseInt(refs.quantity.value, 10) : 1;
    const quantity = Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 1;
    if (category === 'attunements' && totalAttunementCount() >= ATTUNEMENT_LIMIT) {
      if (attunementFeedback) {
        attunementFeedback.textContent = `⚠️ Attunement slots are full (${ATTUNEMENT_LIMIT}/${ATTUNEMENT_LIMIT}).`;
        attunementFeedback.dataset.state = 'warn';
      }
      return;
    }
    const record = createRecordFromValue(rawValue, quantity, category);
    if (!record) return;
    const next = mergeEquipmentEntries([...(equipmentState[category] || []), record]);
    equipmentState[category] = next;
    setFieldValue(category, next);
    refs.input.value = '';
    if (refs.quantity) {
      refs.quantity.value = '1';
    }
    render({ useFormValues: true });
  }

  function handleRemove(category, key) {
    const current = equipmentState[category] || [];
    const filtered = current.filter((entry) => getEquipmentRecordKey(entry) !== key);
    equipmentState[category] = filtered;
    setFieldValue(category, filtered);
    render({ useFormValues: true });
  }

  function handleQuantity(category, key, rawValue) {
    const value = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(value)) {
      return;
    }
    if (value <= 0) {
      handleRemove(category, key);
      return;
    }
    const updated = (equipmentState[category] || []).map((entry) => {
      if (getEquipmentRecordKey(entry) !== key) return entry;
      return { ...entry, quantity: value };
    });
    equipmentState[category] = updated;
    setFieldValue(category, updated);
    render({ useFormValues: true });
  }

  function handleClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.equipmentAction;
    if (action === 'add') {
      event.preventDefault();
      const category = target.dataset.equipmentCategory;
      if (category) {
        handleAdd(category);
      }
      return;
    }
    if ('equipmentRemove' in target.dataset) {
      event.preventDefault();
      const category = target.dataset.equipmentCategory;
      const key = target.dataset.equipmentKey;
      if (category && key) {
        handleRemove(category, key);
      }
    }
  }

  function handleInputEvent(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.matches('[data-equipment-field]')) {
      return;
    }
    if (target.dataset.equipmentQuantityControl) {
      const category = target.dataset.equipmentCategory;
      const key = target.dataset.equipmentKey;
      if (category && key) {
        handleQuantity(category, key, target.value);
      }
    }
  }

  function handleKeydown(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!('equipmentInput' in target.dataset)) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      const group = target.closest('[data-equipment-group]');
      const category = group ? group.dataset.equipmentGroup : null;
      if (category) {
        handleAdd(category);
      }
    }
  }

  return {
    setup(node) {
      section = node;
      summaryNode = section.querySelector('[data-equipment-summary]');
      attunementFeedback = section.querySelector('[data-equipment-feedback]');
      EQUIPMENT_CATEGORIES.forEach(({ key, field }) => {
        const groupNode = section.querySelector(`[data-equipment-group="${key}"]`);
        if (groupNode) {
          const input = groupNode.querySelector('[data-equipment-input]');
          const quantity = groupNode.querySelector('[data-equipment-quantity]');
          const list = groupNode.querySelector('[data-equipment-list]');
          groupRefs.set(key, { node: groupNode, input, quantity, list });
          if (input) {
            input.dataset.equipmentInput = 'true';
          }
        }
        const fieldNode = section.querySelector(`[data-equipment-field="${key}"]`);
        if (fieldNode) {
          fieldRefs.set(key, fieldNode);
          if (!fieldNode.value) {
            fieldNode.value = '[]';
          }
        }
      });
      section.addEventListener('click', handleClick);
      section.addEventListener('input', handleInputEvent);
      section.addEventListener('keydown', handleKeydown);
      renderOptions();
      render({ useFormValues: true });
    },
    onPackData() {
      renderOptions();
      render({ useFormValues: true });
    },
    onStateHydrated(currentState) {
      syncStateFromData(currentState?.data || state.data);
      render();
    },
    onFormInput(event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.matches('[data-equipment-field]')) return;
      if (abilityFields.some((field) => field.id === target.name)) {
        render({ useFormValues: true });
      }
    },
    onFormChange(event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.matches('[data-class-select], [data-class-level]')) {
        render({ useFormValues: true });
      }
    },
    onStatePersisted() {
      render();
    },
    applyQuickAdd(payloads = []) {
      if (!Array.isArray(payloads) || !payloads.length) {
        return null;
      }
      const applied = [];
      const missing = [];
      const updates = new Map();
      const previous = new Map();
      const additions = [];

      payloads.forEach((payload) => {
        if (!payload || typeof payload !== 'object') return;
        const type = String(payload.type || '').toLowerCase();
        if (type && type !== 'item') {
          missing.push(payload);
          return;
        }
        const identifier = payload.slug || payload.id || payload.name;
        if (!identifier) {
          missing.push(payload);
          return;
        }
        const item = findEntry(getPackData().items || [], identifier);
        if (!item) {
          missing.push(payload);
          return;
        }
        const category = categorizeQuickAddItem(item);
        if (!category) {
          missing.push(payload);
          return;
        }
        const current = updates.has(category)
          ? updates.get(category)
          : (equipmentState[category] || []).map((entry) => ({ ...entry }));
        if (!previous.has(category)) {
          previous.set(category, (equipmentState[category] || []).map((entry) => ({ ...entry })));
        }
        const record = {
          slug: item.slug || null,
          id: item.id || null,
          name: item.name || identifier,
          quantity: category === 'attunements' ? 1 : 1,
          custom: false,
          notes: ''
        };
        const key = getEquipmentRecordKey(record);
        const next = mergeEquipmentEntries([...current, record]);
        updates.set(category, next);
        const nextEntry = next.find((entry) => getEquipmentRecordKey(entry) === key) || record;
        const totalQuantity = Number.isFinite(nextEntry.quantity) ? nextEntry.quantity : 1;
        const wasNew = !current.some((entry) => getEquipmentRecordKey(entry) === key);
        highlightKeys.add(key);
        applied.push(payload);
        additions.push({
          name: item.name || record.name || key,
          category,
          newEntry: wasNew,
          total: totalQuantity
        });
      });

      if (!applied.length) {
        return { applied: [], message: '', undo: null, remaining: missing };
      }

      updates.forEach((list, category) => {
        equipmentState[category] = list.map((entry) => ({ ...entry }));
        setFieldValue(category, list);
      });
      render({ useFormValues: true });

      let undo = null;
      let undoMessage = '';
      if (previous.size) {
        undo = () => {
          previous.forEach((list, category) => {
            equipmentState[category] = list.map((entry) => ({ ...entry }));
            setFieldValue(category, equipmentState[category]);
          });
          render({ useFormValues: true });
        };
        if (additions.length) {
          undoMessage = `Removed ${formatList(additions.map((entry) => entry.name))} from equipment.`;
        }
      }

      const labels = additions.map((entry) => {
        if (entry.newEntry) return entry.name;
        return `${entry.name} (now ${entry.total})`;
      });
      const message = labels.length
        ? `Added ${formatList(labels)} to equipment.`
        : 'Updated equipment.';

      return {
        applied,
        message,
        undo,
        undoMessage,
        remaining: missing
      };
    }
  };
})();

const familiarModule = (() => {
  let section = null;
  let listNode = null;
  let detailNode = null;
  let searchInput = null;
  let emptyState = null;
  let hiddenField = null;
  let nameField = null;
  let notesField = null;
  const filterNodes = new Map();
  const overrideInputs = new Map();

  let wildshapeRoot = null;
  let wildshapeListNode = null;
  let wildshapeDetailNode = null;
  let wildshapeEmptyState = null;
  let wildshapeTrackedNode = null;
  let wildshapeTrackedList = null;
  let wildshapeTrackedEmpty = null;
  let wildshapeSearchInput = null;
  const wildshapeFilterNodes = new Map();

  let companions = [];
  let companionMap = new Map();
  let filtered = [];
  let searchTerm = '';
  let activeFilters = { cr: '', feature: '' };
  let selectedKey = '';
  let selectedRawId = '';
  let syncing = false;
  let entryOrder = 0;
  let beastEntryOrder = 0;
  let lastSnapshot = null;

  let beasts = [];
  let beastMap = new Map();
  let beastFiltered = [];
  let beastSearchTerm = '';
  let beastFilters = { cr: '' };
  let beastSelectedKey = '';
  let trackedForms = [];

  function normalizeId(value) {
    return value ? String(value).trim().toLowerCase() : '';
  }

  function formatSkills(value) {
    if (!value) return '';
    if (Array.isArray(value)) {
      return value
        .map((entry) => (entry && typeof entry === 'object' ? `${entry.name || entry.skill || ''} ${entry.value || entry.bonus || ''}` : entry))
        .filter(Boolean)
        .map((entry) => String(entry).trim())
        .filter(Boolean)
        .join(', ');
    }
    if (typeof value === 'object') {
      return Object.entries(value)
        .map(([key, val]) => `${key} ${val}`)
        .join(', ');
    }
    return String(value);
  }

  function formatSenses(value) {
    if (!value) return '';
    if (Array.isArray(value)) {
      return value
        .map((entry) => (entry && typeof entry === 'object' ? entry.name || entry.type || entry.value || '' : entry))
        .filter(Boolean)
        .map((entry) => String(entry).trim())
        .filter(Boolean)
        .join(', ');
    }
    if (typeof value === 'object') {
      return Object.values(value)
        .map((entry) => String(entry).trim())
        .filter(Boolean)
        .join(', ');
    }
    return String(value);
  }

  function parseCrValue(value) {
    if (value === null || value === undefined || value === '') return Number.POSITIVE_INFINITY;
    if (typeof value === 'number') return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
    const text = String(value).trim();
    if (!text) return Number.POSITIVE_INFINITY;
    if (text.includes('/')) {
      const [num, denom] = text.split('/');
      const numerator = Number.parseFloat(num);
      const denominator = Number.parseFloat(denom);
      if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) {
        return numerator / denominator;
      }
    }
    const numeric = Number.parseFloat(text);
    return Number.isFinite(numeric) ? numeric : Number.POSITIVE_INFINITY;
  }

  function formatSpeed(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value)) {
      return value
        .map((entry) => (entry && typeof entry === 'object' && 'label' in entry ? entry.label : entry))
        .filter(Boolean)
        .map((entry) => String(entry).trim())
        .filter(Boolean)
        .join(', ');
    }
    if (typeof value === 'object') {
      const entries = [];
      Object.entries(value).forEach(([mode, raw]) => {
        if (raw === null || raw === undefined) return;
        if (typeof raw === 'object') {
          const distance = raw.distance || raw.value || raw.speed || raw.amount;
          if (distance) {
            entries.push(`${mode.replace(/_/g, ' ')} ${distance}`);
          }
        } else {
          entries.push(`${mode.replace(/_/g, ' ')} ${raw}`);
        }
      });
      return entries.join(', ');
    }
    return String(value);
  }

  function collectFeatureLabel(target, value) {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((entry) => collectFeatureLabel(target, entry));
      return;
    }
    if (typeof value === 'object') {
      if ('name' in value) {
        collectFeatureLabel(target, value.name);
      }
      if ('feature' in value) {
        collectFeatureLabel(target, value.feature);
      }
      if ('title' in value) {
        collectFeatureLabel(target, value.title);
      }
      if ('label' in value) {
        collectFeatureLabel(target, value.label);
      }
      return;
    }
    const text = String(value);
    text.split(/[;,]/).forEach((part) => {
      const trimmed = part.trim();
      if (trimmed) {
        target.push(trimmed);
      }
    });
  }

  function extractFeatures(entry) {
    const features = [];
    const candidates = [
      entry.requiredFeatures,
      entry.requirements,
      entry.requirement,
      entry.requires,
      entry.prerequisites,
      entry.featureRequirements,
      entry.featuresRequired,
      entry.prerequisiteFeatures
    ];
    candidates.forEach((candidate) => collectFeatureLabel(features, candidate));
    return Array.from(new Set(features));
  }

  function normalizeTraits(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .map((entry) => {
          if (!entry && entry !== 0) return null;
          if (typeof entry === 'string') return entry.trim();
          if (typeof entry === 'object') {
            const name = entry.name || entry.title || '';
            const text = entry.desc || entry.description || entry.text || '';
            return [name, text].filter(Boolean).join('. ').trim();
          }
          return String(entry).trim();
        })
        .filter(Boolean);
    }
    if (typeof value === 'string') {
      return [value.trim()].filter(Boolean);
    }
    return [];
  }

  function normalizeCompanion(entry) {
    if (!entry) return null;
    const id = entry.slug || entry.id || entry.name;
    if (!id) return null;
    const name = entry.name || id;
    const ac = Number.isFinite(entry.armor_class)
      ? entry.armor_class
      : Number.isFinite(entry.ac)
        ? entry.ac
        : Number.isFinite(entry.armorClass)
          ? entry.armorClass
          : null;
    const hp = Number.isFinite(entry.hit_points)
      ? entry.hit_points
      : Number.isFinite(entry.hp)
        ? entry.hp
        : Number.isFinite(entry.hitPoints)
          ? entry.hitPoints
          : null;
    const speed = formatSpeed(entry.speed || entry.speeds || entry.movement || entry.movementModes);
    const crLabel = entry.challenge_rating || entry.challengeRating || entry.cr || '';
    const crText = crLabel ? String(crLabel).trim() : '';
    const crKey = crText.toLowerCase();
    const crValue = parseCrValue(crLabel);
    const features = extractFeatures(entry);
    const featureKeys = features.map((feature) => feature.toLowerCase());
    const senses = Array.isArray(entry.senses) ? entry.senses.join(', ') : (entry.senses || '');
    const skills = Array.isArray(entry.skills) ? entry.skills.join(', ') : (entry.skills || '');
    const traits = normalizeTraits(entry.traits);
    const size = entry.size || '';
    const type = entry.type || entry.creature_type || entry.category || '';
    const alignment = entry.alignment || '';
    const source = (entry.source && entry.source.name) || entry.sourceId || '';
    const tags = [];
    if (size) tags.push(size);
    if (type) tags.push(type);
    if (crText) tags.push(`CR ${crText}`);
    const extraTags = Array.isArray(entry.tags) ? entry.tags : [];
    extraTags.forEach((tag) => {
      if (tag) {
        tags.push(String(tag));
      }
    });
    const searchTokens = [
      name,
      entry.summary,
      entry.description,
      size,
      type,
      alignment,
      senses,
      skills,
      tags.join(' '),
      traits.join(' '),
      features.join(' ')
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const normalized = {
      id,
      key: normalizeId(id),
      name,
      summary: entry.summary || entry.description || '',
      ac,
      hp,
      speed,
      crLabel: crText,
      crKey,
      crValue,
      features,
      featureKeys,
      senses,
      skills,
      traits,
      size,
      type,
      alignment,
      source,
      tags,
      searchTokens,
      order: entryOrder += 1
    };
    return normalized;
  }

  function parseCompanionStat(value) {
    if (Number.isFinite(value)) return value;
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i += 1) {
        const parsed = parseCompanionStat(value[i]);
        if (parsed !== null && parsed !== undefined) {
          return parsed;
        }
      }
      return null;
    }
    if (value && typeof value === 'object') {
      const candidates = [value.value, value.base, value.amount, value.score, value.max];
      for (let i = 0; i < candidates.length; i += 1) {
        const parsed = parseCompanionStat(candidates[i]);
        if (parsed !== null && parsed !== undefined) {
          return parsed;
        }
      }
      return null;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function sanitizeCompanionMeta(meta) {
    if (!meta || typeof meta !== 'object') return null;
    const id = meta.slug || meta.id || meta.name;
    const snapshotId = id ? String(id).trim() : '';
    if (!snapshotId) return null;
    const source = meta.source && typeof meta.source === 'object'
      ? meta.source.name || meta.source.title || meta.source.id || ''
      : meta.source;
    const traits = normalizeTraits(meta.traits);
    const features = Array.isArray(meta.features)
      ? meta.features.map((entry) => String(entry).trim()).filter(Boolean)
      : [];
    return {
      id: snapshotId,
      name: meta.name ? String(meta.name) : snapshotId,
      summary: meta.summary ? String(meta.summary) : '',
      ac: parseCompanionStat(meta.ac ?? meta.armor_class ?? meta.armorClass),
      hp: parseCompanionStat(meta.hp ?? meta.hit_points ?? meta.hitPoints),
      speed: formatSpeed(meta.speed ?? meta.speeds ?? meta.movement ?? meta.movementModes),
      cr: meta.crLabel ?? meta.cr ?? meta.challenge_rating ?? meta.challengeRating ?? '',
      size: meta.size ? String(meta.size) : '',
      type: (meta.type || meta.creature_type || meta.category)
        ? String(meta.type || meta.creature_type || meta.category)
        : '',
      alignment: meta.alignment ? String(meta.alignment) : '',
      senses: Array.isArray(meta.senses) ? meta.senses.join(', ') : (meta.senses ? String(meta.senses) : ''),
      skills: Array.isArray(meta.skills) ? meta.skills.join(', ') : (meta.skills ? String(meta.skills) : ''),
      traits,
      features,
      source: source ? String(source) : ''
    };
  }

  function createCompanionSnapshot(entry) {
    if (!entry) return null;
    return sanitizeCompanionMeta({
      id: entry.id,
      name: entry.name,
      summary: entry.summary,
      ac: entry.ac,
      hp: entry.hp,
      speed: entry.speed,
      crLabel: entry.crLabel,
      size: entry.size,
      type: entry.type,
      alignment: entry.alignment,
      senses: entry.senses,
      skills: entry.skills,
      traits: entry.traits,
      features: entry.features,
      source: entry.source
    });
  }

  function normalizeBeast(entry) {
    if (!entry) return null;
    const creatureType = entry.creatureType || entry.creature_type || entry.type || '';
    if (!creatureType || !/beast/i.test(String(creatureType))) {
      return null;
    }
    const id = entry.slug || entry.id || entry.name;
    const key = normalizeId(id);
    if (!key) return null;
    const name = entry.name ? String(entry.name) : id;
    const ac = parseCompanionStat(entry.ac ?? entry.armorClass ?? entry.armor_class);
    const hp = parseCompanionStat(entry.hp ?? entry.hitPoints ?? entry.hit_points);
    const speed = formatSpeed(entry.speed ?? entry.speeds ?? entry.movement);
    const crText = entry.cr ?? entry.challengeRating ?? entry.challenge_rating ?? '';
    const crLabel = crText ? String(crText) : '';
    const crValue = parseCrValue(crLabel);
    const size = entry.size ? String(entry.size) : '';
    const alignment = entry.alignment ? String(entry.alignment) : '';
    const senses = formatSenses(entry.senses);
    const skills = formatSkills(entry.skills);
    const traits = normalizeTraits(entry.traits);
    const summary = entry.summary || entry.description || '';
    const source = entry.source && typeof entry.source === 'object'
      ? entry.source.name || entry.source.title || entry.source.id || ''
      : entry.sourceId || entry.source || '';
    const searchTokens = [
      name,
      summary,
      traits.join(' '),
      senses,
      skills,
      size,
      alignment,
      creatureType
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return {
      id,
      key,
      name,
      summary,
      ac,
      hp,
      speed,
      crLabel,
      crValue,
      size,
      type: String(creatureType),
      alignment,
      senses,
      skills,
      traits,
      source: source ? String(source) : '',
      searchTokens,
      order: (beastEntryOrder += 1)
    };
  }

  function sanitizeBeastMeta(meta) {
    if (!meta || typeof meta !== 'object') return null;
    const id = meta.slug || meta.id || meta.name;
    const snapshotId = id ? String(id).trim() : '';
    if (!snapshotId) return null;
    return {
      id: snapshotId,
      name: meta.name ? String(meta.name) : snapshotId,
      summary: meta.summary ? String(meta.summary) : '',
      ac: parseCompanionStat(meta.ac ?? meta.armorClass ?? meta.armor_class),
      hp: parseCompanionStat(meta.hp ?? meta.hitPoints ?? meta.hit_points),
      speed: formatSpeed(meta.speed ?? meta.speeds ?? meta.movement),
      cr: meta.crLabel ?? meta.cr ?? meta.challengeRating ?? meta.challenge_rating ?? '',
      size: meta.size ? String(meta.size) : '',
      type: meta.type ? String(meta.type) : '',
      alignment: meta.alignment ? String(meta.alignment) : '',
      senses: formatSenses(meta.senses),
      skills: formatSkills(meta.skills),
      traits: normalizeTraits(meta.traits),
      source: meta.source ? String(meta.source) : ''
    };
  }

  function createBeastSnapshot(entry) {
    if (!entry) return null;
    return sanitizeBeastMeta({
      id: entry.id,
      name: entry.name,
      summary: entry.summary,
      ac: entry.ac,
      hp: entry.hp,
      speed: entry.speed,
      crLabel: entry.crLabel,
      size: entry.size,
      type: entry.type,
      alignment: entry.alignment,
      senses: entry.senses,
      skills: entry.skills,
      traits: entry.traits,
      source: entry.source
    });
  }

  function normalizeTrackedForm(entry) {
    if (!entry || typeof entry !== 'object') return null;
    const id = entry.id || entry.slug || entry.name;
    const key = normalizeId(id);
    if (!key) return null;
    const snapshot = sanitizeBeastMeta(entry.meta || entry);
    if (!snapshot) return null;
    return {
      id: snapshot.id,
      key,
      name: snapshot.name,
      summary: snapshot.summary || entry.summary || '',
      ac: snapshot.ac,
      hp: snapshot.hp,
      speed: snapshot.speed,
      cr: snapshot.cr || entry.cr || '',
      size: snapshot.size,
      type: snapshot.type,
      alignment: snapshot.alignment,
      senses: snapshot.senses,
      skills: snapshot.skills,
      traits: Array.isArray(snapshot.traits) ? snapshot.traits.slice() : [],
      source: snapshot.source,
      meta: snapshot
    };
  }

  function compareBeasts(a, b) {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    const aFinite = Number.isFinite(a.crValue);
    const bFinite = Number.isFinite(b.crValue);
    if (aFinite && bFinite && a.crValue !== b.crValue) {
      return a.crValue - b.crValue;
    }
    if (aFinite && !bFinite) {
      return -1;
    }
    if (!aFinite && bFinite) {
      return 1;
    }
    const nameCompare = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    if (nameCompare !== 0) {
      return nameCompare;
    }
    return a.order - b.order;
  }

  function rebuildCompanions() {
    const data = getPackData();
    const entries = Array.isArray(data?.companions) ? data.companions : [];
    entryOrder = 0;
    companions = entries
      .map(normalizeCompanion)
      .filter(Boolean);
    companionMap = new Map();
    companions.forEach((entry) => {
      companionMap.set(entry.key, entry);
    });
  }

  function rebuildBeasts() {
    const data = getPackData();
    const entries = Array.isArray(data?.monsters) ? data.monsters : [];
    beastEntryOrder = 0;
    beasts = entries
      .map(normalizeBeast)
      .filter(Boolean)
      .sort(compareBeasts);
    beastMap = new Map();
    beasts.forEach((entry) => {
      beastMap.set(entry.key, entry);
    });
  }

  function populateFilterOptions() {
    const crSelect = filterNodes.get('cr');
    if (crSelect) {
      const previous = crSelect.value;
      while (crSelect.options.length > 1) {
        crSelect.remove(1);
      }
      const seenCr = new Map();
      companions.forEach((entry) => {
        if (!entry.crKey) return;
        if (!seenCr.has(entry.crKey)) {
          seenCr.set(entry.crKey, { label: entry.crLabel, sort: entry.crValue });
        }
      });
      Array.from(seenCr.entries())
        .sort((a, b) => {
          if (a[1].sort !== b[1].sort) {
            return a[1].sort - b[1].sort;
          }
          return a[1].label.localeCompare(b[1].label, undefined, { sensitivity: 'base' });
        })
        .forEach(([key, meta]) => {
          const option = document.createElement('option');
          option.value = key;
          option.textContent = meta.label;
          crSelect.appendChild(option);
        });
      if (previous && seenCr.has(previous)) {
        crSelect.value = previous;
      } else {
        crSelect.value = '';
        activeFilters.cr = '';
      }
    }

    const featureSelect = filterNodes.get('feature');
    if (featureSelect) {
      const previous = featureSelect.value;
      while (featureSelect.options.length > 1) {
        featureSelect.remove(1);
      }
      const seenFeatures = new Map();
      companions.forEach((entry) => {
        entry.featureKeys.forEach((key, index) => {
          if (!key) return;
          if (!seenFeatures.has(key)) {
            seenFeatures.set(key, entry.features[index]);
          }
        });
      });
      Array.from(seenFeatures.entries())
        .sort((a, b) => a[1].localeCompare(b[1], undefined, { sensitivity: 'base' }))
        .forEach(([key, label]) => {
          const option = document.createElement('option');
          option.value = key;
          option.textContent = label;
          featureSelect.appendChild(option);
        });
      if (previous && seenFeatures.has(previous)) {
        featureSelect.value = previous;
      } else {
        featureSelect.value = '';
        activeFilters.feature = '';
      }
    }
  }

  function applyFilters() {
    const search = searchTerm.trim().toLowerCase();
    const crFilter = activeFilters.cr;
    const featureFilter = activeFilters.feature;
    filtered = companions.filter((entry) => {
      if (crFilter && entry.crKey !== crFilter) return false;
      if (featureFilter && !entry.featureKeys.includes(featureFilter)) return false;
      if (search) {
        const haystack = entry.searchTokens;
        if (!haystack.includes(search)) {
          const partial = haystack.split(/\s+/).some((token) => token.startsWith(search));
          if (!partial) {
            return false;
          }
        }
      }
      return true;
    });
    filtered.sort((a, b) => {
      if (a.crValue !== b.crValue) {
        return a.crValue - b.crValue;
      }
      const nameCompare = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      if (nameCompare !== 0) {
        return nameCompare;
      }
      return a.order - b.order;
    });
  }

  function populateBeastFilterOptions() {
    const crSelect = wildshapeFilterNodes.get('cr');
    if (!crSelect) return;
    const previous = crSelect.value;
    while (crSelect.options.length > 1) {
      crSelect.remove(1);
    }
    const seen = new Map();
    beasts.forEach((entry) => {
      if (!Number.isFinite(entry.crValue)) return;
      const key = entry.crValue;
      if (!seen.has(key)) {
        seen.set(key, { value: key, label: entry.crLabel || String(entry.crValue) });
      }
    });
    Array.from(seen.values())
      .sort((a, b) => a.value - b.value)
      .forEach((meta) => {
        const option = document.createElement('option');
        option.value = String(meta.value);
        option.textContent = meta.label;
        crSelect.appendChild(option);
      });
    if (previous && seen.has(Number.parseFloat(previous))) {
      crSelect.value = previous;
    } else {
      crSelect.value = '';
      beastFilters.cr = '';
    }
  }

  function applyBeastFilters() {
    const search = beastSearchTerm.trim().toLowerCase();
    const crFilter = beastFilters.cr ? Number.parseFloat(beastFilters.cr) : null;
    beastFiltered = beasts.filter((entry) => {
      if (Number.isFinite(crFilter) && entry.crValue > crFilter) {
        return false;
      }
      if (search) {
        if (!entry.searchTokens.includes(search)) {
          const haystack = `${entry.name} ${entry.summary}`.toLowerCase();
          if (!haystack.includes(search)) {
            return false;
          }
        }
      }
      return true;
    });
    beastFiltered.sort(compareBeasts);
  }

  function renderList() {
    if (!listNode) return;
    listNode.innerHTML = '';
    if (!filtered.length) {
      if (emptyState) {
        emptyState.hidden = false;
        listNode.appendChild(emptyState);
      }
      section?.setAttribute('data-companion-count', String(companions.length));
      return;
    }
    if (emptyState) {
      emptyState.hidden = true;
    }
    filtered.forEach((entry) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'companion-option';
      button.dataset.companionId = entry.id;
      button.dataset.active = entry.key === selectedKey ? 'true' : 'false';
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', entry.key === selectedKey ? 'true' : 'false');
      const summary = entry.summary ? `<small>${entry.summary}</small>` : '';
      const tags = entry.tags.length
        ? `<div class="companion-tags">${entry.tags.map((tag) => `<span>${tag}</span>`).join('')}</div>`
        : '';
      button.innerHTML = `
        <div>
          <strong>${entry.name}</strong>
          ${summary}
        </div>
        ${tags}
      `;
      listNode.appendChild(button);
    });
    section?.setAttribute('data-companion-count', String(companions.length));
  }

  function formatChip(label, value, override, baseValue) {
    if (value === null || value === undefined || value === '') return '';
    const baseNote = override && baseValue !== null && baseValue !== undefined && baseValue !== ''
      ? ` · base ${baseValue}`
      : '';
    const note = override ? `<span>override${baseNote}</span>` : '';
    return `<span class="companion-chip">${label} <strong>${value}</strong>${note}</span>`;
  }

  function renderDetail() {
    if (!detailNode) return;
    const entry = companionMap.get(selectedKey) || null;
    const overrides = getOverrides();
    if (!entry) {
      detailNode.innerHTML = '<p>Select a companion to view its statistics and description.</p>';
      return;
    }
    const acOverride = Number.isFinite(overrides.ac) ? overrides.ac : null;
    const hpOverride = Number.isFinite(overrides.hp) ? overrides.hp : null;
    const speedOverride = overrides.speed ? overrides.speed : '';
    const acDisplay = acOverride ?? entry.ac;
    const hpDisplay = hpOverride ?? entry.hp;
    const speedDisplay = speedOverride || entry.speed;
    const subtitleParts = [];
    if (entry.crLabel) subtitleParts.push(`CR ${entry.crLabel}`);
    if (entry.size) subtitleParts.push(entry.size);
    if (entry.type) subtitleParts.push(entry.type);
    if (entry.alignment) subtitleParts.push(entry.alignment);
    const subtitle = subtitleParts.join(' · ');
    const customName = nameField ? nameField.value.trim() : '';
    const chips = [
      formatChip('AC', acDisplay, Number.isFinite(acOverride), entry.ac),
      formatChip('HP', hpDisplay, Number.isFinite(hpOverride), entry.hp),
      formatChip('Speed', speedDisplay, Boolean(speedOverride), entry.speed)
    ].filter(Boolean).join('');
    const detailLines = [];
    if (entry.features.length) {
      detailLines.push(`<dt>Requires</dt><dd>${entry.features.join(', ')}</dd>`);
    }
    if (entry.senses) {
      detailLines.push(`<dt>Senses</dt><dd>${entry.senses}</dd>`);
    }
    if (entry.skills) {
      detailLines.push(`<dt>Skills</dt><dd>${entry.skills}</dd>`);
    }
    if (entry.traits.length) {
      detailLines.push(`<dt>Traits</dt><dd>${entry.traits.join('<br />')}</dd>`);
    }
    if (entry.source) {
      detailLines.push(`<dt>Source</dt><dd>${entry.source}</dd>`);
    }
    const trackingLine = customName && customName.toLowerCase() !== entry.name.toLowerCase()
      ? `<p>Tracking as <strong>${customName}</strong>.</p>`
      : '';
    detailNode.innerHTML = `
      <header>
        <h3>${entry.name}</h3>
        ${subtitle ? `<span>${subtitle}</span>` : ''}
      </header>
      ${entry.summary ? `<p>${entry.summary}</p>` : ''}
      ${chips ? `<div class="companion-stats">${chips}</div>` : ''}
      ${trackingLine}
      ${detailLines.length ? `<dl>${detailLines.join('')}</dl>` : ''}
    `;
  }

  function ensureBeastSelection({ notify = false } = {}) {
    const previousKey = beastSelectedKey;
    const hasInFiltered = beastSelectedKey
      ? beastFiltered.some((entry) => entry.key === beastSelectedKey)
      : false;
    if (!hasInFiltered) {
      if (beastFiltered.length) {
        beastSelectedKey = beastFiltered[0].key;
      } else {
        beastSelectedKey = '';
      }
    }
    const changed = previousKey !== beastSelectedKey;
    if (changed && notify) {
      syncHiddenField(true);
    }
    return changed;
  }

  function setBeastSelection(id, { userTriggered = false } = {}) {
    const key = normalizeId(id);
    if (key && (beastMap.has(key) || trackedForms.some((form) => form.key === key))) {
      beastSelectedKey = key;
    } else if (key === '') {
      beastSelectedKey = '';
    } else {
      ensureBeastSelection();
    }
    renderWildshapeList();
    renderWildshapeDetail();
    renderTrackedForms();
    if (userTriggered) {
      syncHiddenField(true);
    }
  }

  function renderWildshapeList() {
    if (!wildshapeListNode) return;
    wildshapeListNode.innerHTML = '';
    if (!beastFiltered.length) {
      if (wildshapeEmptyState) {
        wildshapeEmptyState.hidden = false;
        wildshapeListNode.appendChild(wildshapeEmptyState);
      }
      return;
    }
    if (wildshapeEmptyState) {
      wildshapeEmptyState.hidden = true;
    }
    beastFiltered.forEach((entry) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'wildshape-option';
      button.dataset.beastId = entry.id;
      button.dataset.active = entry.key === beastSelectedKey ? 'true' : 'false';
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', entry.key === beastSelectedKey ? 'true' : 'false');
      const subtitle = entry.summary ? `<small>${entry.summary}</small>` : '';
      const tags = [];
      if (entry.crLabel) tags.push(`CR ${entry.crLabel}`);
      if (entry.size) tags.push(entry.size);
      if (entry.type) tags.push(entry.type);
      const tagMarkup = tags.length
        ? `<div class="wildshape-tags">${tags.map((tag) => `<span>${tag}</span>`).join('')}</div>`
        : '';
      button.innerHTML = `
        <div>
          <strong>${entry.name}</strong>
          ${subtitle}
        </div>
        ${tagMarkup}
      `;
      wildshapeListNode.appendChild(button);
    });
  }

  function renderWildshapeDetail() {
    if (!wildshapeDetailNode) return;
    const entry = beastMap.get(beastSelectedKey)
      || trackedForms.find((form) => form.key === beastSelectedKey)
      || null;
    if (!entry) {
      wildshapeDetailNode.innerHTML = '<p>Select a beast to review its statistics. Add tracked forms for quick access in the summary.</p>';
      return;
    }
    const tracked = trackedForms.some((form) => form.key === beastSelectedKey);
    const chips = [];
    if (entry.ac !== null && entry.ac !== undefined) {
      chips.push(`<span class="companion-chip">AC <strong>${entry.ac}</strong></span>`);
    }
    if (entry.hp !== null && entry.hp !== undefined) {
      chips.push(`<span class="companion-chip">HP <strong>${entry.hp}</strong></span>`);
    }
    if (entry.speed) {
      chips.push(`<span class="companion-chip">Speed <strong>${entry.speed}</strong></span>`);
    }
    const details = [];
    if (entry.crLabel) details.push(`CR ${entry.crLabel}`);
    else if (entry.cr) details.push(`CR ${entry.cr}`);
    if (entry.size) details.push(entry.size);
    if (entry.type) details.push(entry.type);
    if (entry.alignment) details.push(entry.alignment);
    const detailLine = details.length ? `<span>${details.join(' · ')}</span>` : '';
    const traitList = Array.isArray(entry.traits) ? entry.traits : [];
    const visibleTraits = traitList.slice(0, 8);
    const extraCount = Math.max(0, traitList.length - visibleTraits.length);
    const traitsMarkup = visibleTraits.length
      ? `<ul class="companion-traits">${visibleTraits.map((trait) => `<li>${trait}</li>`).join('')}${extraCount ? `<li class="wildshape-traits-more">+${extraCount} more trait${extraCount === 1 ? '' : 's'} not shown</li>` : ''}</ul>`
      : '';
    const metaParts = [];
    if (entry.senses) metaParts.push(`<p class="summary-companion-meta">Senses: ${entry.senses}</p>`);
    if (entry.skills) metaParts.push(`<p class="summary-companion-meta">Skills: ${entry.skills}</p>`);
    if (entry.source) metaParts.push(`<p class="summary-companion-meta">Source: ${entry.source}</p>`);
    const buttonLabel = tracked ? 'Tracked' : 'Track form';
    const disabledAttr = tracked ? 'disabled' : '';
    wildshapeDetailNode.innerHTML = `
      <header>
        <h4>${entry.name}</h4>
        ${detailLine}
      </header>
      ${entry.summary ? `<p class="summary-companion-summary">${entry.summary}</p>` : ''}
      ${chips.length ? `<div class="summary-companion-stats">${chips.join('')}</div>` : ''}
      <div class="wildshape-actions">
        <button type="button" data-wildshape-action="track" data-beast-id="${entry.id}" ${disabledAttr}>${buttonLabel}</button>
      </div>
      ${metaParts.join('')}
      ${traitsMarkup}
    `;
  }

  function renderTrackedForms() {
    if (!wildshapeTrackedList) return;
    wildshapeTrackedList.innerHTML = '';
    if (!trackedForms.length) {
      if (wildshapeTrackedEmpty) {
        wildshapeTrackedEmpty.hidden = false;
      }
      return;
    }
    if (wildshapeTrackedEmpty) {
      wildshapeTrackedEmpty.hidden = true;
    }
    trackedForms.forEach((form) => {
      const item = document.createElement('li');
      item.dataset.trackedKey = form.key;
      item.dataset.active = form.key === beastSelectedKey ? 'true' : 'false';
      const detailParts = [];
      if (form.cr) detailParts.push(`CR ${form.cr}`);
      if (form.size) detailParts.push(form.size);
      if (form.type) detailParts.push(form.type);
      const meta = detailParts.length ? `<small>${detailParts.join(' · ')}</small>` : '';
      item.innerHTML = `
        <div class="wildshape-tracked-main">
          <button type="button" data-wildshape-select="${form.id}" class="wildshape-tracked-name" data-active="${form.key === beastSelectedKey ? 'true' : 'false'}">${form.name}</button>
          ${meta}
        </div>
        <button type="button" data-wildshape-action="remove" data-tracked-key="${form.key}">Remove</button>
      `;
      wildshapeTrackedList.appendChild(item);
    });
  }

  function addTrackedForm(entry) {
    const normalized = normalizeTrackedForm(entry);
    if (!normalized) return;
    if (trackedForms.some((form) => form.key === normalized.key)) return;
    trackedForms.push(normalized);
    renderTrackedForms();
    renderWildshapeDetail();
    syncHiddenField(true);
  }

  function removeTrackedForm(key) {
    const normalizedKey = normalizeId(key);
    const beforeLength = trackedForms.length;
    trackedForms = trackedForms.filter((form) => form.key !== normalizedKey);
    if (trackedForms.length !== beforeLength) {
      const selectionAdjusted = ensureBeastSelection({ notify: true });
      renderTrackedForms();
      renderWildshapeList();
      renderWildshapeDetail();
      if (!selectionAdjusted) {
        syncHiddenField(true);
      }
    }
  }

  function getOverrides() {
    const overrides = {};
    const acInput = overrideInputs.get('ac');
    if (acInput) {
      const value = Number.parseInt(acInput.value, 10);
      if (Number.isFinite(value) && value >= 0) {
        overrides.ac = value;
      }
    }
    const hpInput = overrideInputs.get('hp');
    if (hpInput) {
      const value = Number.parseInt(hpInput.value, 10);
      if (Number.isFinite(value) && value >= 0) {
        overrides.hp = value;
      }
    }
    const speedInput = overrideInputs.get('speed');
    if (speedInput) {
      const value = speedInput.value.trim();
      if (value) {
        overrides.speed = value;
      }
    }
    return overrides;
  }

  function syncHiddenField(shouldDispatch = false) {
    if (!hiddenField) return;
    const payload = getValue();
    const serialized = JSON.stringify(payload);
    if (hiddenField.value !== serialized) {
      hiddenField.value = serialized;
    }
    if (!syncing && shouldDispatch) {
      hiddenField.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function setSelection(id, { userTriggered = false } = {}) {
    const raw = id !== undefined ? id : selectedRawId;
    const key = normalizeId(raw);
    const entry = key ? companionMap.get(key) : null;
    selectedRawId = raw ? String(raw) : '';
    selectedKey = entry ? entry.key : key;
    if (entry && nameField && nameField.dataset.familiarAutofill !== 'false') {
      syncing = true;
      if (!nameField.value) {
        nameField.value = entry.name;
      }
      nameField.dataset.familiarAutofill = nameField.value ? 'true' : 'false';
      syncing = false;
    }
    renderList();
    renderDetail();
    syncHiddenField(userTriggered);
  }

  function handleListClick(event) {
    const target = event.target.closest('[data-companion-id]');
    if (!target) return;
    const { companionId } = target.dataset;
    if (normalizeId(companionId) === selectedKey) return;
    setSelection(companionId, { userTriggered: true });
  }

  function handleSearchInput(event) {
    searchTerm = event.target.value || '';
    applyFilters();
    renderList();
  }

  function handleFilterChange(event) {
    const select = event.target;
    if (!(select instanceof HTMLSelectElement)) return;
    const key = select.dataset.familiarFilter;
    if (!key) return;
    activeFilters = { ...activeFilters, [key]: select.value };
    applyFilters();
    renderList();
  }

  function handleWildshapeListClick(event) {
    const target = event.target.closest('[data-beast-id]');
    if (!target) return;
    const { beastId } = target.dataset;
    if (!beastId) return;
    if (normalizeId(beastId) === beastSelectedKey) return;
    setBeastSelection(beastId, { userTriggered: true });
  }

  function handleWildshapeSearchInput(event) {
    beastSearchTerm = event.target.value || '';
    applyBeastFilters();
    const selectionChanged = ensureBeastSelection({ notify: true });
    renderWildshapeList();
    renderWildshapeDetail();
    if (selectionChanged) {
      renderTrackedForms();
    }
  }

  function handleWildshapeFilterChange(event) {
    const select = event.target;
    if (!(select instanceof HTMLSelectElement)) return;
    const key = select.dataset.wildshapeFilter;
    if (!key) return;
    beastFilters = { ...beastFilters, [key]: select.value };
    applyBeastFilters();
    const selectionChanged = ensureBeastSelection({ notify: true });
    renderWildshapeList();
    renderWildshapeDetail();
    if (selectionChanged) {
      renderTrackedForms();
    }
  }

  function handleWildshapeClick(event) {
    const actionTarget = event.target.closest('[data-wildshape-action]');
    if (actionTarget) {
      const action = actionTarget.dataset.wildshapeAction;
      if (action === 'track') {
        const beastId = actionTarget.dataset.beastId || beastSelectedKey;
        const entry = beastId ? beastMap.get(normalizeId(beastId)) : null;
        if (entry) {
          addTrackedForm({ ...entry, meta: createBeastSnapshot(entry) });
        }
      }
      if (action === 'remove') {
        const key = actionTarget.dataset.trackedKey;
        if (key) {
          removeTrackedForm(key);
        }
      }
      return;
    }
    const selectTarget = event.target.closest('[data-wildshape-select]');
    if (selectTarget) {
      const beastId = selectTarget.dataset.wildshapeSelect;
      if (beastId) {
        setBeastSelection(beastId, { userTriggered: true });
      }
    }
  }

  function handleOverrideInput() {
    if (syncing) return;
    syncHiddenField(true);
    renderDetail();
  }

  function handleNameInput() {
    if (!nameField || syncing) return;
    nameField.dataset.familiarAutofill = nameField.value ? 'false' : 'true';
    syncHiddenField(true);
    renderDetail();
  }

  function handleNotesInput() {
    if (syncing) return;
    syncHiddenField(true);
  }

  function applyState(currentState) {
    const data = currentState?.data || currentState || {};
    const familiar = data.familiar || {};
    selectedRawId = familiar.id || data.familiarType || '';
    selectedKey = normalizeId(selectedRawId);
    lastSnapshot = sanitizeCompanionMeta(familiar.meta) || null;
    syncing = true;
    if (nameField) {
      const value = familiar.name || data.familiarName || '';
      nameField.value = value;
      nameField.dataset.familiarAutofill = value ? 'false' : 'true';
    }
    if (notesField) {
      notesField.value = familiar.notes || data.familiarNotes || '';
    }
    overrideInputs.forEach((input, key) => {
      const overrides = familiar.overrides || {};
      if (key === 'speed') {
        input.value = typeof overrides[key] === 'string' ? overrides[key] : '';
      } else {
        const value = overrides[key];
        input.value = Number.isFinite(value) ? value : '';
      }
    });
    syncing = false;
    const wildShapeState = familiar.wildShape || familiar.wildshape || {};
    trackedForms = Array.isArray(wildShapeState.forms)
      ? wildShapeState.forms.map((form) => normalizeTrackedForm(form)).filter(Boolean)
      : [];
    beastSelectedKey = normalizeId(wildShapeState.selected);
    ensureBeastSelection();
    renderTrackedForms();
    renderWildshapeList();
    renderWildshapeDetail();
    setSelection(selectedRawId, { userTriggered: false });
    syncHiddenField(false);
  }

  function refresh() {
    rebuildCompanions();
    populateFilterOptions();
    applyFilters();
    rebuildBeasts();
    populateBeastFilterOptions();
    applyBeastFilters();
    ensureBeastSelection();
    renderWildshapeList();
    renderWildshapeDetail();
    renderTrackedForms();
    setSelection(selectedRawId, { userTriggered: false });
  }

  function getValue() {
    const entry = companionMap.get(selectedKey) || null;
    const overrides = getOverrides();
    const name = nameField ? nameField.value.trim() : '';
    const notes = notesField ? notesField.value.trim() : '';
    const rawId = selectedRawId || (entry ? entry.id : '');
    const id = rawId ? String(rawId).trim() : '';
    let snapshot = entry ? createCompanionSnapshot(entry) : null;
    if (!snapshot && lastSnapshot) {
      const snapshotKey = normalizeId(lastSnapshot.id);
      if (!selectedKey || snapshotKey === selectedKey) {
        snapshot = lastSnapshot;
      }
    }
    if (snapshot && id && snapshot.id !== id) {
      snapshot = { ...snapshot, id: id.trim() };
    }
    lastSnapshot = id && snapshot ? snapshot : (!id ? null : lastSnapshot);
    ensureBeastSelection();
    const selectedBeastEntry = beastMap.get(beastSelectedKey) || trackedForms.find((form) => form.key === beastSelectedKey);
    const payload = {
      id,
      name,
      notes,
      overrides,
      wildShape: {
        forms: trackedForms.map((form) => {
          const formPayload = {
            id: form.id,
            name: form.name,
            summary: form.summary,
            ac: form.ac,
            hp: form.hp,
            speed: form.speed,
            cr: form.cr,
            size: form.size,
            type: form.type,
            alignment: form.alignment,
            senses: form.senses,
            skills: form.skills,
            traits: Array.isArray(form.traits) ? form.traits.slice() : [],
            source: form.source
          };
          if (form.meta) {
            formPayload.meta = { ...form.meta };
          }
          return formPayload;
        }),
        selected: selectedBeastEntry ? selectedBeastEntry.id : ''
      }
    };
    if (snapshot && id) {
      payload.meta = snapshot;
    }
    return payload;
  }

  return {
    setup(node) {
      section = node;
      listNode = section.querySelector('[data-familiar-list]');
      detailNode = section.querySelector('[data-familiar-detail]');
      searchInput = section.querySelector('[data-familiar-search]');
      emptyState = section.querySelector('[data-familiar-empty]');
      hiddenField = section.querySelector('[data-familiar-field]') || form?.elements?.namedItem('familiarData');
      nameField = section.querySelector('[data-familiar-name]') || form?.elements?.namedItem('familiarName');
      notesField = section.querySelector('[data-familiar-notes]') || form?.elements?.namedItem('familiarNotes');
      wildshapeRoot = section.querySelector('[data-wildshape-root]');
      wildshapeListNode = section.querySelector('[data-wildshape-list]');
      wildshapeDetailNode = section.querySelector('[data-wildshape-detail]');
      wildshapeEmptyState = section.querySelector('[data-wildshape-empty]');
      wildshapeTrackedNode = section.querySelector('[data-wildshape-tracked]');
      wildshapeTrackedList = section.querySelector('[data-wildshape-tracked-list]');
      wildshapeTrackedEmpty = section.querySelector('[data-wildshape-tracked-empty]');
      wildshapeSearchInput = section.querySelector('[data-wildshape-search]');
      filterNodes.clear();
      section.querySelectorAll('[data-familiar-filter]').forEach((select) => {
        if (select instanceof HTMLSelectElement) {
          filterNodes.set(select.dataset.familiarFilter, select);
        }
      });
      overrideInputs.clear();
      section.querySelectorAll('[data-familiar-override]').forEach((input) => {
        if (input instanceof HTMLInputElement) {
          overrideInputs.set(input.dataset.familiarOverride, input);
        }
      });
      wildshapeFilterNodes.clear();
      section.querySelectorAll('[data-wildshape-filter]').forEach((select) => {
        if (select instanceof HTMLSelectElement) {
          wildshapeFilterNodes.set(select.dataset.wildshapeFilter, select);
        }
      });
      if (listNode) {
        listNode.addEventListener('click', handleListClick);
      }
      if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
      }
      filterNodes.forEach((select) => {
        select.addEventListener('change', handleFilterChange);
      });
      overrideInputs.forEach((input) => {
        input.addEventListener('input', handleOverrideInput);
      });
      if (wildshapeListNode) {
        wildshapeListNode.addEventListener('click', handleWildshapeListClick);
      }
      if (wildshapeSearchInput) {
        wildshapeSearchInput.addEventListener('input', handleWildshapeSearchInput);
      }
      wildshapeFilterNodes.forEach((select) => {
        select.addEventListener('change', handleWildshapeFilterChange);
      });
      if (wildshapeRoot) {
        wildshapeRoot.addEventListener('click', handleWildshapeClick);
      }
      if (nameField) {
        if (!nameField.dataset.familiarAutofill) {
          nameField.dataset.familiarAutofill = nameField.value ? 'false' : 'true';
        }
        nameField.addEventListener('input', handleNameInput);
      }
      if (notesField) {
        notesField.addEventListener('input', handleNotesInput);
      }
      refresh();
      renderDetail();
      syncHiddenField(false);
    },
    onPackData() {
      refresh();
    },
    onStateHydrated(currentState) {
      applyState(currentState || state);
    },
    onStatePersisted(currentState) {
      applyState(currentState || state);
    },
    getValue
  };
})();

const finalizeModule = (() => {
  let shareButton = null;
  let shareDetailsNode = null;
  let shareStatusNode = null;
  let currentShareInfo = null;
  let sharing = false;
  let clearStatusTimer = null;

  function setStatus(message, { isError = false, autoClear = true } = {}) {
    if (!shareStatusNode) return;
    window.clearTimeout(clearStatusTimer);
    if (!message) {
      shareStatusNode.hidden = true;
      shareStatusNode.textContent = '';
      shareStatusNode.dataset.state = '';
      return;
    }
    shareStatusNode.hidden = false;
    shareStatusNode.textContent = message;
    shareStatusNode.dataset.state = isError ? 'warn' : 'ok';
    if (autoClear) {
      clearStatusTimer = window.setTimeout(() => {
        shareStatusNode.hidden = true;
        shareStatusNode.textContent = '';
        shareStatusNode.dataset.state = '';
      }, 4000);
    }
  }

  function updateShareDetails(currentState, info = null) {
    if (!shareDetailsNode) return;
    try {
      const sourceState = currentState || state;
      currentShareInfo = info || computeShareInfo(sourceState);
      const encodedLength = currentShareInfo?.encoded ? currentShareInfo.encoded.length : 0;
      const sizeLabel = formatByteSize(encodedLength);
      const meta = currentShareInfo?.meta || {};
      const subject = meta.name ? meta.name : 'this character';
      shareDetailsNode.textContent = `Share link copies the builder choices for ${subject} (~${sizeLabel} in the URL) without including custom packs or files.`;
      if (shareButton) {
        shareButton.disabled = false;
      }
    } catch (error) {
      console.error('Unable to prepare share payload', error);
      shareDetailsNode.textContent = 'Share link is currently unavailable. Try again after updating your character.';
      if (shareButton) {
        shareButton.disabled = true;
      }
      currentShareInfo = null;
    }
  }

  async function handleShareClick() {
    if (sharing) return;
    if (shareButton) {
      shareButton.disabled = true;
    }
    sharing = true;
    setStatus('Preparing share link…', { isError: false, autoClear: false });
    try {
      await persistState({ skipHistory: true, preserveTimestamp: true });
      const info = computeShareInfo(state);
      updateShareDetails(state, info);
      if (!info || !info.encoded) {
        throw new Error('Share info missing.');
      }
      const shareUrl = buildShareUrl(info.encoded);
      const copied = await copyTextToClipboard(shareUrl);
      if (copied) {
        setStatus('Share link copied to clipboard.');
      } else {
        setStatus('Copy this share link manually from your browser address bar.', { isError: true, autoClear: false });
      }
    } catch (error) {
      console.error('Failed to generate share link', error);
      setStatus('Unable to create a share link right now. Please try again.', { isError: true, autoClear: false });
    } finally {
      sharing = false;
      if (shareButton) {
        shareButton.disabled = false;
      }
    }
  }

  return {
    setup(section) {
      shareButton = section.querySelector('[data-action="share"]');
      shareDetailsNode = section.querySelector('[data-share-details]');
      shareStatusNode = section.querySelector('[data-share-status]');
      if (shareButton) {
        shareButton.addEventListener('click', handleShareClick);
      }
      updateShareDetails(state);
    },
    onStateHydrated(currentState) {
      updateShareDetails(currentState);
    },
    onStatePersisted(currentState) {
      updateShareDetails(currentState);
    },
    onPackData() {
      updateShareDetails(state);
    }
  };
})();

const moduleDefinitions = {
  identity: identityModule,
  classLevel: classModule,
  abilities: abilityModule,
  feats: featsModule,
  equipment: equipmentModule,
  familiar: familiarModule,
  finalize: finalizeModule
};

const quickAddManager = (() => {
  let pending = loadQuickAddQueue();
  let ready = false;
  let processing = false;
  let toastHost = null;

  function ensureToastHost() {
    if (toastHost && toastHost.isConnected) {
      return toastHost;
    }
    const host = document.createElement('div');
    host.className = 'builder-toast-host';
    host.setAttribute('aria-live', 'polite');
    host.setAttribute('aria-atomic', 'true');
    document.body.appendChild(host);
    toastHost = host;
    return toastHost;
  }

  function removeToast(node) {
    if (!node || !node.isConnected) return;
    node.classList.add('builder-toast-dismissed');
    window.setTimeout(() => {
      if (node.isConnected) {
        node.remove();
      }
    }, 180);
  }

  function showToast(message, { undo = null, undoMessage = '', duration = 4800 } = {}) {
    if (!message) return;
    const host = ensureToastHost();
    const toast = document.createElement('div');
    toast.className = 'builder-toast';
    const text = document.createElement('span');
    text.className = 'builder-toast-message';
    text.textContent = message;
    toast.appendChild(text);
    if (typeof undo === 'function') {
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'builder-toast-undo';
      action.textContent = 'Undo';
      action.addEventListener('click', () => {
        try {
          undo();
        } catch (error) {
          console.warn('Failed to undo quick add', error);
        }
        if (undoMessage) {
          showToast(undoMessage, { duration: 3200 });
        }
        removeToast(toast);
      });
      toast.appendChild(action);
    }
    host.appendChild(toast);
    const ttl = Number.isFinite(duration) ? duration : 4800;
    if (ttl > 0) {
      window.setTimeout(() => removeToast(toast), ttl);
    }
  }

  function categorizePayload(payload) {
    if (!payload || typeof payload !== 'object') return null;
    const type = String(payload.type || '').toLowerCase();
    if (type === 'item') return 'equipment';
    if (type === 'feat') return 'feats';
    if (type === 'spell') return 'spells';
    return null;
  }

  function persist() {
    persistQuickAddQueue(pending);
  }

  function processQueue() {
    if (!ready || processing) return;
    if (!pending.length) {
      persist();
      return;
    }
    processing = true;
    try {
      const groups = new Map();
      const leftovers = [];
      pending.forEach((payload) => {
        const moduleId = categorizePayload(payload);
        if (!moduleId) {
          leftovers.push(payload);
          return;
        }
        const module = stepModules.get(moduleId);
        if (!module || typeof module.applyQuickAdd !== 'function') {
          leftovers.push(payload);
          return;
        }
        if (!groups.has(moduleId)) {
          groups.set(moduleId, []);
        }
        groups.get(moduleId).push(payload);
      });

      const results = [];
      groups.forEach((payloads, moduleId) => {
        const module = stepModules.get(moduleId);
        if (!module || typeof module.applyQuickAdd !== 'function') {
          payloads.forEach((payload) => leftovers.push(payload));
          return;
        }
        let result = null;
        try {
          result = module.applyQuickAdd(payloads, { source: 'quick-add' }) || null;
        } catch (error) {
          console.warn('Failed to apply quick-add payloads', error);
        }
        const appliedSet = new Set(Array.isArray(result?.applied) ? result.applied : []);
        payloads.forEach((payload) => {
          if (!appliedSet.has(payload)) {
            leftovers.push(payload);
          }
        });
        if (result && appliedSet.size) {
          results.push(result);
        }
      });

      pending = leftovers;
      persist();
      results.forEach((result) => {
        if (!result || !result.message) return;
        showToast(result.message, {
          undo: typeof result.undo === 'function' ? result.undo : null,
          undoMessage: result.undoMessage || ''
        });
      });
    } finally {
      processing = false;
    }
  }

  function enqueue(payload) {
    if (!payload || typeof payload !== 'object') return;
    pending.unshift(payload);
    if (pending.length > 50) {
      pending.length = 50;
    }
    persist();
    processQueue();
  }

  return {
    init() {
      pending = Array.isArray(pending) ? pending : [];
      window.addEventListener('dnd-builder-quick-add', (event) => {
        if (!event || !event.detail) return;
        enqueue(event.detail);
      });
    },
    ready() {
      if (ready) return;
      ready = true;
      processQueue();
    },
    onPackData() {
      processQueue();
    },
    enqueue
  };
})();

quickAddManager.init();

function setupStepModules() {
  steps.forEach((section) => {
    const module = moduleDefinitions[section.dataset.step];
    if (module) {
      if (typeof module.setup === 'function') {
        module.setup(section);
      }
      stepModules.set(section.dataset.step, module);
    }
  });
}
function setupFinalizeActions() {
  form.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.action;
    if (!action) return;
    if (action === 'print') {
      persistState().then(() => {
        if (typeof window.persistBuilderState === 'function') {
          window.persistBuilderState();
        }
        window.open('/builder/sheet.html', '_blank', 'noopener');
      });
    }
    if (action === 'export') {
      exportBuilderState();
    }
    if (action === 'import') {
      triggerBuilderImport();
    }
  });
}

function setupSummaryToggle() {
  if (!summaryToggle) return;
  summaryToggle.addEventListener('click', () => {
    const panel = document.getElementById('summary-panel');
    if (panel) {
      panel.classList.toggle('visible');
    }
  });
}

function setupAboutModal() {
  const modal = document.getElementById('about-legal-modal');
  if (!modal) return;
  const dialog = modal.querySelector('.modal-panel');
  const legalBlock = modal.querySelector('#legal-notice-text');
  const backdrop = modal.querySelector('.modal-backdrop');
  const openers = Array.from(document.querySelectorAll('[data-open-about]'));
  const closeButtons = Array.from(modal.querySelectorAll('[data-close-modal]'));
  let loaded = false;
  let lastFocus = null;
  const focusTrap = createFocusTrap(dialog, { returnFocus: false });

  function createFocusTrap(container, { returnFocus = true } = {}) {
    if (!container) {
      return {
        activate() {},
        deactivate() {}
      };
    }

    const focusableSelector =
      'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    let active = false;
    let previousFocus = null;

    function isVisible(element) {
      return !(
        element.offsetParent === null &&
        element !== document.activeElement &&
        element.getClientRects().length === 0
      );
    }

    function getFocusableElements() {
      return Array.from(container.querySelectorAll(focusableSelector)).filter((element) => {
        if (element.hasAttribute('disabled')) return false;
        if (element.getAttribute('aria-hidden') === 'true') return false;
        const tabIndex = element.getAttribute('tabindex');
        if (tabIndex && Number(tabIndex) < 0) return false;
        return isVisible(element);
      });
    }

    function focusFirst() {
      const [first] = getFocusableElements();
      const target = first || container;
      if (target && typeof target.focus === 'function') {
        target.focus({ preventScroll: true });
      }
      return target;
    }

    function handleKeydown(event) {
      if (!active || event.key !== 'Tab') return;
      const focusable = getFocusableElements();
      if (!focusable.length) {
        event.preventDefault();
        focusFirst();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;
      if (event.shiftKey) {
        if (current === first || !container.contains(current)) {
          event.preventDefault();
          last.focus({ preventScroll: true });
        }
      } else if (current === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    }

    function handleFocusIn(event) {
      if (!active) return;
      if (!container.contains(event.target)) {
        focusFirst();
      }
    }

    return {
      activate(initialFocus) {
        if (active) return;
        active = true;
        previousFocus = document.activeElement;
        document.addEventListener('focusin', handleFocusIn, true);
        document.addEventListener('keydown', handleKeydown, true);
        const target = initialFocus || focusFirst();
        if (target && typeof target.focus === 'function') {
          target.focus({ preventScroll: true });
        }
      },
      deactivate() {
        if (!active) return;
        document.removeEventListener('focusin', handleFocusIn, true);
        document.removeEventListener('keydown', handleKeydown, true);
        active = false;
        const returnTarget = returnFocus ? previousFocus : null;
        if (returnTarget && typeof returnTarget.focus === 'function') {
          returnTarget.focus({ preventScroll: true });
        }
        previousFocus = null;
      }
    };
  }

  async function loadLegalNotice() {
    if (!legalBlock || loaded) return;
    try {
      const response = await fetch('/LEGAL/NOTICE.txt', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Failed to fetch legal notice: ${response.status}`);
      const text = await response.text();
      legalBlock.textContent = text;
      loaded = true;
    } catch (error) {
      legalBlock.textContent = 'Unable to load the legal notice. You can open the text directly via the link above.';
    }
  }

  function closeModal() {
    modal.classList.remove('visible');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', handleEscapeKey, true);
    focusTrap.deactivate();
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus({ preventScroll: true });
    }
    lastFocus = null;
  }

  function handleEscapeKey(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
    }
  }

  function openModal(trigger) {
    lastFocus = trigger || document.activeElement;
    modal.classList.add('visible');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    document.addEventListener('keydown', handleEscapeKey, true);
    loadLegalNotice();
    requestAnimationFrame(() => {
      focusTrap.activate(dialog);
    });
  }

  openers.forEach((button) => {
    if (!button) return;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      openModal(button);
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      closeModal();
    });
  });

  [modal, backdrop].forEach((element) => {
    if (!element) return;
    element.addEventListener('click', (event) => {
      if (event.target === element) {
        closeModal();
      }
    });
  });
}

function setupCoachMarks() {
  if (!coachmarkOverlay) return;
  let seen = false;
  try {
    seen = localStorage.getItem(COACHMARK_KEY) === '1';
  } catch (error) {
    seen = false;
  }
  if (seen) return;

  const stepsConfig = [
    {
      target: '#step-indicator',
      title: 'Guided builder',
      message: 'Follow the breadcrumb and use the Next and Back buttons to move through each section of the builder.'
    },
    {
      target: '#builder-pack-meta',
      title: 'Content packs',
      message: 'This line lists every SRD 5.1 or custom data pack that is currently loaded so you always know the source of each option.'
    },
    {
      target: '.sticky-nav',
      title: 'Offline friendly',
      message: 'Quest Kit saves to your device. Install it as a PWA or revisit anytime—even offline—and your latest progress will be waiting.'
    }
  ];

  let currentIndex = 0;
  let activeTarget = null;

  coachmarkOverlay.innerHTML = '';
  const backdrop = document.createElement('div');
  backdrop.className = 'coachmark-backdrop';
  const card = document.createElement('section');
  card.className = 'coachmark-card';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-live', 'polite');
  card.tabIndex = -1;

  const title = document.createElement('h3');
  const message = document.createElement('p');
  const actions = document.createElement('div');
  actions.className = 'coachmark-actions';

  const skipButton = document.createElement('button');
  skipButton.type = 'button';
  skipButton.className = 'secondary';
  skipButton.textContent = 'Skip';

  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.className = 'primary';
  nextButton.textContent = 'Next';

  actions.append(skipButton, nextButton);
  card.append(title, message, actions);
  coachmarkOverlay.append(backdrop, card);

  function storeSeen() {
    try {
      localStorage.setItem(COACHMARK_KEY, '1');
    } catch (error) {
      // ignore storage issues
    }
  }

  function clearHighlight() {
    if (activeTarget) {
      activeTarget.classList.remove('coachmark-highlight');
    }
    activeTarget = null;
  }

  function finish() {
    clearHighlight();
    coachmarkOverlay.classList.remove('active');
    coachmarkOverlay.setAttribute('aria-hidden', 'true');
    coachmarkOverlay.innerHTML = '';
    window.removeEventListener('resize', reposition, true);
    window.removeEventListener('scroll', reposition, true);
  }

  function complete() {
    storeSeen();
    finish();
  }

  function reposition() {
    if (!activeTarget || !card.isConnected) return;
    const rect = activeTarget.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const spacing = 12;
    let top = rect.bottom + spacing;
    if (top + cardRect.height > window.innerHeight - spacing) {
      top = Math.max(spacing, rect.top - cardRect.height - spacing);
    }
    let left = rect.left + rect.width / 2 - cardRect.width / 2;
    left = Math.min(Math.max(left, spacing), window.innerWidth - cardRect.width - spacing);
    card.style.top = `${Math.round(top)}px`;
    card.style.left = `${Math.round(left)}px`;
  }

  function showStep(index) {
    const config = stepsConfig[index];
    if (!config) {
      complete();
      return;
    }
    const target = document.querySelector(config.target);
    if (!target) {
      showStep(index + 1);
      return;
    }
    clearHighlight();
    activeTarget = target;
    activeTarget.classList.add('coachmark-highlight');
    title.textContent = config.title;
    message.textContent = config.message;
    nextButton.textContent = index === stepsConfig.length - 1 ? 'Got it' : 'Next';
    requestAnimationFrame(() => {
      reposition();
      if (card.isConnected) {
        card.focus();
      }
    });
  }

  skipButton.addEventListener('click', () => {
    complete();
  });

  nextButton.addEventListener('click', () => {
    if (currentIndex >= stepsConfig.length - 1) {
      complete();
    } else {
      currentIndex += 1;
      showStep(currentIndex);
    }
  });

  backdrop.addEventListener('click', () => {
    complete();
  });

  coachmarkOverlay.classList.add('active');
  coachmarkOverlay.setAttribute('aria-hidden', 'false');
  window.addEventListener('resize', reposition, true);
  window.addEventListener('scroll', reposition, true);

  showStep(currentIndex);
}

async function init() {
  setupStepModules();
  wirePackControls();
  subscribeToPackChanges();
  await hydratePackData();
  await loadState();
  currentStep = state.currentStepIndex || 0;
  renderStep(currentStep);
  updateProgressIndicator();
  updateHistoryControls();

  form.addEventListener('input', (event) => {
    notifyModules('onFormInput', event);
    handleInput();
  });

  form.addEventListener('change', (event) => {
    notifyModules('onFormChange', event);
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.matches('select, input[type="checkbox"], input[type="radio"], input[type="range"]')) {
      handleInput();
    }
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', prevStep);
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', nextStep);
  }
  if (undoBtn) {
    undoBtn.addEventListener('click', handleUndo);
  }
  if (redoBtn) {
    redoBtn.addEventListener('click', handleRedo);
  }
  if (exportStateBtn) {
    exportStateBtn.addEventListener('click', exportBuilderState);
  }
  if (importStateBtn) {
    importStateBtn.addEventListener('click', triggerBuilderImport);
  }

  setupFinalizeActions();
  setupSummaryToggle();
  setupAboutModal();
  window.setTimeout(setupCoachMarks, 400);
  window.addEventListener('beforeunload', () => {
    persistState({ skipHistory: true, preserveTimestamp: true });
  });
  quickAddManager.ready();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
  });
} else {
  init();
}
