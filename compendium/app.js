const FAVORITES_KEY = 'dndCompendiumFavorites';
const TYPE_LABELS = { spell: 'Spell', feat: 'Feat', item: 'Item', rule: 'Rule' };

let viewport;
let list;
const rowHeight = 132;
let data = [];
let filtered = [];
let startIndex = 0;
let endIndex = 0;
let favorites = { ids: [] };
let isInitialised = false;
let searchInput;
let chipContainer;
let favoriteToggle;
let detailDrawer;

function getPackData() {
  return window.dndData || { spells: [], feats: [], items: [], rules: [], packs: [] };
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : { ids: [] };
  } catch (err) {
    console.warn('Failed to read favorites', err);
    return { ids: [] };
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (err) {
    console.warn('Failed to save favorites', err);
  }
  window.dispatchEvent(new CustomEvent('dnd-state-changed'));
}

function summarise(text) {
  const value = (text || '').trim();
  if (!value) return 'Open the detail drawer for full rules text.';
  return value.length > 160 ? `${value.slice(0, 157)}…` : value;
}

function formatSourceBadge(source) {
  if (!source) return '';
  const parts = [];
  if (source.name) parts.push(source.name);
  if (source.edition) parts.push(source.edition);
  return parts.join(' · ');
}

function formatSourceDetail(source) {
  if (!source) return '';
  const parts = [];
  if (source.name) parts.push(source.name);
  if (source.edition) parts.push(source.edition);
  if (source.license) parts.push(source.license);
  return parts.length ? `Source: ${parts.join(' • ')}` : '';
}

function buildSpellEntry(spell) {
  const description = (spell.description || '').trim();
  const badge = formatSourceBadge(spell.source);
  const subtitleParts = [TYPE_LABELS.spell];
  if (typeof spell.level === 'number') subtitleParts.push(`Level ${spell.level}`);
  if (spell.school) subtitleParts.push(spell.school);
  if (badge) subtitleParts.push(badge);
  const detailParts = [
    `${spell.school || 'Spell'} • Level ${typeof spell.level === 'number' ? spell.level : 0}`,
    `Casting Time: ${spell.casting_time || '1 action'}`,
    `Range: ${spell.range || 'Self'}`,
    `Components: ${spell.components || 'V, S'}`,
    `Duration: ${spell.duration || 'Instantaneous'}`,
    '',
    description,
    '',
    formatSourceDetail(spell.source)
  ].filter(Boolean);
  return {
    id: `spell:${spell.slug}`,
    slug: spell.slug,
    name: spell.name,
    type: 'spell',
    level: spell.level ?? 0,
    summary: summarise(description),
    detail: detailParts.join('\n'),
    subtitle: subtitleParts.filter(Boolean).join(' · '),
    searchText: [spell.name, spell.school, spell.casting_time, spell.range, spell.components, description, formatSourceDetail(spell.source)].filter(Boolean).join(' ').toLowerCase()
  };
}

function buildFeatEntry(feat) {
  const description = (feat.description || '').trim();
  const badge = formatSourceBadge(feat.source);
  const subtitleParts = [TYPE_LABELS.feat];
  if (badge) subtitleParts.push(badge);
  const detailParts = [TYPE_LABELS.feat, '', description, '', formatSourceDetail(feat.source)].filter(Boolean);
  return {
    id: `feat:${feat.slug}`,
    slug: feat.slug,
    name: feat.name,
    type: 'feat',
    summary: summarise(description),
    detail: detailParts.join('\n'),
    subtitle: subtitleParts.join(' · '),
    searchText: [feat.name, description, formatSourceDetail(feat.source)].filter(Boolean).join(' ').toLowerCase()
  };
}

