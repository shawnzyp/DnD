const TYPE_LABELS = {
  spell: 'Spell',
  feat: 'Feat',
  item: 'Item',
  rule: 'Rule'
};

let entries = [];
let counts = { spells: 0, feats: 0, items: 0, rules: 0, total: 0 };

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

function buildEntries(payload) {
  const list = [];
  const spells = Array.isArray(payload?.spells) ? payload.spells : [];
  const feats = Array.isArray(payload?.feats) ? payload.feats : [];
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const rules = Array.isArray(payload?.rules) ? payload.rules : [];

  spells.forEach((spell) => list.push(buildSpellEntry(spell)));
  feats.forEach((feat) => list.push(buildFeatEntry(feat)));
  items.forEach((item) => list.push(buildItemEntry(item)));
  rules.forEach((rule) => list.push(buildRuleEntry(rule)));

  list.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

  counts = {
    spells: spells.length,
    feats: feats.length,
    items: items.length,
    rules: rules.length,
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
