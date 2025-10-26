const TYPE_LABELS = { spell: 'Spell', feat: 'Feat', item: 'Item', rule: 'Rule' };

let entries = [];
let searchVectors = [];
let tokenIndex = new Map();

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'hydrate') {
    hydrateIndex(data.payload || {});
  } else if (data.type === 'search') {
    runSearch(data.requestId, data.payload || {});
  }
});

function hydrateIndex(payload) {
  const built = buildEntries(payload || {});
  entries = built.entries;
  searchVectors = built.searchVectors;
  tokenIndex = built.tokenIndex;
  self.postMessage({ type: 'index-ready', total: entries.length });
}

function runSearch(requestId, payload) {
  const query = (payload.query || '').toString().trim().toLowerCase();
  const filters = Array.isArray(payload.filters) ? payload.filters : [];

  let candidateIndexes = entries.map((_, index) => index);
  if (query) {
    const tokens = tokenize(query);
    if (tokens.length) {
      const intersected = intersectTokens(tokens);
      if (intersected.length) {
        candidateIndexes = intersected;
      }
    }
    candidateIndexes = candidateIndexes.filter((index) => searchVectors[index].includes(query));
    if (!candidateIndexes.length) {
      candidateIndexes = entries
        .map((_, index) => index)
        .filter((index) => searchVectors[index].includes(query));
    }
  }

  const results = [];
  for (let i = 0; i < candidateIndexes.length; i += 1) {
    const entry = entries[candidateIndexes[i]];
    if (!entry) continue;
    if (filters.length && !filters.includes(entry.type)) continue;
    results.push(entry);
  }

  const total = results.length;
  self.postMessage({ type: 'results-start', requestId, total });
  const chunkSize = 60;
  for (let offset = 0; offset < total; offset += chunkSize) {
    const chunk = results.slice(offset, offset + chunkSize);
    self.postMessage({ type: 'results-chunk', requestId, offset, items: chunk });
  }
  self.postMessage({ type: 'results-end', requestId, total });
}

