const STORAGE_KEY = 'dndBuilderState';
const COACHMARK_KEY = 'dndBuilderCoachMarksSeen';
const HISTORY_LIMIT = 50;

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

function createBaseState() {
  return {
    data: {},
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

function getStepValidity(stepId) {
  if (!stepId) {
    return { valid: true, messages: [] };
  }
  const module = stepModules.get(stepId);
  if (module && typeof module.getValidity === 'function') {
    try {
      const result = module.getValidity(state);
      if (result === false) {
        return { valid: false, messages: [] };
      }
      if (result && typeof result === 'object') {
        return {
          valid: result.valid !== false,
          messages: Array.isArray(result.messages) ? result.messages : []
        };
      }
    } catch (error) {
      console.warn('Step validity check failed', error);
    }
  }
  return { valid: true, messages: [] };
}

function updateNavigationState() {
  if (!nextBtn) return;
  const stepId = steps[currentStep]?.dataset.step || '';
  const validity = getStepValidity(stepId);
  const canProceed = validity.valid !== false;
  nextBtn.disabled = !canProceed;
  if (!canProceed) {
    nextBtn.setAttribute('aria-disabled', 'true');
  } else {
    nextBtn.removeAttribute('aria-disabled');
  }
}

let packData = {
  packs: [],
  classes: [],
  races: [],
  backgrounds: [],
  feats: [],
  items: [],
  companions: []
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
    companions: Array.isArray(data?.companions) ? data.companions : []
  };
  window.dndBuilderData = packData;
}

function getPackData() {
  return packData;
}

function setPackStatus(message) {
  if (!packStatusNode) return;
  packStatusNode.textContent = message || '';
}

function abilityNameToId(name) {
  if (!name) return null;
  const key = String(name).toLowerCase();
  return abilityNameIndex[key] || null;
}

function computeProficiencyBonus(level) {
  const numeric = Number.parseInt(level, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 2;
  }
  return Math.max(2, Math.floor((numeric - 1) / 4) + 2);
}

function addAbilityRequirement(target, abilityName, minimum) {
  if (!abilityName || !Number.isFinite(minimum)) return;
  const abilityId = abilityNameToId(abilityName);
  const label = abilityFields.find((field) => field.id === abilityId)?.label || abilityName;
  const key = abilityId || label.toLowerCase();
  const requirement = target.get(key);
  const normalizedMinimum = Math.max(0, Math.round(Number(minimum)));
  if (!requirement || requirement.minimum < normalizedMinimum) {
    target.set(key, {
      ability: label,
      abilityId,
      minimum: normalizedMinimum
    });
  }
}

function collectAbilityRequirementsFromValue(value, requirements) {
  if (!value) return;
  if (Array.isArray(value)) {
    value.forEach((entry) => collectAbilityRequirementsFromValue(entry, requirements));
    return;
  }
  if (typeof value === 'object') {
    if (typeof value.minimum === 'number' && (value.ability || value.name)) {
      addAbilityRequirement(requirements, value.ability || value.name, value.minimum);
    }
    Object.entries(value).forEach(([key, entryValue]) => {
      if (key === 'minimum' || key === 'ability' || key === 'name') return;
      if (typeof entryValue === 'number') {
        addAbilityRequirement(requirements, key, entryValue);
      } else {
        collectAbilityRequirementsFromValue(entryValue, requirements);
      }
    });
    return;
  }
  if (typeof value === 'string') {
    abilityFields.forEach((field) => {
      const regex = new RegExp(`${field.label}\\s*(\\d{1,2})`, 'i');
      const match = value.match(regex);
      if (match) {
        addAbilityRequirement(requirements, field.label, Number.parseInt(match[1], 10));
      }
    });
  }
}

function extractAbilityRequirementsFromMeta(meta) {
  if (!meta) return [];
  const requirements = new Map();
  const sources = [
    meta.prerequisites,
    meta.requirements,
    meta.multiclassing,
    meta.multiclassing?.prerequisites,
    meta.multiclassing?.ability_requirements,
    meta.multiclassing?.ability_score_prerequisites,
    meta.multiclass_requirements
  ];
  sources.forEach((source) => collectAbilityRequirementsFromValue(source, requirements));
  if (Array.isArray(meta.prerequisites)) {
    collectAbilityRequirementsFromValue(meta.prerequisites, requirements);
  }
  if (Array.isArray(meta.requirements)) {
    collectAbilityRequirementsFromValue(meta.requirements, requirements);
  }
  return Array.from(requirements.values());
}

function valueContainsSpellRequirement(value) {
  if (!value) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return /ability to cast|spellcasting|cast at least one spell/i.test(value);
  }
  if (Array.isArray(value)) {
    return value.some((entry) => valueContainsSpellRequirement(entry));
  }
  if (typeof value === 'object') {
    return Object.values(value).some((entry) => valueContainsSpellRequirement(entry));
  }
  return false;
}

