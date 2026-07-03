import { db } from "@/lib/db";
import { formatCarPrice } from "@/lib/utils";
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/constants";
import { getHeroImageUrl } from "@/lib/image-transform";
import { publicDetailVisibilityClause } from "@/lib/car-sold-status";

const KNOWN_MAKES = [
  "Toyota", "Nissan", "Honda", "BMW", "Mercedes", "Mitsubishi",
  "Subaru", "Mazda", "Volkswagen", "Audi", "Lexus", "Hyundai",
  "Kia", "Suzuki", "Isuzu", "Land Rover", "Range Rover", "Jaguar",
  "Ford", "Chevrolet", "Peugeot", "Renault", "Volvo", "Porsche",
  "Ferrari", "Lamborghini", "Bentley", "Rolls Royce", "Daihatsu",
  "Mini", "Jeep", "Chrysler", "Dodge", "MG", "BYD",
];

const PRICE_PATTERNS = [
  { regex: /(?:under|below|less than|max|upto|up to)\s*([\d,.kmbt]+)/i, type: "max" },
  { regex: /(?:above|over|more than|min|from|starting)\s*([\d,.kmbt]+)/i, type: "min" },
  { regex: /([\d,.kmbt]+)\s*(?:-|to|–)\s*([\d,.kmbt]+)/i, type: "range" },
  { regex: /([\d,.kmbt]+)\s*(?:-|to|–)?\s*(?:million|m|k)/ig, type: "detect" },
];

const FUEL_KEYWORDS = {
  diesel: "DIESEL", petrol: "PETROL", hybrid: "HYBRID", electric: "ELECTRIC",
};

const BODY_KEYWORDS = {
  sedan: "SEDAN", "saloon": "SEDAN",
  suv: "SUV", "4x4": "SUV", "offroad": "SUV",
  hatchback: "HATCHBACK",
  pickup: "PICKUP", "double cab": "PICKUP",
  van: "VAN",
  wagon: "WAGON", "estate": "WAGON",
  coupe: "COUPE",
  convertible: "CONVERTIBLE",
  crossover: "CROSSOVER",
};

const TRANS_KEYWORDS = {
  automatic: "AUTOMATIC", auto: "AUTOMATIC", at: "AUTOMATIC",
  manual: "MANUAL", mt: "MANUAL",
  cvt: "CVT",
};

