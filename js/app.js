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
const QUICK_NAV_IDLE_DELAY = 3000;

const quickNavSourcesElements = {
  dialog: null,
  body: null,
  list: null,
  message: null,
  close: null,
  manageButton: null
};
let quickNavSourcesData = { state: 'loading', packs: [] };
let quickNavSourcesDataInitialised = false;

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
  bottom: calc(var(--safe-bottom, env(safe-area-inset-bottom, 0px)) + 1.25rem);
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
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
  opacity: 1;
  transition:
    opacity var(--transition-base, 160ms ease),
    transform var(--transition-base, 160ms ease),
    box-shadow var(--transition-base, 160ms ease);
}

.quick-nav[data-idle="true"] .quick-nav__toggle {
  opacity: 0.1;
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

.quick-nav[data-state="open"] .quick-nav__toggle,
.quick-nav__toggle:hover,
.quick-nav__toggle:focus-visible,
.quick-nav__toggle:active {
  opacity: 1;
}

.quick-nav__icon {
  font-size: 1.5rem;
  line-height: 1;
}

.quick-nav__menu {
  min-width: 220px;
  padding: 0.85rem;
  border-radius: 1rem;
  background: color-mix(in srgb, var(--surface, rgba(12, 18, 24, 0.92)) 78%, var(--bg, #0b1014) 22%);
  border: 1px solid color-mix(in srgb, var(--surface-border, rgba(255, 255, 255, 0.16)) 70%, transparent 30%);
  box-shadow: 0 24px 40px rgba(0, 0, 0, 0.45);
  display: grid;
  gap: 0.5rem;
  color: var(--fg, #f5f8fd);
  opacity: 0;
  visibility: hidden;
  transform: translateY(8px);
  transition:
    opacity var(--transition-base, 160ms ease),
    transform var(--transition-base, 160ms ease),
    visibility 0s linear var(--transition-base, 160ms ease);
}

.quick-nav__menu[hidden] {
  display: none;
}

.quick-nav[data-state="open"] .quick-nav__menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  transition-delay: 0s, 0s, 0s;
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

.quick-nav__item[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
}

.quick-nav__item:hover,
.quick-nav__item:focus-visible {
  background: color-mix(in srgb, var(--accent, #4cc2ff) 26%, transparent 74%);
  color: var(--fg, #f5f8fd);
  outline: none;
}

.quick-nav__item[aria-disabled="true"]:hover,
.quick-nav__item[aria-disabled="true"]:focus-visible {
  background: none;
  color: inherit;
}

.quick-nav__item[aria-current="page"] {
  background: color-mix(in srgb, var(--accent, #4cc2ff) 45%, transparent 55%);
  color: var(--accent-contrast, #041014);
}

.quick-nav__sources-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.quick-nav__sources-list .chip {
  font-size: 0.75rem;
}

.quick-nav__empty {
  margin: 0;
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--fg, #f5f8fd) 60%, rgba(245, 248, 253, 0.45) 40%);
}

.quick-nav-dialog {
  position: fixed;
  inset: 0;
  padding: clamp(1rem, 4vw, 2.5rem);
  display: grid;
  place-items: center;
  z-index: 80;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity var(--transition-base, 160ms ease),
    visibility 0s linear var(--transition-base, 160ms ease);
}

.quick-nav-dialog[hidden] {
  display: none;
}

.quick-nav-dialog[data-state="open"] {
  opacity: 1;
  visibility: visible;
  transition-delay: 0s, 0s;
}

.quick-nav-dialog__scrim {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--bg, #0b1014) 30%, rgba(0, 0, 0, 0.65) 70%);
}

.quick-nav-dialog__panel {
  position: relative;
  z-index: 1;
  max-width: min(480px, 100%);
  width: min(480px, 100%);
  padding: clamp(1.25rem, 4vw, 1.85rem);
  border-radius: 1.25rem;
  border: 1px solid color-mix(in srgb, var(--surface-border, rgba(255, 255, 255, 0.16)) 70%, transparent 30%);
  background: color-mix(in srgb, var(--surface, rgba(12, 18, 24, 0.94)) 80%, var(--bg, #0b1014) 20%);
  box-shadow: 0 32px 64px rgba(0, 0, 0, 0.55);
  display: grid;
  gap: 1rem;
  color: var(--fg, #f5f8fd);
}

.quick-nav-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.quick-nav-dialog__title {
  margin: 0;
  font-size: 1.2rem;
}

.quick-nav-dialog__close {
  border: none;
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  font-weight: 600;
  background: color-mix(in srgb, var(--accent, #4cc2ff) 18%, transparent 82%);
  color: var(--fg, #f5f8fd);
  cursor: pointer;
}

.quick-nav-dialog__close:hover,
.quick-nav-dialog__close:focus-visible {
  background: color-mix(in srgb, var(--accent, #4cc2ff) 32%, transparent 68%);
  outline: none;
}

.quick-nav-dialog__body {
  display: grid;
  gap: 0.75rem;
}

.quick-nav-dialog__description {
  margin: 0;
  font-size: 0.95rem;
  color: color-mix(in srgb, var(--fg, #f5f8fd) 78%, rgba(245, 248, 253, 0.45) 22%);
}

.quick-nav-dialog__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
}

.quick-nav-dialog__link {
  color: var(--accent, #4cc2ff);
  text-decoration: underline;
  font-weight: 600;
}

.quick-nav-dialog__manage {
  margin-left: auto;
}

:root[data-theme="high-contrast"] .quick-nav__toggle {
  box-shadow: none;
  border: 2px solid var(--accent-strong, var(--accent, #ffffff));
}

:root[data-theme="high-contrast"] .quick-nav__item[aria-current="page"] {
  color: var(--fg, #ffffff);
}

:root[data-theme="high-contrast"] .quick-nav-dialog__close {
  border: 2px solid var(--accent-strong, var(--accent, #ffffff));
}

@media (max-width: 640px) {
  .quick-nav {
    left: calc(var(--safe-left, env(safe-area-inset-left, 0px)) + 1rem);
    bottom: calc(var(--safe-bottom, env(safe-area-inset-bottom, 0px)) + 1rem);
  }

  .quick-nav__menu {
    min-width: 180px;
  }

  .quick-nav-dialog__panel {
    width: 100%;
  }

  .quick-nav-dialog__footer {
    gap: 0.5rem;
  }
}
`;

  document.head?.appendChild(style);
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

function renderQuickNavSources() {
  const { body, list, manageButton } = quickNavSourcesElements;
  if (!body || !list) {
    return;
  }

  list.innerHTML = '';

  if (quickNavSourcesElements.message) {
    quickNavSourcesElements.message.remove();
    quickNavSourcesElements.message = null;
  }

  const showMessage = (text) => {
    const message = document.createElement('p');
    message.className = 'quick-nav__empty';
    message.textContent = text;
    body.appendChild(message);
    quickNavSourcesElements.message = message;
  };

  if (quickNavSourcesData.state !== 'ready') {
    showMessage('Loading pack data…');
    return;
  }

  const packs = Array.isArray(quickNavSourcesData.packs) ? quickNavSourcesData.packs : [];
  if (!packs.length) {
    showMessage('No content packs loaded');
    return;
  }

  const fragment = document.createDocumentFragment();
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

    fragment.appendChild(item);
  });

  list.appendChild(fragment);

  if (manageButton) {
    const hasPackManager = Boolean(document.querySelector('[data-pack-manager]'));
    manageButton.disabled = !hasPackManager;
    if (!hasPackManager) {
      manageButton.setAttribute('aria-disabled', 'true');
      manageButton.title = 'Manage packs is available from the home screen.';
    } else {
      manageButton.removeAttribute('aria-disabled');
      manageButton.removeAttribute('title');
    }
  }
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

  const navItems = [
    { type: 'link', label: 'Compendium', path: 'compendium/' },
    { type: 'link', label: 'Builder', path: 'builder/' },
    { type: 'action', label: 'Active sources', action: 'open-sources' },
    { type: 'link', label: 'Content packs & offline support', path: 'docs/packs.md', external: true }
  ];

  navItems.forEach((item) => {
    if (item.type === 'link') {
      const url = resolveAppUrl(item.path);
      const anchor = document.createElement('a');
      anchor.className = 'quick-nav__item';
      anchor.href = url.toString();
      anchor.setAttribute('role', 'menuitem');
      anchor.textContent = item.label;

      if (item.external) {
        anchor.target = '_blank';
        anchor.rel = 'noreferrer noopener';
      } else {
        const targetPath = normalisePathname(url);
        if (currentPath === targetPath) {
          anchor.setAttribute('aria-current', 'page');
        }
      }

      menu.appendChild(anchor);
      return;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quick-nav__item';
    button.setAttribute('role', 'menuitem');
    button.textContent = item.label;

    button.addEventListener('click', (event) => {
      event.preventDefault();
      handleAction(item.action, button);
    });

    menu.appendChild(button);
  });

  container.appendChild(toggle);
  container.appendChild(menu);
  document.body.appendChild(container);

  const sourcesDialog = document.createElement('div');
  sourcesDialog.className = 'quick-nav-dialog';
  sourcesDialog.setAttribute('data-quick-nav-dialog', 'sources');
  sourcesDialog.hidden = true;
  sourcesDialog.setAttribute('aria-hidden', 'true');
  sourcesDialog.setAttribute('data-state', 'closed');

  const sourcesScrim = document.createElement('div');
  sourcesScrim.className = 'quick-nav-dialog__scrim';

  const sourcesPanel = document.createElement('section');
  sourcesPanel.className = 'quick-nav-dialog__panel surface-blur';
  sourcesPanel.setAttribute('role', 'dialog');
  sourcesPanel.setAttribute('aria-modal', 'true');
  sourcesPanel.setAttribute('aria-labelledby', 'quick-nav-sources-heading');

  const sourcesHeader = document.createElement('header');
  sourcesHeader.className = 'quick-nav-dialog__header';

  const sourcesTitle = document.createElement('h2');
  sourcesTitle.className = 'quick-nav-dialog__title';
  sourcesTitle.id = 'quick-nav-sources-heading';
  sourcesTitle.textContent = 'Active sources';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'quick-nav-dialog__close';
  closeButton.textContent = 'Close';
  closeButton.setAttribute('aria-label', 'Close active sources');

  sourcesHeader.appendChild(sourcesTitle);
  sourcesHeader.appendChild(closeButton);

  const sourcesBody = document.createElement('div');
  sourcesBody.className = 'quick-nav-dialog__body';

  const description = document.createElement('p');
  description.className = 'quick-nav-dialog__description';
  description.textContent = 'Content packs currently merged into your compendium.';

  const sourcesList = document.createElement('ul');
  sourcesList.className = 'quick-nav__sources-list';
  sourcesList.setAttribute('data-pack-sources', '');
  sourcesList.setAttribute('aria-labelledby', 'quick-nav-sources-heading');

  sourcesBody.appendChild(description);
  sourcesBody.appendChild(sourcesList);

  const sourcesFooter = document.createElement('div');
  sourcesFooter.className = 'quick-nav-dialog__footer';

  const learnLink = document.createElement('a');
  learnLink.className = 'quick-nav-dialog__link';
  const learnUrl = resolveAppUrl('docs/packs.md');
  learnLink.href = learnUrl.toString();
  learnLink.target = '_blank';
  learnLink.rel = 'noreferrer noopener';
  learnLink.textContent = 'Learn more about content packs and offline support';

  const manageButton = document.createElement('button');
  manageButton.type = 'button';
  manageButton.className = 'button button-secondary quick-nav-dialog__manage';
  manageButton.textContent = 'Manage packs';

  sourcesFooter.appendChild(learnLink);
  sourcesFooter.appendChild(manageButton);

  sourcesPanel.appendChild(sourcesHeader);
  sourcesPanel.appendChild(sourcesBody);
  sourcesPanel.appendChild(sourcesFooter);

  sourcesDialog.appendChild(sourcesScrim);
  sourcesDialog.appendChild(sourcesPanel);
  document.body.appendChild(sourcesDialog);

  quickNavSourcesElements.dialog = sourcesDialog;
  quickNavSourcesElements.body = sourcesBody;
  quickNavSourcesElements.list = sourcesList;
  quickNavSourcesElements.close = closeButton;
  quickNavSourcesElements.manageButton = manageButton;

  initQuickNavSourcesData();

  let isOpen = false;
  let isDialogOpen = false;
  let sourcesDialogFocusReturn = null;
  let idleTimer = null;

  function resetIdleTimer() {
    if (idleTimer) {
      window.clearTimeout(idleTimer);
    }
    container.removeAttribute('data-idle');
    idleTimer = window.setTimeout(() => {
      if (!container.isConnected) return;
      container.setAttribute('data-idle', 'true');
    }, QUICK_NAV_IDLE_DELAY);
  }

  function handleActivity() {
    if (!container.isConnected) {
      return;
    }
    resetIdleTimer();
  }

  ['pointerdown', 'pointermove', 'touchstart'].forEach((eventName) => {
    document.addEventListener(eventName, handleActivity, { passive: true });
  });
  ['keydown', 'focusin'].forEach((eventName) => {
    document.addEventListener(eventName, handleActivity);
  });
  toggle.addEventListener('mouseenter', handleActivity);
  toggle.addEventListener('focus', handleActivity);

  resetIdleTimer();

  function openMenu({ focusFirst = false } = {}) {
    if (isOpen) return;
    isOpen = true;
    container.setAttribute('data-state', 'open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation menu');
    menu.hidden = false;
    resetIdleTimer();

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
    resetIdleTimer();

    if (returnFocus) {
      toggle.focus();
    }
  }

  function handleQuickNavPackManager() {
    const trigger = document.querySelector('[data-pack-manager-open]');
    if (trigger) {
      trigger.click();
      return true;
    }
    const host = document.querySelector('[data-pack-manager]');
    if (host) {
      host.removeAttribute('hidden');
      host.setAttribute('data-state', 'open');
      host.setAttribute('aria-hidden', 'false');
      document.body?.setAttribute('data-pack-manager', 'open');
      const panel = host.querySelector('[data-pack-manager-panel]');
      if (panel && typeof panel.focus === 'function') {
        requestAnimationFrame(() => {
          panel.focus({ preventScroll: true });
        });
      }
      return true;
    }
    return false;
  }

  function openSourcesDialog(trigger) {
    if (isDialogOpen) return;
    const dialog = quickNavSourcesElements.dialog;
    if (!dialog) return;
    isDialogOpen = true;
    sourcesDialogFocusReturn = trigger || document.activeElement;
    dialog.hidden = false;
    dialog.setAttribute('aria-hidden', 'false');
    dialog.setAttribute('data-state', 'open');
    resetIdleTimer();
    requestAnimationFrame(() => {
      quickNavSourcesElements.close?.focus({ preventScroll: true });
    });
  }

  function closeSourcesDialog({ returnFocus = true } = {}) {
    if (!isDialogOpen) return;
    const dialog = quickNavSourcesElements.dialog;
    if (!dialog) return;
    dialog.setAttribute('data-state', 'closed');
    dialog.setAttribute('aria-hidden', 'true');
    dialog.hidden = true;
    isDialogOpen = false;
    resetIdleTimer();
    if (returnFocus && sourcesDialogFocusReturn && typeof sourcesDialogFocusReturn.focus === 'function') {
      sourcesDialogFocusReturn.focus({ preventScroll: true });
    }
    sourcesDialogFocusReturn = null;
  }

  function handleAction(action, trigger) {
    if (action === 'open-sources') {
      openSourcesDialog(trigger);
    }
  }

  manageButton.addEventListener('click', () => {
    if (handleQuickNavPackManager()) {
      closeSourcesDialog({ returnFocus: false });
    }
  });

  sourcesScrim.addEventListener('click', () => {
    closeSourcesDialog();
  });
  closeButton.addEventListener('click', () => {
    closeSourcesDialog();
  });
  sourcesDialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSourcesDialog();
    }
  });
  sourcesDialog.addEventListener('click', (event) => {
    if (event.target === sourcesDialog) {
      closeSourcesDialog();
    }
  });

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
    if (event.key === 'Escape') {
      if (isDialogOpen) {
        event.preventDefault();
        closeSourcesDialog();
        return;
      }
      if (isOpen) {
        event.preventDefault();
        closeMenu({ returnFocus: true });
      }
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
