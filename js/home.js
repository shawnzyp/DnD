import { getValidationBadge, getValidationForPack, summariseValidationIssues } from './pack-validation.js';

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
const DATASET_LABELS = {
  classes: 'Classes',
  races: 'Ancestries',
  backgrounds: 'Backgrounds',
  feats: 'Feats',
  spells: 'Spells',
  items: 'Equipment',
  companions: 'Allies',
  rules: 'Rules',
  skills: 'Skills',
  monsters: 'Monsters'
};
const PACK_MANAGER_SAVE_DELAY = 220;

const packManagerElements = {
  host: null,
  scrim: null,
  panel: null,
  list: null,
  summary: null,
  empty: null
};
let packManagerState = { order: [], enabled: {} };
let packManagerLookup = new Map();
let packManagerSaveTimer = null;
let packManagerFocusReturn = null;
let packManagerDragItem = null;

function normalisePath(pathname) {
  if (!pathname) return '/';
  if (pathname !== '/' && pathname.endsWith('/')) {
    return pathname;
  }
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

function markActiveNavigation() {
  const navItems = document.querySelectorAll('[data-route]');
  if (!navItems.length) return;
  const currentPath = normalisePath(window.location.pathname);
  navItems.forEach((item) => {
    const target = normalisePath(item.dataset.route || item.getAttribute('href') || '/');
    const isActive = target === currentPath;
    item.classList.toggle('is-active', isActive);
    if (isActive) {
      item.setAttribute('aria-current', 'page');
    } else {
      item.removeAttribute('aria-current');
    }
  });
}

function formatDatasetLabel(key, count) {
  const label = DATASET_LABELS[key] || key.replace(/[-_]/g, ' ');
  if (typeof count === 'number') {
    const formattedCount = count.toLocaleString();
    return `${label} · ${formattedCount}`;
  }
  return label;
}

function buildDatasetStatus(mergedData, packs) {
  const datasetKeys = new Set();
  packs.forEach((pack) => {
    if (!pack) return;
    const validation = getValidationForPack(pack);
    const isActive = validation.status !== 'error' && pack.active !== false && pack.enabled !== false;
    if (!isActive) {
      return;
    }
    const files = Array.isArray(pack.files) && pack.files.length ? pack.files : DEFAULT_FILES;
    files.forEach((file) => datasetKeys.add(file));
  });
  if (!datasetKeys.size) {
    DEFAULT_FILES.forEach((file) => datasetKeys.add(file));
  }
  const orderedKeys = DEFAULT_FILES.filter((key) => datasetKeys.has(key));
  const extras = Array.from(datasetKeys)
    .filter((key) => !DEFAULT_FILES.includes(key))
    .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  const keys = [...orderedKeys, ...extras];
  return keys.map((key) => {
    const records = Array.isArray(mergedData?.[key]) ? mergedData[key] : [];
    const count = Array.isArray(records) ? records.length : 0;
    return {
      key,
      count,
      loaded: count > 0
    };
  });
}

function renderDatasetChips(container, datasets) {
  if (!container) return;
  container.innerHTML = '';
  datasets.forEach((dataset) => {
    const item = document.createElement('li');
    item.className = `chip ${dataset.loaded ? 'chip-positive' : 'chip-muted'}`;
    item.dataset.state = dataset.loaded ? 'ready' : 'missing';
    item.textContent = formatDatasetLabel(dataset.key, dataset.count);
    container.appendChild(item);
  });
}

function renderPackSources(container, packs) {
  if (!container) return;
  container.innerHTML = '';
  if (!packs.length) {
    const empty = document.createElement('li');
    empty.className = 'chip chip-muted';
    empty.textContent = 'No content packs loaded';
    container.appendChild(empty);
    return;
  }
  packs.forEach((pack) => {
    const item = document.createElement('li');
    item.className = 'chip chip-outline';
    const title = document.createElement('span');
    title.textContent = pack.name;
    item.appendChild(title);
    const metaParts = [];
    if (pack.edition) metaParts.push(pack.edition);
    if (pack.version) metaParts.push(`v${pack.version}`);
    if (metaParts.length) {
      const meta = document.createElement('span');
      meta.className = 'chip__meta';
      meta.textContent = metaParts.join(' · ');
      item.appendChild(meta);
    }
    container.appendChild(item);
  });
}

function updatePackMeter(detail) {
  const meter = document.querySelector('[data-pack-meter]');
  const fill = document.querySelector('[data-pack-fill]');
  const percentLabel = document.querySelector('[data-pack-percent]');
  const countLabel = document.querySelector('[data-pack-count]');
  const statusChip = document.querySelector('[data-pack-chip]');
  const summaryLabel = document.querySelector('[data-pack-summary]');
  const datasetChipContainer = document.querySelector('[data-dataset-chips]');
  const sourceList = document.querySelector('[data-pack-sources]');

  const merged = detail?.merged || {};
  const mergedData = merged.data || {};
  const packSummaries = Array.isArray(merged.packSummaries) ? merged.packSummaries : [];
  const available = Array.isArray(detail?.availablePacks) ? detail.availablePacks : [];
  const validationSummary = summariseValidationIssues(available);
  const activeAvailable = available.filter((pack) => {
    if (!pack || pack.enabled === false) {
      return false;
    }
    if (pack.active === false) {
      return false;
    }
    const validation = getValidationForPack(pack);
    return validation.status !== 'error';
  });
  const datasets = buildDatasetStatus(mergedData, activeAvailable.length ? activeAvailable : available);
  const total = datasets.length;
  const loaded = datasets.filter((dataset) => dataset.loaded).length;
  const percentage = total ? Math.round((loaded / total) * 100) : 0;
  const packCount = packSummaries.length;
  const valueText = total ? `${loaded} of ${total} datasets ready` : 'No datasets detected yet';

  if (meter) {
    meter.setAttribute('aria-valuemax', String(total || 1));
    meter.setAttribute('aria-valuenow', String(loaded));
    meter.setAttribute('aria-valuetext', valueText);
  }
  if (fill) {
    fill.style.width = `${percentage}%`;
  }
  if (percentLabel) {
    percentLabel.textContent = `${percentage}%`;
  }
  if (countLabel) {
    countLabel.textContent = valueText;
  }
  if (summaryLabel) {
    let summaryText;
    if (packCount === 0) {
      summaryText = 'No active packs';
    } else if (packCount === 1) {
      summaryText = '1 active pack';
    } else {
      summaryText = `${packCount} active packs`;
    }
    if (validationSummary.message) {
      summaryText = `${summaryText}. ${validationSummary.message}`;
    }
    summaryLabel.textContent = summaryText;
  }
  if (statusChip) {
    statusChip.classList.remove('chip-warning', 'chip-positive', 'chip-muted', 'chip-strong');
    statusChip.removeAttribute('title');
    if (!packCount) {
      statusChip.classList.add('chip-warning');
      statusChip.textContent = 'Add a content pack';
    } else if (validationSummary.hasErrors) {
      statusChip.classList.add('chip-warning');
      statusChip.textContent = 'Fix pack issues';
      if (validationSummary.message) {
        statusChip.title = validationSummary.message;
      }
    } else if (validationSummary.hasWarnings) {
      statusChip.classList.add('chip-warning');
      statusChip.textContent = 'Review pack warnings';
      if (validationSummary.message) {
        statusChip.title = validationSummary.message;
      }
    } else if (percentage === 100) {
      statusChip.classList.add('chip-positive');
      statusChip.textContent = 'All packs ready';
    } else {
      statusChip.classList.add('chip-warning');
      statusChip.textContent = 'Loading content';
    }
  }

  renderDatasetChips(datasetChipContainer, datasets);
  renderPackSources(sourceList, packSummaries);
}

function initBottomSheets() {
  const sheets = document.querySelectorAll('[data-bottom-sheet]');
  sheets.forEach((sheet) => {
    const toggle = sheet.querySelector('[data-bottom-sheet-toggle]');
    if (!toggle) return;
    const titleElement = toggle.querySelector('.bottom-sheet__title');
    const baseTitle = titleElement ? titleElement.textContent.trim() : 'Panel';
    const expandedLabel = toggle.dataset.expandedLabel || `${baseTitle} (collapse)`;
    const collapsedLabel = toggle.dataset.collapsedLabel || `${baseTitle} (expand)`;

    function applyState(expanded, { focusSource } = {}) {
      sheet.setAttribute('data-state', expanded ? 'expanded' : 'collapsed');
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      toggle.setAttribute('aria-label', expanded ? expandedLabel : collapsedLabel);
      const content = sheet.querySelector('.bottom-sheet__content');
      if (expanded && focusSource === 'keyboard' && content) {
        requestAnimationFrame(() => {
          if (typeof content.focus === 'function') {
            content.focus({ preventScroll: true });
          }
        });
      }
      if (!expanded && focusSource === 'keyboard') {
        requestAnimationFrame(() => {
          if (typeof toggle.focus === 'function') {
            toggle.focus({ preventScroll: true });
          }
        });
      }
    }

    toggle.addEventListener('click', (event) => {
      const next = sheet.getAttribute('data-state') !== 'expanded';
      const focusSource = event.detail === 0 ? 'keyboard' : null;
      applyState(next, { focusSource });
    });

    const initial = sheet.getAttribute('data-state') !== 'collapsed';
    applyState(initial);
  });
}

function escapeSelector(value) {
  if (window.CSS && typeof window.CSS.escape === 'function') {
    return window.CSS.escape(value);
  }
  return value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

function cancelPackSettingsSave() {
  if (packManagerSaveTimer) {
    clearTimeout(packManagerSaveTimer);
    packManagerSaveTimer = null;
  }
}

function getPackSettingsPayload() {
  const order = Array.isArray(packManagerState.order) ? packManagerState.order.slice() : [];
  const enabled = {};
  order.forEach((id) => {
    if (packManagerState.enabled[id] === false) {
      enabled[id] = false;
    }
  });
  return { order, enabled };
}

function schedulePackSettingsSave() {
  if (!window.dnd || typeof window.dnd.updatePackSettings !== 'function') {
    return;
  }
  cancelPackSettingsSave();
  const payload = getPackSettingsPayload();
  packManagerSaveTimer = window.setTimeout(() => {
    packManagerSaveTimer = null;
    window.dnd
      .updatePackSettings(payload)
      .catch((error) => {
        console.warn('Failed to update pack settings', error);
      });
  }, PACK_MANAGER_SAVE_DELAY);
}

function movePack(id, delta) {
  const order = Array.isArray(packManagerState.order) ? packManagerState.order.slice() : [];
  const index = order.indexOf(id);
  if (index === -1) return;
  const targetIndex = index + delta;
  if (targetIndex < 0 || targetIndex >= order.length) return;
  order.splice(index, 1);
  order.splice(targetIndex, 0, id);
  packManagerState.order = order;
  renderPackManagerList();
  schedulePackSettingsSave();
  requestAnimationFrame(() => {
    const selector = `[data-pack-id="${escapeSelector(id)}"] .pack-manager__handle`;
    const handle = packManagerElements.list?.querySelector(selector);
    if (handle && typeof handle.focus === 'function') {
      handle.focus({ preventScroll: true });
    }
  });
}

function commitPackManagerOrder(focusId) {
  if (!packManagerElements.list) return;
  const nextOrder = Array.from(packManagerElements.list.querySelectorAll('.pack-manager__item'))
    .map((item) => item.dataset.packId)
    .filter(Boolean);
  if (!nextOrder.length) return;
  const sameLength = nextOrder.length === packManagerState.order.length;
  const sameOrder = sameLength && nextOrder.every((id, index) => packManagerState.order[index] === id);
  packManagerState.order = nextOrder;
  renderPackManagerList();
  if (!sameOrder) {
    schedulePackSettingsSave();
  }
  if (focusId) {
    requestAnimationFrame(() => {
      const selector = `[data-pack-id="${escapeSelector(focusId)}"] .pack-manager__handle`;
      const handle = packManagerElements.list?.querySelector(selector);
      if (handle && typeof handle.focus === 'function') {
        handle.focus({ preventScroll: true });
      }
    });
  }
}

function handleDragStart(event) {
  const item = event.currentTarget;
  packManagerDragItem = item;
  item.classList.add('is-dragging');
  try {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', item.dataset.packId || '');
  } catch (error) {
    // Ignore
  }
}

function handleDragOver(event) {
  if (!packManagerDragItem || !packManagerElements.list) return;
  event.preventDefault();
  const target = event.currentTarget;
  if (target === packManagerDragItem) return;
  const rect = target.getBoundingClientRect();
  const shouldInsertBefore = event.clientY - rect.top < rect.height / 2;
  if (shouldInsertBefore) {
    packManagerElements.list.insertBefore(packManagerDragItem, target);
  } else {
    packManagerElements.list.insertBefore(packManagerDragItem, target.nextSibling);
  }
}

function handleDragEnd(event) {
  const item = event.currentTarget;
  const focusId = item.dataset.packId || '';
  item.classList.remove('is-dragging', 'is-draggable');
  item.draggable = false;
  packManagerDragItem = null;
  commitPackManagerOrder(focusId);
}

function configureDragHandle(handle, item, id) {
  if (!handle || !item) return;
  handle.addEventListener('pointerdown', () => {
    item.draggable = true;
    item.classList.add('is-draggable');
  });
  handle.addEventListener('pointerup', () => {
    item.draggable = false;
    item.classList.remove('is-draggable');
  });
  handle.addEventListener('pointerleave', () => {
    if (!item.classList.contains('is-dragging')) {
      item.draggable = false;
      item.classList.remove('is-draggable');
    }
  });
  handle.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      movePack(id, -1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      movePack(id, 1);
    }
  });
  item.addEventListener('dragstart', handleDragStart);
  item.addEventListener('dragover', handleDragOver);
  item.addEventListener('dragenter', handleDragOver);
  item.addEventListener('drop', (event) => event.preventDefault());
  item.addEventListener('dragend', handleDragEnd);
}

