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

  // Email (SMTP required, Resend optional)
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",

  // M-Pesa
  "MPESA_CONSUMER_KEY",
  "MPESA_CONSUMER_SECRET",
  "MPESA_PASSKEY",
  "MPESA_SHORTCODE",

  // CAPTCHA
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",

  // Cron Security
  "CRON_SECRET",
];

const OPTIONAL_ENV = [
  // Email (Resend - optional, SMTP is primary)
  "RESEND_API_KEY",
  "MAIL_FROM_VERIFICATION",
  "MAIL_FROM_NOREPLY",
  "MAIL_FROM_ALERTS",
  "MAIL_FROM_MARKETING",
  "MAIL_FROM_HELLO",
  "MAIL_SUPPORT",

  // R2 (Image Storage - optional, falls back to local)
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_PUBLIC_URL",
  "R2_BUCKET_NAME",

  // Google OAuth (optional)
  "GOOGLE_CLIENT_ID",
  "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",

  // M-Pesa Environment
  "MPESA_ENV",
  "MPESA_CALLBACK_URL",

  // Monitoring (optional)
  "SENTRY_DSN",

  // WAHA (WhatsApp)
  "WAHA_API_URL",
  "WAHA_API_KEY",
  "WAHA_DASHBOARD_USERNAME",
  "WAHA_DASHBOARD_PASSWORD",
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

  // Email validation: either Resend OR SMTP must be configured
  if (!process.env.RESEND_API_KEY && (!process.env.SMTP_USER || !process.env.SMTP_PASS)) {
    warnings.push("Neither RESEND_API_KEY nor SMTP credentials configured - emails will be mocked");
  }

  // R2 warning
  if (!process.env.R2_ENDPOINT && !process.env.R2_PUBLIC_URL) {
    warnings.push("R2 not configured - images will use local storage fallback");
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