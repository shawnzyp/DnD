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
const summaryPanel = document.getElementById('summary-panel');
const summaryClose = summaryPanel ? summaryPanel.querySelector('[data-action="close-summary"]') : null;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let currentStep = 0;
let state = {
  data: {},
  completedSteps: [],
  saveCount: 1,
  updatedAt: Date.now()
};
let releaseSummaryFocus = null;

function createFocusTrap(container, onClose) {
  if (!container) return () => {};
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  let focusable = Array.from(container.querySelectorAll(selectors)).filter((element) => !element.hasAttribute('aria-hidden'));
  if (!focusable.length) {
    container.setAttribute('tabindex', '-1');
    focusable = [container];
  }
  const [first] = focusable;
  const last = focusable[focusable.length - 1];

  function handleKeydown(event) {
    if (event.key === 'Tab') {
      if (focusable.length === 1) {
        event.preventDefault();
        first.focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose?.();
    }
  }

  container.addEventListener('keydown', handleKeydown);
  requestAnimationFrame(() => {
    if (first && typeof first.focus === 'function') {
      first.focus();
    }
  });

  return () => {
    container.removeEventListener('keydown', handleKeydown);
    if (previous && typeof previous.focus === 'function') {
      previous.focus();
    }
  };
}

function openSummaryPanel() {
  if (!summaryPanel || !summaryToggle) return;
  summaryPanel.classList.add('visible');
  summaryPanel.setAttribute('aria-hidden', 'false');
  summaryToggle.setAttribute('aria-expanded', 'true');
  releaseSummaryFocus = createFocusTrap(summaryPanel, closeSummaryPanel);
}

function closeSummaryPanel() {
  if (!summaryPanel || !summaryToggle) return;
  summaryPanel.classList.remove('visible');
  summaryPanel.setAttribute('aria-hidden', 'true');
  summaryToggle.setAttribute('aria-expanded', 'false');
  if (releaseSummaryFocus) {
    const release = releaseSummaryFocus;
    releaseSummaryFocus = null;
    release();
  } else {
    summaryToggle.focus();
  }
}

function toggleSummaryPanel(force) {
  if (!summaryPanel) return;
  const shouldOpen = typeof force === 'boolean' ? force : !summaryPanel.classList.contains('visible');
  if (shouldOpen) {
    openSummaryPanel();
  } else {
    closeSummaryPanel();
  }
}

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
    const isActive = i === index;
    step.classList.toggle('active', isActive);
    step.setAttribute('aria-hidden', String(!isActive));
  });
  indicator.textContent = `Step ${index + 1} of ${steps.length} · ${steps[index].querySelector('h2').textContent}`;
  prevBtn.disabled = index === 0;
  prevBtn.setAttribute('aria-disabled', String(index === 0));
  const isLastStep = index === steps.length - 1;
  nextBtn.disabled = false;
  nextBtn.setAttribute('aria-disabled', 'false');
  nextBtn.textContent = isLastStep ? 'Finish' : 'Next';
  nextBtn.setAttribute('aria-label', isLastStep ? 'Finish wizard' : 'Go to next step');
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
    if (finalizeStep && typeof finalizeStep.scrollIntoView === 'function') {
      finalizeStep.scrollIntoView({ behavior: prefersReducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    }
    nextBtn.disabled = true;
    nextBtn.setAttribute('aria-disabled', 'true');
    nextBtn.textContent = 'Saved';
    nextBtn.setAttribute('aria-label', 'Progress saved');
    setTimeout(() => {
      nextBtn.disabled = false;
      nextBtn.setAttribute('aria-disabled', 'false');
      nextBtn.textContent = 'Finish';
      nextBtn.setAttribute('aria-label', 'Finish wizard');
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
      toggleSummaryPanel(false);
      window.print();
    }
    if (action === 'export') {
      persistState();
      toggleSummaryPanel(false);
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
  if (!summaryToggle || !summaryPanel) return;
  summaryToggle.addEventListener('click', () => {
    toggleSummaryPanel();
  });
  if (summaryClose) {
    summaryClose.addEventListener('click', () => {
      toggleSummaryPanel(false);
    });
  }
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && summaryPanel.classList.contains('visible')) {
      toggleSummaryPanel(false);
    }
  });
}

async function init() {
  ensureAbilityInputs();
  if (window.dndDataReady && typeof window.dndDataReady.then === 'function') {
    try {
      await window.dndDataReady;
    } catch (error) {
      console.warn('Failed to hydrate packs before builder init', error);
    }
  }
  populateDynamicOptions();
  await loadState();
  if (summaryPanel) {
    summaryPanel.setAttribute('aria-hidden', 'true');
  }
  if (summaryToggle) {
    summaryToggle.setAttribute('aria-expanded', 'false');
  }
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

window.addEventListener('dnd-data-ready', () => {
  if (document.readyState === 'loading') return;
  populateDynamicOptions();
});
