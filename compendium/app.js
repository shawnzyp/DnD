const FAVORITES_KEY = 'dndCompendiumFavorites';
const BUILDER_STORAGE_KEY = 'dndBuilderState';
const FIELD_LABELS = {
  signatureFeat: 'signature feat',
  bonusFeats: 'bonus feats',
  weapons: 'weapon loadout',
  armor: 'armor & defenses',
  gear: 'gear list'
};
const ROW_HEIGHT = 132;

const viewport = document.getElementById('list-viewport');
const list = document.getElementById('virtual-list');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const chipGroup = document.querySelector('.chips');
const packMeta = document.getElementById('compendium-pack-meta');
const detailScrim = document.getElementById('detail-scrim');
const drawer = document.getElementById('detail-drawer');
const detailTitle = document.getElementById('detail-title');
const detailType = document.getElementById('detail-type');
const detailTags = document.getElementById('detail-tags');
const detailStats = document.getElementById('detail-stats');
const detailBody = document.getElementById('detail-body');
const detailActions = document.getElementById('detail-actions');
const detailFeedback = document.getElementById('detail-feedback');
const favoriteToggle = document.getElementById('favorite-toggle');
const detailClose = document.getElementById('detail-close');

const worker = new Worker(new URL('./searchWorker.js', import.meta.url));

let favorites = loadFavorites();
let filtered = [];
let indexReady = false;
let currentRequestId = 0;
let feedbackTimer = null;
let searchFrame = null;

worker.addEventListener('message', handleWorkerMessage);

function getPackData() {
  return window.dndData || { spells: [], feats: [], items: [], rules: [], packs: [] };
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return { ids: [] };
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.ids) ? parsed : { ids: [] };
  } catch (error) {
    console.warn('Failed to read favorites', error);
    return { ids: [] };
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.warn('Failed to persist favorites', error);
  }
  window.dispatchEvent(new CustomEvent('dnd-state-changed'));
}

function updatePackMeta() {
  if (!packMeta) return;
  const { packs = [] } = getPackData();
  if (!packs.length) {
    packMeta.textContent = 'No licensed content packs loaded.';
    return;
  }
  const text = packs
    .map((pack) => {
      const edition = pack.edition ? ` · ${pack.edition}` : '';
      const license = pack.license ? ` • ${pack.license}` : '';
      return `${pack.name}${edition}${license}`;
    })
    .join(' | ');
  packMeta.textContent = `Loaded packs: ${text}`;
}

function hydrateIndex() {
  indexReady = false;
  const { spells = [], feats = [], items = [], rules = [] } = getPackData();
  worker.postMessage({ type: 'hydrate', payload: { spells, feats, items, rules } });
  setEmptyState(false, 'Loading compendium entries…');
  updatePackMeta();
}

function setEmptyState(hidden, message) {
  if (!emptyState) return;
  if (typeof hidden === 'boolean') {
    emptyState.hidden = hidden;
  }
  if (typeof message === 'string' && message) {
    emptyState.textContent = message;
  }
}

function handleWorkerMessage(event) {
  const data = event.data || {};
  switch (data.type) {
    case 'index-ready': {
      indexReady = true;
      favorites = loadFavorites();
      requestSearch();
      break;
    }
    case 'results-start': {
      if (data.requestId !== currentRequestId) break;
      const total = typeof data.total === 'number' ? data.total : 0;
      filtered = new Array(total).fill(null);
      list.style.height = total > 0 ? `${total * ROW_HEIGHT}px` : '0px';
      if (total === 0) {
        renderVirtualRows();
        setEmptyState(false, 'No results match your filters.');
      } else {
        setEmptyState(true);
        renderVirtualRows();
      }
      closeDetail();
      break;
    }
    case 'results-chunk': {
      if (data.requestId !== currentRequestId) break;
      const items = Array.isArray(data.items) ? data.items : [];
      const offset = typeof data.offset === 'number' ? data.offset : 0;
      for (let i = 0; i < items.length; i += 1) {
        filtered[offset + i] = items[i];
      }
      renderVirtualRows();
      break;
    }
    case 'results-end': {
      if (data.requestId !== currentRequestId) break;
      if (data.total === 0) {
        setEmptyState(false, 'No results match your filters.');
      } else {
        setEmptyState(true);
      }
      break;
    }
    default:
      break;
  }
}

