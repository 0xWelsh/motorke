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

  if (RECAPTCHA_SECRET) {
    return verifyRecaptchaToken({ token, ip });
  }

  if (TURNSTILE_SECRET) {
    return verifyCloudflareTurnstileToken({ token, ip });
  }

  return { success: token === "human-checked", skipped: true, provider: "fallback" };
}

export async function verifyCaptchaToken(args) {
  return verifyTurnstileToken(args);
}
