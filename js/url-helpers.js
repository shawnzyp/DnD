const ABSOLUTE_URL = /^https?:\/\//i;

function normaliseBasePath(input) {
  if (!input) return '';
  const trimmed = String(input).trim();
  if (!trimmed) return '';
  const withoutTrailing = trimmed.replace(/\/+$/, '');
  if (!withoutTrailing) {
    return '';
  }
  return withoutTrailing.startsWith('/') ? withoutTrailing : `/${withoutTrailing}`;
}

function computeBaseFromImportMeta() {
  if (typeof import.meta === 'undefined' || !import.meta?.url) {
    return '';
  }
  try {
    const url = new URL(import.meta.url, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
    const pathname = url.pathname || '';
    const match = pathname.match(/^(.*)\/js\/[A-Za-z0-9-_]+\.js$/);
    if (match && match[1] !== '/') {
      return normaliseBasePath(match[1]);
    }
    if (match) {
      return '';
    }
    return normaliseBasePath(pathname.replace(/\/js\/.*/, ''));
  } catch (error) {
    console.warn('Unable to determine base path from import.meta.url', error);
    return '';
  }
}

function resolveBasePath() {
  if (typeof window !== 'undefined') {
    const existing = window.questKitBasePath?.basePath;
    if (typeof existing === 'string') {
      return normaliseBasePath(existing);
    }
  }
  return computeBaseFromImportMeta();
}

let basePath = resolveBasePath();

function withBase(path) {
  if (!path) {
    return basePath || '/';
  }
  if (ABSOLUTE_URL.test(path)) {
    return path;
  }
  let target = path;
  if (!target.startsWith('/')) {
    target = `/${target}`;
  }
  return `${basePath}${target}` || target;
}

function stripBase(pathname) {
  if (!pathname) return '/';
  if (!basePath) {
    return pathname;
  }
  if (pathname === basePath) {
    return '/';
  }
  if (pathname.startsWith(`${basePath}/`)) {
    const remainder = pathname.slice(basePath.length);
    return remainder || '/';
  }
  return pathname;
}

export function getBasePath() {
  return basePath;
}

export function resolveWithBase(path) {
  return withBase(path);
}

export function removeBase(pathname) {
  return stripBase(pathname);
}

if (typeof window !== 'undefined') {
  window.questKitBasePath = window.questKitBasePath || {};
  window.questKitBasePath.basePath = basePath;
  window.questKitBasePath.withBase = withBase;
  window.questKitBasePath.stripBase = stripBase;
}
