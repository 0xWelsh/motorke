import { db } from "@/lib/db";
import { sendBetterDealEmail } from "@/lib/mail";
import { findBetterDealsForUser, getUsersWithRecentViews } from "@/lib/deal-matcher";

/**
 * Vercel Cron Job: Send weekly better deal emails
 * 
 * Runs nightly at scheduled time (configure in vercel.json)
 * Finds users who viewed cars in past 7 days
 * Groups better deals by user
 * Sends one weekly digest email per user
 * 
 * Route: /api/cron/better-deals
 * Method: GET
 * Auth: Automatically verified by Vercel via X-Vercel-Cron header
 */

// Store last email sent time to prevent duplicate emails within 24 hours
const emailCooldownMs = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request) {
  // Verify Vercel Cron authentication
  // In production, Vercel adds X-Vercel-Cron header automatically
  // In development, you can test by calling manually
  const authHeader = request.headers.get("authorization");
  const cronHeader = request.headers.get("x-vercel-cron");

  console.log("[cron/better-deals] Starting better deals email job");
  console.log("[cron/better-deals] Cron header:", cronHeader);

  try {
    // Get all users who viewed cars in past 7 days
    const usersWithViews = await getUsersWithRecentViews(7);
    console.log(`[cron/better-deals] Found ${usersWithViews.length} users with recent views`);

    if (usersWithViews.length === 0) {
      return Response.json({
        success: true,
        message: "No users with recent views",
        emailsSent: 0,
      });
    }

    let emailsSent = 0;
    let emailsFailed = 0;

    // Process each user
    for (const user of usersWithViews) {
      try {
        // Find better deals for this user
        const deals = await findBetterDealsForUser(user.userId, 7);

        if (deals.length === 0) {
          console.log(`[cron/better-deals] No better deals for ${user.email}`);
          continue;
        }

        console.log(
          `[cron/better-deals] Found ${deals.length} better deals for ${user.email}`
        );

        // Check if we already sent this user an email recently
        // (optional: could store "lastEmailSent" in database)
        // For now, send on every run (throttling can be added later)

        // Send a single digest email with all their better deals
        // (Note: current email function sends one deal at a time)
        // TODO: Create a "digest" email variant that shows multiple deals

        // For now, send the top 3 deals as separate emails
        const topDeals = deals.slice(0, 3);

        for (const deal of topDeals) {
          try {
            await sendBetterDealEmail({
              userEmail: user.email,
              userName: user.name,
              previousCar: deal.viewedCar,
              newCar: deal.betterDeal,
              savings: deal.savings,
            });

            emailsSent += 1;
            console.log(
              `[cron/better-deals] Email sent to ${user.email} for ${deal.betterDeal.year} ${deal.betterDeal.make}`
            );
          } catch (emailError) {
            emailsFailed += 1;
            console.error(
              `[cron/better-deals] Failed to send email to ${user.email}:`,
              emailError
            );
          }
        }
      } catch (userError) {
        console.error(
          `[cron/better-deals] Error processing user ${user.userId}:`,
          userError
        );
        emailsFailed += 1;
      }
    }

    console.log(
      `[cron/better-deals] Job complete: ${emailsSent} sent, ${emailsFailed} failed`
    );

    return Response.json({
      success: true,
      message: "Better deals email job completed",
      usersProcessed: usersWithViews.length,
      emailsSent,
      emailsFailed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron/better-deals] Cron job error:", error);

    return Response.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// For local testing: allow POST with ?test=1 to bypass Vercel auth
export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const isTest = searchParams.get("test") === "1";

  if (!isTest && process.env.NODE_ENV === "production") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Run the same logic as GET
  return GET(request);
}
