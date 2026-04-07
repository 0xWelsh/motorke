jest.mock("@/lib/db", () => ({
  db: {
    verificationToken: {
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    session: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("@/lib/auth", () => ({
  hashPassword: jest.fn(),
}));

jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: jest.fn(),
}));

jest.mock("@/lib/captcha", () => ({
  verifyTurnstileToken: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body, init = {}) => ({
      status: init.status || 200,
      headers: {
        get: (name) => (init.headers || {})[name],
      },
      json: async () => body,
    }),
  },
}));

import { POST } from "@/app/api/auth/reset-password/route";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/captcha";

function makeRequest(body, ip = "2.2.2.2") {
  return {
    json: async () => body,
    headers: {
      get: (name) => {
        const key = (name || "").toLowerCase();
        if (key === "x-forwarded-for") return ip;
        if (key === "x-real-ip") return ip;
        return null;
      },
    },
  };
}

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    checkRateLimit.mockImplementation(() => ({ limited: false, retryAfter: 0 }));

    verifyTurnstileToken.mockResolvedValue({ success: true });
    db.verificationToken.findUnique.mockResolvedValue(null);
    db.verificationToken.deleteMany.mockResolvedValue({ count: 1 });
    db.user.findUnique.mockResolvedValue({ id: "u_1" });
    db.user.update.mockResolvedValue({ id: "u_1" });
    db.session.deleteMany.mockResolvedValue({ count: 1 });
    db.$transaction.mockResolvedValue([]);
    hashPassword.mockResolvedValue("hashed-password");
  });

  it("returns 400 when passwords do not match", async () => {
    const response = await POST(
      makeRequest({
        email: "dealer@motorke.com",
        token: "valid-reset-token-123",
        password: "Password123!",
        confirm: "Mismatch123!",
        captchaToken: "human-checked",
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns 429 when rate limited", async () => {
    checkRateLimit.mockReturnValueOnce({ limited: true, retryAfter: 60 });

    const response = await POST(
      makeRequest({
        email: "dealer@motorke.com",
        token: "valid-reset-token-123",
        password: "Password123!",
        confirm: "Password123!",
        captchaToken: "human-checked",
      })
    );

    expect(response.status).toBe(429);
  });

  it("returns 400 when captcha fails", async () => {
    verifyTurnstileToken.mockResolvedValue({ success: false });

    const response = await POST(
      makeRequest({
        email: "dealer@motorke.com",
        token: "valid-reset-token-123",
        password: "Password123!",
        confirm: "Password123!",
        captchaToken: "bad-token",
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid token", async () => {
    db.verificationToken.findUnique.mockResolvedValue(null);

    const response = await POST(
      makeRequest({
        email: "dealer@motorke.com",
        token: "valid-reset-token-123",
        password: "Password123!",
        confirm: "Password123!",
        captchaToken: "human-checked",
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 for expired token and clears reset tokens", async () => {
    db.verificationToken.findUnique.mockResolvedValue({
      identifier: "reset:dealer@motorke.com",
      token: "valid-reset-token-123",
      expires: new Date(Date.now() - 1000),
    });

    const response = await POST(
      makeRequest({
        email: "dealer@motorke.com",
        token: "valid-reset-token-123",
        password: "Password123!",
        confirm: "Password123!",
        captchaToken: "human-checked",
      })
    );

    expect(response.status).toBe(400);
    expect(db.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { identifier: "reset:dealer@motorke.com" },
    });
  });

  it("resets password and invalidates sessions when request is valid", async () => {
    db.verificationToken.findUnique.mockResolvedValue({
      identifier: "reset:dealer@motorke.com",
      token: "valid-reset-token-123",
      expires: new Date(Date.now() + 1000 * 60),
    });
    db.user.findUnique.mockResolvedValue({ id: "u_1" });

    const response = await POST(
      makeRequest({
        email: "dealer@motorke.com",
        token: "valid-reset-token-123",
        password: "Password123!",
        confirm: "Password123!",
        captchaToken: "human-checked",
      })
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.success).toBe(true);

    expect(hashPassword).toHaveBeenCalledWith("Password123!");
    expect(db.user.update).toHaveBeenCalled();
    expect(db.verificationToken.deleteMany).toHaveBeenCalled();
    expect(db.session.deleteMany).toHaveBeenCalled();
    expect(db.$transaction).toHaveBeenCalledTimes(1);
  });
});
