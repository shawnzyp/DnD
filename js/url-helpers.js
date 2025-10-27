const cachedBaseUrl = (() => {
  try {
    if (window.dndBaseUrl instanceof URL) {
      return window.dndBaseUrl;
    }
  } catch (error) {
    // Ignore and fall back to computing from location.
  }
  const computed = new URL('./', window.location.href);
  try {
    window.dndBaseUrl = computed;
  } catch (error) {
    // Ignore assignment failures (e.g. readonly window).
  }
  return computed;
})();

export function getBaseUrl() {
  return cachedBaseUrl;
}

export function resolveAppUrl(path = './') {
  return new URL(path, cachedBaseUrl);
}
