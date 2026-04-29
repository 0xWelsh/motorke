const asBool = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

const asNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const PHONE_VERIFICATION_ENABLED = false;

// Go search migration flags (safe defaults: no behavior change).
export const GO_SEARCH_SHADOW_ENABLED = asBool(process.env.GO_SEARCH_SHADOW_ENABLED, false);
export const GO_SEARCH_ACTIVE_ENABLED = asBool(process.env.GO_SEARCH_ACTIVE_ENABLED, false);
export const GO_SEARCH_SHADOW_SAMPLE_PERCENT = Math.min(
  100,
  Math.max(0, asNumber(process.env.GO_SEARCH_SHADOW_SAMPLE_PERCENT, 10)),
);
export const GO_SEARCH_TIMEOUT_MS = Math.max(50, asNumber(process.env.GO_SEARCH_TIMEOUT_MS, 350));
export const GO_SEARCH_SERVICE_URL = process.env.GO_SEARCH_SERVICE_URL || "";
export const GO_SEARCH_LOG_MATCHES = asBool(process.env.GO_SEARCH_LOG_MATCHES, false);
