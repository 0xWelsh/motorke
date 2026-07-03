const DAEMON_BASE = process.env.WHATSAPP_DAEMON_URL || "http://localhost:3006";

async function fetchDaemon(method, path, body) {
  try {
    const res = await fetch(`${DAEMON_BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`[WA-Daemon] ${method} ${path} failed:`, err);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`[WA-Daemon] ${method} ${path} error:`, err.message);
    return null;
  }
}

export async function sendText(chatId, text) {
  return fetchDaemon("POST", "/api/send-text", { chatId, text });
}

export async function sendImage(chatId, imageUrl, caption) {
  return fetchDaemon("POST", "/api/send-image", { chatId, imageUrl, caption });
}

export async function checkSessionStatus() {
  const res = await fetch(`${DAEMON_BASE}/api/status`);
  if (res.ok) return await res.json();
  return null;
}

export function getChatId(phone) {
  const digits = String(phone).replace(/\D/g, "");
  return `${digits}@c.us`;
}

export function parseFrom(from) {
  const match = String(from).match(/^(\d+)@c\.us$/);
  return match ? match[1] : null;
}

export function getBroadcastGroup() {
  return process.env.WAHA_BROADCAST_GROUP || "";
}

export function isConfigured() {
  return true;
}

export function isBroadcastConfigured() {
  return !!process.env.WAHA_BROADCAST_GROUP;
}

export async function broadcastCar(car, origin) {
  const groupId = getBroadcastGroup();
  if (!groupId) return { success: false, reason: "no broadcast group" };

  const title = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
  const price =
    car.price && car.price > 0
      ? `KES ${Number(car.price).toLocaleString("en-KE")}`
      : "Contact for price";
  const url = `${origin}/cars/${car.publicSlug || car.id}`;
  const caption =
    `🚗 *New Listing!*\n*${title}*\n💰 ${price}\n🔗 ${url}`;

  const primaryImg =
    car.images?.find((i) => i.isPrimary)?.url ||
    car.images?.[0]?.url ||
    null;

  if (primaryImg) {
    const { getHeroImageUrl } = await import("@/lib/image-transform");
    const imgUrl = getHeroImageUrl(primaryImg, 75, 800);
    return sendImage(groupId, imgUrl, caption);
  }

  return sendText(groupId, caption);
}

export async function broadcastDigest(cars, origin) {
  const groupId = getBroadcastGroup();
  if (!groupId) return { success: false, reason: "no broadcast group" };

  const results = [];
  for (const car of cars.slice(0, 5)) {
    const result = await broadcastCar(car, origin);
    results.push(result);
    const idx = cars.indexOf(car);
    if (idx < cars.length - 1 && idx < 4) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return { success: true, results };
}
