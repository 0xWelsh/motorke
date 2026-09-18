// src/lib/push.js
// Server-side push notification helpers using web-push.
import webPush from "web-push";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:admin@bidgari.com";

let configured = false;

function configure() {
  if (configured) return;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("[push] VAPID keys not configured — push notifications disabled");
    return;
  }
  webPush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
}

/**
 * Send a push notification to a single subscription.
 * Returns { ok: true } or { ok: false, expired: true } if the subscription is stale.
 */
export async function sendPushNotification(subscription, payload) {
  configure();
  if (!configured) return { ok: false, reason: "vapid-not-configured" };

  try {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 } // 24 hours
    );
    return { ok: true };
  } catch (err) {
    // 404 = subscription expired, 410 = gone
    if (err.statusCode === 404 || err.statusCode === 410) {
      return { ok: false, expired: true };
    }
    console.error("[push] Send failed:", err.statusCode, err.message);
    return { ok: false, reason: err.message };
  }
}

/**
 * Send a push notification to all subscriptions for a user.
 * Cleans up expired subscriptions automatically.
 */
export async function sendPushToUser(db, userId, payload) {
  const subs = await db.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  if (!subs.length) return { sent: 0, cleaned: 0 };

  const results = await Promise.allSettled(
    subs.map(async (sub) => {
      const result = await sendPushNotification(sub, payload);
      if (result.expired) {
        await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
      return result;
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled" && r.value?.ok).length;
  const cleaned = results.filter((r) => r.status === "fulfilled" && r.value?.expired).length;

  return { sent, cleaned };
}

/**
 * Broadcast a push notification to ALL subscribed users.
 * Useful for system-wide announcements.
 */
export async function broadcastPush(db, payload, { maxPerUser = 1 } = {}) {
  const subs = await db.pushSubscription.findMany({
    select: { id: true, userId: true, endpoint: true, p256dh: true, auth: true },
    orderBy: { lastUsedAt: "desc" },
  });

  // Group by user, take only the most recent subscription per user
  const byUser = new Map();
  for (const sub of subs) {
    const key = sub.userId || sub.endpoint;
    if (!byUser.has(key)) byUser.set(key, sub);
  }

  const uniqueSubs = [...byUser.values()];
  let sent = 0;
  let cleaned = 0;

  // Process in batches of 50
  for (let i = 0; i < uniqueSubs.length; i += 50) {
    const batch = uniqueSubs.slice(i, i + 50);
    const results = await Promise.allSettled(
      batch.map(async (sub) => {
        const result = await sendPushNotification(sub, payload);
        if (result.expired) {
          await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
        return result;
      })
    );
    sent += results.filter((r) => r.status === "fulfilled" && r.value?.ok).length;
    cleaned += results.filter((r) => r.status === "fulfilled" && r.value?.expired).length;
  }

  return { total: uniqueSubs.length, sent, cleaned };
}
