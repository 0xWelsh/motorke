const MAX_EVENTS = 300;

function getStore() {
  if (!globalThis.__opsTelemetryStore) {
    globalThis.__opsTelemetryStore = {
      startedAt: Date.now(),
      routes: {},
      recent: [],
    };
  }
  return globalThis.__opsTelemetryStore;
}

function ensureRoute(route) {
  const store = getStore();
  if (!store.routes[route]) {
    store.routes[route] = {
      calls: 0,
      errors: 0,
      totalMs: 0,
      maxMs: 0,
      lastStatus: null,
      lastError: null,
      lastCalledAt: null,
    };
  }
  return store.routes[route];
}

export function trackRequest({ route, method, status, durationMs, ok, errorMessage }) {
  const store = getStore();
  const target = ensureRoute(route);
  target.calls += 1;
  target.totalMs += durationMs;
  target.maxMs = Math.max(target.maxMs, durationMs);
  target.lastStatus = status;
  target.lastCalledAt = Date.now();
  if (!ok) {
    target.errors += 1;
    target.lastError = errorMessage || `HTTP ${status}`;
  }

  store.recent.push({
    ts: Date.now(),
    route,
    method,
    status,
    durationMs,
    ok,
    errorMessage: errorMessage || null,
  });
  if (store.recent.length > MAX_EVENTS) {
    store.recent.shift();
  }
}

export function getTelemetrySnapshot() {
  const store = getStore();
  const routes = Object.entries(store.routes).map(([name, metrics]) => {
    const avgMs = metrics.calls > 0 ? Math.round(metrics.totalMs / metrics.calls) : 0;
    const errorRate = metrics.calls > 0 ? Number(((metrics.errors / metrics.calls) * 100).toFixed(2)) : 0;
    return { name, ...metrics, avgMs, errorRate };
  });

  return {
    startedAt: store.startedAt,
    now: Date.now(),
    totalRoutes: routes.length,
    routes: routes.sort((a, b) => b.calls - a.calls),
    recent: [...store.recent].reverse().slice(0, 50),
  };
}
