const THEME_STORAGE_KEY = 'quest-kit:theme';
const THEME_OPTIONS = [
  { value: 'system', label: 'System default' },
  { value: 'dark', label: 'Nightfall (dark)' },
  { value: 'light', label: 'Daybreak (light)' },
  { value: 'parchment', label: 'Parchment (sepia)' },
  { value: 'synthwave', label: 'Synthwave (neon)' },
  { value: 'high-contrast', label: 'High contrast (WCAG)' }
];
const AVAILABLE_THEMES = new Set(
  THEME_OPTIONS.map((option) => option.value).filter((value) => value !== 'system')
);
const themeListeners = new Set();
let activeTheme = 'system';
const QUICK_NAV_STYLE_ID = 'quick-nav-menu-styles';
const QUICK_NAV_SOURCES_HOST_ID = 'quick-nav-sources-host';

const quickNavSourcesElements = {
  host: null,
  scrim: null,
  panel: null,
  close: null,
  list: null
};
let quickNavSourcesFocusReturn = null;
let quickNavSourcesData = { state: 'loading', packs: [] };
let quickNavSourcesDataInitialised = false;
let quickNavSourcesHideTimer = null;

function ensureQuickNavStyles() {
  if (document.getElementById(QUICK_NAV_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = QUICK_NAV_STYLE_ID;
  style.textContent = `
.quick-nav {
  position: fixed;
  left: calc(var(--safe-left, env(safe-area-inset-left, 0px)) + 1.25rem);
  bottom: calc(var(--safe-bottom, env(safe-area-inset-bottom, 0px)) + var(--bottom-nav-height, 0px) + 1.25rem);
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

function ensureQuickNavSourcesPanel() {
  if (quickNavSourcesElements.host) {
    return quickNavSourcesElements;
  }

  const host = document.createElement('div');
  host.id = QUICK_NAV_SOURCES_HOST_ID;
  host.className = 'quick-nav-sheet';
  host.setAttribute('data-state', 'closed');
  host.setAttribute('aria-hidden', 'true');
  host.hidden = true;

  const scrim = document.createElement('div');
  scrim.className = 'quick-nav-sheet__scrim';
  host.appendChild(scrim);

  const panel = document.createElement('section');
  panel.className = 'quick-nav-sheet__panel surface-blur';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'quick-nav-sources-title');
  panel.tabIndex = -1;

  const header = document.createElement('header');
  header.className = 'quick-nav-sheet__header';

  const title = document.createElement('h2');
  title.className = 'quick-nav-sheet__title';
  title.id = 'quick-nav-sources-title';
  title.textContent = 'Active sources';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'quick-nav-sheet__close';
  closeButton.textContent = 'Close';

  header.appendChild(title);
  header.appendChild(closeButton);

  const body = document.createElement('div');
  body.className = 'quick-nav-sheet__body';

  const intro = document.createElement('p');
  intro.className = 'muted';
  intro.textContent = 'Content packs currently merged into your compendium.';

  const list = document.createElement('ul');
  list.className = 'chip-set';
  list.setAttribute('data-pack-sources', '');
  list.setAttribute('aria-label', 'Active content packs');

  const learn = document.createElement('p');
  learn.className = 'muted';
  learn.innerHTML =
    'Learn more about <a href="./docs/packs.md" target="_blank" rel="noreferrer noopener">content packs</a> and <a href="./docs/pwa.md" target="_blank" rel="noreferrer noopener">offline support</a>.';

  body.appendChild(intro);
  body.appendChild(list);
  body.appendChild(learn);

  panel.appendChild(header);
  panel.appendChild(body);

  host.appendChild(panel);

  document.body.appendChild(host);

  host.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeQuickNavSourcesPanel({ returnFocus: true });
    }
  });
  scrim.addEventListener('click', () => {
    closeQuickNavSourcesPanel({ returnFocus: true });
  });
  closeButton.addEventListener('click', () => {
    closeQuickNavSourcesPanel({ returnFocus: true });
  });

  quickNavSourcesElements.host = host;
  quickNavSourcesElements.scrim = scrim;
  quickNavSourcesElements.panel = panel;
  quickNavSourcesElements.close = closeButton;
  quickNavSourcesElements.list = list;

  return quickNavSourcesElements;
}

function renderQuickNavSources() {
  ensureQuickNavSourcesPanel();
  const list = quickNavSourcesElements.list;
  if (!list) return;

  list.innerHTML = '';

  if (quickNavSourcesData.state !== 'ready') {
    const loadingItem = document.createElement('li');
    loadingItem.className = 'chip chip-muted';
    loadingItem.textContent = 'Loading pack data…';
    list.appendChild(loadingItem);
    return;
  }

  const packs = Array.isArray(quickNavSourcesData.packs) ? quickNavSourcesData.packs : [];
  if (!packs.length) {
    const empty = document.createElement('li');
    empty.className = 'chip chip-muted';
    empty.textContent = 'No content packs loaded';
    list.appendChild(empty);
    return;
  }

  packs.forEach((pack) => {
    if (!pack) return;
    const item = document.createElement('li');
    item.className = 'chip chip-outline';

    const title = document.createElement('span');
    title.textContent = pack.name || 'Pack';
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

    list.appendChild(item);
  });
}

function closeQuickNavSourcesPanel({ returnFocus = false } = {}) {
  const host = quickNavSourcesElements.host;
  if (!host) return;

  if (host.getAttribute('data-state') !== 'open') {
    if (returnFocus && quickNavSourcesFocusReturn && typeof quickNavSourcesFocusReturn.focus === 'function') {
      quickNavSourcesFocusReturn.focus({ preventScroll: true });
    }
    quickNavSourcesFocusReturn = null;
    return;
  }

  host.setAttribute('data-state', 'closed');
  host.setAttribute('aria-hidden', 'true');

  if (quickNavSourcesHideTimer) {
    clearTimeout(quickNavSourcesHideTimer);
  }
  quickNavSourcesHideTimer = window.setTimeout(() => {
    host.hidden = true;
    quickNavSourcesHideTimer = null;
  }, 200);

  if (returnFocus && quickNavSourcesFocusReturn && typeof quickNavSourcesFocusReturn.focus === 'function') {
    quickNavSourcesFocusReturn.focus({ preventScroll: true });
  }
  quickNavSourcesFocusReturn = null;
}

function openQuickNavSourcesPanel({ trigger } = {}) {
  ensureQuickNavSourcesPanel();
  const host = quickNavSourcesElements.host;
  const panel = quickNavSourcesElements.panel;
  if (!host || !panel) return;

  if (host.getAttribute('data-state') === 'open') {
    if (trigger) {
      quickNavSourcesFocusReturn = trigger;
    }
    requestAnimationFrame(() => {
      panel.focus({ preventScroll: true });
    });
    return;
  }

  quickNavSourcesFocusReturn = trigger || document.activeElement;
  if (quickNavSourcesHideTimer) {
    clearTimeout(quickNavSourcesHideTimer);
    quickNavSourcesHideTimer = null;
  }
  host.hidden = false;
  host.setAttribute('data-state', 'open');
  host.setAttribute('aria-hidden', 'false');

  renderQuickNavSources();

  requestAnimationFrame(() => {
    panel.focus({ preventScroll: true });
  });
}

function normaliseQuickNavPackSummaries(detail) {
  if (detail?.merged && Array.isArray(detail.merged.packSummaries)) {
    return detail.merged.packSummaries;
  }
  if (Array.isArray(detail?.packs)) {
    return detail.packs;
  }
  if (window.dndData && Array.isArray(window.dndData.packs)) {
    return window.dndData.packs;
  }
  return [];
}

function applyQuickNavSourcesDetail(detail) {
  quickNavSourcesData = {
    state: 'ready',
    packs: normaliseQuickNavPackSummaries(detail)
  };
  renderQuickNavSources();
}

function initQuickNavSourcesData() {
  if (quickNavSourcesDataInitialised) {
    return;
  }
  quickNavSourcesDataInitialised = true;

  renderQuickNavSources();

  const handleDetail = (detail) => {
    if (!detail) return;
    applyQuickNavSourcesDetail(detail);
  };

  if (window.dnd && typeof window.dnd.onChange === 'function') {
    window.dnd.onChange((detail) => {
      handleDetail(detail);
    });
  } else {
    window.addEventListener('dnd-data-changed', (event) => {
      handleDetail(event?.detail);
    });
  }

  if (window.dndData && Array.isArray(window.dndData.packs)) {
    applyQuickNavSourcesDetail({ merged: { packSummaries: window.dndData.packs } });
  }
}

.quick-nav__toggle {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(140deg, var(--accent, #4cc2ff) 0%, color-mix(in srgb, var(--accent, #4cc2ff) 60%, rgba(0, 0, 0, 0.35) 40%) 100%);
  color: var(--accent-contrast, #041014);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 28px 46px -32px rgba(0, 0, 0, 0.65);
  transition: transform var(--transition-base, 160ms ease), box-shadow var(--transition-base, 160ms ease);
}

.quick-nav__toggle:hover,
.quick-nav__toggle:focus-visible {
  transform: translateY(-2px);
  box-shadow: 0 32px 56px -38px rgba(0, 0, 0, 0.75);
}

.quick-nav__toggle:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--accent, #4cc2ff) 45%, #ffffff 55%);
  outline-offset: 3px;
}

.quick-nav__icon {
  font-size: 1.5rem;
  line-height: 1;
}

.quick-nav__menu {
  min-width: 200px;
  padding: 0.75rem;
  border-radius: 0.9rem;
  background: color-mix(in srgb, var(--surface, rgba(12, 18, 24, 0.92)) 78%, var(--bg, #0b1014) 22%);
  border: 1px solid color-mix(in srgb, var(--surface-border, rgba(255, 255, 255, 0.16)) 70%, transparent 30%);
  box-shadow: 0 20px 36px rgba(0, 0, 0, 0.4);
  display: grid;
  gap: 0.35rem;
  color: var(--fg, #f5f8fd);
}

.quick-nav__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.55rem 0.7rem;
  border-radius: 0.65rem;
  border: none;
  background: none;
  text-decoration: none;
  color: inherit;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: background-color 150ms ease, color 150ms ease;
}

.quick-nav__item:hover,
.quick-nav__item:focus-visible {
  background: color-mix(in srgb, var(--accent, #4cc2ff) 26%, transparent 74%);
  color: var(--fg, #f5f8fd);
  outline: none;
}

.quick-nav__item[aria-current="page"] {
  background: color-mix(in srgb, var(--accent, #4cc2ff) 45%, transparent 55%);
  color: var(--accent-contrast, #041014);
}

.quick-nav-sheet {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  pointer-events: none;
  opacity: 0;
  transition: opacity 160ms ease;
}

.quick-nav-sheet[data-state="open"] {
  pointer-events: auto;
  opacity: 1;
}

.quick-nav-sheet__scrim {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, rgba(4, 16, 20, 0.65) 78%, rgba(4, 16, 20, 0.9) 22%);
}

.quick-nav-sheet__panel {
  position: relative;
  margin: 0 auto calc(var(--safe-bottom, env(safe-area-inset-bottom, 0px)) + 1.25rem);
  width: min(520px, calc(100% - 2rem));
  max-height: min(75vh, 560px);
  background: color-mix(in srgb, var(--surface, rgba(12, 18, 24, 0.92)) 85%, var(--bg, #0b1014) 15%);
  border: 1px solid color-mix(in srgb, var(--surface-border, rgba(255, 255, 255, 0.16)) 80%, transparent 20%);
  border-radius: 1.25rem 1.25rem 0.85rem 0.85rem;
  padding: 1.35rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 32px 64px rgba(0, 0, 0, 0.55);
  transform: translateY(28px);
  transition: transform 180ms ease;
  overflow: auto;
  color: var(--fg, #f5f8fd);
}

.quick-nav-sheet[data-state="open"] .quick-nav-sheet__panel {
  transform: translateY(0);
}

.quick-nav-sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.quick-nav-sheet__title {
  margin: 0;
  font-size: 1.3rem;
}

.quick-nav-sheet__close {
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--fg, rgba(255, 255, 255, 0.65)) 80%, transparent 20%);
  background: transparent;
  color: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 140ms ease, color 140ms ease;
}

.quick-nav-sheet__close:hover,
.quick-nav-sheet__close:focus-visible {
  background: color-mix(in srgb, var(--accent, #4cc2ff) 28%, transparent 72%);
  color: var(--accent-contrast, #041014);
  outline: none;
}

.quick-nav-sheet__body {
  display: grid;
  gap: 0.75rem;
}

.quick-nav-sheet__body .muted {
  color: color-mix(in srgb, var(--fg, #f5f8fd) 58%, rgba(245, 248, 253, 0.5) 42%);
}

:root[data-theme="high-contrast"] .quick-nav__toggle {
  box-shadow: none;
  border: 2px solid var(--accent-strong, var(--accent, #ffffff));
}

:root[data-theme="high-contrast"] .quick-nav__item[aria-current="page"] {
  color: var(--fg, #ffffff);
}

@media (max-width: 640px) {
  .quick-nav {
    left: calc(var(--safe-left, env(safe-area-inset-left, 0px)) + 1rem);
    bottom: calc(var(--safe-bottom, env(safe-area-inset-bottom, 0px)) + var(--bottom-nav-height, 0px) + 1rem);
  }

  .quick-nav__menu {
    min-width: 180px;
  }

  .quick-nav-sheet__panel {
    width: calc(100% - 1.5rem);
    border-radius: 1rem 1rem 0.75rem 0.75rem;
    padding: 1.1rem 1.1rem 1.4rem;
  }
}
`;

  document.head?.appendChild(style);
}

function resolveAppUrl(path) {
  const manifestHref = document.querySelector('link[rel="manifest"]')?.getAttribute('href') ?? './manifest.webmanifest';
  let manifestUrl;

  try {
    manifestUrl = new URL(manifestHref, window.location.href);
  } catch (error) {
    manifestUrl = new URL(window.location.href);
  }

  const baseUrl = new URL('.', manifestUrl);
  return new URL(path, baseUrl);
}

function normalisePathname(value) {
  let url;
  try {
    url = value instanceof URL ? value : new URL(value, window.location.href);
  } catch (error) {
    return '/';
  }

  const pathname = url.pathname.replace(/index\.html?$/i, '');
  return pathname.replace(/\/+$/, '/') || '/';
}

function initQuickNavMenu() {
  if (!document.body || document.querySelector('[data-quick-nav]')) {
    return;
  }

  ensureQuickNavStyles();
  ensureQuickNavSourcesPanel();
  initQuickNavSourcesData();

  const container = document.createElement('div');
  container.className = 'quick-nav';
  container.setAttribute('data-quick-nav', '');
  container.setAttribute('data-state', 'closed');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'quick-nav__toggle';
  toggle.setAttribute('aria-haspopup', 'true');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'quick-nav-menu');
  toggle.setAttribute('aria-label', 'Open navigation menu');

  const icon = document.createElement('span');
  icon.className = 'quick-nav__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '☰';

  toggle.appendChild(icon);

  const menu = document.createElement('div');
  menu.className = 'quick-nav__menu';
  menu.id = 'quick-nav-menu';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', 'Quick navigation');
  menu.hidden = true;

  const currentPath = normalisePathname(window.location.href);
  const items = [
    { label: 'Main Menu', path: './' },
    { label: 'Compendium', path: 'compendium/' },
    { label: 'Builder', path: 'builder/' },
    {
      label: 'Active sources',
      action: ({ trigger }) => {
        openQuickNavSourcesPanel({ trigger });
      }
    }
  ];

  items.forEach((item) => {
    let element = null;
    if (item.path) {
      const url = resolveAppUrl(item.path);
      const anchor = document.createElement('a');
      anchor.className = 'quick-nav__item';
      anchor.href = url.toString();
      anchor.setAttribute('role', 'menuitem');
      anchor.textContent = item.label;

      const targetPath = normalisePathname(url);
      if (currentPath === targetPath) {
        anchor.setAttribute('aria-current', 'page');
      }

      element = anchor;
    } else if (typeof item.action === 'function') {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'quick-nav__item';
      button.setAttribute('role', 'menuitem');
      button.textContent = item.label;
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        closeMenu();
        item.action({ trigger: toggle, event });
      });
      element = button;
    }

    if (element) {
      menu.appendChild(element);
    }
  });

  container.appendChild(toggle);
  container.appendChild(menu);
  document.body.appendChild(container);

  let isOpen = false;

  function openMenu({ focusFirst = false } = {}) {
    if (isOpen) return;
    isOpen = true;
    container.setAttribute('data-state', 'open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation menu');
    menu.hidden = false;

    if (focusFirst) {
      const firstItem = menu.querySelector('.quick-nav__item');
      firstItem?.focus();
    }
  }

  function closeMenu({ returnFocus = false } = {}) {
    if (!isOpen) return;
    isOpen = false;
    container.setAttribute('data-state', 'closed');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation menu');
    menu.hidden = true;

    if (returnFocus) {
      toggle.focus();
    }
  }

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    if (isOpen) {
      closeMenu();
    } else {
      const focusFirst = event.detail === 0;
      openMenu({ focusFirst });
    }
  });

  document.addEventListener('click', (event) => {
    if (!isOpen) return;
    if (!container.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      closeMenu({ returnFocus: true });
    }
  });

  menu.addEventListener('click', () => {
    closeMenu();
  });
}

