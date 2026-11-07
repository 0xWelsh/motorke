// src/lib/mail.js
import { db } from "@/lib/db";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { getSiteOrigin } from "@/lib/site-url";
import {
  getSupportEmail,
  getMailFromVerification,
  getMailFromNoReply,
  getMailFromAlerts,
  getMailFromMarketing,
  getMailFromHello,
} from "@/lib/site-contact";
import { carListingPath } from "@/lib/car-listing-url";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS?.replace(/\s+/g, "");
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE === "true"
  : SMTP_PORT === 465;

let resend;
if (RESEND_API_KEY) {
  try {
    const { Resend } = require("resend");
    resend = new Resend(RESEND_API_KEY);
  } catch {
    console.warn("Resend not available, falling back to SMTP");
  }
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  ...(SMTP_PORT === 587 && !SMTP_SECURE ? { requireTLS: true } : {}),
});

function buildEmailFooter() {
  const siteUrl = getSiteOrigin();
  const support = getSupportEmail();
  return `
    <div style="margin-top: 28px; padding-top: 18px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0 0 6px; font-size: 12px; color: #475569;">BIDGARI</p>
      <p style="margin: 0; font-size: 12px; color: #64748b;">
        <a href="${siteUrl}/terms" style="color: #0f172a; text-decoration: underline;">Terms</a>
        &nbsp;•&nbsp;
        <a href="${siteUrl}/privacy" style="color: #0f172a; text-decoration: underline;">Privacy</a>
        &nbsp;•&nbsp;
        <a href="mailto:${support}" style="color: #0f172a; text-decoration: underline;">${support}</a>
      </p>
    </div>
  `;
}

async function sendEmail({ from, to, subject, html, text, replyTo }) {
  // Try Resend first if configured
  if (resend) {
    try {
      const data = await resend.emails.send({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        reply_to: replyTo,
      });
      return { success: true, messageId: data.data?.id, provider: "resend" };
    } catch (err) {
      console.error("Resend send failed, falling back to SMTP:", err.message);
    }
  }

  // Fallback to SMTP
  if (SMTP_USER && SMTP_PASS) {
    try {
      const info = await transporter.sendMail({
        from,
        to: Array.isArray(to) ? to.join(",") : to,
        subject,
        html,
        text,
        replyTo,
      });
      return { success: true, messageId: info.messageId, provider: "smtp" };
    } catch (err) {
      console.error("SMTP send failed:", err);
      return { success: false, error: err.message };
    }
  }

  // Mock mode for development
  console.log("✉️ ======================================");
  console.log(`✉️ MOCK EMAIL TO: ${to}`);
  console.log(`✉️ SUBJECT: ${subject}`);
  console.log(text || html?.slice(0, 200));
  console.log("✉️ ======================================");
  return { success: true, mocked: true };
}

export async function createEmailOTP(email) {
  const otp = String(crypto.randomInt(100000, 999999));
  const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await db.verificationToken.deleteMany({ where: { identifier: email } });

  await db.verificationToken.create({
    data: { identifier: email, token: otp, expires },
  });

  return otp;
}

