const DEFAULT_ROOT_MARGIN = '150% 0px';
const MEASUREMENT_THRESHOLD = 5000;

function normalizeContent(content) {
  if (!content) return null;
  if (content instanceof Node) {
    return content;
  }
  if (Array.isArray(content)) {
    const fragment = document.createDocumentFragment();
    content.forEach((node) => {
      if (node instanceof Node) {
        fragment.appendChild(node);
      }
    });
    return fragment;
  }
  if (content instanceof DocumentFragment) {
    return content;
  }
  return null;
}

function measureInNextFrame(callback) {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      requestAnimationFrame(callback);
    });
  } else {
    setTimeout(callback, 32);
  }
}

function schedulePerformanceProbe(label, duration = 1200) {
  if (typeof requestAnimationFrame !== 'function' || typeof performance === 'undefined') {
    return;
  }
  const samples = [];
  let started = null;
  let last = null;
  function frame(now) {
    if (started === null) {
      started = now;
      last = now;
    }
    samples.push(now - last);
    last = now;
    if (now - started >= duration) {
      const total = samples.reduce((sum, value) => sum + value, 0);
      const average = samples.length ? total / samples.length : 0;
      const fps = samples.length ? (samples.length / ((now - started) / 1000)) : 0;
      const budget = average ? average.toFixed(2) : '0.00';
      const fpsLabel = fps ? fps.toFixed(1) : '0.0';
      console.info(
        `[virtual-list] ${label}: avg ${budget}ms per frame (~${fpsLabel}fps) across ${samples.length} samples.`
      );
      return;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

export function createVirtualList(options) {
  const {
    container,
    render,
    estimateHeight = 160,
    placeholderTagName = 'div',
    placeholderClassName = 'virtual-placeholder',
    root = null,
    rootMargin = DEFAULT_ROOT_MARGIN,
    observeResize = true,
    getKey = (_, index) => index
  } = options || {};
  if (!container || typeof render !== 'function') {
    throw new Error('createVirtualList requires a container and render function.');
  }

  let observer = null;
  let resizeObserver = null;
  let items = [];
  let records = [];
  let keys = [];
  let measurementScheduled = false;

  function disconnectObservers() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
  }

  function handleIntersect(entries) {
    entries.forEach((entry) => {
      const target = entry.target;
      if (!(target instanceof HTMLElement)) return;
      const index = Number.parseInt(target.dataset.virtualIndex || '-1', 10);
      if (!Number.isFinite(index) || index < 0 || index >= records.length) return;
      const record = records[index];
      if (!record) return;
      if (entry.isIntersecting) {
        mount(record);
      } else {
        unmount(record);
      }
    });
  }

  function ensureResizeObserver() {
    if (!observeResize || typeof ResizeObserver !== 'function') return;
    if (resizeObserver) return;
    resizeObserver = new ResizeObserver(() => {
      records.forEach((record) => {
        if (record.rendered) {
          scheduleMeasurement(record);
        }
      });
    });
    resizeObserver.observe(container);
  }

  function scheduleMeasurement(record) {
    measureInNextFrame(() => {
      if (!record.rendered) return;
      const rect = record.node.getBoundingClientRect();
      if (!rect) return;
      const measured = rect.height;
      if (Number.isFinite(measured) && measured > 0) {
        record.height = measured;
        record.node.style.minHeight = `${measured}px`;
      }
    });
  }

  function applyContent(record, rendered, existingChild) {
    const content = normalizeContent(rendered);
    if (!content && existingChild) {
      // Caller mutated the existing child; nothing else to do.
      return existingChild;
    }
    if (!content) {
      record.node.replaceChildren();
      return null;
    }
    if (content === existingChild && record.node.childNodes.length === 1) {
      return existingChild;
    }
    record.node.replaceChildren(content);
    return content instanceof Node ? content : record.node.firstChild;
  }

  function renderRecord(record) {
    const existing = record.node.firstElementChild || record.node.firstChild || null;
    const rendered = render(record.item, record.index, existing);
    const child = applyContent(record, rendered, existing);
    record.rendered = Boolean(child);
    record.node.dataset.rendered = record.rendered ? 'true' : 'false';
    record.node.setAttribute('aria-hidden', record.rendered ? 'false' : 'true');
    if (record.rendered) {
      scheduleMeasurement(record);
    }
  }

  function mount(record) {
    if (!items[record.index]) {
      unmount(record);
      return;
    }
    renderRecord(record);
  }

  function unmount(record) {
    if (!record.rendered) return;
    const active = record.node.ownerDocument.activeElement;
    if (active && record.node.contains(active)) {
      return;
    }
    record.node.replaceChildren();
    record.rendered = false;
    record.node.dataset.rendered = 'false';
    record.node.setAttribute('aria-hidden', 'true');
    record.node.style.minHeight = `${record.height}px`;
  }

  function rebuildPlaceholders(normalized) {
    disconnectObservers();
    container.innerHTML = '';
    records = [];
    keys = [];
    items = normalized;
    if (!items.length) {
      return;
    }
    const fragment = document.createDocumentFragment();
    items.forEach((item, index) => {
      const node = container.ownerDocument.createElement(placeholderTagName);
      if (placeholderClassName) {
        node.className = placeholderClassName;
      }
      node.dataset.virtualIndex = String(index);
      node.dataset.rendered = 'false';
      node.setAttribute('aria-hidden', 'true');
      node.style.minHeight = `${estimateHeight}px`;
      fragment.appendChild(node);
      const recordKey = getKey(item, index);
      records.push({ node, item, index, key: recordKey, rendered: false, height: estimateHeight });
      keys.push(recordKey);
    });
    container.appendChild(fragment);
    observer = new IntersectionObserver(handleIntersect, {
      root: root || (container.scrollHeight > container.clientHeight ? container : null),
      rootMargin,
      threshold: 0
    });
    records.forEach((record) => observer.observe(record.node));
    ensureResizeObserver();
    if (!measurementScheduled && items.length >= MEASUREMENT_THRESHOLD) {
      measurementScheduled = true;
      schedulePerformanceProbe(`rendered ${items.length} items`);
    }
  }

  function refreshRendered() {
    records.forEach((record, index) => {
      record.item = items[index];
      record.index = index;
      record.key = keys[index];
      if (record.rendered) {
        renderRecord(record);
      }
    });
  }

  function setItems(nextItems) {
    const normalized = Array.isArray(nextItems) ? nextItems : [];
    if (!records.length || records.length !== normalized.length) {
      rebuildPlaceholders(normalized);
      return;
    }
    const nextKeys = normalized.map((item, index) => getKey(item, index));
    const sameOrder = nextKeys.length === keys.length && nextKeys.every((key, index) => key === keys[index]);
    if (!sameOrder) {
      rebuildPlaceholders(normalized);
      return;
    }
    items = normalized;
    keys = nextKeys;
    refreshRendered();
  }

  function clear() {
    disconnectObservers();
    container.innerHTML = '';
    items = [];
    records = [];
    keys = [];
  }

  function destroy() {
    clear();
  }

  function refresh() {
    refreshRendered();
  }

  return { setItems, refresh, clear, destroy };
}
