import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";

export const SALESMAN_KEYS = ["salesman_whatsapp_1", "salesman_whatsapp_2", "salesman_whatsapp_3"];
export const FALLBACK_NUMBER = "254717303587";

async function fetchSalesmanNumbers() {
  const settings = await db.setting.findMany({
    where: { key: { in: SALESMAN_KEYS } },
    orderBy: { key: "asc" },
  });
  const numbers = settings.map((s) => s.value).filter(Boolean);
  return numbers.length > 0 ? numbers : [FALLBACK_NUMBER];
}

const getCachedSalesmanNumbers = unstable_cache(
  fetchSalesmanNumbers,
  ["salesman-whatsapp-numbers"],
  { revalidate: 300, tags: ["settings"] }
);

export async function getSalesmanWhatsappNumbers() {
  return getCachedSalesmanNumbers();
}

export function pickSalesmanWhatsapp(numbers, seed) {
  if (numbers.length === 0) return FALLBACK_NUMBER;
  const index =
    typeof seed === "string"
      ? seed.charCodeAt(seed.length - 1) % numbers.length
      : (seed ?? 0) % numbers.length;
  return numbers[index];
}
