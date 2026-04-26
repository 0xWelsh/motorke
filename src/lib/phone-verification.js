export function normalizeKenyanPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.length === 9 && /^(7|1)/.test(digits)) return `254${digits}`;
  return "";
}

export function isValidKenyanPhone(value) {
  return /^254(7\d{8}|1\d{8})$/.test(String(value || ""));
}

export async function sendOtpSms({ phone, code }) {
  // Optional integration hook. If provider env vars are missing, we run in mock mode.
  const provider = process.env.SMS_PROVIDER;
  if (!provider || provider !== "africastalking") {
    console.log("[phone-otp][mock]", { phone, code });
    return { success: true, mocked: true };
  }

  const username = process.env.AFRICASTALKING_USERNAME;
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const from = process.env.AFRICASTALKING_SENDER_ID || "";
  if (!username || !apiKey) {
    throw new Error("AfricasTalking credentials are missing");
  }

  const message = `Your Welsh Motors verification code is ${code}. It expires in 10 minutes.`;
  const form = new URLSearchParams();
  form.set("username", username);
  form.set("to", `+${phone}`);
  form.set("message", message);
  if (from) form.set("from", from);

  const response = await fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: {
      apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: form.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SMS provider failed: ${text}`);
  }
  return { success: true };
}
