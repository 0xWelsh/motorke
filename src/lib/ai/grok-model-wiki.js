import { callGrokJson } from "@/lib/ai/grok-vehicle";

/**
 * Optional AI model guide (Kenya-localized). Returns null without XAI_API_KEY.
 * @param {{ make: string; model: string; year?: number; fuelType?: string; engineCC?: number; bodyType?: string }} car
 */
export async function generateModelWikiWithGrok(car) {
  const make = String(car.make || "").trim();
  const model = String(car.model || "").trim();
  if (!make || !model) return null;

  const payload = await callGrokJson(
    [
      {
        role: "system",
        content:
          "You write concise Kenya used-car buyer guides for a marketplace. Return JSON only: { headline, paragraphs: string[3-4], bullets: string[2-3] }. No markdown. Mention Nairobi/upcountry where relevant. No invented prices.",
      },
      {
        role: "user",
        content: JSON.stringify({
          make,
          model,
          year: car.year,
          fuelType: car.fuelType,
          engineCC: car.engineCC,
          bodyType: car.bodyType,
        }),
      },
    ],
    4500
  );

  if (!payload?.headline || !Array.isArray(payload.paragraphs) || payload.paragraphs.length < 2) {
    return null;
  }

  return {
    headline: String(payload.headline).slice(0, 200),
    paragraphs: payload.paragraphs.map((p) => String(p).trim()).filter(Boolean).slice(0, 5),
    bullets: Array.isArray(payload.bullets)
      ? payload.bullets.map((b) => String(b).trim()).filter(Boolean).slice(0, 5)
      : [],
    source: "ai",
  };
}
