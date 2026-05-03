/**
 * Canonical support + transactional From addresses for Welsh Motorhub.
 *
 * - Set NEXT_PUBLIC_MAIL_SUPPORT for every visible mailto / legal copy (client + server).
 * - Set MAIL_SUPPORT only if server should differ (optional).
 * - All MAIL_FROM_* values must be addresses Zoho accepts for SMTP_USER (mailbox or alias).
 */

const DEFAULT_SUPPORT = "hello@welshmotorhub.co.ke";
const DEFAULT_FROM_NOREPLY = '"Welsh Motorhub" <noreply@welshmotorhub.co.ke>';

/** Shown in footer, contact, FAQ, etc. — inlined on client where NEXT_PUBLIC_* is set. */
export const PUBLIC_SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_MAIL_SUPPORT || DEFAULT_SUPPORT;

/** Support inbox (server email HTML + optional override). */
export function getSupportEmail() {
  return (
    process.env.MAIL_SUPPORT ||
    process.env.NEXT_PUBLIC_MAIL_SUPPORT ||
    DEFAULT_SUPPORT
  );
}

/** Signup / email OTP. */
export function getMailFromVerification() {
  return process.env.MAIL_FROM_VERIFICATION || DEFAULT_FROM_NOREPLY;
}

/** Default automated From (reset, watch alerts, lead alerts, etc.). */
export function getMailFromNoReply() {
  return process.env.MAIL_FROM_NOREPLY || getMailFromVerification();
}

/** New lead emails to dealers — override with hello@ if you want a friendlier Reply path. */
export function getMailFromAlerts() {
  return process.env.MAIL_FROM_ALERTS || getMailFromNoReply();
}

/** Buyer nurture (better deal, follow-ups, feedback asks). */
export function getMailFromMarketing() {
  return process.env.MAIL_FROM_MARKETING || getMailFromNoReply();
}
