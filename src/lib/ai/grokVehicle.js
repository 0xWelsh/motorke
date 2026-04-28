const XAI_CHAT_URL = "https://api.x.ai/v1/chat/completions";
const DEFAULT_MODEL = process.env.XAI_MODEL || "grok-2-latest";
const DEFAULT_TIMEOUT_MS = 2800;
const CACHE_TTL_MS = 1000 * 60 * 30;

const responseCache = new Map();

function cacheKey(prefix, payload) {
  return `${prefix}:${JSON.stringify(payload)}`;
}

function readCache(key) {
  const hit = responseCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    responseCache.delete(key);
    return null;
  }
  return hit.value;
}

function writeCache(key, value) {
  responseCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function parseJsonContent(content) {
  const raw = String(content || "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first === -1 || last === -1 || first >= last) return null;
    try {
      return JSON.parse(raw.slice(first, last + 1));
    } catch {
      return null;
    }
  }
}

async function callGrok(messages, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const key = process.env.XAI_API_KEY;
  if (!key) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(XAI_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: 0.1,
        max_tokens: 450,
        messages,
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return parseJsonContent(json?.choices?.[0]?.message?.content);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeStringList(values = [], limit = 40) {
  const seen = new Set();
  const out = [];
  values.forEach((value) => {
    const v = String(value || "").trim();
    if (!v) return;
    const k = v.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(v);
  });
  return out.slice(0, limit);
}

export async function suggestModelsWithGrok({ make, inventoryModels = [], limit = 30 }) {
  const mk = String(make || "").trim();
  if (!mk) return [];
  const ck = cacheKey("models", { make: mk.toLowerCase(), inventoryModels: inventoryModels.slice(0, 60), limit });
  const cached = readCache(ck);
  if (cached) return cached;

  const prompt = `Return strict JSON only: {"models": ["..."]}.
Make: ${mk}
Known models from inventory: ${inventoryModels.slice(0, 30).join(", ") || "none"}
Return up to ${Math.min(limit, 40)} high-confidence mainstream models for this make.`;
  const parsed = await callGrok([
    { role: "system", content: "You are a vehicle taxonomy assistant. Return JSON only." },
    { role: "user", content: prompt },
  ]);

  const models = normalizeStringList(parsed?.models, Math.min(limit, 40));
  writeCache(ck, models);
  return models;
}

export async function suggestVariantsWithGrok({ make, model, year, inventoryVariants = [], limit = 30 }) {
  const mk = String(make || "").trim();
  const md = String(model || "").trim();
  if (!mk || !md) return [];
  const ck = cacheKey("variants", {
    make: mk.toLowerCase(),
    model: md.toLowerCase(),
    year: year || null,
    inventoryVariants: inventoryVariants.slice(0, 60),
    limit,
  });
  const cached = readCache(ck);
  if (cached) return cached;

  const prompt = `Return strict JSON only: {"variants": ["..."]}.
Make: ${mk}
Model: ${md}
Year: ${year || "unknown"}
Known variants from inventory: ${inventoryVariants.slice(0, 30).join(", ") || "none"}
Return up to ${Math.min(limit, 40)} realistic trims/variants.`;
  const parsed = await callGrok([
    { role: "system", content: "You are a vehicle taxonomy assistant. Return JSON only." },
    { role: "user", content: prompt },
  ]);

  const variants = normalizeStringList(parsed?.variants, Math.min(limit, 40));
  writeCache(ck, variants);
  return variants;
}

export async function parseVehicleFieldsWithGrok(text) {
  const input = String(text || "").trim();
  if (!input) return null;
  const ck = cacheKey("parse", { text: input.slice(0, 1200) });
  const cached = readCache(ck);
  if (cached) return cached;

  const schemaHint = `Return strict JSON only:
{"make":string|null,"model":string|null,"variant":string|null,"year":number|null,"price":number|null,"mileage":number|null,"engineCC":number|null,"confidence":{"make":0..1,"model":0..1,"variant":0..1,"year":0..1,"price":0..1,"mileage":0..1,"engineCC":0..1}}`;
  const parsed = await callGrok([
    { role: "system", content: "Extract structured car listing data from noisy text. Do not explain. " + schemaHint },
    { role: "user", content: input },
  ], 3200);

  writeCache(ck, parsed);
  return parsed;
}
