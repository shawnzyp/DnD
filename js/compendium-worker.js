const TYPE_LABELS = {
  spell: 'Spell',
  feat: 'Feat',
  item: 'Item',
  rule: 'Rule',
  monster: 'Monster',
  skill: 'Skill'
};

let entries = [];
let counts = {
  spells: 0,
  feats: 0,
  items: 0,
  rules: 0,
  monsters: 0,
  skills: 0,
  total: 0
};

function summarise(text) {
  const value = (text || '').toString().trim();
  if (!value) {
    return 'Open the detail drawer for full rules text.';
  }
  return value.length > 160 ? `${value.slice(0, 157)}…` : value;
}

function normaliseLines(value) {
  return (value || '').toString().replace(/\r\n?/g, '\n').trim();
}

function formatSourceBadge(source) {
  if (!source) return '';
  const parts = [];
  if (source.name) parts.push(source.name);
  if (source.edition) parts.push(source.edition);
  return parts.join(' · ');
}

function formatSourceDetail(source) {
  if (!source) return '';
  const parts = [];
  if (source.name) parts.push(source.name);
  if (source.edition) parts.push(source.edition);
  if (source.license) parts.push(source.license);
  return parts.length ? `Source: ${parts.join(' • ')}` : '';
}

function pushTag(tags, value) {
  const str = (value || '').toString().trim();
  if (str) tags.add(str);
}

function abilityAbbreviation(key) {
  if (!key) return '';
  const normalized = key.toString().toLowerCase();
  const lookup = {
    strength: 'STR',
    str: 'STR',
    dexterity: 'DEX',
    dex: 'DEX',
    constitution: 'CON',
    con: 'CON',
    intelligence: 'INT',
    int: 'INT',
    wisdom: 'WIS',
    wis: 'WIS',
    charisma: 'CHA',
    cha: 'CHA'
  };
  return lookup[normalized] || normalized.slice(0, 3).toUpperCase();
}

