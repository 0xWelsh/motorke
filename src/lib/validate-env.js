/**
 * Validates required environment variables at startup.
 * Prevents silent failures in production (e.g., emails never sent, M-Pesa never processes).
 */

/** SMTP_HOST must be a bare hostname — not tutorial text like "(e.g., smtp.gmail.com)". */
export function validateSmtpHostLooksReal(host) {
  if (!host || typeof host !== "string") return "SMTP_HOST is missing";
  const h = host.trim();
  if (/[\s()[\]\"]/.test(h)) {
    return "SMTP_HOST must be only the server name (no spaces/parentheses), e.g. smtp.zoho.com";
  }
  if (/\be\.g\.\b/i.test(h)) return "SMTP_HOST looks like pasted example text; set a real SMTP hostname";
  if (!/^[a-zA-Z0-9]([a-zA-Z0-9.-]{0,253}[a-zA-Z0-9])?$/.test(h)) {
    return "SMTP_HOST is not a valid hostname";
  }
  return null;
}

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

  // Supabase (Storage)
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",

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

  if (missing.length === 0) {
    const smtpIssue = validateSmtpHostLooksReal(process.env.SMTP_HOST);
    if (smtpIssue) {
      const msg = `${smtpIssue}\nCurrent value: ${JSON.stringify(process.env.SMTP_HOST)}`;
      if (strict) {
        throw new Error(`❌ ${msg}`);
      }
      warnings.push(msg);
    }
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
