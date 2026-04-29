// src/app/api/cars/parse/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { parseVehicleFieldsWithGrok } from "@/lib/ai/grokVehicle";

const MAKES = [
  "Abarth","Acura","Aion","Aiways","Alfa Romeo","Alpine","Aston Martin","Audi","BAIC","Bentley","Bestune","BMW","Borgward",
  "Brilliance","Bugatti","Buick","BYD","Cadillac","Changan","Changhe","Chery","Chevrolet","Chrysler","Citroen","Cupra","Dacia",
  "Daewoo","Daihatsu","Datsun","Denza","DFSK","Dodge","Dongfeng","DS","FAW","Ferrari","Fiat","Fisker","Ford","Foton","Fuso",
  "GAC","Geely","Genesis","GMC","Great Wall","Haval","Hino","Honda","Hongqi","Hummer","Hyundai","IM Motors","Infiniti","Isuzu",
  "JAC","Jaecoo","Jaguar","Jeep","Jetour","JMC","Kia","Koenigsegg","Lada","Lamborghini","Lancia","Land Rover","Leapmotor",
  "Lexus","Lincoln","Lotus","Lucid","Lynk & Co","Mahindra","MAN","Maserati","Maxus","Maybach","Mazda","McLaren","Mercedes-Benz",
  "Mercury","MG","Mini","Mitsubishi","Neta","Nio","Nissan","Oldsmobile","Omoda","Opel","ORA","Other","Pagani","Peugeot",
  "Polestar","Pontiac","Porsche","Proton","RAM","Range Rover","Renault","Rivian","Rolls-Royce","Rover","Saab","Saturn","Scania",
  "SEAT","Skoda","Smart","SsangYong","Subaru","Suzuki","Tata","Tesla","Toyota","Triumph","Vauxhall","VinFast","Volkswagen","Volvo",
  "Wuling","XPeng","Zeekr","Zotye",
].sort((a, b) => b.length - a.length);

const MAKE_ALIASES = {
  benz: "Mercedes-Benz",
  mercedes: "Mercedes-Benz",
  merc: "Mercedes-Benz",
  vw: "Volkswagen",
  landcruiser: "Toyota",
  rangerover: "Range Rover",
};

const BODY_TYPE_HINTS = [
  { value: "PICKUP", patterns: [/\b(pick[\s-]?up|double[\s-]?cab|single[\s-]?cab)\b/i] },
  { value: "SUV", patterns: [/\b(suv|4x4|off[\s-]?road)\b/i] },
  { value: "CROSSOVER", patterns: [/\b(crossover|cuv)\b/i] },
  { value: "HATCHBACK", patterns: [/\b(hatchback|hatch)\b/i] },
  { value: "SEDAN", patterns: [/\b(sedan|saloon)\b/i] },
  { value: "WAGON", patterns: [/\b(wagon|estate)\b/i] },
  { value: "COUPE", patterns: [/\b(coupe)\b/i] },
  { value: "CONVERTIBLE", patterns: [/\b(convertible|cabriolet|soft[\s-]?top)\b/i] },
  { value: "ROADSTER", patterns: [/\b(roadster)\b/i] },
  { value: "LIFTBACK", patterns: [/\b(liftback|fastback)\b/i] },
  { value: "MPV", patterns: [/\b(mpv|multi[\s-]?purpose)\b/i] },
  { value: "MINIVAN", patterns: [/\b(minivan)\b/i] },
  { value: "VAN", patterns: [/\b(van|panel[\s-]?van)\b/i] },
  { value: "BUS", patterns: [/\b(bus|coach)\b/i] },
  { value: "TRUCK", patterns: [/\b(truck|lorry)\b/i] },
];

const FIELD_KEYS = ["make", "model", "variant", "year", "price", "mileage", "engineCC", "bodyType"];

