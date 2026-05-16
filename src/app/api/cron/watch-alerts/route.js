import { db } from "@/lib/db";
import { sendWatchAlertEmail } from "@/lib/mail";
import { getMailFromAlerts } from "@/lib/site-contact";
import { getSessionFromRequest } from "@/lib/auth";
import { carListingPath } from "@/lib/car-listing-url";

const ALERT_COOLDOWN_HOURS = 18;
const SIMILAR_ALERT_COOLDOWN_HOURS = 24;

function parseState(value) {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
}

function canSend(lastSentAt, cooldownHours, now) {
  if (!lastSentAt) return true;
  const parsed = new Date(lastSentAt);
  if (Number.isNaN(parsed.getTime())) return true;
  return now.getTime() - parsed.getTime() > cooldownHours * 60 * 60 * 1000;
}

export async function GET(request) {
  const cronHeader = request.headers.get("x-vercel-cron");
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const isAuthorizedCron = Boolean(
    cronHeader ||
      (cronSecret && bearerToken && bearerToken === cronSecret)
  );
  if (!isAuthorizedCron) {
    return Response.json({ success: false, error: "Unauthorized cron trigger" }, { status: 401 });
  }

  return runWatchAlerts();
}

export async function POST(request) {
  const session = await getSessionFromRequest();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body = {};
  try {
    const raw = await request.text();
    if (raw) body = JSON.parse(raw);
  } catch {
    // non-JSON body: run full job
  }

  if (body.test === true) {
    return sendTestWatchAlertEmail(session.user);
  }

  return runWatchAlerts();
}

/** One-off test using the same template and From: as real alerts; always sends to the admin's email. */
async function sendTestWatchAlertEmail(admin) {
  const car = await db.car.findFirst({
    orderBy: { id: "asc" },
    select: { id: true, make: true, model: true, year: true, price: true, available: true, publicSlug: true },
  });
  if (!car) {
    return Response.json(
      { success: false, error: "Add at least one car listing before sending a test alert." },
      { status: 400 }
    );
  }

  const previousPrice = Number(car.price) + 500_000;
  const result = await sendWatchAlertEmail({
    userEmail: admin.email,
    userName: admin.name,
    car,
    type: "PRICE_DROP",
    previousPrice,
  });

  if (result?.mocked) {
    return Response.json({
      success: true,
      test: true,
      mocked: true,
      to: admin.email,
      message:
        `SMTP is not configured in this environment. Watch alert would be sent from ${getMailFromAlerts()} when SMTP_USER/SMTP_PASS are set.`,
    });
  }
  if (result?.success === false) {
    return Response.json(
      { success: false, error: result.error?.message || "Failed to send test email" },
      { status: 500 }
    );
  }
  return Response.json({
    success: true,
    test: true,
    mocked: false,
    to: admin.email,
    from: getMailFromAlerts(),
    alertsSent: 1,
  });
}

