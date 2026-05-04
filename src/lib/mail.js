// src/lib/mail.js
import { db } from "@/lib/db";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { getSiteOrigin } from "@/lib/site-url";
import {
  getSupportEmail,
  getMailFromVerification,
  getMailFromNoReply,
  getMailFromAlerts,
  getMailFromMarketing,
  getMailFromHello,
} from "@/lib/site-contact";

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS?.replace(/\s+/g, "");
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE === "true"
  : SMTP_PORT === 465;

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
      <p style="margin: 0 0 6px; font-size: 12px; color: #475569;">Welsh Motorhub</p>
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

export async function createEmailOTP(email) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  // Delete existing tokens for this email
  await db.verificationToken.deleteMany({ where: { identifier: email } });

  await db.verificationToken.create({
    data: { identifier: email, token: otp, expires },
  });

  return otp;
}

/**
 * Sent once after email is verified (password signup) or after a brand-new Google account.
 * From hello@ by default — must be an allowed sender for your SMTP mailbox (Zoho).
 */
export async function sendWelcomeEmail({ email, name, role }) {
  const escapeHtml = (value) =>
    (value || "")
      .toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const rawFirst = (name || "there").toString().split(" ")[0];
  const firstName = escapeHtml(rawFirst);
  const siteUrl = getSiteOrigin();
  const support = getSupportEmail();
  const isDealer = role === "DEALER";

  const plainText = [
    `Hi ${rawFirst},`,
    "",
    "Welcome to Welsh Motorhub — Kenya's marketplace for verified dealer inventory.",
    "",
    isDealer
      ? "Your dealer portal is ready. Add listings, respond to leads, and keep stock up to date."
      : "Browse live listings, compare up to three cars side by side, save favourites, and contact dealers directly.",
    "",
    `Start here: ${siteUrl}/cars`,
    isDealer ? `Dealer portal: ${siteUrl}/portal` : `Compare: ${siteUrl}/compare`,
    "",
    `Questions? ${support}`,
    "",
    `Welsh Motorhub · ${siteUrl.replace(/^https?:\/\//, "")}`,
  ].join("\n");

  const ctaBrowse = `${siteUrl}/cars`;
  const ctaCompare = `${siteUrl}/compare`;
  const ctaPortal = `${siteUrl}/portal`;
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
                <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;color:#6ee7b7;">Welsh Motorhub</p>
                <p style="margin:10px 0 0;font-size:22px;font-weight:800;letter-spacing:-0.03em;line-height:1.1;color:#ffffff;">Welcome aboard</p>
                <div style="margin-top:14px;height:3px;width:48px;background:#38A169;border-radius:2px;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 28px 8px;">
                <p style="margin:0 0 14px;font-size:17px;font-weight:700;color:#0f172a;">Hi ${firstName},</p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#475569;">
                  Thanks for joining <strong style="color:#0f172a;">Welsh Motorhub</strong>. We connect you with <strong>real dealership inventory</strong> in Kenya — clear listings, side-by-side comparison, and direct contact with the seller.
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
                      <a href="${ctaBrowse}" style="display:block;text-align:center;background:#38A169;color:#ffffff;text-decoration:none;padding:14px 18px;border-radius:6px;font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">Browse inventory</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0;">
                      <a href="${isDealer ? ctaPortal : ctaCompare}" style="display:block;text-align:center;background:#ffffff;color:#111827;text-decoration:none;padding:14px 18px;border-radius:6px;font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;border:2px solid #111827;">${isDealer ? "Open dealer portal" : "Compare cars"}</a>
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
            You received this because you created a Welsh Motorhub account. If that was not you, contact ${support}.
          </p>
        </td>
      </tr>
    </table>
  </div>
  `;

  if (!SMTP_USER || !SMTP_PASS) {
    console.log("✉️ ======================================");
    console.log(`✉️ MOCK WELCOME EMAIL TO: ${email}`);
    console.log(plainText);
    console.log("✉️ ======================================");
    return { success: true, mocked: true };
  }

  try {
    await transporter.sendMail({
      from: getMailFromHello(),
      replyTo: support,
      to: email,
      subject: "Welcome to Welsh Motorhub",
      text: plainText,
      html: htmlContent,
    });
    return { success: true };
  } catch (error) {
    console.error("Welcome email failed:", error);
    return { success: false, error };
  }
}

export async function sendVerificationEmail(email, name, otp) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.log("✉️ ======================================");
    console.log(`✉️ MOCK EMAIL TO: ${email}`);
    console.log(`✉️ CODE: ${otp}`);
    console.log("✉️ ======================================");
    return { success: true, mocked: true };
  }

  const escapeHtml = (value) =>
    (value || "")
      .toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const firstName = escapeHtml((name || "there").toString().split(" ")[0]);
  const origin = getSiteOrigin();
  const support = getSupportEmail();
  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #1A1A1A;">
      <div style="margin-bottom: 32px; text-align: center;">
        <span style="font-weight: 900; font-size: 22px; letter-spacing: -0.03em; color: #0f172a;">Welsh Motorhub</span>
        <p style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em; color: #64748b; margin-top: 8px;">Verify your email</p>
      </div>
      <h1 style="font-size: 26px; font-weight: 800; margin-bottom: 16px; color: #0f172a;">Hi ${firstName},</h1>
      <p style="font-size: 16px; color: #475569; margin-bottom: 28px; line-height: 1.55;">
        Thanks for joining <strong>Welsh Motorhub</strong> (${origin.replace(/^https?:\/\//, "")}). Enter this code to confirm your email and finish setting up your account.
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

  try {
    await transporter.sendMail({
      from: getMailFromVerification(),
      to: email,
      subject: "Your Welsh Motorhub verification code",
      html: htmlContent,
    });
    return { success: true };
  } catch (error) {
    console.error("Nodemailer failed:", error);
    return { error };
  }
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
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

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

  if (!SMTP_USER || !SMTP_PASS) {
    console.log("LEAD ALERT EMAIL (MOCK):", {
      to: recipients,
      dealerName,
      carTitle,
      buyerName,
      buyerPhone,
      buyerEmail,
      channel,
      leadId,
    });
    return { success: true, mocked: true };
  }

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 28px; color: #111827;">
      <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 800;">New Buyer Enquiry</h1>
      <p style="margin: 0 0 20px; color: #475569; font-size: 14px;">
        A potential buyer has reached out on Welsh Motorhub.
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

      <a href="${getSiteOrigin()}/portal/leads" style="display:inline-block;background:#111111;color:#fff;text-decoration:none;padding:12px 18px;border-radius:0px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Open Leads Dashboard</a>

      <p style="margin-top: 20px; color: #94a3b8; font-size: 12px;">Lead Ref: ${safeLeadId}</p>
      ${buildEmailFooter()}
    </div>
  `;

  try {
    await transporter.sendMail({
      from: getMailFromAlerts(),
      to: recipients.join(","),
      subject: `New Buyer Enquiry - ${carTitle || "Vehicle"}`,
      html: htmlContent,
    });
    return { success: true };
  } catch (error) {
    console.error("Lead alert email failed:", error);
    return { success: false, error };
  }
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
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  if (!SMTP_USER || !SMTP_PASS) {
    console.log("RESET EMAIL (MOCK):", {
      email,
      resetUrl,
    });
    return { success: true, mocked: true };
  }

  const safeName = escapeHtml((name || "there").toString().split(" ")[0]);
  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 30px; color: #0f172a;">
      <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 800;">Reset your password</h1>
      <p style="margin: 0 0 22px; font-size: 15px; color: #475569;">Hi ${safeName}, we received a request to reset your Welsh Motorhub account password.</p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0px; padding: 18px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6;">For your security, this link expires in 30 minutes. If you did not request this reset, you can ignore this email.</p>
      </div>

      <a href="${resetUrl}" style="display:inline-block; background:#111111; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:0px; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em;">Reset Password</a>

      <p style="margin-top: 20px; font-size: 12px; color: #64748b; word-break: break-all;">${resetUrl}</p>
      ${buildEmailFooter()}
    </div>
  `;

  try {
    await transporter.sendMail({
      from: getMailFromNoReply(),
      to: email,
      subject: "Reset your Welsh Motorhub password",
      html: htmlContent,
    });
    return { success: true };
  } catch (error) {
    console.error("Password reset email failed:", error);
    return { success: false, error };
  }
}

export async function sendBetterDealEmail({ userEmail, userName, previousCar, newCar, savings }) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.log("✉️ ======================================");
    console.log(`✉️ BETTER DEAL EMAIL TO: ${userEmail}`);
    console.log(`✉️ Previous: ${previousCar.year} ${previousCar.make} ${previousCar.model}`);
    console.log(`✉️ New: ${newCar.year} ${newCar.make} ${newCar.model}`);
    console.log(`✉️ Savings: KSh ${savings.toLocaleString("en-KE")}`);
    console.log("✉️ ======================================");
    return { success: true };
  }

  const siteUrl = getSiteOrigin();
  const newCarUrl = `${siteUrl}/cars/${newCar.id}`;
  const savingsPercent = ((savings / previousCar.price) * 100).toFixed(1);

  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937;">
      <div style="background: #111111; padding: 32px; border-radius: 0px; color: white; text-align: center;">
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
              <h3 style="margin: 0 0 4px; font-size: 18px; font-weight: 900; color: #111111;">
                ${newCar.year} ${newCar.make} ${newCar.model}
              </h3>
              <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">
                ${newCar.mileage ? `${parseInt(newCar.mileage).toLocaleString()} km • ` : ''}${newCar.location}
              </p>
              <p style="margin: 0; font-size: 20px; font-weight: 900; color: #ff5a2f;">
                KSh ${parseInt(newCar.price).toLocaleString("en-KE")}
              </p>
            </div>
          </div>
        </div>

        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; border-radius: 0px; margin: 24px 0;">
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #047857;">
            💰 Save KSh ${parseInt(savings).toLocaleString("en-KE")} (${savingsPercent}%)
          </p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #059669;">
            compared to the ${previousCar.year} ${previousCar.make}
          </p>
        </div>

        <a href="${newCarUrl}" style="display: inline-block; width: 100%; text-align: center; background: #111111; color: white; padding: 14px 24px; border-radius: 0px; font-size: 14px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; margin: 24px 0; transition: background 0.2s;">
          View This Car
        </a>

        <p style="margin: 24px 0; font-size: 13px; color: #64748b; line-height: 1.6;">
          This deal won't last long. Better deals go fast on Welsh Motorhub!
        </p>
      </div>

      ${buildEmailFooter()}
    </div>
  `;

  try {
    await transporter.sendMail({
      from: getMailFromMarketing(),
      to: userEmail,
      subject: `Better deal: ${newCar.year} ${newCar.make} - Save KSh ${parseInt(savings).toLocaleString("en-KE")}`,
      html: htmlContent,
    });
    return { success: true };
  } catch (error) {
    console.error("Better deal email failed:", error);
    return { success: false, error };
  }
}

