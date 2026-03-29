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
