/**
 * Optional per-car "choose this if…" lines for /compare via xAI Grok.
 * Server-only: XAI_API_KEY (same as other Grok features in this app).
 */

const XAI_CHAT_URL = "https://api.x.ai/v1/chat/completions";
const DEFAULT_MODEL = process.env.XAI_MODEL || "grok-latest";
const REQUEST_MS = 14_000;

function parseJsonContent(content) {
  const raw = String(content || "").trim();
  if (!raw) return null;
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  try {
    return JSON.parse(stripped);
  } catch {
    const first = stripped.indexOf("{");
    const last = stripped.lastIndexOf("}");
    if (first === -1 || last === -1 || first >= last) return null;
    try {
      return JSON.parse(stripped.slice(first, last + 1));
    } catch {
      return null;
    }
  }
}

/**
 * @param {object} input
 * @param {string} input.preset
 * @param {Array<{ id: string, label: string, priceText?: string, annualTcoText?: string, roadScore?: string, bodyType?: string, fuelType?: string, transmission?: string, drivetrain?: string, importedLabel?: string, mileageText?: string, horsepowerText?: string }>} input.cars
 * @param {string[]} [input.ruleBullets]
 * @returns {Promise<{ ok: true, reasons: { carId: string, reason: string | null }[] } | { ok: false, error: string, details?: string }>}
 */
export async function generateComparePickReasons({ preset, cars, ruleBullets = [] }) {
  if (!process.env.XAI_API_KEY) {
    return { ok: false, error: "no_key" };
  }
  if (!cars?.length) {
    return { ok: false, error: "no_cars" };
  }

  const lines = [
    "Buyer is comparing vehicles in Kenya on BIDGARI.",
    `Active comparison lens: ${String(preset || "all")}.`,
    `Cars in this set (${cars.length}):`,
  ];
  for (const c of cars) {
    const bits = [
      `id=${c.id}`,
      c.label,
      `price ${c.priceText ?? "N/A"}`,
      `annual TCO ${c.annualTcoText ?? "N/A"}`,
      `road ${c.roadScore ?? "N/A"}`,
      `body ${c.bodyType ?? "N/A"}`,
      `fuel ${c.fuelType ?? "N/A"}`,
      `transmission ${c.transmission ?? "N/A"}`,
      `drivetrain ${c.drivetrain ?? "N/A"}`,
      `${c.importedLabel ?? "N/A"}`,
      `mileage ${c.mileageText ?? "N/A"}`,
      `power ${c.horsepowerText ?? "N/A"}`,
    ];
    lines.push(`  - ${bits.join(" | ")}`);
  }
  if (ruleBullets.length) {
    lines.push("Factual lines from our comparison engine (must not contradict):");
    ruleBullets.forEach((b) => lines.push(`  - ${b}`));
  }
  lines.push(
    'Return strict JSON only: {"reasons":[{"carId":"<exact id from above>","reason":"<one sentence>"}]}',
    `Exactly ${cars.length} objects in "reasons", one per car listed.`,
    'Each "reason" should read like: Buy this [vehicle] if you want … or Choose this [vehicle] if you … — vivid but honest, grounded only in the facts above.',
    "If a fact is N/A, do not invent a number or spec for it.",
    "Max 240 characters per reason. Plain English, no markdown, no quote marks inside the string."
  );

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_MS);
  try {
    const res = await fetch(XAI_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: 0.5,
        max_tokens: 700,
        messages: [
          {
            role: "system",
            content:
              "You write short buyer-persona taglines for a car marketplace. Output a single JSON object only, no other text.",
          },
          { role: "user", content: lines.join("\n") },
        ],
        signal: controller.signal,
        cache: "no-store",
      }),
    });

    if (!res.ok) {
      const body = (await res.text()).slice(0, 400);
      return { ok: false, error: `xai_http_${res.status}`, details: body };
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    const parsed = parseJsonContent(content);
    const rawList = Array.isArray(parsed?.reasons) ? parsed.reasons : [];

    const byId = new Map();
    for (const row of rawList) {
      const id = String(row?.carId ?? row?.car_id ?? "").trim();
      const reason = String(row?.reason ?? row?.line ?? "").trim();
      if (id && reason) byId.set(id, reason.slice(0, 280));
    }

    const reasons = cars.map((c) => ({
      carId: c.id,
      reason: byId.get(c.id) ?? null,
    }));

    return { ok: true, reasons };
  } catch (e) {
    const name = e?.name === "AbortError" ? "timeout" : "fetch_failed";
    return { ok: false, error: name, details: String(e?.message || e).slice(0, 200) };
  } finally {
    clearTimeout(timer);
  }
}
