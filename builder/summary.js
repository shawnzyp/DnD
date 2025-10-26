function renderSummary(state) {
  const list = document.getElementById('summary-list');
  if (!list) return;
  list.innerHTML = '';
  const { data = {} } = state || {};
  const entries = [
    { label: 'Name', value: data.name },
    { label: 'Background', value: data.background },
    { label: 'Alignment', value: data.alignment },
    { label: 'Class', value: data.class },
    { label: 'Level', value: data.level },
    { label: 'Subclass', value: data.subclass },
    { label: 'Ability Scores', value: ['str','dex','con','int','wis','cha'].map(id => `${id.toUpperCase()}: ${data[id] || '--'}`).join(' · ') },
    { label: 'Signature Feat', value: data.signatureFeat },
    { label: 'Gear', value: data.gear },
    { label: 'Familiar', value: data.familiarName ? `${data.familiarName} (${data.familiarType || 'unknown'})` : '' }
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