function requestSearch() {
  if (!indexReady) return;
  const query = searchInput ? searchInput.value.trim() : '';
  const filters = Array.from(document.querySelectorAll('.chip[aria-pressed="true"]')).map((chip) => chip.dataset.filter);
  currentRequestId += 1;
  worker.postMessage({ type: 'search', requestId: currentRequestId, payload: { query, filters } });
  if (viewport) {
    viewport.scrollTop = 0;
  }
  if (query) {
    setEmptyState(false, 'Searching…');
  }
}

function renderVirtualRows() {
  if (!list || !viewport) return;
  const total = filtered.length;
  if (!total) {
    list.innerHTML = '';
    return;
  }
  const scrollTop = viewport.scrollTop;
  const viewportHeight = viewport.clientHeight || 0;
  const buffer = 6;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - buffer);
  const endIndex = Math.min(total, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + buffer);

  list.innerHTML = '';
  for (let i = startIndex; i < endIndex; i += 1) {
    const entry = filtered[i];
    const row = document.createElement('div');
    row.className = 'virtual-row';
    row.style.top = `${i * ROW_HEIGHT}px`;

    const article = document.createElement('article');
    article.className = 'entry';

    if (!entry) {
      article.classList.add('skeleton');
      article.appendChild(createSkeletonLine('tall'));
      article.appendChild(createSkeletonLine('medium'));
      article.appendChild(createSkeletonLine('short'));
    } else {
      article.dataset.id = entry.id;
      article.dataset.type = entry.type;
      if (favorites.ids.includes(entry.id)) {
        article.classList.add('favorite');
      }

      const title = document.createElement('h3');
      title.textContent = entry.name;
      article.appendChild(title);

      const subtitle = document.createElement('small');
      subtitle.textContent = entry.subtitle;
      article.appendChild(subtitle);

      if (entry.sourceLabel) {
        const badge = document.createElement('span');
        badge.className = 'entry-badge';
        badge.textContent = entry.sourceLabel;
        article.appendChild(badge);
      }

      const summary = document.createElement('p');
      summary.style.margin = '0';
      summary.style.color = 'var(--muted)';
      summary.style.fontSize = '0.78rem';
      summary.textContent = entry.summary;
      article.appendChild(summary);

      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.action = 'details';
      button.textContent = 'View details';
      article.appendChild(button);
    }

    row.appendChild(article);
    list.appendChild(row);
  }
}

function createSkeletonLine(size) {
  const div = document.createElement('div');
  div.className = `skeleton-line${size ? ` ${size}` : ''}`;
  return div;
}

function openDetail(id) {
  const entry = filtered.find((item) => item && item.id === id);
  if (!entry) return;

  detailTitle.textContent = entry.name;
  detailType.textContent = entry.subtitle;

  renderDetailTags(entry.tags);
  renderDetailStats(entry.stats);
  renderDetailBody(entry.description, entry.sourceDetail);
  renderDetailActions(entry);
  showFeedback('');

  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  detailScrim.hidden = false;
  requestAnimationFrame(() => detailScrim.classList.add('open'));
  setTimeout(() => {
    detailClose.focus({ preventScroll: true });
  }, 120);
}

function closeDetail() {
  if (!drawer.classList.contains('open')) return;
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  detailScrim.classList.remove('open');
  setTimeout(() => {
    detailScrim.hidden = true;
  }, 220);
}

function renderDetailTags(tags) {
  detailTags.innerHTML = '';
  const listTags = Array.isArray(tags) ? tags.filter(Boolean) : [];
  if (!listTags.length) {
    detailTags.hidden = true;
    return;
  }
  detailTags.hidden = false;
  listTags.forEach((tag) => {
    const span = document.createElement('span');
    span.className = 'tag-chip';
    span.textContent = tag;
    detailTags.appendChild(span);
  });
}

function renderDetailStats(stats) {
  detailStats.innerHTML = '';
  const rows = Array.isArray(stats) ? stats.filter((stat) => stat && stat.label && stat.value) : [];
  if (!rows.length) {
    detailStats.hidden = true;
    return;
  }
  detailStats.hidden = false;
  rows.forEach((stat) => {
    const dt = document.createElement('dt');
    dt.textContent = stat.label;
    detailStats.appendChild(dt);
    const dd = document.createElement('dd');
    dd.textContent = stat.value;
    detailStats.appendChild(dd);
  });
}

