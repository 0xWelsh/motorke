/**
 * Buyer "car wanted" requests — validation, public board serialization, expiry.
 */

import { BODY_TYPES, COUNTIES } from "@/lib/browse-catalog";

export const BUYER_REQUEST_TIMELINES = [
  { value: "ASAP", label: "ASAP (within a few days)" },
  { value: "WEEKS_1_2", label: "1–2 weeks" },
  { value: "MONTH_PLUS", label: "1 month or more" },
];

export const BUYER_REQUEST_CONDITIONS = [
  { value: "EITHER", label: "Local or import — either works" },
  { value: "LOCAL", label: "Kenya stock only" },
  { value: "IMPORT", label: "Open to import" },
];

export const BUYER_REQUEST_FEATURE_OPTIONS = [
  "Sunroof",
  "Leather seats",
  "Reverse camera",
  "Apple CarPlay / Android Auto",
  "AWD / 4WD",
  "Turbo",
  "Hybrid",
];

const REQUEST_TTL_DAYS = 7;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function buyerRequestExpiresAt(from = new Date()) {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + REQUEST_TTL_DAYS);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

export function generateBuyerRequestPublicCode() {
  let code = "REQ-";
  for (let i = 0; i < 5; i += 1) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export function normalizeKenyanPhone(value) {
  const digits = (value || "").toString().replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.length === 9 && /^(7|1)/.test(digits)) return `254${digits}`;
  return "";
}

export function isValidKenyanPhone(value) {
  return /^254(7\d{8}|1\d{8})$/.test(value);
}

function clampInt(value, min, max) {
  if (value == null || value === "") return null;
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
}

function clampText(value, max) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

const BODY_VALUES = new Set(BODY_TYPES.map((b) => b.value));
const COUNTY_SET = new Set(COUNTIES);

/**
 * @param {Record<string, unknown>} body
 * @returns {{ ok: true, data: object } | { ok: false, error: string }}
 */
export function parseBuyerRequestPayload(body) {
  const name = clampText(body.name, 120);
  const phone = normalizeKenyanPhone(body.phone);
  const make = clampText(body.make, 60);
  const model = clampText(body.model, 60);
  const variant = clampText(body.variant, 80) || null;
  const county = clampText(body.county, 80);
  const notes = clampText(body.notes, 300) || null;

  const budgetMin = clampInt(body.budgetMin, 0, 500_000_000);
  const budgetMax = clampInt(body.budgetMax, 0, 500_000_000);
  const yearMin = clampInt(body.yearMin, 1990, 2030);
  const yearMax = clampInt(body.yearMax, 1990, 2030);
  const mileageMin = clampInt(body.mileageMin, 0, 2_000_000);
  const mileageMax = clampInt(body.mileageMax, 0, 2_000_000);

  const timeline = BUYER_REQUEST_TIMELINES.some((t) => t.value === body.timeline)
    ? body.timeline
    : "ASAP";
  const conditionPref = BUYER_REQUEST_CONDITIONS.some((c) => c.value === body.conditionPref)
    ? body.conditionPref
    : "EITHER";

  const bodyType =
    typeof body.bodyType === "string" && BODY_VALUES.has(body.bodyType) ? body.bodyType : null;
  const fuelType =
    typeof body.fuelType === "string" &&
    ["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG"].includes(body.fuelType)
      ? body.fuelType
      : null;
  const transmission =
    typeof body.transmission === "string" &&
    ["AUTOMATIC", "MANUAL", "CVT"].includes(body.transmission)
      ? body.transmission
      : null;

  const features = Array.isArray(body.features)
    ? body.features
        .filter((f) => typeof f === "string" && BUYER_REQUEST_FEATURE_OPTIONS.includes(f))
        .slice(0, 8)
    : [];

  const consentWhatsapp = body.consentWhatsapp !== false && body.consentWhatsapp !== "false";

  if (!name) return { ok: false, error: "Please enter your name." };
  if (!isValidKenyanPhone(phone)) {
    return { ok: false, error: "Enter a valid Kenyan WhatsApp number (e.g. 07XX XXX XXX)." };
  }
  if (!make) return { ok: false, error: "Make is required." };
  if (!model) return { ok: false, error: "Model is required." };
  if (!budgetMax || budgetMax < 100_000) {
    return { ok: false, error: "Please set a maximum budget (at least KES 100,000)." };
  }
  if (budgetMin != null && budgetMin > budgetMax) {
    return { ok: false, error: "Minimum budget cannot be higher than maximum budget." };
  }
  if (yearMin != null && yearMax != null && yearMin > yearMax) {
    return { ok: false, error: "Year range is invalid." };
  }
  if (mileageMin != null && mileageMax != null && mileageMin > mileageMax) {
    return { ok: false, error: "Mileage range is invalid." };
  }
  if (!county || !COUNTY_SET.has(county)) {
    return { ok: false, error: "Please select your county." };
  }
  if (!consentWhatsapp) {
    return { ok: false, error: "WhatsApp contact consent is required to receive offers." };
  }

  return {
    ok: true,
    data: {
      name,
      phone,
      make,
      model,
      variant,
      yearMin,
      yearMax,
      budgetMin,
      budgetMax,
      bodyType,
      fuelType,
      transmission,
      mileageMin,
      mileageMax,
      county,
      timeline,
      conditionPref,
      features,
      notes,
      consentWhatsapp,
    },
  };
}