function entryRequiresSpellcasting(meta) {
  if (!meta) return false;
  if (valueContainsSpellRequirement(meta.requires_spellcasting)) return true;
  if (valueContainsSpellRequirement(meta?.prerequisites?.requires_spellcasting)) return true;
  if (valueContainsSpellRequirement(meta?.prerequisites?.spellcasting)) return true;
  if (valueContainsSpellRequirement(meta?.multiclassing?.requires_spellcasting)) return true;
  if (valueContainsSpellRequirement(meta?.multiclassing?.prerequisites)) return true;
  if (valueContainsSpellRequirement(meta?.prerequisites)) return true;
  if (valueContainsSpellRequirement(meta?.requirements)) return true;
  if (valueContainsSpellRequirement(meta?.prerequisite)) return true;
  if (valueContainsSpellRequirement(meta?.prerequisite_text)) return true;
  return false;
}

function classProvidesSpellcasting(meta, identifier) {
  const slug = (meta?.slug || meta?.id || identifier || '').toString().toLowerCase();
  if (slug && SPELLCASTING_CLASS_SLUGS.has(slug)) {
    return true;
  }
  if (!meta) {
    return false;
  }
  if (
    meta.spellcasting ||
    meta.spellcasting_progression ||
    meta.pact_magic ||
    meta.spell_slots ||
    meta.can_cast_spells
  ) {
    return true;
  }
  if (Array.isArray(meta.features)) {
    const hasFeature = meta.features.some((feature) => {
      if (!feature) return false;
      if (typeof feature === 'string') {
        return /spellcasting/i.test(feature);
      }
      if (typeof feature === 'object') {
        return /spellcasting/i.test(feature.name || feature.slug || feature.title || '');
      }
      return false;
    });
    if (hasFeature) return true;
  }
  if (Array.isArray(meta.tags) && meta.tags.some((tag) => /spellcasting|spell/i.test(tag))) {
    return true;
  }
  if (typeof meta.summary === 'string' && /spellcasting|cast spells|spell slots/i.test(meta.summary)) {
    return true;
  }
  if (typeof meta.description === 'string' && /spellcasting|cast spells|spell slots/i.test(meta.description)) {
    return true;
  }
  return false;
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

function formatModifier(score) {
  if (!Number.isFinite(score)) return '+0';
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function computeAbilityBonuses(formData) {
  const bonuses = {};
  abilityFields.forEach((field) => {
    bonuses[field.id] = { total: 0, sources: [] };
  });
  const raceValue = formData?.race;
  const raceEntry = findEntry(packData.races || [], raceValue);
  if (raceEntry && raceEntry.ability_score_increase) {
    Object.entries(raceEntry.ability_score_increase).forEach(([abilityName, amount]) => {
      const id = abilityNameToId(abilityName);
      const value = Number(amount) || 0;
      if (!id || !value) return;
      bonuses[id].total += value;
      bonuses[id].sources.push({ label: raceEntry.name || 'Race', value });
    });
  }
  return bonuses;
}

function normalizeClassEntries(formData) {
  const normalized = [];
  const fallbackLevel = Math.max(1, Number.parseInt(formData?.level, 10) || 1);
  const rawClasses = formData?.classes;
  if (Array.isArray(rawClasses)) {
    rawClasses.forEach((entry) => {
      if (!entry) return;
      if (typeof entry === 'object') {
        const levelValue = Number.isFinite(entry.level) ? entry.level : Number.parseInt(entry.level, 10);
        normalized.push({
          value: entry.value || entry.slug || entry.id || entry.name || '',
          slug: entry.slug || null,
          id: entry.id || null,
          name: entry.name || '',
          level: Number.isFinite(levelValue) && levelValue > 0 ? levelValue : 1,
          hitDie: entry.hitDie || entry.hit_die || null,
          sourceId: entry.sourceId || entry.source?.id || null
        });
      } else if (typeof entry === 'string') {
        normalized.push({
          value: entry,
          slug: null,
          id: null,
          name: entry,
          level: fallbackLevel,
          hitDie: null,
          sourceId: null
        });
      }
    });
  }
  if (!normalized.length && formData?.class) {
    normalized.push({
      value: formData.class,
      slug: null,
      id: null,
      name: formData.class,
      level: fallbackLevel,
      hitDie: null,
      sourceId: null
    });
  }
  return normalized;
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
  const classEntries = normalizeClassEntries(formData);
  const packClasses = getPackData().classes || [];
  const derivedClasses = [];
  const hitDiceBreakdown = {};
  let hitDiceTotal = 0;
  classEntries.forEach((entry) => {
    if (!entry.value) return;
    const meta =
      findEntry(packClasses, entry.value) ||
      (entry.slug ? findEntry(packClasses, entry.slug) : null) ||
      (entry.id ? findEntry(packClasses, entry.id) : null) ||
      (entry.name ? findEntry(packClasses, entry.name) : null);
    const slug = meta?.slug || entry.slug || entry.value;
    const id = meta?.id || entry.id || slug || entry.value;
    const level = Math.max(0, Number.isFinite(entry.level) ? entry.level : Number.parseInt(entry.level, 10) || 0);
    const hitDie = entry.hitDie || meta?.hit_die || null;
    const sourceId = entry.sourceId || meta?.sourceId || meta?.source?.id || null;
    const providesSpellcasting = classProvidesSpellcasting(meta, slug || id);
    derivedClasses.push({
      id,
      slug,
      value: entry.value,
      name: entry.name || meta?.name || (typeof entry.value === 'string' ? entry.value : 'Class'),
      level,
      hitDie,
      sourceId,
      providesSpellcasting,
      proficiencyBonus: 0
    });
    if (hitDie) {
      hitDiceBreakdown[hitDie] = (hitDiceBreakdown[hitDie] || 0) + level;
    }
    hitDiceTotal += level;
  });
  const totalLevel = Math.max(1, Number.parseInt(formData?.level, 10) || hitDiceTotal || 1);
  const proficiencyBonus = computeProficiencyBonus(totalLevel);
  derivedClasses.forEach((entry) => {
    entry.proficiencyBonus = proficiencyBonus;
  });
  derived.classes = {
    totalLevel,
    proficiencyBonus,
    entries: derivedClasses,
    hitDice: {
      total: hitDiceTotal || totalLevel,
      breakdown: hitDiceBreakdown
    }
  };
  derived.proficiencyBonus = proficiencyBonus;
  derived.hitDice = derived.classes.hitDice;
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
    const classField = form.elements.namedItem('class');
    if (classField instanceof HTMLSelectElement) {
      populateSelectOptions(classField, data.classes || [], 'Choose a class');
    }
    const raceField = form.elements.namedItem('race');
    populateSelectOptions(raceField, data.races || [], 'Choose a race');
    const familiarField = form.elements.namedItem('familiarType');
    populateSelectOptions(familiarField, data.companions || [], 'Select a creature');
  }
  populateDatalist('background-options', data.backgrounds || []);
  populateDatalist('feat-options', data.feats || []);
  populateDatalist('item-options', data.items || [], (entry) => {
    const category = entry.category ? ` (${entry.category})` : '';
    return `${entry.name}${category}`;
  });
  updatePackMeta();
  notifyModules('onPackData', data);
}

async function hydratePackData() {
  if (window.dnd && typeof window.dnd.getBuilderData === 'function') {
    try {
      const data = await window.dnd.getBuilderData();
      setPackData(data);
    } catch (error) {
      console.warn('Failed to load builder packs', error);
      const fallback = window.dndBuilderData || window.dndData || packData;
      setPackData(fallback);
    }
  } else if (window.dndData) {
    setPackData(window.dndData);
  }
  populateDynamicOptions();
}

function subscribeToPackChanges() {
  if (window.dnd && typeof window.dnd.onChange === 'function') {
    window.dnd.onChange((detail) => {
      if (detail && detail.builder) {
        setPackData(detail.builder);
        populateDynamicOptions();
      }
    });
  } else {
    window.addEventListener('dnd-data-changed', () => {
      const fallback = window.dndBuilderData || window.dndData || packData;
      setPackData(fallback);
      populateDynamicOptions();
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
        await window.dnd.importPackFile(file);
        setPackStatus(`Imported ${file.name}`);
      } catch (error) {
        console.error('Failed to import pack', error);
        setPackStatus('Import failed. Check console for details.');
      } finally {
        fileInput.value = '';
        setTimeout(() => setPackStatus(''), 4000);
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
      setPackStatus('Fetching pack…');
      try {
        await window.dnd.importPackFromUrl(url);
        setPackStatus('Pack added from URL.');
      } catch (error) {
        console.error('Failed to import pack from URL', error);
        setPackStatus('Import failed. Check console for details.');
      } finally {
        setTimeout(() => setPackStatus(''), 4000);
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
        await window.dnd.reload();
        setPackStatus('Packs reloaded.');
      } catch (error) {
        console.error('Failed to reload packs', error);
        setPackStatus('Reload failed.');
      } finally {
        setTimeout(() => setPackStatus(''), 3000);
      }
    });
  }
}

function serializeForm() {
  const formData = new FormData(form);
  const data = {};
  for (const [key, value] of formData.entries()) {
    if (key.endsWith('[]')) {
      const base = key.slice(0, -2);
      if (!Array.isArray(data[base])) {
        data[base] = [];
      }
      data[base].push(value);
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (!Array.isArray(data[key])) {
        data[key] = [data[key]];
      }
      data[key].push(value);
      continue;
    }
    data[key] = value;
  }
  notifyModules('onSerialize', data, formData);
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
    const validity = getStepValidity(stepId);
    if (validity.valid !== false) {
      markStepCompleted(stepId);
    } else {
      state.completedSteps = state.completedSteps.filter((id) => id !== stepId);
    }
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
  updateNavigationState();
}

function hydrateForm(data) {
  if (!data) return;
  const merged = createBaseState();
  const incoming = cloneState(data);
  merged.data = { ...merged.data, ...(incoming.data || incoming) };
  merged.completedSteps = Array.isArray(incoming.completedSteps) ? [...incoming.completedSteps] : [];
  merged.saveCount = Number.isFinite(incoming.saveCount) ? incoming.saveCount : merged.saveCount;
  merged.updatedAt = incoming.updatedAt || merged.updatedAt;
  if (Number.isFinite(incoming.currentStepIndex)) {
    merged.currentStepIndex = Math.min(Math.max(0, incoming.currentStepIndex), steps.length - 1);
  }
  merged.currentStep = incoming.currentStep || (steps[merged.currentStepIndex] ? steps[merged.currentStepIndex].dataset.step : merged.currentStep);
  merged.derived = incoming.derived ? cloneState(incoming.derived) : computeDerivedState(merged.data);
  state = merged;

  Object.entries(state.data).forEach(([key, value]) => {
    if (value !== null && typeof value === 'object') return;
    const field = form.elements.namedItem(key);
    if (!field) return;
    if (field instanceof RadioNodeList) {
      Array.from(field).forEach((radio) => {
        radio.checked = radio.value === value;
      });
    } else {
      field.value = value != null ? String(value) : '';
    }
  });

  currentStep = state.currentStepIndex || 0;
  notifyModules('onStateHydrated', state);
  updateProgressIndicator();
  updateNavigationState();
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
  if (stored) {
    hydrateForm(stored);
  } else {
    state = createBaseState();
    state.data = serializeForm();
    state.derived = computeDerivedState(state.data);
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
  updateNavigationState();
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
  const stepId = steps[currentStep]?.dataset.step || null;
  await persistState({ markCompleted: false });
  const validity = getStepValidity(stepId);
  if (validity.valid === false) {
    updateNavigationState();
    return;
  }
  if (stepId) {
    markStepCompleted(stepId);
    await persistState({
      skipSerialization: true,
      skipHistory: true,
      skipDispatch: true,
      markCompleted: false,
      preserveTimestamp: true
    });
  }
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
  let section = null;
  let summaryNode = null;
  let listNode = null;
  let addButton = null;
  let warningsNode = null;
  let levelInput = null;
  const rows = [];
  let lastValidation = { valid: false, messages: [] };

  function getTotalLevel() {
    if (!levelInput) return 1;
    const parsed = Number.parseInt(levelInput.value, 10);
    const clamped = Number.isFinite(parsed) ? Math.min(20, Math.max(1, parsed)) : 1;
    if (String(clamped) !== levelInput.value) {
      levelInput.value = String(clamped);
    }
    return clamped;
  }

  function updateRowOrder() {
    rows.forEach((row, index) => {
      row.node.dataset.primary = index === 0 ? 'true' : 'false';
    });
  }

  function updateRemoveButtons() {
    rows.forEach((row, index) => {
      if (!row.removeButton) return;
      const hide = rows.length <= 1 || index === 0;
      row.removeButton.hidden = hide;
      row.removeButton.disabled = hide;
    });
  }

  function updateAddButtonState() {
    if (!addButton) return;
    const total = getTotalLevel();
    const canAdd = total >= 2 && rows.length < total;
    addButton.hidden = !canAdd;
    addButton.disabled = !canAdd;
  }

  function updateSelectOptions(row, preferredValue, preferredLabel) {
    if (!row || !row.select) return;
    const select = row.select;
    const { classes = [] } = getPackData();
    const currentValue = preferredValue ?? row.storedValue ?? select.value ?? '';
    const currentLabel = preferredLabel ?? row.customLabel ?? select.selectedOptions[0]?.textContent || '';
    const scrollTop = select.scrollTop;
    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Choose a class';
    select.appendChild(placeholder);
    classes.forEach((entry) => {
      const option = document.createElement('option');
      option.value = entry.slug || entry.id || entry.name;
      option.textContent = entry.name || option.value;
      if (entry.source && entry.source.name) {
        option.dataset.source = entry.source.name;
      }
      select.appendChild(option);
    });
    if (currentValue) {
      select.value = currentValue;
      if (select.value !== currentValue) {
        const custom = document.createElement('option');
        custom.value = currentValue;
        custom.textContent = currentLabel || currentValue;
        custom.dataset.custom = 'true';
        select.appendChild(custom);
        select.value = currentValue;
      }
    } else {
      select.value = '';
    }
    row.storedValue = select.value;
    row.customLabel = select.selectedOptions[0]?.textContent || currentLabel || '';
    select.scrollTop = scrollTop;
  }

  function createRow(initial = {}) {
    if (!listNode) return null;
    const node = document.createElement('div');
    node.className = 'class-row';

    const fields = document.createElement('div');
    fields.className = 'class-row-fields';

    const classLabel = document.createElement('label');
    classLabel.textContent = 'Class';
    const select = document.createElement('select');
    select.name = 'classes[]';
    classLabel.appendChild(select);

    const levelLabel = document.createElement('label');
    levelLabel.textContent = 'Levels';
    const levelField = document.createElement('input');
    levelField.type = 'number';
    levelField.name = 'classLevels[]';
    levelField.min = '1';
    levelField.max = '20';
    levelField.step = '1';
    levelField.value = String(Math.max(1, Number.parseInt(initial.level, 10) || 1));
    levelLabel.appendChild(levelField);

    fields.append(classLabel, levelLabel);

    const actions = document.createElement('div');
    actions.className = 'class-row-actions';
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'class-row-remove';
    removeButton.dataset.removeClass = 'true';
    removeButton.textContent = 'Remove';
    actions.appendChild(removeButton);

    const warning = document.createElement('p');
    warning.className = 'class-row-warning';
    warning.hidden = true;

    node.append(fields, actions, warning);
    listNode.appendChild(node);

    const row = {
      node,
      select,
      levelInput: levelField,
      removeButton,
      warning,
      customLabel: initial.name || '',
      storedValue: initial.value || initial.slug || initial.id || ''
    };

    updateSelectOptions(row, row.storedValue, row.customLabel);

    if (initial.value || initial.slug || initial.id) {
      const targetValue = initial.value || initial.slug || initial.id;
      select.value = targetValue;
      if (select.value !== targetValue) {
        if (initial.slug) {
          select.value = initial.slug;
        }
        if (select.value !== targetValue) {
          const custom = document.createElement('option');
          custom.value = targetValue;
          custom.textContent = initial.name || targetValue || 'Custom class';
          custom.dataset.custom = 'true';
          select.appendChild(custom);
          select.value = targetValue;
        }
      }
    }

    row.storedValue = select.value;
    row.customLabel = select.selectedOptions[0]?.textContent || row.customLabel || '';

    removeButton.addEventListener('click', () => handleRowRemoval(row));
    select.addEventListener('change', () => {
      row.storedValue = select.value;
      row.customLabel = select.selectedOptions[0]?.textContent || row.customLabel || '';
      refreshWithCurrentForm({ immediate: true });
    });
    levelField.addEventListener('input', () => {
      normalizeLevels();
      refreshWithCurrentForm({ immediate: true });
    });
    levelField.addEventListener('change', () => {
      normalizeLevels();
      refreshWithCurrentForm({ immediate: true });
    });

    rows.push(row);
    updateRemoveButtons();
    updateRowOrder();
    return row;
  }

  function handleRowRemoval(row) {
    if (rows.length <= 1) return;
    const index = rows.indexOf(row);
    if (index === -1) return;
    rows.splice(index, 1);
    row.node.remove();
    normalizeLevels();
    refreshWithCurrentForm({ immediate: true });
  }

  function ensureAtLeastOneRow() {
    if (!rows.length) {
      createRow({ level: getTotalLevel() });
    }
  }

  function updateAllOptions() {
    rows.forEach((row) => {
      updateSelectOptions(row, row.select.value, row.customLabel);
    });
  }

  function normalizeLevels() {
    if (!rows.length) return;
    const total = getTotalLevel();
    while (rows.length > total && rows.length > 1) {
      const row = rows.pop();
      row.node.remove();
    }
    const minPerRow = 1;
    let remaining = total;
    rows.forEach((row, index) => {
      const remainingRows = rows.length - index - 1;
      const minRemaining = remainingRows * minPerRow;
      let value = Number.parseInt(row.levelInput.value, 10);
      if (!Number.isFinite(value)) {
        value = minPerRow;
      }
      let maxAllowed = remaining - minRemaining;
      if (maxAllowed < minPerRow) {
        maxAllowed = minPerRow;
      }
      value = Math.max(minPerRow, Math.min(value, maxAllowed));
      row.levelInput.value = String(value);
      row.levelInput.min = String(minPerRow);
      row.levelInput.max = String(Math.max(minPerRow, maxAllowed));
      remaining -= value;
    });
    if (remaining > 0 && rows.length) {
      const first = rows[0];
      const current = Number.parseInt(first.levelInput.value, 10) || minPerRow;
      first.levelInput.value = String(current + remaining);
    }
    updateRemoveButtons();
    updateAddButtonState();
  }

  function getSerializableClasses() {
    return rows.map((row) => {
      const value = row.select.value || '';
      const label = row.customLabel || row.select.selectedOptions[0]?.textContent || '';
      const classes = getPackData().classes || [];
      const meta =
        (value ? findEntry(classes, value) : null) ||
        (label ? findEntry(classes, label) : null);
      const resolvedValue = value || (meta ? (meta.slug || meta.id || meta.name || '') : '');
      const level = Number.parseInt(row.levelInput.value, 10);
      return {
        value: resolvedValue,
        slug: meta?.slug || (resolvedValue || null),
        id: meta?.id || null,
        name: label || meta?.name || resolvedValue,
        level: Number.isFinite(level) && level > 0 ? level : 1,
        hitDie: meta?.hit_die || null,
        sourceId: meta?.sourceId || meta?.source?.id || null
      };
    });
  }

  function annotateClasses(classes) {
    const dataset = getPackData().classes || [];
    return classes.map((entry, index) => {
      const value = entry?.value || '';
      const meta =
        (value ? findEntry(dataset, value) : null) ||
        (entry?.slug ? findEntry(dataset, entry.slug) : null) ||
        (entry?.id ? findEntry(dataset, entry.id) : null) ||
        (entry?.name ? findEntry(dataset, entry.name) : null);
      const slug = meta?.slug || entry?.slug || value;
      const id = meta?.id || entry?.id || slug || value;
      const level = Math.max(0, Number.isFinite(entry?.level) ? entry.level : Number.parseInt(entry?.level, 10) || 0);
      const hitDie = entry?.hitDie || meta?.hit_die || null;
      const name = entry?.name || meta?.name || (slug ? slug.replace(/[-_]/g, ' ') : 'Class');
      const providesSpellcasting = classProvidesSpellcasting(meta, slug || id);
      return {
        index,
        value,
        slug,
        id,
        name,
        level,
        hitDie,
        meta,
        providesSpellcasting,
        hasSelection: Boolean(value)
      };
    });
  }

  function updateSummary(entries, derived) {
    if (!summaryNode) return;
    const selected = entries.filter((entry) => entry.hasSelection && entry.level > 0);
    if (!selected.length) {
      summaryNode.textContent = 'Pick a class to view hit dice, proficiencies, and proficiency bonus.';
      summaryNode.dataset.state = '';
      return;
    }
    const proficiency = derived?.classes?.proficiencyBonus ?? computeProficiencyBonus(getTotalLevel());
    const classParts = selected.map((entry) => {
      const hitDie = entry.hitDie ? ` (${entry.hitDie})` : '';
      return `${entry.name || 'Class'} Lv ${entry.level}${hitDie}`;
    });
    const breakdownEntries = derived?.classes?.hitDice?.breakdown && typeof derived.classes.hitDice.breakdown === 'object'
      ? Object.entries(derived.classes.hitDice.breakdown).filter(([, count]) => count > 0)
      : [];
    const hitDiceSummary = breakdownEntries.length
      ? breakdownEntries.map(([die, count]) => `${count}${die}`).join(', ')
      : selected
          .filter((entry) => entry.hitDie)
          .map((entry) => `${entry.level}${entry.hitDie}`)
          .join(', ');
    const detailParts = [];
    if (hitDiceSummary) {
      detailParts.push(`Hit Dice ${hitDiceSummary}`);
    }
    detailParts.push(`Proficiency +${proficiency}`);
    summaryNode.textContent = `${classParts.join(' · ')} · ${detailParts.join(' · ')}`;
  }

  function evaluateValidation(entries, derived) {
    const abilityTotals = derived?.abilities || {};
    const totalLevel = getTotalLevel();
    const rowResults = [];
    const aggregated = [];
    let blocking = false;
    let hasSelection = false;
    const totalAssigned = entries.reduce((sum, entry) => sum + Math.max(0, entry.level), 0);
    entries.forEach((entry, index) => {
      const label = entry.name || `Class ${index + 1}`;
      const messages = [];
      if (!entry.hasSelection) {
        messages.push({ type: 'error', text: 'Select a class for this row.' });
      } else {
        hasSelection = true;
        if (!entry.meta) {
          messages.push({ type: 'warn', text: 'Class not found in loaded packs. Check prerequisites manually.' });
        } else {
          const requirements = extractAbilityRequirementsFromMeta(entry.meta);
          requirements.forEach((requirement) => {
            const abilityId = requirement.abilityId || abilityNameToId(requirement.ability);
            const abilityLabel = abilityFields.find((field) => field.id === abilityId)?.label || requirement.ability || 'Ability';
            const abilityScore = abilityId ? abilityTotals?.[abilityId]?.total : null;
            if (abilityScore == null) {
              messages.push({ type: 'warn', text: `Verify ${abilityLabel} ${requirement.minimum}+ manually.` });
            } else if (abilityScore < requirement.minimum) {
              messages.push({ type: 'error', text: `${abilityLabel} ${requirement.minimum}+ required (current ${abilityScore}).` });
            }
          });
          if (entryRequiresSpellcasting(entry.meta)) {
            const canCast = entries.some((candidate) => candidate.providesSpellcasting);
            if (!canCast) {
              messages.push({ type: 'error', text: 'Requires the ability to cast spells.' });
            }
          }
        }
      }
      if (entry.level < 1) {
        messages.push({ type: 'error', text: 'Assign at least 1 level to this class.' });
      }
      rowResults.push({ label, messages });
      messages.forEach((message) => {
        aggregated.push(`${label}: ${message.text}`);
        if (message.type === 'error') {
          blocking = true;
        }
      });
    });
    if (!entries.length) {
      aggregated.push('Add at least one class to continue.');
      blocking = true;
    }
    if (!hasSelection) {
      aggregated.push('Select a class to continue.');
      blocking = true;
    }
    if (totalAssigned !== totalLevel) {
      aggregated.push(`Assigned levels (${totalAssigned}) do not match total level (${totalLevel}).`);
      blocking = true;
    }
    return {
      valid: !blocking && hasSelection && entries.length > 0 && totalAssigned === totalLevel,
      messages: aggregated,
      rows: rowResults
    };
  }

  function applyValidation(validation, entries) {
    rows.forEach((row, index) => {
      const result = validation.rows[index];
      if (!result || !result.messages.length) {
        row.warning.textContent = '';
        row.warning.hidden = true;
        row.node.dataset.state = '';
        return;
      }
      const hasError = result.messages.some((message) => message.type === 'error');
      row.warning.innerHTML = result.messages
        .map((message) => `${message.type === 'error' ? '⚠️' : 'ℹ️'} ${message.text}`)
        .join('<br />');
      row.warning.hidden = false;
      row.node.dataset.state = hasError ? 'error' : 'warn';
    });
    if (warningsNode) {
      if (validation.messages.length) {
        warningsNode.innerHTML = '';
        validation.messages.forEach((message) => {
          const item = document.createElement('li');
          item.textContent = message;
          warningsNode.appendChild(item);
        });
        warningsNode.hidden = false;
      } else {
        warningsNode.innerHTML = '';
        warningsNode.hidden = true;
      }
    }
    if (summaryNode) {
      if (validation.valid && entries.some((entry) => entry.hasSelection)) {
        summaryNode.dataset.state = 'ok';
      } else if (validation.messages.length) {
        summaryNode.dataset.state = 'warn';
      } else {
        summaryNode.dataset.state = '';
      }
    }
    lastValidation = validation;
  }

  function refresh(snapshot = null, { immediate = false } = {}) {
    if (!section) return;
    const base = snapshot ? { ...snapshot } : { ...state.data };
    if (!Array.isArray(base.classes)) {
      base.classes = getSerializableClasses().map((entry) => ({ ...entry }));
    } else {
      base.classes = base.classes.map((entry) => ({ ...entry }));
    }
    const annotated = annotateClasses(base.classes);
    const derived = immediate ? computeDerivedState(base) : (snapshot ? computeDerivedState(base) : state.derived);
    updateSummary(annotated, derived);
    const validation = evaluateValidation(annotated, derived);
    applyValidation(validation, annotated);
    updateRemoveButtons();
    updateAddButtonState();
    updateRowOrder();
    updateNavigationState();
  }

  function refreshWithCurrentForm({ immediate = false } = {}) {
    const snapshot = serializeForm();
    refresh(snapshot, { immediate });
  }

  function applyState(data) {
    if (!listNode) return;
    while (rows.length) {
      const row = rows.pop();
      row.node.remove();
    }
    const storedClasses = Array.isArray(data?.classes) ? data.classes : [];
    if (storedClasses.length) {
      storedClasses.forEach((entry) => {
        createRow({
          value: entry?.value || entry?.slug || entry?.id || entry?.name || '',
          slug: entry?.slug || null,
          id: entry?.id || null,
          name: entry?.name || '',
          level: entry?.level
        });
      });
    } else {
      createRow({
        value: data?.class || '',
        name: data?.className || '',
        level: Number.parseInt(data?.level, 10) || 1
      });
    }
    ensureAtLeastOneRow();
    normalizeLevels();
    updateAllOptions();
    refresh({ ...(data || {}), classes: getSerializableClasses() }, { immediate: false });
  }

  function handleAddRow() {
    const row = createRow({ level: 1 });
    normalizeLevels();
    refreshWithCurrentForm({ immediate: true });
    if (row && row.select) {
      row.select.focus();
    }
  }

  return {
    setup(sectionNode) {
      section = sectionNode;
      summaryNode = section.querySelector('[data-class-summary]');
      listNode = section.querySelector('[data-class-list]');
      addButton = section.querySelector('[data-add-class]');
      warningsNode = section.querySelector('[data-class-warnings]');
      levelInput = section.querySelector('input[name="level"]');
      if (warningsNode) {
        warningsNode.hidden = true;
        warningsNode.innerHTML = '';
      }
      if (listNode) {
        listNode.innerHTML = '';
      }
      rows.length = 0;
      createRow({ level: Number.parseInt(state.data?.level, 10) || 1 });
      ensureAtLeastOneRow();
      normalizeLevels();
      updateAllOptions();
      if (addButton) {
        addButton.addEventListener('click', handleAddRow);
      }
      if (levelInput) {
        levelInput.addEventListener('input', () => {
          normalizeLevels();
          refreshWithCurrentForm({ immediate: true });
        });
        levelInput.addEventListener('change', () => {
          normalizeLevels();
          refreshWithCurrentForm({ immediate: true });
        });
      }
      refresh({ ...(state.data || {}), classes: getSerializableClasses() }, { immediate: false });
    },
    onPackData() {
      updateAllOptions();
      refresh({ ...(state.data || {}), classes: getSerializableClasses() }, { immediate: false });
    },
    onStateHydrated(currentState) {
      applyState(currentState?.data || state.data);
    },
    onFormInput(event) {
      if (!event.target) return;
      if (event.target.name === 'classLevels[]' || event.target.name === 'classes[]' || event.target.name === 'level') {
        if (event.target.name === 'level') {
          normalizeLevels();
        }
        refreshWithCurrentForm({ immediate: true });
      }
    },
    onFormChange(event) {
      if (!event.target) return;
      if (event.target.name === 'classLevels[]' || event.target.name === 'classes[]' || event.target.name === 'level') {
        if (event.target.name === 'level') {
          normalizeLevels();
        }
        refreshWithCurrentForm({ immediate: true });
      }
    },
    onStatePersisted() {
      refresh(null, { immediate: false });
    },
    onSerialize(data) {
      const classes = getSerializableClasses();
      data.classes = classes.map((entry) => ({ ...entry }));
      delete data.classLevels;
      const primary = classes.find((entry) => entry.value);
      data.class = primary ? (primary.slug || primary.id || primary.value) : '';
      data.className = primary ? primary.name : '';
    },
    getValidity() {
      return lastValidation;
    }
  };
})();

const abilityModule = (() => {
  const abilityMap = new Map();

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
    updateDisplay();
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
  }

  return {
    setup(section) {
      initialize(section);
    },
    onPackData() {
      updateDisplay({ useFormValues: true });
    },
    onStateHydrated() {
      updateDisplay();
    },
    onFormInput(event) {
      if (event.target && abilityMap.has(event.target.name)) {
        updateDisplay({ useFormValues: true });
      }
    },
    onFormChange(event) {
      if (!event.target) return;
      if (abilityMap.has(event.target.name) || event.target.name === 'race') {
        updateDisplay({ useFormValues: true });
      }
    },
    onStatePersisted() {
      updateDisplay();
    }
  };
})();

