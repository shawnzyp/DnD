const STORAGE_KEY = 'dndBuilderState';

const abilityFields = [
  { id: 'str', label: 'Strength' },
  { id: 'dex', label: 'Dexterity' },
  { id: 'con', label: 'Constitution' },
  { id: 'int', label: 'Intelligence' },
  { id: 'wis', label: 'Wisdom' },
  { id: 'cha', label: 'Charisma' }
];

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const POINT_BUY_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const SPELLCASTING_CLASSES = new Set(['bard', 'cleric', 'druid', 'sorcerer', 'wizard', 'paladin', 'ranger', 'warlock']);
const FEAT_PREREQS = {
  'great-weapon-master': {
    description: 'Strength 13 or higher',
    check: ({ abilities }) => Number(abilities.str || 0) >= 13
  },
  observant: {
    description: 'Intelligence or Wisdom 13 or higher',
    check: ({ abilities }) => Number(abilities.int || 0) >= 13 || Number(abilities.wis || 0) >= 13
  },
  'war-caster': {
    description: 'Ability to cast at least one spell',
    check: ({ isSpellcaster }) => Boolean(isSpellcaster)
  }
};

const steps = Array.from(document.querySelectorAll('section.step'));
const form = document.getElementById('builder-form');
const indicator = document.getElementById('step-indicator');
const progressList = document.getElementById('progress-list');
const prevBtn = document.getElementById('prev-step');
const nextBtn = document.getElementById('next-step');
const summaryToggle = document.getElementById('toggle-summary');
const importInput = document.getElementById('builder-import');

const abilityWrappers = new Map();
const abilityInputs = new Map();
const abilityLabelToId = new Map(abilityFields.map(field => [field.label, field.id]));

let currentStep = 0;
let recommendedAbilities = [];
let packData = getPackData();

let state = {
  data: {},
  completedSteps: [],
  saveCount: 1,
  updatedAt: Date.now(),
  step: 0
};

const history = {
  entries: [],
  pointer: -1,
  applying: false
};

function getPackData() {
  return window.dndData || {
    packs: [],
    classes: [],
    backgrounds: [],
    feats: [],
    items: [],
    companions: []
  };
}

function normaliseValue(value) {
  return value
    ? value.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    : '';
}

function resolveByValue(list, value) {
  if (!value) return null;
  const target = normaliseValue(value);
  return (list || []).find(entry => {
    const candidates = [entry.slug, entry.id, entry.name, entry.title]
      .filter(Boolean)
      .map(normaliseValue);
    return candidates.includes(target);
  }) || null;
}

function ensureAbilityInputs() {
  const container = document.getElementById('abilities-grid');
  if (!container || container.children.length > 0) return;
  abilityFields.forEach((field, index) => {
    const wrapper = document.createElement('label');
    wrapper.className = 'ability';
    wrapper.dataset.ability = field.id;
    wrapper.innerHTML = `<strong>${field.label}</strong><span>Score</span>`;
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '3';
    input.max = '20';
    input.name = field.id;
    input.value = String(STANDARD_ARRAY[index] ?? 10);
    wrapper.appendChild(input);
    abilityWrappers.set(field.id, wrapper);
    abilityInputs.set(field.id, input);
    container.appendChild(wrapper);
  });
}

function buildProgressList() {
  if (!progressList || progressList.children.length) return;
  steps.forEach((step, index) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.index = String(index);
    const title = step.querySelector('h2')?.textContent || `Step ${index + 1}`;
    button.innerHTML = `<span>${index + 1}. ${title}</span>Step ${index + 1}`;
    button.setAttribute('aria-label', `Go to step ${index + 1}: ${title}`);
    button.addEventListener('click', () => {
      goToStep(index);
    });
    item.appendChild(button);
    progressList.appendChild(item);
  });
  renderProgress();
}

function renderProgress() {
  if (!progressList) return;
  const buttons = progressList.querySelectorAll('button[data-index]');
  buttons.forEach(button => {
    const index = Number(button.dataset.index);
    button.setAttribute('aria-current', index === currentStep ? 'step' : 'false');
    const stepId = steps[index]?.dataset.step;
    const complete = stepId ? state.completedSteps.includes(stepId) : false;
    button.dataset.complete = complete ? 'true' : 'false';
  });
}

function renderStep(index) {
  if (!steps[index]) return;
  steps.forEach((step, i) => {
    step.classList.toggle('active', i === index);
  });
  const title = steps[index].querySelector('h2');
  indicator.textContent = `Step ${index + 1} of ${steps.length} · ${title ? title.textContent : ''}`;
  prevBtn.disabled = index === 0;
  nextBtn.textContent = index === steps.length - 1 ? 'Finish' : 'Next';
  renderProgress();
}

