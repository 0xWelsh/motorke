jest.mock("next/cache", () => ({
  unstable_cache: (fn) => fn,
}));

jest.mock("@/lib/db", () => ({
  db: {
    car: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body, init = {}) => ({
      status: init.status ?? 200,
      json: async () => body,
    }),
  },
}));

import { GET } from "@/app/api/search/suggestions/route";
import { db } from "@/lib/db";

describe("Search Suggestions API (GET)", () => {
  const findMany = /** @type {jest.Mock} */ (db.car.findMany);

  beforeEach(() => {
    findMany.mockReset();
  });

  test('returns suggestions for "toy" including Toyota make', async () => {
    findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ make: "Toyota" }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const res = await GET(new Request("http://localhost/api/search/suggestions?query=toy"));
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.query).toBe("toy");
    expect(Array.isArray(data.suggestions)).toBe(true);
    expect(data.suggestions.length).toBeGreaterThan(0);

    const toyotaSuggestion = data.suggestions.find((s) => s.value === "Toyota");
    expect(toyotaSuggestion).toBeDefined();
    expect(toyotaSuggestion.type).toBe("make");
  });

  test('returns suggestions for "land" including Land Cruiser model', async () => {
    findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ model: "Land Cruiser" }])
      .mockResolvedValueOnce([]);

    const res = await GET(new Request("http://localhost/api/search/suggestions?query=land"));
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.query).toBe("land");
    const landCruiserSuggestion = data.suggestions.find((s) => s.value === "Land Cruiser");
    expect(landCruiserSuggestion).toBeDefined();
    expect(landCruiserSuggestion.type).toBe("model");
  });

  test("returns payload for one-character query with bounded list", async () => {
    const makes = Array.from({ length: 8 }, (_, i) => ({ make: `Make-${i}-a` }));
    findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(makes)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const res = await GET(new Request("http://localhost/api/search/suggestions?query=a&limit=12"));
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.query).toBe("a");
    expect(Array.isArray(data.suggestions)).toBe(true);
    expect(data.suggestions.length).toBeLessThanOrEqual(8);
  });

  test("returns empty suggestions when nothing matches", async () => {
    findMany.mockResolvedValue([]);

    const res = await GET(
      new Request("http://localhost/api/search/suggestions?query=xyzabc123"),
    );
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.query).toBe("xyzabc123");
    expect(data.suggestions).toEqual([]);
  });
});
