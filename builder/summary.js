const PLAY_STATE_KEY = 'dndPlayState';
const abilityFields = [
  { id: 'str', label: 'Strength', short: 'STR' },
  { id: 'dex', label: 'Dexterity', short: 'DEX' },
  { id: 'con', label: 'Constitution', short: 'CON' },
  { id: 'int', label: 'Intelligence', short: 'INT' },
  { id: 'wis', label: 'Wisdom', short: 'WIS' },
  { id: 'cha', label: 'Charisma', short: 'CHA' }
];

function getPackData() {
  return window.dndBuilderData || window.dndData || { classes: [], backgrounds: [], feats: [], items: [], companions: [] };
}

function formatHitDiceBreakdown(hitDice) {
  if (!hitDice) return '';
  const entries = Object.entries(hitDice.breakdown || {})
    .filter(([die, count]) => die && Number.isFinite(Number(count)) && Number(count) > 0)
    .map(([die, count]) => [die, Number(count)]);
  if (entries.length === 1) {
    const [die, count] = entries[0];
    return count === 1 ? die : `${die}×${count}`;
  }
  if (entries.length > 1) {
    return entries.map(([die, count]) => `${die}×${count}`).join(', ');
  }
  return '';
}

function resolveClassMeta(identifier) {
  const { classes = [] } = getPackData();
  return classes.find(entry => entry.slug === identifier || entry.id === identifier || entry.name === identifier) || null;
}

