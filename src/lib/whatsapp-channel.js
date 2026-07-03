// src/lib/whatsapp-channel.js
// Posts car listings to your WhatsApp Channel via Meta Graph API.
// Requires: WHATSAPP_CHANNEL_ID, WHATSAPP_CHANNEL_ACCESS_TOKEN
// Both are free to create at https://business.facebook.com

const GRAPH_API = "https://graph.facebook.com/v22.0";

function getChannelId() {
  return process.env.WHATSAPP_CHANNEL_ID || "";
}

function getAccessToken() {
  return process.env.WHATSAPP_CHANNEL_ACCESS_TOKEN || "";
}

function isConfigured() {
  return !!(getChannelId() && getAccessToken());
}

function buildCaption(car, origin) {
  const location = car.location || "Kenya";
  const price =
    car.price && car.price > 0
      ? `KES ${Number(car.price).toLocaleString("en-KE")}`
      : "Contact for price";
  const mileage = car.mileage
    ? ` · ${Number(car.mileage).toLocaleString("en-KE")} km`
    : "";
  const fuel = car.fuelType ? ` · ${car.fuelType}` : "";
  const year = car.year || "";

  const title = `${year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`.trim();
  const url = `${origin}/cars/${car.publicSlug || car.id}`;

  return (
    `🚗 ${title}\n` +
    `📍 ${location} | ${price}\n` +
    `${mileage}${fuel}\n\n` +
    `View listing: ${url}`
  );
}

function buildTextMessage(car, origin) {
  const location = car.location || "Kenya";
  const price =
    car.price && car.price > 0
      ? `KES ${Number(car.price).toLocaleString("en-KE")}`
      : "Contact for price";
  const mileage = car.mileage
    ? ` · ${Number(car.mileage).toLocaleString("en-KE")} km`
    : "";
  const fuel = car.fuelType ? ` · ${car.fuelType}` : "";
  const year = car.year || "";

  const title = `${year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`.trim();
  const url = `${origin}/cars/${car.publicSlug || car.id}`;

  return (
    `🚗 *${title}*\n` +
    `📍 *Location:* ${location}\n` +
    `💰 *Price:* ${price}\n` +
    `⚡ ${mileage}${fuel}\n\n` +
    `🔗 ${url}`
  );
}

export async function postCarToWhatsAppChannel(car, origin) {
  if (!isConfigured()) {
    console.log("[WA Channel] Not configured — skipping post");
    return { success: false, mocked: true, reason: "not configured" };
  }

  const primaryImg =
    car.images?.find((i) => i.isPrimary)?.url ||
    car.images?.[0]?.url ||
    null;

  const caption = buildCaption(car, origin);
  const body = primaryImg
    ? {
        type: "image",
        image: { link: primaryImg },
        caption,
      }
    : {
        type: "text",
        text: buildTextMessage(car, origin),
      };

  try {
    const res = await fetch(
      `${GRAPH_API}/${getChannelId()}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("[WA Channel] Post failed:", err);
      return { success: false, error: err };
    }

    const data = await res.json();
    console.log("[WA Channel] Posted successfully:", data?.messages?.[0]?.id || data?.message_id);
    return { success: true, messageId: data?.messages?.[0]?.id || data?.message_id };
  } catch (err) {
    console.error("[WA Channel] Error:", err.message);
    return { success: false, error: err.message };
  }
}

export async function postDigestToWhatsAppChannel(cars, origin) {
  if (!isConfigured()) {
    return { success: false, mocked: true, reason: "not configured" };
  }

  const results = [];
  for (const car of cars.slice(0, 5)) {
    const result = await postCarToWhatsAppChannel(car, origin);
    results.push(result);
    // Rate-limit: 1 second between posts
    if (cars.indexOf(car) < cars.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return { success: true, results };
}
