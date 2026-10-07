"use client";
import { useEffect, useState } from "react";

// Per-car client-side overrides applied instantly by admin card actions
// (mark sold / hide) before the server refresh catches up. Keyed by carId.
const flags = new Map(); // carId -> { sold?: boolean, hidden?: boolean }
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => fn());
}

export function setCarFlag(carId, key, value) {
  if (!carId || key === undefined) return;
  const cur = flags.get(carId) || {};
  if (cur[key] === value) return;
  cur[key] = value;
  flags.set(carId, cur);
  emit();
}

function readFlag(carId, key) {
  const cur = flags.get(carId);
  return cur ? cur[key] : undefined;
}

export function useCarFlag(carId, key) {
  const [value, setValue] = useState(() => readFlag(carId, key));
  useEffect(() => {
    const fn = () => setValue(readFlag(carId, key));
    fn();
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, [carId, key]);
  return value;
}