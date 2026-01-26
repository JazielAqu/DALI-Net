// Safely pick the first usable image URL and fall back to a default.
// Skips invalid URLs, disallowed protocols, and URLs previously marked as failed.
export const getSafeImageUrl = (candidates = [], failedLookup = {}, fallback = '/default-avatar.jpg') => {
  for (const url of candidates) {
    if (!url) continue;
    if (failedLookup[url]) continue;
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