function renderDetailBody(description, sourceDetail) {
  detailBody.innerHTML = '';
  const text = (description || '').trim();
  if (text) {
    text.split(/\n{2,}/).forEach((paragraph) => {
      const value = paragraph.trim();
      if (!value) return;
      const p = document.createElement('p');
      p.textContent = value;
      detailBody.appendChild(p);
    });
  }
  if (!detailBody.children.length) {
    const p = document.createElement('p');
    p.textContent = 'Open gaming content entry with no additional description.';
    detailBody.appendChild(p);
  }
  if (sourceDetail) {
    const source = document.createElement('p');
    source.className = 'source-note';
    source.textContent = sourceDetail;
    detailBody.appendChild(source);
  }
}

function renderDetailActions(entry) {
  detailActions.innerHTML = '';
  favoriteToggle.dataset.id = entry.id;
  const isFavorite = favorites.ids.includes(entry.id);
  favoriteToggle.textContent = isFavorite ? 'Remove Favorite' : 'Save to Favorites';
  favoriteToggle.setAttribute('aria-pressed', String(isFavorite));
  detailActions.appendChild(favoriteToggle);

  const actions = buildQuickActions(entry);
  actions.forEach((action) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = action.label;
    button.addEventListener('click', () => {
      updateBuilderState(action.perform);
    });
    detailActions.appendChild(button);
  });
}

function buildQuickActions(entry) {
  const actions = [];
  if (entry.type === 'feat') {
    actions.push({
      label: 'Set as signature feat',
      perform: (state) => setBuilderField(state, 'signatureFeat', entry.name)
    });
    actions.push({
      label: 'Add to bonus feats',
      perform: (state) => appendBuilderField(state, 'bonusFeats', entry.name)
    });
  } else if (entry.type === 'item') {
    const targetName = entry.category ? `${entry.name} (${entry.category})` : entry.name;
    const category = (entry.category || '').toLowerCase();
    if (category.includes('weapon')) {
      actions.push({
        label: 'Add to weapon loadout',
        perform: (state) => appendBuilderField(state, 'weapons', targetName)
      });
    }
    if (category.includes('armor')) {
      actions.push({
        label: 'Add to armor & defenses',
        perform: (state) => appendBuilderField(state, 'armor', targetName)
      });
    }
    actions.push({
      label: 'Add to gear list',
      perform: (state) => appendBuilderField(state, 'gear', targetName)
    });
  } else if (entry.type === 'spell') {
    const label = entry.school ? `${entry.name} (${entry.school})` : entry.name;
    actions.push({
      label: 'Add to bonus feats notes',
      perform: (state) => appendBuilderField(state, 'bonusFeats', label)
    });
  } else if (entry.type === 'rule') {
    const label = entry.category ? `${entry.name} (${entry.category})` : entry.name;
    actions.push({
      label: 'Add to bonus feats notes',
      perform: (state) => appendBuilderField(state, 'bonusFeats', label)
    });
  }
  return actions;
}

function updateBuilderState(mutator) {
  let state;
  try {
    const raw = localStorage.getItem(BUILDER_STORAGE_KEY);
    state = raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Failed to read builder state', error);
    state = null;
  }
  if (!state || typeof state !== 'object') {
    state = { data: {}, completedSteps: [], saveCount: 0, updatedAt: Date.now() };
  }
  if (!state.data || typeof state.data !== 'object') {
    state.data = {};
  }
  const result = mutator(state) || { changed: false, message: '' };
  if (!result.changed) {
    if (result.message) {
      showFeedback(result.message);
    }
    return;
  }
  state.saveCount = (state.saveCount || 0) + 1;
  state.updatedAt = Date.now();
  try {
    localStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify(state));
    showFeedback(result.message || 'Saved to builder.', 'success');
    window.dispatchEvent(new CustomEvent('dnd-state-changed'));
  } catch (error) {
    console.warn('Failed to persist builder state', error);
    showFeedback('Unable to update builder. Check storage permissions.', 'error');
  }
}