function formatAbilityMod(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) return '';
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function formatSpeed(speed) {
  if (!speed) return '';
  if (typeof speed === 'string') return speed;
  if (typeof speed === 'object') {
    const parts = Object.entries(speed)
      .filter(([, value]) => value)
      .map(([mode, value]) => {
        const label = mode.replace(/_/g, ' ');
        return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${value}`;
      });
    return parts.join(', ');
  }
  return '';
}

function formatKeyedBonuses(record, formatter = (key) => key) {
  if (!record || typeof record !== 'object') return '';
  const parts = Object.entries(record)
    .filter(([, value]) => value !== undefined && value !== null && `${value}`.trim())
    .map(([key, value]) => `${formatter(key)} ${value}`);
  return parts.join(', ');
}

function formatArray(values) {
  if (!Array.isArray(values)) return '';
  return values.filter(Boolean).join(', ');
}

function formatMonsterTraits(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => ({
      name: (item?.name || '').toString().trim(),
      text: normaliseLines(item?.text || item?.description || '')
    }))
    .filter((item) => item.name || item.text);
}

function buildSpellEntry(spell) {
  const description = normaliseLines(spell.description || spell.text || spell.summary || '');
  const badge = formatSourceBadge(spell.source);
  const subtitleParts = [TYPE_LABELS.spell];
  const tags = new Set();
  tags.add(TYPE_LABELS.spell);
  if (typeof spell.level === 'number') {
    subtitleParts.push(`Level ${spell.level}`);
    pushTag(tags, `Level ${spell.level}`);
  }
  if (spell.school) {
    subtitleParts.push(spell.school);
    pushTag(tags, spell.school);
  }
  if (badge) subtitleParts.push(badge);
  const stats = [];
  if (typeof spell.level === 'number') {
    stats.push({ label: 'Level', value: `${spell.level}` });
  }
  if (spell.school) stats.push({ label: 'School', value: spell.school });
  if (spell.casting_time) stats.push({ label: 'Casting Time', value: spell.casting_time });
  if (spell.range) stats.push({ label: 'Range', value: spell.range });
  if (spell.duration) stats.push({ label: 'Duration', value: spell.duration });
  if (spell.components) stats.push({ label: 'Components', value: spell.components });
  if (Array.isArray(spell.classes) && spell.classes.length) {
    stats.push({ label: 'Classes', value: spell.classes.join(', ') });
    spell.classes.forEach((cls) => pushTag(tags, cls));
  }
  pushTag(tags, badge);
  const detailParts = [
    `${spell.school || 'Spell'} • Level ${typeof spell.level === 'number' ? spell.level : 0}`,
    spell.casting_time ? `Casting Time: ${spell.casting_time}` : '',
    spell.range ? `Range: ${spell.range}` : '',
    spell.components ? `Components: ${spell.components}` : '',
    spell.duration ? `Duration: ${spell.duration}` : '',
    '',
    description,
    '',
    formatSourceDetail(spell.source)
  ].filter(Boolean);
  return {
    id: `spell:${spell.slug}`,
    slug: spell.slug,
    name: spell.name,
    type: 'spell',
    summary: summarise(description),
    subtitle: subtitleParts.filter(Boolean).join(' · '),
    body: detailParts.join('\n'),
    stats,
    tags: Array.from(tags).filter(Boolean),
    searchText: [
      spell.name,
      spell.school,
      spell.casting_time,
      spell.range,
      spell.components,
      Array.isArray(spell.classes) ? spell.classes.join(' ') : '',
      description,
      formatSourceDetail(spell.source)
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
  };
}

function buildFeatEntry(feat) {
  const description = normaliseLines(feat.description || feat.summary || feat.text || '');
  const badge = formatSourceBadge(feat.source);
  const subtitleParts = [TYPE_LABELS.feat];
  const tags = new Set();
  tags.add(TYPE_LABELS.feat);
  if (badge) subtitleParts.push(badge);
  pushTag(tags, badge);
  const prereqs = Array.isArray(feat.prerequisites) ? feat.prerequisites.filter(Boolean) : [];
  const stats = [];
  if (prereqs.length) {
    stats.push({ label: 'Prerequisites', value: prereqs.join(', ') });
    prereqs.forEach((prereq) => pushTag(tags, prereq));
  }
  const sourceDetail = formatSourceDetail(feat.source);
  if (sourceDetail) stats.push({ label: 'Source', value: sourceDetail.replace('Source: ', '') });
  const detailParts = [TYPE_LABELS.feat, '', description, '', sourceDetail].filter(Boolean);
  return {
    id: `feat:${feat.slug}`,
    slug: feat.slug,
    name: feat.name,
    type: 'feat',
    summary: summarise(description),
    subtitle: subtitleParts.filter(Boolean).join(' · '),
    body: detailParts.join('\n'),
    stats,
    tags: Array.from(tags).filter(Boolean),
    searchText: [feat.name, prereqs.join(' '), description, sourceDetail]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
  };
}

function buildItemEntry(item) {
  const description = normaliseLines(item.description || item.summary || '');
  const badge = formatSourceBadge(item.source);
  const subtitleParts = [TYPE_LABELS.item];
  const tags = new Set();
  tags.add(TYPE_LABELS.item);
  if (item.category) {
    subtitleParts.push(item.category);
    pushTag(tags, item.category);
  }
  if (badge) subtitleParts.push(badge);
  pushTag(tags, badge);
  const stats = [];
  if (item.category) stats.push({ label: 'Category', value: item.category });
  if (item.cost) stats.push({ label: 'Cost', value: item.cost });
  if (item.weight !== undefined && item.weight !== null) {
    stats.push({ label: 'Weight', value: `${item.weight} lb${item.weight === 1 ? '' : 's'}` });
  }
  if (item.damage) stats.push({ label: 'Damage', value: item.damage });
  if (Array.isArray(item.properties) && item.properties.length) {
    stats.push({ label: 'Properties', value: item.properties.join(', ') });
    item.properties.forEach((property) => pushTag(tags, property));
  }
  const detailParts = [
    `${item.category || 'Item'}`,
    item.damage ? `Damage: ${item.damage}` : '',
    item.cost ? `Cost: ${item.cost}` : '',
    item.weight !== undefined && item.weight !== null ? `Weight: ${item.weight} lb${item.weight === 1 ? '' : 's'}` : '',
    '',
    description,
    '',
    formatSourceDetail(item.source)
  ].filter(Boolean);
  return {
    id: `item:${item.slug}`,
    slug: item.slug,
    name: item.name,
    type: 'item',
    summary: summarise(description),
    subtitle: subtitleParts.filter(Boolean).join(' · '),
    body: detailParts.join('\n'),
    stats,
    tags: Array.from(tags).filter(Boolean),
    searchText: [
      item.name,
      item.category,
      item.damage,
      item.cost,
      item.weight,
      Array.isArray(item.properties) ? item.properties.join(' ') : '',
      description,
      formatSourceDetail(item.source)
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
  };
}

function buildRuleEntry(rule) {
  const description = normaliseLines(rule.description || rule.text || rule.summary || '');
  const badge = formatSourceBadge(rule.source);
  const subtitleParts = [TYPE_LABELS.rule];
  const tags = new Set();
  tags.add(TYPE_LABELS.rule);
  if (rule.section) {
    subtitleParts.push(rule.section);
    pushTag(tags, rule.section);
  }
  if (badge) subtitleParts.push(badge);
  pushTag(tags, badge);
  const stats = [];
  if (rule.section) stats.push({ label: 'Section', value: rule.section });
  const sourceDetail = formatSourceDetail(rule.source);
  if (sourceDetail) stats.push({ label: 'Source', value: sourceDetail.replace('Source: ', '') });
  const detailParts = [rule.section || TYPE_LABELS.rule, '', description, '', sourceDetail].filter(Boolean);
  return {
    id: `rule:${rule.slug}`,
    slug: rule.slug,
    name: rule.name,
    type: 'rule',
    summary: summarise(description),
    subtitle: subtitleParts.filter(Boolean).join(' · '),
    body: detailParts.join('\n'),
    stats,
    tags: Array.from(tags).filter(Boolean),
    searchText: [rule.name, rule.section, description, sourceDetail]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
  };
}

function buildSkillEntry(skill) {
  const description = normaliseLines(skill.description || skill.text || '');
  const overview = skill.summary ? skill.summary.toString().trim() : description;
  const badge = formatSourceBadge(skill.source);
  const ability = abilityAbbreviation(skill.ability);
  const examples = Array.isArray(skill.examples) ? skill.examples.filter(Boolean) : [];
  const tags = new Set([TYPE_LABELS.skill]);
  const stats = [];

  if (ability) {
    stats.push({ label: 'Ability', value: ability });
    pushTag(tags, ability);
    pushTag(tags, `${ability} Skill`);
  }
  if (examples.length) {
    stats.push({ label: 'Common Uses', value: examples.join(', ') });
  }
  const sourceDetail = formatSourceDetail(skill.source);
  if (sourceDetail) {
    stats.push({ label: 'Source', value: sourceDetail.replace('Source: ', '') });
  }
  pushTag(tags, badge);

  const detailParts = [
    `${TYPE_LABELS.skill}${ability ? ` (${ability})` : ''}`,
    '',
    description,
    '',
    examples.length ? `Examples: ${examples.join('; ')}` : '',
    '',
    sourceDetail
  ].filter(Boolean);

  return {
    id: `skill:${skill.slug}`,
    slug: skill.slug,
    name: skill.name,
    type: 'skill',
    summary: summarise(overview),
    subtitle: [TYPE_LABELS.skill, ability, badge].filter(Boolean).join(' · '),
    body: detailParts.join('\n'),
    stats,
    tags: Array.from(tags).filter(Boolean),
    searchText: [skill.name, ability, examples.join(' '), description, sourceDetail]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
  };
}

function buildMonsterEntry(monster) {
  const description = normaliseLines(monster.description || monster.text || monster.summary || '');
  const badge = formatSourceBadge(monster.source);
  const sizeType = [monster.size, monster.creatureType].filter(Boolean).join(' ');
  const xp = typeof monster.experience === 'number' ? monster.experience : null;
  const challenge = monster.challengeRating
    ? `CR ${monster.challengeRating}${xp !== null ? ` (${xp.toLocaleString()} XP)` : ''}`
    : '';
  const proficiency = monster.proficiencyBonus ? `PB ${monster.proficiencyBonus}` : '';
  const armorClass = monster.armorClassType
    ? `${monster.armorClass} (${monster.armorClassType})`
    : monster.armorClass !== undefined
    ? `${monster.armorClass}`
    : '';
  const hitPoints = monster.hitDice
    ? `${monster.hitPoints} (${monster.hitDice})`
    : monster.hitPoints !== undefined
    ? `${monster.hitPoints}`
    : '';
  const speed = formatSpeed(monster.speed);
  const savingThrows = formatKeyedBonuses(monster.savingThrows, abilityAbbreviation);
  const skillList = formatKeyedBonuses(monster.skills, (key) => key);
  const resistances = formatArray(monster.damageResistances);
  const vulnerabilities = formatArray(monster.damageVulnerabilities);
  const immunities = formatArray(monster.damageImmunities);
  const conditionImmunities = formatArray(monster.conditionImmunities);
  const senses = formatArray(monster.senses);
  const languages = formatArray(monster.languages);
  const traits = formatMonsterTraits(monster.traits);
  const actions = formatMonsterTraits(monster.actions);
  const reactions = formatMonsterTraits(monster.reactions);
  const legendaryActions = formatMonsterTraits(monster.legendaryActions);

  const abilities = Object.entries(monster.abilityScores || {})
    .filter(([, value]) => typeof value === 'number' && !Number.isNaN(value))
    .map(([ability, score]) => ({
      ability: abilityAbbreviation(ability),
      score,
      mod: formatAbilityMod(score)
    }));

  const subtitleParts = [TYPE_LABELS.monster];
  if (sizeType) subtitleParts.push(sizeType);
  if (challenge) subtitleParts.push(challenge);
  if (badge) subtitleParts.push(badge);

  const tags = new Set([TYPE_LABELS.monster]);
  pushTag(tags, sizeType);
  pushTag(tags, monster.alignment);
  pushTag(tags, challenge);
  pushTag(tags, badge);

  const stats = [
    armorClass ? { label: 'Armor Class', value: armorClass } : null,
    hitPoints ? { label: 'Hit Points', value: hitPoints } : null,
    speed ? { label: 'Speed', value: speed } : null,
    challenge ? { label: 'Challenge', value: challenge } : null,
    proficiency ? { label: 'Proficiency Bonus', value: monster.proficiencyBonus } : null
  ].filter(Boolean);

  const sourceDetail = formatSourceDetail(monster.source);
  if (sourceDetail) {
    stats.push({ label: 'Source', value: sourceDetail.replace('Source: ', '') });
  }

  const detailParts = [sizeType || TYPE_LABELS.monster, monster.alignment, '', description, '', sourceDetail]
    .filter(Boolean);

  const searchSegments = [
    monster.name,
    sizeType,
    monster.alignment,
    challenge,
    armorClass,
    hitPoints,
    speed,
    savingThrows,
    skillList,
    resistances,
    vulnerabilities,
    immunities,
    conditionImmunities,
    senses,
    languages,
    description,
    traits.map((trait) => trait.text).join(' '),
    actions.map((action) => action.text).join(' '),
    reactions.map((reaction) => reaction.text).join(' '),
    legendaryActions.map((legendary) => legendary.text).join(' '),
    sourceDetail
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const meta = [monster.alignment, challenge, proficiency, badge].filter(Boolean);

  const monsterPanel = {
    sizeType,
    meta,
    armorClass,
    hitPoints,
    speed,
    savingThrows,
    skills: skillList,
    damageResistances: resistances,
    damageVulnerabilities: vulnerabilities,
    damageImmunities: immunities,
    conditionImmunities,
    senses,
    languages,
    traits,
    actions,
    reactions,
    legendaryActions,
    abilities
  };

  return {
    id: `monster:${monster.slug}`,
    slug: monster.slug,
    name: monster.name,
    type: 'monster',
    summary: summarise(monster.summary || description),
    subtitle: subtitleParts.filter(Boolean).join(' · '),
    body: detailParts.join('\n'),
    stats,
    tags: Array.from(tags).filter(Boolean),
    searchText: searchSegments,
    monster: monsterPanel
  };
}

function buildEntries(payload) {
  const list = [];
  const spells = Array.isArray(payload?.spells) ? payload.spells : [];
  const feats = Array.isArray(payload?.feats) ? payload.feats : [];
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const rules = Array.isArray(payload?.rules) ? payload.rules : [];
  const monsters = Array.isArray(payload?.monsters) ? payload.monsters : [];
  const skills = Array.isArray(payload?.skills) ? payload.skills : [];

  spells.forEach((spell) => list.push(buildSpellEntry(spell)));
  feats.forEach((feat) => list.push(buildFeatEntry(feat)));
  items.forEach((item) => list.push(buildItemEntry(item)));
  rules.forEach((rule) => list.push(buildRuleEntry(rule)));
  skills.forEach((skill) => list.push(buildSkillEntry(skill)));
  monsters.forEach((monster) => list.push(buildMonsterEntry(monster)));

  list.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

  counts = {
    spells: spells.length,
    feats: feats.length,
    items: items.length,
    rules: rules.length,
    monsters: monsters.length,
    skills: skills.length,
    total: list.length
  };

  return list;
}

function handleHydrate(payload) {
  entries = buildEntries(payload);
  postMessage({ type: 'hydrate', counts });
}

function handleQuery(message) {
  const requestId = message.requestId;
  const filters = Array.isArray(message.filters) ? message.filters.filter(Boolean) : [];
  const filterSet = filters.length ? new Set(filters) : null;
  const query = (message.query || '').toString().trim().toLowerCase();
  const chunkSize = typeof message.chunkSize === 'number' && message.chunkSize > 0 ? message.chunkSize : 60;
  const chunk = [];
  let total = 0;
  let first = true;

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    if (filterSet && !filterSet.has(entry.type)) {
      continue;
    }
    if (query && !entry.searchText.includes(query)) {
      continue;
    }
    total += 1;
    chunk.push(entry);
    if (chunk.length >= chunkSize) {
      postMessage({
        type: 'results',
        requestId,
        chunk: chunk.splice(0),
        total,
        reset: first,
        done: false
      });
      first = false;
    }
  }

  postMessage({
    type: 'results',
    requestId,
    chunk: chunk.splice(0),
    total,
    reset: first,
    done: true
  });
}

self.addEventListener('message', (event) => {
  const { type } = event.data || {};
  if (type === 'hydrate') {
    handleHydrate(event.data.payload || {});
  } else if (type === 'query') {
    handleQuery(event.data);
  }
});
