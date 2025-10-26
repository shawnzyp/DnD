const STORAGE_KEY = 'dndBuilderState';

const abilityFields = [
  { id: 'str', label: 'Strength' },
  { id: 'dex', label: 'Dexterity' },
  { id: 'con', label: 'Constitution' },
  { id: 'int', label: 'Intelligence' },
  { id: 'wis', label: 'Wisdom' },
  { id: 'cha', label: 'Charisma' }
];

const steps = Array.from(document.querySelectorAll('section.step'));
const form = document.getElementById('builder-form');
const indicator = document.getElementById('step-indicator');
const prevBtn = document.getElementById('prev-step');
const nextBtn = document.getElementById('next-step');
const summaryToggle = document.getElementById('toggle-summary');

let currentStep = 0;
let state = {
  data: {},
  completedSteps: [],
  saveCount: 1,
  updatedAt: Date.now()
};

let packData = {
  packs: [],
  classes: [],
  races: [],
  backgrounds: [],
  feats: [],
  items: [],
  companions: []
};

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
  const status = document.getElementById('builder-pack-status');
  if (!status) return;
  status.textContent = message || '';
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

function ensureAbilityInputs() {
  const container = document.getElementById('abilities-grid');
  if (!container) return;
  if (container.children.length > 0) return;
  abilityFields.forEach(field => {
    const wrapper = document.createElement('label');
    wrapper.className = 'ability';
    wrapper.innerHTML = `<strong>${field.label}</strong><span>Score</span>`;
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '3';
    input.max = '20';
    input.name = field.id;
    input.value = '10';
    wrapper.appendChild(input);
    container.appendChild(wrapper);
  });
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
  const { packs = [] } = getPackData();
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
  const data = getPackData();
  if (form && form.elements) {
    const classField = form.elements.namedItem('class');
    populateSelectOptions(classField, data.classes || [], 'Choose a class');
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
}

function renderStep(index) {
  steps.forEach((step, i) => {
    step.classList.toggle('active', i === index);
  });
  indicator.textContent = `Step ${index + 1} of ${steps.length} · ${steps[index].querySelector('h2').textContent}`;
  prevBtn.disabled = index === 0;
  nextBtn.textContent = index === steps.length - 1 ? 'Finish' : 'Next';
}

function markStepCompleted(stepId) {
  if (!state.completedSteps.includes(stepId)) {
    state.completedSteps.push(stepId);
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

async function persistState() {
  state.data = serializeForm();
  state.updatedAt = Date.now();
  markStepCompleted(steps[currentStep].dataset.step);
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
  state.completedSteps = Array.isArray(data.completedSteps) ? data.completedSteps : [];
  state.saveCount = data.saveCount || state.saveCount;
  state.updatedAt = data.updatedAt || state.updatedAt;

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
  window.dndBuilderState = state;
  window.dispatchEvent(new CustomEvent('dnd-builder-updated', { detail: state }));
}

function goToStep(index) {
  if (index < 0 || index >= steps.length) return;
  currentStep = index;
  renderStep(index);
}

function nextStep() {
  persistState();
  if (currentStep < steps.length - 1) {
    goToStep(currentStep + 1);
  } else {
    const finalizeStep = document.querySelector('[data-step="finalize"]');
    finalizeStep.scrollIntoView({ behavior: 'smooth' });
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
  persistState();
}

function setupFinalizeActions() {
  form.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.action;
    if (!action) return;
    if (action === 'print') {
      persistState();
      window.print();
    }
    if (action === 'export') {
      persistState();
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
  });
}

function setupSummaryToggle() {
  summaryToggle.addEventListener('click', () => {
    document.getElementById('summary-panel').classList.toggle('visible');
  });
}

async function init() {
  ensureAbilityInputs();
  wirePackControls();
  subscribeToPackChanges();
  await hydratePackData();
  await loadState();
  renderStep(currentStep);
  form.addEventListener('input', () => {
    state.saveCount += 1;
    handleInput();
  });
  prevBtn.addEventListener('click', prevStep);
  nextBtn.addEventListener('click', nextStep);
  setupFinalizeActions();
  setupSummaryToggle();
  window.addEventListener('beforeunload', persistState);
}

document.addEventListener('DOMContentLoaded', () => {
  init();
});
