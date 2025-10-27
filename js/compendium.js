import { createVirtualList } from './virtual-list.js';

const FAVORITES_KEY = 'dndCompendiumFavorites';
const QUICK_ADD_KEY = 'dndBuilderQuickAddQueue';
const TYPE_LABELS = {
  spell: 'Spell',
  feat: 'Feat',
  item: 'Item',
  rule: 'Rule',
  monster: 'Monster',
  skill: 'Skill'
};

const viewport = document.getElementById('list-viewport');
const list = document.getElementById('virtual-list');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const chipGroup = document.querySelector('.chips');
const packStatus = document.getElementById('compendium-pack-status');
const packMeta = document.getElementById('compendium-pack-meta');
const detailDrawer = document.getElementById('detail-drawer');
const detailTags = document.getElementById('detail-tags');
const detailStats = document.getElementById('detail-stats');
const detailBody = document.getElementById('detail-body');
const detailTitle = document.getElementById('detail-title');
const detailSubtitle = document.getElementById('detail-subtitle');
const detailStatus = document.getElementById('detail-status');
const drawerScrim = document.getElementById('drawer-scrim');
const favoriteToggle = document.getElementById('favorite-toggle');
const builderAddButton = document.getElementById('builder-add');
const spellPanelHost = document.getElementById('spell-panel');
const monsterPanelHost = document.getElementById('monster-panel');

const worker = new Worker('/js/compendium-worker.js', { type: 'module' });

let packData = {
  packs: [],
  spells: [],
  feats: [],
  items: [],
  rules: [],
  monsters: [],
  skills: []
};
let favorites = loadFavorites();
let quickAddQueue = loadQuickAddQueue();
let filtered = [];
let entryIndex = new Map();
let lastCounts = {
  spells: 0,
  feats: 0,
  items: 0,
  rules: 0,
  monsters: 0,
  skills: 0,
  total: 0
};
let activeRequestId = 0;
let workerReady = false;
let pendingQuery = false;
let statusTimer = null;
let listVirtualizer = null;
let currentEntry = null;
let spellPanelModulePromise = null;

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.ids)) {
      return new Set(parsed.ids);
    }
    if (Array.isArray(parsed)) {
      return new Set(parsed);
    }
  } catch (error) {
    console.warn('Failed to read favorites', error);
  }
  return new Set();
}

function persistFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify({ ids: Array.from(favorites) }));
  } catch (error) {
    console.warn('Failed to persist favorites', error);
  }
  window.dispatchEvent(new CustomEvent('dnd-state-changed'));
}

function loadQuickAddQueue() {
  try {
    const raw = localStorage.getItem(QUICK_ADD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to read builder quick-add queue', error);
    return [];
  }
}

function persistQuickAddQueue() {
  try {
    localStorage.setItem(QUICK_ADD_KEY, JSON.stringify(quickAddQueue));
  } catch (error) {
    console.warn('Failed to persist builder quick-add queue', error);
  }
}

function setPackData(value) {
  packData = {
    packs: Array.isArray(value?.packs) ? value.packs : [],
    spells: Array.isArray(value?.spells) ? value.spells : [],
    feats: Array.isArray(value?.feats) ? value.feats : [],
    items: Array.isArray(value?.items) ? value.items : [],
    rules: Array.isArray(value?.rules) ? value.rules : [],
    monsters: Array.isArray(value?.monsters) ? value.monsters : [],
    skills: Array.isArray(value?.skills) ? value.skills : []
  };
  window.dndCompendiumData = packData;
}

function setPackStatus(message, ttl = 4000) {
  if (!packStatus) return;
  packStatus.textContent = message || '';
  if (statusTimer) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }
  if (message && ttl > 0) {
    statusTimer = setTimeout(() => {
      packStatus.textContent = '';
      statusTimer = null;
    }, ttl);
  }
}

function updatePackMeta() {
  if (!packMeta) return;
  const { packs = [] } = packData;
  if (!packs.length) {
    packMeta.textContent = lastCounts.total
      ? `Loaded ${lastCounts.total.toLocaleString()} SRD entries.`
      : 'No licensed content packs loaded.';
    return;
  }
  const packSummary = packs
    .map((pack) => {
      const edition = pack.edition ? ` · ${pack.edition}` : '';
      const license = pack.license ? ` • ${pack.license}` : '';
      return `${pack.name}${edition}${license}`;
    })
    .join(' | ');
  const entrySummary = lastCounts.total
    ? ` • ${lastCounts.total.toLocaleString()} entries ready`
    : '';
  packMeta.textContent = `Loaded packs: ${packSummary}${entrySummary}`;
}

