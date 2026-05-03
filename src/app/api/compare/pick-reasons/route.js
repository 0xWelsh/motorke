import { z } from "zod";
import { generateComparePickReasons } from "@/lib/ai/grokComparePickReasons";

const carSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(200),
  priceText: z.string().max(80).optional(),
  annualTcoText: z.string().max(80).optional(),
  roadScore: z.string().max(40).optional(),
  bodyType: z.string().max(80).optional(),
  fuelType: z.string().max(80).optional(),
  transmission: z.string().max(80).optional(),
  drivetrain: z.string().max(80).optional(),
  importedLabel: z.string().max(40).optional(),
  mileageText: z.string().max(80).optional(),
  horsepowerText: z.string().max(40).optional(),
});

const bodySchema = z.object({
  preset: z.string().max(32).optional().default("all"),
  cars: z.array(carSchema).min(2).max(3),
  ruleBullets: z.array(z.string().max(500)).max(12).optional(),
});

const NO_KEY_MESSAGE =
  "Optional one-line suggestions are not turned on for this site yet. " +
  "The comparison table and summary above are unchanged.";

export async function POST(request) {
  let json;
  try {
    json = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { preset, cars, ruleBullets = [] } = parsed.data;

  if (!process.env.XAI_API_KEY) {
    return Response.json({ ok: false, noKey: true, message: NO_KEY_MESSAGE, hint: NO_KEY_MESSAGE });
  }

  const result = await generateComparePickReasons({ preset, cars, ruleBullets });

  if (result.ok) {
    return Response.json({ ok: true, reasons: result.reasons, provider: "grok" });
  }

  if (result.error === "no_key") {
    return Response.json({ ok: false, noKey: true, message: NO_KEY_MESSAGE, hint: NO_KEY_MESSAGE });
  }

  return Response.json(
    {
      ok: false,
      error: result.error,
      details: result.details,
      message: "Could not generate pick lines this time. Try again in a moment.",
    },
    { status: 200 }
  );
}
