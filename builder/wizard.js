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
  const entry = findEntry(getPackData().classes || [], formData?.class);
  const weaponProfs = new Set();
  const armorProfs = new Set();
  if (entry && Array.isArray(entry.weapon_proficiencies)) {
    entry.weapon_proficiencies.forEach((value) => {
      if (!value) return;
      weaponProfs.add(String(value).toLowerCase());
    });
  }
  if (entry && Array.isArray(entry.armor_proficiencies)) {
    entry.armor_proficiencies.forEach((value) => {
      if (!value) return;
      armorProfs.add(String(value).toLowerCase());
    });
  }
  return { entry, weaponProfs, armorProfs };
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
  const featNames = [];
  if (formData?.signatureFeat) {
    featNames.push(formData.signatureFeat);
  }
  parseFeatList(formData?.bonusFeats).forEach((feat) => {
    featNames.push(feat);
  });
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
  derived.equipment = computeEquipmentDerived(formData, derived.abilities);
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
    populateSelectOptions(classField, data.classes || [], 'Choose a class');
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
  if (state && state.data) {
    state.derived = computeDerivedState(state.data);
    window.dndBuilderState = state;
  }
  notifyModules('onPackData', data);
  if (state && state.data) {
    window.dispatchEvent(new CustomEvent('dnd-builder-updated', { detail: state }));
    window.dispatchEvent(new CustomEvent('dnd-state-changed'));
  }
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
    data[key] = value;
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
    const field = form.elements.namedItem(key);
    if (!field) return;
    if (field instanceof RadioNodeList) {
      Array.from(field).forEach((radio) => {
        radio.checked = radio.value === value;
      });
    } else {
      field.value = value;
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
  let classSelect = null;

  function render(data) {
    if (!summaryNode) return;
    const classValue = data?.class || (classSelect ? classSelect.value : '');
    if (!classValue) {
      summaryNode.textContent = 'Pick a class to view hit die and proficiencies.';
      summaryNode.dataset.state = '';
      return;
    }
    const entry = findEntry(getPackData().classes || [], classValue);
    if (!entry) {
      summaryNode.textContent = 'Custom class selected. Review proficiencies manually.';
      summaryNode.dataset.state = 'warn';
      return;
    }
    const hitDie = entry.hit_die ? `Hit die ${entry.hit_die}` : 'Hit die —';
    const saves = Array.isArray(entry.saving_throws) && entry.saving_throws.length ? entry.saving_throws.join(', ') : 'None';
    const weapons = Array.isArray(entry.weapon_proficiencies) && entry.weapon_proficiencies.length ? entry.weapon_proficiencies.join(', ') : 'None';
    summaryNode.textContent = `${hitDie} · Saves: ${saves} · Weapons: ${weapons}`;
    summaryNode.dataset.state = 'ok';
  }

  return {
    setup(section) {
      summaryNode = section.querySelector('[data-class-summary]');
      classSelect = section.querySelector('select[name="class"]');
      render(state.data);
    },
    onPackData() {
      render(state.data);
    },
    onStateHydrated(currentState) {
      render(currentState?.data || state.data);
    },
    onFormChange(event) {
      if (event.target && event.target.name === 'class') {
        render(serializeForm());
      }
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
      if (event.target.name === 'signatureFeat' || event.target.name === 'class') {
        render(serializeForm());
      }
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
      if (target.name === 'class') {
        render({ useFormValues: true });
      }
    },
    onStatePersisted() {
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
