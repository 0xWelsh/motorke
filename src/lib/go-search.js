import {
  GO_SEARCH_ACTIVE_ENABLED,
  GO_SEARCH_LOG_MATCHES,
  GO_SEARCH_SERVICE_URL,
  GO_SEARCH_SHADOW_ENABLED,
  GO_SEARCH_SHADOW_SAMPLE_PERCENT,
  GO_SEARCH_TIMEOUT_MS,
} from "@/lib/feature-flags";

const MAX_RESULTS = 5;
const LATENCY_WINDOW = 200;

function getStore() {
  if (!globalThis.__goSearchShadowMetrics) {
    globalThis.__goSearchShadowMetrics = {
      startedAt: Date.now(),
      sampled: 0,
      skipped: 0,
      matches: 0,
      mismatches: 0,
      errors: 0,
      timeouts: 0,
      goCalls: 0,
      latencies: [],
      lastQueryAt: null,
      lastMismatchAt: null,
      lastErrorAt: null,
      lastErrorMessage: null,
      lastDiff: null,
    };
  }
  return globalThis.__goSearchShadowMetrics;
}

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function pushLatency(latencyMs) {
  const store = getStore();
  store.latencies.push(latencyMs);
  if (store.latencies.length > LATENCY_WINDOW) {
    store.latencies.shift();
  }
}

function markSampled() {
  const store = getStore();
  store.sampled += 1;
  store.lastQueryAt = Date.now();
}

function markSkipped() {
  const store = getStore();
  store.skipped += 1;
}

function markMatch(latencyMs) {
  const store = getStore();
  store.goCalls += 1;
  store.matches += 1;
  pushLatency(latencyMs);
}

function markMismatch(latencyMs, diff) {
  const store = getStore();
  store.goCalls += 1;
  store.mismatches += 1;
  store.lastMismatchAt = Date.now();
  store.lastDiff = diff;
  pushLatency(latencyMs);
}

function markError(error) {
  const store = getStore();
  const message = error instanceof Error ? error.message : String(error);
  store.goCalls += 1;
  store.errors += 1;
  store.lastErrorAt = Date.now();
  store.lastErrorMessage = message;
  if (message.toLowerCase().includes("abort")) {
    store.timeouts += 1;
  }
}

function hashToPercent(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 100;
}

function normalize(records = []) {
  return records.map((record) => ({
    id: record.id,
    make: record.make || "",
    model: record.model || "",
    year: Number(record.year || 0),
    price: Number(record.price || 0),
    engineCC: record.engineCC ?? null,
    fuelType: record.fuelType ?? null,
    image: record.image ?? null,
  }));
}

function summarizeDiff(nodeRecords, goRecords) {
  const nodeMap = new Map(nodeRecords.map((item) => [item.id, item]));
  const goMap = new Map(goRecords.map((item) => [item.id, item]));

  const onlyInNode = [];
  const onlyInGo = [];
  const mismatchedFields = [];

  for (const [id, nodeItem] of nodeMap) {
    const goItem = goMap.get(id);
    if (!goItem) {
      onlyInNode.push(id);
      continue;
    }

    const changed = [];
    if (nodeItem.make !== goItem.make) changed.push("make");
    if (nodeItem.model !== goItem.model) changed.push("model");
    if (nodeItem.year !== goItem.year) changed.push("year");
    if (nodeItem.price !== goItem.price) changed.push("price");
    if (nodeItem.engineCC !== goItem.engineCC) changed.push("engineCC");
    if (nodeItem.fuelType !== goItem.fuelType) changed.push("fuelType");
    if (nodeItem.image !== goItem.image) changed.push("image");

    if (changed.length) {
      mismatchedFields.push({ id, fields: changed });
    }
  }

  for (const id of goMap.keys()) {
    if (!nodeMap.has(id)) onlyInGo.push(id);
  }

  return {
    totalNode: nodeRecords.length,
    totalGo: goRecords.length,
    onlyInNode,
    onlyInGo,
    mismatchedFields,
    hasDiff: onlyInNode.length > 0 || onlyInGo.length > 0 || mismatchedFields.length > 0,
  };
}