function sendHydrateToWorker() {
  worker.postMessage({ type: 'hydrate', payload: packData });
}

function scheduleQuery() {
  pendingQuery = true;
  if (workerReady) {
    runQuery();
  }
}

function runQuery() {
  pendingQuery = false;
  activeRequestId += 1;
  const requestId = activeRequestId;
  const filters = getActiveFilters();
  const query = (searchInput?.value || '').trim();
  viewport?.setAttribute('aria-busy', 'true');
  worker.postMessage({
    type: 'query',
    query,
    filters,
    requestId,
    chunkSize: 80
  });
}

function getActiveFilters() {
  return Array.from(document.querySelectorAll('.chip[aria-pressed="true"]')).map((chip) => chip.dataset.filter);
}

function handleWorkerMessage(event) {
  const { type } = event.data || {};
  if (type === 'hydrate') {
    workerReady = true;
    lastCounts = event.data.counts || lastCounts;
    updatePackMeta();
    if (pendingQuery || !filtered.length) {
      runQuery();
    }
  } else if (type === 'results') {
    handleResults(event.data);
  }
}

function handleResults(payload) {
  const { requestId, chunk = [], total = 0, reset = false, done = false } = payload;
  if (requestId !== activeRequestId) {
    return;
  }
  if (reset) {
    filtered = [];
    entryIndex = new Map();
    if (listVirtualizer) {
      listVirtualizer.setItems([]);
    } else if (list) {
      list.innerHTML = '';
    }
  }
  if (Array.isArray(chunk) && chunk.length) {
    for (const entry of chunk) {
      filtered.push(entry);
      entryIndex.set(entry.id, entry);
    }
  }
  updateEmptyState(total);
  renderList();
  if (done) {
    viewport?.setAttribute('aria-busy', 'false');
  }
}

function updateEmptyState(total) {
  if (!emptyState) return;
  emptyState.hidden = total !== 0;
}

function ensureListVirtualizer() {
  if (!list || !viewport) return null;
  if (!listVirtualizer) {
    listVirtualizer = createVirtualList({
      container: list,
      render: (entry, index, existing) => renderRow(entry, index, existing),
      estimateHeight: 168,
      placeholderClassName: 'virtual-placeholder virtual-row',
      root: viewport,
      getKey: (item) => item.id
    });
  }
  return listVirtualizer;
}

function renderList() {
  if (!list) return;
  const virtualizer = ensureListVirtualizer();
  if (!filtered.length) {
    if (virtualizer) {
      virtualizer.setItems([]);
    } else {
      list.innerHTML = '';
    }
    list.dataset.itemCount = '0';
    return;
  }
  if (virtualizer) {
    virtualizer.setItems(filtered);
    list.dataset.itemCount = String(filtered.length);
  }
}

function renderRow(entry, index, existingNode) {
  let article = existingNode instanceof HTMLElement && existingNode.classList.contains('entry') ? existingNode : null;
  if (!article) {
    article = document.createElement('article');
    article.className = 'entry';
    article.setAttribute('role', 'listitem');
    article.tabIndex = 0;

    const title = document.createElement('h3');
    title.dataset.role = 'entry-title';
    article.appendChild(title);

    const subtitle = document.createElement('small');
    subtitle.dataset.role = 'entry-subtitle';
    article.appendChild(subtitle);

    const summary = document.createElement('p');
    summary.dataset.role = 'entry-summary';
    article.appendChild(summary);

    const actions = document.createElement('div');
    actions.className = 'entry-actions';

    const quickLook = document.createElement('button');
    quickLook.type = 'button';
    quickLook.dataset.action = 'details';
    quickLook.textContent = 'Quick look';
    actions.appendChild(quickLook);

    const quickAdd = document.createElement('button');
    quickAdd.type = 'button';
    quickAdd.dataset.action = 'quick-add';
    actions.appendChild(quickAdd);

    article.appendChild(actions);
  }

  article.dataset.id = entry.id;
  article.dataset.type = entry.type;
  article.dataset.favorite = favorites.has(entry.id) ? 'true' : 'false';

  const titleNode = article.querySelector('[data-role="entry-title"]') || article.querySelector('h3');
  if (titleNode) {
    titleNode.textContent = entry.name;
  }

  const subtitleNode = article.querySelector('[data-role="entry-subtitle"]') || article.querySelector('small');
  if (subtitleNode) {
    if (entry.subtitle) {
      subtitleNode.textContent = entry.subtitle;
      subtitleNode.hidden = false;
    } else {
      subtitleNode.textContent = '';
      subtitleNode.hidden = true;
    }
  }

  const summaryNode = article.querySelector('[data-role="entry-summary"]') || article.querySelector('p');
  if (summaryNode) {
    summaryNode.textContent = entry.summary;
  }

  const actionButtons = article.querySelectorAll('button[data-action]');
  actionButtons.forEach((button) => {
    if (button.dataset.action === 'quick-add') {
      const typeLabel = TYPE_LABELS[entry.type] || 'Entry';
      button.textContent = `Add ${typeLabel}`;
    } else if (button.dataset.action === 'details') {
      button.textContent = 'Quick look';
    }
  });

  return article;
}

