"use client";
import { useEffect, useState } from "react";

// Shared admin-mode flag so components render admin affordances on public
// pages without each one firing /api/auth/me. SiteChrome flips it after the
// session resolves.
let adminMode = false;
const listeners = new Set();

export function setAdminMode(value) {
  if (adminMode === Boolean(value)) return;
  adminMode = Boolean(value);
  listeners.forEach((fn) => fn(adminMode));
}

export function useAdminMode() {
  const [value, setValue] = useState(adminMode);
  useEffect(() => {
    setValue(adminMode);
    listeners.add(setValue);
    return () => listeners.delete(setValue);
  }, []);
  return value;
}