export async function sendSystemAlertEmail({ subject, summary, details = {} }) {
  const support = getSupportEmail();
  if (!support) return { success: false, skipped: "no_support_email" };

  const escapeHtml = (value) =>
    (value || "")
      .toString()
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, "\"")
      .replace(/'/g, "'");

  const detailRows = Object.entries(details || {})
    .map(
      ([key, value]) =>
        `<tr>
          <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;font-weight:700;">${escapeHtml(key)}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all;">${escapeHtml(
            typeof value === "object" ? JSON.stringify(value) : value
          )}</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #0f172a;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.16em;color:#b91c1c;">System Alert</p>
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;">${escapeHtml(subject)}</h1>
      <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.5;">${escapeHtml(summary)}</p>
      ${
        detailRows
          ? `<table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;margin-bottom:14px;">${detailRows}</table>`
          : ""
      }
      <p style="margin:18px 0 0;font-size:12px;color:#94a3b8;">Automated message from BIDGARI monitoring.</p>
      ${buildEmailFooter()}
    </div>
  `;

  const text = `System Alert: ${subject}\n\n${summary}\n\n${Object.entries(details || {}).map(([k, v]) => `${k}: ${v}`).join("\n")}`;

  return sendEmail({
    from: getMailFromAlerts(),
    to: support,
    subject: `[BIDGARI] ${subject}`,
    html,
    text,
    replyTo: support,
  });
}

export async function sendWelcomeEmail({ email, name, role }) {
  const escapeHtml = (value) =>
    (value || "")
      .toString()
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, "\"")
      .replace(/'/g, "'");

  const rawFirst = (name || "there").toString().split(" ")[0];
  const firstName = escapeHtml(rawFirst);
  const siteUrl = getSiteOrigin();
  const support = getSupportEmail();
  const isDealer = role === "DEALER";

  const plainText = [
    `Hi ${rawFirst},`,
    "",
    "Welcome to BIDGARI — Kenya's marketplace for verified dealer inventory.",
    "",
    isDealer
      ? "Your dealer portal is ready. Add listings, respond to leads, and keep stock up to date."
      : "Browse live listings, compare up to three cars side by side, save favourites, and contact dealers directly.",
    "",
    `Start here: ${siteUrl}/cars`,
    isDealer ? `Admin panel: ${siteUrl}/admin` : `Compare: ${siteUrl}/compare`,
    "",
    `Questions? ${support}`,
    "",
    `BIDGARI · ${siteUrl.replace(/^https?:\/\//, "")}`,
  ].join("\n");

  const ctaBrowse = `${siteUrl}/cars`;
  const ctaCompare = `${siteUrl}/compare`;
  const ctaSaved = `${siteUrl}/saved`;

  const htmlContent = `
  <div style="margin:0;padding:0;background-color:#f1f5f9;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;">Verified cars, transparent specs, dealer contact in one place.</span>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f1f5f9;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="background:#111827;padding:28px 28px 22px;text-align:left;">
                <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;color:#6ee7b7;">BIDGARI</p>
                <p style="margin:10px 0 0;font-size:22px;font-weight:800;letter-spacing:-0.03em;line-height:1.1;color:#ffffff;">Welcome aboard</p>
                <div style="margin-top:14px;height:3px;width:48px;background:#06691C;border-radius:2px;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 28px 8px;">
                <p style="margin:0 0 14px;font-size:17px;font-weight:700;color:#0f172a;">Hi ${firstName},</p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#475569;">
                  Thanks for joining <strong style="color:#0f172a;">BIDGARI</strong>. We connect you with <strong>real dealership inventory</strong> in Kenya — clear listings, side-by-side comparison, and direct contact with the seller.
                </p>
                <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#475569;">
                  ${
                    isDealer
                      ? "Your <strong>dealer portal</strong> is where you publish cars, manage photos, and respond to buyer enquiries. Verified status may apply before you appear in public search — we will guide you if anything is pending."
                      : "Start with <strong>Browse inventory</strong> to filter by budget and location, use <strong>Compare</strong> when you are shortlisting, and <strong>Save</strong> cars you want to revisit."
                  }
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:22px;">
                  <tr>
                    <td style="padding:0 0 10px;">
                      <a href="${ctaBrowse}" style="display:block;text-align:center;background:#06691C;color:#ffffff;text-decoration:none;padding:14px 18px;border-radius:6px;font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">Browse inventory</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0;">
                      <a href="${ctaCompare}" style="display:block;text-align:center;background:#ffffff;color:#111827;text-decoration:none;padding:14px 18px;border-radius:6px;font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;border:2px solid #111827;">${isDealer ? "Browse admin panel" : "Compare cars"}</a>
                    </td>
                  </tr>
                </table>
                ${
                  isDealer
                    ? ""
                    : `<p style="margin:0 0 20px;font-size:13px;line-height:1.55;color:#64748b;">
                  <a href="${ctaSaved}" style="color:#0f172a;font-weight:700;text-decoration:underline;">Saved cars</a> sync when you are signed in — useful when you are narrowing down options.
                </p>`
                }
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px 18px;margin-bottom:8px;">
                  <p style="margin:0 0 6px;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#64748b;">Need help?</p>
                  <p style="margin:0;font-size:14px;line-height:1.55;color:#334155;">
                    Reply to this email or write to <a href="mailto:${support}" style="color:#166534;font-weight:700;">${support}</a> — we read every message.
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                ${buildEmailFooter()}
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-size:11px;color:#94a3b8;text-align:center;max-width:520px;line-height:1.5;">
            You received this because you created a BIDGARI account. If that was not you, contact ${support}.
          </p>
        </td>
      </tr>
    </table>
  </div>
  `;

  return sendEmail({
    from: getMailFromHello(),
    replyTo: support,
    to: email,
    subject: "Welcome to BIDGARI",
    text: plainText,
    html: htmlContent,
  });
}

export async function sendVerificationEmail(email, name, otp) {
  const escapeHtml = (value) =>
    (value || "")
      .toString()
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, "\"")
      .replace(/'/g, "'");
  const firstName = escapeHtml((name || "there").toString().split(" ")[0]);
  const origin = getSiteOrigin();
  const support = getSupportEmail();
  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #1A1A1A;">
      <div style="margin-bottom: 32px; text-align: center;">
        <span style="font-weight: 900; font-size: 22px; letter-spacing: -0.03em; color: #0f172a;">BIDGARI</span>
        <p style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em; color: #64748b; margin-top: 8px;">Verify your email</p>
      </div>
      <h1 style="font-size: 26px; font-weight: 800; margin-bottom: 16px; color: #0f172a;">Hi ${firstName},</h1>
      <p style="font-size: 16px; color: #475569; margin-bottom: 28px; line-height: 1.55;">
        Thanks for joining <strong>BIDGARI</strong> (${origin.replace(/^https?:\/\//, "")}). Enter this code to confirm your email and finish setting up your account.
      </p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 28px; text-align: center; border-radius: 8px; margin-bottom: 28px;">
         <span style="font-size: 40px; font-weight: 900; letter-spacing: 0.2em; color: #ea580c;">${otp}</span>
      </div>
      <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
        This code expires in <strong>30 minutes</strong>. If you did not sign up, you can ignore this message. Need help? Reply is not monitored — contact <a href="mailto:${support}" style="color: #0f172a;">${support}</a>.
      </p>
      ${buildEmailFooter()}
    </div>
  `;

  const text = `BIDGARI Verification Code\n\nHi ${firstName},\n\nYour verification code is: ${otp}\n\nThis code expires in 30 minutes.\n\nIf you did not sign up, ignore this email.\n\n${support}`;

  return sendEmail({
    from: getMailFromVerification(),
    replyTo: getSupportEmail(),
    to: email,
    subject: "Your BIDGARI verification code",
    html: htmlContent,
    text,
  });
}

export async function sendLeadAlertEmail({
  to = [],
  dealerName,
  carTitle,
  buyerName,
  buyerPhone,
  buyerEmail,
  buyerMessage,
  channel,
  leadId,
}) {
  const escapeHtml = (value) =>
    (value || "")
      .toString()
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, "\"")
      .replace(/'/g, "'");

  const safeDealerName = escapeHtml(dealerName || "Dealer Team");
  const safeCarTitle = escapeHtml(carTitle || "Listing");
  const safeBuyerName = escapeHtml(buyerName || "Unknown");
  const safeBuyerPhone = escapeHtml(buyerPhone || "Not provided");
  const safeBuyerEmail = escapeHtml(buyerEmail || "Not provided");
  const safeChannel = escapeHtml(channel || "web");
  const safeBuyerMessage = escapeHtml(buyerMessage || "No message left.");
  const safeLeadId = escapeHtml(leadId || "");

  const recipients = [...new Set((to || []).filter(Boolean))];
  if (recipients.length === 0) return { success: true, skipped: true };

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 28px; color: #111827;">
      <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 800;">New Buyer Enquiry</h1>
      <p style="margin: 0 0 20px; color: #475569; font-size: 14px;">
        A potential buyer has reached out on BIDGARI.
      </p>

      <div style="border: 1px solid #e2e8f0; border-radius: 0px; padding: 18px; margin-bottom: 14px;">
        <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: .08em; font-weight: 700;">Dealer</p>
        <p style="margin: 0; font-weight: 700;">${safeDealerName}</p>
      </div>

      <div style="border: 1px solid #e2e8f0; border-radius: 0px; padding: 18px; margin-bottom: 14px;">
        <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: .08em; font-weight: 700;">Vehicle</p>
        <p style="margin: 0; font-weight: 700;">${safeCarTitle}</p>
      </div>

      <div style="border: 1px solid #e2e8f0; border-radius: 0px; padding: 18px; margin-bottom: 18px;">
        <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: .08em; font-weight: 700;">Buyer</p>
        <p style="margin: 0 0 6px;"><strong>Name:</strong> ${safeBuyerName}</p>
        <p style="margin: 0 0 6px;"><strong>Phone:</strong> ${safeBuyerPhone}</p>
        <p style="margin: 0 0 6px;"><strong>Email:</strong> ${safeBuyerEmail}</p>
        <p style="margin: 0 0 6px;"><strong>Channel:</strong> ${safeChannel}</p>
        <p style="margin: 10px 0 0;"><strong>Message:</strong> ${safeBuyerMessage}</p>
      </div>

      <a href="${getSiteOrigin()}/admin/cars" style="display:inline-block;background:#06691C;color:#fff;text-decoration:none;padding:12px 18px;border-radius:0px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Open Admin Panel</a>

      <p style="margin-top: 20px; color: #94a3b8; font-size: 12px;">Lead Ref: ${safeLeadId}</p>
      ${buildEmailFooter()}
    </div>
  `;

  const text = `New Buyer Enquiry\n\nDealer: ${safeDealerName}\nVehicle: ${safeCarTitle}\nBuyer: ${safeBuyerName}\nPhone: ${safeBuyerPhone}\nEmail: ${safeBuyerEmail}\nChannel: ${safeChannel}\nMessage: ${safeBuyerMessage}\n\nLead Ref: ${safeLeadId}\n\n${getSiteOrigin()}/admin/cars`;

  return sendEmail({
    from: getMailFromAlerts(),
    to: recipients,
    subject: `New Buyer Enquiry - ${carTitle || "Vehicle"}`,
    html: htmlContent,
    text,
  });
}

export async function createPasswordResetToken(email) {
  const token = crypto.randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 30 * 60 * 1000);
  const identifier = `reset:${email.toLowerCase()}`;

  await db.verificationToken.deleteMany({ where: { identifier } });
  await db.verificationToken.create({
    data: {
      identifier,
      token,
      expires,
    },
  });

  return token;
}

export async function sendPasswordResetEmail({ email, name, resetToken }) {
  const siteUrl = getSiteOrigin();
  const resetUrl = `${siteUrl}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(email)}`;
  const escapeHtml = (value) =>
    (value || "")
      .toString()
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, "\"")
      .replace(/'/g, "'");

  const safeName = escapeHtml((name || "there").toString().split(" ")[0]);
  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 30px; color: #0f172a;">
      <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 800;">Reset your password</h1>
      <p style="margin: 0 0 22px; font-size: 15px; color: #475569;">Hi ${safeName}, we received a request to reset your BIDGARI account password.</p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0px; padding: 18px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6;">For your security, this link expires in 30 minutes. If you did not request this reset, you can ignore this email.</p>
      </div>

      <a href="${resetUrl}" style="display:inline-block; background:#06691C; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:0px; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em;">Reset Password</a>

      <p style="margin-top: 20px; font-size: 12px; color: #64748b; word-break: break-all;">${resetUrl}</p>
      ${buildEmailFooter()}
    </div>
  `;

  const text = `Reset your BIDGARI password\n\nHi ${safeName},\n\nReset your password: ${resetUrl}\n\nThis link expires in 30 minutes.\n\nIf you did not request this, ignore this email.`;

  return sendEmail({
    from: getMailFromNoReply(),
    to: email,
    subject: "Reset your BIDGARI password",
    html: htmlContent,
    text,
  });
}

export async function sendBetterDealEmail({ userEmail, userName, previousCar, newCar, savings }) {
  const siteUrl = getSiteOrigin();
  const newCarUrl = `${siteUrl.replace(/\/$/, "")}${carListingPath(newCar)}`;
  const savingsPercent = ((savings / previousCar.price) * 100).toFixed(1);

  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937;">
      <div style="background: #1e1e1e; padding: 32px; border-radius: 0px; color: white; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 900;">Better Deal Found! 🎯</h1>
        <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">We found something even better for you</p>
      </div>

      <div style="padding: 32px;">
        <p style="margin: 0 0 24px; font-size: 16px;">Hi ${userName},</p>
        
        <p style="margin: 0 0 24px; font-size: 14px; color: #4b5563; line-height: 1.6;">
          You recently viewed the <strong>${previousCar.year} ${previousCar.make} ${previousCar.model}</strong>. 
          We found an even better option that just arrived in our inventory!
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0px; padding: 20px; margin: 24px 0;">
          <div style="display: flex; align-items: center; gap: 16px;">
            ${newCar.primaryImage ? `<img src="${newCar.primaryImage}" alt="${newCar.year} ${newCar.make}" style="width: 100px; height: 75px; object-fit: cover; border-radius: 0px;" />` : ''}
            <div style="flex: 1;">
              <h3 style="margin: 0 0 4px; font-size: 18px; font-weight: 900; color: #1e1e1e;">
                ${newCar.year} ${newCar.make} ${newCar.model}
              </h3>
              <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">
                ${newCar.mileage ? `${parseInt(newCar.mileage).toLocaleString()} km, ` : ''}${newCar.location}
              </p>
              <p style="margin: 0; font-size: 20px; font-weight: 900; color: #06691C;">
                KES ${parseInt(newCar.price).toLocaleString("en-KE")}
              </p>
            </div>
          </div>
        </div>

        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; border-radius: 0px; margin: 24px 0;">
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #047857;">
            💰 Save KES ${parseInt(savings).toLocaleString("en-KE")} (${savingsPercent}%)
          </p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #059669;">
            compared to the ${previousCar.year} ${previousCar.make}
          </p>
        </div>

        <a href="${newCarUrl}" style="display: inline-block; width: 100%; text-align: center; background: #06691C; color: white; padding: 14px 24px; border-radius: 0px; font-size: 14px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; margin: 24px 0; transition: background 0.2s;">
          View This Car
        </a>

        <p style="margin: 24px 0; font-size: 13px; color: #64748b; line-height: 1.6;">
          This deal won't last long. Better deals go fast on BIDGARI!
        </p>
      </div>

      ${buildEmailFooter()}
    </div>
  `;

  const text = `Better Deal Found!\n\nHi ${userName},\n\nYou viewed the ${previousCar.year} ${previousCar.make} ${previousCar.model}.\nWe found a better deal:\n\n${newCar.year} ${newCar.make} ${newCar.model}\n${newCar.mileage ? `${parseInt(newCar.mileage).toLocaleString()} km, ` : ''}${newCar.location}\nKES ${parseInt(newCar.price).toLocaleString("en-KE")}\n\nSave KES ${parseInt(savings).toLocaleString("en-KE")} (${savingsPercent}%)\n\nView: ${newCarUrl}\n\n${siteUrl}/cars`;

  return sendEmail({
    from: getMailFromMarketing(),
    to: userEmail,
    subject: `Better deal: ${newCar.year} ${newCar.make} - Save KES ${parseInt(savings).toLocaleString("en-KE")}`,
    html: htmlContent,
    text,
  });
}

export async function sendEngagementFollowUpEmail({ userEmail, userName, carTitle, dealerName }) {
  const escapeHtml = (value) =>
    (value || "")
      .toString()
      .replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");

  const safeName = escapeHtml((userName || "there").split(" ")[0]);
  const safeCar = escapeHtml(carTitle);
  const safeDealer = escapeHtml(dealerName);

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e1e1e;">
      <div style="background: #1e1e1e; padding: 40px; border-radius: 0px; text-align: center;">
        <span style="font-weight: 900; font-size: 24px; text-transform: uppercase; letter-spacing: -0.05em; color: white;">BID<span style="color: #00C010;">GARI</span></span>
      </div>
      <div style="padding: 40px; border: 1px solid #e2e8f0; border-top: none;">
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 900;">Still interested in the ${safeCar}?</h1>
        <p style="margin: 0 0 24px; font-size: 16px; color: #4b5563; line-height: 1.6;">Hi ${safeName},</p>
        <p style="margin: 0 0 24px; font-size: 16px; color: #4b5563; line-height: 1.6;">
          You reached out to <strong>${safeDealer}</strong> a few days ago regarding the <strong>${safeCar}</strong>. 
          Vehicles move incredibly fast on BIDGARI, so we wanted to check in to see if you are still looking to buy or if you've already found your dream car.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${getSiteOrigin()}/cars" style="display: inline-block; background: #06691C; color: white; padding: 16px 32px; border-radius: 0px; font-size: 13px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.1em; transition: background 0.2s;">
            Browse More Vehicles
          </a>
        </div>
        
        <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">
          If the dealer hasn't responded yet, you can browse other verified inventory matching this profile instantly.
        </p>

        ${buildEmailFooter()}
      </div>
    </div>
  `;

  const text = `Still interested in the ${safeCar}?\n\nHi ${safeName},\n\nYou reached out to ${safeDealer} regarding the ${safeCar}.\n\nBrowse more vehicles: ${getSiteOrigin()}/cars\n\nIf the dealer hasn't responded, you can browse other verified inventory.`;

  return sendEmail({
    from: getMailFromMarketing(),
    to: userEmail,
    subject: `Still looking for the ${safeCar}?`,
    html: htmlContent,
    text,
  });
}

export async function sendServiceFeedbackEmail({ userEmail, userName, dealerName }) {
  const escapeHtml = (value) =>
    (value || "").toString().replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");

  const safeName = escapeHtml((userName || "there").split(" ")[0]);
  const safeDealer = escapeHtml(dealerName);

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e1e1e;">
      <div style="background: #1e1e1e; padding: 40px; border-radius: 0px; text-align: center;">
        <span style="font-weight: 900; font-size: 24px; text-transform: uppercase; letter-spacing: -0.05em; color: white;">BID<span style="color: #00C010;">GARI</span></span>
      </div>
      <div style="padding: 40px; border: 1px solid #e2e8f0; border-top: none;">
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 900;">How was the service?</h1>
        <p style="margin: 0 0 24px; font-size: 16px; color: #4b5563; line-height: 1.6;">Hi ${safeName},</p>
        <p style="margin: 0 0 24px; font-size: 16px; color: #4b5563; line-height: 1.6;">
          You recently contacted <strong>${safeDealer}</strong> through BIDGARI. We carefully vet all our partners to ensure the highest quality experience, and your feedback is vital.
        </p>
        
        <p style="margin: 0 0 24px; font-size: 16px; color: #4b5563; line-height: 1.6;">
          Were they responsive? Was the vehicle exactly as described? Let us know below:
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${getSiteOrigin()}/contact" style="display: inline-block; background: #1e1e1e; color: white; padding: 16px 32px; border-radius: 0px; font-size: 13px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.1em; transition: background 0.2s;">
            Leave Feedback
          </a>
        </div>

        ${buildEmailFooter()}
      </div>
    </div>
  `;

  const text = `How was the service?\n\nHi ${safeName},\n\nYou recently contacted ${safeDealer} through BIDGARI.\n\nLeave feedback: ${getSiteOrigin()}/contact`;

  return sendEmail({
    from: getMailFromMarketing(),
    to: userEmail,
    subject: `How was your experience with ${safeDealer}?`,
    html: htmlContent,
    text,
  });
}

export async function sendWatchAlertEmail({
  userEmail,
  userName,
  car,
  type,
  previousPrice,
  similarCar,
}) {
  if (!userEmail || !car?.id) return { success: true, skipped: true };
  const siteUrl = getSiteOrigin();
  const origin = siteUrl.replace(/\/$/, "");
  const carUrl = `${origin}${carListingPath(car)}`;
  const similarListingUrl =
    similarCar?.id != null ? `${origin}${carListingPath(similarCar)}` : carUrl;
  const title = `${car.year} ${car.make} ${car.model}`;
  const similarTitle = similarCar ? `${similarCar.year} ${similarCar.make} ${similarCar.model}` : null;
  const firstName = (userName || "there").split(" ")[0];
  const isPriceDrop = type === "PRICE_DROP";
  const isSimilarListing = type === "SIMILAR_LISTING";
  const dropAmount = isPriceDrop && previousPrice ? Math.max(0, previousPrice - car.price) : 0;

  const heading = isPriceDrop
    ? "Price drop on your watchlist car"
    : isSimilarListing
      ? "A similar listing was just posted"
      : "Back in stock";
  const summary = isPriceDrop
    ? `The ${title} dropped by KES ${dropAmount.toLocaleString("en-KE")}.`
    : isSimilarListing
      ? `We found a similar listing: ${similarTitle}.`
      : `The ${title} is now available again.`;
  const priceBlock = isPriceDrop
    ? `<p style="margin: 0 0 8px;"><strong>Previous:</strong> KES ${previousPrice.toLocaleString("en-KE")}</p>
       <p style="margin: 0;"><strong>Current:</strong> KES ${car.price.toLocaleString("en-KE")}</p>`
    : isSimilarListing
      ? `<p style="margin: 0 0 8px;"><strong>Watchlist car:</strong> ${title}</p>
         <p style="margin: 0 0 8px;"><strong>New similar:</strong> ${similarTitle}</p>
         <p style="margin: 0;"><strong>New listing price:</strong> KES ${(similarCar?.price ?? 0).toLocaleString("en-KE")}</p>`
      : `<p style="margin: 0;"><strong>Current price:</strong> KES ${car.price.toLocaleString("en-KE")}</p>`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #0f172a;">
      <h1 style="font-size: 24px; margin-bottom: 8px;">${heading}</h1>
      <p style="font-size: 14px; color: #475569; margin-top: 0;">Hi ${firstName}, ${summary}</p>
      <div style="border: 1px solid #e2e8f0; padding: 16px; margin: 18px 0;">
        <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: #64748b; font-weight: 700;">Vehicle</p>
        <p style="margin: 0 0 12px; font-weight: 700;">${title}</p>
        ${priceBlock}
      </div>
      <a href="${isSimilarListing && similarCar?.id ? similarListingUrl : carUrl}" style="display:inline-block;background:#1e1e1e;color:#fff;text-decoration:none;padding:12px 18px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Open Listing</a>
      ${buildEmailFooter()}
    </div>
  `;

  const text = `${heading}\n\nHi ${firstName}, ${summary}\n\n${title}\n${isPriceDrop ? `Previous: KES ${previousPrice.toLocaleString("en-KE")}\nCurrent: KES ${car.price.toLocaleString("en-KE")}` : isSimilarListing ? `Watchlist: ${title}\nNew similar: ${similarTitle}\nPrice: KES ${(similarCar?.price ?? 0).toLocaleString("en-KE")}` : `Current: KES ${car.price.toLocaleString("en-KE")}`}\n\nOpen: ${isSimilarListing && similarCar?.id ? similarListingUrl : carUrl}`;

  return sendEmail({
    from: getMailFromAlerts(),
    to: userEmail,
    subject: isPriceDrop
      ? `Price drop: ${title}`
      : isSimilarListing
        ? `New similar listing: ${similarTitle}`
        : `Back in stock: ${title}`,
    html,
    text,
  });
}

export async function sendContactFormEmail({
  name,
  email,
  subject,
  message,
  meta = {},
}) {
  const escapeHtml = (value) =>
    (value || "")
      .toString()
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, "\"")
      .replace(/'/g, "'");

  const safeName = escapeHtml(name || "Anonymous");
  const safeEmail = escapeHtml(email || "");
  const safeSubject = escapeHtml(subject || "general");
  const safeMessage = escapeHtml(message || "").replace(/\n/g, "<br />");
  const safeIp = escapeHtml(meta.ip || "");
  const safeUa = escapeHtml(meta.userAgent || "");
  const safeReferer = escapeHtml(meta.referer || "");
  const submittedAt = new Date().toLocaleString("en-KE", {
    timeZone: "Africa/Nairobi",
  });

  const subjectLabel = ({
    bug: "Terminal Bug",
    partnership: "Partnership",
    dealer: "Dealer Listing",
    general: "General Support",
    scam: "Scam Report",
  })[subject] || "General Support";

  const supportInbox = getSupportEmail();
  const siteUrl = getSiteOrigin();

  const plainText = [
    `New contact form submission`,
    ``,
    `Subject: ${subjectLabel}`,
    `From:    ${name || "Anonymous"} <${email || "unknown"}>`,
    `When:    ${submittedAt} (Africa/Nairobi)`,
    meta.referer ? `Referer: ${meta.referer}` : null,
    ``,
    `Message:`,
    message || "",
    ``,
    `--`,
    `Reply directly to this email — Reply-To is set to the visitor.`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 28px; color: #111827;">
      <p style="margin: 0 0 6px; font-size: 11px; color: #06691C; text-transform: uppercase; letter-spacing: .12em; font-weight: 800;">BIDGARI · Contact Form</p>
      <h1 style="margin: 0 0 18px; font-size: 22px; font-weight: 800;">${subjectLabel}</h1>

      <div style="border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 12px;">
        <p style="margin: 0 0 6px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: .08em; font-weight: 700;">From</p>
        <p style="margin: 0;"><strong>${safeName}</strong> <<a href="mailto:${safeEmail}" style="color: #0f172a;">${safeEmail}</a>></p>
      </div>

      <div style="border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 12px;">
        <p style="margin: 0 0 6px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: .08em; font-weight: 700;">When</p>
        <p style="margin: 0;">${submittedAt} <span style="color:#94a3b8;">(Africa/Nairobi)</span></p>
      </div>

      <div style="border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 16px; background: #f8fafc;">
        <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: .08em; font-weight: 700;">Message</p>
        <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</p>
      </div>

      ${(safeIp || safeUa || safeReferer)
        ? `<details style="margin-bottom: 16px; border: 1px solid #e2e8f0; padding: 12px;">
              <summary style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .08em; font-weight: 700; cursor: pointer;">Request metadata</summary>
              ${safeIp ? `<p style="margin: 8px 0 0; font-size: 12px; color: #475569;"><strong>IP:</strong> ${safeIp}</p>` : ""}
              ${safeReferer ? `<p style="margin: 4px 0 0; font-size: 12px; color: #475569;"><strong>Referer:</strong> ${safeReferer}</p>` : ""}
              ${safeUa ? `<p style="margin: 4px 0 0; font-size: 12px; color: #475569;"><strong>User-Agent:</strong> ${safeUa}</p>` : ""}
            </details>`
        : ""}

      <p style="margin: 0; font-size: 12px; color: #64748b;">
        Hit reply to respond directly to ${safeName}. Reply-To is set to their address.
      </p>

      <p style="margin: 18px 0 0; font-size: 11px; color: #94a3b8;">
        Form: <a href="${siteUrl}/contact" style="color: #475569;">${siteUrl.replace(/^https?:\/\//, "")}/contact</a>
      </p>
      ${buildEmailFooter()}
    </div>
  `;

  return sendEmail({
    from: getMailFromHello(),
    to: supportInbox,
    replyTo: email
      ? `${name ? `"${name.replace(/"/g, "")}" ` : ""}<${email}>`
      : undefined,
    subject: `[Contact] ${subjectLabel} — ${name || "Anonymous"}`,
    text: plainText,
    html,
  });
}