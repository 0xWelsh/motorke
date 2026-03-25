// src/lib/mail.js
// Minimalist Resend integration for Motorske Standard
import { db } from "@/lib/db";
import crypto from "crypto";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/** Generate and save a secure verification token */
export async function createVerificationToken(email) {
  const token   = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

  // Delete existing tokens for this email
  await db.verificationToken.deleteMany({ where: { identifier: email } });

  return db.verificationToken.create({
    data: { identifier: email, token, expires },
  });
}

/** Send Verification Email (Resend) */
export async function sendVerificationEmail(email, name, token) {
  const confirmLink = `${DOMAIN}/verify?token=${token}`;

  // If no API key, log the link (great for dev/testing)
  if (!RESEND_API_KEY) {
    console.log("------------------------------------------");
    console.log(`VERIFICATION LINK FOR ${email}:`);
    console.log(confirmLink);
    console.log("------------------------------------------");
    return { success: true, mocked: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Motorske <verify@motorske.ke>",
        to: [email],
        subject: "Verify your Motorske Standard Profile",
        html: `
          <div style="font-family: 'Plus Jakarta Sans', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #1A1A1A;">
            <div style="margin-bottom: 40px; text-align: center;">
              <span style="font-weight: 800; font-size: 24px; text-transform: uppercase; letter-spacing: -0.05em;">Motor<span style="color: #E8490F;">ke</span></span>
              <p style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3em; color: #999; margin-top: 5px;">Standard</p>
            </div>
            <h1 style="font-size: 28px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 20px;">Welcome to the Standard, ${name.split(' ')[0]}.</h1>
            <p style="font-size: 16px; color: #666; line-height: 1.6; margin-bottom: 30px;">
              To protect the integrity of the Motorske marketplace, we require email verification for all active profiles.
            </p>
            <a href="${confirmLink}" style="display: inline-block; background: #1A1A1A; color: #FFFFFF; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Verify My Profile</a>
            <p style="font-size: 12px; color: #999; margin-top: 40px; line-height: 1.6;">
              This link will expire in 1 hour. If you didn't create a Motorske account, you can safely ignore this email.
            </p>
          </div>
        `,
      }),
    });
    return res.json();
  } catch (error) {
    console.error("Email send failed", error);
    return { error };
  }
}