function buildPackMeta(pack) {
  const metaParts = [];
  if (pack.edition) metaParts.push(pack.edition);
  if (pack.version) metaParts.push(`v${pack.version}`);
  if (pack.license) metaParts.push(pack.license);
  if (pack.origin === 'file' && pack.filename) {
    metaParts.push(`File · ${pack.filename}`);
  } else if (pack.origin === 'url' && pack.url) {
    try {
      const hostname = new URL(pack.url).hostname;
      metaParts.push(`URL · ${hostname}`);
    } catch (error) {
      metaParts.push('URL import');
    }
  } else if (pack.origin && !metaParts.length) {
    metaParts.push(pack.origin);
  }
  return metaParts.join(' • ');
}

async function removePack(pack, button) {
  if (!window.dnd || typeof window.dnd.removeUserPack !== 'function') {
    return;
  }
  const confirmed = window.confirm(`Remove ${pack.name}? This will delete the imported pack.`);
  if (!confirmed) return;
  const previousText = button.textContent;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  button.textContent = 'Removing…';
  try {
    await window.dnd.removeUserPack(pack.id);
  } catch (error) {
    console.error('Failed to remove pack', error);
    button.disabled = false;
    button.removeAttribute('aria-busy');
    button.textContent = previousText;
  }
}

