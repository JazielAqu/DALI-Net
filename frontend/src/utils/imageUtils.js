const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const apiOrigin = apiBase.replace(/\/api$/, '');

const normalizeLegacyUrl = (value) => {
  if (!value || typeof value !== 'string') return value;

  // Legacy local uploads saved while developing: rewrite to current backend origin.
  if (value.startsWith('http://localhost:3001/uploads/')) {
    return value.replace('http://localhost:3001', apiOrigin);
  }

  // Relative upload paths from older backend upload route.
  if (value.startsWith('/uploads/')) {
    return `${apiOrigin}${value}`;
  }

  return value;
};

// Safely pick the first usable image URL and fall back to a default.
// Skips invalid URLs, disallowed protocols, and URLs previously marked as failed.
export const getSafeImageUrl = (candidates = [], failedLookup = {}, fallback = '/default-avatar.jpg') => {
  for (const rawUrl of candidates) {
    const url = normalizeLegacyUrl(rawUrl);
    if (!url) continue;
    if (failedLookup[url]) continue;

    // Allow data URIs for uploaded profile photos
    if (typeof url === 'string' && url.startsWith('data:image/')) {
      return url;
    }

    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) continue;
      return url;
    } catch {
      // Ignore malformed URLs
    }
  }
  return fallback;
};
