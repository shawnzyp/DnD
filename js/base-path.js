const MODULE_NAME = '/js/base-path.js';

function normaliseBasePath(value) {
  if (!value) {
    return '';
  }
  let trimmed = String(value).trim();
  if (!trimmed || trimmed === '/' || trimmed === './') {
    return '';
  }
  if (!trimmed.startsWith('/')) {
    trimmed = `/${trimmed}`;
  }
  while (trimmed.endsWith('/') && trimmed !== '/') {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed === '/' ? '' : trimmed;
}

function isExternalPath(path) {
  if (typeof path !== 'string') {
    return false;
  }
  return /^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith('mailto:') || path.startsWith('data:');
}

const moduleUrl = new URL(import.meta.url);
let detectedBasePath = '';
if (moduleUrl.pathname.endsWith(MODULE_NAME)) {
  detectedBasePath = moduleUrl.pathname.slice(0, -MODULE_NAME.length);
}
const basePath = normaliseBasePath(detectedBasePath);

function withBasePath(path) {
  if (typeof path !== 'string') {
    return path;
  }
  const trimmed = path.trim();
  if (!trimmed) {
    return basePath ? `${basePath}/` : '/';
  }
  if (isExternalPath(trimmed)) {
    return trimmed;
  }
  if (!basePath) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }
  if (trimmed.startsWith(basePath + '/') || trimmed === basePath) {
    return trimmed;
  }
  const withoutLeadingSlash = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  if (!withoutLeadingSlash) {
    return `${basePath}/`;
  }
  return `${basePath}/${withoutLeadingSlash}`;
}

function stripBasePath(path) {
  if (typeof path !== 'string') {
    return '/';
  }
  const trimmed = path.trim();
  if (!trimmed) {
    return '/';
  }
  if (!basePath) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }
  if (trimmed === basePath || trimmed === `${basePath}/`) {
    return '/';
  }
  if (trimmed.startsWith(`${basePath}/`)) {
    const remainder = trimmed.slice(basePath.length);
    return remainder.startsWith('/') ? remainder : `/${remainder}`;
  }
  return trimmed;
}

const api = {
  getBasePath: () => basePath,
  withBasePath,
  stripBasePath
};

if (!window.__questBasePath) {
  window.__questBasePath = api;
}

export const getBasePath = api.getBasePath;
export { withBasePath, stripBasePath };
