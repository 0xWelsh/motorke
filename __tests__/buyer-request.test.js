import {
  parseBuyerRequestPayload,
  serializeBuyerRequestPublic,
  buyerRequestExpiresAt,
  isValidKenyanPhone,
} from "@/lib/buyer-request";

describe("buyer-request", () => {
  it("validates a complete payload", () => {
    const result = parseBuyerRequestPayload({
      name: "Jane Buyer",
      phone: "0712345678",
      make: "Toyota",
      model: "Harrier",
      budgetMax: "3500000",
      county: "Nairobi",
      consentWhatsapp: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.phone).toBe("254712345678");
      expect(result.data.budgetMax).toBe(3500000);
    }
  });

  it("rejects invalid phone", () => {
    const result = parseBuyerRequestPayload({
      name: "Jane",
      phone: "123",
      make: "Toyota",
      model: "Harrier",
      budgetMax: "2000000",
      county: "Nairobi",
    });
    expect(result.ok).toBe(false);
  });

  it("serializes public view without phone", () => {
    const row = {
      id: "abc",
      publicCode: "REQ-ABC12",
      make: "Toyota",
      model: "Harrier",
      variant: null,
      yearMin: 2018,
      yearMax: 2020,
      budgetMin: null,
      budgetMax: 3500000,
      county: "Nairobi",
      timeline: "ASAP",
      bodyType: "SUV",
      fuelType: null,
      transmission: null,
      mileageMin: null,
      mileageMax: null,
      conditionPref: "EITHER",
      features: [],
      notes: null,
      status: "OPEN",
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      offerClicks: 0,
    };
    const pub = serializeBuyerRequestPublic(row);
    expect(pub.publicCode).toBe("REQ-ABC12");
    expect(pub.isOpen).toBe(true);
    expect(pub.title).toContain("Toyota");
    expect(pub).not.toHaveProperty("phone");
  });

  it("expires after seven days window", () => {
    const exp = buyerRequestExpiresAt(new Date("2026-05-27T10:00:00Z"));
    expect(exp.getUTCDate()).toBe(3);
    expect(exp.getUTCMonth()).toBe(5);
  });

  it("accepts kenyan phone formats", () => {
    expect(isValidKenyanPhone("254712345678")).toBe(true);
  });
});
