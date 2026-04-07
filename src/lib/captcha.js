const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;

export function isCaptchaConfigured() {
  return Boolean(TURNSTILE_SECRET);
}

export async function verifyTurnstileToken({ token, ip }) {
  if (!token) {
    return { success: false, reason: "missing-token" };
  }

  if (!TURNSTILE_SECRET) {
    return { success: token === "human-checked", skipped: true };
  }

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
      return { success: false, reason: "verification-request-failed" };
    }

    const payload = await response.json();
    return {
      success: Boolean(payload?.success),
      reason: payload?.["error-codes"]?.join(",") || null,
    };
  } catch {
    return { success: false, reason: "verification-network-error" };
  }
}