export async function sendEngagementFollowUpEmail({ userEmail, userName, carTitle, dealerName }) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.log("✉️ ======================================");
    console.log(`✉️ MOCK ENGAGEMENT EMAIL TO: ${userEmail}`);
    console.log("✉️ ======================================");
    return { success: true };
  }

  const escapeHtml = (value) =>
    (value || "")
      .toString()
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const safeName = escapeHtml((userName || "there").split(" ")[0]);
  const safeCar = escapeHtml(carTitle);
  const safeDealer = escapeHtml(dealerName);

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111111;">
      <div style="background: #111111; padding: 40px; border-radius: 0px; text-align: center;">
        <span style="font-weight: 900; font-size: 24px; text-transform: uppercase; letter-spacing: -0.05em; color: white;">MOTOR<span style="color: #ff5a2f;">SKE</span></span>
      </div>
      <div style="padding: 40px; border: 1px solid #e2e8f0; border-top: none;">
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 900;">Still interested in the ${safeCar}?</h1>
        <p style="margin: 0 0 24px; font-size: 16px; color: #4b5563; line-height: 1.6;">Hi ${safeName},</p>
        <p style="margin: 0 0 24px; font-size: 16px; color: #4b5563; line-height: 1.6;">
          You reached out to <strong>${safeDealer}</strong> a few days ago regarding the <strong>${safeCar}</strong>. 
          Vehicles move incredibly fast on Welsh Motorhub, so we wanted to check in to see if you are still looking to buy or if you've already found your dream car.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${getSiteOrigin()}/cars" style="display: inline-block; background: #ff5a2f; color: white; padding: 16px 32px; border-radius: 0px; font-size: 13px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.1em; transition: background 0.2s;">
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

  try {
    await transporter.sendMail({
      from: getMailFromMarketing(),
      to: userEmail,
      subject: `Still looking for the ${safeCar}?`,
      html: htmlContent,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

export async function sendServiceFeedbackEmail({ userEmail, userName, dealerName }) {
   if (!SMTP_USER || !SMTP_PASS) {
      console.log("✉️ ======================================");
      console.log(`✉️ MOCK FEEDBACK EMAIL TO: ${userEmail}`);
      console.log("✉️ ======================================");
      return { success: true };
   }

  const escapeHtml = (value) =>
    (value || "").toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const safeName = escapeHtml((userName || "there").split(" ")[0]);
  const safeDealer = escapeHtml(dealerName);

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111111;">
      <div style="background: #111111; padding: 40px; border-radius: 0px; text-align: center;">
        <span style="font-weight: 900; font-size: 24px; text-transform: uppercase; letter-spacing: -0.05em; color: white;">MOTOR<span style="color: #ff5a2f;">SKE</span></span>
      </div>
      <div style="padding: 40px; border: 1px solid #e2e8f0; border-top: none;">
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 900;">How was the service?</h1>
        <p style="margin: 0 0 24px; font-size: 16px; color: #4b5563; line-height: 1.6;">Hi ${safeName},</p>
        <p style="margin: 0 0 24px; font-size: 16px; color: #4b5563; line-height: 1.6;">
          You recently contacted <strong>${safeDealer}</strong> through Welsh Motorhub. We carefully vet all our partners to ensure the highest quality experience, and your feedback is vital.
        </p>
        
        <p style="margin: 0 0 24px; font-size: 16px; color: #4b5563; line-height: 1.6;">
          Were they responsive? Was the vehicle exactly as described? Let us know below:
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${getSiteOrigin()}/contact" style="display: inline-block; background: #111111; color: white; padding: 16px 32px; border-radius: 0px; font-size: 13px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.1em; transition: background 0.2s;">
            Leave Feedback
          </a>
        </div>

        ${buildEmailFooter()}
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: getMailFromMarketing(),
      to: userEmail,
      subject: `How was your experience with ${safeDealer}?`,
      html: htmlContent,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
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
  const carUrl = `${siteUrl}/cars/${car.id}`;
  const title = `${car.year} ${car.make} ${car.model}`;
  const similarTitle = similarCar ? `${similarCar.year} ${similarCar.make} ${similarCar.model}` : null;
  const firstName = (userName || "there").split(" ")[0];
  const isPriceDrop = type === "PRICE_DROP";
  const isSimilarListing = type === "SIMILAR_LISTING";
  const dropAmount = isPriceDrop && previousPrice ? Math.max(0, previousPrice - car.price) : 0;

  if (!SMTP_USER || !SMTP_PASS) {
    console.log("WATCH ALERT EMAIL (MOCK):", { userEmail, type, title, previousPrice, current: car.price });
    return { success: true, mocked: true };
  }

  const heading = isPriceDrop
    ? "Price drop on your watchlist car"
    : isSimilarListing
      ? "A similar listing was just posted"
      : "Back in stock";
  const summary = isPriceDrop
    ? `The ${title} dropped by KSh ${dropAmount.toLocaleString("en-KE")}.`
    : isSimilarListing
      ? `We found a similar listing: ${similarTitle}.`
      : `The ${title} is now available again.`;
  const priceBlock = isPriceDrop
    ? `<p style="margin: 0 0 8px;"><strong>Previous:</strong> KSh ${previousPrice.toLocaleString("en-KE")}</p>
       <p style="margin: 0;"><strong>Current:</strong> KSh ${car.price.toLocaleString("en-KE")}</p>`
    : isSimilarListing
      ? `<p style="margin: 0 0 8px;"><strong>Watchlist car:</strong> ${title}</p>
         <p style="margin: 0 0 8px;"><strong>New similar:</strong> ${similarTitle}</p>
         <p style="margin: 0;"><strong>New listing price:</strong> KSh ${(similarCar?.price ?? 0).toLocaleString("en-KE")}</p>`
      : `<p style="margin: 0;"><strong>Current price:</strong> KSh ${car.price.toLocaleString("en-KE")}</p>`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #0f172a;">
      <h1 style="font-size: 24px; margin-bottom: 8px;">${heading}</h1>
      <p style="font-size: 14px; color: #475569; margin-top: 0;">Hi ${firstName}, ${summary}</p>
      <div style="border: 1px solid #e2e8f0; padding: 16px; margin: 18px 0;">
        <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: #64748b; font-weight: 700;">Vehicle</p>
        <p style="margin: 0 0 12px; font-weight: 700;">${title}</p>
        ${priceBlock}
      </div>
      <a href="${isSimilarListing && similarCar?.id ? `${siteUrl}/cars/${similarCar.id}` : carUrl}" style="display:inline-block;background:#111111;color:#fff;text-decoration:none;padding:12px 18px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Open Listing</a>
      ${buildEmailFooter()}
    </div>
  `;

  try {
    await transporter.sendMail({
      from: getMailFromAlerts(),
      to: userEmail,
      subject: isPriceDrop
        ? `Price drop: ${title}`
        : isSimilarListing
          ? `New similar listing: ${similarTitle}`
          : `Back in stock: ${title}`,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Watch alert email failed:", error);
    return { success: false, error };
  }
}
