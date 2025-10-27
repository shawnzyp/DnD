const PLAY_STATE_KEY = 'dndPlayState';
const abilityFields = [
  { id: 'str', label: 'Strength', short: 'STR' },
  { id: 'dex', label: 'Dexterity', short: 'DEX' },
  { id: 'con', label: 'Constitution', short: 'CON' },
  { id: 'int', label: 'Intelligence', short: 'INT' },
  { id: 'wis', label: 'Wisdom', short: 'WIS' },
  { id: 'cha', label: 'Charisma', short: 'CHA' }
];

const ATTUNEMENT_LIMIT = 3;

const skillDefinitions = [
  { id: 'acrobatics', label: 'Acrobatics', ability: 'dex' },
  { id: 'animal-handling', label: 'Animal Handling', ability: 'wis' },
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
  { id: 'sleight-of-hand', label: 'Sleight of Hand', ability: 'dex' },
  { id: 'stealth', label: 'Stealth', ability: 'dex' },
  { id: 'survival', label: 'Survival', ability: 'wis' }
];

const skillNameIndex = skillDefinitions.reduce((map, skill) => {
  const base = skill.label.toLowerCase();
  map[skill.id] = skill;
  map[base] = skill;
  map[base.replace(/[^a-z]/g, '')] = skill;
  map[skill.label.replace(/\s+/g, '').toLowerCase()] = skill;
  return map;
}, {});

const passiveSkills = [
  { id: 'perception', label: 'Passive Perception', skill: 'perception' },
  { id: 'investigation', label: 'Passive Investigation', skill: 'investigation' },
  { id: 'insight', label: 'Passive Insight', skill: 'insight' }
];

const coinTypes = [
  { id: 'cp', label: 'Copper (cp)' },
  { id: 'sp', label: 'Silver (sp)' },
  { id: 'ep', label: 'Electrum (ep)' },
  { id: 'gp', label: 'Gold (gp)' },
  { id: 'pp', label: 'Platinum (pp)' }
];

const conditionsCatalog = [
  { id: 'blinded', label: 'Blinded', note: 'Attack rolls against you have advantage; your attacks have disadvantage.' },
  { id: 'charmed', label: 'Charmed', note: 'Unable to attack charmer; charmer has advantage on social ability checks.' },
  { id: 'deafened', label: 'Deafened', note: 'Automatically fail checks relying on hearing.' },
  { id: 'exhaustion', label: 'Exhaustion', note: 'Track exhaustion separately; ability checks suffer penalties by level.' },
  { id: 'frightened', label: 'Frightened', note: 'Disadvantage on ability checks and attacks while source in sight.' },
  { id: 'grappled', label: 'Grappled', note: 'Speed becomes 0.' },
  { id: 'incapacitated', label: 'Incapacitated', note: 'Can’t take actions or reactions.' },
  { id: 'invisible', label: 'Invisible', note: 'Attacks against you have disadvantage; your attacks have advantage.' },
  { id: 'paralyzed', label: 'Paralyzed', note: 'Attacks against you have advantage; auto crit within 5 ft.' },
  { id: 'petrified', label: 'Petrified', note: 'Transformed to stone; attacks have advantage.' },
  { id: 'poisoned', label: 'Poisoned', note: 'Disadvantage on attack rolls and ability checks.' },
  { id: 'prone', label: 'Prone', note: 'Disadvantage on attacks; melee attacks vs you have advantage, ranged disadvantage.' },
  { id: 'restrained', label: 'Restrained', note: 'Speed 0, attacks have disadvantage, attackers have advantage.' },
  { id: 'stunned', label: 'Stunned', note: 'Incapacitated, attacks against you have advantage.' },
  { id: 'unconscious', label: 'Unconscious', note: 'Prone, incapacitated, auto crit within 5 ft.' }
];

function getPackData() {
  return window.dndBuilderData || window.dndData || { classes: [], backgrounds: [], feats: [], items: [], companions: [] };
}

function resolveClassMeta(identifier) {
  const { classes = [] } = getPackData();
  return classes.find(entry => entry.slug === identifier || entry.id === identifier || entry.name === identifier) || null;
}

function formatCompanionSpeed(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value
      .map((entry) => (entry && typeof entry === 'object' && 'label' in entry ? entry.label : entry))
      .filter(Boolean)
      .map((entry) => String(entry).trim())
      .filter(Boolean)
      .join(', ');
  }
  if (typeof value === 'object') {
    const parts = [];
    Object.entries(value).forEach(([mode, raw]) => {
      if (raw === null || raw === undefined) return;
      if (typeof raw === 'object') {
        const distance = raw.distance || raw.value || raw.speed || raw.amount;
        if (distance) {
          parts.push(`${mode.replace(/_/g, ' ')} ${distance}`);
        }
      } else {
        parts.push(`${mode.replace(/_/g, ' ')} ${raw}`);
      }
    });
    return parts.join(', ');
  }
  return String(value);
}

function collectCompanionFeatures(target, value) {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    value.forEach((entry) => collectCompanionFeatures(target, entry));
    return;
  }
  if (typeof value === 'object') {
    if ('name' in value) collectCompanionFeatures(target, value.name);
    if ('feature' in value) collectCompanionFeatures(target, value.feature);
    if ('title' in value) collectCompanionFeatures(target, value.title);
    if ('label' in value) collectCompanionFeatures(target, value.label);
    if ('features' in value) collectCompanionFeatures(target, value.features);
    return;
  }
  const text = String(value);
  text.split(/[;,]/).forEach((part) => {
    const trimmed = part.trim();
    if (trimmed) {
      target.push(trimmed);
    }
  });
}

function extractCompanionFeatures(entry) {
  const features = [];
  const candidates = [
    entry.requiredFeatures,
    entry.requirements,
    entry.requirement,
    entry.prerequisites,
    entry.requires,
    entry.featureRequirements,
    entry.featuresRequired,
    entry.prerequisiteFeatures
  ];
  candidates.forEach((candidate) => collectCompanionFeatures(features, candidate));
  return Array.from(new Set(features));
}

function normalizeCompanionEntry(entry) {
  if (!entry) return null;
  const id = entry.slug || entry.id || entry.name;
  if (!id) return null;
  const name = entry.name || id;
  const ac = Number.isFinite(entry.armor_class)
    ? entry.armor_class
    : Number.isFinite(entry.ac)
      ? entry.ac
      : Number.isFinite(entry.armorClass)
        ? entry.armorClass
        : null;
  const hp = Number.isFinite(entry.hit_points)
    ? entry.hit_points
    : Number.isFinite(entry.hp)
      ? entry.hp
      : Number.isFinite(entry.hitPoints)
        ? entry.hitPoints
        : null;
  const speed = formatCompanionSpeed(entry.speed || entry.speeds || entry.movement || entry.movementModes);
  const senses = Array.isArray(entry.senses) ? entry.senses.join(', ') : (entry.senses || '');
  const skills = Array.isArray(entry.skills) ? entry.skills.join(', ') : (entry.skills || '');
  const traits = Array.isArray(entry.traits)
    ? entry.traits.map((trait) => {
        if (!trait && trait !== 0) return null;
        if (typeof trait === 'string') return trait.trim();
        if (typeof trait === 'object') {
          const label = trait.name || trait.title || '';
          const text = trait.desc || trait.description || trait.text || '';
          return [label, text].filter(Boolean).join('. ').trim();
        }
        return String(trait).trim();
      }).filter(Boolean)
    : typeof entry.traits === 'string'
      ? [entry.traits.trim()]
      : [];
  return {
    id,
    name,
    summary: entry.summary || entry.description || '',
    ac,
    hp,
    speed,
    cr: entry.challenge_rating || entry.challengeRating || entry.cr || '',
    size: entry.size || '',
    type: entry.type || entry.creature_type || entry.category || '',
    alignment: entry.alignment || '',
    senses,
    skills,
    traits,
    features: extractCompanionFeatures(entry),
    source: (entry.source && entry.source.name) || entry.sourceId || ''
  };
}

