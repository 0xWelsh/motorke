const rateLimitStores = globalThis.__welsh_motorsRateLimitStores || new Map();
globalThis.__welsh_motorsRateLimitStores = rateLimitStores;
let lastGlobalPruneAt = 0;

function getStore(name) {
  if (!rateLimitStores.has(name)) {
    rateLimitStores.set(name, new Map());
  }
  return rateLimitStores.get(name);
}

export function checkRateLimit({ name, key, windowMs, maxRequests }) {
  if (!name || !key || !windowMs || !maxRequests) {
    return { limited: false, remaining: maxRequests || 0, retryAfter: 0 };
  }

  const now = Date.now();
  const store = getStore(name);
  const hits = store.get(key) || [];
  const freshHits = hits
    .filter((timestamp) => now - timestamp < windowMs)
    .slice(-Math.max(maxRequests * 3, maxRequests + 5));

  if (freshHits.length >= maxRequests) {
    const oldest = freshHits[0] || now;
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    store.set(key, freshHits);
    return {
      limited: true,
      remaining: 0,
      retryAfter,
    };
  }

  freshHits.push(now);
  store.set(key, freshHits);

  // Opportunistic global prune to keep memory stable during abuse spikes.
  if (now - lastGlobalPruneAt > 60_000) {
    for (const scopedStore of rateLimitStores.values()) {
      for (const [scopedKey, scopedHits] of scopedStore.entries()) {
        if (!Array.isArray(scopedHits) || scopedHits.length === 0) {
          scopedStore.delete(scopedKey);
          continue;
        }
        const recentHits = scopedHits.filter((timestamp) => now - timestamp < windowMs);
        if (recentHits.length === 0) scopedStore.delete(scopedKey);
        else scopedStore.set(scopedKey, recentHits.slice(-200));
      }
    }
    lastGlobalPruneAt = now;
  }

  return {
    limited: false,
    remaining: Math.max(0, maxRequests - freshHits.length),
    retryAfter: 0,
  };
}
