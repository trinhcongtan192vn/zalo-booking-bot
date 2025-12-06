/**
 * Reminder Job - CRON Job for Booking Reminders
 * Project: Zalo Booking Bot (VC-ZBB-1225)
 * Gate: G6 - CRON Job Reminder
 *
 * Purpose: Send automatic reminders to customers 15 minutes before their booking
 * Execution: Should run every 5 minutes via CRON scheduler
 *
 * Usage:
 * - Local: node jobs/reminder-job.ts
 * - CRON: */5 * * * * node /path/to/jobs/reminder-job.ts
 * - Vercel: Configure in vercel.json crons array
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { and, eq, gte, lte } from "drizzle-orm";
import * as schema from "../src/src/db/schema";

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

// Import Zalo service
const ZALO_API_BASE = "https://openapi.zalo.me/v3.0/oa";

/**
 * Send message via Zalo OA API
 */
async function sendMessage(
  zaloAccessToken: string,
  recipientId: string,
  messageText: string
): Promise<boolean> {
  try {
    const response = await fetch(`${ZALO_API_BASE}/message/cs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": zaloAccessToken,
      },
      body: JSON.stringify({
        recipient: {
          user_id: recipientId,
        },
        message: {
          text: messageText,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error !== 0) {
      console.error("[Reminder Job] Send message failed:", data);
      return false;
    }

    console.log(`[Reminder Job] Reminder sent to user ${recipientId}`);
    return true;
  } catch (error) {
    console.error("[Reminder Job] Error sending message:", error);
    return false;
  }
}

/**
 * Main reminder job function
 */
async function runReminderJob() {
  console.log("===========================================");
  console.log(`[Reminder Job] Starting at ${new Date().toISOString()}`);
  console.log("===========================================");

  try {
    // Calculate time window: 15-20 minutes from now
    const now = new Date();
    const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);
    const twentyMinutesLater = new Date(now.getTime() + 20 * 60 * 1000);

    console.log(`[Reminder Job] Looking for bookings between:`);
    console.log(`  - Start: ${fifteenMinutesLater.toISOString()}`);
    console.log(`  - End:   ${twentyMinutesLater.toISOString()}`);

    // Query bookings that need reminders
    const bookingsNeedingReminder = await db.query.bookings.findMany({
      where: and(
        eq(schema.bookings.status, "confirmed"),
        eq(schema.bookings.isReminded, false),
        gte(schema.bookings.bookingStartTime, fifteenMinutesLater),
        lte(schema.bookings.bookingStartTime, twentyMinutesLater)
      ),
    });

    console.log(`[Reminder Job] Found ${bookingsNeedingReminder.length} bookings to remind`);

    if (bookingsNeedingReminder.length === 0) {
      console.log("[Reminder Job] No bookings to process. Exiting.");
      await pool.end();
      process.exit(0);
    }

    // Process each booking
    let successCount = 0;
    let failCount = 0;

    for (const booking of bookingsNeedingReminder) {
      try {
        console.log(`\n[Reminder Job] Processing booking #${booking.id}`);
        console.log(`  - Customer: ${booking.customerName}`);
        console.log(`  - Zalo ID: ${booking.customerZaloId}`);
        console.log(`  - Time: ${booking.bookingStartTime.toISOString()}`);

        // Get shop configuration
        const shop = await db.query.shops.findFirst({
          where: eq(schema.shops.id, booking.shopId),
        });

        if (!shop) {
          console.error(`[Reminder Job] Shop not found for booking #${booking.id}`);
          failCount++;
          continue;
        }

        // Format booking time
        const bookingTime = booking.bookingStartTime.toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          dateStyle: "short",
          timeStyle: "short",
        });

        // Compose reminder message
        const reminderMessage = `⏰ Nhắc nhở lịch hẹn!\n\nLịch của bạn tại ${shop.shopName} vào ${bookingTime}.\n\nVui lòng đến đúng giờ. Cảm ơn!`;

        // Send reminder via Zalo
        const sent = await sendMessage(
          shop.zaloAccessToken,
          booking.customerZaloId,
          reminderMessage
        );

        if (!sent) {
          console.error(`[Reminder Job] Failed to send reminder for booking #${booking.id}`);
          failCount++;
          continue;
        }

        // Update isReminded flag in database
        await db
          .update(schema.bookings)
          .set({ isReminded: true })
          .where(eq(schema.bookings.id, booking.id));

        console.log(`[Reminder Job] ✅ Reminder sent and marked for booking #${booking.id}`);
        successCount++;

        // Small delay to avoid rate limiting (100ms)
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`[Reminder Job] Error processing booking #${booking.id}:`, error);
        failCount++;
      }
    }

    // Summary
    console.log("\n===========================================");
    console.log(`[Reminder Job] Completed at ${new Date().toISOString()}`);
    console.log(`  - Total processed: ${bookingsNeedingReminder.length}`);
    console.log(`  - Success: ${successCount}`);
    console.log(`  - Failed: ${failCount}`);
    console.log("===========================================");

    // Close database connection
    await pool.end();

    // Exit with appropriate code
    process.exit(failCount > 0 ? 1 : 0);
  } catch (error) {
    console.error("[Reminder Job] Fatal error:", error);
    await pool.end();
    process.exit(1);
  }
}

// Run the job
runReminderJob();
