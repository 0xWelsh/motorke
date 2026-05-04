import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEngagementFollowUpEmail, sendServiceFeedbackEmail } from "@/lib/mail";

export const revalidate = 0; // Disable cache for cron

export async function GET(req) {
  // 1. Verify Vercel Cron Secret
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    
    // Calculate boundaries for 3 days ago ("Still Interested" follow-up)
    const threeDaysAgoStart = new Date(now);
    threeDaysAgoStart.setDate(now.getDate() - 3);
    threeDaysAgoStart.setHours(0, 0, 0, 0);
    
    const threeDaysAgoEnd = new Date(now);
    threeDaysAgoEnd.setDate(now.getDate() - 3);
    threeDaysAgoEnd.setHours(23, 59, 59, 999);

    // Calculate boundaries for 7 days ago ("Service Feedback" follow-up)
    const sevenDaysAgoStart = new Date(now);
    sevenDaysAgoStart.setDate(now.getDate() - 7);
    sevenDaysAgoStart.setHours(0, 0, 0, 0);

    const sevenDaysAgoEnd = new Date(now);
    sevenDaysAgoEnd.setDate(now.getDate() - 7);
    sevenDaysAgoEnd.setHours(23, 59, 59, 999);

    // 2. Fetch leads older than 3 days that are still PENDING
    const pendingLeads = await db.lead.findMany({
      where: {
        status: "PENDING",
        createdAt: {
          gte: threeDaysAgoStart,
          lte: threeDaysAgoEnd,
        },
      },
      include: {
        car: true,
        dealer: true,
      },
    });

    // 3. Fetch leads that were marked RESOLVED exactly 7 days ago
    const resolvedLeads = await db.lead.findMany({
      where: {
        status: "RESOLVED",
        updatedAt: {
          gte: sevenDaysAgoStart,
          lte: sevenDaysAgoEnd,
        },
      },
      include: {
        dealer: true,
      },
    });

    let followUpCount = 0;
    let feedbackCount = 0;

    // 4. Process "Still Interested" emails
    for (const lead of pendingLeads) {
      if (lead.email) {
        try {
          const carTitle = lead.car ? `${lead.car.year} ${lead.car.make} ${lead.car.model}` : "the vehicle you inquired about";
          
          await sendEngagementFollowUpEmail({
            userEmail: lead.email,
            userName: lead.name || "Customer",
            carTitle: carTitle,
            dealerName: lead.dealer?.name || "Welsh Motorhub Dealer"
          });
          
          followUpCount++;
        } catch (err) {
          console.error(`Failed to send follow up to ${lead.email}:`, err);
        }
      }
    }

    // 5. Process "Service Feedback" emails
    for (const lead of resolvedLeads) {
      if (lead.email) {
        try {
          await sendServiceFeedbackEmail({
            userEmail: lead.email,
            userName: lead.name || "Customer",
            dealerName: lead.dealer?.name || "Welsh Motorhub Dealer"
          });
          
          feedbackCount++;
        } catch (err) {
          console.error(`Failed to send feedback to ${lead.email}:`, err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: {
        followUps: followUpCount,
        feedbacks: feedbackCount,
      }
    });

  } catch (error) {
    console.error("Cron Engagements Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