function buildItemEntry(item) {
  const description = (item.description || '').trim();
  const badge = formatSourceBadge(item.source);
  const subtitleParts = [TYPE_LABELS.item];
  if (item.category) subtitleParts.push(item.category);
  if (badge) subtitleParts.push(badge);
  const detailParts = [
    `${item.category || 'Item'} • Cost ${item.cost || '—'} • Weight ${item.weight || '—'}`,
    '',
    description,
    '',
    formatSourceDetail(item.source)
  ].filter(Boolean);
  return {
    id: `item:${item.slug}`,
    slug: item.slug,
    name: item.name,
    type: 'item',
    summary: summarise(description),
    detail: detailParts.join('\n'),
    subtitle: subtitleParts.join(' · '),
    searchText: [item.name, item.category, item.cost, item.weight, description, formatSourceDetail(item.source)].filter(Boolean).join(' ').toLowerCase()
  };
}

function buildRuleEntry(rule) {
  const description = (rule.description || '').trim();
  const badge = formatSourceBadge(rule.source);
  const subtitleParts = [TYPE_LABELS.rule];
  if (rule.category) subtitleParts.push(rule.category);
  if (badge) subtitleParts.push(badge);
  const detailParts = [rule.category || TYPE_LABELS.rule, '', description, '', formatSourceDetail(rule.source)].filter(Boolean);
  return {
    id: `rule:${rule.slug}`,
    slug: rule.slug,
    name: rule.name,
    type: 'rule',
    summary: summarise(description),
    detail: detailParts.join('\n'),
    subtitle: subtitleParts.join(' · '),
    searchText: [rule.name, rule.category, description, formatSourceDetail(rule.source)].filter(Boolean).join(' ').toLowerCase()
  };
}

function buildEntries() {
  const { spells = [], feats = [], items = [], rules = [] } = getPackData();
  const entries = [];
  spells.forEach(spell => entries.push(buildSpellEntry(spell)));
  feats.forEach(feat => entries.push(buildFeatEntry(feat)));
  items.forEach(item => entries.push(buildItemEntry(item)));
  rules.forEach(rule => entries.push(buildRuleEntry(rule)));
  return entries.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
}

function updatePackMeta() {
  const target = document.getElementById('compendium-pack-meta');
  if (!target) return;
  const { packs = [] } = getPackData();
  if (!packs.length) {
    target.textContent = 'No licensed content packs loaded.';
    return;
  }
  const text = packs.map(pack => {
    const edition = pack.edition ? ` · ${pack.edition}` : '';
    const license = pack.license ? ` • ${pack.license}` : '';
    return `${pack.name}${edition}${license}`;
  }).join(' | ');
  target.textContent = `Loaded packs: ${text}`;
}

function applyFilters() {
  if (!viewport || !list) return;
  const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
  const activeFilters = Array.from((chipContainer ? chipContainer.querySelectorAll('.chip[aria-pressed="true"]') : [])).map(chip => chip.dataset.filter);
  filtered = data.filter(entry => {
    const matchesQuery = !query || entry.searchText.includes(query);
    const matchesFilter = !activeFilters.length || activeFilters.includes(entry.type);
    return matchesQuery && matchesFilter;
  });
  list.style.height = filtered.length ? `${filtered.length * rowHeight}px` : '0px';
  renderVirtualRows();
}

function renderVirtualRows() {
  if (!viewport || !list) return;
  const scrollTop = viewport.scrollTop;
  const viewportHeight = viewport.clientHeight;
  const buffer = 4;
  startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer);
  endIndex = Math.min(filtered.length, Math.ceil((scrollTop + viewportHeight) / rowHeight) + buffer);

  list.innerHTML = '';
  for (let i = startIndex; i < endIndex; i++) {
    const entry = filtered[i];
    const row = document.createElement('div');
    row.className = 'virtual-row';
    row.style.top = `${i * rowHeight}px`;

    const article = document.createElement('article');
    article.className = 'entry';
    article.dataset.id = entry.id;
    article.dataset.type = entry.type;

    const title = document.createElement('h3');
    title.textContent = entry.name;
    article.appendChild(title);

    const subtitle = document.createElement('small');
    subtitle.textContent = entry.subtitle;
    article.appendChild(subtitle);

    const summary = document.createElement('p');
    summary.style.margin = '0';
    summary.style.color = 'var(--muted)';
    summary.style.fontSize = '0.78rem';
    summary.textContent = entry.summary;
    article.appendChild(summary);

    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.action = 'details';
    button.textContent = 'Quick look';
    article.appendChild(button);

    row.appendChild(article);
    list.appendChild(row);
  }
}

