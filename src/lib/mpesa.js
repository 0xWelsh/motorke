// src/lib/mpesa.js

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const PASSKEY = process.env.MPESA_PASSKEY;
const SHORTCODE = process.env.MPESA_SHORTCODE || "174379";
const ENV_BASE_URL = process.env.MPESA_ENV === "production" 
  ? "https://api.safaricom.co.ke" 
  : "https://sandbox.safaricom.co.ke";

function getTimestamp() {
  const date = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }));
  const yyyy = date.getFullYear().toString();
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  const hh = date.getHours().toString().padStart(2, "0");
  const min = date.getMinutes().toString().padStart(2, "0");
  const ss = date.getSeconds().toString().padStart(2, "0");
  return yyyy + mm + dd + hh + min + ss;
}

export async function generateToken() {
  const secret = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");
  const url = `${ENV_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${secret}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to generate Daraja token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function initiateSTKPush(phoneNumber, amount, accountReference, transactionDesc) {
  // Format phone: must start with 254
  let formattedPhone = phoneNumber.replace(/[^0-9]/g, "");
  if (formattedPhone.startsWith("0")) formattedPhone = `254${formattedPhone.substring(1)}`;
  if (formattedPhone.startsWith("7") || formattedPhone.startsWith("1")) formattedPhone = `254${formattedPhone}`;

  const token = await generateToken();
  const timestamp = getTimestamp();
  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString("base64");
  
  // Safaricom requires a publicly reachable HTTPS callback URL.
  // In production, set MPESA_CALLBACK_URL to your real domain (e.g. https://welshmotorhub.co.ke/api/webhooks/mpesa)
  // For sandbox testing, we use a placeholder since Safaricom sandbox doesn't actually deliver callbacks.
  const callbackUrl = process.env.MPESA_CALLBACK_URL || "https://mydomain.com/api/webhooks/mpesa";

  const payload = {
    BusinessShortCode: SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount.toString(),
    PartyA: formattedPhone,
    PartyB: SHORTCODE,
    PhoneNumber: formattedPhone,
    CallBackURL: callbackUrl,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };

  const response = await fetch(`${ENV_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const rawData = await response.text();
  let data;
  try {
     data = JSON.parse(rawData);
  } catch (e) {
     throw new Error("Invalid Safaricom response: " + rawData);
  }

  if (data.errorCode) {
    throw new Error(data.errorMessage);
  }

  return data;
}