async function runWatchAlerts() {
  try {
    const watches = await db.savedCar.findMany({
      include: {
        user: { select: { id: true, email: true, name: true } },
        car: {
          select: {
            id: true,
            dealerId: true,
            make: true,
            model: true,
            year: true,
            price: true,
            available: true,
            publicSlug: true,
          },
        },
      },
    });

    let alerts = 0;
    const now = new Date();

    for (const watch of watches) {
      if (!watch?.user?.id || !watch?.car?.id) continue;

      const key = `watch-alert:${watch.user.id}:${watch.car.id}`;
      const setting = await db.setting.findUnique({ where: { key } });
      const previous = parseState(setting?.value);
      const previousPrice = Number(previous.price);
      const canSendPriceDrop = canSend(previous.lastPriceDropSentAt, ALERT_COOLDOWN_HOURS, now);
      const canSendBackInStock = canSend(previous.lastBackInStockSentAt, ALERT_COOLDOWN_HOURS, now);
      const canSendSimilar = canSend(previous.lastSimilarSentAt, SIMILAR_ALERT_COOLDOWN_HOURS, now);

      let type = null;
      let similarCar = null;
      if (Number.isFinite(previousPrice) && watch.car.price < previousPrice) {
        type = "PRICE_DROP";
      } else if (previous.available === false && watch.car.available === true) {
        type = "BACK_IN_STOCK";
      } else {
        similarCar = await db.car.findFirst({
          where: {
            available: true,
            id: { not: watch.car.id },
            make: { equals: watch.car.make, mode: "insensitive" },
            model: { equals: watch.car.model, mode: "insensitive" },
            dealerId: { not: watch.car.dealerId },
            createdAt: { gt: watch.createdAt },
          },
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            price: true,
            available: true,
            publicSlug: true,
          },
          orderBy: { createdAt: "desc" },
        });

        if (
          similarCar &&
          similarCar.id !== previous.lastSimilarCarId
        ) {
          type = "SIMILAR_LISTING";
        }
      }

      const canSendForType =
        type === "PRICE_DROP"
          ? canSendPriceDrop
          : type === "BACK_IN_STOCK"
            ? canSendBackInStock
            : type === "SIMILAR_LISTING"
              ? canSendSimilar
              : false;

      if (type && canSendForType) {
        const similarTitle = similarCar
          ? `${similarCar.year} ${similarCar.make} ${similarCar.model}`
          : `${watch.car.year} ${watch.car.make} ${watch.car.model}`;
        const title =
          type === "PRICE_DROP"
            ? `Price drop: ${watch.car.year} ${watch.car.make} ${watch.car.model}`
            : type === "BACK_IN_STOCK"
              ? `Back in stock: ${watch.car.year} ${watch.car.make} ${watch.car.model}`
              : `New similar listing: ${similarTitle}`;
        const message =
          type === "PRICE_DROP"
            ? `Now KSh ${watch.car.price.toLocaleString("en-KE")} (was KSh ${previousPrice.toLocaleString("en-KE")}).`
            : type === "BACK_IN_STOCK"
              ? `Your watched car is now available again at KSh ${watch.car.price.toLocaleString("en-KE")}.`
              : `A similar car was just posted at KSh ${(similarCar?.price ?? 0).toLocaleString("en-KE")}.`;

        const listingForLink =
          type === "SIMILAR_LISTING" ? similarCar : watch.car;
        await db.notification.create({
          data: {
            userId: watch.user.id,
            type,
            title,
            message,
            link: carListingPath(listingForLink),
          },
        });

        await sendWatchAlertEmail({
          userEmail: watch.user.email,
          userName: watch.user.name,
          car: watch.car,
          type,
          previousPrice: Number.isFinite(previousPrice) ? previousPrice : undefined,
          similarCar: type === "SIMILAR_LISTING" ? similarCar : undefined,
        });
        alerts += 1;
      }

      const nextState = {
        price: watch.car.price,
        available: watch.car.available,
        lastSeenAt: now.toISOString(),
        lastPriceDropSentAt:
          type === "PRICE_DROP" && canSendForType
            ? now.toISOString()
            : previous.lastPriceDropSentAt || null,
        lastBackInStockSentAt:
          type === "BACK_IN_STOCK" && canSendForType
            ? now.toISOString()
            : previous.lastBackInStockSentAt || null,
        lastSimilarSentAt:
          type === "SIMILAR_LISTING" && canSendForType
            ? now.toISOString()
            : previous.lastSimilarSentAt || null,
        lastSimilarCarId:
          type === "SIMILAR_LISTING" && canSendForType
            ? similarCar?.id || previous.lastSimilarCarId || null
            : previous.lastSimilarCarId || null,
      };

      await db.setting.upsert({
        where: { key },
        create: { key, value: JSON.stringify(nextState), description: "Watch alert state per user/car" },
        update: { value: JSON.stringify(nextState) },
      });
    }

    return Response.json({ success: true, processed: watches.length, alertsSent: alerts });
  } catch (error) {
    console.error("[cron/watch-alerts] failed:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
