const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;

export function isCaptchaConfigured() {
  return Boolean(RECAPTCHA_SECRET || TURNSTILE_SECRET);
}

async function verifyRecaptchaToken({ token, ip }) {
  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: RECAPTCHA_SECRET,
        response: token,
        remoteip: ip || "",
      }),
    });

    if (!response.ok) {
      return { success: false, reason: "verification-request-failed", provider: "recaptcha" };
    }

    const payload = await response.json();
    return {
      success: Boolean(payload?.success),
      reason: payload?.["error-codes"]?.join(",") || null,
      provider: "recaptcha",
    };
  } catch {
    return { success: false, reason: "verification-network-error", provider: "recaptcha" };
  }
}

async function verifyCloudflareTurnstileToken({ token, ip }) {
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: TURNSTILE_SECRET,
        response: token,
        remoteip: ip || "",
      }),
    });

    if (!response.ok) {
      return { success: false, reason: "verification-request-failed", provider: "turnstile" };
    }

    const payload = await response.json();
    return {
      success: Boolean(payload?.success),
      reason: payload?.["error-codes"]?.join(",") || null,
      provider: "turnstile",
    };
  } catch {
    return { success: false, reason: "verification-network-error", provider: "turnstile" };
  }
}

export async function verifyTurnstileToken({ token, ip }) {
  // When no provider is configured at all (dev/local), there's nothing to
  // verify against. Treat as "skipped" so local development still works.
  // In production the env validator forces a provider to be set.
  if (!RECAPTCHA_SECRET && !TURNSTILE_SECRET) {
    return { success: true, skipped: true, provider: "not-configured" };
  }

  if (!token || typeof token !== "string") {
    return { success: false, reason: "missing-token" };
  }

  // SECURITY: previously we accepted the magic strings "human-checked" and
  // "widget-unavailable" as proof of humanity. That meant any attacker could
  // POST `captchaToken=widget-unavailable` and bypass the captcha entirely.
  // No magic strings. Token must be verified by the upstream provider.
  if (token.length < 20) {
    return { success: false, reason: "invalid-token-format" };
  }

  // If both providers are configured, accept whichever validates the token.
  // This avoids false failures when the client renders Turnstile but the
  // server check order put reCAPTCHA first (and vice versa).
  const checks = [];

  if (RECAPTCHA_SECRET) {
    checks.push(await verifyRecaptchaToken({ token, ip }));
  }

  if (TURNSTILE_SECRET) {
    checks.push(await verifyCloudflareTurnstileToken({ token, ip }));
  }

  const successResult = checks.find((result) => result?.success);
  if (successResult) {
    return successResult;
  }

  return {
    success: false,
    reason: checks.map((result) => `${result.provider}:${result.reason || "failed"}`).join(";") || "verification-failed",
    provider: "multi",
  };
}

export async function verifyCaptchaToken(args) {
  return verifyTurnstileToken(args);
}
