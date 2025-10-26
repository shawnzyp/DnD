const STORAGE_KEY = 'dndBuilderState';
const COACHMARK_KEY = 'dndBuilderCoachMarksSeen';

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
const coachmarkOverlay = document.getElementById('coachmark-overlay');

let currentStep = 0;
let state = {
  data: {},
  completedSteps: [],
  saveCount: 1,
  updatedAt: Date.now()
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
    document.removeEventListener('keydown', handleKeydown, true);
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    }
  }

  function handleKeydown(event) {
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
    document.addEventListener('keydown', handleKeydown, true);
    loadLegalNotice();
    requestAnimationFrame(() => {
      if (dialog) {
        dialog.focus();
      }
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
  renderStep(currentStep);
  form.addEventListener('input', () => {
    state.saveCount += 1;
    handleInput();
  });
  prevBtn.addEventListener('click', prevStep);
  nextBtn.addEventListener('click', nextStep);
  setupFinalizeActions();
  setupSummaryToggle();
  setupAboutModal();
  window.setTimeout(setupCoachMarks, 400);
  window.addEventListener('beforeunload', persistState);
}

document.addEventListener('DOMContentLoaded', () => {
  init();
});

window.addEventListener('dnd-data-ready', () => {
  if (document.readyState === 'loading') return;
  populateDynamicOptions();
});
