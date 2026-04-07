jest.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/lib/mail", () => ({
  createPasswordResetToken: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
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

import { POST } from "@/app/api/auth/forgot-password/route";
import { db } from "@/lib/db";
import { createPasswordResetToken, sendPasswordResetEmail } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/captcha";

function makeRequest(body, ip = "1.1.1.1") {
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

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    checkRateLimit.mockImplementation(() => ({ limited: false, retryAfter: 0 }));
    verifyTurnstileToken.mockResolvedValue({ success: true });
    db.user.findUnique.mockResolvedValue(null);
    createPasswordResetToken.mockResolvedValue("token123");
    sendPasswordResetEmail.mockResolvedValue({ success: true });
  });

  it("returns 400 when payload is invalid", async () => {
    const response = await POST(makeRequest({ email: "bad-email", captchaToken: "human-checked" }));
    expect(response.status).toBe(400);
  });

  it("returns 429 when rate limited", async () => {
    checkRateLimit.mockReturnValueOnce({ limited: true, retryAfter: 120 });

    const response = await POST(makeRequest({ email: "dealer@motorke.com", captchaToken: "human-checked" }));
    expect(response.status).toBe(429);
  });

  it("returns 400 when captcha fails", async () => {
    verifyTurnstileToken.mockResolvedValue({ success: false });

    const response = await POST(makeRequest({ email: "dealer@motorke.com", captchaToken: "bad-token" }));
    expect(response.status).toBe(400);

    const payload = await response.json();
    expect(payload.error).toMatch(/Captcha verification failed/i);
  });

  it("sends reset email when active user exists", async () => {
    db.user.findUnique.mockResolvedValue({
      id: "u_1",
      name: "Dealer One",
      email: "dealer@motorke.com",
      active: true,
    });

    const response = await POST(makeRequest({ email: "dealer@motorke.com", captchaToken: "human-checked" }));
    expect(response.status).toBe(200);

    expect(createPasswordResetToken).toHaveBeenCalledWith("dealer@motorke.com");
    expect(sendPasswordResetEmail).toHaveBeenCalledWith({
      email: "dealer@motorke.com",
      name: "Dealer One",
      resetToken: "token123",
    });
  });

  it("returns generic success when user does not exist", async () => {
    const response = await POST(makeRequest({ email: "missing@motorke.com", captchaToken: "human-checked" }));
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.success).toBe(true);
    expect(createPasswordResetToken).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});
