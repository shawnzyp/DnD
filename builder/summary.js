const PLAY_STATE_KEY = 'dndPlayState';
const abilityFields = [
  { id: 'str', label: 'Strength', short: 'STR' },
  { id: 'dex', label: 'Dexterity', short: 'DEX' },
  { id: 'con', label: 'Constitution', short: 'CON' },
  { id: 'int', label: 'Intelligence', short: 'INT' },
  { id: 'wis', label: 'Wisdom', short: 'WIS' },
  { id: 'cha', label: 'Charisma', short: 'CHA' }
];

const skillDefinitions = [
  { id: 'acrobatics', label: 'Acrobatics', ability: 'dex' },
  { id: 'animalHandling', label: 'Animal Handling', ability: 'wis' },
  { id: 'arcana', label: 'Arcana', ability: 'int' },
  { id: 'athletics', label: 'Athletics', ability: 'str' },
  { id: 'deception', label: 'Deception', ability: 'cha' },
  { id: 'history', label: 'History', ability: 'int' },
  { id: 'insight', label: 'Insight', ability: 'wis' },
  { id: 'intimidation', label: 'Intimidation', ability: 'cha' },
  { id: 'investigation', label: 'Investigation', ability: 'int' },
  { id: 'medicine', label: 'Medicine', ability: 'wis' },
  { id: 'nature', label: 'Nature', ability: 'int' },
  { id: 'perception', label: 'Perception', ability: 'wis' },
  { id: 'performance', label: 'Performance', ability: 'cha' },
  { id: 'persuasion', label: 'Persuasion', ability: 'cha' },
  { id: 'religion', label: 'Religion', ability: 'int' },
  { id: 'sleightOfHand', label: 'Sleight of Hand', ability: 'dex' },
  { id: 'stealth', label: 'Stealth', ability: 'dex' },
  { id: 'survival', label: 'Survival', ability: 'wis' }
];

const passiveDefinitions = [
  { id: 'perception', label: 'Passive Perception', skill: 'perception' },
  { id: 'insight', label: 'Passive Insight', skill: 'insight' },
  { id: 'investigation', label: 'Passive Investigation', skill: 'investigation' }
];

const conditionDefinitions = [
  { id: 'blinded', label: 'Blinded', affects: ['Attack rolls have disadvantage', 'Opponents have advantage to hit you', 'Perception checks fail automatically'] },
  { id: 'charmed', label: 'Charmed', affects: ['Cannot attack charmer', 'Charmer has advantage on social checks against you'] },
  { id: 'deafened', label: 'Deafened', affects: ['Automatically fail checks relying on hearing'] },
  { id: 'frightened', label: 'Frightened', affects: ['Disadvantage on ability checks and attack rolls while source is in sight', 'Cannot willingly move closer to source'] },
  { id: 'grappled', label: 'Grappled', affects: ['Speed becomes 0'] },
  { id: 'incapacitated', label: 'Incapacitated', affects: ['Cannot take actions or reactions'] },
  { id: 'invisible', label: 'Invisible', affects: ['Attack rolls against you have disadvantage', 'Your attack rolls have advantage'] },
  { id: 'paralyzed', label: 'Paralyzed', affects: ['Automatically fail Str/Dex saves', 'Attack rolls against you have advantage', 'Auto crit within 5 feet'] },
  { id: 'petrified', label: 'Petrified', affects: ['Resistant to all damage', 'Cannot move or speak', 'Fail Str/Dex saves'] },
  { id: 'poisoned', label: 'Poisoned', affects: ['Disadvantage on attack rolls and ability checks'] },
  { id: 'prone', label: 'Prone', affects: ['Melee attacks within 5 ft gain advantage', 'Ranged attacks have disadvantage', 'Movement crawling only'] },
  { id: 'restrained', label: 'Restrained', affects: ['Speed 0', 'Attack rolls have disadvantage', 'Dexterity saves have disadvantage'] },
  { id: 'stunned', label: 'Stunned', affects: ['Incapacitated', 'Attack rolls against you have advantage'] },
  { id: 'unconscious', label: 'Unconscious', affects: ['Incapacitated', 'Drop prone', 'Automatically fail Str/Dex saves', 'Attack rolls have advantage'] }
];

const quickDiceExpressions = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

const SPELLCASTING_CLASSES = new Set(['bard', 'cleric', 'druid', 'sorcerer', 'warlock', 'wizard', 'paladin', 'ranger']);

const skillNameIndex = skillDefinitions.reduce((map, skill) => {
  map[skill.label.toLowerCase()] = skill.id;
  map[skill.id] = skill.id;
  return map;
}, {});

function getPackData() {
  return window.dndBuilderData || window.dndData || { classes: [], backgrounds: [], feats: [], items: [], companions: [] };
}

function resolveClassMeta(identifier) {
  const { classes = [] } = getPackData();
  return classes.find(entry => entry.slug === identifier || entry.id === identifier || entry.name === identifier) || null;
}

function resolveBackgroundMeta(identifier) {
  const { backgrounds = [] } = getPackData();
  const target = identifier ? String(identifier).toLowerCase() : '';
  return backgrounds.find(entry => {
    const slug = entry.slug ? String(entry.slug).toLowerCase() : '';
    const id = entry.id ? String(entry.id).toLowerCase() : '';
    const name = entry.name ? String(entry.name).toLowerCase() : '';
    return target && (slug === target || id === target || name === target);
  }) || null;
}

function resolveRaceMeta(identifier) {
  const { races = [] } = getPackData();
  const target = identifier ? String(identifier).toLowerCase() : '';
  return races.find(entry => {
    const slug = entry.slug ? String(entry.slug).toLowerCase() : '';
    const id = entry.id ? String(entry.id).toLowerCase() : '';
    const name = entry.name ? String(entry.name).toLowerCase() : '';
    return target && (slug === target || id === target || name === target || entry.name === identifier);
  }) || null;
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

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  if (Number.isFinite(min) && value < min) return min;
  if (Number.isFinite(max) && value > max) return max;
  return value;
}

