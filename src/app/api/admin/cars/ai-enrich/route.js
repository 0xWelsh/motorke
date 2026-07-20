import { getSessionFromRequest } from "@/lib/auth";

const XAI_CHAT_URL = "https://api.x.ai/v1/chat/completions";
const XAI_MODEL = process.env.XAI_MODEL || "grok-latest";

export async function POST(request) {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { make, model, variant, year, bodyType, fuelType, transmission, color, mileage, engineCC, price, condition } = body;

  if (!make || !model || !year) {
    return Response.json({ error: "make, model, and year are required" }, { status: 400 });
  }

  const vehicleDesc = [
    `Make: ${make}`,
    `Model: ${model}`,
    variant ? `Variant: ${variant}` : null,
    `Year: ${year}`,
    bodyType ? `Body type: ${bodyType}` : null,
    fuelType ? `Fuel: ${fuelType}` : null,
    transmission ? `Transmission: ${transmission}` : null,
    color ? `Color: ${color}` : null,
    mileage ? `Mileage: ${mileage} km` : null,
    engineCC ? `Engine: ${engineCC} cc` : null,
    price ? `Price: KES ${price}` : null,
    condition ? `Condition: ${condition}` : null,
  ].filter(Boolean).join("\n");

  const systemMsg = "You are a Kenyan automotive copywriter. Return JSON only, no explanation.";

  const userMsg = `You are creating a car listing for a Kenyan marketplace. Based on the vehicle details below, produce a compelling description and a list of expected features.

Vehicle details:
${vehicleDesc}

Return strict JSON only with this exact shape:
{"description": "2-3 paragraph sales description. Be specific about engine performance, condition expectations, ideal buyer, and include a call to action. Do NOT use markdown or asterisks. Write in plain paragraphs separated by newlines.", "features": ["feature1", "feature2", ...]}

For features, list realistic OEM features commonly found on this specific make/model/year for the Kenyan market. Be specific.`;

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "AI not configured" }, { status: 501 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(XAI_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: XAI_MODEL,
        temperature: 0.3,
        max_tokens: 1000,
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: userMsg },
        ],
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      return Response.json({ error: `AI provider error (${res.status}): ${errBody.slice(0, 500)}` }, { status: 502 });
    }

    const json = await res.json();
    const rawContent = json?.choices?.[0]?.message?.content;
    if (!rawContent) {
      return Response.json({ error: "Empty AI response" }, { status: 502 });
    }

    const parsed = parseJsonContent(rawContent);
    if (!parsed || !parsed.description) {
      return Response.json({ error: "Failed to parse AI response" }, { status: 502 });
    }

    const features = Array.isArray(parsed.features) ? parsed.features.slice(0, 25) : [];

    return Response.json({
      description: parsed.description.trim(),
      features,
      source: "ai",
    });
  } catch (err) {
    if (err.name === "AbortError") {
      return Response.json({ error: "AI request timed out" }, { status: 504 });
    }
    return Response.json({ error: "AI generation failed" }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
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