function renderPackManagerList() {
  const list = packManagerElements.list;
  if (!list) return;
  list.innerHTML = '';
  packManagerDragItem = null;
  const order = Array.isArray(packManagerState.order) ? packManagerState.order : [];
  let activeCount = 0;
  let totalCount = 0;

  order.forEach((id) => {
    const pack = packManagerLookup.get(id);
    if (!pack) return;
    totalCount += 1;
    const enabled = packManagerState.enabled[id] !== false;
    const validation = getValidationForPack(pack);
    const isActive = enabled && pack.active !== false && validation.status !== 'error';
    if (isActive) activeCount += 1;

    const item = document.createElement('li');
    item.className = 'pack-manager__item';
    item.dataset.packId = id;
    item.setAttribute('data-enabled', enabled ? 'true' : 'false');
    item.setAttribute('data-active', isActive ? 'true' : 'false');
    item.setAttribute('data-validation', validation.status || 'ok');
    item.setAttribute('draggable', 'false');

    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'pack-manager__handle';
    handle.setAttribute('aria-label', `Reorder ${pack.name}`);
    handle.innerHTML = '<span aria-hidden="true">☰</span>';

    const info = document.createElement('div');
    info.className = 'pack-manager__info';
    const name = document.createElement('span');
    name.className = 'pack-manager__name';
    name.textContent = pack.name;
    info.appendChild(name);
    const badge = getValidationBadge(pack);
    if (badge && badge.status !== 'ok') {
      const status = document.createElement('span');
      status.className = `pack-manager__status pack-manager__status--${badge.status}`;
      status.textContent = badge.label;
      if (badge.title) {
        status.title = badge.title;
      }
      info.appendChild(status);
    }
    const metaText = buildPackMeta(pack);
    if (metaText) {
      const meta = document.createElement('span');
      meta.className = 'pack-manager__meta';
      meta.textContent = metaText;
      info.appendChild(meta);
    }

    const actions = document.createElement('div');
    actions.className = 'pack-manager__actions';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'pack-manager__toggle';
    toggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    let toggleLabel = 'Disabled';
    if (enabled) {
      if (validation.status === 'error') {
        toggleLabel = 'Needs fixes';
      } else if (validation.status === 'warning') {
        toggleLabel = 'Enabled (warnings)';
      } else {
        toggleLabel = 'Enabled';
      }
    }
    toggle.textContent = toggleLabel;
    if (validation.message) {
      toggle.title = validation.message;
    } else {
      toggle.removeAttribute('title');
    }
    toggle.addEventListener('click', () => {
      const nextEnabled = !enabled;
      packManagerState.enabled[id] = nextEnabled;
      renderPackManagerList();
      schedulePackSettingsSave();
    });
    actions.appendChild(toggle);

    if (pack.origin) {
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'pack-manager__delete';
      removeButton.textContent = 'Remove';
      removeButton.addEventListener('click', () => removePack(pack, removeButton));
      actions.appendChild(removeButton);
    }

    item.appendChild(handle);
    item.appendChild(info);
    item.appendChild(actions);
    list.appendChild(item);
    configureDragHandle(handle, item, id);
  });

  if (packManagerElements.empty) {
    packManagerElements.empty.hidden = list.children.length > 0;
  }
  if (packManagerElements.summary) {
    const issueSummary = summariseValidationIssues(Array.from(packManagerLookup.values()));
    let summaryText;
    if (totalCount) {
      summaryText = `${activeCount} of ${totalCount} packs active.`;
    } else {
      summaryText = 'No packs available.';
    }
    if (issueSummary.message) {
      summaryText = `${summaryText} ${issueSummary.message}`;
    }
    packManagerElements.summary.textContent = summaryText;
  }
}

