/** Node-safe CRSP CSV parser (no Next.js @/ aliases). */

export const DUTY_CRSP_CSV_HEADERS = [
  "make",
  "model",
  "trim",
  "year",
  "engineCC",
  "fuelType",
  "bodyType",
  "crspKes",
  "notes",
];

const FUEL_TYPES = new Set(["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG"]);
const BODY_TYPES = new Set([
  "SEDAN",
  "SUV",
  "HATCHBACK",
  "PICKUP",
  "VAN",
  "WAGON",
  "COUPE",
  "CONVERTIBLE",
  "CROSSOVER",
  "MPV",
  "MINIVAN",
  "ROADSTER",
  "LIFTBACK",
  "BUS",
  "TRUCK",
]);

function slugifySegment(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Matches `buildDutyVehicleSlug` in src/lib/duty-vehicle-slug.js */
export function buildDutyVehicleSlug({ make, model, year, trim }) {
  return [make, model, trim, year]
    .filter(Boolean)
    .map(slugifySegment)
    .filter(Boolean)
    .join("-");
}

function normalizeHeader(cell) {
  return String(cell || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

const HEADER_ALIASES = {
  make: "make",
  manufacturer: "make",
  model: "model",
  trim: "trim",
  variant: "trim",
  year: "year",
  modelyear: "year",
  enginecc: "engineCC",
  cc: "engineCC",
  capacity: "engineCC",
  fueltype: "fuelType",
  fuel: "fuelType",
  bodytype: "bodyType",
  body: "bodyType",
  crspkes: "crspKes",
  crsp: "crspKes",
  crspvalue: "crspKes",
  valuekes: "crspKes",
  notes: "notes",
  note: "notes",
};

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
      row.push(cell);
      if (row.some((c) => String(c).trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      if (ch === "\r") i += 1;
    } else if (ch !== "\r") {
      cell += ch;
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((c) => String(c).trim() !== "")) rows.push(row);
  }

  return rows;
}

function parseIntKes(value) {
  const cleaned = String(value ?? "").replace(/[,\s]/g, "");
  if (!cleaned) return NaN;
  return parseInt(cleaned, 10);
}

function normalizeFuelType(raw) {
  const u = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!u) return null;
  if (FUEL_TYPES.has(u)) return u;
  if (u === "GAS" || u === "GASOLINE") return "PETROL";
  if (u === "PHEV" || u === "PLUGIN") return "HYBRID";
  return null;
}

function normalizeBodyType(raw) {
  const u = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!u) return null;
  return BODY_TYPES.has(u) ? u : null;
}

export function parseDutyCrspCsv(csvText) {
  const errors = [];
  const parsed = parseCsvRows(String(csvText || "").replace(/^\uFEFF/, ""));
  if (!parsed.length) {
    return { rows: [], errors: [{ line: 1, message: "CSV is empty" }] };
  }

  const headerCells = parsed[0].map(normalizeHeader);
  const fieldIndexes = {};
  headerCells.forEach((h, idx) => {
    const key = HEADER_ALIASES[h];
    if (key && fieldIndexes[key] === undefined) fieldIndexes[key] = idx;
  });

  const required = ["make", "model", "year", "engineCC", "fuelType", "crspKes"];
  const missing = required.filter((k) => fieldIndexes[k] === undefined);
  if (missing.length) {
    return {
      rows: [],
      errors: [
        {
          line: 1,
          message: `Missing columns: ${missing.join(", ")}. Expected: ${DUTY_CRSP_CSV_HEADERS.join(", ")}`,
        },
      ],
    };
  }

  const rows = [];
  for (let i = 1; i < parsed.length; i += 1) {
    const line = i + 1;
    const cells = parsed[i];
    const get = (key) => {
      const idx = fieldIndexes[key];
      return idx === undefined ? "" : String(cells[idx] ?? "").trim();
    };

    const make = get("make");
    const model = get("model");
    if (!make && !model) continue;

    const year = parseInt(get("year"), 10);
    const engineCC = parseInt(get("engineCC"), 10);
    const crspKes = parseIntKes(get("crspKes"));
    const fuelType = normalizeFuelType(get("fuelType"));
    const bodyType = normalizeBodyType(get("bodyType"));
    const trim = get("trim") || null;
    const notes = get("notes") || null;

    if (!make) errors.push({ line, message: "make is required" });
    if (!model) errors.push({ line, message: "model is required" });
    if (!Number.isFinite(year) || year < 1980 || year > new Date().getFullYear() + 1) {
      errors.push({ line, message: `invalid year: ${get("year")}` });
    }
    if (!Number.isFinite(engineCC) || engineCC < 600 || engineCC > 8000) {
      errors.push({ line, message: `invalid engineCC: ${get("engineCC")}` });
    }
    if (!fuelType) errors.push({ line, message: `invalid fuelType: ${get("fuelType")}` });
    if (!Number.isFinite(crspKes) || crspKes <= 0) {
      errors.push({ line, message: `invalid crspKes: ${get("crspKes")}` });
    }
    if (get("bodyType") && !bodyType) {
      errors.push({ line, message: `invalid bodyType: ${get("bodyType")}` });
    }

    if (
      !make ||
      !model ||
      !Number.isFinite(year) ||
      !Number.isFinite(engineCC) ||
      !fuelType ||
      !Number.isFinite(crspKes) ||
      crspKes <= 0
    ) {
      continue;
    }

    rows.push({
      make,
      model,
      trim,
      year,
      engineCC,
      fuelType,
      bodyType,
      crspKes,
      notes,
      line,
    });
  }

  return { rows, errors };
}

export function generateDutyCrspTemplateCsv() {
  const header = DUTY_CRSP_CSV_HEADERS.join(",");
  const example =
    'Toyota,Prado,TX,2018,2800,DIESEL,SUV,5400000,"Illustrative. Verify with KRA CRSP schedule."';
  return `${header}\n${example}\n`;
}

export async function upsertDutyCrspRows(prisma, rows, { source = "csv-import", dryRun = false } = {}) {
  let upserted = 0;
  let skipped = 0;
  const rowErrors = [];

  for (const row of rows) {
    const slug = buildDutyVehicleSlug(row);
    if (!slug) {
      rowErrors.push({ line: row.line, message: "Could not build slug" });
      skipped += 1;
      continue;
    }

    if (dryRun) {
      upserted += 1;
      continue;
    }

    try {
      await prisma.dutyVehicle.upsert({
        where: { slug },
        create: {
          make: row.make,
          model: row.model,
          trim: row.trim,
          year: row.year,
          engineCC: row.engineCC,
          fuelType: row.fuelType,
          bodyType: row.bodyType,
          crspKes: row.crspKes,
          slug,
          active: true,
          source,
          notes: row.notes || "Imported CRSP reference. Verify against official KRA schedule.",
        },
        update: {
          make: row.make,
          model: row.model,
          trim: row.trim,
          year: row.year,
          engineCC: row.engineCC,
          fuelType: row.fuelType,
          bodyType: row.bodyType,
          crspKes: row.crspKes,
          active: true,
          source,
          ...(row.notes ? { notes: row.notes } : {}),
        },
      });
      upserted += 1;
    } catch (err) {
      rowErrors.push({ line: row.line, message: err?.message || "Upsert failed" });
      skipped += 1;
    }
  }

  return { upserted, skipped, rowErrors };
}
