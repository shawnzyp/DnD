const DEFAULT_FILES = ['classes', 'races', 'backgrounds', 'feats', 'spells', 'items', 'companions', 'rules'];
const DATASET_LABELS = {
  classes: 'Classes',
  races: 'Ancestries',
  backgrounds: 'Backgrounds',
  feats: 'Feats',
  spells: 'Spells',
  items: 'Equipment',
  companions: 'Allies',
  rules: 'Rules'
};

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

function buildDatasetStatus(data, manifestPacks) {
  const datasetKeys = new Set();
  manifestPacks.forEach((pack) => {
    const files = Array.isArray(pack.files) && pack.files.length ? pack.files : DEFAULT_FILES;
    files.forEach((file) => datasetKeys.add(file));
  });
  if (!datasetKeys.size) {
    DEFAULT_FILES.forEach((file) => datasetKeys.add(file));
  }
  const statuses = Array.from(datasetKeys).map((key) => {
    const records = Array.isArray(data?.[key]) ? data[key].length : 0;
    return {
      key,
      count: records,
      loaded: records > 0
    };
  });
  return statuses;
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

function updatePackMeter(data) {
  const meter = document.querySelector('[data-pack-meter]');
  const fill = document.querySelector('[data-pack-fill]');
  const percentLabel = document.querySelector('[data-pack-percent]');
  const countLabel = document.querySelector('[data-pack-count]');
  const statusChip = document.querySelector('[data-pack-chip]');
  const summaryLabel = document.querySelector('[data-pack-summary]');
  const datasetChipContainer = document.querySelector('[data-dataset-chips]');
  const sourceList = document.querySelector('[data-pack-sources]');

  const manifestPacks = Array.isArray(data?.manifest?.packs) ? data.manifest.packs : [];
  const packSummaries = Array.isArray(data?.packs) && data.packs.length
    ? data.packs
    : manifestPacks.map((pack) => ({
        id: pack.id,
        name: pack.name,
        edition: pack.edition,
        version: pack.version
      }));
  const datasets = buildDatasetStatus(data, manifestPacks);
  const total = datasets.length;
  const loaded = datasets.filter((dataset) => dataset.loaded).length;
  const percentage = total ? Math.round((loaded / total) * 100) : 0;
  const packCount = manifestPacks.length;
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
    if (packCount === 0) {
      summaryLabel.textContent = 'No active packs';
    } else if (packCount === 1) {
      summaryLabel.textContent = '1 active pack';
    } else {
      summaryLabel.textContent = `${packCount} active packs`;
    }
  }
  if (statusChip) {
    statusChip.classList.remove('chip-warning', 'chip-positive', 'chip-muted', 'chip-strong');
    if (!packCount) {
      statusChip.classList.add('chip-warning');
      statusChip.textContent = 'Add a content pack';
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

    function applyState(expanded) {
      sheet.setAttribute('data-state', expanded ? 'expanded' : 'collapsed');
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      toggle.setAttribute('aria-label', expanded ? expandedLabel : collapsedLabel);
    }

    toggle.addEventListener('click', () => {
      const next = sheet.getAttribute('data-state') !== 'expanded';
      applyState(next);
    });

    const initial = sheet.getAttribute('data-state') !== 'collapsed';
    applyState(initial);
  });
}

function render(data) {
  updatePackMeter(data || {});
}

document.addEventListener('DOMContentLoaded', () => {
  markActiveNavigation();
  initBottomSheets();
  if (window.dndDataReady && typeof window.dndDataReady.then === 'function') {
    window.dndDataReady
      .then((data) => {
        render(data);
      })
      .catch((error) => {
        console.error('Unable to load pack data', error);
        render({});
      });
  } else {
    render({});
  }
});