function openDetailById(id) {
  const entry = entryIndex.get(id);
  if (entry) {
    openDetail(entry);
  }
}

function openDetail(entry) {
  currentEntry = entry;
  detailTitle.textContent = entry.name;
  detailSubtitle.textContent = entry.subtitle || '';
  renderTags(entry.tags || []);
  renderStats(entry.stats || []);
  renderBody(entry.body || '');
  applySpellPanel(entry);
  applyMonsterPanel(entry);
  detailStatus.textContent = '';
  favoriteToggle.dataset.id = entry.id;
  builderAddButton.dataset.id = entry.id;
  const typeLabel = TYPE_LABELS[entry.type] || 'Entry';
  builderAddButton.textContent = `Add ${typeLabel} to Builder`;
  favoriteToggle.textContent = favorites.has(entry.id) ? 'Remove Favorite' : 'Save to Favorites';
  detailDrawer.classList.add('open');
  detailDrawer.setAttribute('aria-hidden', 'false');
  if (drawerScrim) {
    drawerScrim.hidden = false;
    drawerScrim.classList.add('visible');
  }
}

function closeDetail() {
  detailDrawer.classList.remove('open');
  detailDrawer.setAttribute('aria-hidden', 'true');
  if (drawerScrim) {
    drawerScrim.classList.remove('visible');
    setTimeout(() => {
      if (!detailDrawer.classList.contains('open')) {
        drawerScrim.hidden = true;
      }
    }, 200);
  }
  currentEntry = null;
  resetSpellPanel();
  resetMonsterPanel();
}

function renderTags(tags) {
  detailTags.innerHTML = '';
  tags.filter(Boolean).forEach((tag) => {
    const li = document.createElement('li');
    li.className = 'tag';
    li.textContent = tag;
    detailTags.appendChild(li);
  });
}

function renderStats(stats) {
  detailStats.innerHTML = '';
  stats.filter((stat) => stat && stat.value).forEach((stat) => {
    const dt = document.createElement('dt');
    dt.textContent = stat.label;
    detailStats.appendChild(dt);
    const dd = document.createElement('dd');
    dd.textContent = stat.value;
    detailStats.appendChild(dd);
  });
}

function renderBody(bodyText) {
  detailBody.innerHTML = '';
  const segments = bodyText.split(/\n{2,}/);
  segments.forEach((segment) => {
    const trimmed = segment.trim();
    if (!trimmed) return;
    const paragraph = document.createElement('p');
    paragraph.textContent = trimmed;
    detailBody.appendChild(paragraph);
  });
  if (!detailBody.children.length) {
    const paragraph = document.createElement('p');
    paragraph.textContent = 'Full details unavailable for this entry.';
    detailBody.appendChild(paragraph);
  }
}

function resetSpellPanel() {
  if (!spellPanelHost) return;
  spellPanelHost.hidden = true;
  spellPanelHost.innerHTML = '';
}

function loadSpellPanelModule() {
  if (!spellPanelModulePromise) {
    spellPanelModulePromise = import('./spell-panel.js');
  }
  return spellPanelModulePromise;
}

function applySpellPanel(entry) {
  if (!spellPanelHost) return;
  if (!entry || entry.type !== 'spell') {
    if (spellPanelModulePromise) {
      spellPanelModulePromise
        .then((mod) => {
          if (typeof mod.clearSpellPanel === 'function') {
            mod.clearSpellPanel(spellPanelHost);
          } else {
            resetSpellPanel();
          }
        })
        .catch(() => {
          resetSpellPanel();
        });
    } else {
      resetSpellPanel();
    }
    return;
  }
  loadSpellPanelModule()
    .then((mod) => {
      if (typeof mod.renderSpellPanel === 'function') {
        mod.renderSpellPanel(entry, spellPanelHost);
      }
    })
    .catch((error) => {
      console.warn('Failed to render spell detail', error);
      resetSpellPanel();
    });
}

