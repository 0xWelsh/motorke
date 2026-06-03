// src/app/api/cron/admin-daily-report/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendAdminDailyReport } from "@/lib/whatsapp";

/**
 * Vercel Cron Job: Sends a daily summary of Motorke activity to Admins.
 * Recommended frequency: Daily at 8:00 PM EAT
 */
export async function GET(request) {
  // Simple header check for Vercel Cron security
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [newCars, totalLeads, adminUsers] = await Promise.all([
      db.car.count({ where: { createdAt: { gte: today } } }),
      db.lead.count({ where: { createdAt: { gte: today } } }),
      db.user.findMany({
        where: { role: "ADMIN", active: true },
        select: { phone: true }
      })
    ]);

    const stats = {
      date: new Date().toLocaleDateString("en-KE", { dateStyle: "medium" }),
      newCars,
      totalLeads,
      uniqueVisitors: "Data pending GA4 sync", // Placeholder if not tracking sessions in DB
    };

    let sentCount = 0;
    for (const admin of adminUsers) {
      if (admin.phone) {
        await sendAdminDailyReport(admin.phone, stats);
        sentCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      stats, 
      recipients: sentCount 
    });

  } catch (error) {
    console.error("Admin Daily Report Cron Error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