function buildEntries(payload) {
  const { spells = [], feats = [], items = [], rules = [] } = payload;
  const constructed = [];

  spells.forEach((spell) => {
    const entry = buildSpellEntry(spell);
    if (entry) constructed.push(entry);
  });
  feats.forEach((feat) => {
    const entry = buildFeatEntry(feat);
    if (entry) constructed.push(entry);
  });
  items.forEach((item) => {
    const entry = buildItemEntry(item);
    if (entry) constructed.push(entry);
  });
  rules.forEach((rule) => {
    const entry = buildRuleEntry(rule);
    if (entry) constructed.push(entry);
  });

  constructed.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

  const vectors = [];
  const index = new Map();

  constructed.forEach((entry, position) => {
    const statsText = Array.isArray(entry.stats)
      ? entry.stats.map((stat) => `${stat.label} ${stat.value}`).join(' ')
      : '';
    const searchField = [
      entry.name,
      entry.subtitle,
      entry.summary,
      entry.description,
      entry.sourceDetail,
      Array.isArray(entry.tags) ? entry.tags.join(' ') : '',
      statsText
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    vectors.push(searchField);
    const tokens = tokenize(searchField);
    tokens.forEach((token) => {
      if (!index.has(token)) {
        index.set(token, new Set());
      }
      index.get(token).add(position);
    });
  });

  return {
    entries: constructed,
    searchVectors: vectors,
    tokenIndex: index
  };
}

function buildSpellEntry(spell) {
  if (!spell) return null;
  const slug = spell.slug || spell.id || null;
  const name = spell.name || slug;
  if (!slug || !name) return null;
  const description = normaliseText(spell.description);
  const level = typeof spell.level === 'number' ? spell.level : null;
  const sourceLabel = formatSourceBadge(spell.source);
  const subtitle = [TYPE_LABELS.spell, level !== null ? `Level ${level}` : '', spell.school, sourceLabel]
    .filter(Boolean)
    .join(' · ');
  const stats = [];
  if (level !== null) stats.push({ label: 'Level', value: `Level ${level}` });
  if (spell.school) stats.push({ label: 'School', value: spell.school });
  if (spell.casting_time) stats.push({ label: 'Casting Time', value: spell.casting_time });
  if (spell.range) stats.push({ label: 'Range', value: spell.range });
  if (spell.components) stats.push({ label: 'Components', value: spell.components });
  if (spell.duration) stats.push({ label: 'Duration', value: spell.duration });

  const tags = uniqStrings([
    TYPE_LABELS.spell,
    level !== null ? `Level ${level}` : '',
    spell.school || '',
    sourceLabel || ''
  ]);

  return {
    id: `spell:${slug}`,
    slug,
    name,
    type: 'spell',
    level,
    school: spell.school || '',
    category: '',
    subtitle,
    summary: summarise(description),
    description,
    stats,
    tags,
    sourceLabel,
    sourceDetail: formatSourceDetail(spell.source)
  };
}

function buildFeatEntry(feat) {
  if (!feat) return null;
  const slug = feat.slug || feat.id || null;
  const name = feat.name || slug;
  if (!slug || !name) return null;
  const description = normaliseText(feat.description);
  const sourceLabel = formatSourceBadge(feat.source);
  const subtitle = [TYPE_LABELS.feat, sourceLabel].filter(Boolean).join(' · ');
  const stats = [];
  if (sourceLabel) stats.push({ label: 'Source', value: sourceLabel });
  return {
    id: `feat:${slug}`,
    slug,
    name,
    type: 'feat',
    level: null,
    school: '',
    category: '',
    subtitle,
    summary: summarise(description),
    description,
    stats,
    tags: uniqStrings([TYPE_LABELS.feat, sourceLabel || '']),
    sourceLabel,
    sourceDetail: formatSourceDetail(feat.source)
  };
}

function buildItemEntry(item) {
  if (!item) return null;
  const slug = item.slug || item.id || null;
  const name = item.name || slug;
  if (!slug || !name) return null;
  const description = normaliseText(item.description);
  const sourceLabel = formatSourceBadge(item.source);
  const subtitle = [TYPE_LABELS.item, item.category || '', sourceLabel].filter(Boolean).join(' · ');
  const stats = [];
  if (item.category) stats.push({ label: 'Category', value: item.category });
  if (item.cost) stats.push({ label: 'Cost', value: item.cost });
  if (item.weight) stats.push({ label: 'Weight', value: item.weight });
  if (sourceLabel) stats.push({ label: 'Source', value: sourceLabel });
  const tags = uniqStrings([TYPE_LABELS.item, item.category || '', sourceLabel || '']);
  return {
    id: `item:${slug}`,
    slug,
    name,
    type: 'item',
    level: null,
    school: '',
    category: item.category || '',
    subtitle,
    summary: summarise(description),
    description,
    stats,
    tags,
    sourceLabel,
    sourceDetail: formatSourceDetail(item.source)
  };
}

function buildRuleEntry(rule) {
  if (!rule) return null;
  const slug = rule.slug || rule.id || null;
  const name = rule.name || slug;
  if (!slug || !name) return null;
  const description = normaliseText(rule.description);
  const sourceLabel = formatSourceBadge(rule.source);
  const subtitle = [TYPE_LABELS.rule, rule.category || '', sourceLabel].filter(Boolean).join(' · ');
  const stats = [];
  if (rule.category) stats.push({ label: 'Category', value: rule.category });
  if (sourceLabel) stats.push({ label: 'Source', value: sourceLabel });
  const tags = uniqStrings([TYPE_LABELS.rule, rule.category || '', sourceLabel || '']);
  return {
    id: `rule:${slug}`,
    slug,
    name,
    type: 'rule',
    level: null,
    school: '',
    category: rule.category || '',
    subtitle,
    summary: summarise(description),
    description,
    stats,
    tags,
    sourceLabel,
    sourceDetail: formatSourceDetail(rule.source)
  };
}

function normaliseText(value) {
  return (value || '')
    .toString()
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function summarise(value) {
  if (!value) return 'Open the detail drawer for full rules text.';
  return value.length > 160 ? `${value.slice(0, 157)}…` : value;
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

function tokenize(text) {
  return Array.from(new Set(text.split(/[^a-z0-9]+/i).map((token) => token.trim().toLowerCase()).filter(Boolean)));
}

function intersectTokens(tokens) {
  let result = null;
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const hits = tokenIndex.get(token);
    if (!hits || !hits.size) {
      return [];
    }
    const ordered = Array.from(hits);
    if (result === null) {
      result = ordered;
      continue;
    }
    const set = new Set(ordered);
    result = result.filter((index) => set.has(index));
    if (!result.length) {
      return [];
    }
  }
  return result || [];
}

function uniqStrings(list) {
  const seen = new Set();
  const output = [];
  list.forEach((item) => {
    const value = (item || '').toString().trim();
    if (!value || seen.has(value.toLowerCase())) return;
    seen.add(value.toLowerCase());
    output.push(value);
  });
  return output;
}