function shouldSample(query, requester) {
  const input = `${query}|${requester || "unknown"}`;
  return hashToPercent(input) < GO_SEARCH_SHADOW_SAMPLE_PERCENT;
}

export async function fetchGoSearchResults(query) {
  const base = GO_SEARCH_SERVICE_URL.trim();
  if (!base) {
    throw new Error("GO_SEARCH_SERVICE_URL is not configured");
  }

  const url = new URL("/search", base);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(MAX_RESULTS));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GO_SEARCH_TIMEOUT_MS);
  const started = Date.now();
  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    const latencyMs = Date.now() - started;
    if (!response.ok) {
      throw new Error(`Go search returned ${response.status}`);
    }
    const payload = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error("Go search response is not an array");
    }
    return { results: normalize(payload), latencyMs };
  } finally {
    clearTimeout(timeout);
  }
}

export async function runGoSearchShadow({ query, nodeResults, requester }) {
  if (!GO_SEARCH_SHADOW_ENABLED) return;
  if (!query || query.length < 2) return;
  if (!shouldSample(query, requester)) {
    markSkipped();
    return;
  }
  markSampled();

  try {
    const normalizedNode = normalize(nodeResults);
    const { results: goResults, latencyMs } = await fetchGoSearchResults(query);
    const diff = summarizeDiff(normalizedNode, goResults);

    if (diff.hasDiff) {
      markMismatch(latencyMs, diff);
      console.warn("[go-search-shadow] mismatch", {
        query,
        requester: requester || "unknown",
        latencyMs,
        ...diff,
      });
    } else if (GO_SEARCH_LOG_MATCHES) {
      markMatch(latencyMs);
      console.info("[go-search-shadow] match", {
        query,
        requester: requester || "unknown",
        latencyMs,
        count: goResults.length,
      });
    } else {
      markMatch(latencyMs);
    }
  } catch (error) {
    markError(error);
    console.warn("[go-search-shadow] error", {
      query,
      requester: requester || "unknown",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export function getGoSearchShadowMetrics() {
  const store = getStore();
  const compared = store.matches + store.mismatches;
  const attempted = store.goCalls;
  const mismatchRate = compared > 0 ? (store.mismatches / compared) * 100 : 0;
  const errorRate = attempted > 0 ? (store.errors / attempted) * 100 : 0;
  const timeoutRate = attempted > 0 ? (store.timeouts / attempted) * 100 : 0;

  const promoteReady =
    !GO_SEARCH_ACTIVE_ENABLED &&
    GO_SEARCH_SHADOW_ENABLED &&
    compared >= 200 &&
    mismatchRate <= 1 &&
    errorRate <= 0.5 &&
    timeoutRate <= 0.5;

  return {
    flags: {
      shadowEnabled: GO_SEARCH_SHADOW_ENABLED,
      activeEnabled: GO_SEARCH_ACTIVE_ENABLED,
      serviceConfigured: Boolean(GO_SEARCH_SERVICE_URL),
      samplePercent: GO_SEARCH_SHADOW_SAMPLE_PERCENT,
      timeoutMs: GO_SEARCH_TIMEOUT_MS,
    },
    counters: {
      sampled: store.sampled,
      skipped: store.skipped,
      attempted,
      compared,
      matches: store.matches,
      mismatches: store.mismatches,
      errors: store.errors,
      timeouts: store.timeouts,
    },
    rates: {
      mismatchRate,
      errorRate,
      timeoutRate,
    },
    rollout: {
      promoteReady,
      comparedThreshold: 200,
      mismatchTargetPct: 1,
      errorTargetPct: 0.5,
      timeoutTargetPct: 0.5,
    },
    latencyMs: {
      p50: percentile(store.latencies, 50),
      p95: percentile(store.latencies, 95),
      max: store.latencies.length ? Math.max(...store.latencies) : null,
      samples: store.latencies.length,
    },
    last: {
      queryAt: store.lastQueryAt,
      mismatchAt: store.lastMismatchAt,
      errorAt: store.lastErrorAt,
      errorMessage: store.lastErrorMessage,
      diff: store.lastDiff,
    },
    startedAt: store.startedAt,
    now: Date.now(),
  };
}