function loadPlayState() {
  try {
    const raw = localStorage.getItem(PLAY_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (error) {
    console.warn('Failed to parse play state', error);
    return null;
  }
}

function savePlayState(state) {
  try {
    localStorage.setItem(PLAY_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to persist play state', error);
  }
  window.dispatchEvent(new CustomEvent('dnd-playstate-updated', { detail: state }));
}

function formatModifier(score) {
  if (!Number.isFinite(score)) return '+0';
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function parseNumber(value, fallback = 0) {
  const parsed = typeof value === 'number' ? value : parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function createElement(tag, className, children) {
  const el = document.createElement(tag);
  if (className) {
    el.className = className;
  }
  if (children !== undefined) {
    if (Array.isArray(children)) {
      children.forEach(child => el.appendChild(child));
    } else if (children instanceof Node) {
      el.appendChild(children);
    } else {
      el.innerHTML = children;
    }
  }
  return el;
}

class SummaryUI {
  constructor(root) {
    this.root = root;
    this.builderState = null;
    this.playState = loadPlayState() || this.defaultPlayState();
    this.toastTimer = null;
    this.setupBaseLayout();
    this.attachListeners();
    this.render();
  }

  defaultPlayState() {
    return {
      hp: { current: 10, max: 10, temp: 0 },
      hitDice: { total: 1, available: 1, die: 'd8' },
      classCounters: [],
      wildShape: { max: 0, remaining: 0 },
      concentration: { active: false, spell: '', notes: '' },
      restLog: []
    };
  }

  attachListeners() {
    this.root.addEventListener('input', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.dataset.counterField) {
        this.updateCounterField(target.dataset.counterId, target.dataset.counterField, target.value);
        return;
      }
      const track = target.dataset.track;
      if (!track) return;
      const type = target.dataset.type || target.type;
      let value = target.value;
      if (type === 'number') {
        const parsed = parseFloat(value);
        value = Number.isFinite(parsed) ? parsed : 0;
      }
      this.updatePlayState(track, value);
    });

    this.root.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.dataset.counterField) {
        this.updateCounterField(target.dataset.counterId, target.dataset.counterField, target.value);
        return;
      }
      const track = target.dataset.track;
      if (!track) return;
      const type = target.dataset.type || target.getAttribute('type');
      let value = target.value;
      if (type === 'checkbox') {
        value = target.checked;
      } else if (type === 'number') {
        const parsed = parseFloat(value);
        value = Number.isFinite(parsed) ? parsed : 0;
      }
      this.updatePlayState(track, value);
    });

    this.root.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.dataset.summaryAction;
      if (action) {
        this.handleAction(action, target);
        return;
      }
      const counterAction = target.dataset.counterAction;
      if (counterAction) {
        const wrapper = target.closest('[data-counter-id]');
        if (!wrapper) return;
        const id = wrapper.dataset.counterId;
        this.handleCounterAction(counterAction, id);
        return;
      }
      const concentrationAction = target.dataset.concentrationAction;
      if (concentrationAction) {
        this.handleConcentrationAction(concentrationAction);
      }
    });
  }

  setBuilderState(state) {
    this.builderState = state;
    this.ensurePlayDefaults();
    this.render();
  }

  ensurePlayDefaults() {
    const level = this.getLevel();
    if (!Number.isFinite(this.playState.hp.max) || this.playState.hp.max <= 0) {
      this.playState.hp.max = Math.max(1, level * 5);
    }
    if (!Number.isFinite(this.playState.hp.current)) {
      this.playState.hp.current = this.playState.hp.max;
    }
    const derivedHitDice = this.builderState?.derived?.hitDice || this.builderState?.derived?.classes?.hitDice;
    const hitDiceLabel = formatHitDiceBreakdown(derivedHitDice);
    const derivedTotal = Number.parseInt(derivedHitDice?.total, 10);
    const nextTotal = Number.isFinite(derivedTotal) && derivedTotal > 0 ? derivedTotal : Math.max(1, level);
    if (!Number.isFinite(this.playState.hitDice.total) || this.playState.hitDice.total <= 0) {
      this.playState.hitDice.total = nextTotal;
    } else {
      this.playState.hitDice.total = Math.max(1, nextTotal);
    }
    if (!Number.isFinite(this.playState.hitDice.available)) {
      this.playState.hitDice.available = this.playState.hitDice.total;
    }
    this.playState.hitDice.available = Math.min(this.playState.hitDice.total, this.playState.hitDice.available);
    const classMeta = this.getPrimaryClassMeta();
    if (hitDiceLabel) {
      this.playState.hitDice.die = hitDiceLabel;
    } else if (classMeta && classMeta.hit_die) {
      this.playState.hitDice.die = classMeta.hit_die;
    }
    const isDruid = this.getDerivedClasses().some((entry) => (entry.slug || entry.id || entry.value || '').toLowerCase() === 'druid') ||
      (classMeta && classMeta.slug === 'druid') ||
      (this.builderState && /druid/i.test(this.builderState.data?.class || ''));
    if (isDruid) {
      if (!Number.isFinite(this.playState.wildShape.max) || this.playState.wildShape.max < 2) {
        this.playState.wildShape.max = 2;
      }
      if (!Number.isFinite(this.playState.wildShape.remaining)) {
        this.playState.wildShape.remaining = this.playState.wildShape.max;
      }
    } else {
      this.playState.wildShape.max = 0;
      this.playState.wildShape.remaining = 0;
    }
    if (!Array.isArray(this.playState.classCounters)) {
      this.playState.classCounters = [];
    }
    savePlayState(this.playState);
  }

  updatePlayState(path, value) {
    const segments = path.split('.');
    let target = this.playState;
    while (segments.length > 1) {
      const key = segments.shift();
      if (!(key in target) || typeof target[key] !== 'object' || target[key] === null) {
        target[key] = {};
      }
      target = target[key];
    }
    const finalKey = segments.shift();
    if (finalKey) {
      target[finalKey] = value;
    }
    if (path === 'concentration.active' && value === false) {
      this.playState.concentration.spell = '';
    }
    if (path.startsWith('hitDice.')) {
      this.playState.hitDice.available = Math.min(this.playState.hitDice.total, Math.max(0, this.playState.hitDice.available));
    }
    if (path === 'hp.max') {
      this.playState.hp.max = Math.max(1, this.playState.hp.max);
      this.playState.hp.current = Math.min(this.playState.hp.max, this.playState.hp.current);
    }
    if (path === 'hp.current') {
      this.playState.hp.current = Math.max(0, Math.min(this.playState.hp.max, this.playState.hp.current));
    }
    if (path === 'hp.temp') {
      this.playState.hp.temp = Math.max(0, this.playState.hp.temp);
    }
    if (path.startsWith('wildShape.')) {
      this.playState.wildShape.max = Math.max(0, this.playState.wildShape.max);
      this.playState.wildShape.remaining = Math.max(0, Math.min(this.playState.wildShape.max, this.playState.wildShape.remaining));
    }
    savePlayState(this.playState);
    this.render();
  }

  updateCounterField(id, field, value) {
    const counter = this.playState.classCounters.find(item => item.id === id);
    if (!counter) return;
    if (field === 'current' || field === 'max') {
      const parsed = parseFloat(value);
      counter[field] = Number.isFinite(parsed) ? Math.round(parsed) : counter[field];
      if (field === 'current') {
        counter.current = Math.min(counter.max, Math.max(0, counter.current));
      }
      if (field === 'max') {
        counter.max = Math.max(1, counter.max);
        counter.current = Math.min(counter.max, counter.current);
      }
    } else if (field === 'reset') {
      counter.reset = ['short', 'long', 'either', 'none'].includes(value) ? value : counter.reset;
    }
    savePlayState(this.playState);
    this.render();
  }

  getLevel() {
    if (!this.builderState) return parseNumber(this.playState.levelOverride, 1);
    const derivedLevel = Number.parseInt(this.builderState?.derived?.classes?.totalLevel, 10);
    if (Number.isFinite(derivedLevel) && derivedLevel > 0) {
      return derivedLevel;
    }
    const level = parseNumber(this.builderState.data?.level, 1);
    return level > 0 ? level : 1;
  }

  getDerivedClasses() {
    const entries = this.builderState?.derived?.classes?.entries;
    if (Array.isArray(entries) && entries.length) {
      return entries.filter((entry) => Number.isFinite(entry.level) ? entry.level > 0 : parseNumber(entry.level, 0) > 0);
    }
    const fallbackClass = this.builderState?.data?.class;
    if (fallbackClass) {
      return [{ value: fallbackClass, name: fallbackClass, level: parseNumber(this.builderState?.data?.level, 1) }];
    }
    return [];
  }

  getPrimaryClassEntry() {
    const [first] = this.getDerivedClasses();
    return first || null;
  }

  getPrimaryClassMeta() {
    const primary = this.getPrimaryClassEntry();
    if (!primary) return null;
    const identifier = primary.slug || primary.id || primary.value || primary.name;
    if (!identifier) return null;
    return resolveClassMeta(identifier) || null;
  }

  getProficiencyBonus() {
    const derived = Number.parseInt(this.builderState?.derived?.proficiencyBonus, 10);
    if (Number.isFinite(derived) && derived > 0) {
      return derived;
    }
    const level = this.getLevel();
    return Math.max(2, Math.floor((level - 1) / 4) + 2);
  }

  handleAction(action, target) {
    if (action === 'short-rest') {
      this.performRest('short');
    }
    if (action === 'long-rest') {
      this.performRest('long');
    }
    if (action === 'print') {
      if (typeof window.persistBuilderState === 'function') {
        window.persistBuilderState();
      }
      window.open('/builder/sheet.html', '_blank', 'noopener');
    }
    if (action === 'add-counter') {
      this.promptNewCounter();
    }
    if (action === 'remove-counter') {
      const id = target?.dataset?.counterId;
      if (id) {
        this.playState.classCounters = this.playState.classCounters.filter(counter => counter.id !== id);
        savePlayState(this.playState);
        this.render();
      }
    }
  }

  handleCounterAction(action, id) {
    const counter = this.playState.classCounters.find(item => item.id === id);
    if (!counter) return;
    if (action === 'increment') {
      counter.current = Math.min(counter.max, counter.current + 1);
    }
    if (action === 'decrement') {
      counter.current = Math.max(0, counter.current - 1);
    }
    if (action === 'reset') {
      counter.current = counter.max;
    }
    savePlayState(this.playState);
    this.render();
  }

  handleConcentrationAction(action) {
    if (action === 'start') {
      if (!this.playState.concentration.spell) {
        const spell = prompt('What spell are you concentrating on?');
        if (!spell) return;
        this.playState.concentration.spell = spell;
      }
      this.playState.concentration.active = true;
      this.playState.concentration.startedAt = Date.now();
    }
    if (action === 'end') {
      this.playState.concentration.active = false;
      this.playState.concentration.spell = '';
      this.playState.concentration.startedAt = null;
    }
    if (action === 'prompt') {
      const spell = this.playState.concentration.spell || 'your spell';
      alert(`Make a Constitution saving throw to maintain concentration on ${spell}.`);
    }
    savePlayState(this.playState);
    this.render();
  }

  promptNewCounter() {
    const name = prompt('Feature or resource name?');
    if (!name) return;
    const maxInput = prompt('How many uses does it have?');
    const max = parseNumber(maxInput, 1);
    const reset = (prompt('Reset on short, long, or none rest? (short/long/none)', 'short') || 'short').toLowerCase();
    const counter = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      max: Math.max(1, max),
      current: Math.max(1, max),
      reset: ['short', 'long', 'none'].includes(reset) ? reset : 'short'
    };
    this.playState.classCounters.push(counter);
    savePlayState(this.playState);
    this.render();
  }

  performRest(type) {
    const level = this.getLevel();
    const now = new Date();
    const logEntry = { type, at: now.toISOString() };
    if (type === 'short') {
      const spendInput = prompt('How many hit dice did you spend during this short rest?', '0');
      const spend = Math.max(0, Math.min(this.playState.hitDice.available, parseNumber(spendInput, 0)));
      this.playState.hitDice.available = Math.max(0, this.playState.hitDice.available - spend);
      if (this.playState.wildShape.max > 0) {
        this.playState.wildShape.remaining = this.playState.wildShape.max;
      }
      this.resetCounters('short');
      this.toast('Short rest complete. Update hit dice and reset features.');
    }
    if (type === 'long') {
      this.playState.hp.current = this.playState.hp.max;
      const recovery = Math.max(1, Math.floor(this.playState.hitDice.total / 2));
      this.playState.hitDice.available = Math.min(this.playState.hitDice.total, this.playState.hitDice.available + recovery);
      if (this.playState.wildShape.max > 0) {
        this.playState.wildShape.remaining = this.playState.wildShape.max;
      }
      this.resetCounters('long');
      if (this.playState.concentration.active) {
        if (confirm('End concentration due to completing a long rest?')) {
          this.playState.concentration.active = false;
          this.playState.concentration.spell = '';
        }
      }
      this.toast('Long rest complete. Fully restore hit points and resources.');
    }
    this.playState.restLog.unshift(logEntry);
    this.playState.restLog = this.playState.restLog.slice(0, 10);
    savePlayState(this.playState);
    this.render();
  }

  resetCounters(restType) {
    this.playState.classCounters = this.playState.classCounters.map(counter => {
      const shouldReset = counter.reset === restType || counter.reset === 'either' || (restType === 'long' && counter.reset === 'short');
      return shouldReset ? { ...counter, current: counter.max } : counter;
    });
  }

  toast(message) {
    const node = this.root.querySelector('[data-summary-toast]');
    if (!node) return;
    node.textContent = message;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      node.textContent = '';
    }, 5000);
  }

  render() {
    if (!this.root) return;
    const identity = this.root.querySelector('[data-summary-identity]');
    if (identity) {
      identity.innerHTML = this.getIdentityMarkup();
    }
    this.renderAbilities();
    this.renderResources();
    this.renderCounters();
    this.renderConcentration();
    this.renderRestLog();
  }

  setupBaseLayout() {
    if (!this.root) return;
    this.root.classList.remove('summary-empty');
    this.root.innerHTML = '';

    const header = createElement('div', 'summary-header');
    header.innerHTML = `
      <div data-summary-identity class="summary-identity"></div>
      <div class="summary-actions">
        <button type="button" data-summary-action="short-rest">Short rest</button>
        <button type="button" data-summary-action="long-rest">Long rest</button>
        <button type="button" data-summary-action="print" class="primary">Print</button>
      </div>
    `;

    const accordion = createElement('div', 'summary-accordion');
    accordion.innerHTML = `
      <details open>
        <summary>Ability Scores</summary>
        <div class="section-body" data-summary-section="abilities"></div>
      </details>
      <details open>
        <summary>Resources</summary>
        <div class="section-body" data-summary-section="resources"></div>
      </details>
      <details>
        <summary>Class Trackers</summary>
        <div class="section-body" data-summary-section="counters"></div>
      </details>
      <details>
        <summary>Concentration</summary>
        <div class="section-body" data-summary-section="concentration"></div>
      </details>
      <details>
        <summary>Rest Activity</summary>
        <div class="section-body" data-summary-section="rest-log"></div>
      </details>
    `;

    const toast = createElement('div', 'summary-toast');
    toast.dataset.summaryToast = '';

    this.root.appendChild(header);
    this.root.appendChild(accordion);
    this.root.appendChild(toast);
  }

  getIdentityMarkup() {
    const name = this.builderState?.data?.name || 'Unnamed adventurer';
    const classes = this.getDerivedClasses();
    const subclass = this.builderState?.data?.subclass;
    const level = this.getLevel();
    const classSummary = (() => {
      if (!classes.length) {
        const fallback = this.builderState?.data?.class || 'Classless';
        return `Level ${level} ${fallback}`;
      }
      const parts = classes
        .filter((entry) => (Number.isFinite(entry.level) ? entry.level > 0 : parseNumber(entry.level, 0) > 0))
        .map((entry) => `${entry.name || entry.slug || entry.value || 'Class'} ${entry.level}`);
      if (!parts.length) {
        const primary = classes[0];
        return `Level ${level} ${primary.name || primary.slug || primary.value || 'Class'}`;
      }
      return `Level ${level} ${parts.join(' / ')}`;
    })();
    const background = this.builderState?.data?.background;
    const alignment = this.builderState?.data?.alignment;
    const subtitle = [
      classSummary,
      subclass ? subclass : null,
      background ? `Background: ${background}` : null,
      alignment ? `Alignment: ${alignment}` : null
    ].filter(Boolean).join(' · ');
    return `
      <h3>${name}</h3>
      <p>${subtitle || 'Fill out the builder to customize this summary.'}</p>
    `;
  }

  renderAbilities() {
    const container = this.root.querySelector('[data-summary-section="abilities"]');
    if (!container) return;
    container.innerHTML = '';
    const proficiency = this.getProficiencyBonus();
    const classMeta = this.getPrimaryClassMeta();
    const proficientSaves = new Set((classMeta && classMeta.saving_throws) || []);
    const abilityNameMap = {
      str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma'
    };
    const grid = createElement('div', 'abilities-grid');
    abilityFields.forEach(field => {
      const rawScore = parseNumber(this.builderState?.data?.[field.id], 10);
      const score = Number.isFinite(rawScore) ? rawScore : 10;
      const mod = formatModifier(score);
      const saveProf = proficientSaves.has(abilityNameMap[field.id]);
      const saveBonus = saveProf ? formatModifier(score + proficiency) : mod;
      const saveLabel = saveProf ? `${saveBonus} (prof)` : saveBonus;
      const card = createElement('div', 'ability-card');
      card.innerHTML = `
        <header><span>${field.short}</span><span>${abilityNameMap[field.id]}</span></header>
        <strong>${score}</strong>
        <span class="modifier">Modifier: ${mod}</span>
        <span>Save: ${saveLabel}</span>
      `;
      grid.appendChild(card);
    });
    container.appendChild(grid);
  }

  renderResources() {
    const container = this.root.querySelector('[data-summary-section="resources"]');
    if (!container) return;
    container.innerHTML = '';

    const resourceGrid = createElement('div', 'resource-grid');
    const hpCard = createElement('div', 'resource-card');
    hpCard.innerHTML = `
      <h4>Hit Points</h4>
      <label>Current <input type="number" data-type="number" data-track="hp.current" value="${this.playState.hp.current}" min="0"></label>
      <label>Maximum <input type="number" data-type="number" data-track="hp.max" value="${this.playState.hp.max}" min="1"></label>
      <label>Temporary <input type="number" data-type="number" data-track="hp.temp" value="${this.playState.hp.temp || 0}" min="0"></label>
    `;
    resourceGrid.appendChild(hpCard);

    const hitDiceCard = createElement('div', 'resource-card');
    hitDiceCard.innerHTML = `
      <h4>Hit Dice</h4>
      <label>Available <input type="number" data-type="number" data-track="hitDice.available" value="${this.playState.hitDice.available}" min="0"></label>
      <label>Total <input type="number" data-type="number" data-track="hitDice.total" value="${this.playState.hitDice.total}" min="1"></label>
      <label>Die Size <input type="text" data-track="hitDice.die" value="${this.playState.hitDice.die || ''}" placeholder="d8"></label>
    `;
    resourceGrid.appendChild(hitDiceCard);

    if (this.playState.wildShape.max > 0) {
      const wildShapeCard = createElement('div', 'resource-card');
      wildShapeCard.innerHTML = `
        <h4>Wild Shape</h4>
        <label>Remaining <input type="number" data-type="number" data-track="wildShape.remaining" value="${this.playState.wildShape.remaining}" min="0"></label>
        <label>Maximum <input type="number" data-type="number" data-track="wildShape.max" value="${this.playState.wildShape.max}" min="0"></label>
      `;
      resourceGrid.appendChild(wildShapeCard);
    }

    container.appendChild(resourceGrid);
  }

  renderCounters() {
    const container = this.root.querySelector('[data-summary-section="counters"]');
    if (!container) return;
    container.innerHTML = '';

    const button = createElement('button', null, 'Add tracker');
    button.type = 'button';
    button.dataset.summaryAction = 'add-counter';
    container.appendChild(button);

    if (!this.playState.classCounters.length) {
      const empty = createElement('p', 'summary-empty', 'No class trackers yet. Add one to monitor limited-use features.');
      container.appendChild(empty);
      return;
    }

    const list = createElement('div', 'counter-list');
    this.playState.classCounters.forEach(counter => {
      const item = createElement('div', 'counter-item');
      item.dataset.counterId = counter.id;
      item.innerHTML = `
        <header>
          <span>${counter.name}</span>
          <button type="button" data-summary-action="remove-counter" data-counter-id="${counter.id}">Remove</button>
        </header>
        <div class="counter-controls">
          <button type="button" data-counter-action="decrement">-</button>
          <input type="number" data-type="number" data-counter-id="${counter.id}" data-counter-field="current" value="${counter.current}" min="0">
          <span>/</span>
          <input type="number" data-type="number" data-counter-id="${counter.id}" data-counter-field="max" value="${counter.max}" min="1">
          <select data-counter-id="${counter.id}" data-counter-field="reset">
            <option value="short" ${counter.reset === 'short' ? 'selected' : ''}>Short Rest</option>
            <option value="long" ${counter.reset === 'long' ? 'selected' : ''}>Long Rest</option>
            <option value="either" ${counter.reset === 'either' ? 'selected' : ''}>Any Rest</option>
            <option value="none" ${counter.reset === 'none' ? 'selected' : ''}>Manual</option>
          </select>
          <button type="button" data-counter-action="increment">+</button>
          <button type="button" data-counter-action="reset">Reset</button>
        </div>
      `;
      list.appendChild(item);
    });
    container.appendChild(list);
  }

  renderConcentration() {
    const container = this.root.querySelector('[data-summary-section="concentration"]');
    if (!container) return;
    container.innerHTML = '';

    const { concentration } = this.playState;
    const banner = createElement('div', 'summary-banner');
    if (concentration.active) {
      banner.innerHTML = `
        <strong>Concentrating on ${concentration.spell || 'a spell'}</strong>
        <span>Remember to make a Constitution save when you take damage.</span>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button type="button" data-concentration-action="prompt">Prompt check</button>
          <button type="button" data-concentration-action="end">End concentration</button>
        </div>
      `;
    } else {
      banner.innerHTML = `
        <strong>No active concentration spell</strong>
        <span>Start concentration to track reminders for saving throws.</span>
        <button type="button" data-concentration-action="start">Start concentration</button>
      `;
    }

    const form = createElement('div', 'resource-card');
    form.innerHTML = `
      <h4>Spell Tracking</h4>
      <label>Spell name <input type="text" data-track="concentration.spell" value="${concentration.spell || ''}" placeholder="Bless"></label>
      <label>Notes <input type="text" data-track="concentration.notes" value="${concentration.notes || ''}" placeholder="DC, bonus, etc."></label>
      <label style="justify-content:flex-start;gap:0.6rem;">Active <input type="checkbox" data-type="checkbox" data-track="concentration.active" ${concentration.active ? 'checked' : ''}></label>
    `;

    container.appendChild(banner);
    container.appendChild(form);
  }

  renderRestLog() {
    const container = this.root.querySelector('[data-summary-section="rest-log"]');
    if (!container) return;
    container.innerHTML = '';
    if (!this.playState.restLog.length) {
      const empty = createElement('p', 'summary-empty', 'Rests will be logged here for quick reference.');
      container.appendChild(empty);
      return;
    }
    const list = createElement('ul');
    list.style.listStyle = 'none';
    list.style.padding = '0';
    list.style.margin = '0';
    this.playState.restLog.forEach(entry => {
      const item = document.createElement('li');
      const date = new Date(entry.at);
      const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' });
      item.textContent = `${entry.type === 'long' ? 'Long Rest' : 'Short Rest'} · ${formatter.format(date)}`;
      item.style.padding = '0.35rem 0';
      item.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
      list.appendChild(item);
    });
    container.appendChild(list);
  }
}

function initSummary() {
  const root = document.getElementById('summary-root');
  if (!root) return;
  const summary = new SummaryUI(root);

  window.addEventListener('dnd-builder-updated', (event) => {
    summary.setBuilderState(event.detail);
  });

  if (window.dndBuilderState) {
    summary.setBuilderState(window.dndBuilderState);
  }

  window.persistBuilderState = () => {
    if (window.dndBuilderState && window.dndBuilderState.data) {
      try {
        localStorage.setItem('dndBuilderState', JSON.stringify(window.dndBuilderState));
      } catch (error) {
        console.warn('Unable to persist builder state on demand', error);
      }
    }
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSummary);
} else {
  initSummary();
}