function formatKes(amount) {
  if (amount == null) return null;
  if (amount >= 1_000_000) return `KES ${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `KES ${Math.round(amount / 1_000)}K`;
  return `KES ${amount}`;
}

function timelineLabel(value) {
  return BUYER_REQUEST_TIMELINES.find((t) => t.value === value)?.label || value;
}

/**
 * Public-safe card (no phone/name).
 * @param {import('@prisma/client').BuyerRequest} row
 */
export function serializeBuyerRequestPublic(row) {
  const now = Date.now();
  const expired = row.expiresAt && new Date(row.expiresAt).getTime() < now;
  const open = row.status === "OPEN" && !expired;

  const yearPart =
    row.yearMin && row.yearMax
      ? row.yearMin === row.yearMax
        ? String(row.yearMin)
        : `${row.yearMin}–${row.yearMax}`
      : row.yearMin
        ? `${row.yearMin}+`
        : row.yearMax
          ? `Up to ${row.yearMax}`
          : "Any year";

  const budgetPart =
    row.budgetMin != null
      ? `${formatKes(row.budgetMin)} – ${formatKes(row.budgetMax)}`
      : `Up to ${formatKes(row.budgetMax)}`;

  return {
    id: row.id,
    publicCode: row.publicCode,
    title: `${yearPart} ${row.make} ${row.model}`.replace(/\s+/g, " ").trim(),
    variant: row.variant,
    budgetLabel: budgetPart,
    county: row.county,
    timeline: row.timeline,
    timelineLabel: timelineLabel(row.timeline),
    bodyType: row.bodyType,
    fuelType: row.fuelType,
    transmission: row.transmission,
    mileageMin: row.mileageMin,
    mileageMax: row.mileageMax,
    conditionPref: row.conditionPref,
    features: row.features || [],
    notesPreview: row.notes ? row.notes.slice(0, 120) : null,
    status: expired && row.status === "OPEN" ? "EXPIRED" : row.status,
    isOpen: open,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    offerClicks: row.offerClicks,
  };
}

/**
 * @param {import('@prisma/client').BuyerRequest} row
 */
export function buildSellerOfferWhatsAppMessage(row) {
  const pub = serializeBuyerRequestPublic(row);
  const lines = [
    `Hi Welsh Motorhub, I have an offer for buyer request ${pub.publicCode}.`,
    "",
    `Vehicle: ${pub.title}${pub.variant ? ` (${pub.variant})` : ""}`,
    `Budget: ${pub.budgetLabel}`,
    `County: ${pub.county}`,
    `Timeline: ${pub.timelineLabel}`,
    "",
    "My offer:",
    "- Price: KES ",
    "- Unit details: ",
    "- Availability: ",
  ];
  return lines.join("\n");
}
