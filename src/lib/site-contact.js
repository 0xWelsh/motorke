/**
 * Canonical support + transactional From addresses for Welsh Motorhub.
 *
 * - Set NEXT_PUBLIC_MAIL_SUPPORT for every visible mailto / legal copy (client + server).
 * - Set MAIL_SUPPORT only if server should differ (optional).
 * - All MAIL_FROM_* values must be addresses Zoho accepts for SMTP_USER (mailbox or alias).
 */

import { digitsOnlyPhone } from "@/lib/phone-hints";

const DEFAULT_SUPPORT = "hello@welshmotorhub.co.ke";
const DEFAULT_SUPPORT_WHATSAPP_MESSAGE =
  "Hi Welsh Motorhub team, I need help with the website.";
const DEFAULT_FROM_NOREPLY = '"Welsh Motorhub" <noreply@welshmotorhub.co.ke>';

/** Shown in footer, contact, FAQ, etc. — inlined on client where NEXT_PUBLIC_* is set. */
export const PUBLIC_SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_MAIL_SUPPORT || DEFAULT_SUPPORT;

/** Optional public support line (e.g. +254 7XX XXX XXX). */
export const PUBLIC_SUPPORT_PHONE =
  process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() || "";

/** WhatsApp MSISDN for buyer support (digits only in wa.me). Falls back to phone. */
export const PUBLIC_SUPPORT_WHATSAPP =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.trim() ||
  process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() ||
  "";

export const PUBLIC_SUPPORT_WHATSAPP_MESSAGE =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_MESSAGE?.trim() ||
  DEFAULT_SUPPORT_WHATSAPP_MESSAGE;

/** wa.me link for marketplace support, or null when no number is configured. */
export function getSupportWhatsAppHref(
  message = PUBLIC_SUPPORT_WHATSAPP_MESSAGE
) {
  const digits = digitsOnlyPhone(PUBLIC_SUPPORT_WHATSAPP);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

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

/** Welcome / onboarding — defaults to hello@ for a human, trustworthy first touch. */
export function getMailFromHello() {
  return process.env.MAIL_FROM_HELLO || '"Welsh Motorhub" <hello@welshmotorhub.co.ke>';
}