function normaliseTheme(value) {
  if (!value) return 'system';
  const next = String(value).toLowerCase();
  if (next === 'system') return 'system';
  return AVAILABLE_THEMES.has(next) ? next : 'system';
}

function readStoredTheme() {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return normaliseTheme(stored);
  } catch (error) {
    console.warn('Unable to read stored theme preference', error);
    return 'system';
  }
}

function persistTheme(theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn('Unable to persist theme preference', error);
  }
}

function updateMetaThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const root = document.documentElement;
  if (!root) return;
  const styles = getComputedStyle(root);
  const background = styles.getPropertyValue('--bg');
  if (background && background.trim()) {
    meta.setAttribute('content', background.trim());
  }
}

function notifyThemeChange(theme) {
  themeListeners.forEach((listener) => {
    try {
      listener(theme);
    } catch (error) {
      console.warn('Theme listener failed', error);
    }
  });
}

function applyTheme(theme, { persist = true } = {}) {
  const normalised = normaliseTheme(theme);
  const root = document.documentElement;
  if (!root) return normalised;

  if (normalised === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', normalised);
  }

  activeTheme = normalised;

  if (persist) {
    persistTheme(normalised);
  }

  requestAnimationFrame(() => {
    updateMetaThemeColor();
  });

  notifyThemeChange(normalised);

  return normalised;
}

