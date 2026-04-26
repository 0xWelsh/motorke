/**
 * Send one watch-style alert email (same From / template as production).
 * Usage:
 *   node --env-file=.env scripts/send-watch-test-email.mjs
 *   node --env-file=.env scripts/send-watch-test-email.mjs you@example.com
 */
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const db = new PrismaClient();
const to = process.argv[2] || "sec@welsh.co.ke";

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS?.replace(/\s+/g, "");
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://welsh-motors.co.ke";

function buildEmailFooter() {
  return `
    <div style="margin-top: 28px; padding-top: 18px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0 0 6px; font-size: 12px; color: #475569;">Welsh Motors Marketplace</p>
      <p style="margin: 0; font-size: 12px; color: #64748b;">
        <a href="${siteUrl}/terms" style="color: #0f172a; text-decoration: underline;">Terms</a>
        &nbsp;•&nbsp;
        <a href="${siteUrl}/privacy" style="color: #0f172a; text-decoration: underline;">Privacy</a>
        &nbsp;•&nbsp;
        <a href="mailto:sec@welsh.co.ke" style="color: #0f172a; text-decoration: underline;">sec@welsh.co.ke</a>
      </p>
    </div>
  `;
}

async function main() {
  const car = await db.car.findFirst({
    orderBy: { id: "asc" },
    select: { id: true, make: true, model: true, year: true, price: true },
  });
  if (!car) {
    console.error("No car in database; cannot build test email.");
    process.exit(1);
  }

  const title = `${car.year} ${car.make} ${car.model}`;
  const currentPrice = Number(car.price);
  const previousPrice = currentPrice + 500_000;
  const dropAmount = Math.max(0, previousPrice - currentPrice);
  const carUrl = `${siteUrl}/cars/${car.id}`;
  const firstName = "there";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #0f172a;">
      <h1 style="font-size: 24px; margin-bottom: 8px;">Price drop on your watchlist car</h1>
      <p style="font-size: 14px; color: #475569; margin-top: 0;">Hi ${firstName}, The ${title} dropped by KSh ${dropAmount.toLocaleString("en-KE")}.</p>
      <div style="border: 1px solid #e2e8f0; padding: 16px; margin: 18px 0;">
        <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: #64748b; font-weight: 700;">Vehicle</p>
        <p style="margin: 0 0 12px; font-weight: 700;">${title}</p>
        <p style="margin: 0 0 8px;"><strong>Previous:</strong> KSh ${previousPrice.toLocaleString("en-KE")}</p>
        <p style="margin: 0;"><strong>Current:</strong> KSh ${currentPrice.toLocaleString("en-KE")}</p>
      </div>
      <a href="${carUrl}" style="display:inline-block;background:#111111;color:#fff;text-decoration:none;padding:12px 18px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Open Listing</a>
      ${buildEmailFooter()}
    </div>
  `;

  if (!SMTP_USER || !SMTP_PASS) {
    console.log("SMTP_USER / SMTP_PASS not set — real email not sent (same behavior as the app in dev).");
    console.log("Would send watch-style alert to:", to, "| From: sec@welsh.co.ke | Subject: Price drop:", title);
    process.exit(0);
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: '"Welsh Motors Alerts" <sec@welsh.co.ke>',
    to,
    subject: `Price drop: ${title}`,
    html,
  });
  console.log("Sent test watch alert to", to, '(From: "Welsh Motors Alerts" <sec@welsh.co.ke>)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
