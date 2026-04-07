// src/lib/mail.js
import { db } from "@/lib/db";
import nodemailer from "nodemailer";

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS?.replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

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
    <div style="font-family: 'Plus Jakarta Sans', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #1A1A1A;">
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
    <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 28px; color: #111827;">
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