function buildThemeSwitcher(theme) {
  const existing = document.querySelector('.theme-switcher');
  if (existing) {
    const selectEl = existing.querySelector('.theme-switcher__select');
    if (selectEl) {
      selectEl.value = theme;
    }
    return;
  }

  const host = document.querySelector('[data-theme-switcher]') || document.querySelector('.chip-row');
  if (!host) return;

  const wrapper = document.createElement('label');
  wrapper.className = 'theme-switcher';
  wrapper.setAttribute('data-component', 'theme-switcher');

  const legend = document.createElement('span');
  legend.className = 'theme-switcher__label';
  legend.textContent = 'Theme';

  const select = document.createElement('select');
  select.className = 'theme-switcher__select';
  select.id = 'theme-select';
  select.name = 'theme-select';
  select.setAttribute('aria-label', 'Select a theme');

  THEME_OPTIONS.forEach((option) => {
    const element = document.createElement('option');
    element.value = option.value;
    element.textContent = option.label;
    select.appendChild(element);
  });

  select.value = theme;

  select.addEventListener('change', (event) => {
    const nextTheme = normaliseTheme(event.target.value);
    applyTheme(nextTheme);
  });

  wrapper.appendChild(legend);
  wrapper.appendChild(select);
  host.appendChild(wrapper);

  themeListeners.add((value) => {
    if (select.value !== value) {
      select.value = value;
    }
  });
}