function parsePriceValue(str) {
  const s = String(str).replace(/,/g, "").trim().toLowerCase();
  let num = parseFloat(s.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return null;
  if (s.includes("m") || s.includes("million")) num *= 1000000;
  else if (s.includes("k")) num *= 1000;
  return Math.round(num);
}

function extractPrice(text) {
  for (const { regex, type } of PRICE_PATTERNS) {
    const match = text.match(regex);
    if (!match) continue;
    if (type === "range") {
      const min = parsePriceValue(match[1]);
      const max = parsePriceValue(match[2]);
      if (min && max) return { min, max };
    } else if (type === "max") {
      const val = parsePriceValue(match[1]);
      if (val) return { max: val };
    } else if (type === "min") {
      const val = parsePriceValue(match[1]);
      if (val) return { min: val };
    }
  }
  const numbers = text.match(/([\d,.]+)\s*(?:-|to|–)\s*([\d,.]+)/);
  if (numbers) {
    const min = parsePriceValue(numbers[1]);
    const max = parsePriceValue(numbers[2]);
    if (min && max) return { min, max };
  }
  return {};
}

function extractYear(text) {
  const years = text.match(/\b(19[5-9]\d|20[0-3]\d)\b/g);
  if (!years) return {};
  const nums = years.map(Number).sort((a, b) => a - b);
  if (nums.length >= 2) return { minYOM: nums[0], maxYOM: nums[nums.length - 1] };
  const y = nums[0];
  return { minYOM: y, maxYOM: y };
}

function extractMake(text) {
  for (const make of KNOWN_MAKES) {
    if (new RegExp(`\\b${make.replace(/\s+/, "\\s+")}\\b`, "i").test(text)) return make;
  }
  return null;
}

function extractModel(text, make) {
  if (!make) return null;
  const afterMake = text.split(new RegExp(make, "i"))[1];
  if (!afterMake) return null;
  const words = afterMake.trim().split(/\s+/).slice(0, 3);
  return words.join(" ");
}

function extractFuel(text) {
  for (const [word, val] of Object.entries(FUEL_KEYWORDS)) {
    if (new RegExp(`\\b${word}\\b`, "i").test(text)) return val;
  }
  return null;
}

function extractBodyType(text) {
  for (const [word, val] of Object.entries(BODY_KEYWORDS)) {
    if (new RegExp(`\\b${word}\\b`, "i").test(text)) return val;
  }
  return null;
}

function extractTransmission(text) {
  for (const [word, val] of Object.entries(TRANS_KEYWORDS)) {
    if (new RegExp(`\\b${word}\\b`, "i").test(text)) return val;
  }
  return null;
}

function detectIntent(text) {
  const lower = text.toLowerCase().trim();
  if (/^(hi|hello|hey|hie|howdy|good\s*(morning|afternoon|evening)|sup|bot|help|menu|what can you)/.test(lower)) {
    return "GREETING";
  }
  if (/^(more|next|show more)/.test(lower)) {
    return "MORE";
  }
  if (/^(contact|call|phone|talk|speak)/.test(lower)) {
    return "CONTACT";
  }
  if (/^(list|show|find|search|have|got|looking|want|need|available|sell|price|budget)/.test(lower)) {
    return "SEARCH";
  }
  if (/(?:list|show|find|search|have|got|looking|want|need|available)\b/.test(lower)) {
    return "SEARCH";
  }
  const hasMake = KNOWN_MAKES.some((m) => new RegExp(`\\b${m}\\b`, "i").test(text));
  if (hasMake) return "SEARCH";
  if (/\b(price|budget|cost|million|kes|ksh|under|below)\b/i.test(lower)) return "SEARCH";
  return "GREETING";
}

const RESULTS_PER_PAGE = 5;

async function searchCars(filters) {
  const where = {
    ...publicDetailVisibilityClause(),
    available: true,
  };

  if (filters.make) {
    where.make = { equals: filters.make, mode: "insensitive" };
  }
  if (filters.model) {
    where.model = { contains: filters.model, mode: "insensitive" };
  }
  if (filters.minPrice || filters.maxPrice) {
    where.price = {};
    if (filters.minPrice) where.price.gte = filters.minPrice;
    if (filters.maxPrice) where.price.lte = filters.maxPrice;
    if (!filters.minPrice && filters.maxPrice) {
      where.price.gte = 0;
    }
  }
  if (filters.minYOM || filters.maxYOM) {
    where.year = {};
    if (filters.minYOM) where.year.gte = filters.minYOM;
    if (filters.maxYOM) where.year.lte = filters.maxYOM;
  }
  if (filters.fuelType) where.fuelType = filters.fuelType;
  if (filters.bodyType) where.bodyType = filters.bodyType;
  if (filters.transmission) where.transmission = filters.transmission;

  const [cars, total] = await Promise.all([
    db.car.findMany({
      where,
      select: {
        id: true,
        publicSlug: true,
        make: true,
        model: true,
        variant: true,
        year: true,
        price: true,
        mileage: true,
        fuelType: true,
        transmission: true,
        engineCC: true,
        bodyType: true,
        color: true,
        condition: true,
        location: true,
        images: {
          take: 1,
          orderBy: { isPrimary: "desc" },
        },
      },
      orderBy: [
        { year: "desc" },
        { createdAt: "desc" },
      ],
      skip: (filters.page || 0) * RESULTS_PER_PAGE,
      take: RESULTS_PER_PAGE + 1,
    }),
    db.car.count({ where }),
  ]);

  const hasMore = cars.length > RESULTS_PER_PAGE;
  if (hasMore) cars.pop();

  return { cars, total, hasMore, page: filters.page || 0 };
}

function formatCarCaption(car, index) {
  const title = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
  const price = formatCarPrice(car);
  const mileage = car.mileage ? `${Number(car.mileage).toLocaleString("en-KE")} km` : null;
  const fuel = car.fuelType ? (FUEL_LABELS[car.fuelType] || car.fuelType) : null;
  const trans = car.transmission ? (TRANSMISSION_LABELS[car.transmission] || car.transmission) : null;
  const location = car.location || "Kenya";

  let caption = `${index + 1}. *${title}*\n💰 ${price}\n📍 ${location}`;
  if (mileage) caption += `\n⚡ ${mileage}`;
  if (fuel) caption += ` · ${fuel}`;
  if (trans) caption += ` · ${trans}`;

  const slug = car.publicSlug || car.id;
  caption += `\n🔗 ${process.env.NEXT_PUBLIC_SITE_URL || "https://welshmotorhub.co.ke"}/cars/${slug}`;

  return caption;
}

function buildGreeting() {
  return (
    "*Welsh Motorhub Bot* 🚗\n\n" +
    "Send me a message to search cars in stock. Examples:\n\n" +
    "• \"show Toyota under 3M\"\n" +
    "• \"Nissan X-Trail 2020\"\n" +
    "• \"diesel SUV below 5 million\"\n" +
    "• \"BMW automatic under 4M\"\n" +
    "• \"more\" — see next results\n\n" +
    "Reply *contact* to speak with our team."
  );
}

const WELCOME_FOLLOWUP =
  "Type what you're looking for — e.g. \"Toyota under 3M\" or just a make like \"Subaru\".";

export const SESSION_TTL = 5 * 60 * 1000;

export class BotSession {
  constructor(phone) {
    this.phone = phone;
    this.lastQuery = null;
    this.lastFilters = null;
    this.page = 0;
    this.updatedAt = Date.now();
  }

  touch() {
    this.updatedAt = Date.now();
  }

  isExpired() {
    return Date.now() - this.updatedAt > SESSION_TTL;
  }
}

const sessions = new Map();

export function getSession(phone) {
  let session = sessions.get(phone);
  if (!session) {
    session = new BotSession(phone);
    sessions.set(phone, session);
  }
  session.touch();
  return session;
}

export function cleanupSessions() {
  for (const [phone, session] of sessions) {
    if (session.isExpired()) sessions.delete(phone);
  }
}

setInterval(cleanupSessions, SESSION_TTL);

export async function handleMessage(from, body) {
  const phone = String(from).replace(/\D/g, "");
  const session = getSession(phone);
  const text = String(body || "").trim();

  if (!text) {
    return [{ type: "text", content: "Hi! Send me a message like \"Toyota under 3M\" to search cars." }];
  }

  const intent = detectIntent(text);

  if (intent === "GREETING" && text.toLowerCase().match(/^(hi|hello|hey|hie|howdy|sup)$/)) {
    return [
      { type: "text", content: buildGreeting() },
    ];
  }

  if (intent === "GREETING") {
    const hasSearchTerms = /(?:toyota|nissan|honda|bmw|mercedes|subaru|mazda|car|price|budget|under|million)/i.test(text);
    if (!hasSearchTerms) {
      return [{ type: "text", content: buildGreeting() }];
    }
  }

  if (intent === "CONTACT") {
    return [{
      type: "text",
      content:
        "Speak with our team:\n" +
        "📞 +254 717 303 587\n" +
        "💬 wa.me/254717303587\n\n" +
        "Or visit: welshmotorhub.co.ke",
    }];
  }

  if (intent === "MORE") {
    if (!session.lastFilters) {
      return [{ type: "text", content: "Search first! Try \"Toyota under 3M\" or \"Subaru Outback\"." }];
    }
    session.page += 1;
    const filters = { ...session.lastFilters, page: session.page };
    const result = await searchCars(filters);

    if (result.cars.length === 0) {
      session.lastFilters = null;
      session.page = 0;
      return [{ type: "text", content: "No more results. Try a different search?" }];
    }

    return formatResults(result, session);
  }

  const make = extractMake(text);
  const model = extractModel(text, make);

  let modelFilter = null;
  if (model) {
    const knownModels = await db.car.findMany({
      where: { make: { equals: make, mode: "insensitive" } },
      select: { model: true },
      distinct: ["model"],
      take: 50,
    });
    const matched = knownModels.find((m) =>
      m.model.toLowerCase().includes(model.toLowerCase())
    );
    if (matched) modelFilter = matched.model;
  }

  const filters = {
    make,
    model: modelFilter || (!make ? text : null),
    ...extractPrice(text),
    ...extractYear(text),
    fuelType: extractFuel(text),
    bodyType: extractBodyType(text),
    transmission: extractTransmission(text),
    page: 0,
  };

  session.lastQuery = text;
  session.lastFilters = filters;
  session.page = 0;

  const result = await searchCars(filters);
  return formatResults(result, session);
}

async function formatResults(result, session) {
  if (result.total === 0) {
    session.lastFilters = null;
    return [{
      type: "text",
      content:
        "Sorry, no cars match that right now 🙁\n\n" +
        "Try a different make, budget, or browse all at welshmotorhub.co.ke",
    }];
  }

  const messages = [];

  if (session.lastQuery) {
    const filterParts = [];
    const f = session.lastFilters;
    if (f.make) filterParts.push(f.make);
    if (f.fuelType) filterParts.push(FUEL_LABELS[f.fuelType] || f.fuelType);
    if (f.bodyType) {
      const labels = { SEDAN: "Sedans", SUV: "SUVs", HATCHBACK: "Hatchbacks", PICKUP: "Pickups" };
      filterParts.push(labels[f.bodyType] || f.bodyType);
    }
    if (f.minPrice || f.maxPrice) {
      const min = f.minPrice ? `KES ${f.minPrice.toLocaleString("en-KE")}` : "";
      const max = f.maxPrice ? `KES ${f.maxPrice.toLocaleString("en-KE")}` : "";
      if (min && max) filterParts.push(`${min} - ${max}`);
      else if (min) filterParts.push(`from ${min}`);
      else filterParts.push(`under ${max}`);
    }

    const label = filterParts.length ? ` for *${filterParts.join(" ")}*` : "";
    messages.push({
      type: "text",
      content: `Found *${result.total}* car${result.total !== 1 ? "s" : ""}${label}:`,
    });
  }

  for (const car of result.cars) {
    const primaryImg = car.images?.[0]?.url || null;
    const caption = formatCarCaption(car, result.cars.indexOf(car));

    if (primaryImg) {
      const imgUrl = getHeroImageUrl(primaryImg, 70, 600);
      messages.push({ type: "image", imageUrl: imgUrl, caption });
    } else {
      messages.push({ type: "text", content: caption });
    }
  }

  if (result.hasMore) {
    messages.push({
      type: "text",
      content: `Showing ${result.cars.length} of ${result.total} — reply *more* to see next`,
    });
  }

  return messages;
}
