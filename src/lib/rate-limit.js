const rateLimitStores = globalThis.__welsh_motorsRateLimitStores || new Map();
globalThis.__welsh_motorsRateLimitStores = rateLimitStores;

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
  const freshHits = hits.filter((timestamp) => now - timestamp < windowMs);

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

  return {
    limited: false,
    remaining: Math.max(0, maxRequests - freshHits.length),
    retryAfter: 0,
  };
}
