const MODULE_DEFINITIONS = {
  home: { loader: () => import('./home.js'), strategy: 'dom' },
  compendium: { loader: () => import('./compendium.js'), strategy: 'visible', selector: '#list-viewport' },
  'builder-wizard': { loader: () => import('../builder/wizard.js'), strategy: 'dom' },
  'builder-summary': { loader: () => import('../builder/summary.js'), strategy: 'idle', selector: '#summary-root' }
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapModules);
} else {
  bootstrapModules();
}
