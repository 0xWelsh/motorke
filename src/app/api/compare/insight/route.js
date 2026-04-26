import { z } from "zod";
import { generateCompareParagraph } from "@/lib/free-compare-insight";

const bodySchema = z.object({
  preset: z.string().max(32).optional().default("all"),
  cars: z
    .array(
      z.object({
        label: z.string().min(1).max(200),
        priceText: z.string().max(80).optional(),
        annualTcoText: z.string().max(80).optional(),
        roadScore: z.string().max(32).optional(),
        tags: z.array(z.string().max(80)).max(12).optional(),
      })
    )
    .min(1)
    .max(3),
  ruleBullets: z.array(z.string().max(500)).max(14).optional(),
});

const NO_KEY_MESSAGE =
  "No GROQ_API_KEY or GEMINI_API_KEY in server env. " +
  "The on-page “Smart summary” is always free. For a short AI-style paragraph, add a free key: " +
  "GROQ_API_KEY from https://console.groq.com or GEMINI_API_KEY from https://aistudio.google.com — both offer free API tiers (subject to their terms).";

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
  if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
    return Response.json({ ok: false, noKey: true, message: NO_KEY_MESSAGE, hint: NO_KEY_MESSAGE });
  }

  const lines = [
    `Comparison preset: ${preset}.`,
    `Cars in this set (${cars.length}):`,
    ...cars.map((c, i) => {
      const bits = [c.label];
      if (c.priceText) bits.push(`price: ${c.priceText}`);
      if (c.annualTcoText) bits.push(`est. annual TCO: ${c.annualTcoText}`);
      if (c.roadScore) bits.push(`road score: ${c.roadScore}`);
      if (c.tags?.length) bits.push(`notes: ${c.tags.join("; ")}`);
      return `  ${i + 1}. ${bits.join(" | ")}`;
    }),
  ];
  if (ruleBullets.length) {
    lines.push("Summary bullets from our rules engine (factual, use as constraints):", ...ruleBullets.map((b) => `  - ${b}`));
  }
  lines.push("Write 2-4 neutral sentences for the buyer using only the above.");

  const userBlock = lines.join("\n");
  const result = await generateCompareParagraph(userBlock);

  if (result.ok) {
    return Response.json({ ok: true, text: result.text, provider: result.provider });
  }

  if (result.error === "no_key") {
    return Response.json({ ok: false, noKey: true, message: NO_KEY_MESSAGE, hint: NO_KEY_MESSAGE });
  }

  return Response.json(
    {
      ok: false,
      error: result.error,
      details: result.details,
      message:
        "The smart summary on the page is still available. This endpoint could not get an AI paragraph — check GROQ_API_KEY / GEMINI_API_KEY and model quotas.",
    },
    { status: 200 }
  );
}
