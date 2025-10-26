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

function init() {
  ensureAbilityInputs();
  loadState().then(() => {
    renderStep(currentStep);
  });
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

document.addEventListener('DOMContentLoaded', init);