function normalizeCompanionSnapshot(meta) {
  if (!meta || typeof meta !== 'object') return null;
  const id = meta.id || meta.slug || meta.name;
  if (!id) return null;
  const parseStat = (value) => {
    if (Number.isFinite(value)) return value;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const rawCr = meta.cr ?? meta.crLabel ?? meta.challenge_rating ?? meta.challengeRating;
  const cr = rawCr || rawCr === 0 ? String(rawCr) : '';
  const size = meta.size ? String(meta.size) : '';
  const type = (meta.type || meta.creature_type || meta.category)
    ? String(meta.type || meta.creature_type || meta.category)
    : '';
  const alignment = meta.alignment ? String(meta.alignment) : '';
  const senses = Array.isArray(meta.senses)
    ? meta.senses.map((entry) => (entry && entry.label ? entry.label : entry)).filter(Boolean).map((entry) => String(entry).trim()).filter(Boolean).join(', ')
    : meta.senses
      ? String(meta.senses)
      : '';
  const skills = Array.isArray(meta.skills)
    ? meta.skills.map((entry) => (entry && entry.label ? entry.label : entry)).filter(Boolean).map((entry) => String(entry).trim()).filter(Boolean).join(', ')
    : meta.skills
      ? String(meta.skills)
      : '';
  const traits = Array.isArray(meta.traits)
    ? meta.traits
        .map((trait) => {
          if (!trait && trait !== 0) return null;
          if (typeof trait === 'string') return trait.trim();
          if (typeof trait === 'object') {
            const name = trait.name || trait.title || '';
            const text = trait.desc || trait.description || trait.text || '';
            return [name, text].filter(Boolean).join('. ').trim();
          }
          return String(trait).trim();
        })
        .filter(Boolean)
    : typeof meta.traits === 'string'
      ? [meta.traits.trim()].filter(Boolean)
      : [];
  const features = Array.isArray(meta.features)
    ? meta.features.map((feature) => String(feature).trim()).filter(Boolean)
    : [];
  const source = meta.source && typeof meta.source === 'object'
    ? meta.source.name || meta.source.title || meta.source.id || ''
    : meta.source || '';
  const speed = formatCompanionSpeed(
    meta.speed ?? meta.speeds ?? meta.movement ?? meta.movementModes ?? meta.speedText ?? meta.speedLabel
  );
  return {
    id: String(id),
    name: meta.name ? String(meta.name) : String(id),
    summary: meta.summary ? String(meta.summary) : '',
    ac: parseStat(meta.ac ?? meta.armor_class ?? meta.armorClass),
    hp: parseStat(meta.hp ?? meta.hit_points ?? meta.hitPoints),
    speed,
    cr,
    size,
    type,
    alignment,
    senses,
    skills,
    traits,
    features,
    source: source ? String(source) : ''
  };
}

function findCompanion(identifier) {
  if (!identifier && identifier !== 0) return null;
  const key = String(identifier).trim().toLowerCase();
  if (!key) return null;
  const { companions = [] } = getPackData();
  for (let index = 0; index < companions.length; index += 1) {
    const entry = companions[index];
    if (!entry) continue;
    const slug = entry.slug ? String(entry.slug).toLowerCase() : null;
    const id = entry.id ? String(entry.id).toLowerCase() : null;
    const name = entry.name ? String(entry.name).toLowerCase() : null;
    if (slug === key || id === key || name === key) {
      return normalizeCompanionEntry(entry);
    }
  }
  return null;
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

function formatWeight(value) {
  if (!Number.isFinite(value)) return '0 lb';
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded.toFixed(0)} lb` : `${rounded.toFixed(1)} lb`;
}

function parseNumber(value, fallback = 0) {
  const parsed = typeof value === 'number' ? value : parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  if (Number.isFinite(min) && value < min) return min;
  if (Number.isFinite(max) && value > max) return max;
  return value;
}

function normalizeList(value) {
  if (!value && value !== 0) return [];
  if (Array.isArray(value)) {
    return value
      .map((entry) => (entry && typeof entry === 'object' && 'label' in entry ? entry.label : entry))
      .filter(Boolean)
      .map((entry) => String(entry).trim())
      .filter(Boolean);
  }
  return String(value)
    .split(/[,\n;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseCurrencyValue(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const numeric = Number.parseFloat(trimmed.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(numeric) ? Math.round(numeric) : 0;
  }
  return 0;
}

function resolveSkillFromText(value) {
  if (!value && value !== 0) return null;
  const key = String(value).trim().toLowerCase();
  if (!key) return null;
  return skillNameIndex[key] || null;
}

function randomDieRoll(size) {
  const die = Number.parseInt(size, 10);
  if (!Number.isFinite(die) || die <= 0) return 0;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return (array[0] % die) + 1;
  }
  return Math.floor(Math.random() * die) + 1;
}

function rollDiceExpression(rawExpression) {
  const expression = String(rawExpression || '').trim();
  if (!expression) {
    return { total: 0, terms: [], expression: '', detail: 'No expression' };
  }
  const sanitized = expression.replace(/\s+/g, '');
  const parts = sanitized.match(/[+-]?[^+-]+/g) || [];
  const terms = [];
  let total = 0;

  parts.forEach((rawPart) => {
    if (!rawPart) return;
    const sign = rawPart.startsWith('-') ? -1 : 1;
    const part = rawPart.replace(/^[-+]/, '');
    const diceMatch = part.match(/^(\d*)d(\d+)$/i);
    if (diceMatch) {
      const count = parseNumber(diceMatch[1], 1);
      const die = parseNumber(diceMatch[2], 0);
      if (count > 0 && die > 0) {
        const rolls = [];
        for (let i = 0; i < count; i += 1) {
          rolls.push(randomDieRoll(die));
        }
        const subtotal = rolls.reduce((acc, value) => acc + value, 0);
        total += sign * subtotal;
        terms.push({ type: 'dice', count, die, sign, rolls, subtotal });
        return;
      }
    }
    const number = Number.parseFloat(part);
    if (Number.isFinite(number)) {
      total += sign * number;
      terms.push({ type: 'flat', value: number, sign });
    }
  });

  const detail = terms.map((term) => {
    if (term.type === 'dice') {
      const prefix = term.sign === -1 ? '-' : '+';
      return `${prefix}${term.count}d${term.die} [${term.rolls.join(', ')}]`;
    }
    const prefix = term.sign === -1 ? '-' : '+';
    return `${prefix}${term.value}`;
  }).join(' ');

  return { total, terms, expression, detail: detail || expression };
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
      concentration: { active: false, spell: '', notes: '', warCaster: false, lastDc: null },
      restLog: [],
      skills: {},
      passives: {},
      sensesNote: '',
      languagesNote: '',
      currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
      spellcasting: { prepared: '', known: '', notes: '', slots: {} },
      dice: { history: [], lastResult: null, lastExpression: '' },
      attackHelper: { attackTotal: '', ac: '', attackType: 'melee', attackerProne: false, defenderProne: false, result: '' },
      conditions: [],
      deathSaves: { success: 0, failure: 0 }
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
      if (target.dataset.attackField) {
        const type = target.dataset.type || target.type;
        const value = type === 'checkbox' ? target.checked : target.value;
        this.updateAttackHelperField(target.dataset.attackField, value);
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
      if (target.dataset.skillToggle) {
        this.updateSkillToggle(target.dataset.skillId, target.dataset.skillToggle, target.checked);
        return;
      }
      if (target.dataset.attackField) {
        const type = target.dataset.type || target.getAttribute('type');
        const value = type === 'checkbox' ? target.checked : target.value;
        this.updateAttackHelperField(target.dataset.attackField, value);
        return;
      }
      if (target.dataset.passiveId) {
        const override = target.value === '' ? null : parseNumber(target.value, null);
        this.updatePassiveOverride(target.dataset.passiveId, override);
        return;
      }
      if (target.dataset.currencyField) {
        this.updateCurrency(target.dataset.currencyField, target.value);
        return;
      }
      if (target.dataset.spellSlotField) {
        this.updateSpellSlotField(parseInt(target.dataset.spellSlotLevel, 10), target.dataset.spellSlotField, target.value);
        return;
      }
      if (target.dataset.deathSave) {
        const index = parseInt(target.dataset.deathIndex || '0', 10);
        this.updateDeathSave(target.dataset.deathSave, index, target.checked);
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
        return;
      }
      const slotAction = target.dataset.spellSlotAction;
      if (slotAction) {
        this.handleSpellSlotAction(parseInt(target.dataset.spellSlotLevel, 10), slotAction);
        return;
      }
      const rollerAction = target.dataset.rollerAction;
      if (rollerAction) {
        const expression = target.dataset.diceExpression || target.dataset.rollerExpression || '';
        this.handleDiceAction(rollerAction, expression);
        return;
      }
      if (target.dataset.diceExpression && !target.dataset.rollerAction) {
        this.handleDiceAction('quick', target.dataset.diceExpression);
        return;
      }
      const attackAction = target.dataset.attackAction;
      if (attackAction) {
        this.handleAttackAction(attackAction);
        return;
      }
      const conditionAction = target.dataset.conditionAction;
      if (conditionAction) {
        this.handleConditionAction(conditionAction, target.dataset.conditionId);
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
    if (!this.playState.hitDice || typeof this.playState.hitDice !== 'object') {
      this.playState.hitDice = { total: Math.max(1, level), available: Math.max(1, level), die: '' };
    }
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
    const classEntries = this.getClassEntries();
    const classMeta = this.getClassMeta();
    const hitDiceBreakdown = this.getHitDiceBreakdown();
    const existingDie = typeof this.playState.hitDice.die === 'string' ? this.playState.hitDice.die.trim() : '';
    if (!existingDie) {
      if (classEntries.length === 1 && classEntries[0].hitDie) {
        this.playState.hitDice.die = classEntries[0].hitDie;
      } else if (hitDiceBreakdown) {
        this.playState.hitDice.die = hitDiceBreakdown;
      } else if (classMeta && classMeta.hit_die) {
        this.playState.hitDice.die = classMeta.hit_die;
      }
    } else if (existingDie === 'd8') {
      if (classEntries.length === 1 && classEntries[0].hitDie && classEntries[0].hitDie !== 'd8') {
        this.playState.hitDice.die = classEntries[0].hitDie;
      } else if (classEntries.length > 1 && hitDiceBreakdown && hitDiceBreakdown !== 'd8') {
        this.playState.hitDice.die = hitDiceBreakdown;
      } else if (classMeta && classMeta.hit_die && classMeta.hit_die !== 'd8' && !classEntries.length) {
        this.playState.hitDice.die = classMeta.hit_die;
      }
    }
    const isDruid = this.hasClassSlug('druid') || (classMeta && String(classMeta.slug || '').toLowerCase() === 'druid');
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
    const skillDefaults = this.deriveBuilderSkillDefaults();
    skillDefinitions.forEach((skill) => {
      const current = this.playState.skills[skill.id] || {};
      const seed = skillDefaults[skill.id] || {};
      const proficient = current.proficient !== undefined ? current.proficient : !!seed.proficient;
      const expertise = current.expertise !== undefined ? current.expertise : !!seed.expertise;
      this.playState.skills[skill.id] = {
        proficient: !!proficient,
        expertise: !!(expertise || proficient && seed.expertise)
      };
      if (this.playState.skills[skill.id].expertise) {
        this.playState.skills[skill.id].proficient = true;
      }
    });

    if (!this.playState.passives || typeof this.playState.passives !== 'object') {
      this.playState.passives = {};
    }
    const passiveDefaults = this.deriveBuilderPassives();
    passiveSkills.forEach((entry) => {
      this.playState.passives[entry.id] = this.playState.passives[entry.id] || {};
      if (this.playState.passives[entry.id].override === undefined && passiveDefaults[entry.id] !== undefined) {
        this.playState.passives[entry.id].override = passiveDefaults[entry.id];
      }
    });

    if (!this.playState.currency || typeof this.playState.currency !== 'object') {
      this.playState.currency = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
    }
    const builderCurrency = this.extractBuilderCurrency();
    coinTypes.forEach((coin) => {
      const current = parseCurrencyValue(this.playState.currency[coin.id]);
      const seed = builderCurrency[coin.id];
      if (!Number.isFinite(current) || (current === 0 && Number.isFinite(seed) && seed !== 0)) {
        this.playState.currency[coin.id] = Number.isFinite(seed) ? seed : 0;
      } else {
        this.playState.currency[coin.id] = current;
      }
    });

    if (typeof this.playState.sensesNote !== 'string' || !this.playState.sensesNote.trim()) {
      const senses = this.extractBuilderSenses();
      if (senses) {
        this.playState.sensesNote = senses;
      } else if (typeof this.playState.sensesNote !== 'string') {
        this.playState.sensesNote = '';
      }
    }

    if (typeof this.playState.languagesNote !== 'string' || !this.playState.languagesNote.trim()) {
      const languages = this.extractBuilderLanguages();
      if (languages) {
        this.playState.languagesNote = languages;
      } else if (typeof this.playState.languagesNote !== 'string') {
        this.playState.languagesNote = '';
      }
    }

    if (!this.playState.spellcasting || typeof this.playState.spellcasting !== 'object') {
      this.playState.spellcasting = { prepared: '', known: '', notes: '', slots: {} };
    }
    if (!this.playState.spellcasting.slots || typeof this.playState.spellcasting.slots !== 'object') {
      this.playState.spellcasting.slots = {};
    }
    const slotSeeds = this.extractBuilderSpellSlots();
    for (let level = 1; level <= 9; level += 1) {
      const seed = slotSeeds[level];
      const current = this.playState.spellcasting.slots[level] || { max: seed || 0, used: 0 };
      if (current.max === undefined || current.max === null) {
        current.max = seed || 0;
      }
      if ((current.max === 0 || !Number.isFinite(current.max)) && Number.isFinite(seed) && seed > 0) {
        current.max = seed;
      }
      current.max = Math.max(0, parseNumber(current.max, 0));
      current.used = clamp(parseNumber(current.used, 0), 0, current.max);
      this.playState.spellcasting.slots[level] = current;
    }

    if (!this.playState.dice || typeof this.playState.dice !== 'object') {
      this.playState.dice = { history: [], lastResult: null, lastExpression: '' };
    }
    if (!Array.isArray(this.playState.dice.history)) {
      this.playState.dice.history = [];
    }
    if (!('lastResult' in this.playState.dice)) {
      this.playState.dice.lastResult = null;
    }
    if (!('lastExpression' in this.playState.dice)) {
      this.playState.dice.lastExpression = '';
    }

    if (!this.playState.attackHelper || typeof this.playState.attackHelper !== 'object') {
      this.playState.attackHelper = { attackTotal: '', ac: '', attackType: 'melee', attackerProne: false, defenderProne: false, result: '' };
    }
    if (!['melee', 'ranged'].includes(this.playState.attackHelper.attackType)) {
      this.playState.attackHelper.attackType = 'melee';
    }
    ['attackerProne', 'defenderProne'].forEach((key) => {
      this.playState.attackHelper[key] = !!this.playState.attackHelper[key];
    });
    if (this.playState.attackHelper.ac === '' || !Number.isFinite(this.playState.attackHelper.ac)) {
      const builderAc = parseNumber(this.builderState?.data?.armorClass ?? this.builderState?.data?.ac, null);
      if (Number.isFinite(builderAc) && builderAc > 0) {
        this.playState.attackHelper.ac = builderAc;
      }
    }

    if (!Array.isArray(this.playState.conditions)) {
      this.playState.conditions = [];
    }

    if (!this.playState.deathSaves || typeof this.playState.deathSaves !== 'object') {
      this.playState.deathSaves = { success: 0, failure: 0 };
    }
    this.playState.deathSaves.success = clamp(parseNumber(this.playState.deathSaves.success, 0), 0, 3);
    this.playState.deathSaves.failure = clamp(parseNumber(this.playState.deathSaves.failure, 0), 0, 3);

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

  getClassEntries() {
    if (!this.builderState) return [];
    const derivedEntries = this.builderState.derived?.classes?.entries;
    if (Array.isArray(derivedEntries) && derivedEntries.length) {
      return derivedEntries;
    }
    const raw = this.builderState.data?.classes;
    if (!Array.isArray(raw) || !raw.length) return [];
    return raw.map((entry, index) => {
      const source = entry && typeof entry === 'object' ? entry : { class: entry };
      const identifier = source.class || source.slug || source.id || '';
      const meta = identifier ? resolveClassMeta(identifier) : null;
      const label = source.name || meta?.name || identifier || `Class ${index + 1}`;
      const level = parseNumber(source.level, 0);
      const hitDie = meta?.hit_die || source.hitDie || source.hit_die || null;
      const slug = meta?.slug || source.slug || null;
      const id = meta?.id || source.id || null;
      return {
        index,
        class: identifier,
        level,
        name: label,
        hitDie,
        slug,
        id,
        meta: meta ? { slug: meta.slug || null, id: meta.id || null } : null
      };
    });
  }

  hasClassSlug(slug) {
    if (!slug) return false;
    const target = String(slug).trim().toLowerCase();
    if (!target) return false;
    return this.getClassEntries().some((entry) => {
      const candidates = [];
      if (entry.slug) {
        candidates.push(String(entry.slug).toLowerCase());
      }
      if (entry.meta?.slug) {
        candidates.push(String(entry.meta.slug).toLowerCase());
      }
      if (entry.meta?.id) {
        candidates.push(String(entry.meta.id).toLowerCase());
      }
      if (entry.class) {
        candidates.push(String(entry.class).toLowerCase());
      }
      if (entry.name) {
        candidates.push(String(entry.name).toLowerCase());
      }
      return candidates.includes(target);
    });
  }

  getHitDiceBreakdown() {
    const source = (this.builderState?.derived?.hitDice) || (this.builderState?.data?.hitDice);
    if (!source || typeof source !== 'object') return '';
    const entries = Object.entries(source).map(([die, count]) => {
      const amount = parseNumber(count, 0);
      const size = parseNumber(String(die).replace(/[^0-9]/g, ''), 0);
      return { die: String(die), count: amount, size };
    }).filter((entry) => entry.count > 0 && entry.die);
    if (!entries.length) return '';
    entries.sort((a, b) => {
      if (a.size === b.size) {
        return a.die.localeCompare(b.die);
      }
      return b.size - a.size;
    });
    return entries.map((entry) => `${entry.count}×${entry.die}`).join(', ');
  }

  getLevel() {
    if (!this.builderState) return parseNumber(this.playState.levelOverride, 1);
    const derivedTotal = this.builderState.derived?.classes?.totalLevel;
    if (Number.isFinite(derivedTotal) && derivedTotal > 0) {
      return derivedTotal;
    }
    const entries = this.getClassEntries();
    if (entries.length) {
      const total = entries.reduce((sum, entry) => sum + (Number.isFinite(entry.level) ? entry.level : 0), 0);
      if (total > 0) {
        return total;
      }
    }
    const level = parseNumber(this.builderState.data?.level, 1);
    return level > 0 ? level : 1;
  }

  getClassMeta() {
    if (!this.builderState) return null;
    const entries = this.getClassEntries();
    if (entries.length) {
      const primary = entries[0];
      const candidates = [primary.meta?.slug, primary.meta?.id, primary.slug, primary.class, primary.name]
        .filter(Boolean);
      for (const candidate of candidates) {
        const meta = resolveClassMeta(candidate);
        if (meta) return meta;
      }
    }
    const cls = this.builderState.data?.class;
    if (cls) {
      const meta = resolveClassMeta(cls);
      if (meta) return meta;
    }
    return null;
  }

  getProficiencyBonus() {
    const derived = this.builderState?.derived?.classes?.proficiencyBonus ?? this.builderState?.derived?.proficiencyBonus;
    if (Number.isFinite(derived)) {
      return derived;
    }
    const level = this.getLevel();
    return Math.max(2, Math.floor((level - 1) / 4) + 2);
  }

  getAbilityTotal(id) {
    if (!id) return 10;
    const derived = this.builderState?.derived?.abilities?.[id];
    if (derived && Number.isFinite(derived.total)) {
      return derived.total;
    }
    const base = parseNumber(this.builderState?.data?.[id], 10) || 10;
    const bonus = Number.isFinite(derived?.bonus) ? derived.bonus : 0;
    return base + bonus;
  }

  getAbilityModifier(id) {
    const total = this.getAbilityTotal(id);
    return Math.floor((total - 10) / 2);
  }

  deriveBuilderSkillDefaults() {
    const data = this.builderState?.data || {};
    const defaults = {};
    const proficientList = normalizeList(data.skills || data.skillProficiencies || data.proficiencies || '');
    const expertiseList = normalizeList(data.skillExpertise || data.expertise || data.expertiseSkills || '');

    proficientList.forEach((entry) => {
      const match = resolveSkillFromText(entry);
      if (!match) return;
      defaults[match.id] = defaults[match.id] || { proficient: false, expertise: false };
      defaults[match.id].proficient = true;
      if (/expert/i.test(String(entry))) {
        defaults[match.id].expertise = true;
      }
    });

    expertiseList.forEach((entry) => {
      const match = resolveSkillFromText(entry);
      if (!match) return;
      defaults[match.id] = defaults[match.id] || { proficient: false, expertise: false };
      defaults[match.id].expertise = true;
      defaults[match.id].proficient = true;
    });

    skillDefinitions.forEach((skill) => {
      const key = skill.label.replace(/[^a-z]/gi, '');
      const proficiencyFlag = data[`skill${key}`] || data[`skill${key}Proficiency`] || data[`${skill.id}Proficient`];
      const expertiseFlag = data[`skill${key}Expertise`] || data[`${skill.id}Expert`];
      if (proficiencyFlag) {
        defaults[skill.id] = defaults[skill.id] || { proficient: false, expertise: false };
        defaults[skill.id].proficient = true;
      }
      if (expertiseFlag) {
        defaults[skill.id] = defaults[skill.id] || { proficient: false, expertise: false };
        defaults[skill.id].proficient = true;
        defaults[skill.id].expertise = true;
      }
    });

    return defaults;
  }

  deriveBuilderPassives() {
    const data = this.builderState?.data || {};
    const passives = {};
    passiveSkills.forEach((entry) => {
      const key = `passive${entry.skill.charAt(0).toUpperCase()}${entry.skill.slice(1)}`;
      if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
        passives[entry.id] = parseNumber(data[key], 0);
      }
    });
    return passives;
  }

  extractBuilderSenses() {
    const data = this.builderState?.data || {};
    const list = normalizeList(data.senses || data.senseNotes || data.senseList || '');
    const senseKeys = Object.keys(data).filter((key) => /^sense[A-Z]/.test(key));
    senseKeys.forEach((key) => {
      const value = data[key];
      if (!value) return;
      const label = key.replace(/^sense/, '').replace(/([A-Z])/g, ' $1').trim();
      const entry = `${label}: ${value}`.trim();
      if (entry) {
        list.push(entry);
      }
    });
    return list.join(', ');
  }

  extractBuilderLanguages() {
    const data = this.builderState?.data || {};
    const list = normalizeList(data.languages || data.tongues || data.languageNotes || '');
    return list.join(', ');
  }

  extractBuilderCurrency() {
    const data = this.builderState?.data || {};
    const values = {};
    if (data.currency && typeof data.currency === 'object') {
      coinTypes.forEach((coin) => {
        if (data.currency[coin.id] !== undefined) {
          values[coin.id] = parseCurrencyValue(data.currency[coin.id]);
        }
      });
    }
    coinTypes.forEach((coin) => {
      if (data[coin.id] !== undefined) {
        values[coin.id] = parseCurrencyValue(data[coin.id]);
      }
      const upper = coin.id.toUpperCase();
      if (data[upper] !== undefined) {
        values[coin.id] = parseCurrencyValue(data[upper]);
      }
    });
    return values;
  }

  extractBuilderSpellSlots() {
    const data = this.builderState?.data || {};
    const slots = {};
    if (Array.isArray(data.spellSlots)) {
      data.spellSlots.forEach((entry, index) => {
        const level = Number.isFinite(entry?.level) ? entry.level : index + 1;
        if (!Number.isInteger(level) || level < 1 || level > 9) return;
        const max = parseNumber(entry?.max ?? entry?.total, 0);
        if (max > 0) {
          slots[level] = max;
        }
      });
    }
    if (data.slots) {
      Object.keys(data.slots).forEach((key) => {
        const level = parseNumber(key, 0);
        if (level >= 1 && level <= 9) {
          const max = parseNumber(data.slots[key], 0);
          if (max > 0) {
            slots[level] = max;
          }
        }
      });
    }
    for (let level = 1; level <= 9; level += 1) {
      const keys = [
        `spellSlots${level}`,
        `spellSlotsLevel${level}`,
        `slotsLevel${level}`,
        `spellSlotLevel${level}`
      ];
      keys.forEach((key) => {
        if (data[key] !== undefined) {
          const max = parseNumber(data[key], 0);
          if (max > 0) {
            slots[level] = max;
          }
        }
      });
    }
    return slots;
  }

  getSkillState(skillId) {
    if (!this.playState.skills || typeof this.playState.skills !== 'object') {
      this.playState.skills = {};
    }
    this.playState.skills[skillId] = this.playState.skills[skillId] || { proficient: false, expertise: false };
    const state = this.playState.skills[skillId];
    if (state.expertise) {
      state.proficient = true;
    }
    return state;
  }

  getSkillModifier(skillId) {
    const skill = skillDefinitions.find((item) => item.id === skillId);
    if (!skill) return 0;
    const abilityMod = this.getAbilityModifier(skill.ability);
    const proficiency = this.getProficiencyBonus();
    const state = this.getSkillState(skillId);
    if (state.expertise) {
      return abilityMod + proficiency * 2;
    }
    if (state.proficient) {
      return abilityMod + proficiency;
    }
    return abilityMod;
  }

  computePassiveScore(passiveId) {
    const passive = passiveSkills.find((entry) => entry.id === passiveId);
    if (!passive) return 10;
    const base = 10 + this.getSkillModifier(passive.skill);
    const override = this.playState.passives?.[passive.id]?.override;
    if (Number.isFinite(override)) {
      return override;
    }
    return base;
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

  updateSkillToggle(skillId, field, value) {
    if (!skillId || !['proficient', 'expertise'].includes(field)) return;
    const state = this.getSkillState(skillId);
    const checked = !!value;
    if (field === 'proficient') {
      state.proficient = checked;
      if (!checked) {
        state.expertise = false;
      }
    }
    if (field === 'expertise') {
      state.expertise = checked;
      if (checked) {
        state.proficient = true;
      }
    }
    savePlayState(this.playState);
    this.render();
  }

  updatePassiveOverride(passiveId, value) {
    if (!passiveId) return;
    this.playState.passives = this.playState.passives || {};
    this.playState.passives[passiveId] = this.playState.passives[passiveId] || {};
    if (value === null || value === undefined || Number.isNaN(value)) {
      delete this.playState.passives[passiveId].override;
    } else {
      this.playState.passives[passiveId].override = value;
    }
    savePlayState(this.playState);
    this.render();
  }

  updateCurrency(field, value) {
    if (!field || !coinTypes.some((coin) => coin.id === field)) return;
    const numeric = value === '' ? 0 : parseCurrencyValue(value);
    this.playState.currency[field] = numeric;
    savePlayState(this.playState);
    this.render();
  }

  updateSpellSlotField(level, field, value) {
    if (!Number.isInteger(level) || level < 1 || level > 9) return;
    const slot = this.playState.spellcasting?.slots?.[level];
    if (!slot) return;
    if (field === 'max') {
      const max = Math.max(0, parseNumber(value, slot.max));
      slot.max = max;
      slot.used = clamp(slot.used, 0, max);
    }
    if (field === 'used') {
      const used = clamp(parseNumber(value, slot.used), 0, slot.max);
      slot.used = used;
    }
    savePlayState(this.playState);
    this.render();
  }

  handleSpellSlotAction(level, action) {
    if (!Number.isInteger(level) || level < 1 || level > 9) return;
    const slot = this.playState.spellcasting?.slots?.[level];
    if (!slot) return;
    if (action === 'spend') {
      slot.used = clamp(slot.used + 1, 0, slot.max);
    }
    if (action === 'recover') {
      slot.used = clamp(slot.used - 1, 0, slot.max);
    }
    if (action === 'reset') {
      slot.used = 0;
    }
    savePlayState(this.playState);
    this.render();
  }

  appendDiceHistory(entry) {
    if (!this.playState.dice || !Array.isArray(this.playState.dice.history)) {
      this.playState.dice = { history: [], lastResult: null };
    }
    this.playState.dice.history.unshift(entry);
    this.playState.dice.history = this.playState.dice.history.slice(0, 20);
    this.playState.dice.lastResult = entry;
    this.playState.dice.lastExpression = entry.expression || '';
  }

  handleDiceAction(action, expression) {
    if (action === 'clear') {
      if (this.playState.dice) {
        this.playState.dice.history = [];
        this.playState.dice.lastResult = null;
        this.playState.dice.lastExpression = '';
      }
      savePlayState(this.playState);
      this.render();
      return;
    }
    let targetExpression = expression;
    if (!targetExpression) {
      const input = this.root.querySelector('[data-roller-input]');
      if (input) {
        targetExpression = input.value;
      }
    }
    if (!targetExpression) {
      this.toast('Enter a dice expression to roll.');
      return;
    }
    const result = rollDiceExpression(targetExpression);
    if (!result.terms.length) {
      this.toast('Unable to parse that dice expression.');
      return;
    }
    this.appendDiceHistory({ ...result, rolledAt: Date.now() });
    this.playState.dice.lastExpression = result.expression || targetExpression;
    savePlayState(this.playState);
    this.toast(`Rolled ${result.expression || targetExpression}: ${result.total}`);
    this.render();
  }

  updateAttackHelperField(field, value) {
    if (!this.playState.attackHelper || !field) return;
    if (['attackTotal', 'ac'].includes(field)) {
      if (value === '') {
        this.playState.attackHelper[field] = '';
      } else {
        this.playState.attackHelper[field] = parseNumber(value, this.playState.attackHelper[field] || 0);
      }
    } else if (field === 'attackType') {
      this.playState.attackHelper.attackType = value === 'ranged' ? 'ranged' : 'melee';
    } else if (['attackerProne', 'defenderProne'].includes(field)) {
      this.playState.attackHelper[field] = !!value && value !== 'false';
    } else {
      this.playState.attackHelper[field] = value;
    }
    savePlayState(this.playState);
    this.render();
  }

  handleAttackAction(action) {
    if (!this.playState.attackHelper) return;
    const helper = this.playState.attackHelper;
    const attackTotal = Number.isFinite(helper.attackTotal) ? helper.attackTotal : parseNumber(helper.attackTotal, 0);
    const ac = Number.isFinite(helper.ac) ? helper.ac : parseNumber(helper.ac, 0);
    if (action === 'evaluate') {
      if (!Number.isFinite(attackTotal) || !Number.isFinite(ac) || attackTotal <= 0 || ac <= 0) {
        helper.result = 'Enter attack total and AC to evaluate.';
      } else {
        const diff = attackTotal - ac;
        helper.result = diff >= 0 ? `Hit by ${diff}` : `Miss by ${Math.abs(diff)}`;
      }
    }
    if (action === 'reset') {
      helper.attackTotal = '';
      helper.result = '';
    }
    if (action === 'prone-matrix') {
      const meleeAdv = helper.defenderProne ? 'advantage' : (helper.attackerProne ? 'disadvantage' : 'normal');
      const rangedAdv = helper.defenderProne ? 'disadvantage' : (helper.attackerProne ? 'disadvantage' : 'normal');
      const chosen = helper.attackType === 'ranged' ? rangedAdv : meleeAdv;
      helper.result = `Apply ${chosen} (${helper.attackType === 'ranged' ? 'ranged' : 'melee'} vs prone).`;
    }
    savePlayState(this.playState);
    this.render();
  }

  handleConditionAction(action, conditionId) {
    if (!action) return;
    if (action === 'add') {
      const select = this.root.querySelector('[data-condition-select]');
      const value = conditionId || (select ? select.value : '');
      const match = conditionsCatalog.find((cond) => cond.id === value);
      if (match && !this.playState.conditions.includes(match.id)) {
        this.playState.conditions.push(match.id);
        if (select) {
          select.value = '';
        }
        savePlayState(this.playState);
        this.render();
      }
      return;
    }
    if (action === 'remove') {
      if (!conditionId) return;
      this.playState.conditions = this.playState.conditions.filter((id) => id !== conditionId);
      savePlayState(this.playState);
      this.render();
    }
  }

  updateDeathSave(type, index, checked) {
    if (!['success', 'failure'].includes(type)) return;
    if (!Number.isInteger(index) || index < 0 || index > 2) return;
    const current = clamp(parseNumber(this.playState.deathSaves?.[type], 0), 0, 3);
    if (!this.playState.deathSaves || typeof this.playState.deathSaves !== 'object') {
      this.playState.deathSaves = { success: 0, failure: 0 };
    }
    if (checked) {
      this.playState.deathSaves[type] = Math.max(current, index + 1);
    } else {
      this.playState.deathSaves[type] = Math.min(current, index);
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
      const dc = this.playState.concentration.lastDc;
      const dcInfo = Number.isFinite(dc) ? ` Latest DC: ${dc}.` : '';
      const advantage = this.playState.concentration.warCaster ? ' (War Caster: roll with advantage)' : '';
      this.toast(`Maintain concentration on ${spell}.${dcInfo}${advantage}`);
    }
    if (action === 'damage') {
      const input = prompt('Damage taken while concentrating?');
      const damage = parseFloat(input);
      if (!Number.isFinite(damage) || damage <= 0) {
        this.toast('Enter a positive damage value.');
      } else {
        const dc = Math.max(10, Math.ceil(damage / 2));
        this.playState.concentration.lastDc = dc;
        const advantage = this.playState.concentration.warCaster;
        const suffix = advantage ? ' (War Caster: roll with advantage)' : '';
        this.toast(`Concentration DC ${dc}${suffix}`);
      }
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
      if (this.playState.spellcasting && this.playState.spellcasting.slots) {
        Object.values(this.playState.spellcasting.slots).forEach((slot) => {
          if (slot && typeof slot === 'object') {
            slot.used = 0;
          }
        });
      }
      this.resetCounters('long');
      if (this.playState.concentration.active) {
        if (confirm('End concentration due to completing a long rest?')) {
          this.playState.concentration.active = false;
          this.playState.concentration.spell = '';
        }
      }
      if (this.playState.deathSaves) {
        this.playState.deathSaves.success = 0;
        this.playState.deathSaves.failure = 0;
      }
      this.playState.hp.temp = 0;
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
    this.renderEquipment();
    this.renderCompanion();
    this.renderCounters();
    this.renderConcentration();
    this.renderConditions();
    this.renderUtilities();
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
        <summary>Skills &amp; Senses</summary>
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
      <details open>
        <summary>Equipment</summary>
        <div class="section-body" data-summary-section="equipment"></div>
      </details>
      <details open>
        <summary>Companion</summary>
        <div class="section-body" data-summary-section="companion"></div>
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
        <summary>Conditions &amp; Status</summary>
        <div class="section-body" data-summary-section="conditions"></div>
      </details>
      <details>
        <summary>Utilities</summary>
        <div class="section-body" data-summary-section="utilities"></div>
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
    const subclass = this.builderState?.data?.subclass;
    const background = this.builderState?.data?.background;
    const alignment = this.builderState?.data?.alignment;
    const level = this.getLevel();
    const classEntries = this.getClassEntries();
    let classLabel = '';
    if (classEntries.length === 1) {
      classLabel = classEntries[0].name || classEntries[0].class || '';
    } else if (classEntries.length > 1) {
      classLabel = classEntries
        .map((entry) => {
          const label = entry.name || entry.class || `Class ${entry.index + 1}`;
          return entry.level ? `${label} ${entry.level}` : label;
        })
        .join(' / ');
    } else if (this.builderState?.data?.class) {
      classLabel = this.builderState.data.class;
    }
    const parts = [];
    if (Number.isFinite(level) && level > 0) {
      if (classEntries.length > 1 && classLabel) {
        parts.push(`Level ${level} · ${classLabel}`);
      } else if (classLabel) {
        parts.push(`Level ${level} ${classLabel}`.trim());
      } else {
        parts.push(`Level ${level}`);
      }
    } else if (classLabel) {
      parts.push(classLabel);
    }
    if (subclass) parts.push(subclass);
    if (background) parts.push(`Background: ${background}`);
    if (alignment) parts.push(`Alignment: ${alignment}`);
    const subtitle = parts.filter(Boolean).join(' · ');
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

  renderSkills() {
    const container = this.root.querySelector('[data-summary-section="skills"]');
    if (!container) return;
    container.innerHTML = '';

    const header = createElement('div', 'skills-header');
    header.innerHTML = `
      <strong>Proficiency Bonus: ${this.getProficiencyBonus() >= 0 ? `+${this.getProficiencyBonus()}` : this.getProficiencyBonus()}</strong>
      <span>Toggle proficiency or expertise to update skill modifiers.</span>
    `;
    container.appendChild(header);

    const table = createElement('div', 'skills-table');
    skillDefinitions.forEach((skill) => {
      const state = this.getSkillState(skill.id);
      const modifier = this.getSkillModifier(skill.id);
      const modLabel = modifier >= 0 ? `+${modifier}` : `${modifier}`;
      const abilityMod = this.getAbilityModifier(skill.ability);
      const abilityLabel = abilityMod >= 0 ? `+${abilityMod}` : `${abilityMod}`;
      const row = createElement('div', 'skill-row');
      row.innerHTML = `
        <div class="skill-name">
          <strong>${skill.label}</strong>
          <small>${skill.ability.toUpperCase()} ${abilityLabel}</small>
        </div>
        <div class="skill-mod">${modLabel}</div>
        <label class="skill-toggle">Proficient
          <input type="checkbox" data-type="checkbox" data-skill-id="${skill.id}" data-skill-toggle="proficient" ${state.proficient ? 'checked' : ''}>
        </label>
        <label class="skill-toggle">Expertise
          <input type="checkbox" data-type="checkbox" data-skill-id="${skill.id}" data-skill-toggle="expertise" ${state.expertise ? 'checked' : ''}>
        </label>
      `;
      table.appendChild(row);
    });
    container.appendChild(table);

    const passiveGrid = createElement('div', 'passive-grid');
    passiveSkills.forEach((entry) => {
      const value = this.computePassiveScore(entry.id);
      const override = this.playState.passives?.[entry.id]?.override;
      const card = createElement('div', 'passive-card');
      card.innerHTML = `
        <h4>${entry.label}</h4>
        <div class="passive-value">${value}</div>
        <label>Override
          <input type="number" data-type="number" data-passive-id="${entry.id}" value="${override ?? ''}" placeholder="${value}">
        </label>
      `;
      passiveGrid.appendChild(card);
    });
    container.appendChild(passiveGrid);

    const notesGrid = createElement('div', 'skill-notes-grid');
    const sensesCard = createElement('div', 'skill-note-card');
    sensesCard.innerHTML = `
      <h4>Senses</h4>
      <textarea data-track="sensesNote" placeholder="Darkvision 60 ft, Tremorsense 30 ft">${this.playState.sensesNote || ''}</textarea>
    `;
    notesGrid.appendChild(sensesCard);

    const languageCard = createElement('div', 'skill-note-card');
    languageCard.innerHTML = `
      <h4>Languages</h4>
      <textarea data-track="languagesNote" placeholder="Common, Elvish, Thieves' Cant">${this.playState.languagesNote || ''}</textarea>
    `;
    notesGrid.appendChild(languageCard);

    container.appendChild(notesGrid);
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
    const hitDiceBreakdown = this.getHitDiceBreakdown();
    if (hitDiceBreakdown) {
      const helper = document.createElement('small');
      helper.textContent = `Builder hit dice: ${hitDiceBreakdown}`;
      helper.style.display = 'block';
      helper.style.marginTop = '0.35rem';
      helper.style.color = 'var(--muted)';
      hitDiceCard.appendChild(helper);
    }
    resourceGrid.appendChild(hitDiceCard);

    const deathCard = createElement('div', 'resource-card death-saves-card');
    const successBoxes = Array.from({ length: 3 }).map((_, index) => `
      <label>
        <input type="checkbox" data-type="checkbox" data-death-save="success" data-death-index="${index}" ${this.playState.deathSaves.success > index ? 'checked' : ''}>
        <span></span>
      </label>
    `).join('');
    const failureBoxes = Array.from({ length: 3 }).map((_, index) => `
      <label>
        <input type="checkbox" data-type="checkbox" data-death-save="failure" data-death-index="${index}" ${this.playState.deathSaves.failure > index ? 'checked' : ''}>
        <span></span>
      </label>
    `).join('');
    deathCard.innerHTML = `
      <h4>Death Saves</h4>
      <div class="death-save-row">
        <strong>Success</strong>
        <div class="death-save-track">${successBoxes}</div>
      </div>
      <div class="death-save-row">
        <strong>Failure</strong>
        <div class="death-save-track">${failureBoxes}</div>
      </div>
    `;
    resourceGrid.appendChild(deathCard);

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

  renderSpellcasting() {
    const container = this.root.querySelector('[data-summary-section="spellcasting"]');
    if (!container) return;
    container.innerHTML = '';

    if (!this.playState.spellcasting) {
      container.appendChild(createElement('p', 'summary-empty', 'No spellcasting data yet. Populate the builder or add notes here.'));
      return;
    }

    const overview = createElement('div', 'spellcasting-overview');
    overview.innerHTML = `
      <label>Prepared spells
        <textarea data-track="spellcasting.prepared" placeholder="Bless, Cure Wounds, Guiding Bolt">${this.playState.spellcasting.prepared || ''}</textarea>
      </label>
      <label>Known spells
        <textarea data-track="spellcasting.known" placeholder="Cantrips, rituals, leveled spells">${this.playState.spellcasting.known || ''}</textarea>
      </label>
      <label>Notes
        <textarea data-track="spellcasting.notes" placeholder="Focus, save DC, attack bonus">${this.playState.spellcasting.notes || ''}</textarea>
      </label>
    `;
    container.appendChild(overview);

    const slotGrid = createElement('div', 'spell-slot-grid');
    let hasSlots = false;
    for (let level = 1; level <= 9; level += 1) {
      const slot = this.playState.spellcasting.slots[level];
      if (!slot) continue;
      const available = Math.max(0, slot.max - slot.used);
      const card = createElement('div', 'spell-slot-card');
      card.innerHTML = `
        <h4>Level ${level}</h4>
        <p class="spell-slot-available">${available} available of ${slot.max}</p>
        <div class="spell-slot-controls">
          <label>Max <input type="number" data-type="number" data-spell-slot-field="max" data-spell-slot-level="${level}" value="${slot.max}" min="0"></label>
          <label>Used <input type="number" data-type="number" data-spell-slot-field="used" data-spell-slot-level="${level}" value="${slot.used}" min="0" max="${slot.max}"></label>
        </div>
        <div class="spell-slot-buttons">
          <button type="button" data-spell-slot-action="spend" data-spell-slot-level="${level}">Spend</button>
          <button type="button" data-spell-slot-action="recover" data-spell-slot-level="${level}">Recover</button>
          <button type="button" data-spell-slot-action="reset" data-spell-slot-level="${level}">Reset</button>
        </div>
      `;
      slotGrid.appendChild(card);
      if (slot.max > 0 || slot.used > 0) {
        hasSlots = true;
      }
    }

    if (!hasSlots) {
      const empty = createElement('p', 'summary-empty', 'Set spell slot maximums to track expended slots.');
      container.appendChild(empty);
    }

    container.appendChild(slotGrid);
  }

  renderEquipment() {
    const container = this.root.querySelector('[data-summary-section="equipment"]');
    if (!container) return;
    container.innerHTML = '';

    const equipment = this.builderState?.derived?.equipment;
    if (!equipment) {
      container.appendChild(createElement('p', 'summary-empty', 'Track weapons, armor, and gear to monitor encumbrance.'));
      return;
    }

    const hasEntries = Object.values(equipment.groups || {}).some((list) => Array.isArray(list) && list.length);
    if (!hasEntries) {
      const attune = equipment.attunement || { count: 0, limit: ATTUNEMENT_LIMIT };
      const message = `No equipment recorded. (${attune.count}/${attune.limit} attunements used)`;
      container.appendChild(createElement('p', 'summary-empty', message));
      return;
    }

    const statuses = [];
    const weaponMismatches = equipment.proficiency?.weaponMismatches || [];
    const armorMismatches = equipment.proficiency?.armorMismatches || [];
    const attunement = equipment.attunement || { count: 0, limit: ATTUNEMENT_LIMIT, exceeded: false };
    const encumbrance = equipment.encumbrance || { totalWeight: 0, capacity: 0, nearLimit: false, overLimit: false };

    statuses.push({
      text: weaponMismatches.length ? `⚠️ ${weaponMismatches.length} weapon${weaponMismatches.length === 1 ? '' : 's'} without proficiency` : '✅ Weapon proficiency',
      warn: weaponMismatches.length > 0
    });
    statuses.push({
      text: armorMismatches.length ? `⚠️ ${armorMismatches.length} armor item${armorMismatches.length === 1 ? '' : 's'} without proficiency` : '✅ Armor proficiency',
      warn: armorMismatches.length > 0
    });
    const attuneLabel = `${attunement.count}/${attunement.limit} attuned`;
    statuses.push({
      text: attunement.exceeded ? `⚠️ Attunement exceeded (${attuneLabel})` : `✅ Attunement ${attuneLabel}`,
      warn: attunement.exceeded
    });
    if (encumbrance.capacity > 0) {
      const weightText = formatWeight(encumbrance.totalWeight);
      const capacityText = formatWeight(encumbrance.capacity);
      if (encumbrance.overLimit) {
        statuses.push({ text: `⚠️ Over capacity (${weightText} / ${capacityText})`, warn: true });
      } else if (encumbrance.nearLimit) {
        statuses.push({ text: `⚠️ Near capacity (${weightText} / ${capacityText})`, warn: true });
      } else {
        statuses.push({ text: `✅ Weight ${weightText} of ${capacityText}`, warn: false });
      }
    } else {
      statuses.push({ text: `Equipment weight ${formatWeight(encumbrance.totalWeight)}`, warn: false });
    }

    const statusWrap = createElement('div', 'summary-equipment-status');
    statuses.forEach((entry) => {
      const badge = document.createElement('span');
      if (entry.warn) {
        badge.dataset.state = 'warn';
      }
      badge.textContent = entry.text;
      statusWrap.appendChild(badge);
    });
    container.appendChild(statusWrap);

    const currencyCard = createElement('div', 'currency-card');
    currencyCard.innerHTML = `
      <h4>Currency</h4>
      <div class="currency-grid">
        ${coinTypes.map((coin) => `
          <label>
            ${coin.label}
            <input type="number" data-type="number" data-currency-field="${coin.id}" value="${this.playState.currency?.[coin.id] ?? 0}" min="0">
          </label>
        `).join('')}
      </div>
    `;
    container.appendChild(currencyCard);

    const order = [
      { key: 'weapons', label: 'Weapons' },
      { key: 'armor', label: 'Armor & Shields' },
      { key: 'gear', label: 'Adventuring Gear' },
      { key: 'attunements', label: 'Attunements' }
    ];

    order.forEach(({ key, label }) => {
      const items = equipment.groups?.[key] || [];
      if (!items.length) return;
      container.appendChild(createElement('h4', null, label));
      const list = createElement('ul', 'summary-equipment-list');
      items.forEach((item) => {
        const row = createElement('li', 'summary-equipment-item');
        if ((key === 'weapons' || key === 'armor') && item.proficient === false) {
          row.dataset.state = 'warn';
        }
        const main = createElement('div', 'summary-equipment-main');
        main.appendChild(createElement('strong', null, item.name));
        const metaParts = [];
        if (item.category) metaParts.push(item.category);
        if (item.weightEach) metaParts.push(`${formatWeight(item.weightEach)} each`);
        if (item.source) metaParts.push(item.source);
        if (metaParts.length) {
          main.appendChild(createElement('span', null, metaParts.join(' · ')));
        }
        row.appendChild(main);

        const meta = createElement('div', 'summary-equipment-meta');
        if (key !== 'attunements') {
          meta.appendChild(createElement('span', null, `Qty ${item.quantity}`));
        } else {
          meta.appendChild(createElement('span', null, 'Attuned'));
        }
        if (item.totalWeight) {
          meta.appendChild(createElement('span', null, formatWeight(item.totalWeight)));
        }
        row.appendChild(meta);
        list.appendChild(row);
      });
      container.appendChild(list);
    });
  }

  renderCompanion() {
    const container = this.root.querySelector('[data-summary-section="companion"]');
    if (!container) return;
    container.innerHTML = '';

    const familiar = this.builderState?.data?.familiar || {};
    const snapshot = normalizeCompanionSnapshot(familiar.meta);
    const fallbackId = familiar.id || this.builderState?.data?.familiarType || '';
    const resolvedId = fallbackId || (snapshot ? snapshot.id : '');
    const customName = familiar.name || this.builderState?.data?.familiarName || '';
    const notes = familiar.notes || this.builderState?.data?.familiarNotes || '';
    const overrides = familiar.overrides || {};

    if (!resolvedId && !notes) {
      container.appendChild(createElement('p', 'summary-empty-note', 'No companion selected yet.'));
      return;
    }

    let entry = findCompanion(resolvedId);
    if (!entry && snapshot) {
      entry = snapshot;
    }

    if (!entry) {
      const card = createElement('div', 'summary-companion-card');
      const label = resolvedId ? `Companion data not found for ${resolvedId}.` : 'Companion data not available.';
      const info = createElement('p', 'summary-companion-meta');
      info.textContent = label;
      card.appendChild(info);
      if (notes) {
        const noteEl = createElement('p', 'summary-companion-notes');
        noteEl.textContent = notes;
        card.appendChild(noteEl);
      }
      container.appendChild(card);
      return;
    }

    const card = createElement('div', 'summary-companion-card');
    const header = document.createElement('header');
    const title = document.createElement('h4');
    title.textContent = customName || entry.name;
    header.appendChild(title);
    const subtitleParts = [];
    if (entry.cr) subtitleParts.push(`CR ${entry.cr}`);
    if (entry.size) subtitleParts.push(entry.size);
    if (entry.type) subtitleParts.push(entry.type);
    if (entry.alignment) subtitleParts.push(entry.alignment);
    if (subtitleParts.length) {
      const subtitle = document.createElement('span');
      subtitle.textContent = subtitleParts.join(' · ');
      header.appendChild(subtitle);
    }
    card.appendChild(header);

    if (customName && customName.toLowerCase() !== entry.name.toLowerCase()) {
      card.appendChild(createElement('p', 'summary-companion-meta', `Base creature: ${entry.name}`));
    }
    if (entry.summary) {
      const summaryEl = createElement('p', 'summary-companion-summary');
      summaryEl.textContent = entry.summary;
      card.appendChild(summaryEl);
    }

    const stats = document.createElement('div');
    stats.className = 'summary-companion-stats';
    let hasStats = false;
    const addChip = (label, value, note) => {
      const chip = document.createElement('span');
      chip.className = 'companion-chip';
      chip.append(document.createTextNode(`${label} `));
      const strong = document.createElement('strong');
      strong.textContent = String(value);
      chip.appendChild(strong);
      if (note) {
        const noteEl = document.createElement('span');
        noteEl.textContent = note;
        chip.appendChild(noteEl);
      }
      stats.appendChild(chip);
      hasStats = true;
    };

    const acOverride = Number.isFinite(overrides.ac) ? overrides.ac : null;
    const hpOverride = Number.isFinite(overrides.hp) ? overrides.hp : null;
    const speedOverride = overrides.speed ? overrides.speed : '';
    const acValue = acOverride ?? entry.ac;
    if (acValue !== null && acValue !== undefined && acValue !== '') {
      const note = acOverride && entry.ac !== null && entry.ac !== undefined && entry.ac !== '' ? `override · base ${entry.ac}` : (acOverride ? 'override' : '');
      addChip('AC', acValue, note);
    }
    const hpValue = hpOverride ?? entry.hp;
    if (hpValue !== null && hpValue !== undefined && hpValue !== '') {
      const note = hpOverride && entry.hp !== null && entry.hp !== undefined && entry.hp !== '' ? `override · base ${entry.hp}` : (hpOverride ? 'override' : '');
      addChip('HP', hpValue, note);
    }
    const speedValue = speedOverride || entry.speed;
    if (speedValue) {
      const note = speedOverride && entry.speed ? `override · base ${entry.speed}` : (speedOverride ? 'override' : '');
      addChip('Speed', speedValue, note);
    }
    if (hasStats) {
      card.appendChild(stats);
    }

    const appendMeta = (label, value) => {
      if (!value) return;
      const meta = createElement('p', 'summary-companion-meta');
      meta.textContent = `${label}: ${value}`;
      card.appendChild(meta);
    };

    if (entry.features.length) {
      appendMeta('Requires', entry.features.join(', '));
    }
    appendMeta('Senses', entry.senses);
    appendMeta('Skills', entry.skills);
    if (entry.traits.length) {
      const traitsList = createElement('ul', 'summary-companion-traits');
      entry.traits.forEach((trait) => {
        const item = document.createElement('li');
        item.textContent = trait;
        traitsList.appendChild(item);
      });
      card.appendChild(traitsList);
    }
    appendMeta('Source', entry.source);

    if (notes) {
      const noteEl = createElement('p', 'summary-companion-notes');
      noteEl.textContent = notes;
      card.appendChild(noteEl);
    }

    container.appendChild(card);
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
          <button type="button" data-concentration-action="damage">Record damage</button>
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
      <label style="justify-content:flex-start;gap:0.6rem;">War Caster advantage <input type="checkbox" data-type="checkbox" data-track="concentration.warCaster" ${concentration.warCaster ? 'checked' : ''}></label>
      ${Number.isFinite(concentration.lastDc) ? `<p class="concentration-dc">Last DC: ${concentration.lastDc}${concentration.warCaster ? ' (advantage)' : ''}</p>` : ''}
    `;

    container.appendChild(banner);
    container.appendChild(form);
  }

  renderConditions() {
    const container = this.root.querySelector('[data-summary-section="conditions"]');
    if (!container) return;
    container.innerHTML = '';

    const controls = createElement('div', 'condition-controls');
    const select = document.createElement('select');
    select.setAttribute('data-condition-select', '');
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Add condition…';
    select.appendChild(placeholder);
    conditionsCatalog.forEach((condition) => {
      const option = document.createElement('option');
      option.value = condition.id;
      option.textContent = condition.label;
      select.appendChild(option);
    });
    controls.appendChild(select);
    const addButton = createElement('button', null, 'Add');
    addButton.type = 'button';
    addButton.dataset.conditionAction = 'add';
    controls.appendChild(addButton);
    container.appendChild(controls);

    if (!Array.isArray(this.playState.conditions) || !this.playState.conditions.length) {
      container.appendChild(createElement('p', 'summary-empty', 'No active conditions.')); 
      return;
    }

    const chips = createElement('div', 'condition-chip-group');
    this.playState.conditions.forEach((id) => {
      const info = conditionsCatalog.find((entry) => entry.id === id) || { label: id, note: '' };
      const chip = createElement('div', 'condition-chip');
      chip.innerHTML = `
        <strong>${info.label}</strong>
        ${info.note ? `<span>${info.note}</span>` : ''}
        <button type="button" data-condition-action="remove" data-condition-id="${id}" aria-label="Remove ${info.label}">×</button>
      `;
      chips.appendChild(chip);
    });
    container.appendChild(chips);
  }

  renderUtilities() {
    const container = this.root.querySelector('[data-summary-section="utilities"]');
    if (!container) return;
    container.innerHTML = '';

    const utilitiesGrid = createElement('div', 'utilities-grid');

    const diceCard = createElement('div', 'utility-card dice-card');
    const quickButtons = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map((expr) => `<button type="button" data-roller-action="roll" data-dice-expression="${expr}">${expr}</button>`).join('');
    const history = Array.isArray(this.playState.dice?.history) ? this.playState.dice.history : [];
    const formatter = new Intl.DateTimeFormat(undefined, { timeStyle: 'short' });
    const historyList = history.length ? `<ul>${history.map((entry) => {
      const timestamp = entry && entry.rolledAt ? formatter.format(new Date(entry.rolledAt)) : '—';
      const expression = entry?.expression || '';
      const detail = entry?.detail || '';
      const total = entry?.total ?? '';
      return `<li><span>${timestamp}</span> <span>${expression}</span> <strong>${total}</strong> <small>${detail}</small></li>`;
    }).join('')}</ul>` : '<p class="summary-empty">Roll dice to populate history.</p>';
    diceCard.innerHTML = `
      <h4>Dice Roller</h4>
      <div class="dice-quick">${quickButtons}</div>
      <div class="dice-entry">
        <input type="text" data-roller-input placeholder="2d6+3" value="${this.playState.dice?.lastExpression || ''}">
        <button type="button" data-roller-action="roll">Roll</button>
        <button type="button" data-roller-action="clear">Clear</button>
      </div>
      <div class="dice-history">
        <strong>History</strong>
        ${historyList}
      </div>
    `;
    utilitiesGrid.appendChild(diceCard);

    const helper = this.playState.attackHelper || { attackTotal: '', ac: '', attackType: 'melee', attackerProne: false, defenderProne: false, result: '' };
    const attackCard = createElement('div', 'utility-card attack-card');
    attackCard.innerHTML = `
      <h4>Incoming Attack Helper</h4>
      <label>Total to hit
        <input type="number" data-type="number" data-attack-field="attackTotal" value="${helper.attackTotal === '' ? '' : helper.attackTotal}">
      </label>
      <label>Armor Class
        <input type="number" data-type="number" data-attack-field="ac" value="${helper.ac === '' ? '' : helper.ac}">
      </label>
      <label>Attack type
        <select data-attack-field="attackType">
          <option value="melee" ${helper.attackType === 'melee' ? 'selected' : ''}>Melee</option>
          <option value="ranged" ${helper.attackType === 'ranged' ? 'selected' : ''}>Ranged</option>
        </select>
      </label>
      <div class="attack-toggles">
        <label><input type="checkbox" data-type="checkbox" data-attack-field="attackerProne" ${helper.attackerProne ? 'checked' : ''}> Attacker prone</label>
        <label><input type="checkbox" data-type="checkbox" data-attack-field="defenderProne" ${helper.defenderProne ? 'checked' : ''}> Defender prone</label>
      </div>
      <div class="attack-buttons">
        <button type="button" data-attack-action="evaluate">Evaluate</button>
        <button type="button" data-attack-action="prone-matrix">Prone guidance</button>
        <button type="button" data-attack-action="reset">Reset</button>
      </div>
      <p class="attack-result">${helper.result || 'Enter values to evaluate hit or miss.'}</p>
    `;
    utilitiesGrid.appendChild(attackCard);

    container.appendChild(utilitiesGrid);
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