function rebuildFromData() {
  data = buildEntries();
  applyFilters();
  updatePackMeta();
}

function openDetail(id) {
  const entry = filtered.find(item => item.id === id);
  if (!entry) return;
  const drawer = detailDrawer;
  const body = document.getElementById('detail-body');
  document.getElementById('detail-title').textContent = entry.name;
  document.getElementById('detail-type').textContent = entry.subtitle;
  body.textContent = entry.detail;
  if (favoriteToggle) {
    favoriteToggle.dataset.id = entry.id;
    const isFav = favorites.ids.includes(entry.id);
    favoriteToggle.textContent = isFav ? 'Remove Favorite' : 'Save to Favorites';
  }
  if (drawer) {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
  }
}

function closeDetail() {
  if (!detailDrawer) return;
  detailDrawer.classList.remove('open');
  detailDrawer.setAttribute('aria-hidden', 'true');
}

function toggleFavorite(id) {
  const index = favorites.ids.indexOf(id);
  if (index >= 0) {
    favorites.ids.splice(index, 1);
  } else {
    favorites.ids.push(id);
  }
  saveFavorites();
  if (favoriteToggle) {
    favoriteToggle.textContent = favorites.ids.includes(id) ? 'Remove Favorite' : 'Save to Favorites';
  }
}

function bindEvents() {
  viewport.addEventListener('scroll', () => {
    requestAnimationFrame(renderVirtualRows);
  });

  searchInput.addEventListener('input', () => {
    requestAnimationFrame(applyFilters);
  });

  chipContainer.addEventListener('click', (event) => {
    const button = event.target.closest('.chip');
    if (!button) return;
    const pressed = button.getAttribute('aria-pressed') === 'true';
    button.setAttribute('aria-pressed', String(!pressed));
    requestAnimationFrame(applyFilters);
  });

  list.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action="details"]');
    if (!button) return;
    const article = button.closest('.entry');
    if (!article) return;
    openDetail(article.dataset.id);
  });

  favoriteToggle.addEventListener('click', (event) => {
    const id = event.target.dataset.id;
    if (!id) return;
    toggleFavorite(id);
  });

  detailDrawer.addEventListener('click', (event) => {
    if (event.target === detailDrawer) {
      closeDetail();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeDetail();
    }
  });
}

function handleDataReady() {
  if (document.readyState === 'loading') return;
  rebuildFromData();
}

export async function initCompendium() {
  if (isInitialised) return;
  viewport = document.getElementById('list-viewport');
  list = document.getElementById('virtual-list');
  searchInput = document.getElementById('search-input');
  chipContainer = document.querySelector('.chips');
  favoriteToggle = document.getElementById('favorite-toggle');
  detailDrawer = document.getElementById('detail-drawer');
  if (!viewport || !list || !searchInput || !chipContainer || !favoriteToggle || !detailDrawer) {
    console.warn('Compendium init aborted: missing DOM nodes');
    return;
  }
  isInitialised = true;
  favorites = loadFavorites();
  list.style.height = '0px';
  if (window.dndDataReady && typeof window.dndDataReady.then === 'function') {
    try {
      await window.dndDataReady;
    } catch (error) {
      console.warn('Unable to hydrate compendium packs', error);
    }
  }
  rebuildFromData();
  bindEvents();
  window.addEventListener('dnd-data-ready', handleDataReady);
}

export default initCompendium;