function setPackManagerData(detail) {
  if (!detail || !Array.isArray(detail.availablePacks)) {
    return;
  }
  cancelPackSettingsSave();
  const available = detail.availablePacks;
  const order = [];
  const enabled = {};
  packManagerLookup = new Map();
  available.forEach((pack) => {
    if (!pack || typeof pack !== 'object' || !pack.id) return;
    order.push(pack.id);
    enabled[pack.id] = pack.enabled !== false;
    packManagerLookup.set(pack.id, { ...pack });
  });
  packManagerState = { order, enabled };
  renderPackManagerList();
}

function openPackManager(trigger) {
  if (!packManagerElements.host) return;
  packManagerFocusReturn = trigger || document.activeElement;
  packManagerElements.host.removeAttribute('hidden');
  packManagerElements.host.setAttribute('data-state', 'open');
  packManagerElements.host.setAttribute('aria-hidden', 'false');
  document.body.setAttribute('data-pack-manager', 'open');
  renderPackManagerList();
  if (packManagerElements.panel) {
    requestAnimationFrame(() => {
      packManagerElements.panel.focus({ preventScroll: true });
    });
  }
}

function closePackManager() {
  if (!packManagerElements.host) return;
  packManagerElements.host.setAttribute('data-state', 'closed');
  packManagerElements.host.setAttribute('aria-hidden', 'true');
  packManagerElements.host.setAttribute('hidden', '');
  document.body.removeAttribute('data-pack-manager');
  if (packManagerFocusReturn && typeof packManagerFocusReturn.focus === 'function') {
    packManagerFocusReturn.focus({ preventScroll: true });
  }
  packManagerFocusReturn = null;
}