function initThemeSwitching() {
  const initial = applyTheme(readStoredTheme(), { persist: false });
  buildThemeSwitcher(initial);

  if (window.matchMedia) {
    const systemScheme = window.matchMedia('(prefers-color-scheme: dark)');
    if (systemScheme?.addEventListener) {
      systemScheme.addEventListener('change', () => {
        if (activeTheme === 'system') {
          applyTheme('system', { persist: false });
        }
      });
    } else if (systemScheme?.addListener) {
      systemScheme.addListener(() => {
        if (activeTheme === 'system') {
          applyTheme('system', { persist: false });
        }
      });
    }
  }
}

const MODULE_DEFINITIONS = {
  home: { loader: () => import(new URL('./home.js', import.meta.url).href), strategy: 'dom' },
  compendium: {
    loader: () => import(new URL('./compendium.js', import.meta.url).href),
    strategy: 'visible',
    selector: '#list-viewport'
  },
  'builder-wizard': { loader: () => import(new URL('../builder/wizard.js', import.meta.url).href), strategy: 'dom' },
  'builder-summary': {
    loader: () => import(new URL('../builder/summary.js', import.meta.url).href),
    strategy: 'idle',
    selector: '#summary-root'
  }
};

const requestedModules = new Set();

function scheduleByStrategy(name, definition, loader) {
  const runLoader = () => {
    try {
      const result = loader();
      if (result && typeof result.catch === 'function') {
        result.catch((error) => {
          console.error(`Failed to load module "${name}"`, error);
        });
      }
    } catch (error) {
      console.error(`Failed to load module "${name}"`, error);
    }
  };

  const strategy = definition?.strategy || 'dom';
  if (strategy === 'idle') {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(runLoader, { timeout: 1200 });
    } else {
      setTimeout(runLoader, 120);
    }
    return;
  }

  if (strategy === 'visible') {
    const selector = definition?.selector;
    if (selector && 'IntersectionObserver' in window) {
      const target = document.querySelector(selector);
      if (target) {
        const observer = new IntersectionObserver((entries) => {
          const visible = entries.some((entry) => entry.isIntersecting || entry.intersectionRatio > 0);
          if (visible) {
            observer.disconnect();
            runLoader();
          }
        });
        observer.observe(target);
        return;
      }
    }
  }

  runLoader();
}

function requestModule(name) {
  if (requestedModules.has(name)) {
    return;
  }
  const definition = MODULE_DEFINITIONS[name];
  if (!definition) {
    console.warn(`No loader registered for module "${name}"`);
    return;
  }
  requestedModules.add(name);
  scheduleByStrategy(name, definition, definition.loader);
}

function bootstrapModules() {
  const modulesAttr = document.body?.dataset?.modules || '';
  if (!modulesAttr) return;
  modulesAttr
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((name) => requestModule(name));
}

function onReady() {
  initThemeSwitching();
  initQuickNavMenu();
  bootstrapModules();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onReady);
} else {
  onReady();
}
