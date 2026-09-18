// src/lib/super-admin.js
// The single super-admin account. Kept in its own tiny module so both server
// (auth guards / API routes) and client (admin layout) can import it without
// pulling in server-only dependencies.
//
// SUPER_ADMIN_EMAIL may be overridden via env; when unset or empty it falls
// back to the owner account. This fallback matters because production deploys
// ship with an empty SUPER_ADMIN_EMAIL – without it `requireSuperAdmin` would
// treat every admin as a super admin.
export const SUPER_ADMIN_EMAIL =
  process.env.SUPER_ADMIN_EMAIL || "11241welshmuhuri@gmail.com";

export function isSuperAdminEmail(email) {
  return Boolean(email) && email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}