function resetMonsterPanel() {
  if (!monsterPanelHost) return;
  monsterPanelHost.hidden = true;
  monsterPanelHost.innerHTML = '';
}

function createMonsterListSection(title, items = []) {
  if (!items.length) return null;
  const section = document.createElement('section');
  section.className = 'monster-panel__section';
  const heading = document.createElement('h3');
  heading.className = 'monster-panel__section-title';
  heading.textContent = title;
  section.appendChild(heading);
  const list = document.createElement('ul');
  list.className = 'monster-panel__list';
  items.forEach((item) => {
    if (!item?.value) return;
    const li = document.createElement('li');
    li.className = 'monster-panel__list-item';
    if (item.label) {
      const strong = document.createElement('strong');
      strong.textContent = `${item.label}: `;
      li.appendChild(strong);
    }
    const span = document.createElement('span');
    span.textContent = item.value;
    li.appendChild(span);
    list.appendChild(li);
  });
  if (!list.childNodes.length) return null;
  section.appendChild(list);
  return section;
}

function createMonsterTraitSection(title, traits = []) {
  if (!traits.length) return null;
  const section = document.createElement('section');
  section.className = 'monster-panel__section';
  const heading = document.createElement('h3');
  heading.className = 'monster-panel__section-title';
  heading.textContent = title;
  section.appendChild(heading);
  const wrapper = document.createElement('div');
  wrapper.className = 'monster-panel__traits';
  traits.forEach((trait) => {
    if (!trait?.text && !trait?.name) return;
    const item = document.createElement('p');
    const name = document.createElement('span');
    name.className = 'monster-panel__trait-name';
    name.textContent = trait.name || title;
    item.appendChild(name);
    if (trait.text) {
      const text = document.createElement('span');
      text.textContent = trait.text;
      item.appendChild(text);
    }
    wrapper.appendChild(item);
  });
  if (!wrapper.childNodes.length) return null;
  section.appendChild(wrapper);
  return section;
}

function applyMonsterPanel(entry) {
  if (!monsterPanelHost) return;
  const monster = entry?.monster;
  if (!entry || entry.type !== 'monster' || !monster) {
    resetMonsterPanel();
    return;
  }

  const panel = document.createElement('div');
  panel.className = 'monster-panel';

  const headline = document.createElement('div');
  headline.className = 'monster-panel__headline';
  const subtitle = document.createElement('p');
  subtitle.className = 'monster-panel__subtitle';
  subtitle.textContent = monster.sizeType || TYPE_LABELS.monster;
  headline.appendChild(subtitle);

  const metaValues = Array.isArray(monster.meta) ? monster.meta.filter(Boolean) : [];
  if (metaValues.length) {
    const meta = document.createElement('div');
    meta.className = 'monster-panel__meta';
    metaValues.forEach((value) => {
      const span = document.createElement('span');
      span.textContent = value;
      meta.appendChild(span);
    });
    headline.appendChild(meta);
  }
  panel.appendChild(headline);

  if (Array.isArray(monster.abilities) && monster.abilities.length) {
    const abilityGrid = document.createElement('div');
    abilityGrid.className = 'monster-panel__ability-grid';
    monster.abilities.forEach((ability) => {
      if (!ability || typeof ability.score !== 'number') return;
      const card = document.createElement('div');
      card.className = 'monster-panel__ability';
      const abilityLabel = document.createElement('span');
      abilityLabel.className = 'monster-panel__ability-ability';
      abilityLabel.textContent = ability.ability || '';
      card.appendChild(abilityLabel);
      const abilityScore = document.createElement('span');
      abilityScore.className = 'monster-panel__ability-score';
      abilityScore.textContent = String(ability.score);
      card.appendChild(abilityScore);
      if (ability.mod !== undefined) {
        const abilityMod = document.createElement('span');
        abilityMod.className = 'monster-panel__ability-mod';
        abilityMod.textContent = ability.mod;
        card.appendChild(abilityMod);
      }
      abilityGrid.appendChild(card);
    });
    if (abilityGrid.childNodes.length) {
      panel.appendChild(abilityGrid);
    }
  }

  const primaryStats = createMonsterListSection('Combat Stats', [
    monster.armorClass ? { label: 'Armor Class', value: monster.armorClass } : null,
    monster.hitPoints ? { label: 'Hit Points', value: monster.hitPoints } : null,
    monster.speed ? { label: 'Speed', value: monster.speed } : null
  ].filter(Boolean));
  if (primaryStats) {
    panel.appendChild(primaryStats);
  }

  const secondaryStats = createMonsterListSection('Defenses & Senses', [
    monster.savingThrows ? { label: 'Saving Throws', value: monster.savingThrows } : null,
    monster.skills ? { label: 'Skills', value: monster.skills } : null,
    monster.damageVulnerabilities ? { label: 'Vulnerabilities', value: monster.damageVulnerabilities } : null,
    monster.damageResistances ? { label: 'Resistances', value: monster.damageResistances } : null,
    monster.damageImmunities ? { label: 'Damage Immunities', value: monster.damageImmunities } : null,
    monster.conditionImmunities ? { label: 'Condition Immunities', value: monster.conditionImmunities } : null,
    monster.senses ? { label: 'Senses', value: monster.senses } : null,
    monster.languages ? { label: 'Languages', value: monster.languages } : null
  ].filter(Boolean));
  if (secondaryStats) {
    panel.appendChild(secondaryStats);
  }

  const traitSection = createMonsterTraitSection('Traits', monster.traits || []);
  if (traitSection) {
    panel.appendChild(traitSection);
  }

  const actionSection = createMonsterTraitSection('Actions', monster.actions || []);
  if (actionSection) {
    panel.appendChild(actionSection);
  }

  const reactionSection = createMonsterTraitSection('Reactions', monster.reactions || []);
  if (reactionSection) {
    panel.appendChild(reactionSection);
  }

  const legendarySection = createMonsterTraitSection('Legendary Actions', monster.legendaryActions || []);
  if (legendarySection) {
    panel.appendChild(legendarySection);
  }

  monsterPanelHost.innerHTML = '';
  monsterPanelHost.appendChild(panel);
  monsterPanelHost.hidden = false;
}

