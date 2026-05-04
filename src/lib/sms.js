// src/lib/sms.js
import { db } from "@/lib/db";

// Dummy function to simulate Africa's Talking / Twilio SMS logic
export async function createPhoneOTP(phone) {
  if (!phone) return null;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Delete existing tokens for this phone
  await db.verificationToken.deleteMany({ where: { identifier: phone } });

  await db.verificationToken.create({
    data: { identifier: phone, token: otp, expires },
  });

  return otp;
}

export async function sendSMSVerification(phone, otp) {
  // If no API key configured, dump it to terminal for dev verification
  const API_KEY = process.env.SMS_API_KEY;
  
  if (!API_KEY) {
    console.log("📱 ======================================");
    console.log(`📱 MOCK SMS TO: ${phone}`);
    console.log(`📱 MESSAGE: Your Welsh Motorhub verification code is: ${otp}. Do not share this. Code expires via 15 mins.`);
    console.log("📱 ======================================");
    return { success: true, mocked: true };
  }

  // TODO: Add Africa's Talking or Twilio dispatch logic here once key is supplied.
  console.log("Live SMS Dispatch not completely configured yet for:", phone);
  return { success: true };
}