const featsModule = (() => {
  let summaryNode = null;
  let featInput = null;
  const SPELLCASTING_CLASSES = new Set(['bard', 'cleric', 'druid', 'sorcerer', 'warlock', 'wizard', 'paladin', 'ranger']);

  function getClassMeta(data) {
    const classValue = data?.class;
    return findEntry(getPackData().classes || [], classValue);
  }

  function hasMartial(meta) {
    if (!meta) return false;
    return Array.isArray(meta.weapon_proficiencies) && meta.weapon_proficiencies.some((entry) => /martial/i.test(entry));
  }

  function canCast(meta, data) {
    if (meta && SPELLCASTING_CLASSES.has((meta.slug || meta.id || '').toLowerCase())) return true;
    const classValue = data?.class;
    return classValue ? SPELLCASTING_CLASSES.has(String(classValue).toLowerCase()) : false;
  }

  function render(data) {
    if (!summaryNode) return;
    const featValue = data?.signatureFeat || (featInput ? featInput.value : '');
    if (!featValue) {
      summaryNode.textContent = 'Select a feat to check prerequisites.';
      summaryNode.dataset.state = '';
      return;
    }
    const featEntry = findEntry(getPackData().feats || [], featValue);
    if (!featEntry) {
      summaryNode.textContent = 'Custom feat selected. Verify prerequisites manually.';
      summaryNode.dataset.state = 'warn';
      return;
    }
    const prereqs = Array.isArray(featEntry.prerequisites) ? featEntry.prerequisites : [];
    if (!prereqs.length) {
      summaryNode.textContent = 'No prerequisites.';
      summaryNode.dataset.state = 'ok';
      return;
    }
    const meta = getClassMeta(data);
    const checks = prereqs.map((prereq) => {
      const normalized = prereq.toLowerCase();
      let satisfied = false;
      if (normalized.includes('martial weapons')) {
        satisfied = hasMartial(meta);
      } else if (normalized.includes('cast at least one spell')) {
        satisfied = canCast(meta, data);
      }
      return { label: prereq, satisfied };
    });
    const allMet = checks.every((entry) => entry.satisfied);
    summaryNode.dataset.state = allMet ? 'ok' : 'warn';
    summaryNode.innerHTML = checks.map((entry) => `${entry.satisfied ? '✅' : '⚠️'} ${entry.label}`).join(' · ');
  }

  return {
    setup(section) {
      summaryNode = section.querySelector('#feat-prereqs');
      featInput = section.querySelector('input[name="signatureFeat"]');
      render(state.data);
    },
    onPackData() {
      render(state.data);
    },
    onStateHydrated(currentState) {
      render(currentState?.data || state.data);
    },
    onFormChange(event) {
      if (!event.target) return;
      if (
        event.target.name === 'signatureFeat' ||
        event.target.name === 'class' ||
        event.target.name === 'classes[]'
      ) {
        render(serializeForm());
      }
    }
  };
})();

const equipmentModule = (() => {
  let section = null;
  function render() {
    if (!section) return;
    section.dataset.itemCount = String((getPackData().items || []).length);
  }
  return {
    setup(node) {
      section = node;
      render();
    },
    onPackData() {
      render();
    }
  };
})();

const familiarModule = (() => {
  let section = null;
  function render() {
    if (!section) return;
    section.dataset.companionCount = String((getPackData().companions || []).length);
  }
  return {
    setup(node) {
      section = node;
      render();
    },
    onPackData() {
      render();
    }
  };
})();

const finalizeModule = (() => ({
  setup() {},
  onStateHydrated() {},
  onPackData() {}
}))();

const moduleDefinitions = {
  identity: identityModule,
  classLevel: classModule,
  abilities: abilityModule,
  feats: featsModule,
  equipment: equipmentModule,
  familiar: familiarModule,
  finalize: finalizeModule
};

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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
  });
} else {
  init();
}
