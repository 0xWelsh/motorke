/**
 * Validates required environment variables at startup.
 * Prevents silent failures in production (e.g., emails never sent, M-Pesa never processes).
 */

const REQUIRED_ENV = [
  // Database
  "DATABASE_URL",
  "DIRECT_URL",

  // Authentication
  "AUTH_SECRET",

  // Email/Notifications
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",

  // M-Pesa
  "MPESA_CONSUMER_KEY",
  "MPESA_CONSUMER_SECRET",
  "MPESA_PASSKEY",
  "MPESA_SHORTCODE",

  // R2 (Image Storage — replaces Supabase)
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_PUBLIC_URL",

  // CAPTCHA
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
];

const OPTIONAL_ENV = [
  // Google OAuth (optional - can be frontend only)
  "GOOGLE_CLIENT_ID",
  "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",

  // M-Pesa Environment
  "MPESA_ENV",
  "MPESA_CALLBACK_URL",

  // Monitoring (optional)
  "SENTRY_DSN",
];

/**
 * Validate environment variables
 * @param {{ strict?: boolean }} options
 * @throws {Error} If required environment variables are missing
 */
export function validateEnv(options = {}) {
  const strict = options.strict ?? process.env.NODE_ENV === "production";
  const missing = [];
  const warnings = [];

  for (const key of REQUIRED_ENV) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  for (const key of OPTIONAL_ENV) {
    if (!process.env[key] && key.includes("GOOGLE")) {
      warnings.push(`${key} not set - Google OAuth will be disabled`);
    }
  }

  if (
    process.env.GOOGLE_CLIENT_ID &&
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_ID !== process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  ) {
    warnings.push("GOOGLE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_CLIENT_ID do not match");
  }

  if (missing.length > 0) {
    const message = `Missing required environment variables:\n  ${missing.join("\n  ")}\n\nCheck your .env file or deployment configuration.`;
    if (strict) {
      throw new Error(`❌ ${message}`);
    }
    warnings.push(message);
  }

  if (warnings.length > 0) {
    console.warn("⚠️  Environment warnings:\n  " + warnings.join("\n  "));
  }

  if (missing.length === 0) {
    console.log("✅ Environment validation passed - all required variables present");
  }
}

/**
 * Get environment with fallback
 */
export function getEnv(key, fallback = undefined) {
  const value = process.env[key];
  if (!value && fallback === undefined) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value || fallback;
}