function populateSelectOptions(select, entries, placeholderText) {
  if (!select) return;
  const previousValue = select.value;
  select.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = placeholderText;
  select.appendChild(placeholder);
  entries.forEach(entry => {
    const option = document.createElement('option');
    option.value = entry.slug || entry.id || entry.name;
    option.textContent = entry.name || entry.title || option.value;
    if (entry.source && entry.source.name) {
      option.dataset.source = entry.source.name;
    }
    select.appendChild(option);
  });
  if (previousValue && entries.some(entry => (entry.slug || entry.id || entry.name) === previousValue)) {
    select.value = previousValue;
  }
}

function populateDatalist(id, entries, formatter) {
  const list = document.getElementById(id);
  if (!list) return;
  list.innerHTML = '';
  entries.forEach(entry => {
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
  const { packs = [] } = packData;
  if (!packs.length) {
    target.textContent = 'No licensed content packs loaded.';
    return;
  }
  const summary = packs.map(pack => {
    const edition = pack.edition ? ` · ${pack.edition}` : '';
    const license = pack.license ? ` • ${pack.license}` : '';
    return `${pack.name}${edition}${license}`;
  }).join(' | ');
  target.textContent = `Loaded packs: ${summary}`;
}

function populateDynamicOptions() {
  packData = getPackData();
  if (form && form.elements) {
    const classField = form.elements.namedItem('class');
    populateSelectOptions(classField, packData.classes || [], 'Choose a class');
    const familiarField = form.elements.namedItem('familiarType');
    populateSelectOptions(familiarField, packData.companions || [], 'Select a creature');
  }
  populateDatalist('background-options', packData.backgrounds || []);
  populateDatalist('feat-options', packData.feats || []);
  populateDatalist('item-options', packData.items || [], (entry) => {
    const category = entry.category ? ` (${entry.category})` : '';
    return `${entry.name}${category}`;
  });
  updatePackMeta();
}

function markStepCompleted(stepId) {
  if (!stepId) return;
  if (!state.completedSteps.includes(stepId)) {
    state.completedSteps = [...state.completedSteps, stepId];
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

function snapshotState() {
  return {
    data: { ...state.data },
    completedSteps: [...state.completedSteps],
    saveCount: state.saveCount,
    updatedAt: state.updatedAt,
    step: currentStep
  };
}

function pushHistory() {
  if (history.applying) return;
  const snapshot = snapshotState();
  const serialised = JSON.stringify({
    data: snapshot.data,
    step: snapshot.step,
    completedSteps: snapshot.completedSteps
  });
  if (history.entries[history.pointer]?.serialised === serialised) {
    history.entries[history.pointer].snapshot = snapshot;
    return;
  }
  history.entries = history.entries.slice(0, history.pointer + 1);
  history.entries.push({ snapshot, serialised });
  history.pointer = history.entries.length - 1;
}

function applySnapshot(snapshot) {
  if (!snapshot) return;
  history.applying = true;
  hydrateForm(snapshot);
  history.applying = false;
  renderStep(currentStep);
  notifyStateChange();
  persistState({ skipHistory: true, preserveTimestamp: true, updateCompletion: false });
}

function undo() {
  if (history.pointer <= 0) return;
  history.pointer -= 1;
  const entry = history.entries[history.pointer];
  applySnapshot(entry?.snapshot);
}

function redo() {
  if (history.pointer >= history.entries.length - 1) return;
  history.pointer += 1;
  const entry = history.entries[history.pointer];
  applySnapshot(entry?.snapshot);
}

function getAbilityValues() {
  const values = {};
  abilityFields.forEach(field => {
    const input = abilityInputs.get(field.id);
    values[field.id] = input ? Number(input.value || 0) : 0;
  });
  return values;
}

function calculatePointBuyCost(values) {
  return Object.values(values).reduce((total, value) => {
    const clamped = Math.max(8, Math.min(Number(value) || 0, 15));
    return total + (POINT_BUY_COST[clamped] ?? 0);
  }, 0);
}

function applyClassRecommendations(entry) {
  recommendedAbilities = Array.isArray(entry?.primary_abilities) ? entry.primary_abilities.slice() : [];
  abilityFields.forEach(field => {
    const wrapper = abilityWrappers.get(field.id);
    const isRecommended = recommendedAbilities.includes(field.label);
    if (wrapper) {
      wrapper.classList.toggle('recommended', Boolean(entry) && isRecommended);
    }
  });
}

function updateBackgroundDetails() {
  const details = document.getElementById('background-details');
  if (!details) return;
  const backgroundField = form.elements.namedItem('background');
  const value = backgroundField ? backgroundField.value.trim() : '';
  if (!value) {
    details.textContent = 'Select a background to view skill proficiencies and features.';
    return;
  }
  const entry = resolveByValue(packData.backgrounds, value);
  if (!entry) {
    details.textContent = 'No matching background found in the loaded content packs.';
    return;
  }
  const parts = [`<strong>${entry.name}</strong>`];
  if (entry.description) {
    parts.push(`<div>${entry.description}</div>`);
  }
  if (Array.isArray(entry.skills) && entry.skills.length) {
    const items = entry.skills.map(skill => `<li>${skill}</li>`).join('');
    parts.push(`<div><strong>Skill Proficiencies</strong><ul>${items}</ul></div>`);
  }
  if (entry.feature) {
    parts.push(`<div><strong>Feature</strong>${entry.feature}</div>`);
  }
  details.innerHTML = parts.join('');
}

function updateClassDetails() {
  const details = document.getElementById('class-details');
  if (!details) return;
  const classField = form.elements.namedItem('class');
  const value = classField ? classField.value : '';
  if (!value) {
    applyClassRecommendations(null);
    details.textContent = 'Choose a class to review hit dice, saving throws, and recommended abilities.';
    return;
  }
  const entry = resolveByValue(packData.classes, value);
  if (!entry) {
    applyClassRecommendations(null);
    details.textContent = 'No matching class found in the loaded content packs.';
    return;
  }
  applyClassRecommendations(entry);
  const parts = [`<strong>${entry.name}</strong>`];
  if (entry.description) {
    parts.push(`<div>${entry.description}</div>`);
  }
  if (entry.hit_die) {
    parts.push(`<div><strong>Hit Die</strong>${entry.hit_die}</div>`);
  }
  if (Array.isArray(entry.primary_abilities) && entry.primary_abilities.length) {
    parts.push(`<div><strong>Primary Abilities</strong>${entry.primary_abilities.join(', ')}</div>`);
  }
  if (Array.isArray(entry.saving_throws) && entry.saving_throws.length) {
    parts.push(`<div><strong>Saving Throws</strong>${entry.saving_throws.join(', ')}</div>`);
  }
  details.innerHTML = parts.join('');
}

function updateAbilityDetails() {
  const details = document.getElementById('ability-details');
  if (!details) return;
  const methodField = form.elements.namedItem('abilityMethod');
  const poolField = form.elements.namedItem('scorePool');
  const method = methodField ? methodField.value : 'Standard Array';
  const values = getAbilityValues();
  const parts = [];
  if (method === 'Standard Array') {
    parts.push(`<strong>Ability Method</strong>Standard Array active (15, 14, 13, 12, 10, 8). Adjust values as needed.`);
  } else if (method === 'Point Buy') {
    const pool = Number(poolField?.value || 27);
    const cost = calculatePointBuyCost(values);
    const remaining = pool - cost;
    const status = remaining < 0 ? `Over budget by ${Math.abs(remaining)} point(s).` : `${remaining} point(s) remaining.`;
    parts.push(`<strong>Ability Method</strong>Point buy budgeting ${pool} points. ${status}`);
  } else {
    parts.push(`<strong>Ability Method</strong>Manual entry enabled. Assign scores freely.`);
  }
  if (recommendedAbilities.length) {
    const ids = recommendedAbilities
      .map(name => abilityLabelToId.get(name))
      .filter(Boolean)
      .map(id => id.toUpperCase());
    parts.push(`<div><strong>Recommended Focus</strong>${recommendedAbilities.join(', ')} (${ids.join(', ')})</div>`);
  }
  details.innerHTML = parts.join('');
}

function updateFeatDetails() {
  const details = document.getElementById('feat-details');
  if (!details) return;
  const featField = form.elements.namedItem('signatureFeat');
  const value = featField ? featField.value.trim() : '';
  if (!value) {
    details.textContent = 'Select a feat to review its description and prerequisites.';
    return;
  }
  const entry = resolveByValue(packData.feats, value);
  if (!entry) {
    details.textContent = 'No matching feat found in the loaded content packs.';
    return;
  }
  const slug = entry.slug || normaliseValue(entry.name);
  const prereq = FEAT_PREREQS[slug];
  const parts = [`<strong>${entry.name}</strong>`];
  if (entry.description) {
    parts.push(`<div>${entry.description}</div>`);
  }
  if (prereq) {
    const classField = form.elements.namedItem('class');
    const selectedClass = classField ? resolveByValue(packData.classes, classField.value) : null;
    const isSpellcaster = selectedClass ? SPELLCASTING_CLASSES.has(selectedClass.slug) : false;
    const abilities = getAbilityValues();
    const meets = prereq.check({ abilities, isSpellcaster, state, selectedClass });
    parts.push(`<div><strong>Prerequisite</strong>${prereq.description}</div>`);
    if (!meets) {
      parts.push('<div style="margin-top:0.35rem;color:#f8bbbb;">Current ability choices do not meet this prerequisite.</div>');
    }
  }
  details.innerHTML = parts.join('');
}

function updateFamiliarDetails() {
  const details = document.getElementById('familiar-details');
  if (!details) return;
  const familiarField = form.elements.namedItem('familiarType');
  const value = familiarField ? familiarField.value : '';
  if (!value) {
    details.textContent = 'Select a companion to view its role and traits.';
    return;
  }
  const entry = resolveByValue(packData.companions, value);
  if (!entry) {
    details.textContent = 'No matching companion found in the loaded content packs.';
    return;
  }
  const parts = [`<strong>${entry.name}</strong>`];
  if (entry.type) {
    parts.push(`<div><strong>Type</strong>${entry.type}</div>`);
  }
  if (entry.role) {
    parts.push(`<div><strong>Role</strong>${entry.role}</div>`);
  }
  if (entry.description) {
    parts.push(`<div>${entry.description}</div>`);
  }
  details.innerHTML = parts.join('');
}

function applyAbilityMethodDefaults(method) {
  const poolField = form.elements.namedItem('scorePool');
  let changed = false;
  if (method === 'Standard Array') {
    STANDARD_ARRAY.forEach((value, index) => {
      const field = abilityFields[index];
      const input = abilityInputs.get(field.id);
      if (input && input.value !== String(value)) {
        input.value = String(value);
        changed = true;
      }
    });
    if (poolField && poolField.value !== '') {
      poolField.value = '';
      changed = true;
    }
  } else if (method === 'Point Buy') {
    if (poolField && poolField.value !== '27') {
      poolField.value = '27';
      changed = true;
    }
  } else if (method === 'Manual Entry') {
    if (poolField && poolField.value !== '') {
      poolField.value = '';
      changed = true;
    }
  }
  updateAbilityDetails();
  if (changed) {
    commitProgrammaticChange();
  }
}

async function persistState(options = {}) {
  const { skipHistory = false, preserveTimestamp = false, updateCompletion = true } = options;
  state.data = serializeForm();
  if (!preserveTimestamp) {
    state.updatedAt = Date.now();
  }
  if (updateCompletion) {
    markStepCompleted(steps[currentStep]?.dataset.step);
  }
  state.step = currentStep;
  if (!skipHistory && !history.applying) {
    pushHistory();
  }
  notifyStateChange();
  writeLocal(STORAGE_KEY, state);
  await writeIndexedDB(STORAGE_KEY, state);
  window.dndBuilderState = state;
  window.dispatchEvent(new CustomEvent('dnd-builder-updated', { detail: state }));
  window.dispatchEvent(new CustomEvent('dnd-state-changed'));
}

function hydrateForm(data) {
  if (!data) return;
  state = { ...state, ...data };
  state.data = data.data || state.data;
  state.completedSteps = Array.isArray(data.completedSteps) ? data.completedSteps.slice() : [];
  state.saveCount = typeof data.saveCount === 'number' ? data.saveCount : state.saveCount;
  state.updatedAt = data.updatedAt || state.updatedAt;
  if (typeof data.step === 'number' && data.step >= 0 && data.step < steps.length) {
    currentStep = data.step;
  }
  Object.entries(state.data).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (!field) return;
    if (field instanceof RadioNodeList) {
      Array.from(field).forEach(radio => {
        radio.checked = radio.value === value;
      });
    } else {
      field.value = value;
    }
  });
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
  }
  state.step = currentStep;
  state.data = serializeForm();
  window.dndBuilderState = state;
  window.dispatchEvent(new CustomEvent('dnd-builder-updated', { detail: state }));
}

function goToStep(index) {
  if (index < 0 || index >= steps.length) return;
  currentStep = index;
  renderStep(index);
  state.step = currentStep;
  persistState({ skipHistory: true, preserveTimestamp: true, updateCompletion: false });
}

function nextStep() {
  persistState();
  if (currentStep < steps.length - 1) {
    goToStep(currentStep + 1);
  } else {
    const finalizeStep = document.querySelector('[data-step="finalize"]');
    finalizeStep?.scrollIntoView({ behavior: 'smooth' });
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

function commitProgrammaticChange(options) {
  state.saveCount += 1;
  persistState(options);
}

function handleFormInput(event) {
  if (event && event.target === form.elements.namedItem('abilityMethod')) {
    return;
  }
  state.saveCount += 1;
  persistState();
}

function setupFinalizeActions() {
  form.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.action;
    if (!action) return;
    if (action === 'print') {
      await persistState({ skipHistory: true, preserveTimestamp: true });
      window.print();
    }
    if (action === 'export') {
      await persistState({ skipHistory: true, preserveTimestamp: true });
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${state.data.name || 'character'}-builder.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    if (action === 'import') {
      importInput?.click();
    }
  });
}

function setupSummaryToggle() {
  if (!summaryToggle) return;
  summaryToggle.setAttribute('aria-expanded', 'false');
  summaryToggle.addEventListener('click', () => {
    const panel = document.getElementById('summary-panel');
    if (!panel) return;
    const visible = panel.classList.toggle('visible');
    summaryToggle.setAttribute('aria-expanded', visible ? 'true' : 'false');
  });
}

function handleHistoryShortcut(event) {
  if (!(event.ctrlKey || event.metaKey)) return;
  const key = event.key.toLowerCase();
  if (key === 'z') {
    event.preventDefault();
    if (event.shiftKey) {
      redo();
    } else {
      undo();
    }
  }
  if (key === 'y') {
    event.preventDefault();
    redo();
  }
}

function handleImportSelection() {
  const file = importInput?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      applyImportedState(parsed);
    } catch (error) {
      console.error('Import failed', error);
    } finally {
      if (importInput) {
        importInput.value = '';
      }
    }
  };
  reader.readAsText(file);
}

