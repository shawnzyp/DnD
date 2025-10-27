const EMPTY_SUMMARY = { status: 'ok', errors: [], warnings: [], message: '' };

function normaliseList(values) {
  return Array.isArray(values)
    ? values
        .map((value) => {
          if (typeof value === 'string') {
            return value.trim();
          }
          if (value === null || value === undefined) {
            return '';
          }
          return String(value).trim();
        })
        .filter(Boolean)
    : [];
}

export function normaliseValidation(validation) {
  if (!validation || typeof validation !== 'object') {
    return { ...EMPTY_SUMMARY };
  }
  const errors = normaliseList(validation.errors);
  const warnings = normaliseList(validation.warnings);
  const rawStatus = typeof validation.status === 'string' ? validation.status.toLowerCase() : '';
  const status = rawStatus === 'error' || rawStatus === 'warning' || rawStatus === 'ok'
    ? rawStatus
    : errors.length
      ? 'error'
      : warnings.length
        ? 'warning'
        : 'ok';
  const message = typeof validation.message === 'string' && validation.message.trim()
    ? validation.message.trim()
    : errors[0] || warnings[0] || '';
  return {
    status,
    errors,
    warnings,
    message
  };
}

export function getValidationForPack(target) {
  if (!target) {
    return { ...EMPTY_SUMMARY };
  }
  if (target.validation && typeof target.validation === 'object') {
    return normaliseValidation(target.validation);
  }
  if (target.errors || target.warnings || target.status || target.message) {
    return normaliseValidation(target);
  }
  if (typeof window !== 'undefined' && window.dnd && typeof window.dnd.validatePack === 'function') {
    try {
      return normaliseValidation(window.dnd.validatePack(target, target.data, target.validationStats));
    } catch (error) {
      const fallbackMessage = error && error.message ? error.message : String(error || 'Unknown validation error');
      return normaliseValidation({ errors: [`Validation failed: ${fallbackMessage}`] });
    }
  }
  return { ...EMPTY_SUMMARY };
}

export function getValidationBadge(target) {
  const summary = getValidationForPack(target);
  if (summary.status === 'error') {
    return {
      status: 'error',
      label: 'Needs fixes',
      title: summary.message || 'Resolve validation errors.',
      summary
    };
  }
  if (summary.status === 'warning') {
    return {
      status: 'warning',
      label: 'Warnings',
      title: summary.message || 'Review validation warnings.',
      summary
    };
  }
  return null;
}

function formatNames(packs) {
  const names = packs
    .map(({ pack }) => pack && (pack.name || pack.id))
    .filter(Boolean);
  if (!names.length) {
    return '';
  }
  const preview = names.slice(0, 3).join(', ');
  return names.length > 3 ? `${preview}…` : preview;
}

export function summariseValidationIssues(packs = []) {
  const array = Array.isArray(packs) ? packs : [];
  const errorPacks = [];
  const warningPacks = [];
  array.forEach((pack) => {
    if (!pack) return;
    const summary = getValidationForPack(pack);
    if (summary.status === 'error') {
      errorPacks.push({ pack, summary });
    } else if (summary.status === 'warning') {
      warningPacks.push({ pack, summary });
    }
  });
  let message = '';
  if (errorPacks.length) {
    const names = formatNames(errorPacks);
    const detail = errorPacks[0].summary.message;
    const countText = errorPacks.length === 1 ? `${names || 'A pack'} needs fixes` : `${errorPacks.length} packs need fixes${names ? ` (${names})` : ''}`;
    message = detail ? `${countText}: ${detail}` : `${countText}.`;
  } else if (warningPacks.length) {
    const names = formatNames(warningPacks);
    const detail = warningPacks[0].summary.message;
    const countText = warningPacks.length === 1 ? `${names || 'A pack'} has warnings` : `${warningPacks.length} packs have warnings${names ? ` (${names})` : ''}`;
    message = detail ? `${countText}: ${detail}` : `${countText}.`;
  }
  if (message && !/[.!?]$/.test(message)) {
    message = `${message}.`;
  }
  return {
    errorPacks,
    warningPacks,
    hasErrors: errorPacks.length > 0,
    hasWarnings: warningPacks.length > 0,
    message,
    status: errorPacks.length ? 'error' : warningPacks.length ? 'warning' : 'ok'
  };
}
