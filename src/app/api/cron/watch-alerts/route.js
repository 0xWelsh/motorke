import { db } from "@/lib/db";
import { sendWatchAlertEmail } from "@/lib/mail";

const ALERT_COOLDOWN_HOURS = 18;

function parseState(value) {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
}

export async function GET() {
  try {
    const watches = await db.savedCar.findMany({
      include: {
        user: { select: { id: true, email: true, name: true } },
        car: { select: { id: true, make: true, model: true, year: true, price: true, available: true } },
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
      const previousAvailability = Boolean(previous.available);
      const lastSentAt = previous.lastSentAt ? new Date(previous.lastSentAt) : null;
      const canSend =
        !lastSentAt || now.getTime() - lastSentAt.getTime() > ALERT_COOLDOWN_HOURS * 60 * 60 * 1000;

      let type = null;
      if (Number.isFinite(previousPrice) && watch.car.price < previousPrice) {
        type = "PRICE_DROP";
      } else if (previous.available === false && watch.car.available === true) {
        type = "BACK_IN_STOCK";
      }

      if (type && canSend) {
        const title =
          type === "PRICE_DROP"
            ? `Price drop: ${watch.car.year} ${watch.car.make} ${watch.car.model}`
            : `Back in stock: ${watch.car.year} ${watch.car.make} ${watch.car.model}`;
        const message =
          type === "PRICE_DROP"
            ? `Now KSh ${watch.car.price.toLocaleString("en-KE")} (was KSh ${previousPrice.toLocaleString("en-KE")}).`
            : `Your watched car is now available again at KSh ${watch.car.price.toLocaleString("en-KE")}.`;

        await db.notification.create({
          data: {
            userId: watch.user.id,
            type,
            title,
            message,
            link: `/cars/${watch.car.id}`,
          },
        });

        await sendWatchAlertEmail({
          userEmail: watch.user.email,
          userName: watch.user.name,
          car: watch.car,
          type,
          previousPrice: Number.isFinite(previousPrice) ? previousPrice : undefined,
        });
        alerts += 1;
      }

      const nextState = {
        price: watch.car.price,
        available: watch.car.available,
        lastSeenAt: now.toISOString(),
        lastSentAt: type && canSend ? now.toISOString() : previous.lastSentAt || null,
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
