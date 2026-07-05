/**
 * Client for the BIDGARI Growth Agent (Go sidecar).
 * Set GROWTH_AGENT_URL + GROWTH_AGENT_SECRET in Vercel env.
 */

const DEFAULT_TIMEOUT_MS = 15000;

function baseUrl() {
  return (process.env.GROWTH_AGENT_URL || "").trim().replace(/\/$/, "");
}

function secret() {
  return (process.env.GROWTH_AGENT_SECRET || "").trim();
}

export function isGrowthAgentConfigured() {
  return Boolean(baseUrl());
}

/**
 * @param {string} path e.g. "/prospects"
 * @param {{ method?: string, body?: unknown, searchParams?: Record<string, string> }} [opts]
 */
export async function growthAgentFetch(path, opts = {}) {
  const root = baseUrl();
  if (!root) {
    throw new Error("GROWTH_AGENT_URL is not configured");
  }

  const url = new URL(path.startsWith("/") ? path : `/${path}`, root);
  if (opts.searchParams) {
    for (const [k, v] of Object.entries(opts.searchParams)) {
      if (v != null && v !== "") url.searchParams.set(k, v);
    }
  }

  const headers = { Accept: "application/json" };
  const token = secret();
  if (token) headers.Authorization = `Bearer ${token}`;

  /** @type {RequestInit} */
  const init = {
    method: opts.method || "GET",
    headers,
    cache: "no-store",
  };

  if (opts.body != null) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(opts.body);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  init.signal = controller.signal;

  try {
    const res = await fetch(url.toString(), init);
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/csv")) {
      const text = await res.text();
      if (!res.ok) throw new Error(text || `Growth agent ${res.status}`);
      return { csv: text, contentType };
    }
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload?.error || `Growth agent ${res.status}`);
    }
    return payload;
  } finally {
    clearTimeout(timer);
  }
}
