// src/lib/mail.js
import { db } from "@/lib/db";
import nodemailer from "nodemailer";
import crypto from "crypto";

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS?.replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

function buildEmailFooter() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://motorke.co.ke";
  return `
    <div style="margin-top: 28px; padding-top: 18px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0 0 6px; font-size: 12px; color: #475569;">Motorke Marketplace</p>
      <p style="margin: 0; font-size: 12px; color: #64748b;">
        <a href="${siteUrl}/terms" style="color: #0f172a; text-decoration: underline;">Terms</a>
        &nbsp;•&nbsp;
        <a href="${siteUrl}/privacy" style="color: #0f172a; text-decoration: underline;">Privacy</a>
        &nbsp;•&nbsp;
        <a href="mailto:support@motorke.com" style="color: #0f172a; text-decoration: underline;">support@motorke.com</a>
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

export async function sendVerificationEmail(email, name, otp) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.log("✉️ ======================================");
    console.log(`✉️ MOCK EMAIL TO: ${email}`);
    console.log(`✉️ CODE: ${otp}`);
    console.log("✉️ ======================================");
    return { success: true, mocked: true };
  }

  const htmlContent = `
    <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #1A1A1A;">
      <div style="margin-bottom: 40px; text-align: center;">
        <span style="font-weight: 800; font-size: 24px; text-transform: uppercase;">Motor<span style="color: #E8490F;">ke</span></span>
        <p style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3em; color: #999; margin-top: 5px;">Standard</p>
      </div>
      <h1 style="font-size: 28px; font-weight: 800; margin-bottom: 20px;">Welcome, ${name.split(' ')[0]}.</h1>
      <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
        Use the following 6-digit confirmation code to verify your email address.
      </p>
      <div style="background: #f4f4f5; padding: 30px; text-align: center; border-radius: 16px; margin-bottom: 30px;">
         <span style="font-size: 42px; font-weight: 900; letter-spacing: 0.25em; color: #E8490F;">${otp}</span>
      </div>
      <p style="font-size: 12px; color: #999; margin-top: 40px;">
        This code expires in 30 minutes. If you did not create a Motorske account, you can safely ignore this.
      </p>
      ${buildEmailFooter()}
    </div>
  `;

  try {
    await transporter.sendMail({
      from: '"Motorske Standard" <noreply@motorske.com>',
      to: email,
      subject: "Your Motorske Verification Code",
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
    <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 28px; color: #111827;">
      <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 800;">New Buyer Enquiry</h1>
      <p style="margin: 0 0 20px; color: #475569; font-size: 14px;">
        A potential buyer has reached out on Motorke.
      </p>

      <div style="border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 14px;">
        <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: .08em; font-weight: 700;">Dealer</p>
        <p style="margin: 0; font-weight: 700;">${safeDealerName}</p>
      </div>

      <div style="border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 14px;">
        <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: .08em; font-weight: 700;">Vehicle</p>
        <p style="margin: 0; font-weight: 700;">${safeCarTitle}</p>
      </div>

      <div style="border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 18px;">
        <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: .08em; font-weight: 700;">Buyer</p>
        <p style="margin: 0 0 6px;"><strong>Name:</strong> ${safeBuyerName}</p>
        <p style="margin: 0 0 6px;"><strong>Phone:</strong> ${safeBuyerPhone}</p>
        <p style="margin: 0 0 6px;"><strong>Email:</strong> ${safeBuyerEmail}</p>
        <p style="margin: 0 0 6px;"><strong>Channel:</strong> ${safeChannel}</p>
        <p style="margin: 10px 0 0;"><strong>Message:</strong> ${safeBuyerMessage}</p>
      </div>

      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://motorke.co.ke"}/portal/leads" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-size:13px;font-weight:700;">Open Leads Dashboard</a>

      <p style="margin-top: 20px; color: #94a3b8; font-size: 12px;">Lead Ref: ${safeLeadId}</p>
      ${buildEmailFooter()}
    </div>
  `;

  try {
    await transporter.sendMail({
      from: '"Motorke Alerts" <noreply@motorke.com>',
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://motorke.co.ke";
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
    <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 30px; color: #0f172a;">
      <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 800;">Reset your password</h1>
      <p style="margin: 0 0 22px; font-size: 15px; color: #475569;">Hi ${safeName}, we received a request to reset your Motorke account password.</p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6;">For your security, this link expires in 30 minutes. If you did not request this reset, you can ignore this email.</p>
      </div>

      <a href="${resetUrl}" style="display:inline-block; background:#0f172a; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:10px; font-size:13px; font-weight:700;">Reset Password</a>

      <p style="margin-top: 20px; font-size: 12px; color: #64748b; word-break: break-all;">${resetUrl}</p>
      ${buildEmailFooter()}
    </div>
  `;

  try {
    await transporter.sendMail({
      from: '"Motorke Security" <noreply@motorke.com>',
      to: email,
      subject: "Reset your Motorke password",
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://motorke.co.ke";
  const newCarUrl = `${siteUrl}/cars/${newCar.id}`;
  const savingsPercent = ((savings / previousCar.price) * 100).toFixed(1);

  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1f2937;">
      <div style="background: linear-gradient(135deg, #111111 0%, #1f2937 100%); padding: 32px; border-radius: 16px; color: white; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 900;">Better Deal Found! 🎯</h1>
        <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">We found something even better for you</p>
      </div>

      <div style="padding: 32px;">
        <p style="margin: 0 0 24px; font-size: 16px;">Hi ${userName},</p>
        
        <p style="margin: 0 0 24px; font-size: 14px; color: #4b5563; line-height: 1.6;">
          You recently viewed the <strong>${previousCar.year} ${previousCar.make} ${previousCar.model}</strong>. 
          We found an even better option that just arrived in our inventory!
        </p>

        <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <div style="display: flex; align-items: center; gap: 16px;">
            ${newCar.primaryImage ? `<img src="${newCar.primaryImage}" alt="${newCar.year} ${newCar.make}" style="width: 100px; height: 75px; object-fit: cover; border-radius: 8px;" />` : ''}
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

        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; margin: 24px 0;">
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #047857;">
            💰 Save KSh ${parseInt(savings).toLocaleString("en-KE")} (${savingsPercent}%)
          </p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #059669;">
            compared to the ${previousCar.year} ${previousCar.make}
          </p>
        </div>

        <a href="${newCarUrl}" style="display: inline-block; width: 100%; text-align: center; background: #111111; color: white; padding: 14px 24px; border-radius: 8px; font-size: 14px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; margin: 24px 0; transition: background 0.2s;">
          View This Car
        </a>

        <p style="margin: 24px 0; font-size: 13px; color: #64748b; line-height: 1.6;">
          This deal won't last long. Better deals go fast on Motorke!
        </p>
      </div>

      ${buildEmailFooter()}
    </div>
  `;

  try {
    await transporter.sendMail({
      from: '"Motorke" <deals@motorke.com>',
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
