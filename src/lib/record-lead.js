/**
 * Fire-and-forget lead capture for WhatsApp/call taps and other UI surfaces.
 * Never blocks navigation; failures are logged in dev only.
 */
export function recordLeadIntent({
  carId,
  dealerId,
  name,
  phone,
  email,
  message,
  channel = "web",
}) {
  if (!carId || !dealerId) return;

  fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    keepalive: true,
    body: JSON.stringify({
      carId,
      dealerId,
      name: name?.trim() || (channel === "whatsapp" ? "WhatsApp tap" : "Call tap"),
      phone: phone?.trim() || "",
      email: email?.trim() || null,
      message: message?.trim() || null,
      channel,
    }),
  }).catch((error) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("recordLeadIntent failed:", error);
    }
  });
}