function applyImportedState(imported) {
  if (!imported || typeof imported !== 'object') return;
  const dataPayload = imported && typeof imported.data === 'object' ? imported.data : imported;
  const normalized = {
    data: dataPayload && typeof dataPayload === 'object' ? dataPayload : {},
    completedSteps: Array.isArray(imported.completedSteps) ? imported.completedSteps : [],
    saveCount: typeof imported.saveCount === 'number' ? imported.saveCount : state.saveCount,
    updatedAt: imported.updatedAt || Date.now(),
    step: typeof imported.step === 'number' ? imported.step : 0
  };
  hydrateForm(normalized);
  renderStep(currentStep);
  notifyStateChange();
  persistState({ skipHistory: false, preserveTimestamp: true, updateCompletion: false });
}

function notifyStateChange() {
  updateBackgroundDetails();
  updateClassDetails();
  updateAbilityDetails();
  updateFeatDetails();
  updateFamiliarDetails();
  renderProgress();
}

async function init() {
  ensureAbilityInputs();
  buildProgressList();
  updateBackgroundDetails();
  updateClassDetails();
  updateAbilityDetails();
  updateFeatDetails();
  updateFamiliarDetails();
  if (window.dndDataReady && typeof window.dndDataReady.then === 'function') {
    try {
      await window.dndDataReady;
    } catch (error) {
      console.warn('Failed to hydrate packs before builder init', error);
    }
  }
  populateDynamicOptions();
  await loadState();
  renderStep(currentStep);
  notifyStateChange();
  if (!history.entries.length) {
    pushHistory();
  }
  form.addEventListener('input', handleFormInput);
  form.addEventListener('change', (event) => {
    if (event.target === form.elements.namedItem('abilityMethod')) {
      applyAbilityMethodDefaults(event.target.value);
    }
  });
  prevBtn.addEventListener('click', prevStep);
  nextBtn.addEventListener('click', nextStep);
  setupFinalizeActions();
  setupSummaryToggle();
  document.addEventListener('keydown', handleHistoryShortcut);
  importInput?.addEventListener('change', handleImportSelection);
  window.addEventListener('beforeunload', () => {
    persistState({ skipHistory: true, preserveTimestamp: true, updateCompletion: false });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  init();
});

window.addEventListener('dnd-data-ready', () => {
  if (document.readyState === 'loading') return;
  populateDynamicOptions();
  notifyStateChange();
});

window.dndBuilder = {
  undo,
  redo,
  exportState: () => ({ ...state, data: { ...state.data } }),
  importState: applyImportedState,
  getState: () => ({ ...state, data: { ...state.data } })
};
