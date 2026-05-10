/**
 * Shared UX copy and light normalization for phone/WhatsApp (Kenya-first marketplace).
 */

export const PHONE_COUNTRY_CODE_HELPER =
  "Include country code (Kenya: +254 or 254 before the national number).";

export const WHATSAPP_STORE_HELPER =
  "Digits only, country code included, no + or spaces (example: 254712345678).";

export const PHONE_PLACEHOLDER_INTERNATIONAL = "+254 712 345 678";

/** Strip to digits for wa.me and similar */
export function digitsOnlyPhone(raw) {
  return String(raw ?? "").replace(/\D/g, "");
}

/**
 * Build tel: href preferring +254 when the value looks Kenyan.
 */
export function telHrefFromMsisdn(raw) {
  const d = digitsOnlyPhone(raw);
  if (!d) return "";
  if (d.startsWith("254")) return `tel:+${d}`;
  if (d.startsWith("0") && d.length >= 9 && d.length <= 10) return `tel:+254${d.slice(1)}`;
  if (d.length === 9 && /^[17]/.test(d)) return `tel:+254${d}`;
  const trimmed = String(raw ?? "").trim();
  return trimmed.startsWith("+") ? `tel:${trimmed}` : `tel:+${d}`;
}
