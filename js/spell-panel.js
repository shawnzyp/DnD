function formatLevel(level) {
  if (!Number.isFinite(level)) return '';
  if (level === 0) return 'Cantrip';
  const suffix = level === 1 ? 'st' : level === 2 ? 'nd' : level === 3 ? 'rd' : 'th';
  return `${level}${suffix}-level`;
}

function createChip(text) {
  const chip = document.createElement('span');
  chip.className = 'spell-panel__chip';
  chip.textContent = text;
  return chip;
}

function appendStat(list, label, value) {
  if (!value) return;
  const dt = document.createElement('dt');
  dt.textContent = label;
  const dd = document.createElement('dd');
  dd.textContent = value;
  list.appendChild(dt);
  list.appendChild(dd);
}

export function clearSpellPanel(host) {
  if (!host) return;
  host.innerHTML = '';
  host.hidden = true;
  host.removeAttribute('data-entry');
}

export function renderSpellPanel(entry, host) {
  if (!host || !entry) return;
  host.innerHTML = '';
  host.hidden = false;
  if (entry.id) {
    host.setAttribute('data-entry', entry.id);
  }

  const wrapper = document.createElement('section');
  wrapper.className = 'spell-panel';

  const chips = document.createElement('div');
  chips.className = 'spell-panel__chips';
  const levelLabel = formatLevel(Number(entry.level));
  if (levelLabel) {
    chips.appendChild(createChip(levelLabel));
  }
  if (entry.school) {
    chips.appendChild(createChip(entry.school));
  }
  if (entry.components) {
    chips.appendChild(createChip(`Components: ${entry.components}`));
  }
  if (chips.childElementCount) {
    wrapper.appendChild(chips);
  }

  const stats = document.createElement('dl');
  stats.className = 'spell-panel__stats';
  appendStat(stats, 'Casting Time', entry.casting_time);
  appendStat(stats, 'Range', entry.range);
  appendStat(stats, 'Duration', entry.duration);
  if (stats.childElementCount) {
    wrapper.appendChild(stats);
  }

  if (Array.isArray(entry.classes) && entry.classes.length) {
    const classList = document.createElement('ul');
    classList.className = 'spell-panel__classes';
    classList.setAttribute('aria-label', 'Available to classes');
    entry.classes.forEach((className) => {
      if (!className) return;
      const item = document.createElement('li');
      item.textContent = className;
      classList.appendChild(item);
    });
    wrapper.appendChild(classList);
  }

  if (entry.description && typeof entry.description === 'string') {
    const higher = entry.description.split('\n\n')[1];
    if (higher) {
      const note = document.createElement('p');
      note.className = 'spell-panel__note';
      note.textContent = higher.trim();
      wrapper.appendChild(note);
    }
  }

  host.appendChild(wrapper);
}

export default { renderSpellPanel, clearSpellPanel };
