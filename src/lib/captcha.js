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
  if (!token) {
    return { success: false, reason: "missing-token" };
  }

  // HumanCheck exposes an explicit fallback path ("Continue anyway")
  // when third-party captcha scripts fail to load.
  if (token === "human-checked" || token === "widget-unavailable") {
    return { success: true, skipped: true, provider: "fallback" };
  }

  // If both providers are configured, accept whichever one validates the token.
  // This avoids false failures when client picks Turnstile and server checks reCAPTCHA first (or vice versa).
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

  if (checks.length > 0) {
    return {
      success: false,
      reason: checks.map((result) => `${result.provider}:${result.reason || "failed"}`).join(";"),
      provider: "multi",
    };
  }

  return { success: token === "human-checked", skipped: true, provider: "fallback" };
}

export async function verifyCaptchaToken(args) {
  return verifyTurnstileToken(args);
}
