function getPackData() {
  return window.dndData || { classes: [], backgrounds: [], feats: [], items: [], companions: [] };
}

function resolveByValue(list, value) {
  if (!value) return null;
  return (list || []).find(entry => entry.slug === value || entry.id === value || entry.name === value || entry.title === value) || null;
}

function formatCompanion(value) {
  if (!value) return '';
  const { companions = [] } = getPackData();
  const match = resolveByValue(companions, value);
  if (!match) return value;
  const role = match.role ? ` – ${match.role}` : '';
  return `${match.name}${role}`;
}

function formatBackground(value) {
  if (!value) return '';
  const { backgrounds = [] } = getPackData();
  const match = resolveByValue(backgrounds, value);
  return match ? match.name : value;
}

function formatClass(value) {
  if (!value) return '';
  const { classes = [] } = getPackData();
  const match = resolveByValue(classes, value);
  return match ? match.name : value;
}

function renderSummary(state) {
  const list = document.getElementById('summary-list');
  if (!list) return;
  list.innerHTML = '';
  const { data = {} } = state || {};
  const entries = [
    { label: 'Name', value: data.name },
    { label: 'Background', value: formatBackground(data.background) },
    { label: 'Alignment', value: data.alignment },
    { label: 'Class', value: formatClass(data.class) },
    { label: 'Level', value: data.level },
    { label: 'Subclass', value: data.subclass },
    { label: 'Ability Scores', value: ['str','dex','con','int','wis','cha'].map(id => `${id.toUpperCase()}: ${data[id] || '--'}`).join(' · ') },
    { label: 'Signature Feat', value: data.signatureFeat },
    { label: 'Gear', value: data.gear },
    { label: 'Familiar', value: data.familiarName ? `${data.familiarName} (${formatCompanion(data.familiarType) || 'unknown'})` : formatCompanion(data.familiarType) }
  ];

  entries.forEach(entry => {
    if (!entry.value) return;
    const item = document.createElement('li');
    item.innerHTML = `<strong style="display:block;font-size:0.8rem;color:rgba(255,255,255,0.6);">${entry.label}</strong>${entry.value}`;
    list.appendChild(item);
  });

  if (!list.children.length) {
    const empty = document.createElement('li');
    empty.textContent = 'Start filling out the wizard to see your summary.';
    list.appendChild(empty);
  }
}

window.addEventListener('dnd-builder-updated', (event) => {
  renderSummary(event.detail);
});

document.addEventListener('DOMContentLoaded', () => {
  if (window.dndBuilderState) {
    renderSummary(window.dndBuilderState);
  }
});
