// src/hooks/useSpecAutoFill.js
"use client";
import { useEffect, useRef, useState } from "react";

const FILL_TARGETS = [
  "bodyType", "vehicleType", "engineCC", "cylinders", "horsepower", "torque",
  "fuelType", "transmission", "drivetrain", "steering", "seats", "doors",
  "airbags", "turbo", "sunroof",
];

const STRING_SELECTORS = [
  "bodyType", "vehicleType", "fuelType", "transmission",
  "drivetrain", "steering",
];

export default function useSpecAutoFill(formRef, { make, model, variant, year }) {
  const [filling, setFilling] = useState(false);
  const [filledFields, setFilledFields] = useState(new Set());
  const debounceRef = useRef(null);
  const lastKeyRef = useRef("");

  const key = `${make}|${model}|${variant}|${year}`;

  useEffect(() => {
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    if (!make || !model || !year) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setFilling(true);
      try {
        const params = new URLSearchParams({ make: make.trim(), model: model.trim(), year });
        if (variant) params.set("variant", variant.trim());

        const res = await fetch(`/api/cars/spec-lookup?${params}`);
        const data = await res.json();

        if (!data.ok || !data.matched) {
          setFilling(false);
          return;
        }

        const { fillData } = data;
        const filled = new Set();
        const form = formRef.current;
        if (!form) { setFilling(false); return; }

        for (const field of FILL_TARGETS) {
          const value = fillData[field];
          if (value === null || value === undefined || value === "") continue;

          const target = form.querySelector(`[name="${field}"]`);
          if (!target) continue;

          const currentVal = target.value?.trim();
          if (currentVal && currentVal !== "" && currentVal !== "0" && currentVal !== "NA") continue;

          if (STRING_SELECTORS.includes(field)) {
            const option = target.querySelector(`option[value="${value}"]`);
            if (option) {
              target.value = value;
              filled.add(field);
            }
          } else if (field === "turbo" || field === "sunroof") {
            if (typeof value === "boolean") {
              target.checked = value;
              filled.add(field);
            }
          } else {
            target.value = String(value);
            filled.add(field);
          }
        }

        setFilledFields(filled);
      } catch (err) {
        console.error("Spec auto-fill error:", err);
      } finally {
        setFilling(false);
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [key, make, model, variant, year, formRef]);

  return { filling, filledFields };
}
