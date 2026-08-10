// src/lib/whatsapp.js
/**
 * Unified WhatsApp Provider for BIDGARI.
 * Handles dispatching messages to dealers, buyers, and admins.
 * 
 * Future: Point WHATSAPP_GATEWAY_URL to a self-hosted Baileys/VPS server.
 */

export async function sendWhatsAppMessage({ to, message, mediaUrl = null }) {
  const GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL;
  const isMock = !GATEWAY_URL;

  // Normalize phone for WhatsApp (ensure 254... format without +)
  const phone = (to || "").replace(/\D/g, "");

  if (isMock) {
    console.log("🟢 ======================================");
    console.log(`🟢 MOCK WHATSAPP TO: ${phone}`);
    console.log(`🟢 MESSAGE: ${message}`);
    if (mediaUrl) console.log(`🟢 MEDIA: ${mediaUrl}`);
    console.log("🟢 ======================================");
    return { success: true, mocked: true };
  }

  try {
    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: phone,
        message: message,
        media: mediaUrl
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`WhatsApp Gateway Error: ${err}`);
    }

    return { success: true };
  } catch (error) {
    console.error("❌ WhatsApp Dispatch Failed:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send a notification to a Dealer about a new lead.
 */
export async function notifyDealerOfLead(dealerPhone, leadData) {
  const { buyerName, carTitle, leadId } = leadData;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://motorke.co.ke";
  
  const text = 
    `📢 *New Lead on BIDGARI!*\n\n` +
    `👤 *Buyer:* ${buyerName}\n` +
    `🚗 *Vehicle:* ${carTitle}\n\n` +
    `View details in your portal:\n` +
    `${siteUrl}/admin/cars`;

  return sendWhatsAppMessage({ to: dealerPhone, message: text });
}

/**
 * Send a notification to a Buyer about a watchlist update.
 */
export async function notifyBuyerWatchlist(buyerPhone, updateData) {
  const { carTitle, carUrl, updateType, oldPrice, newPrice } = updateData;
  
  let text = `✨ *Update for your Saved Car!*\n\n`;
  
  if (updateType === "PRICE_DROP") {
    text += `💰 *Price Drop:* ${carTitle} is now KES ${newPrice} (was ${oldPrice})!\n\n`;
  } else {
    text += `🔥 *New Match:* A vehicle matching your saved search for "${carTitle}" is now live!\n\n`;
  }

  text += `Check it out here:\n${carUrl}`;

  return sendWhatsAppMessage({ to: buyerPhone, message: text });
}

/**
 * Send a daily report to Admin.
 */
export async function sendAdminDailyReport(adminPhone, stats) {
  const { date, newCars, totalLeads, uniqueVisitors } = stats;
  
  const text = 
    `📊 *Motorke Daily Report - ${date}*\n\n` +
    `🚗 *New Listings:* ${newCars}\n` +
    `📩 *Total Leads:* ${totalLeads}\n` +
    `👥 *Unique Visitors:* ${uniqueVisitors}\n\n` +
    `Have a productive day! 🚀`;

  return sendWhatsAppMessage({ to: adminPhone, message: text });
}
