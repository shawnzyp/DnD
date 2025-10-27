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
  bootstrapModules();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onReady);
} else {
  onReady();
}