function createDefaultSpellSlots() {
  const slots = {};
  for (let level = 1; level <= 9; level += 1) {
    slots[level] = { max: 0, remaining: 0 };
  }
  return slots;
}

function formatBonus(value) {
  if (!Number.isFinite(value)) return '+0';
  return value >= 0 ? `+${value}` : `${value}`;
}

function escapeHtml(value) {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseList(value) {
  if (typeof value !== 'string') return [];
  return value
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(Boolean);
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
      concentration: { active: false, spell: '', notes: '', lastDamage: 0, lastDC: 10, warCaster: false },
      restLog: [],
      skills: {},
      passives: { perception: 0, insight: 0, investigation: 0 },
      currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
      spellcasting: { prepared: '', known: '', notes: '', slots: createDefaultSpellSlots() },
      diceLog: [],
      attackHelper: { ac: 12, attackBonus: 5, advantage: 'normal', type: 'melee', targetProne: false },
      conditions: {},
      deathSaves: { success: 0, failure: 0 },
      exploration: { customSenses: '', customLanguages: '', notes: '' },
      inventory: { notes: '' }
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
      const slotAction = target.dataset.slotAction;
      if (slotAction) {
        const levelWrapper = target.closest('[data-slot-level]');
        if (!levelWrapper) return;
        const level = levelWrapper.dataset.slotLevel;
        this.handleSlotAction(level, slotAction);
        return;
      }
      const concentrationAction = target.dataset.concentrationAction;
      if (concentrationAction) {
        this.handleConcentrationAction(concentrationAction);
        return;
      }
      if (target.dataset.roller) {
        this.handleDiceRoll(target.dataset.roller);
        return;
      }
      const deathAction = target.dataset.deathAction;
      if (deathAction) {
        this.handleDeathAction(deathAction, target.dataset.deathType, target.dataset.deathIndex);
        return;
      }
      const conditionId = target.dataset.conditionId;
      if (conditionId) {
        this.toggleCondition(conditionId);
        return;
      }
      const attackAction = target.dataset.attackAction;
      if (attackAction === 'reset') {
        this.resetAttackHelper();
      }
    });

    this.root.addEventListener('submit', (event) => {
      if (!(event.target instanceof HTMLFormElement)) return;
      if (event.target.dataset.rollerForm === 'true') {
        event.preventDefault();
        const input = event.target.querySelector('input[name="diceExpression"]');
        if (input) {
          this.handleDiceRoll(input.value);
        }
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
    if (!Number.isFinite(this.playState.hitDice.total) || this.playState.hitDice.total <= 0) {
      this.playState.hitDice.total = Math.max(1, level);
    }
    if (!Number.isFinite(this.playState.hitDice.available)) {
      this.playState.hitDice.available = this.playState.hitDice.total;
    }
    this.playState.hitDice.available = Math.min(this.playState.hitDice.total, this.playState.hitDice.available);
    const classMeta = this.getClassMeta();
    if (classMeta && classMeta.hit_die) {
      this.playState.hitDice.die = classMeta.hit_die;
    }
    const isDruid = (classMeta && classMeta.slug === 'druid') || (this.builderState && /druid/i.test(this.builderState.data?.class || ''));
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
    if (!this.playState.skills || typeof this.playState.skills !== 'object') {
      this.playState.skills = {};
    }
    const backgroundDefaults = this.getBackgroundSkillDefaults();
    skillDefinitions.forEach((skill) => {
      if (!this.playState.skills[skill.id] || typeof this.playState.skills[skill.id] !== 'object') {
        this.playState.skills[skill.id] = { proficient: backgroundDefaults.has(skill.id), expertise: false };
      } else {
        this.playState.skills[skill.id].proficient = Boolean(this.playState.skills[skill.id].proficient || backgroundDefaults.has(skill.id));
        this.playState.skills[skill.id].expertise = Boolean(this.playState.skills[skill.id].expertise) && Boolean(this.playState.skills[skill.id].proficient);
      }
    });
    if (!this.playState.passives || typeof this.playState.passives !== 'object') {
      this.playState.passives = { perception: 0, insight: 0, investigation: 0 };
    } else {
      passiveDefinitions.forEach(({ id }) => {
        const value = parseNumber(this.playState.passives[id], 0);
        this.playState.passives[id] = Number.isFinite(value) ? value : 0;
      });
    }
    if (!this.playState.currency || typeof this.playState.currency !== 'object') {
      this.playState.currency = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
    } else {
      ['cp', 'sp', 'ep', 'gp', 'pp'].forEach((coin) => {
        const value = parseNumber(this.playState.currency[coin], 0);
        this.playState.currency[coin] = Number.isFinite(value) ? value : 0;
      });
    }
    if (!this.playState.spellcasting || typeof this.playState.spellcasting !== 'object') {
      this.playState.spellcasting = { prepared: '', known: '', notes: '', slots: createDefaultSpellSlots() };
    }
    if (!this.playState.spellcasting.slots || typeof this.playState.spellcasting.slots !== 'object') {
      this.playState.spellcasting.slots = createDefaultSpellSlots();
    }
    for (let levelIndex = 1; levelIndex <= 9; levelIndex += 1) {
      if (!this.playState.spellcasting.slots[levelIndex]) {
        this.playState.spellcasting.slots[levelIndex] = { max: 0, remaining: 0 };
      } else {
        const slot = this.playState.spellcasting.slots[levelIndex];
        const max = clamp(parseNumber(slot.max, 0), 0, 99);
        const remaining = clamp(parseNumber(slot.remaining, 0), 0, max);
        this.playState.spellcasting.slots[levelIndex] = { max, remaining };
      }
    }
    if (!Array.isArray(this.playState.diceLog)) {
      this.playState.diceLog = [];
    }
    if (!this.playState.attackHelper || typeof this.playState.attackHelper !== 'object') {
      this.playState.attackHelper = { ac: 12, attackBonus: 5, advantage: 'normal', type: 'melee', targetProne: false };
    } else {
      const helper = this.playState.attackHelper;
      helper.ac = clamp(parseNumber(helper.ac, 10), 1, 30);
      helper.attackBonus = parseNumber(helper.attackBonus, 0);
      helper.advantage = ['normal', 'advantage', 'disadvantage'].includes(helper.advantage) ? helper.advantage : 'normal';
      helper.type = helper.type === 'ranged' ? 'ranged' : 'melee';
      helper.targetProne = Boolean(helper.targetProne);
    }
    if (!this.playState.conditions || typeof this.playState.conditions !== 'object') {
      this.playState.conditions = {};
    }
    conditionDefinitions.forEach((condition) => {
      if (typeof this.playState.conditions[condition.id] !== 'boolean') {
        this.playState.conditions[condition.id] = false;
      }
    });
    if (!this.playState.deathSaves || typeof this.playState.deathSaves !== 'object') {
      this.playState.deathSaves = { success: 0, failure: 0 };
    } else {
      this.playState.deathSaves.success = clamp(parseNumber(this.playState.deathSaves.success, 0), 0, 3);
      this.playState.deathSaves.failure = clamp(parseNumber(this.playState.deathSaves.failure, 0), 0, 3);
    }
    if (!this.playState.exploration || typeof this.playState.exploration !== 'object') {
      this.playState.exploration = { customSenses: '', customLanguages: '', notes: '' };
    }
    if (!this.playState.inventory || typeof this.playState.inventory !== 'object') {
      this.playState.inventory = { notes: '' };
    }
    if (!this.playState.concentration || typeof this.playState.concentration !== 'object') {
      this.playState.concentration = { active: false, spell: '', notes: '', lastDamage: 0, lastDC: 10, warCaster: false };
    } else {
      const concentration = this.playState.concentration;
      concentration.lastDamage = clamp(parseNumber(concentration.lastDamage, 0), 0, 999);
      concentration.lastDC = clamp(parseNumber(concentration.lastDC, 10), 1, 999);
      concentration.warCaster = Boolean(concentration.warCaster);
      if (typeof concentration.notes !== 'string') concentration.notes = '';
      if (typeof concentration.spell !== 'string') concentration.spell = '';
      concentration.active = Boolean(concentration.active);
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
    if (path.includes('.expertise')) {
      const skillId = path.split('.')[1];
      const skillState = this.getSkillState(skillId);
      if (skillState.expertise && !skillState.proficient) {
        skillState.expertise = false;
      }
    }
    if (path.startsWith('spellcasting.slots.')) {
      const parts = path.split('.');
      const level = parts[2];
      const slot = this.playState.spellcasting?.slots?.[level];
      if (slot) {
        slot.max = clamp(parseNumber(slot.max, 0), 0, 99);
        slot.remaining = clamp(parseNumber(slot.remaining, 0), 0, slot.max);
      }
    }
    if (path.startsWith('attackHelper.')) {
      this.playState.attackHelper.ac = clamp(parseNumber(this.playState.attackHelper.ac, 10), 1, 40);
      this.playState.attackHelper.attackBonus = parseNumber(this.playState.attackHelper.attackBonus, 0);
      this.playState.attackHelper.advantage = ['normal', 'advantage', 'disadvantage'].includes(this.playState.attackHelper.advantage) ? this.playState.attackHelper.advantage : 'normal';
      this.playState.attackHelper.type = this.playState.attackHelper.type === 'ranged' ? 'ranged' : 'melee';
      this.playState.attackHelper.targetProne = Boolean(this.playState.attackHelper.targetProne);
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
    const level = parseNumber(this.builderState.data?.level, 1);
    return level > 0 ? level : 1;
  }

  getClassMeta() {
    if (!this.builderState) return null;
    const cls = this.builderState.data?.class;
    if (!cls) return null;
    return resolveClassMeta(cls);
  }

  getRaceMeta() {
    if (!this.builderState) return null;
    const race = this.builderState.data?.race;
    if (!race) return null;
    return resolveRaceMeta(race);
  }

  getBackgroundSkillDefaults() {
    const defaults = new Set();
    if (!this.builderState) return defaults;
    const backgroundId = this.builderState.data?.background;
    if (!backgroundId) return defaults;
    const meta = resolveBackgroundMeta(backgroundId);
    if (meta && Array.isArray(meta.skills)) {
      meta.skills.forEach((skillName) => {
        const id = skillName ? skillNameIndex[String(skillName).toLowerCase()] : null;
        if (id) {
          defaults.add(id);
        }
      });
    }
    return defaults;
  }

  getProficiencyBonus() {
    const level = this.getLevel();
    return Math.max(2, Math.floor((level - 1) / 4) + 2);
  }

  isSpellcaster() {
    const cls = this.builderState?.data?.class;
    if (!cls) return false;
    const meta = this.getClassMeta();
    if (meta && meta.slug && SPELLCASTING_CLASSES.has(meta.slug)) {
      return true;
    }
    const normalized = String(cls).toLowerCase();
    return SPELLCASTING_CLASSES.has(normalized);
  }

  getAbilityInfo(id) {
    const derived = this.builderState?.derived?.abilities?.[id];
    if (derived) {
      return { total: derived.total ?? derived.base ?? 10 };
    }
    const baseValue = parseNumber(this.builderState?.data?.[id], 10);
    return { total: Number.isFinite(baseValue) ? baseValue : 10 };
  }

  getAbilityTotal(id) {
    const info = this.getAbilityInfo(id);
    return Number.isFinite(info.total) ? info.total : 10;
  }

  getAbilityModifier(id) {
    const total = this.getAbilityTotal(id);
    return Math.floor((total - 10) / 2);
  }

  getSkillState(id) {
    if (!this.playState.skills || typeof this.playState.skills !== 'object') {
      this.playState.skills = {};
    }
    if (!this.playState.skills[id]) {
      this.playState.skills[id] = { proficient: false, expertise: false };
    }
    return this.playState.skills[id];
  }

  getSkillBonus(id) {
    const skill = skillDefinitions.find(entry => entry.id === id);
    if (!skill) return 0;
    const abilityMod = this.getAbilityModifier(skill.ability);
    const state = this.getSkillState(id);
    const proficiency = state.expertise ? this.getProficiencyBonus() * 2 : state.proficient ? this.getProficiencyBonus() : 0;
    const misc = parseNumber(state.misc, 0);
    return abilityMod + proficiency + (Number.isFinite(misc) ? misc : 0);
  }

  getPassiveScore(id) {
    const def = passiveDefinitions.find(entry => entry.id === id);
    if (!def) return 10;
    const skillBonus = this.getSkillBonus(def.skill);
    const adjustment = parseNumber(this.playState.passives?.[id], 0);
    return 10 + skillBonus + (Number.isFinite(adjustment) ? adjustment : 0);
  }

  getSensesList() {
    const senses = [];
    const race = this.getRaceMeta();
    if (race && Number.isFinite(parseNumber(race.speed, NaN))) {
      senses.push(`Speed ${parseNumber(race.speed, 30)} ft.`);
    }
    const traits = Array.isArray(race?.traits) ? race.traits : [];
    traits.forEach((trait) => {
      if (typeof trait !== 'string') return;
      ['Darkvision', 'Blindsight', 'Tremorsense', 'Truesight'].forEach((sense) => {
        const regex = new RegExp(`${sense}[^0-9]*([0-9]+)`, 'i');
        const match = trait.match(regex);
        if (match) {
          senses.push(`${sense} ${match[1]} ft.`);
        }
      });
    });
    const custom = this.playState.exploration?.customSenses;
    if (typeof custom === 'string' && custom.trim()) {
      custom.split(/[,\n]/).map(entry => entry.trim()).filter(Boolean).forEach((entry) => senses.push(entry));
    }
    return senses;
  }

  getLanguagesList() {
    const languages = [];
    const race = this.getRaceMeta();
    if (race && Array.isArray(race.languages)) {
      race.languages.forEach((lang) => {
        if (lang) languages.push(lang);
      });
    }
    const background = resolveBackgroundMeta(this.builderState?.data?.background);
    if (background) {
      if (Array.isArray(background.languages)) {
        background.languages.forEach((lang) => {
          if (lang) languages.push(lang);
        });
      } else {
        const count = parseNumber(background.languages, 0);
        if (count > 0) {
          languages.push(`+${count} choice${count > 1 ? 's' : ''}`);
        }
      }
    }
    const custom = this.playState.exploration?.customLanguages;
    if (typeof custom === 'string' && custom.trim()) {
      custom.split(/[,\n]/).map(entry => entry.trim()).filter(Boolean).forEach((entry) => languages.push(entry));
    }
    return languages.filter((value, index, arr) => value && arr.indexOf(value) === index);
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
    if (action === 'clear-temp') {
      this.playState.hp.temp = 0;
      savePlayState(this.playState);
      this.render();
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
    const concentration = this.playState.concentration;
    if (action === 'start') {
      if (!concentration.spell) {
        const spell = prompt('What spell are you concentrating on?');
        if (!spell) return;
        concentration.spell = spell;
      }
      concentration.active = true;
      concentration.startedAt = Date.now();
    }
    if (action === 'end') {
      concentration.active = false;
      concentration.spell = '';
      concentration.startedAt = null;
      concentration.lastDamage = 0;
      concentration.lastDC = 10;
    }
    if (action === 'calculate' || action === 'prompt') {
      let damage = clamp(parseNumber(concentration.lastDamage, 0), 0, 999);
      if (action === 'prompt') {
        const response = prompt('Damage taken for concentration check?', String(damage || ''));
        damage = clamp(parseNumber(response, 0), 0, 999);
      }
      concentration.lastDamage = damage;
      const dc = Math.max(10, Math.ceil(damage / 2));
      concentration.lastDC = dc;
      const spell = concentration.spell || 'your spell';
      const advantageNote = concentration.warCaster ? ' You have advantage on this save (War Caster).' : '';
      this.toast(`Concentration DC ${dc} to maintain ${spell}.${advantageNote}`);
    }
    savePlayState(this.playState);
    this.render();
  }

  handleSlotAction(level, action) {
    if (!level) return;
    if (!this.playState.spellcasting || !this.playState.spellcasting.slots) return;
    const slot = this.playState.spellcasting.slots[level];
    if (!slot) return;
    const max = clamp(parseNumber(slot.max, 0), 0, 99);
    let remaining = clamp(parseNumber(slot.remaining, 0), 0, max);
    if (action === 'increment') {
      remaining = clamp(remaining + 1, 0, max);
    }
    if (action === 'decrement') {
      remaining = clamp(remaining - 1, 0, max);
    }
    if (action === 'reset') {
      remaining = max;
    }
    this.playState.spellcasting.slots[level] = { max, remaining };
    savePlayState(this.playState);
    this.render();
  }

  handleDeathAction(action, type, index) {
    if (!this.playState.deathSaves) {
      this.playState.deathSaves = { success: 0, failure: 0 };
    }
    if (action === 'reset') {
      this.playState.deathSaves = { success: 0, failure: 0 };
    } else if (action === 'stabilize') {
      this.playState.deathSaves.failure = 0;
    } else if (action === 'toggle' && (type === 'success' || type === 'failure')) {
      const pip = clamp(parseNumber(index, -1), 0, 2);
      const current = clamp(parseNumber(this.playState.deathSaves[type], 0), 0, 3);
      const target = pip + 1;
      this.playState.deathSaves[type] = current >= target ? target - 1 : target;
    }
    savePlayState(this.playState);
    this.render();
  }

  toggleCondition(id) {
    if (!this.playState.conditions) {
      this.playState.conditions = {};
    }
    this.playState.conditions[id] = !this.playState.conditions[id];
    savePlayState(this.playState);
    this.render();
  }

  resetAttackHelper() {
    this.playState.attackHelper = { ac: 12, attackBonus: 5, advantage: 'normal', type: 'melee', targetProne: false };
    savePlayState(this.playState);
    this.render();
  }

  handleDiceRoll(expression) {
    try {
      const result = this.evaluateDiceExpression(expression);
      if (!result) return;
      this.playState.diceLog.unshift({ ...result, at: Date.now() });
      this.playState.diceLog = this.playState.diceLog.slice(0, 12);
      savePlayState(this.playState);
      this.toast(`Rolled ${result.expression}: ${result.total}`);
      this.render();
    } catch (error) {
      console.warn('Dice roll failed', error);
      this.toast('Unable to parse dice expression. Use formats like 2d6+3.');
    }
  }

  evaluateDiceExpression(input) {
    const expression = typeof input === 'string' ? input.trim() : '';
    if (!expression) return null;
    if (!/^[0-9dD+\-*/()\s]+$/.test(expression)) {
      throw new Error('Invalid characters in dice expression');
    }
    const detail = [];
    let replaced = expression.replace(/(\d*)d(\d+)/gi, (match, countStr, sidesStr) => {
      const count = clamp(parseNumber(countStr, 1), 1, 100);
      const sides = clamp(parseNumber(sidesStr, 0), 1, 1000);
      const rolls = [];
      for (let i = 0; i < count; i += 1) {
        rolls.push(Math.floor(Math.random() * sides) + 1);
      }
      detail.push(`${count}d${sides} [${rolls.join(', ')}]`);
      const sum = rolls.reduce((acc, value) => acc + value, 0);
      return String(sum);
    });
    if (!/^[0-9+\-*/()\s.]+$/.test(replaced)) {
      throw new Error('Unsafe dice expression');
    }
    let total = 0;
    try {
      // eslint-disable-next-line no-new-func
      total = Function(`"use strict";return (${replaced})`)();
    } catch (error) {
      throw new Error('Failed to evaluate expression');
    }
    if (!Number.isFinite(total)) {
      throw new Error('Non-finite dice total');
    }
    return { expression, total: Math.round(total), detail };
  }

  combineAdvantage(base, modifier) {
    if (modifier === 'normal' || !modifier) return base || 'normal';
    if (base === 'normal' || !base) return modifier;
    if (base === modifier) return base;
    return 'normal';
  }

  evaluateAttackHelper() {
    if (!this.playState.attackHelper) {
      return { needed: 10, advantage: 'normal', note: '' };
    }
    const helper = this.playState.attackHelper;
    const ac = clamp(parseNumber(helper.ac, 10), 1, 35);
    const attackBonus = parseNumber(helper.attackBonus, 0);
    const base = ['advantage', 'disadvantage', 'normal'].includes(helper.advantage) ? helper.advantage : 'normal';
    const proneModifier = helper.targetProne ? (helper.type === 'ranged' ? 'disadvantage' : 'advantage') : 'normal';
    const finalAdvantage = this.combineAdvantage(base, proneModifier);
    const neededRaw = ac - attackBonus;
    const needed = clamp(neededRaw <= 1 ? 2 : Math.ceil(neededRaw), 2, 20);
    let note = '';
    if (helper.targetProne) {
      note = helper.type === 'ranged' ? 'Prone target imposes disadvantage on ranged attacks.' : 'Prone target grants advantage to melee attacks within 5 feet.';
    }
    return { needed, advantage: finalAdvantage, note };
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
    this.renderSkills();
    this.renderResources();
    this.renderSpellcasting();
    this.renderInventory();
    this.renderUtilities();
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
        <summary>Skills &amp; Exploration</summary>
        <div class="section-body" data-summary-section="skills"></div>
      </details>
      <details open>
        <summary>Resources</summary>
        <div class="section-body" data-summary-section="resources"></div>
      </details>
      <details>
        <summary>Spellcasting</summary>
        <div class="section-body" data-summary-section="spellcasting"></div>
      </details>
      <details>
        <summary>Inventory</summary>
        <div class="section-body" data-summary-section="inventory"></div>
      </details>
      <details>
        <summary>Utilities</summary>
        <div class="section-body" data-summary-section="utilities"></div>
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
    const cls = this.builderState?.data?.class || 'Classless';
    const subclass = this.builderState?.data?.subclass;
    const level = this.builderState?.data?.level || '1';
    const background = this.builderState?.data?.background;
    const alignment = this.builderState?.data?.alignment;
    const subtitle = [
      `Level ${level} ${cls}`,
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
    const classMeta = this.getClassMeta();
    const proficientSaves = new Set((classMeta && classMeta.saving_throws) || []);
    const abilityNameMap = {
      str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma'
    };
    const grid = createElement('div', 'abilities-grid');
    abilityFields.forEach(field => {
      const score = this.getAbilityTotal(field.id);
      const modValue = this.getAbilityModifier(field.id);
      const mod = formatBonus(modValue);
      const saveProf = proficientSaves.has(abilityNameMap[field.id]);
      const saveBonus = formatBonus(modValue + (saveProf ? proficiency : 0));
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

  renderSkills() {
    const container = this.root.querySelector('[data-summary-section="skills"]');
    if (!container) return;
    container.innerHTML = '';

    const skillsCard = createElement('div', 'resource-card');
    const skillList = createElement('div', 'skill-list');
    skillList.style.display = 'grid';
    skillList.style.gap = '0.4rem';
    skillDefinitions.forEach((skill) => {
      const state = this.getSkillState(skill.id);
      const abilityMod = this.getAbilityModifier(skill.ability);
      const total = this.getSkillBonus(skill.id);
      const row = createElement('div', 'skill-row');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = 'minmax(0,2fr) repeat(3, auto)';
      row.style.alignItems = 'center';
      row.style.gap = '0.5rem';
      row.innerHTML = `
        <div style="display:grid;gap:0.2rem;">
          <strong>${skill.label}</strong>
          <span style="font-size:0.7rem;color:var(--muted);">${skill.ability.toUpperCase()} mod ${formatBonus(abilityMod)}</span>
        </div>
        <span style="font-weight:600;">${formatBonus(total)}</span>
        <label style="display:flex;align-items:center;gap:0.3rem;font-size:0.7rem;">Prof <input type="checkbox" data-type="checkbox" data-track="skills.${skill.id}.proficient" ${state.proficient ? 'checked' : ''}></label>
        <label style="display:flex;align-items:center;gap:0.3rem;font-size:0.7rem;">Expert <input type="checkbox" data-type="checkbox" data-track="skills.${skill.id}.expertise" ${state.expertise ? 'checked' : ''} ${state.proficient ? '' : 'disabled'}></label>
      `;
      skillList.appendChild(row);
    });
    skillsCard.innerHTML = '<h4>Skills</h4>';
    skillsCard.appendChild(skillList);
    container.appendChild(skillsCard);

    const passivesCard = createElement('div', 'resource-card');
    passivesCard.innerHTML = '<h4>Passive Scores</h4>';
    const passiveList = createElement('div');
    passiveList.style.display = 'grid';
    passiveList.style.gap = '0.45rem';
    passiveDefinitions.forEach(({ id, label }) => {
      const total = this.getPassiveScore(id);
      const adjustment = parseNumber(this.playState.passives?.[id], 0);
      const row = document.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = 'minmax(0,1.4fr) auto';
      row.style.alignItems = 'center';
      row.style.gap = '0.4rem';
      row.innerHTML = `
        <div style="display:grid;gap:0.2rem;">
          <strong>${label}</strong>
          <span style="font-size:0.7rem;color:var(--muted);">${total}</span>
        </div>
        <label style="display:flex;align-items:center;gap:0.3rem;font-size:0.7rem;">Adj <input type="number" data-type="number" data-track="passives.${id}" value="${Number.isFinite(adjustment) ? adjustment : 0}" style="width:70px;"></label>
      `;
      passiveList.appendChild(row);
    });
    passivesCard.appendChild(passiveList);
    container.appendChild(passivesCard);

    const explorationCard = createElement('div', 'resource-card');
    explorationCard.innerHTML = '<h4>Senses &amp; Languages</h4>';
    const senses = this.getSensesList();
    const languages = this.getLanguagesList();
    const sensesList = senses.length ? `<ul style="margin:0;padding-left:1.1rem;">${senses.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p class="summary-empty">No special senses recorded.</p>';
    const languageList = languages.length ? `<ul style="margin:0;padding-left:1.1rem;">${languages.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p class="summary-empty">Add languages from race, background, or notes.</p>';
    const customSenses = escapeHtml(this.playState.exploration?.customSenses || '');
    const customLangs = escapeHtml(this.playState.exploration?.customLanguages || '');
    const notes = escapeHtml(this.playState.exploration?.notes || '');
    explorationCard.innerHTML += `
      <div style="display:grid;gap:0.4rem;">
        <div>
          <strong>Senses</strong>
          ${sensesList}
          <label style="display:flex;flex-direction:column;gap:0.25rem;font-size:0.72rem;color:var(--muted);">Custom senses
            <input type="text" data-track="exploration.customSenses" value="${customSenses}" placeholder="Darkvision 60 ft, Tremorsense 30 ft" />
          </label>
        </div>
        <div>
          <strong>Languages</strong>
          ${languageList}
          <label style="display:flex;flex-direction:column;gap:0.25rem;font-size:0.72rem;color:var(--muted);">Additional languages
            <input type="text" data-track="exploration.customLanguages" value="${customLangs}" placeholder="Thieves' Cant, Primordial" />
          </label>
        </div>
        <label style="display:flex;flex-direction:column;gap:0.25rem;font-size:0.72rem;color:var(--muted);">Notes
          <input type="text" data-track="exploration.notes" value="${notes}" placeholder="Favored terrain, travel routines" />
        </label>
      </div>
    `;
    container.appendChild(explorationCard);
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
      <button type="button" data-summary-action="clear-temp" style="justify-self:flex-start;">Clear temp HP</button>
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

    const deathSaves = this.playState.deathSaves || { success: 0, failure: 0 };
    const deathCard = createElement('div', 'resource-card');
    const success = clamp(parseNumber(deathSaves.success, 0), 0, 3);
    const failure = clamp(parseNumber(deathSaves.failure, 0), 0, 3);
    const renderPips = (type, filled) => {
      const pips = [];
      for (let i = 0; i < 3; i += 1) {
        const active = i < filled;
        pips.push(`<button type="button" data-death-action="toggle" data-death-type="${type}" data-death-index="${i}" aria-pressed="${active}" style="border-radius:999px;border:1px solid rgba(255,255,255,0.2);background:${active ? 'var(--accent)' : 'rgba(255,255,255,0.05)'};color:${active ? '#042417' : 'var(--fg)'};width:1.6rem;height:1.6rem;font-weight:600;">${active ? '●' : '○'}</button>`);
      }
      return pips.join('');
    };
    deathCard.innerHTML = `
      <h4>Death Saves</h4>
      <div style="display:grid;gap:0.5rem;">
        <div style="display:flex;align-items:center;gap:0.4rem;justify-content:space-between;">
          <span style="font-size:0.8rem;">Successes</span>
          <div style="display:flex;gap:0.35rem;">${renderPips('success', success)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:0.4rem;justify-content:space-between;">
          <span style="font-size:0.8rem;">Failures</span>
          <div style="display:flex;gap:0.35rem;">${renderPips('failure', failure)}</div>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button type="button" data-death-action="stabilize">Stabilize</button>
          <button type="button" data-death-action="reset">Reset</button>
        </div>
      </div>
    `;
    resourceGrid.appendChild(deathCard);

    container.appendChild(resourceGrid);
  }

  renderSpellcasting() {
    const container = this.root.querySelector('[data-summary-section="spellcasting"]');
    if (!container) return;
    container.innerHTML = '';

    if (!this.isSpellcaster()) {
      const notice = createElement('p', 'summary-empty', 'No spellcasting features detected for this class. Add notes or slots manually if needed.');
      container.appendChild(notice);
    }

    const listCard = createElement('div', 'resource-card');
    const prepared = escapeHtml(this.playState.spellcasting?.prepared || '');
    const known = escapeHtml(this.playState.spellcasting?.known || '');
    const notes = escapeHtml(this.playState.spellcasting?.notes || '');
    listCard.innerHTML = `
      <h4>Spells Prepared &amp; Known</h4>
      <label style="display:flex;flex-direction:column;gap:0.3rem;">Prepared spells
        <textarea data-track="spellcasting.prepared" rows="4" placeholder="Bless, Shield of Faith, Spiritual Weapon">${prepared}</textarea>
      </label>
      <label style="display:flex;flex-direction:column;gap:0.3rem;">Known spells / cantrips
        <textarea data-track="spellcasting.known" rows="4" placeholder="Mage Hand, Fire Bolt, Misty Step">${known}</textarea>
      </label>
      <label style="display:flex;flex-direction:column;gap:0.3rem;">Notes
        <input type="text" data-track="spellcasting.notes" value="${notes}" placeholder="Focus, DC, attack bonus" />
      </label>
    `;
    container.appendChild(listCard);

    const slotsCard = createElement('div', 'resource-card');
    slotsCard.innerHTML = '<h4>Spell Slots</h4>';
    const slotsGrid = createElement('div');
    slotsGrid.style.display = 'grid';
    slotsGrid.style.gap = '0.4rem';
    slotsGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';
    for (let level = 1; level <= 9; level += 1) {
      const slot = this.playState.spellcasting?.slots?.[level] || { max: 0, remaining: 0 };
      const card = document.createElement('div');
      card.style.display = 'grid';
      card.style.gap = '0.3rem';
      card.style.padding = '0.45rem';
      card.style.borderRadius = '0.6rem';
      card.style.background = 'rgba(255,255,255,0.05)';
      card.dataset.slotLevel = String(level);
      card.innerHTML = `
        <strong style="font-size:0.8rem;">Level ${level}</strong>
        <div style="display:flex;align-items:center;gap:0.35rem;flex-wrap:wrap;">
          <button type="button" data-slot-action="decrement">-</button>
          <input type="number" data-type="number" data-track="spellcasting.slots.${level}.remaining" value="${slot.remaining}" min="0" style="width:60px;">
          <span>/</span>
          <input type="number" data-type="number" data-track="spellcasting.slots.${level}.max" value="${slot.max}" min="0" style="width:60px;">
          <button type="button" data-slot-action="increment">+</button>
          <button type="button" data-slot-action="reset">Reset</button>
        </div>
      `;
      slotsGrid.appendChild(card);
    }
    slotsCard.appendChild(slotsGrid);
    container.appendChild(slotsCard);
  }

  renderInventory() {
    const container = this.root.querySelector('[data-summary-section="inventory"]');
    if (!container) return;
    container.innerHTML = '';

    const data = this.builderState?.data || {};
    const weapons = parseList(data.weapons);
    const armor = parseList(data.armor);
    const gear = parseList(data.gear);

    const equipmentCard = createElement('div', 'resource-card');
    const inventoryNotes = escapeHtml(this.playState.inventory?.notes || '');
    const renderList = (items, emptyText) => (items.length ? `<ul style="margin:0;padding-left:1.1rem;">${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : `<p class="summary-empty">${emptyText}</p>`);
    equipmentCard.innerHTML = `
      <h4>Equipment Loadout</h4>
      <div style="display:grid;gap:0.45rem;">
        <div>
          <strong>Weapons</strong>
          ${renderList(weapons, 'Add weapon loadout in the equipment step.')}
        </div>
        <div>
          <strong>Armor &amp; Defenses</strong>
          ${renderList(armor, 'Armor choices will appear here.')}
        </div>
        <div>
          <strong>Gear</strong>
          ${renderList(gear, 'List packs, tools, or trinkets to track them here.')}
        </div>
        <label style="display:flex;flex-direction:column;gap:0.3rem;font-size:0.75rem;color:var(--muted);">Notes
          <textarea rows="3" data-track="inventory.notes" placeholder="Attunement, weight, storage">${inventoryNotes}</textarea>
        </label>
      </div>
    `;
    container.appendChild(equipmentCard);

    const currencyCard = createElement('div', 'resource-card');
    currencyCard.innerHTML = '<h4>Currency</h4>';
    const currencyGrid = createElement('div');
    currencyGrid.style.display = 'grid';
    currencyGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(120px, 1fr))';
    currencyGrid.style.gap = '0.45rem';
    ['cp', 'sp', 'ep', 'gp', 'pp'].forEach((coin) => {
      const value = parseNumber(this.playState.currency?.[coin], 0);
      const label = coin.toUpperCase();
      const wrapper = document.createElement('label');
      wrapper.style.display = 'grid';
      wrapper.style.gap = '0.25rem';
      wrapper.style.fontSize = '0.8rem';
      wrapper.textContent = label;
      const input = document.createElement('input');
      input.type = 'number';
      input.dataset.type = 'number';
      input.dataset.track = `currency.${coin}`;
      input.min = '0';
      input.value = Number.isFinite(value) ? value : 0;
      wrapper.appendChild(input);
      currencyGrid.appendChild(wrapper);
    });
    currencyCard.appendChild(currencyGrid);
    container.appendChild(currencyCard);
  }

  renderUtilities() {
    const container = this.root.querySelector('[data-summary-section="utilities"]');
    if (!container) return;
    container.innerHTML = '';

    const rollerCard = createElement('div', 'resource-card');
    rollerCard.innerHTML = '<h4>Dice Roller</h4>';
    const quickRow = createElement('div');
    quickRow.style.display = 'flex';
    quickRow.style.flexWrap = 'wrap';
    quickRow.style.gap = '0.35rem';
    quickDiceExpressions.forEach((expr) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.roller = expr.startsWith('d') ? `1${expr}` : expr;
      button.textContent = expr.toUpperCase();
      quickRow.appendChild(button);
    });
    rollerCard.appendChild(quickRow);

    const form = document.createElement('form');
    form.dataset.rollerForm = 'true';
    form.style.display = 'flex';
    form.style.flexWrap = 'wrap';
    form.style.gap = '0.4rem';
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'diceExpression';
    input.placeholder = '2d6+3';
    input.style.flex = '1 1 160px';
    form.appendChild(input);
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = 'Roll';
    form.appendChild(submit);
    rollerCard.appendChild(form);

    const log = Array.isArray(this.playState.diceLog) ? this.playState.diceLog : [];
    if (log.length) {
      const logList = document.createElement('ul');
      logList.style.margin = '0';
      logList.style.paddingLeft = '1.1rem';
      logList.style.fontSize = '0.78rem';
      log.slice(0, 8).forEach((entry) => {
        const item = document.createElement('li');
        const detail = Array.isArray(entry.detail) && entry.detail.length ? ` (${entry.detail.join('; ')})` : '';
        const date = entry.at ? new Date(entry.at) : null;
        const time = date ? new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: 'numeric' }).format(date) : '';
        item.textContent = `${entry.expression || '?'} → ${entry.total}${detail}${time ? ` · ${time}` : ''}`;
        logList.appendChild(item);
      });
      rollerCard.appendChild(logList);
    } else {
      rollerCard.appendChild(createElement('p', 'summary-empty', 'No rolls yet. Use the quick buttons or enter an expression.'));
    }
    container.appendChild(rollerCard);

    const helperCard = createElement('div', 'resource-card');
    helperCard.innerHTML = '<h4>Incoming Attack Helper</h4>';
    const helper = this.playState.attackHelper || { ac: 12, attackBonus: 5, advantage: 'normal', type: 'melee', targetProne: false };
    const outcome = this.evaluateAttackHelper();
    helperCard.innerHTML += `
      <div style="display:grid;gap:0.4rem;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));">
        <label>Armor Class <input type="number" data-type="number" data-track="attackHelper.ac" value="${helper.ac}" min="1" max="40"></label>
        <label>Attack Bonus <input type="number" data-type="number" data-track="attackHelper.attackBonus" value="${helper.attackBonus}" min="-5" max="30"></label>
        <label>Advantage
          <select data-track="attackHelper.advantage">
            <option value="normal" ${helper.advantage === 'normal' ? 'selected' : ''}>Normal</option>
            <option value="advantage" ${helper.advantage === 'advantage' ? 'selected' : ''}>Advantage</option>
            <option value="disadvantage" ${helper.advantage === 'disadvantage' ? 'selected' : ''}>Disadvantage</option>
          </select>
        </label>
        <label>Attack Type
          <select data-track="attackHelper.type">
            <option value="melee" ${helper.type !== 'ranged' ? 'selected' : ''}>Melee</option>
            <option value="ranged" ${helper.type === 'ranged' ? 'selected' : ''}>Ranged</option>
          </select>
        </label>
        <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.78rem;">Target prone <input type="checkbox" data-type="checkbox" data-track="attackHelper.targetProne" ${helper.targetProne ? 'checked' : ''}></label>
      </div>
      <p style="margin:0.5rem 0 0;font-size:0.78rem;color:var(--muted);">Needs ${outcome.needed}+ with ${outcome.advantage}. ${outcome.note || ''}</p>
      <button type="button" data-attack-action="reset" style="justify-self:flex-start;">Reset helper</button>
    `;
    container.appendChild(helperCard);

    const conditionCard = createElement('div', 'resource-card');
    conditionCard.innerHTML = '<h4>Conditions</h4>';
    const chipRow = createElement('div');
    chipRow.style.display = 'flex';
    chipRow.style.flexWrap = 'wrap';
    chipRow.style.gap = '0.4rem';
    conditionDefinitions.forEach((condition) => {
      const active = Boolean(this.playState.conditions?.[condition.id]);
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.conditionId = condition.id;
      button.setAttribute('aria-pressed', String(active));
      button.textContent = condition.label;
      button.style.borderRadius = '999px';
      button.style.border = '1px solid rgba(255,255,255,0.18)';
      button.style.padding = '0.35rem 0.7rem';
      button.style.fontSize = '0.75rem';
      button.style.background = active ? 'rgba(79,216,160,0.2)' : 'rgba(255,255,255,0.06)';
      button.style.color = active ? 'var(--accent)' : 'var(--fg)';
      chipRow.appendChild(button);
    });
    conditionCard.appendChild(chipRow);

    const activeConditions = conditionDefinitions.filter((condition) => this.playState.conditions?.[condition.id]);
    if (activeConditions.length) {
      const list = document.createElement('ul');
      list.style.margin = '0.5rem 0 0';
      list.style.paddingLeft = '1.1rem';
      list.style.fontSize = '0.75rem';
      activeConditions.forEach((condition) => {
        const item = document.createElement('li');
        item.innerHTML = `<strong>${condition.label}:</strong> ${condition.affects.join('; ')}`;
        list.appendChild(item);
      });
      conditionCard.appendChild(list);
    } else {
      conditionCard.appendChild(createElement('p', 'summary-empty', 'Toggle a condition to remind yourself of imposed modifiers.'));
    }
    container.appendChild(conditionCard);
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
    const spellName = escapeHtml(concentration.spell || '');
    const spellNotes = escapeHtml(concentration.notes || '');
    form.innerHTML = `
      <h4>Spell Tracking</h4>
      <label>Spell name <input type="text" data-track="concentration.spell" value="${spellName}" placeholder="Bless"></label>
      <label>Notes <input type="text" data-track="concentration.notes" value="${spellNotes}" placeholder="DC, bonus, etc."></label>
      <label style="justify-content:flex-start;gap:0.6rem;">Active <input type="checkbox" data-type="checkbox" data-track="concentration.active" ${concentration.active ? 'checked' : ''}></label>
      <label style="justify-content:flex-start;gap:0.6rem;">War Caster <input type="checkbox" data-type="checkbox" data-track="concentration.warCaster" ${concentration.warCaster ? 'checked' : ''}></label>
      <label>Damage taken <input type="number" data-type="number" data-track="concentration.lastDamage" value="${concentration.lastDamage || 0}" min="0"></label>
      <p style="margin:0;color:var(--muted);font-size:0.75rem;">Current DC: ${concentration.lastDC}. ${concentration.warCaster ? 'You have advantage on the save.' : ''}</p>
      <button type="button" data-concentration-action="calculate" style="justify-self:flex-start;">Update DC</button>
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
