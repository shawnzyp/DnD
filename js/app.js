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
  text-decoration: none;
  color: inherit;
  font-weight: 600;
  font-size: 0.95rem;
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
  const items = [
    { label: 'Main Menu', path: './' },
    { label: 'Compendium', path: 'compendium/' },
    { label: 'Builder', path: 'builder/' }
  ];

  items.forEach((item) => {
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

    menu.appendChild(anchor);
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