function setBuilderField(state, field, value) {
  if (!value) {
    return { changed: false, message: 'Nothing to add.' };
  }
  if (state.data[field] === value) {
    return { changed: false, message: `Already set as ${FIELD_LABELS[field] || field}.` };
  }
  state.data[field] = value;
  return { changed: true, message: `Set ${FIELD_LABELS[field] || field} to ${value}.` };
}

function appendBuilderField(state, field, value) {
  if (!value) {
    return { changed: false, message: 'Nothing to add.' };
  }
  const existing = Array.isArray(state.data[field])
    ? state.data[field]
    : parseList(state.data[field]);
  const lower = value.toLowerCase();
  if (existing.some((item) => item.toLowerCase() === lower)) {
    return { changed: false, message: 'Already added to builder.' };
  }
  existing.push(value);
  state.data[field] = existing.join('\n');
  return { changed: true, message: `Added ${value} to ${FIELD_LABELS[field] || field}.` };
}

function parseList(value) {
  if (!value) return [];
  return value
    .toString()
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toggleFavorite(id) {
  const index = favorites.ids.indexOf(id);
  if (index >= 0) {
    favorites.ids.splice(index, 1);
  } else {
    favorites.ids.push(id);
  }
  saveFavorites();
  const isFavorite = favorites.ids.includes(id);
  favoriteToggle.textContent = isFavorite ? 'Remove Favorite' : 'Save to Favorites';
  favoriteToggle.setAttribute('aria-pressed', String(isFavorite));
  renderVirtualRows();
}

function showFeedback(message, variant) {
  if (feedbackTimer) {
    clearTimeout(feedbackTimer);
    feedbackTimer = null;
  }
  if (!message) {
    detailFeedback.textContent = '';
    detailFeedback.removeAttribute('data-variant');
    return;
  }
  detailFeedback.textContent = message;
  if (variant === 'success') {
    detailFeedback.dataset.variant = 'success';
  } else if (variant === 'error') {
    detailFeedback.dataset.variant = 'error';
  } else {
    detailFeedback.removeAttribute('data-variant');
  }
  feedbackTimer = setTimeout(() => {
    detailFeedback.textContent = '';
    detailFeedback.removeAttribute('data-variant');
    feedbackTimer = null;
  }, 3200);
}

if (viewport) {
  viewport.addEventListener('scroll', () => {
    requestAnimationFrame(renderVirtualRows);
  });
}

window.addEventListener('resize', () => {
  requestAnimationFrame(renderVirtualRows);
});

if (searchInput) {
  const scheduleSearch = () => {
    if (searchFrame) cancelAnimationFrame(searchFrame);
    searchFrame = requestAnimationFrame(() => {
      searchFrame = null;
      requestSearch();
    });
  };
  searchInput.addEventListener('input', scheduleSearch);
  searchInput.addEventListener('search', scheduleSearch);
}

if (chipGroup) {
  chipGroup.addEventListener('click', (event) => {
    const button = event.target.closest('.chip');
    if (!button) return;
    const pressed = button.getAttribute('aria-pressed') === 'true';
    button.setAttribute('aria-pressed', String(!pressed));
    if (searchFrame) cancelAnimationFrame(searchFrame);
    searchFrame = requestAnimationFrame(() => {
      searchFrame = null;
      requestSearch();
    });
  });
}

if (list) {
  list.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action="details"]');
    if (!button) return;
    const article = button.closest('.entry');
    if (!article || !article.dataset.id) return;
    openDetail(article.dataset.id);
  });
}

favoriteToggle.addEventListener('click', (event) => {
  const id = event.currentTarget.dataset.id;
  if (!id) return;
  toggleFavorite(id);
});

detailClose.addEventListener('click', () => {
  closeDetail();
});

detailScrim.addEventListener('click', () => {
  closeDetail();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeDetail();
  }
});

async function init() {
  favorites = loadFavorites();
  if (list) {
    list.style.height = '0px';
  }
  if (window.dndDataReady && typeof window.dndDataReady.then === 'function') {
    try {
      await window.dndDataReady;
    } catch (error) {
      console.warn('Unable to hydrate compendium packs', error);
    }
  }
  hydrateIndex();
}

document.addEventListener('DOMContentLoaded', () => {
  init();
});

window.addEventListener('dnd-data-ready', () => {
  if (document.readyState === 'loading') return;
  hydrateIndex();
});