function toTitleCase(value = "") {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => {
      if (/^[A-Z0-9-]{2,}$/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ");
}

function clampConfidence(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function baseResult() {
  return {
    make: null,
    model: null,
    variant: null,
    year: null,
    price: null,
    mileage: null,
    engineCC: null,
    bodyType: null,
    confidence: {
      make: 0,
      model: 0,
      variant: 0,
      year: 0,
      price: 0,
      mileage: 0,
      engineCC: 0,
      bodyType: 0,
    },
    source: "rules",
    warnings: [],
  };
}

function parseWithRules(rawText) {
  const text = String(rawText || "");
  const lower = text.toLowerCase();
  const out = baseResult();

  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    const y = Number(yearMatch[0]);
    if (y >= 1970 && y <= new Date().getFullYear() + 1) {
      out.year = y;
      out.confidence.year = 0.95;
    }
  }

  for (const make of MAKES) {
    const pattern = new RegExp(`\\b${make.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (pattern.test(text)) {
      out.make = make;
      out.confidence.make = 0.97;
      break;
    }
  }

  if (!out.make) {
    for (const [alias, canonical] of Object.entries(MAKE_ALIASES)) {
      if (new RegExp(`\\b${alias}\\b`, "i").test(text)) {
        out.make = canonical;
        out.confidence.make = 0.78;
        break;
      }
    }
  }

  const pricePattern = /(?:ksh|kes|usd|\$|price|asking|cost|@)\s*[:\-]?\s*([\d,.]+)\s*(m|million|k)?\b|([\d,.]+)\s*(m|million)\b/gi;
  for (const match of text.matchAll(pricePattern)) {
    const raw = (match[1] || match[3] || "").replace(/,/g, "");
    if (!raw) continue;
    let num = Number(raw);
    if (!Number.isFinite(num)) continue;
    const suffix = (match[2] || match[4] || "").toLowerCase();
    const snippet = lower.substring(Math.max(0, (match.index || 0) - 18), (match.index || 0) + 32);
    if (suffix === "m" || suffix === "million" || snippet.includes(" million")) num *= num < 100 ? 1_000_000 : 1;
    if (suffix === "k" && !snippet.includes("km")) num *= num < 10000 ? 1000 : 1;
    if (num >= 50_000 && num <= 100_000_000) {
      out.price = Math.round(num);
      out.confidence.price = /ksh|kes|price|asking|cost|\$/i.test(snippet) ? 0.96 : 0.84;
      break;
    }
  }

  const mileagePattern = /(?:mileage[:\s-]*)?([\d,.]+)\s*(k)?\s*(?:km|kms|km's|miles)\b/i;
  const mileageMatch = text.match(mileagePattern);
  if (mileageMatch) {
    let num = Number(String(mileageMatch[1] || "").replace(/,/g, ""));
    if (Number.isFinite(num)) {
      if (mileageMatch[2] && num < 1000) num *= 1000;
      if (num > 0 && num < 1_000_000) {
        out.mileage = Math.round(num);
        out.confidence.mileage = 0.92;
      }
    }
  }

  const ccMatch = text.match(/\b(\d{3,4})\s*(?:cc)\b/i);
  if (ccMatch) {
    out.engineCC = Number(ccMatch[1]);
    out.confidence.engineCC = 0.94;
  } else {
    const literMatch = text.match(/\b(\d(?:\.\d)?)\s*(?:l|litre|liter)\b/i);
    if (literMatch) {
      const liters = Number(literMatch[1]);
      if (Number.isFinite(liters)) {
        out.engineCC = Math.round(liters * 1000);
        out.confidence.engineCC = 0.82;
      }
    }
  }

  if (out.make) {
    const words = text.split(/[\s,]+/).filter(Boolean);
    const idx = words.findIndex((w) => w.toLowerCase() === out.make.toLowerCase());
    if (idx !== -1) {
      const stop = new Set(["price","ksh","kes","usd","km","mileage","cc","litre","liter","automatic","manual","petrol","diesel","hybrid","engine","color","colour"]);
      const parts = [];
      for (let i = idx + 1; i < Math.min(words.length, idx + 5); i += 1) {
        const token = String(words[i] || "").replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9+-]+$/g, "");
        if (!token) break;
        if (stop.has(token.toLowerCase())) break;
        parts.push(token);
      }
      if (parts.length > 0) {
        out.model = toTitleCase(parts.slice(0, 2).join(" "));
        out.confidence.model = parts.length >= 2 ? 0.78 : 0.66;
        if (parts.length >= 3) {
          out.variant = toTitleCase(parts.slice(2).join(" "));
          out.confidence.variant = 0.58;
        }
      }
    }
  }

  if (!out.make) out.warnings.push("Make not confidently detected");
  if (!out.model) out.warnings.push("Model not confidently detected");
  if (!out.price) out.warnings.push("Price not confidently detected");

  for (const hint of BODY_TYPE_HINTS) {
    if (hint.patterns.some((pattern) => pattern.test(text))) {
      out.bodyType = hint.value;
      out.confidence.bodyType = 0.88;
      break;
    }
  }

  return out;
}

function mergeBest(base, candidate, source) {
  const out = { ...base, confidence: { ...base.confidence }, source: base.source, warnings: [...base.warnings] };
  for (const key of FIELD_KEYS) {
    const candValue = candidate?.[key];
    const candScore = clampConfidence(candidate?.confidence?.[key]);
    const baseScore = clampConfidence(out.confidence[key]);
    if ((candValue !== null && candValue !== undefined && candValue !== "") && candScore >= baseScore) {
      out[key] = candValue;
      out.confidence[key] = candScore;
      if (candScore > baseScore) out.source = source;
    }
  }
  return out;
}

export async function POST(request) {
  try {
    const { text } = await request.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const rules = parseWithRules(text);
    let result = rules;
    let aiUsed = false;

    const needsBoost = ["make", "model", "price"].some((k) => clampConfidence(rules.confidence[k]) < 0.75);
    if (needsBoost) {
      const llm = await parseVehicleFieldsWithGrok(text);
      if (llm && typeof llm === "object") {
        result = mergeBest(rules, llm, "llm+rules");
        aiUsed = true;
      }
    }

    const overallConfidence =
      (FIELD_KEYS.reduce((sum, key) => sum + clampConfidence(result.confidence[key]), 0) / FIELD_KEYS.length).toFixed(2);

    return NextResponse.json({
      success: true,
      data: result,
      aiUsed,
      confidenceScore: Number(overallConfidence),
      message: aiUsed ? "Smart Fill used AI + rules." : "Smart Fill used deterministic parser.",
    });
  } catch (err) {
    console.error("Parse API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