function initPackManager() {
  const host = document.querySelector('[data-pack-manager]');
  if (!host) return;
  packManagerElements.host = host;
  packManagerElements.scrim = host.querySelector('[data-pack-manager-scrim]');
  packManagerElements.panel = host.querySelector('[data-pack-manager-panel]');
  packManagerElements.list = host.querySelector('[data-pack-manager-list]');
  packManagerElements.summary = host.querySelector('[data-pack-manager-summary]');
  packManagerElements.empty = host.querySelector('[data-pack-manager-empty]');

  const closeButtons = host.querySelectorAll('[data-pack-manager-close]');
  closeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      closePackManager();
    });
  });
  if (packManagerElements.scrim) {
    packManagerElements.scrim.addEventListener('click', () => {
      closePackManager();
    });
  }
  const openButtons = document.querySelectorAll('[data-pack-manager-open]');
  openButtons.forEach((button) => {
    button.addEventListener('click', () => openPackManager(button));
  });
  host.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closePackManager();
    }
  });
}

function render(detail) {
  updatePackMeter(detail || {});
  if (detail && Array.isArray(detail.availablePacks)) {
    setPackManagerData(detail);
  }
}

function createFallbackDetailFromWindowData() {
  if (!window.dndData) return null;
  const data = window.dndData;
  const mergedData = {
    classes: Array.isArray(data.classes) ? data.classes : [],
    races: Array.isArray(data.races) ? data.races : [],
    backgrounds: Array.isArray(data.backgrounds) ? data.backgrounds : [],
    feats: Array.isArray(data.feats) ? data.feats : [],
    items: Array.isArray(data.items) ? data.items : [],
    companions: Array.isArray(data.companions) ? data.companions : [],
    skills: Array.isArray(data.skills) ? data.skills : [],
    monsters: Array.isArray(data.monsters) ? data.monsters : [],
    spells: Array.isArray(data.spells) ? data.spells : [],
    rules: Array.isArray(data.rules) ? data.rules : []
  };
  return {
    merged: {
      data: mergedData,
      packSummaries: Array.isArray(data.packs) ? data.packs : [],
      sources: Array.isArray(data.sources) ? data.sources : [],
      sourceIndex: data.sourceIndex || {}
    },
    availablePacks: Array.isArray(data.availablePacks) ? data.availablePacks : [],
    packSettings: data.packSettings || { order: [], enabled: {} },
    manifest: data.manifest || { packs: [] },
    validation: data.validation || {}
  };
}

function bootstrap() {
  markActiveNavigation();
  initBottomSheets();
  initPackManager();
  render(null);

  if (window.dnd && typeof window.dnd.onChange === 'function') {
    window.dnd.onChange((detail) => {
      render(detail);
    });
  } else {
    const fallback = createFallbackDetailFromWindowData();
    if (fallback) {
      render(fallback);
    }
    window.addEventListener('dnd-data-changed', (event) => {
      if (event?.detail) {
        render(event.detail);
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