function toggleFavorite(id) {
  if (!id) return;
  if (favorites.has(id)) {
    favorites.delete(id);
  } else {
    favorites.add(id);
  }
  persistFavorites();
  favoriteToggle.textContent = favorites.has(id) ? 'Remove Favorite' : 'Save to Favorites';
  updateFavoriteInView(id);
}

function updateFavoriteInView(id) {
  const selectorId = escapeSelector(id);
  if (!selectorId) return;
  const article = list.querySelector(`article[data-id="${selectorId}"]`);
  if (article) {
    article.dataset.favorite = favorites.has(id) ? 'true' : 'false';
  }
}

function escapeSelector(value) {
  if (window.CSS && typeof window.CSS.escape === 'function') {
    return window.CSS.escape(value);
  }
  return value.replace(/([:\\.#\[\],=])/g, '\\$1');
}

function handleQuickAdd(entry, source = 'list') {
  if (!entry) return;
  const payload = {
    id: entry.id,
    slug: entry.slug,
    type: entry.type,
    name: entry.name,
    timestamp: Date.now()
  };
  quickAddQueue.unshift(payload);
  if (quickAddQueue.length > 50) {
    quickAddQueue.length = 50;
  }
  persistQuickAddQueue();
  try {
    if (window.dnd && typeof window.dnd.quickAddToBuilder === 'function') {
      window.dnd.quickAddToBuilder(payload);
    }
  } catch (error) {
    console.warn('quickAddToBuilder failed', error);
  }
  window.dispatchEvent(new CustomEvent('dnd-builder-quick-add', { detail: payload }));
  const typeLabel = TYPE_LABELS[entry.type] || 'Entry';
  if (source === 'drawer') {
    detailStatus.textContent = `${typeLabel} queued in builder.`;
  }
  setPackStatus(`${entry.name} ready to add in builder.`, 3200);
}

function hydratePackData() {
  if (window.dnd && typeof window.dnd.getCompendiumData === 'function') {
    return window.dnd
      .getCompendiumData()
      .then((dataset) => {
        setPackData(dataset);
        updatePackMeta();
        sendHydrateToWorker();
      })
      .catch((error) => {
        console.warn('Failed to load compendium packs', error);
        const fallback = window.dndCompendiumData || window.dndData || packData;
        setPackData(fallback);
        updatePackMeta();
        sendHydrateToWorker();
      });
  }
  if (window.dndData) {
    setPackData(window.dndData);
    updatePackMeta();
    sendHydrateToWorker();
  }
  return Promise.resolve();
}

function subscribeToPackChanges() {
  if (window.dnd && typeof window.dnd.onChange === 'function') {
    window.dnd.onChange((detail) => {
      if (detail && detail.compendium) {
        setPackData(detail.compendium);
        updatePackMeta();
        sendHydrateToWorker();
      }
    });
  } else {
    window.addEventListener('dnd-data-changed', (event) => {
      if (event?.detail?.compendium) {
        setPackData(event.detail.compendium);
      } else {
        const fallback = window.dndCompendiumData || window.dndData || packData;
        setPackData(fallback);
      }
      updatePackMeta();
      sendHydrateToWorker();
    });
  }
}

function wirePackControls() {
  const fileInput = document.getElementById('compendium-pack-file');
  const importFileButton = document.getElementById('compendium-import-file');
  const importUrlButton = document.getElementById('compendium-import-url');
  const reloadButton = document.getElementById('compendium-reload-packs');

  if (importFileButton && fileInput) {
    importFileButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (event) => {
      const [file] = event.target.files || [];
      if (!file || !window.dnd || typeof window.dnd.importPackFile !== 'function') {
        setPackStatus('Pack loader unavailable.');
        return;
      }
      setPackStatus(`Importing ${file.name}…`, 0);
      try {
        await window.dnd.importPackFile(file);
        setPackStatus(`Imported ${file.name}`, 3200);
      } catch (error) {
        console.error('Failed to import pack', error);
        setPackStatus('Import failed. Check console for details.', 5200);
      } finally {
        fileInput.value = '';
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
      setPackStatus('Fetching pack…', 0);
      try {
        await window.dnd.importPackFromUrl(url);
        setPackStatus('Pack added from URL.', 3200);
      } catch (error) {
        console.error('Failed to import pack from URL', error);
        setPackStatus('Import failed. Check console for details.', 5200);
      }
    });
  }

  if (reloadButton) {
    reloadButton.addEventListener('click', async () => {
      if (!window.dnd || typeof window.dnd.reload !== 'function') {
        setPackStatus('Pack loader unavailable.');
        return;
      }
      setPackStatus('Reloading packs…', 0);
      try {
        await window.dnd.reload();
        setPackStatus('Packs reloaded.', 3000);
      } catch (error) {
        console.error('Failed to reload packs', error);
        setPackStatus('Reload failed.', 4200);
      }
    });
  }
}

function initEventHandlers() {
  searchInput?.addEventListener('input', () => {
    scheduleQuery();
  });

  chipGroup?.addEventListener('click', (event) => {
    const button = event.target.closest('.chip');
    if (!button) return;
    const pressed = button.getAttribute('aria-pressed') === 'true';
    button.setAttribute('aria-pressed', String(!pressed));
    scheduleQuery();
  });

  list?.addEventListener('click', (event) => {
    const actionButton = event.target.closest('button[data-action]');
    if (actionButton) {
      const article = actionButton.closest('.entry');
      if (!article) return;
      const id = article.dataset.id;
      if (actionButton.dataset.action === 'details') {
        openDetailById(id);
      } else if (actionButton.dataset.action === 'quick-add') {
        const entry = entryIndex.get(id);
        if (entry) {
          handleQuickAdd(entry, 'list');
        }
      }
      return;
    }
    const article = event.target.closest('.entry');
    if (article) {
      openDetailById(article.dataset.id);
    }
  });

  list?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const article = event.target.closest('.entry');
    if (article) {
      event.preventDefault();
      openDetailById(article.dataset.id);
    }
  });

  favoriteToggle?.addEventListener('click', (event) => {
    const id = event.currentTarget.dataset.id;
    toggleFavorite(id);
  });

  builderAddButton?.addEventListener('click', (event) => {
    const id = event.currentTarget.dataset.id;
    const entry = id ? entryIndex.get(id) : currentEntry;
    if (entry) {
      handleQuickAdd(entry, 'drawer');
    }
  });

  drawerScrim?.addEventListener('click', () => {
    closeDetail();
  });

  detailDrawer?.addEventListener('click', (event) => {
    if (event.target === detailDrawer) {
      closeDetail();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && detailDrawer.classList.contains('open')) {
      closeDetail();
    }
  });
}

async function init() {
  resetSpellPanel();
  worker.addEventListener('message', handleWorkerMessage);
  initEventHandlers();
  wirePackControls();
  subscribeToPackChanges();
  await hydratePackData();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
